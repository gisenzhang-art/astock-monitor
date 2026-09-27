import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { dragonTiger } from '@server/database/schema';
import { eq, desc, asc, and, gte, lte } from 'drizzle-orm';
import type { DragonTiger, DragonTigerSeat } from '@shared/api.interface';

@Injectable()
export class DragonTigerService {
  private readonly logger = new Logger(DragonTigerService.name);
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}
  async getDragonTigerList(date?: string): Promise<DragonTiger[]> {
    const rows = date ? await this.db.select().from(dragonTiger).where(eq(dragonTiger.tradeDate, date)).orderBy(desc(dragonTiger.tradeDate), desc(dragonTiger.netBuy)).limit(50)
      : await this.db.select().from(dragonTiger).orderBy(desc(dragonTiger.tradeDate), desc(dragonTiger.netBuy)).limit(50);
    return rows.map((row) => this.mapDragonTiger(row));
  }
  async getTopBuy(limit = 10): Promise<DragonTiger[]> {
    const rows = await this.db.select().from(dragonTiger).orderBy(desc(dragonTiger.netBuy)).limit(limit);
    return rows.map((row) => this.mapDragonTiger(row));
  }
  async getTopSell(limit = 10): Promise<DragonTiger[]> {
    const rows = await this.db.select().from(dragonTiger).orderBy(asc(dragonTiger.netBuy)).limit(limit);
    return rows.map((row) => this.mapDragonTiger(row));
  }
  async getById(id: string): Promise<DragonTiger> {
    const rows = await this.db.select().from(dragonTiger).where(eq(dragonTiger.id, id));
    if (rows.length === 0) throw new NotFoundException(`龙虎榜记录 ${id} 不存在`);
    return this.mapDragonTiger(rows[0]);
  }
  async getInstitutionStats() {
    const rows = await this.db.select().from(dragonTiger).orderBy(desc(dragonTiger.tradeDate)).limit(100);
    const instMap = new Map<string, any>();
    for (const row of rows) {
      const seats = (row.seats as DragonTigerSeat[]) ?? [];
      for (const seat of seats) {
        if (!seat.type?.includes('机构') && !seat.name?.includes('机构')) continue;
        const buy = Number(seat.buy) || 0, sell = Number(seat.sell) || 0;
        if (!instMap.has(seat.name)) instMap.set(seat.name, { name: seat.name, totalBuy: 0, totalSell: 0, netBuy: 0, appearCount: 0, sectors: [] });
        const stat = instMap.get(seat.name)!;
        stat.totalBuy += buy; stat.totalSell += sell; stat.netBuy += buy - sell; stat.appearCount += 1;
      }
    }
    return Array.from(instMap.values()).sort((a, b) => b.netBuy - a.netBuy);
  }
  async getRecommendations() {
    const rows = await this.db.select().from(dragonTiger).where(and(gte(dragonTiger.changePercent, '3'), lte(dragonTiger.changePercent, '9.5'))).orderBy(desc(dragonTiger.netBuy)).limit(10);
    return rows.map((row) => this.mapDragonTiger(row)).slice(0, 3).map((item, index) => ({
      id: item.id, stockCode: item.stockCode, stockName: item.stockName, netBuy: item.netBuy,
      changePercent: item.changePercent, probability: Math.max(60, 90 - index * 10),
      institutionTone: '机构资金参与', supportPrice: 10, pressurePrice: 12,
      buyPointAnalysis: `该股净买入${(item.netBuy / 10000).toFixed(0)}万元，涨幅${item.changePercent.toFixed(2)}%`,
      riskWarning: '短期涨幅较大，需警惕获利回吐风险',
    }));
  }
  private mapDragonTiger(row: typeof dragonTiger.$inferSelect): DragonTiger {
    const seatsRaw = (row.seats as DragonTigerSeat[]) ?? [];
    return {
      id: row.id, stockCode: row.stockCode, stockName: row.stockName,
      tradeDate: typeof row.tradeDate === 'string' ? row.tradeDate : String(row.tradeDate),
      netBuy: Number(row.netBuy), buyAmount: Number(row.buyAmount), sellAmount: Number(row.sellAmount),
      changePercent: Number(row.changePercent), reason: row.reason ?? undefined,
      seats: seatsRaw.map((s) => ({ name: s.name ?? '', type: s.type ?? '', buy: Number(s.buy) || 0, sell: Number(s.sell) || 0 })),
      isSimulated: row.isSimulated ?? true,
    };
  }
}