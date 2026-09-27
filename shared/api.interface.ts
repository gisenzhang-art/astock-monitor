export interface StockIndex {
  id: string; code: string; name: string; closePrice: number; changePoint: number; changePercent: number;
  openPrice?: number; prevClose?: number; highPrice?: number; lowPrice?: number; volume?: number; amount?: number;
  historyData: { date: string; close: number; open?: number; high?: number; low?: number; volume?: number }[];
  intradayData: { time: string; price: number; avgPrice: number; volume?: number }[];
  klineData: { date: string; open: number; close: number; high: number; low: number; volume: number }[];
  dataDate: string;
}
export interface StockBasic {
  id: string; code: string; name: string; closePrice: number; changePercent: number;
  totalMarketCap?: number; turnoverRate?: number; volume?: number; amount?: number;
  sector?: string; subSector?: string; isRealData: boolean;
  supportPrice?: number; pressurePrice?: number; mainFundInflow: number; mainFundDays: number; intradayData?: number[];
}
export interface SectorInfo {
  id: string; code: string; name: string; changePercent: number; fundFlow: number;
  sectorType: string; parentSector?: string; stockCount: number;
  analysis?: { policy: string; fund: string; news: string; technical: string };
}
export interface SectorFundFlowHistory { id: string; sectorCode: string; flowDate: string; fundFlow: number; changePercent: number; }
export interface DragonTigerSeat { name: string; type: string; buy: number; sell: number; }
export interface DragonTiger {
  id: string; stockCode: string; stockName: string; tradeDate: string; netBuy: number;
  buyAmount: number; sellAmount: number; changePercent: number; reason?: string;
  seats: DragonTigerSeat[]; isSimulated: boolean;
}
export type NewsCategory = 'market' | 'sector_fund' | 'stock' | 'dragon_tiger' | 'sim_trade' | 'tech_stock';
export type ImpactLevel = 'high' | 'medium' | 'low';
export interface NewsMessage {
  id: string; title: string; content?: string; summary?: string; category: NewsCategory;
  sourceType: string; sourceName?: string; impactLevel: ImpactLevel;
  relatedSectors?: string; relatedStocks?: string; newsTime: string; isSimulated: boolean;
}
export interface SimAccount {
  id: string; userId: string; totalAsset: number; positionValue: number; availableCash: number;
  todayProfit: number; todayProfitPercent: number; totalProfit: number; totalProfitPercent: number; initialCapital: number;
}
export interface SimPosition {
  id: string; accountId: string; stockCode: string; stockName: string; quantity: number; availableQuantity: number;
  costPrice: number; currentPrice: number; marketValue: number; profit: number; profitPercent: number;
  buyReason?: string; sellCondition?: string; targetPrice?: number; stopLossPrice?: number; strategyTag?: string; buyDate?: string;
}
export interface SimTrade {
  id: string; accountId: string; stockCode: string; stockName: string; tradeType: 'buy' | 'sell';
  quantity: number; price: number; amount: number; tradeTime: string; reason?: string; signalSource?: string;
}
export interface SimReview {
  id: string; tradeId?: string; stockCode: string; stockName: string; buyPrice?: number; sellPrice?: number;
  actualProfit: number; actualProfitPercent: number; buyReason?: string; sellReason?: string;
  followStrategy: boolean; lossReasonType?: string; summary?: string; isLoss: boolean;
}
export interface TradeSignal {
  id: string; stockCode: string; stockName: string; signalType: 'buy' | 'sell' | 'watch';
  signalReason?: string; targetPrice?: number; stopLossPrice?: number; score: number; isExecuted: boolean; signalTime: string;
}
export interface KnowledgeItem {
  id: string; title: string; content?: string; category: string; tags?: string;
  relatedStockCode?: string; relatedStockName?: string; createdAt: string;
}
export interface MarketReport { id: string; timePoint: string; title: string; summary: string; sourceType: string; reportTime: string; }
export interface ApiResponse<T> { data: T; message?: string; code?: number; }
export interface ListResponse<T> { items: T[]; total: number; }
export interface TradeRequest { stockCode: string; stockName: string; tradeType: 'buy' | 'sell'; quantity: number; price: number; reason?: string; }