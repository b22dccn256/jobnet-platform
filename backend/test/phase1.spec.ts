import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Types } from 'mongoose';
import { ApplicationStatus } from '../src/common/enums/application-status.enum';
import { JobStatus } from '../src/common/enums/job-status.enum';
import { Role } from '../src/common/enums/role.enum';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { ParseObjectIdPipe } from '../src/common/pipes/parse-object-id.pipe';
import { escapeRegex, normalizeVietnamese, slugify } from '../src/common/utils/string.util';
import { AdminService } from '../src/modules/admin/admin.service';
import { ApplicationService } from '../src/modules/applications/applications.service';
import { CategoryService } from '../src/modules/categories/categories.service';
import { CompanyService } from '../src/modules/companies/companies.service';
import { JobService } from '../src/modules/jobs/jobs.service';

function makeExec<T>(value: T) {
  return { exec: async () => value };
}

describe('Base Utilities & Guards', () => {
  it('normalizes Vietnamese text and generates clean slugs', () => {
    assert.equal(normalizeVietnamese('Đà Nẵng - Công Nghệ!'), 'da nang cong nghe');
    assert.equal(slugify('Công nghệ Thông tin & AI'), 'cong-nghe-thong-tin-ai');
    assert.equal(escapeRegex('C++ (2026).js'), 'C\\+\\+ \\(2026\\)\\.js');
  });

  it('validates MongoDB ObjectId in ParseObjectIdPipe', () => {
    const pipe = new ParseObjectIdPipe();
    const validId = new Types.ObjectId().toString();
    assert.equal(pipe.transform(validId), validId);
    assert.throws(() => pipe.transform('not-an-object-id'), BadRequestException);
  });

  it('enforces roles in RolesGuard', () => {
    const reflector = new Reflector();
    const guard = new RolesGuard(reflector);
    const handler = () => undefined;
    class DummyController {}

    Reflect.defineMetadata('roles', [Role.Admin], handler);
    const makeCtx = (user?: { role: Role }) =>
      ({
        getHandler: () => handler,
        getClass: () => DummyController,
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
      }) as never;

    assert.equal(guard.canActivate(makeCtx(undefined)), false);
    assert.equal(guard.canActivate(makeCtx({ role: Role.Candidate })), false);
    assert.equal(guard.canActivate(makeCtx({ role: Role.Admin })), true);
  });
});

