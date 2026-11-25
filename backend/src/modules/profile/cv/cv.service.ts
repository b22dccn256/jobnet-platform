import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { Model, Types } from 'mongoose';
import * as puppeteer from 'puppeteer';
import { Role } from '../../../common/enums/role.enum';
import { User, UserDocument } from '../../users/schemas/users.schema';
import { Course, CourseDocument } from '../courses/schemas/courses.schema';
import { Education, EducationDocument } from '../educations/schemas/educations.schema';
import { Health, HealthDocument } from '../health/schemas/health.schema';
import { Language, LanguageDocument } from '../languages/schemas/languages.schema';
import { OtherInfo, OtherInfoDocument } from '../other-info/schemas/other-info.schema';
import { Project, ProjectDocument } from '../projects/schemas/projects.schema';
import {
  WorkExperience,
  WorkExperienceDocument,
} from '../work-experiences/schemas/work-experiences.schema';
import { CandidateCvData, renderCvHtml } from './cv-html.template';
import { CvTemplateType, UpdateCvSettingsDto } from './dto/cv.dto';

@Injectable()
export class CvService {
  private readonly logger = new Logger(CvService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Education.name) private readonly educationModel: Model<EducationDocument>,
    @InjectModel(WorkExperience.name)
    private readonly workExperienceModel: Model<WorkExperienceDocument>,
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    @InjectModel(Language.name) private readonly languageModel: Model<LanguageDocument>,
    @InjectModel(Health.name) private readonly healthModel: Model<HealthDocument>,
    @InjectModel(OtherInfo.name) private readonly otherInfoModel: Model<OtherInfoDocument>,
    private readonly cfg: ConfigService,
  ) {}

  private calculateCompleteness(data: {
    user: User;
    educationsCount: number;
    workCount: number;
    projectsCount: number;
    extraCount: number;
  }): number {
    const checks = [
      Boolean(data.user.fullName && data.user.phone),
      Boolean(data.user.bio),
      Boolean(data.user.skills && data.user.skills.length > 0),
      Boolean(data.user.desiredTitle),
      data.educationsCount > 0,
      data.workCount > 0 || data.projectsCount > 0,
      data.extraCount > 0,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }

  private buildShareUrl(user: User): string | null {
    if (!user.isCvPublic || !user.cvShareToken) return null;
    const frontendUrl = this.cfg.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    return `${frontendUrl}/cv/shared/${user.cvShareToken}`;
  }

  async getCandidateCv(userId: string): Promise<CandidateCvData> {
    const user = await this.userModel
      .findById(userId)
      .select(
        'email role fullName phone avatar coverImage gender dateOfBirth nationality address website isVerified bio skills desiredTitle desiredLevel desiredSalaryMin desiredLocation cvUrl cvTemplate isCvPublic cvShareToken',
      )
      .lean()
      .exec();

    if (!user) throw new NotFoundException('Không tìm thấy ứng viên');
    if (user.role !== Role.Candidate) {
      throw new BadRequestException('Tài khoản này không phải là ứng viên');
    }

    const userObjectId = new Types.ObjectId(userId);
    const [educations, workExperiences, projects, courses, languages, health, otherInfo] =
      await Promise.all([
        this.educationModel.find({ user: userObjectId }).sort({ startDate: -1 }).lean().exec(),
        this.workExperienceModel.find({ user: userObjectId }).sort({ startDate: -1 }).lean().exec(),
        this.projectModel.find({ user: userObjectId }).sort({ createdAt: -1 }).lean().exec(),
        this.courseModel.find({ user: userObjectId }).sort({ date: -1 }).lean().exec(),
        this.languageModel.find({ user: userObjectId }).sort({ createdAt: -1 }).lean().exec(),
        this.healthModel.find({ user: userObjectId }).sort({ createdAt: -1 }).lean().exec(),
        this.otherInfoModel.find({ user: userObjectId }).sort({ createdAt: -1 }).lean().exec(),
      ]);

    const completeness = this.calculateCompleteness({
      user,
      educationsCount: educations.length,
      workCount: workExperiences.length,
      projectsCount: projects.length,
      extraCount: courses.length + languages.length + otherInfo.length,
    });

    return {
      profile: {
        _id: String(user._id),
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        avatar: user.avatar,
        coverImage: user.coverImage,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        nationality: user.nationality || 'Việt Nam',
        address: user.address,
        website: user.website,
        isVerified: Boolean(user.isVerified),
        bio: user.bio,
        skills: user.skills || [],
        desiredTitle: user.desiredTitle,
        desiredLevel: user.desiredLevel,
        desiredSalaryMin: user.desiredSalaryMin,
        desiredLocation: user.desiredLocation,
        cvUrl: user.cvUrl,
        cvTemplate: (user.cvTemplate as CvTemplateType) || 'modern',
        isCvPublic: Boolean(user.isCvPublic),
        cvShareToken: user.cvShareToken,
      },
      educations,
      workExperiences,
      projects,
      courses,
      languages,
      health,
      otherInfo,
      completeness,
      shareUrl: this.buildShareUrl(user),
    };
  }

  async updateCvSettings(userId: string, dto: UpdateCvSettingsDto) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('Không tìm thấy ứng viên');

    const updateData: Record<string, unknown> = {};
    if (dto.cvTemplate !== undefined) updateData.cvTemplate = dto.cvTemplate;
    if (dto.isCvPublic !== undefined) updateData.isCvPublic = dto.isCvPublic;
    if (dto.bio !== undefined) updateData.bio = dto.bio;
    if (dto.desiredTitle !== undefined) updateData.desiredTitle = dto.desiredTitle;
    if (dto.desiredLevel !== undefined) updateData.desiredLevel = dto.desiredLevel;
    if (dto.desiredSalaryMin !== undefined) updateData.desiredSalaryMin = dto.desiredSalaryMin;
    if (dto.desiredLocation !== undefined) updateData.desiredLocation = dto.desiredLocation;
    if (dto.skills !== undefined) {
      updateData.skills = Array.from(new Set(dto.skills.map((s) => s.trim()).filter(Boolean)));
    }

    const shouldEnsureToken =
      dto.regenerateShareToken || (dto.isCvPublic === true && !user.cvShareToken);
    if (shouldEnsureToken) {
      updateData.cvShareToken = crypto.randomBytes(16).toString('hex');
    }

    await this.userModel.findByIdAndUpdate(userId, updateData, { new: true }).exec();
    return this.getCandidateCv(userId);
  }

  async getSharedCv(shareToken: string): Promise<CandidateCvData> {
    const user = await this.userModel
      .findOne({ cvShareToken: shareToken, isCvPublic: true })
      .select('_id')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('Liên kết CV không tồn tại hoặc chưa được công khai');
    }

    return this.getCandidateCv(String(user._id));
  }

  private resolveBrowserExecutable(): string | undefined {
    const candidates: Array<string | undefined> = [
      this.cfg.get<string>('PUPPETEER_EXECUTABLE_PATH'),
      (() => {
        try {
          return puppeteer.executablePath();
        } catch {
          return undefined;
        }
      })(),
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/google-chrome',
    ];

    return candidates.find((p): p is string => Boolean(p && fs.existsSync(p)));
  }

  async renderPdfBuffer(cv: CandidateCvData, template?: CvTemplateType): Promise<Buffer> {
    const html = renderCvHtml(cv, template);
    const executablePath = this.resolveBrowserExecutable();

    let browser: puppeteer.Browser | null = null;
    try {
      browser = await puppeteer.launch({
        headless: true,
        ...(executablePath ? { executablePath } : {}),
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (req.url().startsWith('http://') || req.url().startsWith('https://')) {
          return req.abort();
        }
        return req.continue();
      });

      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' },
      });
      return Buffer.from(pdfBytes);
    } catch (error) {
      this.logger.error(`Puppeteer PDF generation failed: ${(error as Error).message}`);
      throw new InternalServerErrorException('Không thể xuất file PDF lúc này');
    } finally {
      if (browser) {
        await browser.close().catch(() => undefined);
      }
    }
  }
}
