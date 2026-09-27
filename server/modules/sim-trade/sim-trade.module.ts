import { Module } from '@nestjs/common';
import { SimTradeController } from './sim-trade.controller';
import { SimTradeService } from './sim-trade.service';
@Module({ controllers: [SimTradeController], providers: [SimTradeService] })
export class SimTradeModule {}