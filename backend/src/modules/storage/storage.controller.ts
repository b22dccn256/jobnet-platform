import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StorageKeyQueryDto, UploadQueryDto } from './dto/storage.dto';
import { StorageService } from './storage.service';

// Phụ trách: Hà
@ApiTags('storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly service: StorageService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Tải lên file CV hoặc ảnh đại diện / logo công ty (MinIO)' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File, @Query() query: UploadQueryDto) {
    return this.service.upload(file, query.folder || 'cv');
  }

  @Get('url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy presigned URL để xem hoặc tải file' })
  getUrl(@Query() query: StorageKeyQueryDto) {
    return this.service.getUrl(query.key);
  }

  @Get('file')
  @ApiOperation({ summary: 'Tải trực tiếp file (hỗ trợ local fallback khi không chạy MinIO)' })
  async getFile(
    @Query() query: StorageKeyQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, filename } = await this.service.getFileBuffer(query.key);
    res.set({
      'Content-Disposition': `inline; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }
}
