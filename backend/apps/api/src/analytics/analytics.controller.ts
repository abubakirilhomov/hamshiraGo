import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(AdminGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('ai-chat')
  async aiChat(
    @Body() body: { messages: { role: string; content: string }[] },
  ) {
    const reply = await this.analyticsService.aiChat(body.messages);
    return { reply };
  }

  @Get('feedback-summary')
  async feedbackSummary() {
    return this.analyticsService.getFeedbackSummary();
  }

  @Get('top-issues')
  async topIssues() {
    return this.analyticsService.getTopIssues();
  }
}
