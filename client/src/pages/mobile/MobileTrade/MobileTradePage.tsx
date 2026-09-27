import { useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Calendar } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { formatMoney } from '@client/src/utils/format';

type TradeTabType = 'orders' | 'trades';

const MobileTradePage = () => {
  const [tradeTab, setTradeTab] = useState<TradeTabType>('orders');
  const totalAsset = 100000;
  const availableCash = 100000;
  return (
    <div className="bg-[#f5f5f5] min-h-full pb-4">
      <div className="bg-gradient-to-b from-[#1890ff] to-[#36a3ff] text-white px-4 pt-3 pb-6">
        <div className="text-xs opacity-80 mb-1">总资产（模拟）</div>
        <div className="text-3xl font-bold mb-3">¥{totalAsset.toLocaleString()}</div>
        <div className="flex justify-between text-sm">
          <div><div className="opacity-80 text-xs mb-0.5">可用资金</div><div className="font-medium">¥{availableCash.toLocaleString()}</div></div>
          <div className="text-right"><div className="opacity-80 text-xs mb-0.5">今日盈亏</div><div className="font-medium text-white/80">¥0.00 (0.00%)</div></div>
        </div>
      </div>
      <div className="px-3 -mt-3">
        <div className="bg-[#fffbe6] border border-[#ffe58f] rounded-lg p-3 flex items-start gap-2 shadow-sm">
          <Calendar size={18} className="text-[#d48806] mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-[#d46b08] mb-0.5">模拟盘待开启</div>
            <div className="text-xs text-[#ad6800]">模拟盘将于 2026-09-28（周一）开盘后正式开始运行，初始资金 10 万元。当前持仓、交易记录与盈亏统计均已清空。</div>
          </div>
        </div>
      </div>
      <div className="px-3 mt-3">
        <div className="flex gap-3">
          <button className="flex-1 h-12 rounded-lg bg-[#f5222d] text-white text-base font-semibold flex items-center justify-center gap-2"><ArrowUpCircle size={20} />买入</button>
          <button className="flex-1 h-12 rounded-lg bg-[#52c41a] text-white text-base font-semibold flex items-center justify-center gap-2"><ArrowDownCircle size={20} />卖出</button>
        </div>
      </div>
      <div className="px-3 py-3">
        <h2 className="text-[16px] font-semibold text-[#333] mb-2 px-1">我的持仓（0只）</h2>
        <div className="bg-white rounded-lg p-6 text-center shadow-sm">
          <div className="text-sm text-[#999] mb-1">暂无持仓</div>
          <div className="text-xs text-[#bbb]">首个交易日 2026-09-28 开盘后开始建仓</div>
        </div>
      </div>
      <div className="px-3 py-2">
        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
          <div className="flex border-b border-[#eee]">
            <button onClick={() => setTradeTab('orders')} className={`flex-1 py-3 text-sm font-medium ${tradeTab === 'orders' ? 'text-[#1890ff]' : 'text-[#333]'}`}>今日委托</button>
            <button onClick={() => setTradeTab('trades')} className={`flex-1 py-3 text-sm font-medium ${tradeTab === 'trades' ? 'text-[#1890ff]' : 'text-[#333]'}`}>成交记录</button>
          </div>
          <div className="py-8 text-center text-sm text-[#999]">暂无记录</div>
        </div>
      </div>
      <div className="text-center text-xs text-[#bbb] pt-4 pb-2">— 模拟交易，不涉及真实资金 —</div>
    </div>
  );
};
export default MobileTradePage;