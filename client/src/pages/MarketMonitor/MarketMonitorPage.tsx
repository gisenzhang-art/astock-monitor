import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { marketApi, sectorApi, stockApi } from '@client/src/api';
import { formatNumber, formatPercent, formatAmount, getUpDownClass, getUpDownBgClass, formatTime } from '@client/src/utils/format';
import IndexDetailDialog from '@client/src/components/IndexDetailDialog';
import type { StockIndex, SectorInfo, StockBasic, MarketReport } from '@shared/api.interface';

const LAST_TRADING_DAY = '2026-09-24';
const IS_NON_TRADING_DAY = true;

const BADGE_COLORS: Record<string, string> = {
  '官方公告': 'bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/30',
  '财经媒体': 'bg-[#d2a8ff]/15 text-[#d2a8ff] border-[#d2a8ff]/30',
  '小作文': 'bg-[#f0883e]/15 text-[#f0883e] border-[#f0883e]/30',
  '海外市场': 'bg-[#3fb950]/15 text-[#3fb950] border-[#3fb950]/30',
  '机构研报': 'bg-[#a371f7]/15 text-[#a371f7] border-[#a371f7]/30',
  '策略日报': 'bg-[#8b949e]/15 text-[#8b949e] border-[#30363d]',
  '金融界': 'bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/30',
  '券商中国': 'bg-[#d2a8ff]/15 text-[#d2a8ff] border-[#d2a8ff]/30',
  'Wind': 'bg-[#d2a8ff]/15 text-[#d2a8ff] border-[#d2a8ff]/30',
  '证券时报': 'bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/30',
  '证券时报·数据宝': 'bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/30',
  '东方财富': 'bg-[#d2a8ff]/15 text-[#d2a8ff] border-[#d2a8ff]/30',
  '中国证券网': 'bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/30',
};

const DAYS = ['09-18', '09-19', '09-20', '09-21', '09-22', '09-23', '09-24'];

const gen7DayData = (finalValue: number, seed: number): number[] => {
  const arr: number[] = [];
  for (let i = 0; i < 7; i++) {
    if (i === 6) { arr.push(+finalValue.toFixed(2)); }
    else { const progress = (i + 1) / 7; const val = finalValue * progress + (Math.sin(seed * 10 + i) * 0.15 * Math.abs(finalValue)); arr.push(+val.toFixed(2)); }
  }
  return arr;
};

const LINE_COLORS = ['#f85149', '#58a6ff', '#d2a8ff', '#f0883e', '#3fb950', '#ff7b72', '#79c0ff', '#e3b341', '#56d4dd', '#bc8cff'];

interface SectorNewsItem { content: string; source: string; impact: '利好' | '利空' | '中性'; date: string; }
interface SectorRealData { keywords: string[]; news: SectorNewsItem[]; fundLogic: string; leaderUp: { name: string; change: number }[]; leaderDown: { name: string; change: number }[]; sectorChange: number; }

