import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze-prescription')
  async analyzePrescription(@Body() dto: {
    imageUrl?: string;
    imageBase64?: string;
    notes?: string;
  }) {
    return this.aiService.analyzePrescription(dto);
  }

  @Post('pharmacist-consult')
  async consultPharmacist(@Body() dto: {
    message: string;
    cartProductIds?: string[];
    userCondition?: string;
  }) {
    return this.aiService.consultPharmacist(dto);
  }

  @Post('check-interactions')
  async checkInteractions(@Body() dto: { productIds: string[] }) {
    const interactions = this.aiService.checkDrugInteractions(dto.productIds || []);
    return {
      hasInteractions: interactions.length > 0,
      interactions,
    };
  }
}
