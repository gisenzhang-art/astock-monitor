import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { PlatformModule } from '@lark-apaas/fullstack-nestjs-core';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { ViewModule } from './modules/view/view.module';
import { MarketModule } from './modules/market/market.module';
import { StockModule } from './modules/stock/stock.module';
import { SectorModule } from './modules/sector/sector.module';
import { DragonTigerModule } from './modules/dragon-tiger/dragon-tiger.module';
import { NewsModule } from './modules/news/news.module';
import { SimTradeModule } from './modules/sim-trade/sim-trade.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';

@Module({
  imports: [
    PlatformModule.forRoot(),
    MarketModule,
    StockModule,
    SectorModule,
    DragonTigerModule,
    NewsModule,
    SimTradeModule,
    KnowledgeModule,
    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
