import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { JobStatus } from '../src/common/enums/job-status.enum';
import { Role } from '../src/common/enums/role.enum';
import { CompanyFollowService } from '../src/modules/company-follows/company-follows.service';
import { JobLikeService } from '../src/modules/job-likes/job-likes.service';
import { renderCvHtml } from '../src/modules/profile/cv/cv-html.template';
import { CvService } from '../src/modules/profile/cv/cv.service';
import { EducationService } from '../src/modules/profile/educations/educations.service';

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

describe('Phase 2 Profile & CV Modules', () => {
  it('BaseUserOwnedService scopes CRUD to authenticated user and blocks foreign access', async () => {
    const ownerId = new Types.ObjectId().toString();
    const strangerId = new Types.ObjectId().toString();
    const record = { _id: 'edu1', user: ownerId, school: 'PTIT', major: 'CNTT' };

    const model = {
      create: async (data: Record<string, unknown>) => ({ _id: 'edu1', ...data }),
      findById: (id: string) => makeQuery(id === 'edu1' ? record : null),
      findByIdAndUpdate: (_id: string, data: Record<string, unknown>) =>
        makeQuery({ ...record, ...data }),
      findByIdAndDelete: () => makeQuery(record),
    };
    const service = new EducationService(model as never);

    const created = await service.createForUser(ownerId, { school: 'PTIT' });
    assert.equal(String(created.user), ownerId);

    await assert.rejects(
      () => service.findOneForUser('missing', ownerId),
      NotFoundException,
    );
    await assert.rejects(
      () => service.findOneForUser('edu1', strangerId),
      ForbiddenException,
    );
    await assert.rejects(
      () => service.updateForUser('edu1', strangerId, { degree: 'Kỹ sư' }),
      ForbiddenException,
    );
    await assert.rejects(
      () => service.removeForUser('edu1', strangerId),
      ForbiddenException,
    );

    const updated = await service.updateForUser('edu1', ownerId, { degree: 'Kỹ sư' });
    assert.equal(updated?.degree, 'Kỹ sư');
    const removed = await service.removeForUser('edu1', ownerId);
    assert.deepEqual(removed, { deleted: true });
  });

  it('CvService aggregates candidate sections, generates shareToken, and enforces candidate role', async () => {
    const candidateId = new Types.ObjectId().toString();
    const employerId = new Types.ObjectId().toString();
    const candidateDoc = {
      _id: candidateId,
      email: 'candidate@jobnet.local',
      role: Role.Candidate,
      fullName: 'Nguyễn Duy Hà',
      phone: '0912345678',
      bio: 'Fullstack & AI engineer',
      skills: ['TypeScript', 'NestJS'],
      desiredTitle: 'Backend Developer',
      cvTemplate: 'modern',
      isCvPublic: false,
      cvShareToken: undefined as string | undefined,
    };

    const userModel = {
      findById: (id: string) =>
        makeQuery(
          id === employerId
            ? { _id: employerId, role: Role.Employer }
            : id === candidateId
              ? candidateDoc
              : null,
        ),
      findOne: () => makeQuery(candidateDoc.isCvPublic ? { _id: candidateId } : null),
      findByIdAndUpdate: (_id: string, data: Record<string, unknown>) => {
        Object.assign(candidateDoc, data);
        return makeQuery(candidateDoc);
      },
    };
    const emptyListModel = { find: () => makeQuery([]) };
    const oneEducationModel = {
      find: () => makeQuery([{ school: 'PTIT', major: 'CNTT', degree: 'Kỹ sư' }]),
    };
    const cfg = { get: () => 'http://localhost:3000' };

    const service = new CvService(
      userModel as never,
      oneEducationModel as never,
      emptyListModel as never,
      emptyListModel as never,
      emptyListModel as never,
      emptyListModel as never,
      emptyListModel as never,
      emptyListModel as never,
      cfg as never,
    );

    await assert.rejects(() => service.getCandidateCv(employerId), BadRequestException);
    await assert.rejects(() => service.getSharedCv('bad-token'), NotFoundException);

    const updated = await service.updateCvSettings(candidateId, {
      cvTemplate: 'classic',
      isCvPublic: true,
      skills: [' TypeScript ', 'NestJS', 'TypeScript'],
    });
    assert.equal(updated.profile.cvTemplate, 'classic');
    assert.equal(updated.profile.isCvPublic, true);
    assert.ok(updated.profile.cvShareToken);
    assert.ok(updated.shareUrl?.includes(updated.profile.cvShareToken));
    assert.deepEqual(updated.profile.skills, ['TypeScript', 'NestJS']);
    assert.equal(updated.educations.length, 1);
    assert.ok(updated.completeness > 50);

    const shared = await service.getSharedCv(updated.profile.cvShareToken!);
    assert.equal(shared.profile.email, 'candidate@jobnet.local');
  });

  it('renderCvHtml escapes unsafe HTML and supports all templates', () => {
    const html = renderCvHtml(
      {
        profile: {
          _id: 'u1',
          email: 'ha@test.local',
          fullName: 'Hà <script>alert(1)</script>',
          skills: ['NestJS', 'MongoDB'],
          cvTemplate: 'minimal',
          isCvPublic: false,
        },
        educations: [{ school: 'PTIT', degree: 'Kỹ sư' }],
        workExperiences: [],
        projects: [],
        courses: [],
        languages: [],
        health: [],
        otherInfo: [],
        completeness: 50,
        shareUrl: null,
      },
      'minimal',
    );

    assert.equal(html.includes('<script>alert(1)</script>'), false);
    assert.equal(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), true);
    assert.equal(html.includes('PTIT'), true);
    assert.equal(html.includes('NestJS'), true);
  });
});

