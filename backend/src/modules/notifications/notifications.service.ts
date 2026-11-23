import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { JobStatus } from '../../common/enums/job-status.enum';
import { Role } from '../../common/enums/role.enum';
import { escapeHtml, normalizeVietnamese } from '../../common/utils/string.util';
import {
  CompanyFollow,
  CompanyFollowDocument,
} from '../company-follows/schemas/company-follows.schema';
import { Job, JobDocument } from '../jobs/schemas/jobs.schema';
import { MailService } from '../mail/mail.service';
import { User, UserDocument } from '../users/schemas/users.schema';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
    @InjectModel(CompanyFollow.name)
    private readonly followModel: Model<CompanyFollowDocument>,
    private readonly mailService: MailService,
    private readonly cfg: ConfigService,
  ) {}

  /** Gửi email tổng hợp việc làm mới phù hợp cho ứng viên lúc 8h sáng mỗi ngày. */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendNewJobsDigest(hoursLookback = 24) {
    const since = new Date(Date.now() - hoursLookback * 60 * 60 * 1000);

    const [candidates, recentJobs] = await Promise.all([
      this.userModel
        .find({ role: Role.Candidate, isActive: true })
        .select('email fullName skills desiredTitle desiredLocation')
        .lean()
        .exec(),
      this.jobModel
        .find({ status: JobStatus.Approved, updatedAt: { $gte: since } })
        .populate('company', 'name')
        .lean()
        .exec(),
    ]);

    if (candidates.length === 0 || recentJobs.length === 0) {
      this.logger.log(
        `Digest skipped (candidates=${candidates.length}, recentJobs=${recentJobs.length})`,
      );
      return { candidates: candidates.length, recentJobs: recentJobs.length, emailsSent: 0 };
    }

    const candidateIds = candidates.map((c) => c._id);
    const follows = await this.followModel
      .find({ user: { $in: candidateIds } })
      .select('user company')
      .lean()
      .exec();

    const followedMap = new Map<string, Set<string>>();
    for (const f of follows) {
      const uid = String(f.user);
      const set = followedMap.get(uid) || new Set<string>();
      set.add(String(f.company));
      followedMap.set(uid, set);
    }

    const frontendUrl = this.cfg.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    let emailsSent = 0;

    for (const candidate of candidates) {
      const followedCompanies = followedMap.get(String(candidate._id)) || new Set<string>();
      const candidateSkills = (candidate.skills || []).map((s) => normalizeVietnamese(s));
      const candidateLoc = normalizeVietnamese(candidate.desiredLocation || '');

      const matchedJobs = recentJobs
        .filter((job) => {
          const companyId = String(
            (job.company as unknown as { _id?: unknown })?._id || job.company || '',
          );
          if (followedCompanies.has(companyId)) return true;

          const jobSkills = (job.skills || []).map((s) => normalizeVietnamese(s));
          const hasSkillOverlap =
            candidateSkills.length > 0 &&
            jobSkills.some((js) => candidateSkills.includes(js));
          const jobLoc = normalizeVietnamese(job.location || '');
          const hasLocMatch =
            Boolean(candidateLoc && jobLoc) &&
            (jobLoc.includes(candidateLoc) || candidateLoc.includes(jobLoc));

          return hasSkillOverlap || hasLocMatch;
        })
        .slice(0, 5);

      if (matchedJobs.length === 0) continue;

      const listHtml = matchedJobs
        .map((job) => {
          const companyName =
            (job.company as unknown as { name?: string })?.name || 'Nhà tuyển dụng';
          const url = `${frontendUrl}/jobs/${String(job._id)}`;
          return `<li style="margin-bottom:8px;">
            <a href="${url}" style="color:#2563eb;font-weight:600;text-decoration:none;">${escapeHtml(job.title)}</a>
            <div style="font-size:13px;color:#475569;">${escapeHtml(companyName)}${job.location ? ` – ${escapeHtml(job.location)}` : ''}</div>
          </li>`;
        })
        .join('');

      try {
        await this.mailService.send(
          candidate.email,
          `JobNet – ${matchedJobs.length} việc làm mới phù hợp dành cho bạn`,
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#2563eb;">Xin chào ${escapeHtml(candidate.fullName || 'bạn')},</h2>
            <p>Dưới đây là những cơ hội việc làm mới vừa được duyệt phù hợp với hồ sơ của bạn:</p>
            <ul>${listHtml}</ul>
            <p style="font-size:12px;color:#94a3b8;">Trân trọng, Đội ngũ JobNet.</p>
          </div>`,
        );
        emailsSent += 1;
      } catch (error) {
        this.logger.warn(
          `Failed to send digest email to ${candidate.email}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(
      `Digest complete: candidates=${candidates.length}, recentJobs=${recentJobs.length}, emailsSent=${emailsSent}`,
    );
    return { candidates: candidates.length, recentJobs: recentJobs.length, emailsSent };
  }
}
