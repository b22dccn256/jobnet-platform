import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, it } from 'node:test';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { Role } from '../src/common/enums/role.enum';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { PaymentService } from '../src/modules/payments/payments.service';
import { RecommendationService } from '../src/modules/recommendation/recommendation.service';
import { SearchService } from '../src/modules/search/search.service';
import { StorageService } from '../src/modules/storage/storage.service';

function makeQuery<T>(value: T) {
  const chain = {
    select: () => chain,
    sort: () => chain,
    skip: () => chain,
    limit: () => chain,
    populate: () => chain,
    lean: () => chain,
    exec: async () => value,
  };
  return chain;
}

describe('Phase 3 Storage & Search', () => {
  it('StorageService validates file type/size, blocks traversal, and uploads via local fallback', async () => {
    const cfg = {
      get: (k: string) =>
        ({
          MINIO_BUCKET: 'jobnet',
          MINIO_ENDPOINT: '127.0.0.1',
          MINIO_PORT: '9000',
          PORT: '4000',
        })[k],
    };
    const service = new StorageService(cfg as never);

    await assert.rejects(() => service.upload(undefined, 'cv'), BadRequestException);
    await assert.rejects(
      () =>
        service.upload(
          {
            originalname: 'malware.exe',
            mimetype: 'application/x-msdownload',
            size: 100,
            buffer: Buffer.from('x'),
          } as Express.Multer.File,
          'cv',
        ),
      BadRequestException,
    );
    await assert.rejects(
      () =>
        service.upload(
          {
            originalname: 'big.pdf',
            mimetype: 'application/pdf',
            size: 6 * 1024 * 1024,
            buffer: Buffer.from('x'),
          } as Express.Multer.File,
          'cv',
        ),
      BadRequestException,
    );
    await assert.rejects(() => service.getUrl('../../etc/passwd'), BadRequestException);

    const res = await service.upload(
      {
        originalname: 'My CV 2026.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('%PDF-1.4 test'),
      } as Express.Multer.File,
      'cv',
    );
    assert.equal(res.storage, 'local');
    assert.ok(res.key.startsWith('cv/'));
    assert.ok(res.key.endsWith('.pdf'));

    const loaded = await service.getFileBuffer(res.key);
    assert.equal(loaded.buffer.toString(), '%PDF-1.4 test');

    const localPath = path.resolve(process.cwd(), 'uploads', res.key);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  });

  it('SearchService falls back cleanly to MongoDB when Elasticsearch is offline', async () => {
    const fakeJobs = [{ _id: 'j1', title: 'NestJS Backend Developer', skills: ['NestJS'] }];
    const cursor = {
      sort: () => cursor,
      skip: () => cursor,
      limit: () => cursor,
      project: () => cursor,
      toArray: async () => fakeJobs,
    };
    const connection = {
      collection: () => ({
        find: () => cursor,
        countDocuments: async () => 1,
      }),
    };
    const cfg = { get: () => 'http://127.0.0.1:19200' };
    const service = new SearchService(cfg as never, connection as never);

    (service as unknown as { client: unknown }).client = {
      indices: {
        exists: async () => {
          throw new Error('ECONNREFUSED');
        },
      },
      search: async () => {
        throw new Error('ECONNREFUSED');
      },
    };

    const result = await service.searchJobs('NestJS', { page: 1, limit: 10 });
    assert.equal(result.engine, 'mongodb-fallback');
    assert.equal(result.total, 1);
    assert.equal(result.items.length, 1);

    const suggest = await service.suggest('Nest');
    assert.equal(suggest.engine, 'mongodb-fallback');
    assert.ok(suggest.suggestions.includes('NestJS'));
  });
});

