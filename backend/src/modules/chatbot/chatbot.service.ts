import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SearchService } from '../search/search.service';
import { ChatHistoryItemDto } from './dto/chatbot.dto';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly http: HttpService,
    private readonly cfg: ConfigService,
    private readonly searchService: SearchService,
  ) {}

  async chat(message: string, history: ChatHistoryItemDto[] = []) {
    const baseUrl = this.cfg.get<string>('CHATBOT_URL') || 'http://localhost:8000';
    const url = `${baseUrl.replace(/\/+$/, '')}/chat`;

    try {
      const res = await firstValueFrom(
        this.http.post(url, { message, history }, { timeout: 15000 }),
      );
      return {
        mode: 'flask-llm',
        ...res.data,
      };
    } catch (error) {
      this.logger.warn(
        `Flask chatbot unreachable (${(error as Error).message}). Using search fallback.`,
      );
      const searchRes = await this.searchService.searchJobs(message, {
        q: message,
        page: 1,
        limit: 5,
      });
      const items = searchRes.items || [];
      const reply =
        items.length > 0
          ? `Hiện dịch vụ AI đang tạm bận, tôi tìm nhanh được ${items.length} việc làm liên quan đến "${message}" cho bạn.`
          : `Hiện dịch vụ AI đang tạm bận và chưa tìm thấy việc làm khớp trực tiếp với "${message}". Bạn hãy thử từ khóa ngắn gọn hơn như kỹ năng hoặc địa điểm.`;

      return {
        mode: 'backend-fallback',
        reply,
        filters: { keyword: message },
        jobs: items,
      };
    }
  }
}
