import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ChatbotService } from './chatbot.service';
import { ChatRequestDto } from './dto/chatbot.dto';

// Phụ trách: Hà
@ApiTags('chatbot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Candidate, Role.Admin)
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly service: ChatbotService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Trò chuyện với trợ lý AI tìm việc (Flask + Groq / Fallback)' })
  chat(@Body() dto: ChatRequestDto) {
    return this.service.chat(dto.message, dto.history);
  }
}
