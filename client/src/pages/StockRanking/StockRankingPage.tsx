import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Medal, TrendingUp, TrendingDown } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { stockApi } from '@client/src/api';
import MiniSparkline from '@client/src/components/MiniSparkline';
import { formatPrice, formatPercent, formatAmount, formatVolume, formatSignAmount, getUpDownClass, getUpDownBgClass } from '@client/src/utils/format';
import type { StockBasic } from '@shared/api.interface';

type SortKey = 'changePercent' | 'mainFundInflow' | 'volume';
const SORT_OPTIONS: { key: SortKey; label: string }[] = [{ key: 'changePercent', label: '按涨跌幅' }, { key: 'mainFundInflow', label: '按资金额' }, { key: 'volume', label: '按成交量' }];
const NEWS_IMPACTS = ['利好', '利空', '中性'];

interface SectorNewsItem { content: string; source: string; impact: '利好' | '利空' | '中性'; date: string; }
interface SectorData { name: string; shortName: string; news: SectorNewsItem[]; fundLogic: string; leaderUp: { name: string; change: number }[]; leaderDown: { name: string; change: number }[]; sectorChange: number; northFlow: number; }

const SECTOR_DATA_POOL: SectorData[] = [
  { name: '半导体/存储', shortName: '半导体', sectorChange: -3.10, northFlow: -28.5, news: [{ content: '电子板块大跌超3%，兆易创新、德明利、华天科技跌停，50余股跌超10%，前期存储涨价链获利盘集中兑现', source: '金融界', impact: '利空', date: '09-24' }, { content: 'Omdia数据显示Q2全球半导体营收破4250亿美元，环比+31.4%，但股价已提前反应利好', source: '券商中国', impact: '中性', date: '09-24' }], fundLogic: '半导体板块今日重挫，存储芯片产业链获利盘集中兑现，高位科技筹码松动。北向资金大幅流出半导体板块，机构减仓明显，短期需警惕进一步回调风险。', leaderUp: [{ name: '盈方微', change: 3.25 }, { name: '东芯股份', change: 1.86 }], leaderDown: [{ name: '兆易创新', change: -10.02 }, { name: '德明利', change: -10.00 }, { name: '华天科技', change: -9.98 }] },
  { name: 'AI算力/CPO', shortName: 'AI算力', sectorChange: -3.00, northFlow: -35.2, news: [{ content: '通信设备板块跌3.00%，算力硬件集体退潮，中际旭创跌2.89%、新易盛跌3.59%、天孚通信跌2.71%', source: 'Wind', impact: '利空', date: '09-24' }, { content: 'CPO光模块板块高位回调，前期涨幅较大的算力标的遭资金集中抛售', source: '财经媒体', impact: '利空', date: '09-24' }], fundLogic: 'AI算力与光模块板块今日重挫，算力硬件方向集体退潮。此前连续上涨积累大量获利盘，叠加长假前避险情绪，高位筹码松动明显，资金从成长方向切向防御。', leaderUp: [{ name: '通宇通讯', change: 2.15 }, { name: '华工科技', change: 0.88 }], leaderDown: [{ name: '新易盛', change: -3.59 }, { name: '中际旭创', change: -2.89 }, { name: '天孚通信', change: -2.71 }] },
  { name: 'PCB', shortName: 'PCB', sectorChange: -4.29, northFlow: -12.8, news: [{ content: '电子元件板块领跌4.29%，胜宏科技跌4.75%、沪电股份跌3.16%，高位科技筹码兑现', source: 'Wind', impact: '利空', date: '09-24' }, { content: 'PCB板块前期涨幅较大，算力硬件链条整体退潮带动板块回调', source: '证券时报', impact: '利空', date: '09-24' }], fundLogic: 'PCB板块领跌电子元件方向，高位科技筹码集中兑现。作为算力硬件上游，PCB板块与AI算力链高度联动，今日随算力板块整体退潮，主力资金净流出明显。', leaderUp: [{ name: '世运电路', change: 1.23 }, { name: '依顿电子', change: 0.56 }], leaderDown: [{ name: '胜宏科技', change: -4.75 }, { name: '沪电股份', change: -3.16 }, { name: '深南电路', change: -2.88 }] },
  { name: '液冷', shortName: '液冷', sectorChange: -3.85, northFlow: -8.6, news: [{ content: '英维克跌6.58%，主力净流出居前，液冷板块随算力链整体退潮', source: 'Wind', impact: '利空', date: '09-24' }, { content: '算力产业链全线下挫，液冷作为算力配套方向同步回调', source: '财经媒体', impact: '利空', date: '09-24' }], fundLogic: '液冷板块随算力链整体退潮，英维克等龙头股主力资金净流出居前。液冷作为算力基础设施配套板块，与AI算力方向高度联动，短期受算力板块情绪压制明显。', leaderUp: [{ name: '同飞股份', change: 0.92 }, { name: '高澜股份', change: 0.45 }], leaderDown: [{ name: '英维克', change: -6.58 }, { name: '申菱环境', change: -4.32 }, { name: '曙光数创', change: -3.86 }] },
  { name: '银行/红利', shortName: '银行红利', sectorChange: 0.31, northFlow: 18.5, news: [{ content: '银行板块护盘走强涨0.31%，煤炭涨0.63%，建行、中行、工行领涨，中特估红利破净股获避险资金抱团', source: '金融界', impact: '利好', date: '09-24' }, { content: '中国证券网：市场避险情绪升温，高股息红利资产获资金青睐', source: '中国证券网', impact: '利好', date: '09-24' }], fundLogic: '银行与红利板块今日逆市护盘，成为少数收红的板块。中秋国庆长假临近，资金避险情绪升温，中特估红利破净股获避险资金抱团，北向资金净流入银行板块明显。', leaderUp: [{ name: '建设银行', change: 1.25 }, { name: '中国银行', change: 1.02 }, { name: '工商银行', change: 0.88 }], leaderDown: [{ name: '宁波银行', change: -0.56 }, { name: '招商银行', change: -0.32 }] },
  { name: '黄金/有色', shortName: '黄金有色', sectorChange: -3.53, northFlow: -22.3, news: [{ content: '有色金属板块大跌3.53%，黄金概念跌4.07%，美元及实际利率扰动叠加获利兑现', source: '东方财富', impact: '利空', date: '09-24' }, { content: '国际金价高位回落，有色金属板块跟随大宗商品集体调整', source: 'Wind', impact: '利空', date: '09-24' }], fundLogic: '黄金与有色金属板块今日大跌，受美元走强及实际利率高位扰动，叠加前期获利盘集中兑现。大宗商品整体走弱，资源股遭遇资金抛售，北向资金大幅流出有色板块。', leaderUp: [{ name: '赤峰黄金', change: 1.05 }, { name: '湖南黄金', change: 0.68 }], leaderDown: [{ name: '山东黄金', change: -5.23 }, { name: '紫金矿业', change: -4.15 }, { name: '中金黄金', change: -3.88 }] },
  { name: '军工', shortName: '军工', sectorChange: -1.25, northFlow: -5.6, news: [{ content: '军工板块分化，雷科防务涨停获机构+北向共振买入，为少数逆势亮点', source: '证券时报·数据宝', impact: '利好', date: '09-24' }, { content: '军工整体随大盘调整，但部分细分领域获资金关注', source: '财经媒体', impact: '中性', date: '09-24' }], fundLogic: '军工板块今日分化，整体随大盘调整，但雷科防务等少数个股获机构与北向资金共振买入，成为逆势亮点。板块内部结构分化明显，需精选个股。', leaderUp: [{ name: '雷科防务', change: 10.03 }, { name: '航天晨光', change: 3.56 }, { name: '中航沈飞', change: 1.22 }], leaderDown: [{ name: '中国卫星', change: -4.25 }, { name: '航发动力', change: -2.86 }] },
  { name: '医药', shortName: '医药', sectorChange: -1.85, northFlow: -15.2, news: [{ content: '医药生物板块小幅调整跌1.85%，CRO领跌，创新药相对抗跌', source: 'Wind', impact: '利空', date: '09-24' }, { content: '医药板块整体走弱，CXO方向回调幅度较大，创新药及医疗器械相对稳健', source: '财经媒体', impact: '中性', date: '09-24' }], fundLogic: '医药生物板块今日小幅调整，CRO方向领跌，创新药相对抗跌。医药板块整体处于震荡格局，资金在细分领域间轮动，北向资金小幅流出。关注三季报业绩预期。', leaderUp: [{ name: '恒瑞医药', change: 0.85 }, { name: '药明康德', change: 0.52 }], leaderDown: [{ name: '泰格医药', change: -4.25 }, { name: '康龙化成', change: -3.86 }, { name: '昭衍新药', change: -3.52 }] },
  { name: '消费', shortName: '消费', sectorChange: -2.10, northFlow: -18.8, news: [{ content: '食品饮料板块震荡走弱跌2.10%，白酒权重股拖累指数，中秋国庆旺季预期阶段性兑现', source: 'Wind', impact: '利空', date: '09-24' }, { content: '消费板块整体走弱，白酒、食品加工等方向同步回调', source: '财经媒体', impact: '利空', date: '09-24' }], fundLogic: '消费板块今日震荡走弱，白酒权重股拖累指数。中秋国庆旺季预期阶段性兑现，资金从消费方向流出转向防御。北向资金净流出食品饮料板块，短期需观望。', leaderUp: [{ name: '重庆啤酒', change: 0.76 }, { name: '伊利股份', change: 0.35 }], leaderDown: [{ name: '贵州茅台', change: -2.35 }, { name: '五粮液', change: -2.68 }, { name: '泸州老窖', change: -2.45 }] },
  { name: '新能源', shortName: '新能源', sectorChange: -2.85, northFlow: -25.6, news: [{ content: '电力设备板块跌2.85%，光伏领跌，新能源车相对抗跌，板块内部分化明显', source: 'Wind', impact: '利空', date: '09-24' }, { content: '新能源板块整体走弱，光伏产业链跌幅居前，锂电及新能源车相对抗跌', source: '财经媒体', impact: '利空', date: '09-24' }], fundLogic: '新能源板块今日分化调整，光伏方向领跌，新能源车相对抗跌。光伏产业链价格竞争仍存压力，而新能源车销量数据相对较好。资金从光伏流出，关注三季报业绩。', leaderUp: [{ name: '比亚迪', change: 0.65 }, { name: '宁德时代', change: 0.28 }], leaderDown: [{ name: '隆基绿能', change: -5.25 }, { name: '通威股份', change: -4.86 }, { name: '晶澳科技', change: -4.52 }] },
];

