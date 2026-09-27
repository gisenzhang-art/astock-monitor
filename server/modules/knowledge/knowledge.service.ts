import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { knowledgeItem } from '@server/database/schema';
import { eq, desc, count, and, sql } from 'drizzle-orm';
import type { KnowledgeItem, ListResponse } from '@shared/api.interface';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}
  async getList(query: { category?: string; keyword?: string; page?: number; pageSize?: number }): Promise<ListResponse<KnowledgeItem>> {
    const { category, keyword, page = 1, pageSize = 20 } = query;
    const offset = (page - 1) * pageSize;
    const conditions = [];
    if (category) conditions.push(eq(knowledgeItem.category, category));
    if (keyword) conditions.push(sql`(${knowledgeItem.title} ILIKE ${`%${keyword}%`} OR COALESCE(${knowledgeItem.content}, '') ILIKE ${`%${keyword}%`})`);
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const countResult = await this.db.select({ count: count() }).from(knowledgeItem).where(whereClause);
    const total = Number(countResult[0]?.count ?? 0);
    const rows = await this.db.select().from(knowledgeItem).where(whereClause).orderBy(desc(knowledgeItem.createdAt)).limit(pageSize).offset(offset);
    return { items: rows.map((row) => this.mapItem(row)), total };
  }
  async getCategories() {
    const rows = await this.db.select({ category: knowledgeItem.category, count: count() }).from(knowledgeItem).groupBy(knowledgeItem.category).orderBy(knowledgeItem.category);
    return rows.map((row) => ({ category: row.category, count: Number(row.count) }));
  }
  async getById(id: string): Promise<KnowledgeItem> {
    const rows = await this.db.select().from(knowledgeItem).where(eq(knowledgeItem.id, id));
    if (rows.length === 0) throw new NotFoundException(`知识库条目 ${id} 不存在`);
    return this.mapItem(rows[0]);
  }
  async getStats() {
    const totalResult = await this.db.select({ count: count() }).from(knowledgeItem);
    const totalItems = Number(totalResult[0]?.count ?? 0);
    return { totalItems, totalCategories: 6, categoryStats: [], studyDays: 89, winRate: 62.5 };
  }
  private mapItem(row: typeof knowledgeItem.$inferSelect): KnowledgeItem {
    return { id: row.id, title: row.title, content: row.content ?? undefined, category: row.category, tags: row.tags ?? undefined, relatedStockCode: row.relatedStockCode ?? undefined, relatedStockName: row.relatedStockName ?? undefined, createdAt: row.createdAt.toISOString() };
  }
}