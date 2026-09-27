import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { StockIndex, MarketReport } from '@shared/api.interface';

const genIntradayData = (close: number, prevClose: number, points = 48) => {
  const result = []; const totalChange = close - prevClose; const amplitude = close * 0.015;
  let cumVol = 0, cumAmount = 0;
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1); const price = prevClose + totalChange * t + amplitude * 0.5 * Math.sin(t * Math.PI * 3 + i * 0.7);
    const vol = 1000000 + Math.random() * 3000000; cumVol += vol; cumAmount += price * vol;
    result.push({ time: `${String(9 + Math.floor(i / 12)).padStart(2, '0')}:${String((i * 5) % 60).padStart(2, '0')}`, price, avgPrice: cumVol > 0 ? cumAmount / cumVol : price, volume: vol });
  }
  result[result.length - 1].price = close; return result;
};
const genKlineData = (lastClose: number, days = 30) => {
  const result = []; let prev = lastClose * 0.9; const startDate = new Date('2026-09-24');
  for (let i = days - 1; i >= 0; i--) { const d = new Date(startDate); d.setDate(d.getDate() - i); const change = (Math.random() - 0.48) * prev * 0.03; const open = prev + (Math.random() - 0.5) * prev * 0.01; const close = open + change; result.push({ date: d.toISOString().split('T')[0], open, close, high: Math.max(open, close) + Math.random() * prev * 0.01, low: Math.min(open, close) - Math.random() * prev * 0.01, volume: 50000000 + Math.random() * 150000000 }); prev = close; }
  return result;
};
export const MOCK_INDEXES: StockIndex[] = [
  { id: '1', code: '000001', name: '上证指数', closePrice: 3245.67, changePoint: 23.45, changePercent: 0.73, openPrice: 3222.22, prevClose: 3222.22, highPrice: 3256.78, lowPrice: 3210.11, volume: 234567890000, amount: 289000000000, historyData: [], intradayData: genIntradayData(3245.67, 3222.22), klineData: genKlineData(3245.67, 30), dataDate: '2026-09-24' },
  { id: '2', code: '399001', name: '深证成指', closePrice: 10567.89, changePoint: 89.12, changePercent: 0.85, openPrice: 10478.77, prevClose: 10478.77, highPrice: 10600, lowPrice: 10450, volume: 345678900000, amount: 412000000000, historyData: [], intradayData: genIntradayData(10567.89, 10478.77), klineData: genKlineData(10567.89, 30), dataDate: '2026-09-24' },
  { id: '3', code: '399006', name: '创业板指', closePrice: 2156.34, changePoint: 34.56, changePercent: 1.63, openPrice: 2121.78, prevClose: 2121.78, highPrice: 2170, lowPrice: 2115, volume: 156789000000, amount: 198000000000, historyData: [], intradayData: genIntradayData(2156.34, 2121.78), klineData: genKlineData(2156.34, 30), dataDate: '2026-09-24' },
  { id: '4', code: '000300', name: '沪深300', closePrice: 3890.12, changePoint: 28.34, changePercent: 0.73, openPrice: 3861.78, prevClose: 3861.78, highPrice: 3900, lowPrice: 3855, volume: 189000000000, amount: 234000000000, historyData: [], intradayData: genIntradayData(3890.12, 3861.78), klineData: genKlineData(3890.12, 30), dataDate: '2026-09-24' },
  { id: '5', code: 'H30007', name: '芯片产业', closePrice: 4865.23, changePoint: 156.78, changePercent: 3.33, openPrice: 4708.45, prevClose: 4708.45, highPrice: 4920, lowPrice: 4680, volume: 98000000000, amount: 125000000000, historyData: [], intradayData: genIntradayData(4865.23, 4708.45), klineData: genKlineData(4865.23, 30), dataDate: '2026-09-24' },
];
export const MOCK_REPORTS: MarketReport[] = [
  { id: '1', timePoint: '早盘', title: 'A股早盘：三大指数集体高开 半导体领涨', summary: '早盘上证指数高开0.32%，半导体、AI算力板块领涨，北向资金净流入超30亿。', sourceType: '官方公告', reportTime: '2026-09-24 09:45:00' },
  { id: '2', timePoint: '早盘', title: '科技股早盘强势 创业板指涨超1.5%', summary: '科技股全线走强，AI概念持续发酵，创业板指盘中涨幅扩大至1.5%以上。', sourceType: '财经媒体', reportTime: '2026-09-24 10:30:00' },
  { id: '3', timePoint: '午盘', title: '午盘点评：两市成交额突破8000亿 半导体板块领涨', summary: '午间收盘两市成交额突破8000亿，半导体、AI算力、光模块板块涨幅居前。', sourceType: '机构研报', reportTime: '2026-09-24 11:35:00' },
  { id: '4', timePoint: '午盘', title: '北向资金半日净流入超60亿 加仓新能源赛道', summary: '北向资金半日净流入62.3亿元，其中沪股通净流入34.5亿，深股通净流入27.8亿。', sourceType: '财经媒体', reportTime: '2026-09-24 12:00:00' },
  { id: '5', timePoint: '收盘', title: '收盘：上证指数涨0.73% 两市成交额超1.4万亿', summary: '上证指数收盘报3245.67点，涨0.73%；深证成指涨0.85%；创业板指涨1.63%。两市成交额14300亿元。', sourceType: '官方公告', reportTime: '2026-09-24 15:05:00' },
  { id: '6', timePoint: '收盘', title: '龙虎榜解析：机构抢筹半导体龙头 游资博弈AI概念股', summary: '今日龙虎榜显示，机构席位净买入盛美上海等半导体龙头，游资活跃于AI概念股。', sourceType: '小作文', reportTime: '2026-09-24 16:30:00' },
];
export const getMainIndexes = async (): Promise<StockIndex[]> => { try { const res = await axiosForBackend.get('/api/market/indices'); if (Array.isArray(res.data) && res.data.length > 0) return res.data; return MOCK_INDEXES; } catch (e) { logger.warn('getMainIndexes fallback to mock', e); return MOCK_INDEXES; } };
export const getMarketReports = async (): Promise<MarketReport[]> => { try { const res = await axiosForBackend.get('/api/market/reports'); if (Array.isArray(res.data) && res.data.length > 0) return res.data; return MOCK_REPORTS; } catch (e) { logger.warn('getMarketReports fallback to mock', e); return MOCK_REPORTS; } };