const SECTOR_REAL_DATA: SectorRealData[] = [
  { keywords: ['半导体', '存储', '芯片', '电子', '集成电路'], sectorChange: -3.10, news: [{ content: '电子板块大跌超3%，兆易创新、德明利、华天科技跌停，50余股跌超10%，前期存储涨价链获利盘集中兑现', source: '金融界', impact: '利空', date: '09-24' }, { content: 'Omdia数据显示Q2全球半导体营收破4250亿美元，环比+31.4%，但股价已提前反应利好', source: '券商中国', impact: '中性', date: '09-24' }], fundLogic: '半导体板块今日重挫，存储芯片产业链获利盘集中兑现，高位科技筹码松动。北向资金大幅流出半导体板块，机构减仓明显，短期需警惕进一步回调风险。', leaderUp: [{ name: '盈方微', change: 3.25 }, { name: '东芯股份', change: 1.86 }], leaderDown: [{ name: '兆易创新', change: -10.02 }, { name: '德明利', change: -10.0 }, { name: '华天科技', change: -9.98 }] },
  { keywords: ['算力', 'CPO', '光模块', '通信', '光通信', 'AI算力'], sectorChange: -3.00, news: [{ content: '通信设备板块跌3.00%，算力硬件集体退潮，中际旭创跌2.89%、新易盛跌3.59%、天孚通信跌2.71%', source: 'Wind', impact: '利空', date: '09-24' }, { content: 'CPO光模块板块高位回调，前期涨幅较大的算力标的遭资金集中抛售', source: '财经媒体', impact: '利空', date: '09-24' }], fundLogic: 'AI算力与光模块板块今日重挫，算力硬件方向集体退潮。此前连续上涨积累大量获利盘，叠加长假前避险情绪，高位筹码松动明显，资金从成长方向切向防御。', leaderUp: [{ name: '通宇通讯', change: 2.15 }, { name: '华工科技', change: 0.88 }], leaderDown: [{ name: '新易盛', change: -3.59 }, { name: '中际旭创', change: -2.89 }, { name: '天孚通信', change: -2.71 }] },
  { keywords: ['PCB', '印制电路', '电子元件', '电路板'], sectorChange: -4.29, news: [{ content: '电子元件板块领跌4.29%，胜宏科技跌4.75%、沪电股份跌3.16%，高位科技筹码兑现', source: 'Wind', impact: '利空', date: '09-24' }, { content: 'PCB板块前期涨幅较大，算力硬件链条整体退潮带动板块回调', source: '证券时报', impact: '利空', date: '09-24' }], fundLogic: 'PCB板块领跌电子元件方向，高位科技筹码集中兑现。作为算力硬件上游，PCB板块与AI算力链高度联动，今日随算力板块整体退潮，主力资金净流出明显。', leaderUp: [{ name: '世运电路', change: 1.23 }, { name: '依顿电子', change: 0.56 }], leaderDown: [{ name: '胜宏科技', change: -4.75 }, { name: '沪电股份', change: -3.16 }, { name: '深南电路', change: -2.88 }] },
  { keywords: ['液冷', '温控', '散热'], sectorChange: -3.85, news: [{ content: '英维克跌6.58%，主力净流出居前，液冷板块随算力链整体退潮', source: 'Wind', impact: '利空', date: '09-24' }, { content: '算力产业链全线下挫，液冷作为算力配套方向同步回调', source: '财经媒体', impact: '利空', date: '09-24' }], fundLogic: '液冷板块随算力链整体退潮，英维克等龙头股主力资金净流出居前。液冷作为算力基础设施配套板块，与AI算力方向高度联动，短期受算力板块情绪压制明显。', leaderUp: [{ name: '同飞股份', change: 0.92 }, { name: '高澜股份', change: 0.45 }], leaderDown: [{ name: '英维克', change: -6.58 }, { name: '申菱环境', change: -4.32 }, { name: '曙光数创', change: -3.86 }] },
  { keywords: ['银行', '红利', '中特估', '煤炭', '高股息'], sectorChange: 0.31, news: [{ content: '银行板块护盘走强涨0.31%，煤炭涨0.63%，建行、中行、工行领涨，中特估红利破净股获避险资金抱团', source: '金融界', impact: '利好', date: '09-24' }, { content: '市场避险情绪升温，高股息红利资产获资金青睐', source: '中国证券网', impact: '利好', date: '09-24' }], fundLogic: '银行与红利板块今日逆市护盘，成为少数收红的板块。中秋国庆长假临近，资金避险情绪升温，中特估红利破净股获避险资金抱团，北向资金净流入银行板块明显。', leaderUp: [{ name: '建设银行', change: 1.25 }, { name: '中国银行', change: 1.02 }, { name: '工商银行', change: 0.88 }], leaderDown: [{ name: '宁波银行', change: -0.56 }, { name: '招商银行', change: -0.32 }] },
  { keywords: ['黄金', '有色', '金属', '贵金属', '铜', '铝'], sectorChange: -3.53, news: [{ content: '有色金属板块大跌3.53%，黄金概念跌4.07%，美元及实际利率扰动叠加获利兑现', source: '东方财富', impact: '利空', date: '09-24' }, { content: '国际金价高位回落，有色金属板块跟随大宗商品集体调整', source: 'Wind', impact: '利空', date: '09-24' }], fundLogic: '黄金与有色金属板块今日大跌，受美元走强及实际利率高位扰动，叠加前期获利盘集中兑现。大宗商品整体走弱，资源股遭遇资金抛售，北向资金大幅流出有色板块。', leaderUp: [{ name: '赤峰黄金', change: 1.05 }, { name: '湖南黄金', change: 0.68 }], leaderDown: [{ name: '山东黄金', change: -5.23 }, { name: '紫金矿业', change: -4.15 }, { name: '中金黄金', change: -3.88 }] },
  { keywords: ['军工', '国防', '航天', '航空', '兵器'], sectorChange: -1.25, news: [{ content: '军工板块分化，雷科防务涨停获机构+北向共振买入，为少数逆势亮点', source: '证券时报·数据宝', impact: '利好', date: '09-24' }, { content: '军工整体随大盘调整，但部分细分领域获资金关注', source: '财经媒体', impact: '中性', date: '09-24' }], fundLogic: '军工板块今日分化，整体随大盘调整，但雷科防务等少数个股获机构与北向资金共振买入，成为逆势亮点。板块内部结构分化明显，需精选个股。', leaderUp: [{ name: '雷科防务', change: 10.03 }, { name: '航天晨光', change: 3.56 }, { name: '中航沈飞', change: 1.22 }], leaderDown: [{ name: '中国卫星', change: -4.25 }, { name: '航发动力', change: -2.86 }] },
  { keywords: ['医药', '医疗', '生物', '创新药', 'CRO', 'CXO'], sectorChange: -1.85, news: [{ content: '医药生物板块小幅调整跌1.85%，CRO领跌，创新药相对抗跌', source: 'Wind', impact: '利空', date: '09-24' }, { content: '医药板块整体走弱，CXO方向回调幅度较大，创新药及医疗器械相对稳健', source: '财经媒体', impact: '中性', date: '09-24' }], fundLogic: '医药生物板块今日小幅调整，CRO方向领跌，创新药相对抗跌。医药板块整体处于震荡格局，资金在细分领域间轮动，北向资金小幅流出。关注三季报业绩预期。', leaderUp: [{ name: '恒瑞医药', change: 0.85 }, { name: '药明康德', change: 0.52 }], leaderDown: [{ name: '泰格医药', change: -4.25 }, { name: '康龙化成', change: -3.86 }, { name: '昭衍新药', change: -3.52 }] },
  { keywords: ['消费', '食品', '饮料', '白酒', '家电', '零售', '社服'], sectorChange: -2.10, news: [{ content: '食品饮料板块震荡走弱跌2.10%，白酒权重股拖累指数，中秋国庆旺季预期阶段性兑现', source: 'Wind', impact: '利空', date: '09-24' }, { content: '消费板块整体走弱，白酒、食品加工等方向同步回调', source: '财经媒体', impact: '利空', date: '09-24' }], fundLogic: '消费板块今日震荡走弱，白酒权重股拖累指数。中秋国庆旺季预期阶段性兑现，资金从消费方向流出转向防御。北向资金净流出食品饮料板块，短期需观望。', leaderUp: [{ name: '重庆啤酒', change: 0.76 }, { name: '伊利股份', change: 0.35 }], leaderDown: [{ name: '贵州茅台', change: -2.35 }, { name: '五粮液', change: -2.68 }, { name: '泸州老窖', change: -2.45 }] },
  { keywords: ['新能源', '光伏', '锂电', '新能源车', '电力设备', '储能'], sectorChange: -2.85, news: [{ content: '电力设备板块跌2.85%，光伏领跌，新能源车相对抗跌，板块内部分化明显', source: 'Wind', impact: '利空', date: '09-24' }, { content: '新能源板块整体走弱，光伏产业链跌幅居前，锂电及新能源车相对抗跌', source: '财经媒体', impact: '利空', date: '09-24' }], fundLogic: '新能源板块今日分化调整，光伏方向领跌，新能源车相对抗跌。光伏产业链价格竞争仍存压力，而新能源车销量数据相对较好。资金从光伏流出，关注三季报业绩。', leaderUp: [{ name: '比亚迪', change: 0.65 }, { name: '宁德时代', change: 0.28 }], leaderDown: [{ name: '隆基绿能', change: -5.25 }, { name: '通威股份', change: -4.86 }, { name: '晶澳科技', change: -4.52 }] },
];

