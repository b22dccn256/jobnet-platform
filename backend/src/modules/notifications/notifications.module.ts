import { Module } from '@nestjs/common';
import { CompanyFollowModule } from '../company-follows/company-follows.module';
import { JobModule } from '../jobs/jobs.module';
import { MailModule } from '../mail/mail.module';
import { UserModule } from '../users/users.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [UserModule, JobModule, CompanyFollowModule, MailModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
