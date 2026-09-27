import { Controller, Get, Param, Query } from '@nestjs/common';
import { DragonTigerService } from './dragon-tiger.service';
import type { DragonTiger } from '@shared/api.interface';

@Controller('api/dragon-tiger')
export class DragonTigerController {
  constructor(private readonly dragonTigerService: DragonTigerService) {}
  @Get() async getList(@Query('date') date?: string): Promise<DragonTiger[]> { return this.dragonTigerService.getDragonTigerList(date); }
  @Get('top-buy') async getTopBuy(@Query('limit') limit?: string): Promise<DragonTiger[]> { return this.dragonTigerService.getTopBuy(limit ? parseInt(limit, 10) : 10); }
  @Get('top-sell') async getTopSell(@Query('limit') limit?: string): Promise<DragonTiger[]> { return this.dragonTigerService.getTopSell(limit ? parseInt(limit, 10) : 10); }
  @Get('institutions/active') async getInstitutionStats() { return this.dragonTigerService.getInstitutionStats(); }
  @Get('recommendations') async getRecommendations() { return this.dragonTigerService.getRecommendations(); }
  @Get(':id') async getById(@Param('id') id: string): Promise<DragonTiger> { return this.dragonTigerService.getById(id); }
}