import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { ChatRequestDto } from './dto/chatbot.dto';

// Phụ trách: Hà
@ApiTags('chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly service: ChatbotService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Trò chuyện với trợ lý AI tìm việc (Công khai cho mọi vai trò)' })
  chat(@Body() dto: ChatRequestDto) {
    return this.service.chat(dto.message, dto.history);
  }
}
