import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConflictException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { ChatbotService } from '../src/modules/chatbot/chatbot.service';
import { MarketInsightService } from '../src/modules/market-insights/market-insights.service';
import { ScrapedJobService } from '../src/modules/scraped-jobs/scraped-jobs.service';

function makeQuery<T>(value: T) {
  const chain = {
    select: () => chain,
    sort: () => chain,
    skip: () => chain,
    limit: () => chain,
    lean: () => chain,
    exec: async () => value,
  };
  return chain;
}

describe('Phase 4 Chatbot, ScrapedJobs & MarketInsights', () => {
  it('ChatbotService forwards to Flask when online and falls back to SearchService when offline', async () => {
    const cfg = { get: () => 'http://localhost:8000' };
    const searchService = {
      searchJobs: async () => ({
        items: [{ _id: 'j1', title: 'NestJS Backend', skills: ['NestJS'] }],
      }),
    };

    const httpSuccess = {
      post: () =>
        of({
          data: {
            reply: 'Tìm thấy 1 việc làm NestJS',
            filters: { skills: ['NestJS'] },
            jobs: [{ _id: 'j1', title: 'NestJS Backend' }],
          },
        }),
    };
    const onlineService = new ChatbotService(
      httpSuccess as never,
      cfg as never,
      searchService as never,
    );
    const onlineRes = await onlineService.chat('Tìm việc NestJS');
    assert.equal(onlineRes.mode, 'flask-llm');
    assert.equal(onlineRes.jobs.length, 1);

    const httpOffline = {
      post: () => throwError(() => new Error('ECONNREFUSED')),
    };
    const fallbackService = new ChatbotService(
      httpOffline as never,
      cfg as never,
      searchService as never,
    );
    const fallbackRes = await fallbackService.chat('Tìm việc NestJS');
    assert.equal(fallbackRes.mode, 'backend-fallback');
    assert.equal(fallbackRes.jobs.length, 1);
  });

  it('ScrapedJobService prevents duplicate sourceUrl', async () => {
    let existing: Record<string, unknown> | null = null;
    const model = {
      findOne: () => makeQuery(existing),
      create: async (data: Record<string, unknown>) => ({ _id: 's1', ...data }),
    };
    const service = new ScrapedJobService(model as never);

    const created = await service.create({
      source: 'example.com',
      sourceUrl: 'https://example.com/job/1',
      title: 'Backend Dev',
    });
    assert.equal(created.sourceUrl, 'https://example.com/job/1');

    existing = { _id: 's1', sourceUrl: 'https://example.com/job/1' };
    await assert.rejects(
      () =>
        service.create({
          sourceUrl: 'https://example.com/job/1',
          title: 'Duplicate',
        }),
      ConflictException,
    );
  });

  it('MarketInsightService returns stored snapshots and recalculates from scraped jobs', async () => {
    const upserted: Array<{ type: string; period: string }> = [];
    const insightModel = {
      findOne: () => makeQuery(null),
      findOneAndUpdate: async (filter: { type: string; period: string }) => {
        upserted.push(filter);
        return { ...filter };
      },
    };
    const scrapedModel = {
      countDocuments: async () => 2,
      aggregate: async (pipeline: Array<Record<string, unknown>>) => {
        const first = JSON.stringify(pipeline);
        if (first.includes('$unwind')) return [{ _id: 'TypeScript', count: 2 }];
        if (first.includes('$dateToString')) return [{ _id: '2026-11-23', count: 2 }];
        return [
          {
            _id: 'IT',
            avgMin: 15000000,
            avgMax: 25000000,
            minValues: [10000000, 14000000, 21000000],
            maxValues: [20000000, 24000000, 31000000],
            count: 3,
          },
        ];
      },
    };
    const jobModel = { countDocuments: async () => 0, aggregate: async () => [] };

    const service = new MarketInsightService(
      insightModel as never,
      scrapedModel as never,
      jobModel as never,
    );

    const overview = await service.getOverview();
    assert.equal(overview.source, 'scraped_jobs');
    assert.equal(overview.salaryByCategory.length, 1);
    assert.equal(overview.salaryByCategory[0].medianMin, 14000000);
    assert.equal(overview.salaryByCategory[0].medianMax, 24000000);
    assert.equal(overview.hotSkills[0]._id, 'TypeScript');

    const recalc = await service.recalculate();
    assert.equal(recalc.source, 'scraped_jobs');
    assert.equal(upserted.length, 3);
  });
});
