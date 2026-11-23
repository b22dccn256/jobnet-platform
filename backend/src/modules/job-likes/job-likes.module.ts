import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobModule } from '../jobs/jobs.module';
import { JobLikeController } from './job-likes.controller';
import { JobLikeService } from './job-likes.service';
import { JobLike, JobLikeSchema } from './schemas/job-likes.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: JobLike.name, schema: JobLikeSchema }]),
    JobModule,
  ],
  controllers: [JobLikeController],
  providers: [JobLikeService],
  exports: [JobLikeService, MongooseModule],
})
export class JobLikeModule {}
