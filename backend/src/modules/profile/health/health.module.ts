import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Health, HealthSchema } from './schemas/health.schema';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Health.name, schema: HealthSchema }])],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService, MongooseModule],
})
export class HealthModule {}
