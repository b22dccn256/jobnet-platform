import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Connection } from 'mongoose';

const DB_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  @ApiOperation({ summary: 'Kiểm tra trạng thái dịch vụ và kết nối MongoDB' })
  check() {
    return {
      status: 'ok',
      service: 'jobnet-backend',
      database: DB_STATES[this.connection.readyState] || 'unknown',
      timestamp: new Date().toISOString(),
    };
  }
}
