import { useEffect, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Trophy, TrendingUp, AlertTriangle, Target, X, Info } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { dragonTigerApi } from '@client/src/api';
import { ACTIVE_ORGANIZATIONS, PREFERRED_SECTORS, BOARD_PROBABILITY_LIST, findSeatStyle, getSeatDisplayType, getSeatTypeClass, getDumpRiskColor } from '@client/src/api/dragon-tiger';
import type { SeatStyle } from '@client/src/api/dragon-tiger';
import { formatAmount, formatPercent, getUpDownClass, formatPrice } from '@client/src/utils/format';
import type { DragonTiger } from '@shared/api.interface';

const DragonTigerPage = () => {
  const [list, setList] = useState<DragonTiger[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<SeatStyle | null>(null);
  const [seatModalOpen, setSeatModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => { try { const data = await dragonTigerApi.getDragonTigerList(); if (active) setList(data); } catch (e) { logger.error('加载龙虎榜失败', e); } };
    load();
    return () => { active = false; };
  }, []);

  const barOption: EChartsOption = useMemo(() => ({
    tooltip: { trigger: 'axis', backgroundColor: '#1c2128', borderColor: '#30363d', textStyle: { color: '#e6edf3' }, axisPointer: { type: 'shadow' }, formatter: (params: any) => { const p = params[0]; return `${p.name}<br/>净买入：${formatAmount(p.data * 1e8)}`; } },
    grid: { left: 80, right: 30, top: 20, bottom: 40, containLabel: true },
    xAxis: { type: 'category', data: list.map((d) => d.stockName), axisLine: { lineStyle: { color: '#30363d' } }, axisLabel: { color: '#8b949e', fontSize: 11, rotate: 25 } },
    yAxis: { type: 'value', name: '亿元', axisLine: { show: false }, axisLabel: { color: '#8b949e', fontSize: 10, formatter: (v: number) => `${v}` }, splitLine: { lineStyle: { color: '#30363d', type: 'dashed' } } },
    series: [{ name: '净买入', type: 'bar', barWidth: '45%', data: list.map((d) => +(d.netBuy / 1e8).toFixed(2)), itemStyle: { color: (params: any) => params.data >= 0 ? '#f85149' : '#3fb950', borderRadius: [4, 4, 0, 0] }, label: { show: true, position: 'top', color: '#e6edf3', fontSize: 10, formatter: (params: any) => params.data >= 0 ? `+${params.data}` : `${params.data}` } }],
  }), [list]);

  const pieOption: EChartsOption = useMemo(() => ({
    tooltip: { trigger: 'item', backgroundColor: '#1c2128', borderColor: '#30363d', textStyle: { color: '#e6edf3' } },
    legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: '#8b949e', fontSize: 11 } },
    series: [{ type: 'pie', radius: ['45%', '70%'], center: ['35%', '50%'], avoidLabelOverlap: false, label: { show: false }, data: PREFERRED_SECTORS.map((s, i) => ({ value: s.value, name: s.name, itemStyle: { color: ['#f85149', '#58a6ff', '#d2a8ff', '#3fb950', '#f0883e'][i] } })) }],
  }), []);

  const handleSeatClick = (seatName: string) => { const style = findSeatStyle(seatName); if (style) { setSelectedSeat(style); setSeatModalOpen(true); } };
  const closeSeatModal = () => { setSeatModalOpen(false); setSelectedSeat(null); };
  const getProbColor = (prob: number): string => { if (prob >= 70) return '#f85149'; if (prob >= 50) return '#f0883e'; if (prob >= 35) return '#d29922'; return '#8b949e'; };
  const getProbLabel = (prob: number): string => { if (prob >= 70) return '高概率'; if (prob >= 50) return '中概率'; if (prob >= 35) return '低概率'; return '极低概率'; };

  const ProbabilityRing = ({ probability, color }: { probability: number; color: string }) => {
    const size = 100; const strokeWidth = 10; const radius = (size - strokeWidth) / 2; const circumference = 2 * Math.PI * radius; const offset = circumference - (probability / 100) * circumference;
    return (<div className="relative" style={{ width: size, height: size }}><svg width={size} height={size} className="-rotate-90"><circle cx={size / 2} cy={size / 2} r={radius} stroke="#30363d" strokeWidth={strokeWidth} fill="none" /><circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} /></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-bold" style={{ color }}>{probability}%</span><span className="text-[10px] text-[#8b949e]">上板概率</span></div></div>);
  };

  return (
    <div className="space-y-3 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Trophy size={20} className="text-[#f0883e]" /><h2 className="text-lg font-bold">龙虎榜分析</h2><span className="text-[10px] px-2 py-0.5 rounded bg-[#58a6ff]/10 text-[#58a6ff] border border-[#58a6ff]/30">实时数据</span></div>
        <div className="text-xs text-[#8b949e]">交易日期：2026-09-24</div>
      </div>
      <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold">上榜个股资金分布（12只）</h3><span className="text-xs text-[#8b949e]">红色=净买入 绿色=净卖出</span></div>
        <div style={{ height: 300 }}><ReactECharts option={barOption} style={{ height: '100%', width: '100%' }} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold">机构买卖明细</h3><span className="text-[10px] text-[#8b949e]">点击席位查看风格</span></div>
          <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#161b22] sticky top-0 z-10"><tr className="text-[#8b949e]"><th className="px-2 py-2 text-left font-medium">席位名称</th><th className="px-2 py-2 text-left font-medium">类型</th><th className="px-2 py-2 text-right font-medium">买入</th><th className="px-2 py-2 text-right font-medium">卖出</th><th className="px-2 py-2 text-right font-medium">净额</th></tr></thead>
              <tbody>
                {list.flatMap((d) => d.seats.map((seat, si) => {
                  const displayType = getSeatDisplayType(seat.name, seat.type); const typeClass = getSeatTypeClass(displayType); const hasStyle = findSeatStyle(seat.name) !== null;
                  return (<tr key={`${d.id}-${si}`} className="border-t border-[#30363d]/50 hover:bg-[#30363d]/20"><td className="px-2 py-2 max-w-[160px]"><button type="button" onClick={() => handleSeatClick(seat.name)} className={`text-left ${hasStyle ? 'text-[#58a6ff] hover:underline cursor-pointer' : 'text-[#e6edf3] cursor-default'}`} title={seat.name}><span className="block truncate">{seat.name}</span></button></td><td className="px-2 py-2"><span className={`text-[10px] px-1.5 py-0.5 rounded ${typeClass}`}>{displayType === '游资' ? '普通游资' : displayType}</span></td><td className="px-2 py-2 text-right text-[#f85149]">{formatAmount(seat.buy)}</td><td className="px-2 py-2 text-right text-[#3fb950]">{formatAmount(seat.sell)}</td><td className={`px-2 py-2 text-right font-medium ${getUpDownClass(seat.buy - seat.sell)}`}>{seat.buy - seat.sell > 0 ? '+' : ''}{formatAmount(seat.buy - seat.sell)}</td></tr>);
                }))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">最活跃机构排名</h3>
            <div className="space-y-2">{ACTIVE_ORGANIZATIONS.map((org, i) => (<div key={org.name} className="flex items-center gap-2"><span className={`w-5 text-xs text-center rounded ${i < 3 ? 'bg-[#f0883e]/20 text-[#f0883e]' : 'text-[#8b949e]'}`}>{i + 1}</span><span className="text-xs flex-1 truncate" title={org.name}>{org.name}</span><span className="text-xs text-[#8b949e]">{org.count}次</span><span className="text-[10px] text-[#58a6ff]">{org.sector}</span></div>))}</div>
          </div>
          <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4"><h3 className="text-sm font-semibold mb-2">偏好板块分布</h3><div style={{ height: 160 }}><ReactECharts option={pieOption} style={{ height: '100%', width: '100%' }} /></div></div>
        </div>
      </div>
      <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4"><Target size={18} className="text-[#f85149]" /><h3 className="text-base font-bold">明日上板概率分析</h3><span className="text-[10px] px-2 py-0.5 rounded bg-[#f85149]/10 text-[#f85149] border border-[#f85149]/30">基于席位风格</span></div>
        <div className="grid grid-cols-4 gap-3">
          {BOARD_PROBABILITY_LIST.map((stock) => {
            const probColor = getProbColor(stock.probability);
            return (<div key={stock.stockCode} className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 hover:border-[#f85149]/40 transition-colors">
              <div className="flex items-start justify-between mb-3"><div><div className="text-base font-bold">{stock.stockName}</div><div className="text-xs text-[#8b949e] font-mono">{stock.stockCode}</div></div><span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: `${probColor}15`, color: probColor }}>{getProbLabel(stock.probability)}</span></div>
              <div className="flex justify-center mb-3"><ProbabilityRing probability={stock.probability} color={probColor} /></div>
              <div className="space-y-2 text-xs"><div><div className="text-[#58a6ff] mb-0.5 font-medium">核心理由</div><p className="text-[#8b949e] leading-relaxed">{stock.reason}</p></div><div><div className="text-[#d2a8ff] mb-0.5 font-medium">席位分析</div><p className="text-[#8b949e] leading-relaxed">{stock.seatAnalysis}</p></div></div>
              <div className="mt-2 flex items-start gap-1.5 text-[10px] text-[#f0883e] bg-[#f0883e]/10 rounded p-1.5"><AlertTriangle size={12} className="flex-shrink-0 mt-0.5" /><span>{stock.risk}</span></div>
            </div>);
          })}
        </div>
      </div>
      {seatModalOpen && selectedSeat && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={closeSeatModal}>
          <div className="bg-[#1c2128] border border-[#30363d] rounded-lg w-[500px] max-w-[90vw] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[#30363d] sticky top-0 bg-[#1c2128] z-10">
              <div className="flex items-center gap-2"><Info size={18} className="text-[#58a6ff]" /><h3 className="text-base font-bold">席位风格详情</h3></div>
              <button type="button" onClick={closeSeatModal} className="text-[#8b949e] hover:text-[#e6edf3] transition-colors"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3"><div className="text-lg font-bold">{selectedSeat.displayName}</div><span className={`text-[10px] px-2 py-0.5 rounded ${getSeatTypeClass(selectedSeat.type)}`}>{selectedSeat.type === '游资' ? '普通游资' : selectedSeat.type}</span></div>
              <div><div className="text-xs text-[#8b949e] mb-1">操作风格</div><p className="text-sm text-[#e6edf3] leading-relaxed">{selectedSeat.style}</p></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0d1117] rounded p-3"><div className="text-xs text-[#8b949e] mb-1">持股周期</div><div className="text-sm font-semibold text-[#58a6ff]">{selectedSeat.holdPeriod}</div></div>
                <div className="bg-[#0d1117] rounded p-3"><div className="text-xs text-[#8b949e] mb-1">次日胜率</div><div className="text-sm font-semibold text-[#f85149]">{selectedSeat.winRate || '--'}</div></div>
                <div className="bg-[#0d1117] rounded p-3"><div className="text-xs text-[#8b949e] mb-1">砸盘风险</div><div className="text-sm font-semibold" style={{ color: getDumpRiskColor(selectedSeat.dumpRisk) }}>{selectedSeat.dumpRisk}</div></div>
              </div>
              {selectedSeat.recentOps.length > 0 && (<div><div className="text-xs text-[#8b949e] mb-2">近期代表性操作（2026-09-24）</div><div className="space-y-1.5">{selectedSeat.recentOps.map((op, i) => (<div key={i} className="text-xs text-[#e6edf3] bg-[#0d1117] rounded px-3 py-2 border border-[#30363d]/50">{op}</div>))}</div></div>)}
              <div className="text-[10px] text-[#8b949e] bg-[#8b949e]/10 rounded p-2">以上风格分析基于历史数据统计，不构成投资建议。市场有风险，入市需谨慎。</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DragonTigerPage;