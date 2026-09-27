import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { simAccount, simPosition, simTrade, simReview, tradeSignal, stockBasic } from '@server/database/schema';
import { eq, desc, and } from 'drizzle-orm';
import type { SimAccount, SimPosition, SimTrade, SimReview, TradeSignal, TradeRequest } from '@shared/api.interface';

@Injectable()
export class SimTradeService {
  private readonly logger = new Logger(SimTradeService.name);
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}
  async getAccount(userId = 'default'): Promise<SimAccount> {
    const rows = await this.db.select().from(simAccount).where(eq(simAccount.userId, userId));
    if (rows.length === 0) { const created = await this.db.insert(simAccount).values({ userId, totalAsset: '100000', positionValue: '0', availableCash: '100000', todayProfit: '0', todayProfitPercent: '0', totalProfit: '0', totalProfitPercent: '0', initialCapital: '100000' }).returning(); return this.mapAccount(created[0]); }
    return this.mapAccount(rows[0]);
  }
  async getPositions(accountId: string): Promise<SimPosition[]> { const rows = await this.db.select().from(simPosition).where(eq(simPosition.accountId, accountId)).orderBy(desc(simPosition.marketValue)); return rows.map((r) => this.mapPosition(r)); }
  async getTrades(accountId: string): Promise<SimTrade[]> { const rows = await this.db.select().from(simTrade).where(eq(simTrade.accountId, accountId)).orderBy(desc(simTrade.tradeTime)); return rows.map((r) => this.mapTrade(r)); }
  async getSignals(): Promise<TradeSignal[]> { const rows = await this.db.select().from(tradeSignal).orderBy(desc(tradeSignal.signalTime)).limit(30); return rows.map((r) => this.mapSignal(r)); }
  async getReviews(): Promise<SimReview[]> { const rows = await this.db.select().from(simReview).orderBy(desc(simReview.createdAt)).limit(30); return rows.map((r) => this.mapReview(r)); }
  async resetAccount(userId = 'default'): Promise<SimAccount> {
    const account = await this.getAccount(userId);
    await this.db.transaction(async (tx) => { await tx.delete(simPosition).where(eq(simPosition.accountId, account.id)); await tx.delete(simTrade).where(eq(simTrade.accountId, account.id)); await tx.update(simAccount).set({ totalAsset: '100000', positionValue: '0', availableCash: '100000', todayProfit: '0', todayProfitPercent: '0', totalProfit: '0', totalProfitPercent: '0', initialCapital: '100000' }).where(eq(simAccount.id, account.id)); });
    return this.getAccount(userId);
  }
  async executeTrade(userId: string, dto: TradeRequest): Promise<{ success: boolean; message: string }> {
    const { stockCode, stockName, tradeType, quantity, price, reason } = dto;
    if (quantity <= 0 || price <= 0) throw new BadRequestException('数量和价格必须大于0');
    const amount = price * quantity;
    return this.db.transaction(async (tx) => {
      let accountRows = await tx.select().from(simAccount).where(eq(simAccount.userId, userId));
      if (accountRows.length === 0) { const created = await tx.insert(simAccount).values({ userId, totalAsset: '100000', positionValue: '0', availableCash: '100000', todayProfit: '0', todayProfitPercent: '0', totalProfit: '0', totalProfitPercent: '0', initialCapital: '100000' }).returning(); accountRows = created; }
      const account = accountRows[0]; const availableCash = Number(account.availableCash);
      if (tradeType === 'buy') {
        if (availableCash < amount) throw new BadRequestException('可用资金不足');
        const existing = await tx.select().from(simPosition).where(and(eq(simPosition.accountId, account.id), eq(simPosition.stockCode, stockCode)));
        if (existing.length > 0) { const pos = existing[0]; const newQty = pos.quantity + quantity; const newCost = (Number(pos.costPrice) * pos.quantity + price * quantity) / newQty; await tx.update(simPosition).set({ quantity: newQty, costPrice: newCost.toFixed(4), currentPrice: price.toFixed(4), marketValue: (newQty * price).toFixed(2), profit: ((price - newCost) * newQty).toFixed(2), profitPercent: (newCost > 0 ? ((price - newCost) / newCost) * 100 : 0).toFixed(4), buyReason: reason ?? pos.buyReason }).where(eq(simPosition.id, pos.id)); }
        else { await tx.insert(simPosition).values({ accountId: account.id, stockCode, stockName, quantity, availableQuantity: 0, costPrice: price.toFixed(4), currentPrice: price.toFixed(4), marketValue: amount.toFixed(2), profit: '0', profitPercent: '0', buyReason: reason }); }
        const newCash = availableCash - amount; const newPosVal = Number(account.positionValue) + amount;
        await tx.update(simAccount).set({ availableCash: newCash.toFixed(2), positionValue: newPosVal.toFixed(2), totalAsset: (newCash + newPosVal).toFixed(2) }).where(eq(simAccount.id, account.id));
        await tx.insert(simTrade).values({ accountId: account.id, stockCode, stockName, tradeType: 'buy', quantity, price: price.toFixed(4), amount: amount.toFixed(2), reason });
        return { success: true, message: '买入成功' };
      } else {
        const existing = await tx.select().from(simPosition).where(and(eq(simPosition.accountId, account.id), eq(simPosition.stockCode, stockCode)));
        if (existing.length === 0) throw new BadRequestException('持仓不存在');
        const pos = existing[0];
        if (pos.availableQuantity < quantity) throw new BadRequestException('可用数量不足（T+1规则）');
        const costPrice = Number(pos.costPrice); const profit = (price - costPrice) * quantity; const profitPercent = costPrice > 0 ? ((price - costPrice) / costPrice) * 100 : 0;
        const newQty = pos.quantity - quantity;
        if (newQty <= 0) { await tx.delete(simPosition).where(eq(simPosition.id, pos.id)); }
        else { await tx.update(simPosition).set({ quantity: newQty, availableQuantity: pos.availableQuantity - quantity, currentPrice: price.toFixed(4), marketValue: (newQty * price).toFixed(2), profit: ((price - costPrice) * newQty).toFixed(2), profitPercent: profitPercent.toFixed(4) }).where(eq(simPosition.id, pos.id)); }
        const newCash = availableCash + amount; const newPosVal = Math.max(0, Number(account.positionValue) - quantity * Number(pos.currentPrice));
        await tx.update(simAccount).set({ availableCash: newCash.toFixed(2), positionValue: newPosVal.toFixed(2), totalAsset: (newCash + newPosVal).toFixed(2), totalProfit: (Number(account.totalProfit) + profit).toFixed(2), totalProfitPercent: (((Number(account.totalProfit) + profit) / Number(account.initialCapital)) * 100).toFixed(4) }).where(eq(simAccount.id, account.id));
        const tradeResult = await tx.insert(simTrade).values({ accountId: account.id, stockCode, stockName, tradeType: 'sell', quantity, price: price.toFixed(4), amount: amount.toFixed(2), reason }).returning();
        await tx.insert(simReview).values({ tradeId: tradeResult[0].id, stockCode, stockName, buyPrice: costPrice.toFixed(4), sellPrice: price.toFixed(4), actualProfit: profit.toFixed(2), actualProfitPercent: profitPercent.toFixed(4), buyReason: pos.buyReason, sellReason: reason, followStrategy: true, isLoss: profit < 0, summary: profit < 0 ? `亏损卖出，亏损${Math.abs(profit).toFixed(2)}元` : `盈利卖出，盈利${profit.toFixed(2)}元`, lossReasonType: profit < 0 ? '止损出局' : undefined });
        return { success: true, message: '卖出成功' };
      }
    });
  }
  async updatePrices(userId = 'default'): Promise<{ updated: number; message: string }> {
    const accountRows = await this.db.select().from(simAccount).where(eq(simAccount.userId, userId));
    if (accountRows.length === 0) throw new BadRequestException('账户不存在');
    const account = accountRows[0]; const positions = await this.db.select().from(simPosition).where(eq(simPosition.accountId, account.id));
    if (positions.length === 0) return { updated: 0, message: '无持仓需要更新' };
    const stocks = await this.db.select().from(stockBasic); const priceMap = new Map(stocks.map((s) => [s.code, Number(s.closePrice)]));
    let totalPosVal = 0; let updated = 0;
    for (const pos of positions) { const currentPrice = priceMap.get(pos.stockCode) ?? Number(pos.currentPrice); const costPrice = Number(pos.costPrice); const marketValue = pos.quantity * currentPrice; const profit = (currentPrice - costPrice) * pos.quantity; await this.db.update(simPosition).set({ currentPrice: currentPrice.toFixed(4), marketValue: marketValue.toFixed(2), profit: profit.toFixed(2), profitPercent: (costPrice > 0 ? ((currentPrice - costPrice) / costPrice) * 100 : 0).toFixed(4) }).where(eq(simPosition.id, pos.id)); totalPosVal += marketValue; updated++; }
    const availableCash = Number(account.availableCash); const totalAsset = availableCash + totalPosVal; const initialCapital = Number(account.initialCapital);
    await this.db.update(simAccount).set({ positionValue: totalPosVal.toFixed(2), totalAsset: totalAsset.toFixed(2), totalProfit: (totalAsset - initialCapital).toFixed(2), totalProfitPercent: (initialCapital > 0 ? ((totalAsset - initialCapital) / initialCapital) * 100 : 0).toFixed(4) }).where(eq(simAccount.id, account.id));
    return { updated, message: `已更新 ${updated} 只持仓的当前价格` };
  }
  private mapAccount(row: typeof simAccount.$inferSelect): SimAccount { return { id: row.id, userId: row.userId, totalAsset: Number(row.totalAsset), positionValue: Number(row.positionValue), availableCash: Number(row.availableCash), todayProfit: Number(row.todayProfit), todayProfitPercent: Number(row.todayProfitPercent), totalProfit: Number(row.totalProfit), totalProfitPercent: Number(row.totalProfitPercent), initialCapital: Number(row.initialCapital) }; }
  private mapPosition(row: typeof simPosition.$inferSelect): SimPosition { return { id: row.id, accountId: row.accountId, stockCode: row.stockCode, stockName: row.stockName, quantity: row.quantity, availableQuantity: row.availableQuantity, costPrice: Number(row.costPrice), currentPrice: Number(row.currentPrice), marketValue: Number(row.marketValue), profit: Number(row.profit), profitPercent: Number(row.profitPercent), buyReason: row.buyReason ?? undefined, sellCondition: row.sellCondition ?? undefined, targetPrice: row.targetPrice != null ? Number(row.targetPrice) : undefined, stopLossPrice: row.stopLossPrice != null ? Number(row.stopLossPrice) : undefined, strategyTag: row.strategyTag ?? undefined, buyDate: row.buyDate != null ? String(row.buyDate) : undefined }; }
  private mapTrade(row: typeof simTrade.$inferSelect): SimTrade { return { id: row.id, accountId: row.accountId, stockCode: row.stockCode, stockName: row.stockName, tradeType: row.tradeType as 'buy' | 'sell', quantity: row.quantity, price: Number(row.price), amount: Number(row.amount), tradeTime: row.tradeTime.toISOString(), reason: row.reason ?? undefined, signalSource: row.signalSource ?? undefined }; }
  private mapSignal(row: typeof tradeSignal.$inferSelect): TradeSignal { return { id: row.id, stockCode: row.stockCode, stockName: row.stockName, signalType: row.signalType as 'buy' | 'sell' | 'watch', signalReason: row.signalReason ?? undefined, targetPrice: row.targetPrice != null ? Number(row.targetPrice) : undefined, stopLossPrice: row.stopLossPrice != null ? Number(row.stopLossPrice) : undefined, score: row.score ?? 0, isExecuted: row.isExecuted ?? false, signalTime: row.signalTime.toISOString() }; }
  private mapReview(row: typeof simReview.$inferSelect): SimReview { return { id: row.id, tradeId: row.tradeId ?? undefined, stockCode: row.stockCode, stockName: row.stockName, buyPrice: row.buyPrice != null ? Number(row.buyPrice) : undefined, sellPrice: row.sellPrice != null ? Number(row.sellPrice) : undefined, actualProfit: Number(row.actualProfit), actualProfitPercent: Number(row.actualProfitPercent), buyReason: row.buyReason ?? undefined, sellReason: row.sellReason ?? undefined, followStrategy: row.followStrategy ?? true, lossReasonType: row.lossReasonType ?? undefined, summary: row.summary ?? undefined, isLoss: row.isLoss ?? false }; }
}