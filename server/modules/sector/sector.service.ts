import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { sectorInfo, sectorFundFlowHistory } from '@server/database/schema';
import { eq, desc, asc, isNotNull } from 'drizzle-orm';
import type { SectorInfo, SectorFundFlowHistory } from '@shared/api.interface';

@Injectable()
export class SectorService {
  private readonly logger = new Logger(SectorService.name);
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}
  async getSectors(type = 'sw_1'): Promise<SectorInfo[]> { const rows = await this.db.select().from(sectorInfo).where(eq(sectorInfo.sectorType, type)).orderBy(desc(sectorInfo.fundFlow)); return rows.map((r) => this.mapSector(r)); }
  async getTopInflow(limit = 10): Promise<SectorInfo[]> { const rows = await this.db.select().from(sectorInfo).where(eq(sectorInfo.sectorType, 'sw_1')).orderBy(desc(sectorInfo.fundFlow)).limit(limit); return rows.map((r) => this.mapSector(r)); }
  async getTopOutflow(limit = 10): Promise<SectorInfo[]> { const rows = await this.db.select().from(sectorInfo).where(eq(sectorInfo.sectorType, 'sw_1')).orderBy(asc(sectorInfo.fundFlow)).limit(limit); return rows.map((r) => this.mapSector(r)); }
  async getSectorByCode(code: string): Promise<SectorInfo> { const rows = await this.db.select().from(sectorInfo).where(eq(sectorInfo.code, code)); if (rows.length === 0) throw new NotFoundException(`板块 ${code} 不存在`); return this.mapSector(rows[0]); }
  async getFundHistory(code: string, days = 7): Promise<SectorFundFlowHistory[]> { const rows = await this.db.select().from(sectorFundFlowHistory).where(eq(sectorFundFlowHistory.sectorCode, code)).orderBy(desc(sectorFundFlowHistory.flowDate)).limit(days); return rows.map((r) => ({ id: r.id, sectorCode: r.sectorCode, flowDate: String(r.flowDate), fundFlow: Number(r.fundFlow), changePercent: Number(r.changePercent) })).reverse(); }
  async getAiTrackSectors() { const rows = await this.db.select().from(sectorInfo).where(isNotNull(sectorInfo.parentSector)).orderBy(sectorInfo.parentSector, desc(sectorInfo.fundFlow)); const groups = new Map<string, SectorInfo[]>(); for (const row of rows) { const parent = row.parentSector as string; if (!groups.has(parent)) groups.set(parent, []); groups.get(parent)!.push(this.mapSector(row)); } return Array.from(groups.entries()).map(([parentSector, sectors]) => ({ parentSector, sectors })); }
  private mapSector(row: typeof sectorInfo.$inferSelect): SectorInfo { const a = row.analysis as any; return { id: row.id, code: row.code, name: row.name, changePercent: Number(row.changePercent), fundFlow: Number(row.fundFlow), sectorType: row.sectorType, parentSector: row.parentSector ?? undefined, stockCount: row.stockCount ?? 0, analysis: a && Object.keys(a).length > 0 ? { policy: a.policy ?? '', fund: a.fund ?? '', news: a.news ?? '', technical: a.technical ?? '' } : undefined }; }
}