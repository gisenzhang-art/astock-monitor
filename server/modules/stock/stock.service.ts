import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { stockBasic } from '@server/database/schema';
import { eq, desc, asc, or, ilike } from 'drizzle-orm';
import type { StockBasic } from '@shared/api.interface';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}
  async getStocks(query: { sector?: string; sortBy?: string; sortOrder?: 'asc' | 'desc'; limit?: number }): Promise<{ items: StockBasic[]; total: number }> {
    const { sector, sortBy = 'changePercent', sortOrder = 'desc', limit } = query;
    const whereClause = sector ? eq(stockBasic.sector, sector) : undefined;
    const orderFn = sortOrder === 'asc' ? asc : desc;
    const rows = limit ? await this.db.select().from(stockBasic).where(whereClause).orderBy(orderFn(stockBasic[sortBy as keyof typeof stockBasic])).limit(limit) : await this.db.select().from(stockBasic).where(whereClause).orderBy(orderFn(stockBasic[sortBy as keyof typeof stockBasic]));
    return { items: rows.map((r) => this.mapStock(r)), total: rows.length };
  }
  async getStockByCode(code: string): Promise<StockBasic> { const rows = await this.db.select().from(stockBasic).where(eq(stockBasic.code, code)); if (rows.length === 0) throw new NotFoundException(`股票 ${code} 不存在`); return this.mapStock(rows[0]); }
  async getTopInflow(limit = 30): Promise<StockBasic[]> { const rows = await this.db.select().from(stockBasic).orderBy(desc(stockBasic.mainFundInflow)).limit(limit); return rows.map((r) => this.mapStock(r)); }
  async getTopOutflow(limit = 30): Promise<StockBasic[]> { const rows = await this.db.select().from(stockBasic).orderBy(asc(stockBasic.mainFundInflow)).limit(limit); return rows.map((r) => this.mapStock(r)); }
  async searchStocks(keyword: string): Promise<StockBasic[]> { const rows = await this.db.select().from(stockBasic).where(or(ilike(stockBasic.name, `%${keyword}%`), ilike(stockBasic.code, `%${keyword}%`))).orderBy(desc(stockBasic.amount)).limit(50); return rows.map((r) => this.mapStock(r)); }
  private mapStock(row: typeof stockBasic.$inferSelect): StockBasic { return { id: row.id, code: row.code, name: row.name, closePrice: Number(row.closePrice), changePercent: Number(row.changePercent), totalMarketCap: row.totalMarketCap != null ? Number(row.totalMarketCap) : undefined, turnoverRate: row.turnoverRate != null ? Number(row.turnoverRate) : undefined, volume: row.volume != null ? Number(row.volume) : undefined, amount: row.amount != null ? Number(row.amount) : undefined, sector: row.sector ?? undefined, subSector: row.subSector ?? undefined, isRealData: row.isRealData ?? true, supportPrice: row.supportPrice != null ? Number(row.supportPrice) : undefined, pressurePrice: row.pressurePrice != null ? Number(row.pressurePrice) : undefined, mainFundInflow: Number(row.mainFundInflow), mainFundDays: row.mainFundDays ?? 0 }; }
}