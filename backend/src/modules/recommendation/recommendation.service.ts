import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JobStatus } from '../../common/enums/job-status.enum';
import { Role } from '../../common/enums/role.enum';
import { AuthUserPayload } from '../../common/interfaces/auth-user.interface';
import { normalizeVietnamese } from '../../common/utils/string.util';
import { Job, JobDocument } from '../jobs/schemas/jobs.schema';
import { Course, CourseDocument } from '../profile/courses/schemas/courses.schema';
import { Education, EducationDocument } from '../profile/educations/schemas/educations.schema';
import { Language, LanguageDocument } from '../profile/languages/schemas/languages.schema';
import { Project, ProjectDocument } from '../profile/projects/schemas/projects.schema';
import {
  WorkExperience,
  WorkExperienceDocument,
} from '../profile/work-experiences/schemas/work-experiences.schema';
import { RecruiterPremiumService } from '../recruiter-premium/recruiter-premium.service';
import { User, UserDocument } from '../users/schemas/users.schema';

export interface CandidateProfileBundle {
  user: {
    _id: unknown;
    email: string;
    fullName?: string;
    phone?: string;
    avatar?: string;
    bio?: string;
    skills?: string[];
    desiredTitle?: string;
    desiredLevel?: string;
    desiredSalaryMin?: number;
    desiredLocation?: string;
    cvUrl?: string;
  };
  educations: Array<{ school?: string; major?: string; degree?: string }>;
  workExperiences: Array<{
    position?: string;
    company?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    description?: string;
  }>;
  projects: Array<{ name?: string; description?: string; technologies?: string[] }>;
  coursesCount: number;
  languagesCount: number;
}

export interface JobScoringInput {
  _id?: unknown;
  title?: string;
  requirements?: string;
  skills?: string[];
  location?: string;
  workMode?: string;
  level?: string;
  education?: string;
  salaryMin?: number;
  salaryMax?: number;
}

export interface ScoreBreakdown {
  skills: number;
  experience: number;
  level: number;
  projects: number;
  title: number;
  salary: number;
  location: number;
  education: number;
  profileQuality: number;
}

const LEVEL_RANK: Record<string, number> = {
  intern: 0,
  junior: 1,
  middle: 2,
  senior: 3,
};

const EXPECTED_YEARS_BY_LEVEL: Record<string, number> = {
  intern: 0,
  junior: 1,
  middle: 2,
  senior: 4,
};

@Injectable()
export class RecommendationService {
  private readonly maxScore = 105;

