import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { AuthUserPayload } from '../../../common/interfaces/auth-user.interface';
import { ParseObjectIdPipe } from '../../../common/pipes/parse-object-id.pipe';
import { slugify } from '../../../common/utils/string.util';
import { CvService } from './cv.service';
import { ExportCvPdfQueryDto, UpdateCvSettingsDto } from './dto/cv.dto';

// Phụ trách: Hà
@ApiTags('cv')
@Controller('cv')
export class CvController {
  constructor(private readonly service: CvService) {}

  private toPdfFile(
    buffer: Buffer,
    name: string,
    res: Response,
  ): StreamableFile {
    const filename = `cv-${slugify(name) || 'ung-vien'}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Candidate)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tổng hợp đầy đủ hồ sơ CV của ứng viên hiện tại' })
  myCv(@CurrentUser() user: AuthUserPayload) {
    return this.service.getCandidateCv(user.userId);
  }

  @Patch('me/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Candidate)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật mẫu CV, quyền chia sẻ công khai và định hướng nghề nghiệp' })
  updateMySettings(@CurrentUser() user: AuthUserPayload, @Body() dto: UpdateCvSettingsDto) {
    return this.service.updateCvSettings(user.userId, dto);
  }

  @Get('me/pdf')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Candidate)
  @ApiBearerAuth()
  @ApiProduces('application/pdf')
  @ApiOperation({ summary: 'Xuất CV của ứng viên hiện tại thành file PDF (Puppeteer)' })
  async downloadMyPdf(
    @CurrentUser() user: AuthUserPayload,
    @Query() query: ExportCvPdfQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cv = await this.service.getCandidateCv(user.userId);
    const buffer = await this.service.renderPdfBuffer(cv, query.template);
    return this.toPdfFile(buffer, cv.profile.fullName || cv.profile.email, res);
  }

  @Get('shared/:shareToken')
  @ApiOperation({ summary: 'Xem CV được chia sẻ công khai qua mã token' })
  sharedCv(@Param('shareToken') shareToken: string) {
    return this.service.getSharedCv(shareToken);
  }

  @Get('shared/:shareToken/pdf')
  @ApiProduces('application/pdf')
  @ApiOperation({ summary: 'Tải PDF của CV được chia sẻ công khai' })
  async downloadSharedPdf(
    @Param('shareToken') shareToken: string,
    @Query() query: ExportCvPdfQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cv = await this.service.getSharedCv(shareToken);
    const buffer = await this.service.renderPdfBuffer(cv, query.template);
    return this.toPdfFile(buffer, cv.profile.fullName || cv.profile.email, res);
  }

  @Get('candidate/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Employer, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xem CV chi tiết của ứng viên (Nhà tuyển dụng / Admin)' })
  candidateCv(@Param('userId', ParseObjectIdPipe) userId: string) {
    return this.service.getCandidateCv(userId);
  }

  @Get('candidate/:userId/pdf')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Employer, Role.Admin)
  @ApiBearerAuth()
  @ApiProduces('application/pdf')
  @ApiOperation({ summary: 'Tải PDF hồ sơ CV của ứng viên (Nhà tuyển dụng / Admin)' })
  async downloadCandidatePdf(
    @Param('userId', ParseObjectIdPipe) userId: string,
    @Query() query: ExportCvPdfQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cv = await this.service.getCandidateCv(userId);
    const buffer = await this.service.renderPdfBuffer(cv, query.template);
    return this.toPdfFile(buffer, cv.profile.fullName || cv.profile.email, res);
  }
}
