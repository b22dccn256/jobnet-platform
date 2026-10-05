import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  /** TODO: gửi mail việc làm mới phù hợp cho ứng viên (8h sáng mỗi ngày) */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendNewJobsDigest() {
    this.logger.log('Gửi mail việc làm mới cho ứng viên (chưa cài đặt)');
  }
}