  constructor(
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Education.name) private readonly educationModel: Model<EducationDocument>,
    @InjectModel(WorkExperience.name)
    private readonly workExperienceModel: Model<WorkExperienceDocument>,
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    @InjectModel(Language.name) private readonly languageModel: Model<LanguageDocument>,
    private readonly recruiterPremiumService: RecruiterPremiumService,
  ) {}

  classify(percent: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'WEAK' {
    if (percent >= 85) return 'EXCELLENT';
    if (percent >= 65) return 'GOOD';
    if (percent >= 45) return 'FAIR';
    return 'WEAK';
  }

  normalize(text = ''): string {
    return normalizeVietnamese(text);
  }

  private tokenize(text = ''): string[] {
    return this.normalize(text)
      .split(' ')
      .filter((token) => token.length >= 2);
  }

  private calculateTotalExperienceYears(
    experiences: CandidateProfileBundle['workExperiences'],
  ): number {
    let totalMonths = 0;
    const now = Date.now();
    for (const exp of experiences) {
      if (!exp.startDate) {
        totalMonths += 6;
        continue;
      }
      const start = new Date(exp.startDate).getTime();
      const end = exp.endDate ? new Date(exp.endDate).getTime() : now;
      if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
        totalMonths += Math.max(1, (end - start) / (1000 * 60 * 60 * 24 * 30.4375));
      }
    }
    return totalMonths / 12;
  }

  /**
   * Thuật toán chấm điểm ứng viên (tối đa 105 điểm):
   * kỹ năng 35 | kinh nghiệm 25 | cấp độ 10 | dự án 10 | chức danh 5 |
   * lương 5 | địa điểm 5 | học vấn 5 | chất lượng hồ sơ 5
   */
  scoreCandidateForJob(job: JobScoringInput, bundle: CandidateProfileBundle) {
    const { user, educations, workExperiences, projects } = bundle;

    // 1. Kỹ năng (35 điểm)
    const candidateSkillsNorm = new Set<string>(
      [
        ...(user.skills || []),
        ...projects.flatMap((p) => p.technologies || []),
      ]
        .map((s) => this.normalize(s))
        .filter(Boolean),
    );
    const candidateSkillCorpus = this.normalize(
      [
        ...(user.skills || []),
        ...projects.flatMap((p) => [p.name || '', ...(p.technologies || [])]),
        ...workExperiences.map((w) => `${w.position || ''} ${w.description || ''}`),
      ].join(' '),
    );
    const jobSkills = (job.skills || []).map((s) => this.normalize(s)).filter(Boolean);
    let skillsScore = 20;
    if (jobSkills.length > 0) {
      const matchedCount = jobSkills.filter(
        (js) => candidateSkillsNorm.has(js) || candidateSkillCorpus.includes(js),
      ).length;
      skillsScore = Math.round((matchedCount / jobSkills.length) * 35);
    }

    // 2. Kinh nghiệm (25 điểm)
    const expYears = this.calculateTotalExperienceYears(workExperiences);
    const expectedYears = EXPECTED_YEARS_BY_LEVEL[job.level || 'junior'] ?? 1;
    let yearsPoints = 0;
    if (expectedYears === 0) {
      yearsPoints = workExperiences.length > 0 ? 18 : 14;
    } else {
      yearsPoints = Math.min(18, Math.round((expYears / expectedYears) * 18));
    }
    const jobTitleTokens = new Set(this.tokenize(`${job.title || ''} ${job.requirements || ''}`));
    const expTokens = this.tokenize(
      workExperiences.map((w) => `${w.position || ''} ${w.description || ''}`).join(' '),
    );
    const expOverlap = expTokens.filter((t) => jobTitleTokens.has(t)).length;
    const relevancePoints = workExperiences.length > 0 ? Math.min(7, expOverlap * 2 + 1) : 0;
    const experienceScore = Math.min(25, yearsPoints + relevancePoints);

    // 3. Cấp độ (10 điểm)
    let levelScore = 4;
    if (user.desiredLevel && job.level) {
      const diff = Math.abs(
        (LEVEL_RANK[user.desiredLevel] ?? 1) - (LEVEL_RANK[job.level] ?? 1),
      );
      levelScore = diff === 0 ? 10 : diff === 1 ? 6 : 2;
    }

    // 4. Dự án (10 điểm)
    const baseProjectPoints = Math.min(2, projects.length) * 3;
    const projectTechs = projects
      .flatMap((p) => p.technologies || [])
      .map((t) => this.normalize(t));
    const projectMatches = jobSkills.filter((js) =>
      projectTechs.some((pt) => pt.includes(js) || js.includes(pt)),
    ).length;
    const projectBonus =
      projects.length === 0
        ? 0
        : jobSkills.length > 0
          ? Math.min(4, Math.round((projectMatches / jobSkills.length) * 4) + (projectMatches > 0 ? 1 : 0))
          : 2;
    const projectsScore = Math.min(10, baseProjectPoints + projectBonus);

    // 5. Chức danh (5 điểm)
    let titleScore = 0;
    if (user.desiredTitle && job.title) {
      const targetTokens = new Set(this.tokenize(job.title));
      const candidateTitleTokens = this.tokenize(user.desiredTitle);
      if (targetTokens.size > 0 && candidateTitleTokens.length > 0) {
        const matches = candidateTitleTokens.filter((t) => targetTokens.has(t)).length;
        titleScore = Math.min(5, Math.round((matches / Math.min(targetTokens.size, 3)) * 5));
      }
    }

    // 6. Mức lương (5 điểm)
    let salaryScore = 5;
    const jobCap = job.salaryMax || job.salaryMin;
    if (user.desiredSalaryMin && jobCap) {
      if (user.desiredSalaryMin <= jobCap) {
        salaryScore = 5;
      } else if (user.desiredSalaryMin <= jobCap * 1.2) {
        salaryScore = 3;
      } else {
        salaryScore = 0;
      }
    }

    // 7. Địa điểm (5 điểm)
    let locationScore = 2;
    if (job.workMode === 'remote') {
      locationScore = 5;
    } else if (user.desiredLocation && job.location) {
      const candLoc = this.normalize(user.desiredLocation);
      const jobLoc = this.normalize(job.location);
      locationScore = candLoc.includes(jobLoc) || jobLoc.includes(candLoc) ? 5 : 0;
    }

    // 8. Học vấn (5 điểm)
    let educationScore = 0;
    if (educations.length > 0) {
      educationScore = 3;
      const jobEdu = this.normalize(job.education || '');
      const eduText = this.normalize(
        educations.map((e) => `${e.degree || ''} ${e.major || ''}`).join(' '),
      );
      if (!jobEdu || eduText.includes(jobEdu) || jobEdu.includes('dai hoc') && eduText.includes('ky su')) {
        educationScore = 5;
      }
    }

    // 9. Chất lượng hồ sơ (5 điểm)
    const qualityChecks = [
      Boolean(user.bio),
      Boolean(user.phone),
      Boolean(user.skills && user.skills.length > 0),
      educations.length > 0,
      workExperiences.length > 0 || projects.length > 0,
    ];
    const profileQualityScore = qualityChecks.filter(Boolean).length;

    const breakdown: ScoreBreakdown = {
      skills: skillsScore,
      experience: experienceScore,
      level: levelScore,
      projects: projectsScore,
      title: titleScore,
      salary: salaryScore,
      location: locationScore,
      education: educationScore,
      profileQuality: profileQualityScore,
    };

    const totalScore = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
    const percent = Math.min(100, Math.round((totalScore / this.maxScore) * 100));

    return {
      totalScore,
      maxScore: this.maxScore,
      percent,
      rank: this.classify(percent),
      breakdown,
    };
  }

  private async loadCandidateBundles(candidateIds?: Types.ObjectId[]): Promise<CandidateProfileBundle[]> {
    const userFilter: Record<string, unknown> = { role: Role.Candidate, isActive: true };
    if (candidateIds) {
      userFilter._id = { $in: candidateIds };
    }

    const users = await this.userModel
      .find(userFilter)
      .select(
        'email fullName phone avatar bio skills desiredTitle desiredLevel desiredSalaryMin desiredLocation cvUrl',
      )
      .lean()
      .exec();

    if (users.length === 0) return [];

    const userObjectIds = users.map((u) => u._id);
    const [educations, workExperiences, projects, courses, languages] = await Promise.all([
      this.educationModel.find({ user: { $in: userObjectIds } }).lean().exec(),
      this.workExperienceModel.find({ user: { $in: userObjectIds } }).lean().exec(),
      this.projectModel.find({ user: { $in: userObjectIds } }).lean().exec(),
      this.courseModel.find({ user: { $in: userObjectIds } }).select('user').lean().exec(),
      this.languageModel.find({ user: { $in: userObjectIds } }).select('user').lean().exec(),
    ]);

    const groupByUser = <T extends { user: unknown }>(rows: T[]) => {
      const map = new Map<string, T[]>();
      for (const row of rows) {
        const key = String(row.user);
        const list = map.get(key) || [];
        list.push(row);
        map.set(key, list);
      }
      return map;
    };

    const eduMap = groupByUser(educations);
    const expMap = groupByUser(workExperiences);
    const projMap = groupByUser(projects);
    const courseMap = groupByUser(courses);
    const langMap = groupByUser(languages);

    return users.map((user) => {
      const uid = String(user._id);
      return {
        user,
        educations: eduMap.get(uid) || [],
        workExperiences: expMap.get(uid) || [],
        projects: projMap.get(uid) || [],
        coursesCount: (courseMap.get(uid) || []).length,
        languagesCount: (langMap.get(uid) || []).length,
      };
    });
  }

  async recommendCandidates(
    jobId: string,
    actor: AuthUserPayload,
    page = 1,
    limit = 10,
  ) {
    const job = await this.jobModel.findById(jobId).populate('company', 'user name').lean().exec();
    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng');

    if (actor.role !== Role.Admin) {
      const ownerId = (job.company as unknown as { user?: Types.ObjectId })?.user;
      if (!ownerId || String(ownerId) !== actor.userId) {
        throw new ForbiddenException('Bạn không có quyền xem gợi ý ứng viên cho tin này');
      }

      const companyId = (job.company as unknown as { _id?: Types.ObjectId })?._id;
      const activeSub = companyId
        ? await this.recruiterPremiumService.findActiveByCompany(companyId)
        : null;
      if (!activeSub) {
        throw new ForbiddenException(
          'Tính năng gợi ý ứng viên yêu cầu gói nhà tuyển dụng Premium đang hoạt động',
        );
      }
    }

    const bundles = await this.loadCandidateBundles();
    const scored = bundles
      .map((bundle) => {
        const scoreResult = this.scoreCandidateForJob(job, bundle);
        return {
          candidate: bundle.user,
          ...scoreResult,
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore);

    const total = scored.length;
    const items = scored.slice((page - 1) * limit, page * limit);
    return { jobId, page, limit, total, items };
  }

  async recommendJobsForCandidate(userId: string, page = 1, limit = 10) {
    const bundles = await this.loadCandidateBundles([new Types.ObjectId(userId)]);
    if (bundles.length === 0) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');
    }
    const candidateBundle = bundles[0];

    const jobs = await this.jobModel
      .find({
        status: JobStatus.Approved,
        $or: [
          { deadline: { $exists: false } },
          { deadline: null },
          { deadline: { $gte: new Date() } },
        ],
      })
      .populate('company', 'name logo address industry')
      .populate('category', 'name slug')
      .lean()
      .exec();

    const scored = jobs
      .map((job) => ({
        job,
        ...this.scoreCandidateForJob(job, candidateBundle),
      }))
      .sort((a, b) => b.totalScore - a.totalScore);

    const total = scored.length;
    const items = scored.slice((page - 1) * limit, page * limit);
    return { page, limit, total, items };
  }
}
