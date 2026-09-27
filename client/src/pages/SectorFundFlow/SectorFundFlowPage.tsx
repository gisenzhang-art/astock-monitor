import { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { sectorApi } from '@client/src/api';
import { AI_UPSTREAM, AI_MIDSTREAM, AI_DOWNSTREAM, AI_TRACK_DETAILS, AI_TRACK_7D_FLOW } from '@client/src/api/sector';
import type { TrackDetail } from '@client/src/api/sector';
import { formatAmount, formatPercent, formatPrice, getUpDownClass } from '@client/src/utils/format';
import type { SectorInfo } from '@shared/api.interface';

type ViewMode = 'intraday' | 'daily';
const VIEW_TABS = [{ key: 'intraday' as ViewMode, label: '分时曲线' }, { key: 'daily' as ViewMode, label: '日线级别' }];
const TIME_RANGES = [{ key: '1d', label: '近1日', days: 1 }, { key: '3d', label: '近3日', days: 3 }, { key: '7d', label: '近7日', days: 7 }, { key: '30d', label: '近30日', days: 30 }];
const ANALYSIS_DIMENSIONS = [{ key: 'policy', label: '政策面', color: '#58a6ff' }, { key: 'fund', label: '资金面', color: '#f85149' }, { key: 'news', label: '消息面', color: '#d2a8ff' }, { key: 'technical', label: '技术面', color: '#3fb950' }];
const LINE_COLORS = ['#f85149', '#3fb950', '#58a6ff', '#d2a8ff', '#f0883e', '#ff7b72', '#7ee787', '#79c0ff', '#a371f7', '#d29922', '#ff9494', '#56d364', '#1f6feb', '#bc8cff', '#db6d28', '#ffa657', '#34d399', '#60a5fa', '#c084fc', '#fbbf24'];

const genIntradayFundFlow = (baseValue: number, seed: number): number[] => {
  const points: number[] = [];
  for (let i = 0; i < 48; i++) { const progress = (i + 1) / 48; const val = baseValue * progress + (Math.sin(seed * 5 + i * 0.5) * 0.1 * Math.abs(baseValue)); points.push(+val.toFixed(2)); }
  points[47] = +baseValue.toFixed(2); return points;
};
const generateCurveData = (baseValue: number, days: number): number[] => { const arr: number[] = []; let val = baseValue; for (let i = 0; i < days; i++) { val = val + (Math.random() - 0.45) * 10; arr.push(+val.toFixed(2)); } return arr; };
const genIntradayTimeLabels = (): string[] => {
  const labels: string[] = [];
  for (let i = 0; i < 24; i++) { const totalMin = 9 * 60 + 30 + i * 5; labels.push(`${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`); }
  for (let i = 0; i < 24; i++) { const totalMin = 13 * 60 + i * 5; labels.push(`${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`); }
  return labels;
};
const INTRADAY_TIME_LABELS = genIntradayTimeLabels();

const SectorFundFlowPage = () => {
  const [sectors, setSectors] = useState<SectorInfo[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('intraday');
  const [activeRange, setActiveRange] = useState('7d');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [activeSector, setActiveSector] = useState<SectorInfo | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<TrackDetail | null>(null);
  const days = TIME_RANGES.find((r) => r.key === activeRange)?.days ?? 7;

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await sectorApi.getAllSectors();
        if (!active) return;
        setSectors(data);
        const top5 = [...data].sort((a, b) => b.fundFlow - a.fundFlow).slice(0, 5).map((s) => s.code);
        setSelectedSectors(top5);
        setActiveSector(data[0] ?? null);
      } catch (e) { logger.error('加载板块数据失败', e); }
    };
    load();
    return () => { active = false; };
  }, []);

  const sortedSectors = useMemo(() => [...sectors].sort((a, b) => b.fundFlow - a.fundFlow), [sectors]);
  const filteredSectors = useMemo(() => { if (!searchKeyword.trim()) return sortedSectors; const kw = searchKeyword.trim().toLowerCase(); return sortedSectors.filter((s) => s.name.toLowerCase().includes(kw)); }, [sortedSectors, searchKeyword]);
  const selectedSectorData = sectors.filter((s) => selectedSectors.includes(s.code));
  const toggleSector = (code: string) => { setSelectedSectors((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]); };
  const handleSelectAll = () => { setSelectedSectors(filteredSectors.map((s) => s.code)); };
  const handleClearAll = () => { setSelectedSectors([]); };

  const dateLabels = useMemo(() => {
    const labels: string[] = []; const now = new Date('2026-09-24');
    for (let i = days - 1; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); labels.push(`${d.getMonth() + 1}-${d.getDate()}`); }
    return labels;
  }, [days]);

  const intradayChartOption: EChartsOption = {
    color: LINE_COLORS,
    tooltip: { trigger: 'axis', backgroundColor: '#1c2128', borderColor: '#30363d', textStyle: { color: '#e6edf3', fontSize: 12 }, valueFormatter: (v: number | string) => `${v} 亿` },
    legend: { data: selectedSectorData.map((s) => s.name), textStyle: { color: '#8b949e', fontSize: 11 }, top: 0, type: 'scroll', pageIconColor: '#8b949e', pageTextStyle: { color: '#8b949e' } },
    grid: { left: 50, right: 20, top: 50, bottom: 60, containLabel: true },
    dataZoom: [{ type: 'slider', show: true, xAxisIndex: [0], bottom: 10, height: 20, borderColor: '#30363d', backgroundColor: '#0d1117', fillerColor: 'rgba(88,166,255,0.15)', handleStyle: { color: '#58a6ff' }, textStyle: { color: '#8b949e' }, start: 0, end: 100 }],
    xAxis: { type: 'category', boundaryGap: false, data: INTRADAY_TIME_LABELS, axisLine: { lineStyle: { color: '#30363d' } }, axisLabel: { color: '#8b949e', fontSize: 10, interval: 5 }, splitLine: { show: false } },
    yAxis: { type: 'value', name: '亿元', nameTextStyle: { color: '#8b949e', fontSize: 10 }, axisLine: { show: false }, axisLabel: { color: '#8b949e', fontSize: 10 }, splitLine: { lineStyle: { color: '#30363d', type: 'dashed' } } },
    series: selectedSectorData.map((s, idx) => ({ name: s.name, type: 'line', smooth: true, symbol: 'circle', symbolSize: 4, showSymbol: false, data: genIntradayFundFlow(s.fundFlow / 1e8, idx + 1), lineStyle: { width: 1.5 } })),
  };

  const dailyChartOption: EChartsOption = {
    color: LINE_COLORS,
    tooltip: { trigger: 'axis', backgroundColor: '#1c2128', borderColor: '#30363d', textStyle: { color: '#e6edf3', fontSize: 12 }, valueFormatter: (v: number | string) => `${v} 亿` },
    legend: { data: selectedSectorData.map((s) => s.name), textStyle: { color: '#8b949e', fontSize: 11 }, top: 0, type: 'scroll' },
    grid: { left: 50, right: 20, top: 50, bottom: 30, containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: dateLabels, axisLine: { lineStyle: { color: '#30363d' } }, axisLabel: { color: '#8b949e', fontSize: 10 } },
    yAxis: { type: 'value', name: '亿元', nameTextStyle: { color: '#8b949e', fontSize: 10 }, axisLine: { show: false }, axisLabel: { color: '#8b949e', fontSize: 10 }, splitLine: { lineStyle: { color: '#30363d', type: 'dashed' } } },
    series: selectedSectorData.map((s) => ({ name: s.name, type: 'line', smooth: true, symbol: 'circle', symbolSize: 4, data: generateCurveData(s.fundFlow / 1e8, days), lineStyle: { width: 1.5 } })),
  };

  const mainChartOption = viewMode === 'intraday' ? intradayChartOption : dailyChartOption;

  const aiTracks = [{ title: '上游', items: AI_UPSTREAM, color: '#f85149' }, { title: '中游', items: AI_MIDSTREAM, color: '#d2a8ff' }, { title: '下游', items: AI_DOWNSTREAM, color: '#3fb950' }];
  const getTrack7dTotal = (name: string): number => { const data = AI_TRACK_7D_FLOW[name]; if (!data) return 0; return +data.reduce((sum: number, v: number) => sum + v, 0).toFixed(2); };

  const modalFundFlowChart = (name: string): EChartsOption => {
    const data = AI_TRACK_7D_FLOW[name] || []; const total = data.reduce((sum: number, v: number) => sum + v, 0); const isUp = total > 0;
    return { grid: { left: 40, right: 20, top: 20, bottom: 30, containLabel: true }, tooltip: { trigger: 'axis', backgroundColor: '#1c2128', borderColor: '#30363d', textStyle: { color: '#e6edf3', fontSize: 12 }, valueFormatter: (v: number | string) => `${v} 亿` }, xAxis: { type: 'category', boundaryGap: false, data: dateLabels, axisLine: { lineStyle: { color: '#30363d' } }, axisLabel: { color: '#8b949e', fontSize: 11 } }, yAxis: { type: 'value', name: '亿元', nameTextStyle: { color: '#8b949e', fontSize: 11 }, axisLine: { show: false }, axisLabel: { color: '#8b949e', fontSize: 11 }, splitLine: { lineStyle: { color: '#30363d', type: 'dashed' } } }, series: [{ name: '净流入', type: 'line', smooth: true, showSymbol: true, symbolSize: 5, data, lineStyle: { width: 2, color: isUp ? '#f85149' : '#3fb950' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: isUp ? 'rgba(248,81,73,0.25)' : 'rgba(63,185,80,0.25)' }, { offset: 1, color: isUp ? 'rgba(248,81,73,0)' : 'rgba(63,185,80,0)' }] } } }] };
  };

  return (
    <div className="space-y-3">
      <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">板块资金曲线</h3>
          <div className="flex items-center gap-3">
            <div className="flex bg-[#0d1117] border border-[#30363d] rounded-md p-0.5">
              {VIEW_TABS.map((tab) => (<button key={tab.key} onClick={() => setViewMode(tab.key)} className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === tab.key ? 'bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/30' : 'text-[#8b949e] hover:text-[#e6edf3] border border-transparent'}`}>{tab.label}</button>))}
            </div>
            {viewMode === 'daily' && (<div className="flex gap-1">{TIME_RANGES.map((r) => (<button key={r.key} onClick={() => setActiveRange(r.key)} className={`px-3 py-1 text-xs rounded-md transition-colors ${activeRange === r.key ? 'bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/30' : 'text-[#8b949e] hover:bg-[#30363d]/40 border border-transparent'}`}>{r.label}</button>))}</div>)}
          </div>
        </div>
        {viewMode === 'intraday' && (<div className="text-xs text-[#8b949e] mb-2">数据日期：2026-09-24（上一交易日）</div>)}
        <div style={{ height: 400 }}><ReactECharts option={mainChartOption} style={{ height: '100%', width: '100%' }} notMerge /></div>
      </div>
      <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">板块选择（已选 {selectedSectors.length}/{sectors.length}）</h3>
          <div className="flex items-center gap-2">
            <input type="text" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="搜索板块名称..." className="w-40 px-2.5 py-1 text-xs bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]/50 transition-colors" />
            <button onClick={handleSelectAll} className="px-2.5 py-1 text-xs text-[#58a6ff] hover:bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-md transition-colors">全选</button>
            <button onClick={handleClearAll} className="px-2.5 py-1 text-xs text-[#8b949e] hover:bg-[#30363d]/40 border border-[#30363d] rounded-md transition-colors">清空</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-1">
          {filteredSectors.map((s) => (<button key={s.code} onClick={() => toggleSector(s.code)} className={`px-2.5 py-1 text-xs rounded border transition-colors whitespace-nowrap ${selectedSectors.includes(s.code) ? 'bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/40' : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:border-[#58a6ff]/30 hover:text-[#e6edf3]'}`}>{s.name}<span className={`ml-1.5 ${s.fundFlow > 0 ? 'text-[#f85149]' : 'text-[#3fb950]'}`}>{s.fundFlow > 0 ? '+' : ''}{(s.fundFlow / 1e8).toFixed(1)}</span></button>))}
          {filteredSectors.length === 0 && (<div className="w-full text-center text-xs text-[#8b949e] py-4">未找到匹配的板块</div>)}
        </div>
      </div>
      <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold">科技AI细分赛道</h3><span className="text-xs text-[#8b949e]">共 {AI_UPSTREAM.length + AI_MIDSTREAM.length + AI_DOWNSTREAM.length} 个赛道</span></div>
        <div className="grid grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-1">
          {aiTracks.map((track) => (
            <div key={track.title} className="space-y-2">
              <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: track.color }}><span className="inline-block w-1 h-1 rounded-full" style={{ backgroundColor: track.color }} />{track.title}（{track.items.length}）</div>
              <div className="space-y-1.5">
                {track.items.map((item) => {
                  const fund7d = getTrack7dTotal(item); const flowData = AI_TRACK_7D_FLOW[item] || [];
                  return (<div key={item} onClick={() => setSelectedTrack(AI_TRACK_DETAILS[item] ?? null)} className="bg-[#0d1117] border border-[#30363d] rounded-md p-2 cursor-pointer hover:border-[#58a6ff]/40 hover:bg-[#161b22] transition-colors">
                    <div className="flex items-center justify-between mb-0.5"><span className="text-xs font-medium text-[#e6edf3] truncate pr-1">{item}</span><span className={`text-xs shrink-0 ${getUpDownClass(fund7d)}`}>{fund7d > 0 ? '+' : ''}{fund7d.toFixed(1)}亿</span></div>
                    <div style={{ height: 22 }}><ReactECharts option={{ grid: { left: 0, right: 0, top: 2, bottom: 0 }, xAxis: { type: 'category', show: false, data: dateLabels }, yAxis: { type: 'value', show: false }, series: [{ type: 'line', smooth: true, showSymbol: false, data: flowData, lineStyle: { width: 1, color: fund7d > 0 ? '#f85149' : '#3fb950' }, areaStyle: { color: fund7d > 0 ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(248,81,73,0.3)' }, { offset: 1, color: 'rgba(248,81,73,0)' }] } : { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(63,185,80,0.3)' }, { offset: 1, color: 'rgba(63,185,80,0)' }] } } }] }} style={{ height: '100%', width: '100%' }} /></div>
                  </div>);
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">涨跌原因分析</h3>
          {activeSector && (<div className="flex items-center gap-2"><span className="text-sm">{activeSector.name}</span><span className={`text-sm ${getUpDownClass(activeSector.changePercent)}`}>{formatPercent(activeSector.changePercent)}</span><span className={`text-xs ${getUpDownClass(activeSector.fundFlow)}`}>净流入 {formatAmount(activeSector.fundFlow)}</span></div>)}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {ANALYSIS_DIMENSIONS.map((dim) => (<div key={dim.key} className="bg-[#0d1117] border border-[#30363d] rounded-md p-3"><div className="text-xs font-medium mb-2 pb-1.5 border-b border-[#30363d]" style={{ color: dim.color }}>{dim.label}</div><p className="text-xs text-[#8b949e] leading-relaxed">{activeSector?.analysis?.[dim.key as keyof typeof activeSector.analysis] ?? '暂无分析数据'}</p></div>))}
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">{sectors.slice(0, 12).map((s) => (<button key={s.code} onClick={() => setActiveSector(s)} className={`px-2 py-1 text-xs rounded ${activeSector?.code === s.code ? 'bg-[#58a6ff]/15 text-[#58a6ff]' : 'bg-[#0d1117] text-[#8b949e] hover:text-[#e6edf3]'}`}>{s.name}</button>))}</div>
      </div>
      {selectedTrack && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTrack(null)}>
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg w-full max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d]">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-[#e6edf3]">{selectedTrack.name}</h3>
                <span className="px-2 py-0.5 text-xs rounded border" style={{ color: selectedTrack.position === '上游' ? '#f85149' : selectedTrack.position === '中游' ? '#d2a8ff' : '#3fb950', borderColor: selectedTrack.position === '上游' ? 'rgba(248,81,73,0.4)' : selectedTrack.position === '中游' ? 'rgba(210,168,255,0.4)' : 'rgba(63,185,80,0.4)', backgroundColor: selectedTrack.position === '上游' ? 'rgba(248,81,73,0.1)' : selectedTrack.position === '中游' ? 'rgba(210,168,255,0.1)' : 'rgba(63,185,80,0.1)' }}>{selectedTrack.position}</span>
              </div>
              <button onClick={() => setSelectedTrack(null)} className="text-[#8b949e] hover:text-[#e6edf3] transition-colors text-lg leading-none">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              <div><div className="text-sm font-semibold text-[#e6edf3] mb-2 flex items-center gap-2"><span className="inline-block w-1 h-4 bg-[#58a6ff] rounded" />主题定义与产业链位置</div><p className="text-xs text-[#8b949e] leading-relaxed pl-3">{selectedTrack.definition}</p></div>
              <div><div className="text-sm font-semibold text-[#e6edf3] mb-2 flex items-center gap-2"><span className="inline-block w-1 h-4 bg-[#f85149] rounded" />核心股列表<span className="text-xs font-normal text-[#8b949e]">（数据日期：2026-09-24）</span></div>
                <div className="bg-[#1c2128] border border-[#30363d] rounded-md overflow-hidden">
                  <table className="w-full text-xs"><thead><tr className="bg-[#161b22] text-[#8b949e]"><th className="px-3 py-2 text-left font-medium">股票名称</th><th className="px-3 py-2 text-center font-medium">代码</th><th className="px-3 py-2 text-right font-medium">最新价</th><th className="px-3 py-2 text-right font-medium">涨跌幅</th></tr></thead>
                    <tbody>{selectedTrack.stocks.map((stock, idx) => (<tr key={stock.code} className={`border-t border-[#30363d] ${idx % 2 === 1 ? 'bg-[#161b22]/50' : ''}`}><td className="px-3 py-2 text-[#e6edf3] font-medium">{stock.name}</td><td className="px-3 py-2 text-center text-[#8b949e]">{stock.code}</td><td className={`px-3 py-2 text-right ${getUpDownClass(stock.changePercent)}`}>{formatPrice(stock.price)}</td><td className={`px-3 py-2 text-right font-medium ${getUpDownClass(stock.changePercent)}`}>{formatPercent(stock.changePercent)}</td></tr>))}</tbody>
                  </table>
                </div>
              </div>
              <div><div className="text-sm font-semibold text-[#e6edf3] mb-2 flex items-center justify-between"><div className="flex items-center gap-2"><span className="inline-block w-1 h-4 bg-[#3fb950] rounded" />近期资金流向</div><div className="text-xs font-normal"><span className="text-[#8b949e]">7日累计净流入：</span><span className={getUpDownClass(getTrack7dTotal(selectedTrack.name))}>{getTrack7dTotal(selectedTrack.name) > 0 ? '+' : ''}{getTrack7dTotal(selectedTrack.name).toFixed(2)}亿</span></div></div>
                <div className="bg-[#1c2128] border border-[#30363d] rounded-md p-3" style={{ height: 200 }}><ReactECharts option={modalFundFlowChart(selectedTrack.name)} style={{ height: '100%', width: '100%' }} notMerge /></div>
              </div>
              <div><div className="text-sm font-semibold text-[#e6edf3] mb-2 flex items-center gap-2"><span className="inline-block w-1 h-4 bg-[#d2a8ff] rounded" />相关消息与催化剂</div>
                <div className="space-y-2">{selectedTrack.catalysts.map((cat, idx) => (<div key={idx} className="bg-[#1c2128] border border-[#30363d] rounded-md p-3 hover:border-[#d2a8ff]/30 transition-colors"><p className="text-xs text-[#e6edf3] mb-1.5 leading-relaxed">{cat.title}</p><div className="flex items-center gap-3 text-[11px] text-[#8b949e]"><span className="px-1.5 py-0.5 bg-[#30363d]/50 rounded">{cat.source}</span><span>{cat.date}</span></div></div>))}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectorFundFlowPage;