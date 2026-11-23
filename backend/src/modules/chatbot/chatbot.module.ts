import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { SearchModule } from '../search/search.module';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';

@Module({
  imports: [HttpModule, SearchModule],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
