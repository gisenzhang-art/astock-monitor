import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { SimTradeService } from './sim-trade.service';
import type { SimAccount, SimPosition, SimTrade, SimReview, TradeSignal, TradeRequest } from '@shared/api.interface';

@Controller('api/sim-trade')
export class SimTradeController {
  constructor(private readonly simTradeService: SimTradeService) {}
  @Get('account') async getAccount(@Req() req: Request): Promise<SimAccount> { return this.simTradeService.getAccount(req.userContext?.userId ?? 'default'); }
  @Get('positions') async getPositions(@Req() req: Request): Promise<SimPosition[]> { const account = await this.simTradeService.getAccount(req.userContext?.userId ?? 'default'); return this.simTradeService.getPositions(account.id); }
  @Get('trades') async getTrades(@Req() req: Request): Promise<SimTrade[]> { const account = await this.simTradeService.getAccount(req.userContext?.userId ?? 'default'); return this.simTradeService.getTrades(account.id); }
  @Get('signals') async getSignals(): Promise<TradeSignal[]> { return this.simTradeService.getSignals(); }
  @Get('reviews') async getReviews(): Promise<SimReview[]> { return this.simTradeService.getReviews(); }
  @Post('trade') async executeTrade(@Req() req: Request, @Body() body: TradeRequest) { return this.simTradeService.executeTrade(req.userContext?.userId ?? 'default', body); }
  @Post('update-prices') async updatePrices(@Req() req: Request) { return this.simTradeService.updatePrices(req.userContext?.userId ?? 'default'); }
  @Post('reset') async resetAccount(@Req() req: Request): Promise<SimAccount> { return this.simTradeService.resetAccount(req.userContext?.userId ?? 'default'); }
}