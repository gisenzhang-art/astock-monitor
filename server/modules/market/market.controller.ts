import { Controller, Get, Param } from '@nestjs/common';
import { MarketService } from './market.service';
import type { StockIndex, MarketReport } from '@shared/api.interface';

@Controller('api/market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}
  @Get('indices') async getIndices(): Promise<StockIndex[]> { return this.marketService.getIndices(); }
  @Get('indices/:code') async getIndexByCode(@Param('code') code: string): Promise<StockIndex> { return this.marketService.getIndexByCode(code); }
  @Get('reports') async getReports(): Promise<MarketReport[]> { return this.marketService.getMarketReports(); }
}
