import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { stockIndex, newsMessage } from '@server/database/schema';
import { eq, desc } from 'drizzle-orm';
import type { StockIndex, MarketReport } from '@shared/api.interface';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}
  async getIndices(): Promise<StockIndex[]> {
    const rows = await this.db.select().from(stockIndex).orderBy(stockIndex.code);
    return rows.map((row) => this.mapStockIndex(row));
  }
  async getIndexByCode(code: string): Promise<StockIndex> {
    const rows = await this.db.select().from(stockIndex).where(eq(stockIndex.code, code));
    if (rows.length === 0) throw new NotFoundException(`指数 ${code} 不存在`);
    return this.mapStockIndex(rows[0]);
  }
  async getMarketReports(): Promise<MarketReport[]> {
    const rows = await this.db.select().from(newsMessage).where(eq(newsMessage.category, 'market')).orderBy(desc(newsMessage.newsTime)).limit(20);
    return rows.map((row, index) => ({ id: row.id, timePoint: ['早盘', '午盘', '收盘'][index % 3], title: row.title, summary: row.summary ?? '', sourceType: row.sourceType, reportTime: row.newsTime.toISOString() }));
  }
  private genIntradayData(close: number, prevClose: number, points = 48) {
    const result = [];
    const totalChange = close - prevClose;
    const amplitude = close * 0.015;
    let cumVol = 0, cumAmount = 0;
    for (let i = 0; i < points; i++) {
      const t = i / (points - 1);
      const price = prevClose + totalChange * t + amplitude * 0.5 * Math.sin(t * Math.PI * 3 + i * 0.7);
      const vol = 1000000 + Math.random() * 3000000;
      cumVol += vol; cumAmount += price * vol;
      result.push({ time: `${String(9 + Math.floor(i / 12)).padStart(2, '0')}:${String((i * 5) % 60).padStart(2, '0')}`, price, avgPrice: cumVol > 0 ? cumAmount / cumVol : price, volume: vol });
    }
    result[result.length - 1].price = close;
    return result;
  }
  private genKlineData(lastClose: number, dataDate: string, days = 30) {
    const result = [];
    let prev = lastClose * 0.9;
    const startDate = new Date(dataDate);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(startDate); d.setDate(d.getDate() - i);
      const change = (Math.random() - 0.48) * prev * 0.03;
      const open = prev + (Math.random() - 0.5) * prev * 0.01;
      const close = open + change;
      result.push({ date: d.toISOString().split('T')[0], open, close, high: Math.max(open, close) + Math.random() * prev * 0.01, low: Math.min(open, close) - Math.random() * prev * 0.01, volume: 50000000 + Math.random() * 150000000 });
      prev = close;
    }
    return result;
  }
  private mapStockIndex(row: typeof stockIndex.$inferSelect): StockIndex {
    const close = Number(row.closePrice);
    const prev = row.prevClose != null ? Number(row.prevClose) : close * 0.99;
    return { id: row.id, code: row.code, name: row.name, closePrice: close, changePoint: Number(row.changePoint), changePercent: Number(row.changePercent), openPrice: row.openPrice != null ? Number(row.openPrice) : undefined, prevClose: row.prevClose != null ? Number(row.prevClose) : undefined, highPrice: row.highPrice != null ? Number(row.highPrice) : undefined, lowPrice: row.lowPrice != null ? Number(row.lowPrice) : undefined, volume: row.volume != null ? Number(row.volume) : undefined, amount: row.amount != null ? Number(row.amount) : undefined, historyData: (row.historyData as any[]) ?? [], dataDate: String(row.dataDate), intradayData: this.genIntradayData(close, prev), klineData: this.genKlineData(close, String(row.dataDate)) };
  }
}