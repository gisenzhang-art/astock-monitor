import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Wallet, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { simTradeApi } from '@client/src/api';
import { formatAmount, formatPercent, formatPrice, formatDateTime, getUpDownClass, getUpDownBgClass } from '@client/src/utils/format';
import type { SimAccount, SimPosition, SimTrade, TradeSignal } from '@shared/api.interface';

const TABS = [{ key: 'position', label: '持仓' }, { key: 'trades', label: '交易记录' }, { key: 'signals', label: '买卖信号' }];
const POSITION_NEWS = [{ stock: '盛美上海', title: '半导体设备订单超预期', impact: '利好', time: '2026-09-24 10:30' }, { stock: '海光信息', title: '国产AI芯片实现技术突破', impact: '利好', time: '2026-09-24 09:45' }, { stock: '北京君正', title: '存储芯片价格继续下跌', impact: '利空', time: '2026-09-24 14:20' }, { stock: '宁德时代', title: '新能源汽车销量超预期', impact: '利好', time: '2026-09-24 11:15' }, { stock: '中国移动', title: '算力基础设施建设加速', impact: '中性', time: '2026-09-24 15:00' }];

const SimTradePage = () => {
  const [account, setAccount] = useState<SimAccount | null>(null);
  const [positions, setPositions] = useState<SimPosition[]>([]);
  const [trades, setTrades] = useState<SimTrade[]>([]);
  const [signals, setSignals] = useState<TradeSignal[]>([]);
  const [activeTab, setActiveTab] = useState('position');
  const [expandedPos, setExpandedPos] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => { try { const [acc, pos, trd, sig] = await Promise.all([simTradeApi.getSimAccount(), simTradeApi.getSimPositions(), simTradeApi.getSimTrades(), simTradeApi.getTradeSignals()]); if (!active) return; setAccount(acc); setPositions(pos); setTrades(trd); setSignals(sig); } catch (e) { logger.error('加载模拟盘数据失败', e); } };
    load();
    return () => { active = false; };
  }, []);

  const positionPercent = account ? +((account.positionValue / account.totalAsset) * 100).toFixed(1) : 0;
  const pieOption: EChartsOption = { tooltip: { trigger: 'item', backgroundColor: '#1c2128', borderColor: '#30363d', textStyle: { color: '#e6edf3' } }, legend: { bottom: 0, textStyle: { color: '#8b949e', fontSize: 11 } }, series: [{ type: 'pie', radius: ['50%', '75%'], center: ['50%', '45%'], avoidLabelOverlap: false, label: { show: false }, data: [{ value: account?.positionValue ?? 0, name: '持仓市值', itemStyle: { color: '#58a6ff' } }, { value: account?.availableCash ?? 0, name: '可用资金', itemStyle: { color: '#3fb950' } }] }] };
  const impactClass = (impact: string) => { if (impact === '利好') return 'text-[#f85149] bg-[#f85149]/10'; if (impact === '利空') return 'text-[#3fb950] bg-[#3fb950]/10'; return 'text-[#8b949e] bg-[#8b949e]/10'; };

  const AccountCard = () => (
    <div className="grid grid-cols-6 gap-3">
      {[{ label: '总资产', value: formatAmount(account?.totalAsset), sub: '初始10万', color: 'text-[#e6edf3]' }, { label: '持仓市值', value: formatAmount(account?.positionValue), sub: `${positionPercent}%仓位`, color: 'text-[#58a6ff]' }, { label: '可用资金', value: formatAmount(account?.availableCash), sub: '', color: 'text-[#3fb950]' }, { label: '当日盈亏', value: `${account?.todayProfit ?? 0 > 0 ? '+' : ''}${formatAmount(account?.todayProfit)}`, sub: formatPercent(account?.todayProfitPercent), color: getUpDownClass(account?.todayProfitPercent) }, { label: '累计盈亏', value: `${account?.totalProfit ?? 0 > 0 ? '+' : ''}${formatAmount(account?.totalProfit)}`, sub: formatPercent(account?.totalProfitPercent), color: getUpDownClass(account?.totalProfitPercent) }, { label: '仓位占比', value: `${positionPercent}%`, sub: `${positions.length}只股票`, color: 'text-[#d2a8ff]' }].map((item, i) => (
        <div key={i} className="bg-[#1c2128] border border-[#30363d] rounded-lg p-3"><div className="text-xs text-[#8b949e] mb-1">{item.label}</div><div className={`text-lg font-bold ${item.color}`}>{item.value}</div>{item.sub && <div className="text-xs text-[#8b949e] mt-0.5">{item.sub}</div>}</div>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-[#58a6ff]/10 to-[#d2a8ff]/10 border border-[#58a6ff]/30 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2"><span className="text-[#58a6ff] font-semibold text-sm">模拟盘重置通知</span></div>
        <div className="text-sm text-[#e6edf3] mt-1">模拟盘将于 2026-09-28（周一）开盘后正式开始运行，初始资金 10 万元。当前持仓、交易记录与盈亏统计均已清空，请耐心等待首个交易日的策略信号。</div>
      </div>
      <div className="flex items-center gap-2"><Wallet size={20} className="text-[#58a6ff]" /><h2 className="text-lg font-bold">模拟交易</h2><span className="text-[10px] px-2 py-0.5 rounded bg-[#8b949e]/15 text-[#8b949e] border border-[#30363d]">模拟数据</span></div>
      <AccountCard />
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 bg-[#1c2128] border border-[#30363d] rounded-lg">
          <div className="flex border-b border-[#30363d] px-3">{TABS.map((tab) => (<button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-[#58a6ff] text-[#58a6ff]' : 'border-transparent text-[#8b949e] hover:text-[#e6edf3]'}`}>{tab.label}</button>))}</div>
          <div className="p-3 max-h-[500px] overflow-y-auto">
            {activeTab === 'position' && positions.length === 0 && (<div className="text-center py-12 text-[#8b949e] text-sm">暂无持仓，模拟盘将于 2026-09-28 开盘后正式开始运行</div>)}
            {activeTab === 'position' && positions.length > 0 && (
              <table className="w-full text-xs"><thead className="bg-[#161b22]"><tr className="text-[#8b949e]"><th className="px-2 py-2 text-left font-medium">股票名称</th><th className="px-2 py-2 text-left font-medium">代码</th><th className="px-2 py-2 text-right font-medium">持仓</th><th className="px-2 py-2 text-right font-medium">现价</th><th className="px-2 py-2 text-right font-medium">成本</th><th className="px-2 py-2 text-right font-medium">市值</th><th className="px-2 py-2 text-right font-medium">盈亏</th><th className="px-2 py-2 text-right font-medium">盈亏%</th><th className="px-2 py-2 text-right font-medium">操作</th><th className="w-6"></th></tr></thead>
                <tbody>{positions.map((p) => (<React.Fragment key={p.id}><tr className="border-t border-[#30363d]/50 hover:bg-[#30363d]/20"><td className="px-2 py-2 font-medium">{p.stockName}</td><td className="px-2 py-2 text-[#8b949e] font-mono">{p.stockCode}</td><td className="px-2 py-2 text-right">{formatAmount(p.quantity)}</td><td className={`px-2 py-2 text-right ${getUpDownClass(p.profitPercent)}`}>{formatPrice(p.currentPrice)}</td><td className="px-2 py-2 text-right text-[#8b949e]">{formatPrice(p.costPrice)}</td><td className="px-2 py-2 text-right">{formatAmount(p.marketValue)}</td><td className={`px-2 py-2 text-right font-medium ${getUpDownClass(p.profit)}`}>{p.profit > 0 ? '+' : ''}{formatAmount(p.profit)}</td><td className={`px-2 py-2 text-right font-medium ${getUpDownClass(p.profitPercent)}`}>{formatPercent(p.profitPercent)}</td><td className="px-2 py-2 text-right"><div className="flex gap-1 justify-end"><button className="px-2 py-0.5 text-[10px] rounded bg-[#f85149]/15 text-[#f85149] hover:bg-[#f85149]/25">买入</button><button className="px-2 py-0.5 text-[10px] rounded bg-[#3fb950]/15 text-[#3fb950] hover:bg-[#3fb950]/25">卖出</button></div></td><td className="px-2 py-2 cursor-pointer" onClick={() => setExpandedPos(expandedPos === p.id ? null : p.id)}>{expandedPos === p.id ? (<ChevronUp size={14} className="text-[#8b949e]" />) : (<ChevronDown size={14} className="text-[#8b949e]" />)}</td></tr>{expandedPos === p.id && (<tr className="bg-[#0d1117] border-t border-[#30363d]"><td colSpan={10} className="px-3 py-2.5"><div className="grid grid-cols-5 gap-3 text-xs"><div><div className="text-[#8b949e] mb-0.5">买入理由</div><div className="text-[#e6edf3]">{p.buyReason}</div></div><div><div className="text-[#8b949e] mb-0.5">卖出条件</div><div className="text-[#e6edf3]">{p.sellCondition}</div></div><div><div className="text-[#8b949e] mb-0.5">目标价</div><div className="text-[#f85149] font-medium">{formatPrice(p.targetPrice)}</div></div><div><div className="text-[#8b949e] mb-0.5">止损价</div><div className="text-[#3fb950] font-medium">{formatPrice(p.stopLossPrice)}</div></div><div><div className="text-[#8b949e] mb-0.5">买入日期</div><div className="text-[#e6edf3]">{p.buyDate}</div></div></div></td></tr>)}</React.Fragment>))}</tbody>
              </table>
            )}
            {activeTab === 'trades' && trades.length === 0 && (<div className="text-center py-12 text-[#8b949e] text-sm">暂无交易记录</div>)}
            {activeTab === 'trades' && trades.length > 0 && (
              <table className="w-full text-xs"><thead className="bg-[#161b22]"><tr className="text-[#8b949e]"><th className="px-2 py-2 text-left font-medium">时间</th><th className="px-2 py-2 text-left font-medium">类型</th><th className="px-2 py-2 text-left font-medium">股票</th><th className="px-2 py-2 text-right font-medium">价格</th><th className="px-2 py-2 text-right font-medium">数量</th><th className="px-2 py-2 text-right font-medium">金额</th><th className="px-2 py-2 text-left font-medium">原因</th></tr></thead>
                <tbody>{trades.map((t) => (<tr key={t.id} className="border-t border-[#30363d]/50 hover:bg-[#30363d]/20"><td className="px-2 py-2 text-[#8b949e]">{formatDateTime(t.tradeTime)}</td><td className="px-2 py-2"><span className={`text-[10px] px-1.5 py-0.5 rounded ${t.tradeType === 'buy' ? 'bg-[#f85149]/15 text-[#f85149]' : 'bg-[#3fb950]/15 text-[#3fb950]'}`}>{t.tradeType === 'buy' ? '买入' : '卖出'}</span></td><td className="px-2 py-2 font-medium">{t.stockName}</td><td className="px-2 py-2 text-right">{formatPrice(t.price)}</td><td className="px-2 py-2 text-right">{formatAmount(t.quantity)}</td><td className="px-2 py-2 text-right">{formatAmount(t.amount)}</td><td className="px-2 py-2 text-[#8b949e] truncate max-w-[180px]">{t.reason}</td></tr>))}</tbody>
              </table>
            )}
            {activeTab === 'signals' && signals.length === 0 && (<div className="text-center py-12 text-[#8b949e] text-sm">暂无买卖信号，将于首个交易日开市后生成</div>)}
            {activeTab === 'signals' && signals.length > 0 && (
              <table className="w-full text-xs"><thead className="bg-[#161b22]"><tr className="text-[#8b949e]"><th className="px-2 py-2 text-left font-medium">信号类型</th><th className="px-2 py-2 text-left font-medium">股票</th><th className="px-2 py-2 text-left font-medium">原因</th><th className="px-2 py-2 text-right font-medium">目标价</th><th className="px-2 py-2 text-right font-medium">止损价</th><th className="px-2 py-2 text-center font-medium">评分</th><th className="px-2 py-2 text-left font-medium">时间</th></tr></thead>
                <tbody>{signals.map((s) => (<tr key={s.id} className="border-t border-[#30363d]/50 hover:bg-[#30363d]/20"><td className="px-2 py-2"><span className={`text-[10px] px-1.5 py-0.5 rounded ${s.signalType === 'buy' ? 'bg-[#f85149]/15 text-[#f85149]' : s.signalType === 'sell' ? 'bg-[#3fb950]/15 text-[#3fb950]' : 'bg-[#f0883e]/15 text-[#f0883e]'}`}>{s.signalType === 'buy' ? '买入' : s.signalType === 'sell' ? '卖出' : '关注'}</span></td><td className="px-2 py-2 font-medium">{s.stockName}</td><td className="px-2 py-2 text-[#e6edf3] truncate max-w-[200px]">{s.signalReason}</td><td className="px-2 py-2 text-right text-[#f85149]">{formatPrice(s.targetPrice)}</td><td className="px-2 py-2 text-right text-[#3fb950]">{formatPrice(s.stopLossPrice)}</td><td className="px-2 py-2 text-center"><span className="text-[#d2a8ff] font-medium">{s.score}分</span></td><td className="px-2 py-2 text-[#8b949e]">{formatDateTime(s.signalTime)}</td></tr>))}</tbody>
              </table>
            )}
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4"><h3 className="text-sm font-semibold mb-2">仓位分布</h3><div style={{ height: 200 }}><ReactECharts option={pieOption} style={{ height: '100%', width: '100%' }} /></div></div>
          <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4"><div className="flex items-center gap-2 mb-3"><Bell size={14} className="text-[#f0883e]" /><h3 className="text-sm font-semibold">持仓消息</h3></div><div className="space-y-2">{POSITION_NEWS.map((n, i) => (<div key={i} className="bg-[#0d1117] border border-[#30363d] rounded p-2"><div className="flex items-center justify-between mb-1"><span className="text-xs font-medium">{n.stock}</span><span className={`text-[10px] px-1.5 py-0.5 rounded ${impactClass(n.impact)}`}>{n.impact}</span></div><div className="text-xs text-[#8b949e] line-clamp-1">{n.title}</div><div className="text-[10px] text-[#8b949e] mt-1">{n.time}</div></div>))}</div></div>
        </div>
      </div>
    </div>
  );
};

export default SimTradePage;