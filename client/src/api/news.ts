import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { NewsMessage, NewsCategory } from '@shared/api.interface';

const MOCK_NEWS: NewsMessage[] = [
  { id: 'n1', title: '央行宣布降准0.25个百分点 释放长期资金约5000亿', summary: '央行降准0.25个百分点，释放长期资金约5000亿，利好银行、地产等板块。', category: 'market', sourceType: '官方公告', sourceName: '央行官网', impactLevel: 'high', relatedSectors: '银行,房地产', relatedStocks: '招商银行,万科A', newsTime: '2026-09-24 18:30:00', isSimulated: false },
  { id: 'n2', title: '半导体板块大涨 多只龙头股创历史新高', summary: '半导体板块大涨，龙头股创新高，国产替代加速推进。', category: 'sector_fund', sourceType: '财经媒体', sourceName: '证券时报', impactLevel: 'medium', relatedSectors: '半导体,电子', relatedStocks: '北方华创,中微公司', newsTime: '2026-09-24 15:30:00', isSimulated: false },
  { id: 'n3', title: 'AI算力需求持续爆发 光模块企业订单饱满', summary: 'AI算力需求爆发带动光模块行业，主流厂商订单饱满。', category: 'stock', sourceType: '机构研报', sourceName: '中信建投', impactLevel: 'high', relatedSectors: '通信,电子', relatedStocks: '中际旭创,新易盛', newsTime: '2026-09-24 14:20:00', isSimulated: false },
  { id: 'n4', title: '龙虎榜：机构抢筹盛美上海 游资博弈AI概念股', summary: '机构抢筹半导体龙头，游资活跃于AI概念股。', category: 'dragon_tiger', sourceType: '财经媒体', sourceName: '东方财富', impactLevel: 'medium', relatedSectors: '半导体', relatedStocks: '盛美上海,协创数据', newsTime: '2026-09-24 16:45:00', isSimulated: true },
  { id: 'n5', title: '模拟盘策略今日收益率1.85% 跑赢大盘1.12个百分点', summary: '模拟盘策略今日收益1.85%，跑赢大盘1.12个百分点。', category: 'sim_trade', sourceType: '策略日报', sourceName: '系统生成', impactLevel: 'low', relatedSectors: '', relatedStocks: '', newsTime: '2026-09-24 15:10:00', isSimulated: true },
  { id: 'n6', title: '英伟达发布新一代AI芯片 性能提升3倍', summary: '英伟达发布新一代AI芯片，性能大幅提升，利好算力产业链。', category: 'tech_stock', sourceType: '海外市场', sourceName: '海外媒体', impactLevel: 'high', relatedSectors: '半导体,计算机', relatedStocks: '海光信息,寒武纪', newsTime: '2026-09-24 10:00:00', isSimulated: false },
];
export const getNewsList = async (category?: NewsCategory): Promise<{ items: NewsMessage[]; total: number }> => {
  try { const res = await axiosForBackend.get('/api/news/list', { params: { category } }); return res.data?.data ?? { items: MOCK_NEWS, total: MOCK_NEWS.length }; } catch (e) { logger.warn('getNewsList fallback to mock', e); const filtered = category ? MOCK_NEWS.filter((n) => n.category === category) : MOCK_NEWS; return { items: filtered, total: filtered.length }; }
};