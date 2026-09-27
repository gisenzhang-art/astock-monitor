import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { newsMessage } from '@server/database/schema';
import { eq, desc, count, ilike, and, or, sql } from 'drizzle-orm';
import type { NewsMessage, NewsCategory, ListResponse, ImpactLevel } from '@shared/api.interface';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private readonly categoryList = [
    { key: 'market', name: '行情速递', icon: 'trending-up' }, { key: 'sector_fund', name: '板块资金', icon: 'pie-chart' },
    { key: 'stock', name: '个股掘金', icon: 'search' }, { key: 'dragon_tiger', name: '龙虎榜', icon: 'trophy' },
    { key: 'sim_trade', name: '模拟盘', icon: 'play-circle' }, { key: 'tech_stock', name: '科技股', icon: 'cpu' },
  ];
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}
  async getNewsList(query: { category?: string; page?: number; pageSize?: number; keyword?: string }): Promise<ListResponse<NewsMessage>> {
    const { category, page = 1, pageSize = 20, keyword } = query;
    const offset = (page - 1) * pageSize;
    const conditions = [];
    if (category) conditions.push(eq(newsMessage.category, category));
    if (keyword) conditions.push(or(ilike(newsMessage.title, `%${keyword}%`), ilike(sql`COALESCE(${newsMessage.summary}, '')`, `%${keyword}%`)));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const countResult = await this.db.select({ count: count() }).from(newsMessage).where(whereClause);
    const total = Number(countResult[0]?.count ?? 0);
    const rows = await this.db.select().from(newsMessage).where(whereClause).orderBy(desc(newsMessage.newsTime)).limit(pageSize).offset(offset);
    return { items: rows.map((row) => this.mapNews(row)), total };
  }
  getCategories() { return this.categoryList; }
  async getById(id: string): Promise<NewsMessage> {
    const rows = await this.db.select().from(newsMessage).where(eq(newsMessage.id, id));
    if (rows.length === 0) throw new NotFoundException(`消息 ${id} 不存在`);
    return this.mapNews(rows[0]);
  }
  async getRelatedNews(stockCode: string): Promise<NewsMessage[]> {
    const rows = await this.db.select().from(newsMessage).where(or(ilike(sql`COALESCE(${newsMessage.relatedStocks}, '')`, `%${stockCode}%`), ilike(newsMessage.title, `%${stockCode}%`))).orderBy(desc(newsMessage.newsTime)).limit(20);
    return rows.map((row) => this.mapNews(row));
  }
  async getByCategory(category: NewsCategory): Promise<NewsMessage[]> {
    const rows = await this.db.select().from(newsMessage).where(eq(newsMessage.category, category)).orderBy(desc(newsMessage.newsTime)).limit(30);
    return rows.map((row) => this.mapNews(row));
  }
  private mapNews(row: typeof newsMessage.$inferSelect): NewsMessage {
    return { id: row.id, title: row.title, content: row.content ?? undefined, summary: row.summary ?? undefined, category: row.category as NewsCategory, sourceType: row.sourceType, sourceName: row.sourceName ?? undefined, impactLevel: (row.impactLevel as ImpactLevel) ?? 'medium', relatedSectors: row.relatedSectors ?? undefined, relatedStocks: row.relatedStocks ?? undefined, newsTime: row.newsTime.toISOString(), isSimulated: row.isSimulated ?? false };
  }
}