describe('Phase 3 VNPay Payments', () => {
  it('supports dev mock payment URL creation and idempotent order activation', async () => {
    const orderState = {
      _id: 'ord1',
      company: 'comp1',
      package: 'pkg1',
      paymentRef: '',
      paymentStatus: 'pending',
    };
    const pkgDoc = { _id: 'pkg1', name: 'SME Pro', price: 699000, durationDays: 30, postLimit: 15 };

    const cfg = { get: () => '' };
    const companyService = { findOptionalByUser: async () => ({ _id: 'comp1' }) };
    const packageService = { findOne: async () => pkgDoc };
    const recruiterPremiumService = {
      createPendingOrder: async (_cid: string, _pid: string, ref: string) => {
        orderState.paymentRef = ref;
        return orderState;
      },
      findByPaymentRef: async (ref: string) => (ref === orderState.paymentRef ? orderState : null),
      activateOrder: async () => {
        orderState.paymentStatus = 'success';
        return orderState;
      },
      markFailed: async () => {
        orderState.paymentStatus = 'failed';
        return orderState;
      },
    };

    const service = new PaymentService(
      cfg as never,
      companyService as never,
      packageService as never,
      recruiterPremiumService as never,
    );

    const created = await service.createVnpayUrl('user1', 'pkg1', '127.0.0.1');
    assert.equal(created.mode, 'mock');
    assert.ok(created.paymentUrl.includes('vnp_SecureHash=MOCK_VALID'));

    const returned = await service.handleVnpayReturn({
      vnp_TxnRef: created.paymentRef,
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
      vnp_SecureHash: 'MOCK_VALID',
    });
    assert.equal(returned.success, true);
    assert.equal(orderState.paymentStatus, 'success');

    const repeated = await service.handleVnpayReturn({
      vnp_TxnRef: created.paymentRef,
      vnp_ResponseCode: '00',
      vnp_SecureHash: 'MOCK_VALID',
    });
    assert.equal(repeated.alreadyProcessed, true);
  });

  it('verifies HMAC-SHA512 signatures strictly when VNPAY_HASH_SECRET is configured', async () => {
    const secret = 'TEST_VNPAY_SECRET_KEY';
    const orderState = { _id: 'ord2', package: 'pkg1', paymentRef: 'TXN123', paymentStatus: 'pending' };
    const cfg = {
      get: (k: string) =>
        ({
          VNPAY_TMN_CODE: 'TMN01',
          VNPAY_HASH_SECRET: secret,
        })[k],
    };
    const recruiterPremiumService = {
      findByPaymentRef: async () => orderState,
      markFailed: async () => ({ ...orderState, paymentStatus: 'failed' }),
    };

    const service = new PaymentService(
      cfg as never,
      {} as never,
      {} as never,
      recruiterPremiumService as never,
    );

    const params = {
      vnp_TxnRef: 'TXN123',
      vnp_Amount: '69900000',
      vnp_ResponseCode: '24',
    };
    const { secureHash } = service.signParams(params, secret);

    await assert.rejects(
      () => service.handleVnpayReturn({ ...params, vnp_SecureHash: 'tampered_hash' }),
      BadRequestException,
    );

    const cancelled = await service.handleVnpayReturn({ ...params, vnp_SecureHash: secureHash });
    assert.equal(cancelled.success, false);
    assert.equal(cancelled.order?.paymentStatus, 'failed');
  });
});