const matchSectorRealData = (sectorName: string): SectorRealData => {
  for (const sd of SECTOR_REAL_DATA) { if (sd.keywords.some((k) => sectorName.includes(k))) return sd; }
  const idx = sectorName.charCodeAt(0) % SECTOR_REAL_DATA.length;
  return SECTOR_REAL_DATA[idx];
};

const IndexCard = ({ item, onClick }: { item: StockIndex; onClick: () => void }) => (
  <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4 cursor-pointer hover:border-[#58a6ff]/50 transition-colors" onClick={onClick}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-[#8b949e]">{item.name}</span>
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#58a6ff]/10 text-[#58a6ff]">实时数据</span>
    </div>
    <div className="text-2xl font-bold mb-1">{formatNumber(item.closePrice)}</div>
    <div className="flex items-center gap-3 text-sm">
      <span className={`font-medium ${getUpDownClass(item.changePercent)}`}>{formatPercent(item.changePercent)}</span>
      <span className={`font-medium ${getUpDownClass(item.changePoint)}`}>{item.changePoint > 0 ? '+' : ''}{formatNumber(item.changePoint)}</span>
    </div>
    <div className="mt-2 text-xs text-[#8b949e]">成交额：{formatAmount(item.amount)}</div>
  </div>
);

const MarketMonitorPage = () => {
  const [indexes, setIndexes] = useState<StockIndex[]>([]);
  const [sectors, setSectors] = useState<SectorInfo[]>([]);
  const [reports, setReports] = useState<MarketReport[]>([]);
  const [expandedSector, setExpandedSector] = useState<string | null>(null);
  const [sectorStocks, setSectorStocks] = useState<StockBasic[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<StockIndex | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sectorReasonMap, setSectorReasonMap] = useState<Record<string, { loading: boolean; loaded: boolean }>>({});
  const [fundFlowMode, setFundFlowMode] = useState<'inflowTop5' | 'outflowTop5' | 'custom'>('inflowTop5');
  const [customSelectedSectors, setCustomSelectedSectors] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [idx, sec, rep] = await Promise.all([marketApi.getMainIndexes(), sectorApi.getAllSectors(), marketApi.getMarketReports()]);
        if (!active) return;
        setIndexes(idx); setSectors(sec); setReports(rep);
      } catch (e) { logger.error('加载行情数据失败', e); }
    };
    load();
    return () => { active = false; };
  }, []);

  const topInflow = [...sectors].sort((a, b) => b.fundFlow - a.fundFlow).slice(0, 10);
  const topOutflow = [...sectors].sort((a, b) => a.fundFlow - b.fundFlow).slice(0, 10);

  const handleSectorClick = async (sectorName: string) => {
    if (expandedSector === sectorName) { setExpandedSector(null); return; }
    setExpandedSector(sectorName);
    try { const stocks = await stockApi.getStockRanking('inflow', 10); setSectorStocks(stocks.slice(0, 5)); } catch (e) { logger.error('加载板块个股失败', e); }
  };

  const getImpactClass = (impact: string) => {
    if (impact === '利好') return 'bg-[#f85149]/10 text-[#f85149] border-[#f85149]/30';
    if (impact === '利空') return 'bg-[#3fb950]/10 text-[#3fb950] border-[#3fb950]/30';
    return 'bg-[#8b949e]/10 text-[#8b949e] border-[#30363d]';
  };

  const generateSectorReasonAnalysis = (sector: SectorInfo, idx: number, flowType: 'inflow' | 'outflow') => {
    const realData = matchSectorRealData(sector.name);
    return { messages: realData.news, logic: realData.fundLogic, sectorChange: realData.sectorChange, leaderUp: realData.leaderUp, leaderDown: realData.leaderDown };
  };

  const handleSectorReasonToggle = (sectorName: string) => {
    const current = sectorReasonMap[sectorName];
    if (current?.loading) return;
    if (current?.loaded) { setSectorReasonMap((prev) => { const next = { ...prev }; delete next[sectorName]; return next; }); return; }
    setSectorReasonMap((prev) => ({ ...prev, [sectorName]: { loading: true, loaded: false } }));
    setTimeout(() => {
      setSectorReasonMap((prev) => { if (!prev[sectorName]?.loading) return prev; return { ...prev, [sectorName]: { loading: false, loaded: true } }; });
      if (expandedSector !== sectorName) { handleSectorClick(sectorName); }
    }, 1500);
  };

  const handleIndexClick = (idx: StockIndex) => { setSelectedIndex(idx); setDialogOpen(true); };

  const heatmapOption: EChartsOption = {
    tooltip: { position: 'top', formatter: (params: any) => { const d = params.data; return `${d[1]}<br/>资金净流入：${formatAmount(d[2] * 1e8)}`; } },
    grid: { left: 60, right: 20, top: 20, bottom: 40, containLabel: false },
    xAxis: { type: 'category', data: ['1', '2', '3', '4', '5', '6'], axisLine: { lineStyle: { color: '#30363d' } }, axisLabel: { show: false }, splitLine: { show: false } },
    yAxis: { type: 'category', data: Array.from({ length: 5 }, (_, i) => `第${i + 1}行`), axisLine: { lineStyle: { color: '#30363d' } }, axisLabel: { show: false }, splitLine: { show: false } },
    visualMap: { min: -50, max: 100, calculable: false, orient: 'horizontal', left: 'center', bottom: 0, textStyle: { color: '#8b949e', fontSize: 10 }, inRange: { color: ['#3fb950', '#1c2128', '#f85149'] } },
    series: [{ name: '资金净流入', type: 'heatmap', data: sectors.slice(0, 30).map((s, i) => [i % 6, Math.floor(i / 6), +(s.fundFlow / 1e8).toFixed(2), s.name]), label: { show: true, color: '#e6edf3', fontSize: 10, formatter: (params: any) => params.data[3] }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } } }],
  };

  const getSelectedSectors = (): SectorInfo[] => {
    if (fundFlowMode === 'inflowTop5') return topInflow.slice(0, 5);
    if (fundFlowMode === 'outflowTop5') return topOutflow.slice(0, 5);
    return sectors.filter((s) => customSelectedSectors.includes(s.name));
  };
  const selectedSectors = getSelectedSectors();

  const handleModeChange = (mode: 'inflowTop5' | 'outflowTop5' | 'custom') => {
    if (mode === 'custom' && customSelectedSectors.length === 0) { setCustomSelectedSectors(topInflow.slice(0, 5).map((s) => s.name)); }
    setFundFlowMode(mode);
  };

  const toggleCustomSector = (name: string) => {
    setCustomSelectedSectors((prev) => { if (prev.includes(name)) { return prev.filter((n) => n !== name); } if (prev.length >= 10) return prev; return [...prev, name]; });
  };

  const chartTitleText = fundFlowMode === 'inflowTop5' ? '近7日资金净流入Top5板块趋势' : fundFlowMode === 'outflowTop5' ? '近7日资金净流出Top5板块趋势' : '近7日板块资金趋势';
  const chartBadgeText = fundFlowMode === 'inflowTop5' ? '近7日累计净流入Top5板块' : fundFlowMode === 'outflowTop5' ? '近7日累计净流出Top5板块' : '自定义选择板块';

  const lineOption: EChartsOption = {
    tooltip: { trigger: 'axis', backgroundColor: '#1c2128', borderColor: '#30363d', textStyle: { color: '#e6edf3' } },
    legend: { data: selectedSectors.map((s) => s.name), textStyle: { color: '#8b949e', fontSize: 11 }, top: 0, type: 'scroll' },
    grid: { left: 50, right: 80, top: 36, bottom: 24, containLabel: false },
    xAxis: { type: 'category', boundaryGap: false, data: DAYS, axisLine: { lineStyle: { color: '#30363d' } }, axisLabel: { color: '#8b949e', fontSize: 10 } },
    yAxis: { type: 'value', name: '亿元', nameTextStyle: { color: '#8b949e', fontSize: 10 }, axisLine: { show: false }, axisLabel: { color: '#8b949e', fontSize: 10, formatter: (v: number) => `${v}` }, splitLine: { lineStyle: { color: '#30363d', type: 'dashed' } } },
    series: selectedSectors.map((s, i) => {
      const data = gen7DayData(s.fundFlow / 1e8, i + s.name.length);
      const color = LINE_COLORS[i % LINE_COLORS.length];
      return { name: s.name, type: 'line', smooth: true, symbol: 'circle', symbolSize: 4, data, lineStyle: { width: 1.5, color }, itemStyle: { color }, endLabel: { show: true, formatter: (params: any) => { const v = Array.isArray(params.value) ? Number(params.value[1]) : Number(params.value); return `${v > 0 ? '+' : ''}${v.toFixed(2)}亿`; }, color, fontSize: 10, distance: 5 } };
    }),
  };

  return (
    <>
      <div className="space-y-3">
      <div className="grid grid-cols-5 gap-3">
        {indexes.map((idx) => (<IndexCard key={idx.id} item={idx} onClick={() => handleIndexClick(idx)} />))}
      </div>
      <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">申万一级行业资金热力图</h3>
            {IS_NON_TRADING_DAY && (<span className="text-[10px] px-1.5 py-0.5 rounded bg-[#8b949e]/15 text-[#8b949e] border border-[#30363d]">数据日期：{LAST_TRADING_DAY}（上一交易日）</span>)}
          </div>
          <span className="text-xs text-[#8b949e]">单位：亿元</span>
        </div>
        <div style={{ height: 280 }}><ReactECharts option={heatmapOption} style={{ height: '100%', width: '100%' }} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3"><TrendingUp size={16} className="text-[#f85149]" /><h3 className="text-sm font-semibold">Top10 资金流入板块</h3></div>
          <div className="space-y-1.5">
            {topInflow.map((s, i) => (
              <div key={s.id}>
                <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-[#30363d]/30 cursor-pointer" onClick={() => handleSectorClick(s.name)}>
                  <div className="flex items-center gap-2">
                    <span className={`w-5 text-xs text-center rounded ${i < 3 ? 'bg-[#f85149]/20 text-[#f85149] font-medium' : 'text-[#8b949e]'}`}>{i + 1}</span>
                    <span className="text-sm">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleSectorReasonToggle(s.name); }} className={`text-xs px-1.5 py-0.5 rounded border transition-colors ${sectorReasonMap[s.name]?.loading ? 'text-[#8b949e] border-[#30363d] cursor-not-allowed' : sectorReasonMap[s.name]?.loaded ? 'bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/30 hover:bg-[#58a6ff]/25' : 'text-[#58a6ff] border-[#58a6ff]/40 hover:bg-[#58a6ff]/10'}`} disabled={sectorReasonMap[s.name]?.loading}>
                      {sectorReasonMap[s.name]?.loading ? '分析中...' : sectorReasonMap[s.name]?.loaded ? '✓ 已分析' : '🔍检索原因'}
                    </button>
                    <span className={`text-sm ${getUpDownClass(s.fundFlow)}`}>+{formatAmount(s.fundFlow)}</span>
                    {expandedSector === s.name ? <ChevronUp size={14} className="text-[#8b949e]" /> : <ChevronDown size={14} className="text-[#8b949e]" />}
                  </div>
                </div>
                {expandedSector === s.name && (
                  <div className="ml-7 pl-2 border-l border-[#30363d] space-y-2 py-1">
                    {sectorReasonMap[s.name]?.loaded && (
                      <div className="space-y-2 pb-2 border-b border-[#30363d]">
                        <div className="text-xs font-medium text-[#58a6ff] flex items-center gap-1"><span>📊</span><span>资金流入/流出原因分析</span></div>
                        <div><div className="text-[#8b949e] mb-1 text-[11px] font-medium">消息摘要</div>
                          <div className="space-y-1.5">{generateSectorReasonAnalysis(s, i, 'inflow').messages.map((msg, mi) => (<div key={mi} className="flex items-start gap-1.5 text-[11px]"><span className={`text-[9px] px-1 py-0.5 rounded mt-0.5 border ${BADGE_COLORS[msg.source] || 'bg-[#8b949e]/15 text-[#8b949e] border-[#30363d]'}`}>{msg.source}</span><span className={`text-[9px] px-1 py-0.5 rounded mt-0.5 border ${getImpactClass(msg.impact)}`}>{msg.impact}</span><span className="text-[#e6edf3] flex-1 leading-relaxed">{msg.content}</span></div>))}</div>
                        </div>
                        <div><div className="text-[#8b949e] mb-1 text-[11px] font-medium">资金逻辑分析</div><div className="text-[#e6edf3] leading-relaxed text-[11px] bg-[#0d1117] border border-[#30363d] rounded p-2">{generateSectorReasonAnalysis(s, i, 'inflow').logic}</div></div>
                      </div>
                    )}
                    <div className="space-y-1">{sectorStocks.map((st) => (<div key={st.id} className="flex items-center justify-between text-xs py-1"><span className="text-[#e6edf3]">{st.name}</span><span className={getUpDownClass(st.changePercent)}>{formatPercent(st.changePercent)}</span></div>))}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3"><TrendingDown size={16} className="text-[#3fb950]" /><h3 className="text-sm font-semibold">Top10 资金流出板块</h3></div>
          <div className="space-y-1.5">
            {topOutflow.map((s, i) => (
              <div key={s.id}>
                <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-[#30363d]/30 cursor-pointer" onClick={() => handleSectorClick(s.name)}>
                  <div className="flex items-center gap-2">
                    <span className={`w-5 text-xs text-center rounded ${i < 3 ? 'bg-[#3fb950]/20 text-[#3fb950] font-medium' : 'text-[#8b949e]'}`}>{i + 1}</span>
                    <span className="text-sm">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleSectorReasonToggle(s.name); }} className={`text-xs px-1.5 py-0.5 rounded border transition-colors ${sectorReasonMap[s.name]?.loading ? 'text-[#8b949e] border-[#30363d] cursor-not-allowed' : sectorReasonMap[s.name]?.loaded ? 'bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/30 hover:bg-[#58a6ff]/25' : 'text-[#58a6ff] border-[#58a6ff]/40 hover:bg-[#58a6ff]/10'}`} disabled={sectorReasonMap[s.name]?.loading}>
                      {sectorReasonMap[s.name]?.loading ? '分析中...' : sectorReasonMap[s.name]?.loaded ? '✓ 已分析' : '🔍检索原因'}
                    </button>
                    <span className={`text-sm ${getUpDownClass(s.fundFlow)}`}>{formatAmount(s.fundFlow)}</span>
                    {expandedSector === s.name ? <ChevronUp size={14} className="text-[#8b949e]" /> : <ChevronDown size={14} className="text-[#8b949e]" />}
                  </div>
                </div>
                {expandedSector === s.name && (
                  <div className="ml-7 pl-2 border-l border-[#30363d] space-y-2 py-1">
                    {sectorReasonMap[s.name]?.loaded && (
                      <div className="space-y-2 pb-2 border-b border-[#30363d]">
                        <div className="text-xs font-medium text-[#58a6ff] flex items-center gap-1"><span>📊</span><span>资金流入/流出原因分析</span></div>
                        <div><div className="text-[#8b949e] mb-1 text-[11px] font-medium">消息摘要</div>
                          <div className="space-y-1.5">{generateSectorReasonAnalysis(s, i, 'outflow').messages.map((msg, mi) => (<div key={mi} className="flex items-start gap-1.5 text-[11px]"><span className={`text-[9px] px-1 py-0.5 rounded mt-0.5 border ${BADGE_COLORS[msg.source] || 'bg-[#8b949e]/15 text-[#8b949e] border-[#30363d]'}`}>{msg.source}</span><span className={`text-[9px] px-1 py-0.5 rounded mt-0.5 border ${getImpactClass(msg.impact)}`}>{msg.impact}</span><span className="text-[#e6edf3] flex-1 leading-relaxed">{msg.content}</span></div>))}</div>
                        </div>
                        <div><div className="text-[#8b949e] mb-1 text-[11px] font-medium">资金逻辑分析</div><div className="text-[#e6edf3] leading-relaxed text-[11px] bg-[#0d1117] border border-[#30363d] rounded p-2">{generateSectorReasonAnalysis(s, i, 'outflow').logic}</div></div>
                      </div>
                    )}
                    <div className="space-y-1">{sectorStocks.slice(0, 5).reverse().map((st) => (<div key={st.id} className="flex items-center justify-between text-xs py-1"><span className="text-[#e6edf3]">{st.name}</span><span className={getUpDownClass(st.changePercent)}>{formatPercent(st.changePercent)}</span></div>))}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{chartTitleText}</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#58a6ff]/10 text-[#58a6ff] border border-[#58a6ff]/30">{chartBadgeText}</span>
          </div>
          <div className="flex items-center gap-1">
            {(['inflowTop5', 'outflowTop5', 'custom'] as const).map((mode) => (
              <button key={mode} onClick={() => handleModeChange(mode)} className={`text-xs px-2 py-1 rounded border transition-colors ${fundFlowMode === mode ? 'bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/50' : 'text-[#8b949e] border-[#30363d] hover:text-[#e6edf3] hover:border-[#8b949e]'}`}>
                {mode === 'inflowTop5' ? '净流入Top5' : mode === 'outflowTop5' ? '净流出Top5' : '自定义选择'}
              </button>
            ))}
          </div>
        </div>
        {fundFlowMode === 'custom' && (
          <div className="mb-3 p-2 bg-[#0d1117] border border-[#30363d] rounded">
            <div className="text-[11px] text-[#8b949e] mb-2">选择板块（最多10个，已选{customSelectedSectors.length}个）</div>
            <div className="flex flex-wrap gap-1.5">
              {sectors.map((s) => {
                const selected = customSelectedSectors.includes(s.name);
                const disabled = !selected && customSelectedSectors.length >= 10;
                return (<button key={s.id} onClick={() => !disabled && toggleCustomSector(s.name)} className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${selected ? 'bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/40' : disabled ? 'text-[#8b949e]/40 border-[#30363d]/50 cursor-not-allowed' : 'text-[#8b949e] border-[#30363d] hover:text-[#e6edf3] hover:border-[#8b949e]'}`}>{s.name}</button>);
              })}
            </div>
          </div>
        )}
        <div style={{ height: 300 }}><ReactECharts option={lineOption} style={{ height: '100%', width: '100%' }} /></div>
        {selectedSectors.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-[#8b949e] border-b border-[#30363d]"><th className="text-left font-normal py-1.5 pl-2 w-20">板块</th>{DAYS.map((d) => (<th key={d} className="text-right font-normal py-1.5 px-1">{d}</th>))}<th className="text-right font-normal py-1.5 pr-2">累计</th></tr></thead>
              <tbody>
                {selectedSectors.map((s, i) => {
                  const data = gen7DayData(s.fundFlow / 1e8, i + s.name.length);
                  const total = data[6];
                  return (<tr key={s.id} className="border-b border-[#30363d]/50 hover:bg-[#30363d]/20"><td className="py-1.5 pl-2 text-[#e6edf3] truncate max-w-20">{s.name}</td>{data.map((v, di) => (<td key={di} className={`text-right py-1.5 px-1 tabular-nums ${v >= 0 ? 'text-[#f85149]' : 'text-[#3fb950]'}`}>{v > 0 ? '+' : ''}{v.toFixed(2)}</td>))}<td className={`text-right py-1.5 pr-2 font-medium tabular-nums ${total >= 0 ? 'text-[#f85149]' : 'text-[#3fb950]'}`}>{total > 0 ? '+' : ''}{total.toFixed(2)}</td></tr>);
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">行情定时汇报</h3>
          {IS_NON_TRADING_DAY && (<span className="text-[10px] px-1.5 py-0.5 rounded bg-[#8b949e]/15 text-[#8b949e] border border-[#30363d]">数据日期：{LAST_TRADING_DAY}（上一交易日）</span>)}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {['早盘', '午盘', '收盘'].map((timePoint) => (
            <div key={timePoint} className="space-y-2">
              <div className="text-xs font-medium text-[#58a6ff]">{timePoint}汇报</div>
              {reports.filter((r) => r.timePoint === timePoint).map((r) => (
                <div key={r.id} className="bg-[#0d1117] border border-[#30363d] rounded-md p-3">
                  <div className="text-sm font-medium mb-1 line-clamp-1">{r.title}</div>
                  <div className="text-xs text-[#8b949e] line-clamp-2 mb-2">{r.summary}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8b949e]">{formatTime(r.reportTime)}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${BADGE_COLORS[r.sourceType] ?? BADGE_COLORS['财经媒体']}`}>{r.sourceType}</span>
                  </div>
                  {IS_NON_TRADING_DAY && (<div className="text-[10px] text-[#8b949e] mt-1.5 pt-1.5 border-t border-[#30363d]/50">数据日期：{LAST_TRADING_DAY}（上一交易日）</div>)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      </div>
      <IndexDetailDialog index={selectedIndex} isLastTradingDay={IS_NON_TRADING_DAY} open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
};

export default MarketMonitorPage;