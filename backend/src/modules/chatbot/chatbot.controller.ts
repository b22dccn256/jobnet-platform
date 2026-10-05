import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChatbotService } from './chatbot.service';

// Phụ trách: Hà
@ApiTags('chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly service: ChatbotService) {}


  @Post('chat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  chat(@Body() body: { message: string; history?: { role: string; content: string }[] }) {
    return this.service.chat(body.message, body.history);
  }

}
