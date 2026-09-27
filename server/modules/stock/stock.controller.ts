import { Controller, Get, Param, Query } from '@nestjs/common';
import { StockService } from './stock.service';
import type { StockBasic, ListResponse } from '@shared/api.interface';

@Controller('api/stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}
  @Get() async getStocks(@Query('sector') sector?: string, @Query('sortBy') sortBy?: 'changePercent' | 'mainFundInflow' | 'amount', @Query('sortOrder') sortOrder?: 'asc' | 'desc', @Query('limit') limit?: string): Promise<ListResponse<StockBasic>> { return this.stockService.getStocks({ sector, sortBy, sortOrder, limit: limit ? parseInt(limit, 10) : undefined }); }
  @Get('top-inflow') async getTopInflow(@Query('limit') limit?: string): Promise<StockBasic[]> { return this.stockService.getTopInflow(limit ? parseInt(limit, 10) : 30); }
  @Get('top-outflow') async getTopOutflow(@Query('limit') limit?: string): Promise<StockBasic[]> { return this.stockService.getTopOutflow(limit ? parseInt(limit, 10) : 30); }
  @Get('search') async search(@Query('keyword') keyword: string): Promise<StockBasic[]> { return this.stockService.searchStocks(keyword); }
  @Get(':code') async getStockByCode(@Param('code') code: string): Promise<StockBasic> { return this.stockService.getStockByCode(code); }
}
