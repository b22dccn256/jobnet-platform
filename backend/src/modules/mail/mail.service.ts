import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {

  private transporter: nodemailer.Transporter;

  constructor(cfg: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: cfg.get('MAIL_HOST'),
      port: Number(cfg.get('MAIL_PORT') || 587),
      auth: { user: cfg.get('MAIL_USER'), pass: cfg.get('MAIL_PASS') },
    });
    this.from = cfg.get('MAIL_FROM');
  }
  private from: string;

  send(to: string, subject: string, html: string) {
    return this.transporter.sendMail({ from: this.from, to, subject, html });
  }

}
