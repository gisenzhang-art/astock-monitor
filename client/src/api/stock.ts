import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { StockBasic } from '@shared/api.interface';

const genIntraday = (close: number, changePercent: number, points = 48): number[] => {
  const totalChange = close * (changePercent / 100); const prev = close - totalChange; const amplitude = close * 0.018; const result: number[] = [];
  for (let i = 0; i < points; i++) { const t = i / (points - 1); result.push(prev + totalChange * t + amplitude * 0.5 * Math.sin(t * Math.PI * 3 + i * 0.6) + amplitude * 0.3 * (Math.sin(i * 2.1) + Math.cos(i * 1.5)) * 0.5); }
  result[result.length - 1] = close; return result;
};
const STOCK_DATA = [['603501', '韦尔股份', 128.45, 5.23], ['688981', '中芯国际', 58.32, 3.45], ['002371', '北方华创', 298.76, 4.12], ['600584', '长电科技', 42.18, 2.87], ['688012', '中微公司', 156.34, 3.98], ['600036', '招商银行', 35.67, 0.45], ['601318', '中国平安', 48.90, 0.67], ['000858', '五粮液', 156.78, 1.23], ['600519', '贵州茅台', 1678.90, 0.89], ['300750', '宁德时代', 198.45, 2.34], ['002594', '比亚迪', 267.89, 3.12], ['601012', '隆基绿能', 23.45, -1.56], ['002475', '立讯精密', 34.56, 1.78], ['002415', '海康威视', 32.18, 0.98], ['000333', '美的集团', 67.89, 1.45], ['600900', '长江电力', 28.45, 0.34], ['601899', '紫金矿业', 15.67, -0.78], ['600030', '中信证券', 21.34, 0.56], ['601398', '工商银行', 5.67, 0.23], ['600276', '恒瑞医药', 45.67, -0.34], ['300015', '爱尔眼科', 18.90, -1.12], ['000568', '泸州老窖', 198.45, 1.67], ['000725', '京东方A', 4.56, 2.45], ['688111', '金山办公', 267.89, 4.56], ['688041', '海光信息', 56.78, 5.67], ['688256', '寒武纪', 1091.48, -1.05], ['300308', '中际旭创', 895.86, -2.89], ['601138', '工业富联', 61.00, -3.14], ['002371', '北方华创', 653.06, -2.26], ['688082', '盛美上海', 162.80, -2.50]];
export const MOCK_STOCKS: StockBasic[] = STOCK_DATA.map((item, i) => {
  const [code, name, closePrice, changePercent] = item as [string, string, number, number];
  return { id: `stock-${i}`, code, name, closePrice, changePercent, totalMarketCap: 1000 + Math.random() * 5000, turnoverRate: 1 + Math.random() * 5, volume: Math.random() * 1e8, amount: Math.random() * 1e10, sector: i < 10 ? '半导体' : i < 15 ? '新能源' : '其他', subSector: '', isRealData: false, supportPrice: closePrice * 0.92, pressurePrice: closePrice * 1.08, mainFundInflow: (i % 2 === 0 ? 1 : -1) * (5 + Math.random() * 10) * 1e8, mainFundDays: i % 3, intradayData: genIntraday(closePrice, changePercent) };
});
export const getStockRanking = async (type: 'inflow' | 'outflow' = 'inflow'): Promise<StockBasic[]> => {
  try { const res = await axiosForBackend.get(`/api/stock/ranking?type=${type}`); return res.data?.data ?? MOCK_STOCKS; } catch (e) { logger.warn('getStockRanking fallback to mock', e); return [...MOCK_STOCKS].sort((a, b) => type === 'inflow' ? b.mainFundInflow - a.mainFundInflow : a.mainFundInflow - b.mainFundInflow); }
};