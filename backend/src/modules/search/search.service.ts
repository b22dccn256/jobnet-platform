import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class SearchService {

  private readonly index = 'jobs';
  private client: Client;

  constructor(cfg: ConfigService) {
    this.client = new Client({ node: cfg.get('ELASTICSEARCH_NODE') || 'http://localhost:9200' });
  }

  /** TODO (Hà): tạo index với mapping (title, skills, location, salary...) khi khởi động */
  async ensureIndex() {}

  /** TODO (Hà): gọi khi job được Admin duyệt (status = approved) */
  async indexJob(_job: any) {}

  /** TODO (Hà): xóa khỏi index khi job bị đóng/xóa */
  async removeJob(_id: string) {}

  async searchJobs(q: string, _filters: Record<string, any> = {}) {
    // TODO (Hà): multi_match + filter theo skills, location, lương, level
    return { q, items: [] };
  }

  async suggest(prefix: string) {
    // TODO (Hà): completion / match_phrase_prefix
    return { prefix, suggestions: [] };
  }

}