describe('Phase 3 Recommendation & Notifications', () => {
  it('scores candidate suitability out of 105 and enforces Premium access for employers', async () => {
    const employerId = new Types.ObjectId().toString();
    const jobDoc = {
      _id: 'job1',
      title: 'Backend NestJS Developer',
      requirements: 'TypeScript, NestJS, MongoDB',
      skills: ['TypeScript', 'NestJS', 'MongoDB'],
      location: 'Hà Nội',
      workMode: 'hybrid',
      level: 'junior',
      education: 'Đại học',
      salaryMin: 15000000,
      salaryMax: 25000000,
      company: { _id: new Types.ObjectId(), user: employerId, name: 'SME Corp' },
    };

    let activeSub: Record<string, unknown> | null = null;
    const jobModel = { findById: () => makeQuery(jobDoc) };
    const emptyModel = { find: () => makeQuery([]) };
    const recruiterPremiumService = { findActiveByCompany: async () => activeSub };

    const service = new RecommendationService(
      jobModel as never,
      emptyModel as never,
      emptyModel as never,
      emptyModel as never,
      emptyModel as never,
      emptyModel as never,
      emptyModel as never,
      recruiterPremiumService as never,
    );

    const strongScore = service.scoreCandidateForJob(jobDoc, {
      user: {
        _id: 'c1',
        email: 'strong@test.local',
        fullName: 'Strong Candidate',
        phone: '0912345678',
        bio: 'NestJS backend dev',
        skills: ['TypeScript', 'NestJS', 'MongoDB'],
        desiredTitle: 'Backend NestJS Developer',
        desiredLevel: 'junior',
        desiredSalaryMin: 18000000,
        desiredLocation: 'Hà Nội',
      },
      educations: [{ school: 'PTIT', major: 'CNTT', degree: 'Kỹ sư Đại học' }],
      workExperiences: [
        {
          position: 'Backend NestJS Developer',
          company: 'Tech A',
          startDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
          description: 'NestJS API with MongoDB',
        },
      ],
      projects: [{ name: 'JobNet', technologies: ['NestJS', 'MongoDB'] }],
      coursesCount: 1,
      languagesCount: 1,
    });

    const weakScore = service.scoreCandidateForJob(jobDoc, {
      user: {
        _id: 'c2',
        email: 'weak@test.local',
        skills: ['Photoshop'],
        desiredTitle: 'Graphic Designer',
        desiredLevel: 'intern',
        desiredSalaryMin: 50000000,
        desiredLocation: 'Cần Thơ',
      },
      educations: [],
      workExperiences: [],
      projects: [],
      coursesCount: 0,
      languagesCount: 0,
    });

    assert.ok(strongScore.totalScore <= 105);
    assert.ok(strongScore.percent >= 85);
    assert.equal(strongScore.rank, 'EXCELLENT');
    assert.ok(weakScore.percent < 45);
    assert.equal(weakScore.rank, 'WEAK');

    await assert.rejects(
      () =>
        service.recommendCandidates('job1', {
          userId: employerId,
          email: 'emp@test.local',
          role: Role.Employer,
        }),
      ForbiddenException,
    );

    activeSub = { _id: 'sub1', remainingPosts: 5 };
    const result = await service.recommendCandidates('job1', {
      userId: employerId,
      email: 'emp@test.local',
      role: Role.Employer,
    });
    assert.equal(result.total, 0);
  });

  it('NotificationsService sends digest emails to matched candidates safely', async () => {
    const c1 = new Types.ObjectId();
    const company1 = new Types.ObjectId();
    const sentEmails: Array<{ to: string; subject: string; html: string }> = [];

    const userModel = {
      find: () =>
        makeQuery([
          {
            _id: c1,
            email: 'ha@test.local',
            fullName: 'Hà',
            skills: ['NestJS', 'TypeScript'],
            desiredLocation: 'Hà Nội',
          },
        ]),
    };
    const jobModel = {
      find: () =>
        makeQuery([
          {
            _id: new Types.ObjectId(),
            title: 'Backend <script>alert(1)</script> NestJS',
            skills: ['NestJS'],
            location: 'Hà Nội',
            company: { _id: company1, name: 'SME Corp' },
          },
        ]),
    };
    const followModel = { find: () => makeQuery([]) };
    const mailService = {
      send: async (to: string, subject: string, html: string) => {
        sentEmails.push({ to, subject, html });
        return { success: true };
      },
    };
    const cfg = { get: () => 'http://localhost:3000' };

    const service = new NotificationsService(
      userModel as never,
      jobModel as never,
      followModel as never,
      mailService as never,
      cfg as never,
    );

    const summary = await service.sendNewJobsDigest(24);
    assert.deepEqual(summary, { candidates: 1, recentJobs: 1, emailsSent: 1 });
    assert.equal(sentEmails.length, 1);
    assert.equal(sentEmails[0].html.includes('<script>'), false);
    assert.equal(sentEmails[0].html.includes('&lt;script&gt;'), true);
  });
});