describe('Phase 2 JobLikes & CompanyFollows', () => {
  it('JobLikeService validates approved job and handles like/unlike cleanly', async () => {
    const userId = new Types.ObjectId().toString();
    const jobId = new Types.ObjectId().toString();
    const jobDoc = { _id: jobId, status: JobStatus.Pending };

    const likeModel = {
      findOneAndUpdate: () => makeQuery({ _id: 'like1', user: userId, job: jobId }),
      findOneAndDelete: () => makeQuery({ _id: 'like1' }),
      exists: async () => ({ _id: 'like1' }),
    };
    const jobModel = {
      findById: (id: string) => makeQuery(id === jobId ? jobDoc : null),
    };

    const service = new JobLikeService(likeModel as never, jobModel as never);

    await assert.rejects(() => service.like(userId, new Types.ObjectId().toString()), NotFoundException);
    await assert.rejects(() => service.like(userId, jobId), BadRequestException);

    jobDoc.status = JobStatus.Approved;
    const liked = await service.like(userId, jobId);
    assert.equal(liked.liked, true);

    const status = await service.isLiked(userId, jobId);
    assert.equal(status.liked, true);

    const unliked = await service.unlike(userId, jobId);
    assert.deepEqual(unliked, { liked: false, deleted: true });
  });

  it('CompanyFollowService validates company existence and handles follow/unfollow/count', async () => {
    const userId = new Types.ObjectId().toString();
    const companyId = new Types.ObjectId().toString();

    const followModel = {
      findOneAndUpdate: () => makeQuery({ _id: 'f1', user: userId, company: companyId }),
      findOneAndDelete: () => makeQuery({ _id: 'f1' }),
      countDocuments: async () => 7,
      exists: async () => ({ _id: 'f1' }),
    };
    const companyModel = {
      findById: (id: string) => makeQuery(id === companyId ? { _id: companyId, name: 'SME' } : null),
    };

    const service = new CompanyFollowService(followModel as never, companyModel as never);

    await assert.rejects(
      () => service.follow(userId, new Types.ObjectId().toString()),
      NotFoundException,
    );

    const followed = await service.follow(userId, companyId);
    assert.equal(followed.following, true);

    const count = await service.countFollowers(companyId);
    assert.deepEqual(count, { companyId, followersCount: 7 });

    const unfollowed = await service.unfollow(userId, companyId);
    assert.deepEqual(unfollowed, { following: false, deleted: true });
  });
});