describe('Phase 1 Core Services', () => {
  it('CategoryService creates auto-slug and rejects duplicate categories', async () => {
    let existing: unknown = null;
    const model = {
      findOne: () => makeExec(existing),
      create: async (doc: Record<string, unknown>) => ({ _id: 'cat1', ...doc }),
    };
    const service = new CategoryService(model as never);

    const created = await service.create({ name: 'Công nghệ phần mềm' });
    assert.equal(created.slug, 'cong-nghe-phan-mem');

    existing = { _id: 'cat1', name: 'Công nghệ phần mềm', slug: 'cong-nghe-phan-mem' };
    await assert.rejects(
      () => service.create({ name: 'Công nghệ phần mềm' }),
      ConflictException,
    );
  });

  it('CompanyService enforces single company per employer and ownership on update', async () => {
    const ownerId = new Types.ObjectId().toString();
    const otherId = new Types.ObjectId().toString();
    const companyDoc = { _id: 'comp1', user: ownerId, name: 'SME Corp' };

    const model = {
      findOne: () => makeExec(companyDoc),
      findById: () => makeExec(companyDoc),
      findByIdAndUpdate: (_id: string, data: Record<string, unknown>) =>
        makeExec({ ...companyDoc, ...data }),
    };
    const service = new CompanyService(model as never);

    await assert.rejects(
      () => service.createForUser(ownerId, { name: 'Second Corp' }),
      ConflictException,
    );

    await assert.rejects(
      () =>
        service.updateWithOwnership(
          'comp1',
          { userId: otherId, email: 'x@test.local', role: Role.Employer },
          { name: 'Hijacked' },
        ),
      ForbiddenException,
    );

    const updated = await service.updateWithOwnership(
      'comp1',
      { userId: ownerId, email: 'o@test.local', role: Role.Employer },
      { name: 'SME Corp Updated' },
    );
    assert.equal(updated?.name, 'SME Corp Updated');
  });

  it('JobService validates company existence, salary range, and pending job visibility', async () => {
    const employerId = new Types.ObjectId().toString();
    const otherEmployerId = new Types.ObjectId().toString();
    const companyId = new Types.ObjectId();
    let employerCompany: { _id: Types.ObjectId; user: string } | null = null;
    const pendingJob = {
      _id: 'job1',
      status: JobStatus.Pending,
      salaryMin: 10,
      salaryMax: 20,
      company: { _id: companyId, user: employerId },
    };

    const jobModel = {
      findById: () => ({
        populate: () => ({
          populate: () => makeExec(pendingJob),
          ...makeExec(pendingJob),
        }),
      }),
      findByIdAndUpdate: (_id: string, data: Record<string, unknown>) => ({
        populate: () => ({
          populate: () => makeExec({ ...pendingJob, ...data }),
        }),
      }),
      create: async (data: Record<string, unknown>) => ({ _id: 'job1', ...data }),
    };
    const companyService = {
      findOptionalByUser: async () => employerCompany,
    };
    const categoryService = { findOne: async () => ({}) };
    const searchService = { removeJob: async () => undefined };

    const service = new JobService(
      jobModel as never,
      companyService as never,
      categoryService as never,
      searchService as never,
    );

    await assert.rejects(
      () => service.createForEmployer(employerId, { title: 'Dev' }),
      BadRequestException,
    );

    employerCompany = { _id: companyId, user: employerId };
    await assert.rejects(
      () =>
        service.createForEmployer(employerId, {
          title: 'Dev',
          salaryMin: 30000000,
          salaryMax: 15000000,
        }),
      BadRequestException,
    );

    await assert.rejects(
      () => service.findOneAuthorized('job1', null),
      ForbiddenException,
    );
    await assert.rejects(
      () =>
        service.findOneAuthorized('job1', {
          userId: otherEmployerId,
          email: 'other@test.local',
          role: Role.Employer,
        }),
      ForbiddenException,
    );

    const visibleToOwner = await service.findOneAuthorized('job1', {
      userId: employerId,
      email: 'owner@test.local',
      role: Role.Employer,
    });
    assert.equal(visibleToOwner._id, 'job1');
  });

  it('ApplicationService blocks unapproved/duplicate applications and enforces withdrawal rules', async () => {
    const jobId = new Types.ObjectId().toString();
    const candidateId = new Types.ObjectId().toString();
    const jobDoc = { _id: jobId, status: JobStatus.Pending, deadline: null as Date | null };
    let existingApp: Record<string, unknown> | null = null;

    const appModel = {
      findOne: () => makeExec(existingApp),
      findById: () => makeExec(existingApp),
      create: async (data: Record<string, unknown>) => ({ _id: 'app1', ...data }),
    };
    const jobModel = { findById: () => makeExec(jobDoc) };
    const companyService = {};
    const mailService = { send: async () => ({ success: true }) };

    const service = new ApplicationService(
      appModel as never,
      jobModel as never,
      companyService as never,
      mailService as never,
    );

    await assert.rejects(
      () => service.apply(candidateId, { jobId }),
      BadRequestException,
    );

    jobDoc.status = JobStatus.Approved;
    existingApp = { _id: 'app1', user: candidateId, status: ApplicationStatus.Interview };
    await assert.rejects(
      () => service.apply(candidateId, { jobId }),
      ConflictException,
    );

    await assert.rejects(
      () =>
        service.withdraw('app1', {
          userId: candidateId,
          email: 'c@test.local',
          role: Role.Candidate,
        }),
      BadRequestException,
    );
  });

  it('AdminService protects self-lock/demotion, requires reject reason, and tolerates ES errors', async () => {
    const adminId = new Types.ObjectId().toString();
    const jobId = new Types.ObjectId().toString();
    const jobDoc = { _id: jobId, title: 'Backend Dev', status: JobStatus.Approved };

    const userModel = {};
    const jobModel = {
      findByIdAndUpdate: () => ({
        populate: () => ({
          populate: () => makeExec(jobDoc),
        }),
      }),
    };
    const emptyModel = {};
    const searchService = {
      indexJob: async () => {
        throw new Error('Elasticsearch offline');
      },
      removeJob: async () => undefined,
    };

    const service = new AdminService(
      userModel as never,
      jobModel as never,
      emptyModel as never,
      emptyModel as never,
      emptyModel as never,
      searchService as never,
    );

    await assert.rejects(
      () => service.updateUserStatus(adminId, adminId, { isActive: false }),
      BadRequestException,
    );
    await assert.rejects(
      () => service.updateUserRole(adminId, adminId, { role: Role.Candidate }),
      BadRequestException,
    );
    await assert.rejects(
      () => service.moderateJob(jobId, { approve: false, reason: '   ' }),
      BadRequestException,
    );

    const moderated = await service.moderateJob(jobId, { approve: true });
    assert.equal(moderated.status, JobStatus.Approved);
  });
});
