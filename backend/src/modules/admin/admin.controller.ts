import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminService } from './admin.service';

// Phụ trách: Tuấn
@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}


  @Get('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  users(@Query('page') page = 1, @Query('limit') limit = 10) {
    // TODO: RolesGuard(admin)
    return this.service.listUsers(Number(page), Number(limit));
  }

  @Post('jobs/:id/moderate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  moderate(@Param('id') id: string, @Body() body: { approve: boolean; reason?: string }) {
    return this.service.moderateJob(id, body.approve, body.reason);
  }

  @Get('reports')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  report() {
    return this.service.report();
  }

}
