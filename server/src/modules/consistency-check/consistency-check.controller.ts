import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConsistencyCheckService } from './consistency-check.service';
import { CreateCheckRuleDto, ConsistencyCheckDto, UpdateCheckRuleDto } from './dto/create-check.dto';

@Controller('consistency-check')
@UseGuards(JwtAuthGuard)
export class ConsistencyCheckController {
  constructor(private readonly checkService: ConsistencyCheckService) {}

  @Get('rules')
  async getRules(@CurrentUser('id') userId: string) {
    return await this.checkService.getUserRules(userId);
  }

  @Get('rules/defaults')
  async getDefaultRules() {
    return await this.checkService.getDefaultRules();
  }

  @Put('rules/:ruleId')
  async updateRule(
    @CurrentUser('id') userId: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdateCheckRuleDto,
  ) {
    return await this.checkService.updateRule(userId, ruleId, dto);
  }

  @Post('check')
  async performCheck(@Body() dto: ConsistencyCheckDto) {
    return await this.checkService.performCheck(dto);
  }

  @Get('reports')
  async getReports(
    @CurrentUser('id') userId: string,
    @Query('projectId') projectId: string,
    @Query('limit') limit?: number,
  ) {
    return await this.checkService.getReports(projectId, limit || 10);
  }

  @Put('reports/:reportId/review')
  async markReportReviewed(@Param('reportId') reportId: string) {
    return await this.checkService.markReportReviewed(reportId);
  }

  @Delete('reports/:reportId')
  async deleteReport(@Param('reportId') reportId: string) {
    await this.checkService.deleteReport(reportId);
    return { success: true };
  }
}