const KLINE_PATTERNS_UP = ['放量阳线突破', '缩量回踩后回升', '强势涨停突破', '均线多头排列', '低位放量反弹'];
const KLINE_PATTERNS_DOWN = ['高位放量阴线', '缩量回调', '破位下跌', '均线空头排列', '放量跌停'];

const StockRankingPage = () => {
  const [stocks, setStocks] = useState<StockBasic[]>([]);
  const [tabType, setTabType] = useState<'inflow' | 'outflow'>('inflow');
  const [sortKey, setSortKey] = useState<SortKey>('mainFundInflow');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reasonMap, setReasonMap] = useState<Record<string, { loading: boolean; loaded: boolean }>>({});

  useEffect(() => {
    let active = true;
    const load = async () => { try { const data = await stockApi.getStockRanking(tabType, 30); if (active) setStocks(data); } catch (e) { logger.error('加载个股排名失败', e); } };
    load();
    return () => { active = false; };
  }, [tabType]);

  const sortedStocks = useMemo(() => { return [...stocks].sort((a, b) => { if (tabType === 'inflow') { return b[sortKey] - a[sortKey]; } return a[sortKey] - b[sortKey]; }); }, [stocks, sortKey, tabType]);
  const getMedalStyle = (rank: number) => { if (rank === 1) return 'bg-gradient-to-r from-yellow-500/30 to-yellow-600/20 text-yellow-400 border-yellow-500/40'; if (rank === 2) return 'bg-gradient-to-r from-gray-300/30 to-gray-400/20 text-gray-300 border-gray-400/40'; if (rank === 3) return 'bg-gradient-to-r from-orange-600/30 to-orange-700/20 text-orange-400 border-orange-600/40'; return ''; };
  const getImpactLabel = (idx: number) => NEWS_IMPACTS[idx % 3];
  const getImpactClass = (impact: string) => { if (impact === '利好') return 'bg-[#f85149]/10 text-[#f85149] border-[#f85149]/30'; if (impact === '利空') return 'bg-[#3fb950]/10 text-[#3fb950] border-[#3fb950]/30'; return 'bg-[#8b949e]/10 text-[#8b949e] border-[#30363d]'; };
  const getSourceBadgeClass = (source: string) => { if (source === '公司公告' || source.includes('证券') || source.includes('金融')) return 'bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/30'; if (source === '财经媒体' || source === 'Wind' || source.includes('东方财富') || source.includes('券商')) return 'bg-[#d2a8ff]/15 text-[#d2a8ff] border-[#d2a8ff]/30'; return 'bg-[#8b949e]/15 text-[#8b949e] border-[#30363d]'; };
  const getSectorData = (idx: number): SectorData => { return SECTOR_DATA_POOL[idx % SECTOR_DATA_POOL.length]; };
  const getKlinePattern = (idx: number, isUp: boolean): string => { const patterns = isUp ? KLINE_PATTERNS_UP : KLINE_PATTERNS_DOWN; return patterns[idx % patterns.length]; };
  const getBigOrderRatio = (idx: number, isUp: boolean): number => { const base = 25 + (idx % 20); return isUp ? base : base + 5; };
  const getConsecutiveDays = (stock: StockBasic, idx: number): number => { const base = Math.abs(stock.mainFundDays) || 1; return base + (idx % 4); };

  const handleReasonToggle = (stockId: string) => {
    const current = reasonMap[stockId];
    if (current?.loading) return;
    if (current?.loaded) { setReasonMap((prev) => { const next = { ...prev }; delete next[stockId]; return next; }); return; }
    setReasonMap((prev) => ({ ...prev, [stockId]: { loading: true, loaded: false } }));
    setTimeout(() => { setReasonMap((prev) => { if (!prev[stockId]?.loading) return prev; return { ...prev, [stockId]: { loading: false, loaded: true } }; }); setExpandedId(stockId); }, 1500);
  };

  return (
    <div className="space-y-3">
      <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <button onClick={() => setTabType('inflow')} className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${tabType === 'inflow' ? 'bg-[#f85149]/15 text-[#f85149] border border-[#f85149]/30' : 'text-[#8b949e] hover:bg-[#30363d]/40 border border-transparent'}`}>净流入 Top30</button>
            <button onClick={() => setTabType('outflow')} className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${tabType === 'outflow' ? 'bg-[#3fb950]/15 text-[#3fb950] border border-[#3fb950]/30' : 'text-[#8b949e] hover:bg-[#30363d]/40 border border-transparent'}`}>净流出 Top30</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8b949e]">排序方式：</span>
            {SORT_OPTIONS.map((opt) => (<button key={opt.key} onClick={() => setSortKey(opt.key)} className={`px-2.5 py-1 text-xs rounded ${sortKey === opt.key ? 'bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/30' : 'text-[#8b949e] hover:bg-[#30363d]/40 border border-transparent'}`}>{opt.label}</button>))}
          </div>
        </div>
      </div>
      <div className="bg-[#1c2128] border border-[#30363d] rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#161b22] sticky top-0 z-10">
              <tr className="text-[#8b949e] text-xs">
                <th className="px-3 py-2.5 text-left font-medium w-12">排名</th>
                <th className="px-3 py-2.5 text-left font-medium">股票名称</th>
                <th className="px-3 py-2.5 text-left font-medium">代码</th>
                <th className="px-3 py-2.5 text-right font-medium">最新价</th>
                <th className="px-3 py-2.5 text-right font-medium">涨跌幅</th>
                <th className="px-3 py-2.5 text-right font-medium">近3日成交量</th>
                <th className="px-3 py-2.5 text-right font-medium">近3日涨幅</th>
                <th className="px-3 py-2.5 text-right font-medium">主力净流入</th>
                <th className="px-3 py-2.5 text-right font-medium">支撑位</th>
                <th className="px-3 py-2.5 text-center font-medium">资金动向</th>
                <th className="px-3 py-2.5 text-center font-medium">消息影响</th>
                <th className="px-3 py-2.5 text-center font-medium">检索原因</th>
                <th className="px-3 py-2.5 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {sortedStocks.map((stock, idx) => {
                const rank = idx + 1; const isExpanded = expandedId === stock.id; const impact = getImpactLabel(idx); const fundDays = stock.mainFundDays; const fundPositive = fundDays > 0;
                return (
                  <React.Fragment key={stock.id}>
                    <tr className={`border-t border-[#30363d] hover:bg-[#30363d]/20 cursor-pointer transition-colors ${rank <= 3 ? getMedalStyle(rank) : ''}`} onClick={() => setExpandedId(isExpanded ? null : stock.id)}>
                      <td className="px-3 py-2.5"><div className="flex items-center gap-1">{rank <= 3 ? (<Medal size={16} className={rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : 'text-orange-400'} />) : null}<span className={`font-medium ${rank <= 3 ? '' : 'text-[#8b949e]'}`}>{rank}</span></div></td>
                      <td className="px-3 py-2.5"><div className="flex items-center gap-2"><span className="font-medium">{stock.name}</span>{stock.intradayData && stock.intradayData.length > 0 && (<MiniSparkline data={stock.intradayData} width={80} height={30} />)}</div></td>
                      <td className="px-3 py-2.5 text-[#8b949e] font-mono text-xs">{stock.code}</td>
                      <td className={`px-3 py-2.5 text-right font-medium ${getUpDownClass(stock.changePercent)}`}>{formatPrice(stock.closePrice)}</td>
                      <td className={`px-3 py-2.5 text-right font-medium ${getUpDownClass(stock.changePercent)}`}>{formatPercent(stock.changePercent)}</td>
                      <td className="px-3 py-2.5 text-right text-[#e6edf3]">{formatVolume(stock.volume)}</td>
                      <td className={`px-3 py-2.5 text-right ${getUpDownClass(stock.changePercent * 1.5)}`}>{formatPercent(stock.changePercent * 1.5)}</td>
                      <td className={`px-3 py-2.5 text-right font-medium ${getUpDownClass(stock.mainFundInflow)}`}>{formatSignAmount(stock.mainFundInflow)}</td>
                      <td className="px-3 py-2.5 text-right text-[#8b949e]">{formatPrice(stock.supportPrice)}</td>
                      <td className="px-3 py-2.5 text-center"><div className="inline-flex items-center gap-1 text-xs">{fundPositive ? (<ArrowUp size={12} className="text-[#f85149]" />) : (<ArrowDown size={12} className="text-[#3fb950]" />)}<span className={fundPositive ? 'text-[#f85149]' : 'text-[#3fb950]'}>{Math.abs(fundDays)}日</span></div></td>
                      <td className="px-3 py-2.5 text-center"><span className={`text-[10px] px-1.5 py-0.5 rounded border ${getImpactClass(impact)}`}>{impact}</span></td>
                      <td className="px-3 py-2.5 text-center"><button onClick={(e) => { e.stopPropagation(); handleReasonToggle(stock.id); }} className={`text-xs px-2 py-1 rounded border transition-colors ${reasonMap[stock.id]?.loading ? 'text-[#8b949e] border-[#30363d] cursor-not-allowed' : reasonMap[stock.id]?.loaded ? 'bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/30 hover:bg-[#58a6ff]/25' : 'text-[#58a6ff] border-[#58a6ff]/40 hover:bg-[#58a6ff]/10'}`} disabled={reasonMap[stock.id]?.loading}>{reasonMap[stock.id]?.loading ? '分析中...' : reasonMap[stock.id]?.loaded ? '✓ 深度分析' : '🔍深度分析'}</button></td>
                      <td className="px-3 py-2.5">{isExpanded ? (<ChevronUp size={14} className="text-[#8b949e]" />) : (<ChevronDown size={14} className="text-[#8b949e]" />)}</td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-[#0d1117] border-t border-[#30363d]">
                        <td colSpan={13} className="px-4 py-3">
                          {reasonMap[stock.id]?.loading ? (
                            <div className="py-6 text-center"><div className="inline-flex items-center gap-2 text-xs text-[#58a6ff]"><div className="w-3 h-3 border-2 border-[#58a6ff]/30 border-t-[#58a6ff] rounded-full animate-spin"></div><span>深度分析加载中，正在聚合消息面/资金面/技术面数据...</span></div></div>
                          ) : (
                            <>
                              <div className="text-[11px] text-[#8b949e] mb-3 pb-2 border-b border-[#30363d] flex items-center gap-4 flex-wrap">
                                <span className="text-[#e6edf3] font-medium">📅 2026-09-24 大盘概览</span>
                                <span>沪指 <span className="text-[#3fb950]">-1.22%</span> 报3888.37</span>
                                <span>创业板指 <span className="text-[#3fb950]">-2.68%</span> 报3288.95</span>
                                <span>两市成交约1.7万亿（缩量1140亿）</span>
                                <span>逾4300只个股收跌</span>
                                <span className="text-[#8b949e]">所属板块：<span className="text-[#e6edf3]">{getSectorData(idx).name}</span></span>
                              </div>
                              <div className="grid grid-cols-4 gap-3 text-xs">
                                <div className="bg-[#1c2128] border border-[#f85149]/20 rounded-lg p-3">
                                  <div className="flex items-center gap-1.5 mb-2.5 pb-1.5 border-b border-[#30363d]"><span className="w-1.5 h-3.5 bg-[#f85149] rounded-sm"></span><span className="text-sm font-semibold text-[#f85149]">资金面</span></div>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between"><span className="text-[#8b949e]">主力净流入</span><span className={`font-medium ${getUpDownClass(stock.mainFundInflow)}`}>{formatSignAmount(stock.mainFundInflow)}</span></div>
                                    {reasonMap[stock.id]?.loaded ? (<><div className="flex items-center justify-between"><span className="text-[#8b949e]">北向动向</span><span className={getSectorData(idx).northFlow > 0 ? 'text-[#f85149]' : 'text-[#3fb950]'}>{getSectorData(idx).northFlow > 0 ? '+' : ''}{getSectorData(idx).northFlow.toFixed(1)}亿</span></div><div className="flex items-center justify-between"><span className="text-[#8b949e]">大单占比</span><span className="text-[#e6edf3]">{getBigOrderRatio(idx, fundPositive).toFixed(1)}%</span></div></>) : (<><div className="flex items-center justify-between"><span className="text-[#8b949e]">北向动向</span><span className="text-[#8b949e]">点击深度分析查看</span></div><div className="flex items-center justify-between"><span className="text-[#8b949e]">大单占比</span><span className="text-[#8b949e]">点击深度分析查看</span></div></>)}
                                    <div className="flex items-center justify-between"><span className="text-[#8b949e]">连续{fundPositive ? '流入' : '流出'}</span><span className={fundPositive ? 'text-[#f85149]' : 'text-[#3fb950]'}>{getConsecutiveDays(stock, idx)}日</span></div>
                                  </div>
                                </div>
                                <div className="bg-[#1c2128] border border-[#d2a8ff]/20 rounded-lg p-3">
                                  <div className="flex items-center gap-1.5 mb-2.5 pb-1.5 border-b border-[#30363d]"><span className="w-1.5 h-3.5 bg-[#d2a8ff] rounded-sm"></span><span className="text-sm font-semibold text-[#d2a8ff]">消息面</span></div>
                                  <div className="space-y-2">
                                    {reasonMap[stock.id]?.loaded ? (getSectorData(idx).news.map((msg, mi) => (<div key={mi} className="space-y-1"><div className="flex items-center gap-1"><span className={`text-[9px] px-1 py-0.5 rounded border ${getSourceBadgeClass(msg.source)}`}>{msg.source}</span><span className={`text-[9px] px-1 py-0.5 rounded border ${getImpactClass(msg.impact)}`}>{msg.impact}</span><span className="text-[9px] text-[#8b949e]">{msg.date}</span></div><div className="text-[11px] text-[#e6edf3] leading-relaxed">{msg.content}</div></div>))) : (<><div className="space-y-1"><div className="flex items-center gap-1"><span className={`text-[9px] px-1 py-0.5 rounded border ${getImpactClass(impact)}`}>{impact}</span><span className="text-[9px] text-[#8b949e]">板块消息</span></div><div className="text-[11px] text-[#e6edf3] leading-relaxed">{getSectorData(idx).name}板块今日{getSectorData(idx).sectorChange > 0 ? '走强' : '走弱'}</div></div><div className="space-y-1"><div className="flex items-center gap-1"><span className="text-[9px] px-1 py-0.5 rounded border bg-[#8b949e]/10 text-[#8b949e] border-[#30363d]">中性</span><span className="text-[9px] text-[#8b949e]">个股消息</span></div><div className="text-[11px] text-[#e6edf3] leading-relaxed">当日无重大消息面催化，随板块波动</div></div></>)}
                                  </div>
                                </div>
                                <div className="bg-[#1c2128] border border-[#3fb950]/20 rounded-lg p-3">
                                  <div className="flex items-center gap-1.5 mb-2.5 pb-1.5 border-b border-[#30363d]"><span className="w-1.5 h-3.5 bg-[#3fb950] rounded-sm"></span><span className="text-sm font-semibold text-[#3fb950]">技术面</span></div>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between"><span className="text-[#8b949e]">K线形态</span><span className="text-[#e6edf3] text-right">{getKlinePattern(idx, fundPositive)}</span></div>
                                    <div className="flex items-center justify-between"><span className="text-[#8b949e]">支撑位</span><span className="text-[#3fb950] font-medium">{formatPrice(stock.supportPrice)}</span></div>
                                    <div className="flex items-center justify-between"><span className="text-[#8b949e]">压力位</span><span className="text-[#f85149] font-medium">{formatPrice(stock.pressurePrice)}</span></div>
                                    <div className="flex items-center justify-between"><span className="text-[#8b949e]">5日均线</span><span className="text-[#e6edf3]">{formatPrice(stock.closePrice * (fundPositive ? 0.985 : 1.012))}</span></div>
                                    <div className="flex items-center justify-between"><span className="text-[#8b949e]">成交量</span><span className="text-[#e6edf3]">{fundPositive ? '放量' : '缩量'}</span></div>
                                  </div>
                                </div>
                                <div className="bg-[#1c2128] border border-[#58a6ff]/20 rounded-lg p-3">
                                  <div className="flex items-center gap-1.5 mb-2.5 pb-1.5 border-b border-[#30363d]"><span className="w-1.5 h-3.5 bg-[#58a6ff] rounded-sm"></span><span className="text-sm font-semibold text-[#58a6ff]">{getSectorData(idx).sectorChange > 0 ? '领涨股' : '领跌股'}</span></div>
                                  <div className="space-y-1.5">
                                    {reasonMap[stock.id]?.loaded ? ((getSectorData(idx).sectorChange > 0 ? getSectorData(idx).leaderUp : getSectorData(idx).leaderDown).slice(0, 3).map((s, si) => (<div key={si} className="flex items-center justify-between py-0.5"><div className="flex items-center gap-1">{s.change > 0 ? (<TrendingUp size={10} className="text-[#f85149]" />) : (<TrendingDown size={10} className="text-[#3fb950]" />)}<span className="text-[#e6edf3]">{s.name}</span></div><span className={`font-medium ${getUpDownClass(s.change)}`}>{formatPercent(s.change)}</span></div>))) : (<div className="text-[11px] text-[#8b949e] leading-relaxed py-2 text-center">点击「深度分析」查看<br />板块领涨/领跌个股</div>)}
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-[#30363d] flex items-center justify-between"><span className="text-[#8b949e]">板块涨跌</span><span className={`font-medium ${getUpDownClass(getSectorData(idx).sectorChange)}`}>{formatPercent(getSectorData(idx).sectorChange)}</span></div>
                                </div>
                              </div>
                              {reasonMap[stock.id]?.loaded && (<div className="mt-3 pt-3 border-t border-[#30363d]"><div className="text-[#8b949e] mb-1.5 text-xs font-medium">资金逻辑分析</div><div className="text-[#e6edf3] leading-relaxed text-xs bg-[#1c2128] border border-[#30363d] rounded p-2.5">{getSectorData(idx).fundLogic}</div></div>)}
                            </>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-[#30363d] text-xs text-[#8b949e] flex items-center justify-between"><span>共 {sortedStocks.length} 只股票</span><span>模拟数据</span></div>
      </div>
    </div>
  );
};

export default StockRankingPage;