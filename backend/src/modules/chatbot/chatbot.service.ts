import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ChatbotService {

  constructor(private readonly http: HttpService, private readonly cfg: ConfigService) {}

  async chat(message: string, history: { role: string; content: string }[] = []) {
    const url = `${this.cfg.get('CHATBOT_URL') || 'http://localhost:8000'}/chat`;
    const res = await firstValueFrom(this.http.post(url, { message, history }));
    return res.data;
  }

}
