import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

import { AnalyzePrescriptionDto, CheckInteractionsDto } from './dto/ai.dto';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze-prescription')
  async analyzePrescription(
    @Body() dto: AnalyzePrescriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.aiService.analyzePrescription(dto);
  }

  @Post('check-interactions')
  async checkInteractions(
    @Body() dto: CheckInteractionsDto,
    @CurrentUser() user: any,
  ) {
    const interactions = this.aiService.checkDrugInteractions(dto.productIds || []);
    return {
      hasInteractions: interactions.length > 0,
      interactions,
    };
  }
}
