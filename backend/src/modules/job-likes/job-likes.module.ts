import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobLike, JobLikeSchema } from './schemas/job-likes.schema';
import { JobLikeService } from './job-likes.service';
import { JobLikeController } from './job-likes.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: JobLike.name, schema: JobLikeSchema }])],
  controllers: [JobLikeController],
  providers: [JobLikeService],
  exports: [JobLikeService, MongooseModule],
})
export class JobLikeModule {}
