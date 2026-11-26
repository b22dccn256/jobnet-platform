import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Client } from '@elastic/elasticsearch';
import { Connection, Types } from 'mongoose';
import { JobStatus } from '../../common/enums/job-status.enum';
import { escapeRegex } from '../../common/utils/string.util';
import { SearchJobsDto } from './dto/search.dto';

interface IndexedJobPayload {
  _id?: unknown;
  id?: string;
  title?: string;
  description?: string;
  requirements?: string;
  skills?: string[];
  location?: string;
  workMode?: string;
  level?: string;
  salaryMin?: number;
  salaryMax?: number;
  status?: string;
  deadline?: Date | string | null;
  createdAt?: Date | string;
  company?: { _id?: unknown; name?: string; logo?: string } | unknown;
  category?: { _id?: unknown; name?: string; slug?: string } | unknown;
}

function formatErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return String(error || 'unknown error');
  const err = error as { message?: string; code?: string; errors?: unknown[] };
  if (err.message) return err.message;
  if (err.code) return err.code;
  if (Array.isArray(err.errors) && err.errors.length > 0) {
    return err.errors
      .map((inner) => {
        const item = inner as { message?: string; code?: string } | undefined;
        return item?.message || item?.code || String(inner);
      })
      .filter(Boolean)
      .join('; ');
  }
  return String(error);
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private readonly index = 'jobs';
  private client: Client;
  private esAvailable = false;
  private lastEsCheckAt = 0;
  private readonly esRetryCooldownMs = 60_000;

  constructor(
    cfg: ConfigService,
    @InjectConnection() private readonly connection: Connection,
  ) {
    this.client = new Client({
      node: cfg.get<string>('ELASTICSEARCH_NODE') || 'http://localhost:9200',
      requestTimeout: 1500,
      maxRetries: 0,
    });
  }

  async onModuleInit() {
    this.lastEsCheckAt = Date.now();
    try {
      await this.ensureIndex();
    } catch (error) {
      this.esAvailable = false;
      this.logger.warn(
        `Elasticsearch unavailable (${formatErrorMessage(error)}). Search will fallback to MongoDB.`,
      );
    }
  }

  private async ensureEsReady(context: string): Promise<boolean> {
    if (this.esAvailable) return true;
    const now = Date.now();
    if (now - this.lastEsCheckAt < this.esRetryCooldownMs) {
      return false;
    }
    this.lastEsCheckAt = now;
    try {
      await this.ensureIndex();
      return true;
    } catch (error) {
      this.esAvailable = false;
      this.logger.warn(
        `Elasticsearch ${context} fallback to MongoDB: ${formatErrorMessage(error)}`,
      );
      return false;
    }
  }

  async ensureIndex() {
    const exists = await this.client.indices.exists({ index: this.index });
    if (!exists) {
      await this.client.indices.create({
        index: this.index,
        settings: {
          analysis: {
            char_filter: {
              vn_d_filter: {
                type: 'mapping',
                mappings: ['đ => d', 'Đ => d'],
              },
            },
            analyzer: {
              vn_folding: {
                type: 'custom',
                char_filter: ['vn_d_filter'],
                tokenizer: 'standard',
                filter: ['lowercase', 'asciifolding'],
              },
            },
          },
        },
        mappings: {
          properties: {
            title: { type: 'text', analyzer: 'vn_folding', fields: { keyword: { type: 'keyword' } } },
            description: { type: 'text', analyzer: 'vn_folding' },
            requirements: { type: 'text', analyzer: 'vn_folding' },
            skills: { type: 'text', analyzer: 'vn_folding', fields: { keyword: { type: 'keyword' } } },
            location: { type: 'text', analyzer: 'vn_folding', fields: { keyword: { type: 'keyword' } } },
            workMode: { type: 'keyword' },
            level: { type: 'keyword' },
            categoryId: { type: 'keyword' },
            categoryName: { type: 'text', analyzer: 'vn_folding' },
            companyId: { type: 'keyword' },
            companyName: { type: 'text', analyzer: 'vn_folding', fields: { keyword: { type: 'keyword' } } },
            companyLogo: { type: 'keyword', index: false },
            salaryMin: { type: 'integer' },
            salaryMax: { type: 'integer' },
            status: { type: 'keyword' },
            deadline: { type: 'date' },
            createdAt: { type: 'date' },
          },
        },
      });
      this.logger.log(`Created Elasticsearch index "${this.index}"`);
    }
    this.esAvailable = true;
    await this.syncIfIndexEmpty();
  }

  private async syncIfIndexEmpty() {
    try {
      const countRes = await this.client.count({ index: this.index });
      if (countRes.count === 0) {
        const res = await this.syncApprovedFromMongo();
        if (res.indexed > 0) {
          this.logger.log(
            `Auto-synced ${res.indexed} approved jobs from MongoDB into Elasticsearch`,
          );
        }
      }
    } catch {
      // Ignore auto-sync errors during startup check
    }
  }

  private async syncApprovedFromMongo() {
    const docs = await this.connection
      .collection('jobs')
      .find({ status: JobStatus.Approved })
      .toArray();
    if (docs.length === 0) return { indexed: 0 };

    const companyIds = Array.from(
      new Set(
        docs
          .map((item) => item.company)
          .filter((c): c is Types.ObjectId => c instanceof Types.ObjectId),
      ),
    );
    let companyMap = new Map<string, { _id: Types.ObjectId; name?: string; logo?: string }>();
    if (companyIds.length > 0) {
      const companies = await this.connection
        .collection('companies')
        .find({ _id: { $in: companyIds } })
        .project<{ _id: Types.ObjectId; name?: string; logo?: string }>({ name: 1, logo: 1 })
        .toArray();
      companyMap = new Map(companies.map((c) => [String(c._id), c]));
    }

    for (const job of docs) {
      const comp =
        job.company instanceof Types.ObjectId ? companyMap.get(String(job.company)) : null;
      const enriched = comp ? { ...job, company: comp } : job;
      await this.client.index({
        index: this.index,
        id: String(job._id),
        document: this.toEsDocument(enriched),
        refresh: true,
      });
    }
    return { indexed: docs.length };
  }

  private toEsDocument(job: IndexedJobPayload) {
    const companyObj =
      job.company && typeof job.company === 'object' && 'name' in job.company
        ? (job.company as { _id?: unknown; name?: string; logo?: string })
        : null;
    const categoryObj =
      job.category && typeof job.category === 'object' && 'name' in job.category
        ? (job.category as { _id?: unknown; name?: string })
        : null;

    return {
      title: job.title || '',
      description: job.description || '',
      requirements: job.requirements || '',
      skills: job.skills || [],
      location: job.location || '',
      workMode: job.workMode || 'onsite',
      level: job.level || 'junior',
      categoryId: categoryObj?._id
        ? String(categoryObj._id)
        : job.category
          ? String(job.category)
          : undefined,
      categoryName: categoryObj?.name || '',
      companyId: companyObj?._id
        ? String(companyObj._id)
        : job.company
          ? String(job.company)
          : undefined,
      companyName: companyObj?.name || '',
      companyLogo: companyObj?.logo || '',
      salaryMin: job.salaryMin ?? null,
      salaryMax: job.salaryMax ?? null,
      status: job.status || JobStatus.Approved,
      deadline: job.deadline || null,
      createdAt: job.createdAt || new Date(),
    };
  }

  async indexJob(job: IndexedJobPayload) {
    const id = String(job._id || job.id || '');
    if (!id) return;
    if (!(await this.ensureEsReady('index'))) return;
    try {
      await this.client.index({
        index: this.index,
        id,
        document: this.toEsDocument(job),
        refresh: true,
      });
    } catch (error) {
      this.esAvailable = false;
      this.lastEsCheckAt = Date.now();
      throw error;
    }
  }

  async removeJob(id: string) {
    if (!id) return;
    if (!(await this.ensureEsReady('remove'))) return;
    try {
      await this.client.delete({ index: this.index, id }).catch((err: { meta?: { statusCode?: number } }) => {
        if (err?.meta?.statusCode !== 404) throw err;
      });
    } catch (error) {
      this.esAvailable = false;
      this.lastEsCheckAt = Date.now();
      throw error;
    }
  }

  async reindexAllApproved() {
    await this.ensureIndex();
    return this.syncApprovedFromMongo();
  }

  async searchJobs(q: string, filters: SearchJobsDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    if (!(await this.ensureEsReady('search'))) {
      return this.searchFallbackMongo(q, filters);
    }

    try {
      const must: Record<string, unknown>[] = [];
      const filterClauses: Record<string, unknown>[] = [{ term: { status: JobStatus.Approved } }];

      if (q?.trim()) {
        must.push({
          multi_match: {
            query: q.trim(),
            fields: ['title^3', 'skills^2', 'companyName^1.5', 'location', 'description', 'requirements'],
            fuzziness: 'AUTO',
          },
        });
      }
      if (filters.location?.trim()) {
        filterClauses.push({ match: { location: filters.location.trim() } });
      }
      if (filters.workMode) {
        filterClauses.push({ term: { workMode: filters.workMode } });
      }
      if (filters.level) {
        filterClauses.push({ term: { level: filters.level } });
      }
      if (filters.category) {
        filterClauses.push({ term: { categoryId: filters.category } });
      }
      if (filters.skills?.trim()) {
        const skills = filters.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        for (const skill of skills) {
          filterClauses.push({ match: { skills: skill } });
        }
      }
      if (filters.salaryMin !== undefined) {
        filterClauses.push({ range: { salaryMax: { gte: filters.salaryMin } } });
      }
      if (filters.salaryMax !== undefined) {
        filterClauses.push({ range: { salaryMin: { lte: filters.salaryMax } } });
      }

      const result = await this.client.search<Record<string, unknown>>({
        index: this.index,
        from: (page - 1) * limit,
        size: limit,
        query: {
          bool: {
            must: must.length ? must : [{ match_all: {} }],
            filter: filterClauses,
          },
        },
        sort: q?.trim() ? ['_score', { createdAt: 'desc' }] : [{ createdAt: 'desc' }],
      });

      const totalRaw = result.hits.total;
      const total = typeof totalRaw === 'number' ? totalRaw : totalRaw?.value || 0;
      const items = result.hits.hits.map((hit) => ({
        _id: hit._id,
        score: hit._score,
        ...hit._source,
      }));

      return { q, items, total, page, limit, engine: 'elasticsearch' };
    } catch (error) {
      this.esAvailable = false;
      this.lastEsCheckAt = Date.now();
      this.logger.warn(`Elasticsearch search fallback to MongoDB: ${formatErrorMessage(error)}`);
      return this.searchFallbackMongo(q, filters);
    }
  }

  private async searchFallbackMongo(q: string, filters: SearchJobsDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const andConditions: Record<string, unknown>[] = [{ status: JobStatus.Approved }];

    if (q?.trim()) {
      const regex = new RegExp(escapeRegex(q.trim()), 'i');
      andConditions.push({
        $or: [{ title: regex }, { skills: regex }, { location: regex }, { description: regex }],
      });
    }
    if (filters.location?.trim()) {
      andConditions.push({ location: new RegExp(escapeRegex(filters.location.trim()), 'i') });
    }
    if (filters.workMode) andConditions.push({ workMode: filters.workMode });
    if (filters.level) andConditions.push({ level: filters.level });
    if (filters.category && Types.ObjectId.isValid(filters.category)) {
      andConditions.push({ category: new Types.ObjectId(filters.category) });
    }
    if (filters.skills?.trim()) {
      const skillRegexes = filters.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => new RegExp(`^${escapeRegex(s)}$`, 'i'));
      if (skillRegexes.length > 0) andConditions.push({ skills: { $in: skillRegexes } });
    }
    if (filters.salaryMin !== undefined) {
      andConditions.push({ salaryMax: { $gte: filters.salaryMin } });
    }
    if (filters.salaryMax !== undefined) {
      andConditions.push({ salaryMin: { $lte: filters.salaryMax } });
    }

    const col = this.connection.collection('jobs');
    const mongoFilter = { $and: andConditions };
    const [rawItems, total] = await Promise.all([
      col.find(mongoFilter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
      col.countDocuments(mongoFilter),
    ]);

    const companyIds = Array.from(
      new Set(
        rawItems
          .map((item) => item.company)
          .filter((c): c is Types.ObjectId => c instanceof Types.ObjectId),
      ),
    );
    let companyMap = new Map<string, { _id: Types.ObjectId; name?: string; logo?: string }>();
    if (companyIds.length > 0) {
      const companies = await this.connection
        .collection('companies')
        .find({ _id: { $in: companyIds } })
        .project<{ _id: Types.ObjectId; name?: string; logo?: string }>({ name: 1, logo: 1 })
        .toArray();
      companyMap = new Map(companies.map((c) => [String(c._id), c]));
    }

    const items = rawItems.map((item) => {
      const comp = item.company instanceof Types.ObjectId ? companyMap.get(String(item.company)) : null;
      return comp ? { ...item, company: comp, companyName: comp.name || '', companyLogo: comp.logo || '' } : item;
    });

    return { q, items, total, page, limit, engine: 'mongodb-fallback' };
  }

  private async suggestFallbackMongo(
    clean: string,
  ): Promise<{ prefix: string; suggestions: string[]; engine: string }> {
    const regex = new RegExp(escapeRegex(clean), 'i');
    const docs = await this.connection
      .collection('jobs')
      .find({ status: JobStatus.Approved, $or: [{ title: regex }, { skills: regex }] })
      .project<{ title?: string; skills?: string[] }>({ title: 1, skills: 1 })
      .limit(8)
      .toArray();
    const suggestions = new Set<string>();
    for (const doc of docs) {
      if (doc.title && regex.test(doc.title)) suggestions.add(doc.title);
      for (const skill of doc.skills || []) {
        if (regex.test(skill)) suggestions.add(skill);
      }
    }
    return {
      prefix: clean,
      suggestions: Array.from(suggestions).slice(0, 8),
      engine: 'mongodb-fallback',
    };
  }

  async suggest(prefix: string): Promise<{ prefix: string; suggestions: string[]; engine: string }> {
    const clean = (prefix || '').trim();
    if (!clean) {
      return {
        prefix: '',
        suggestions: [],
        engine: this.esAvailable ? 'elasticsearch' : 'mongodb-fallback',
      };
    }

    if (!(await this.ensureEsReady('suggest'))) {
      return this.suggestFallbackMongo(clean);
    }

    try {
      const result = await this.client.search<{ title?: string; skills?: string[] }>({
        index: this.index,
        size: 8,
        _source: ['title', 'skills'],
        query: {
          bool: {
            filter: [{ term: { status: JobStatus.Approved } }],
            should: [
              { match_phrase_prefix: { title: clean } },
              { match_phrase_prefix: { skills: clean } },
            ],
            minimum_should_match: 1,
          },
        },
      });

      const suggestions = new Set<string>();
      for (const hit of result.hits.hits) {
        if (hit._source?.title) suggestions.add(hit._source.title);
        for (const skill of hit._source?.skills || []) {
          if (skill.toLowerCase().includes(clean.toLowerCase())) suggestions.add(skill);
        }
      }
      return {
        prefix: clean,
        suggestions: Array.from(suggestions).slice(0, 8),
        engine: 'elasticsearch',
      };
    } catch {
      this.esAvailable = false;
      this.lastEsCheckAt = Date.now();
      return this.suggestFallbackMongo(clean);
    }
  }
}
