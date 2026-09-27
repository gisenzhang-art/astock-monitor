import { Controller, Get, Param, Query } from '@nestjs/common';
import { SectorService } from './sector.service';
import type { SectorInfo, SectorFundFlowHistory } from '@shared/api.interface';

@Controller('api/sector')
export class SectorController {
  constructor(private readonly sectorService: SectorService) {}
  @Get() async getSectors(@Query('type') type?: string): Promise<SectorInfo[]> { return this.sectorService.getSectors(type ?? 'sw_1'); }
  @Get('top-inflow') async getTopInflow(@Query('limit') limit?: string): Promise<SectorInfo[]> { return this.sectorService.getTopInflow(limit ? parseInt(limit, 10) : 10); }
  @Get('top-outflow') async getTopOutflow(@Query('limit') limit?: string): Promise<SectorInfo[]> { return this.sectorService.getTopOutflow(limit ? parseInt(limit, 10) : 10); }
  @Get('ai-track/sectors') async getAiTrackSectors() { return this.sectorService.getAiTrackSectors(); }
  @Get('ai-track/fund-flow') async getAiTrackFundFlow(@Query('days') days?: string) { return this.sectorService.getAiTrackFundFlow(days ? parseInt(days, 10) : 7); }
  @Get(':code/fund-history') async getFundHistory(@Param('code') code: string, @Query('days') days?: string): Promise<SectorFundFlowHistory[]> { return this.sectorService.getFundHistory(code, days ? parseInt(days, 10) : 7); }
  @Get(':code') async getSectorByCode(@Param('code') code: string): Promise<SectorInfo> { return this.sectorService.getSectorByCode(code); }
}