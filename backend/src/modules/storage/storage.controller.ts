import { Controller, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StorageService } from './storage.service';

// Phụ trách: Hà
@ApiTags('storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly service: StorageService) {}


  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File, @Query('folder') folder: 'cv' | 'avatar' | 'company' = 'cv') {
    // TODO (Hà): validate định dạng (pdf/doc/png/jpg) và dung lượng
    return this.service.upload(file, folder);
  }

}
