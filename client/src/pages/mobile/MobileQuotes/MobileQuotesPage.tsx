import { useState } from 'react';
import { Search } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import MiniSparkline, { generateIntradayData } from '@client/src/components/MiniSparkline';
import { formatPrice, formatPercent, changeColor } from '@client/src/utils/format';

const sectorList = [
  { name: '半导体', changePercent: 3.25 }, { name: '光学光电子', changePercent: 2.98 },
  { name: '软件开发', changePercent: 2.76 }, { name: '计算机设备', changePercent: 2.54 },
  { name: '通信设备', changePercent: 2.31 }, { name: '消费电子', changePercent: 2.18 },
  { name: '游戏', changePercent: 2.05 }, { name: '电池', changePercent: 1.93 },
  { name: '光伏设备', changePercent: 1.85 }, { name: '风电设备', changePercent: 1.72 },
  { name: '汽车整车', changePercent: 1.64 }, { name: '汽车零部件', changePercent: 1.53 },
  { name: '能源金属', changePercent: 1.48 }, { name: '小金属', changePercent: 1.36 },
  { name: '装修建材', changePercent: 1.25 }, { name: '家电行业', changePercent: 1.12 },
  { name: '银行', changePercent: 0.55 }, { name: '保险', changePercent: 0.32 },
  { name: '证券', changePercent: 0.18 }, { name: '石油行业', changePercent: -0.15 },
  { name: '煤炭行业', changePercent: -0.38 }, { name: '钢铁行业', changePercent: -0.52 },
  { name: '房地产', changePercent: -0.85 }, { name: '建筑装饰', changePercent: -1.03 },
  { name: '医疗服务', changePercent: -1.24 }, { name: '美容护理', changePercent: -1.45 },
  { name: '教育', changePercent: -1.68 }, { name: '农牧饲渔', changePercent: -1.92 },
  { name: '商贸零售', changePercent: -2.15 }, { name: '纺织服装', changePercent: -2.38 },
];

const stockRanking = [
  { name: '寒武纪', code: '688256', price: 286.5, changePercent: 20.01 },
  { name: '海光信息', code: '688041', price: 85.32, changePercent: 15.68 },
  { name: '中芯国际', code: '688981', price: 62.18, changePercent: 12.35 },
  { name: '北方华创', code: '002371', price: 325.6, changePercent: 10.02 },
  { name: '韦尔股份', code: '603501', price: 128.45, changePercent: 9.87 },
  { name: '兆易创新', code: '603986', price: 156.72, changePercent: 8.65 },
  { name: '紫光国微', code: '002049', price: 98.36, changePercent: 7.82 },
  { name: '长电科技', code: '600584', price: 32.56, changePercent: 7.24 },
  { name: '通富微电', code: '002156', price: 26.84, changePercent: 6.95 },
  { name: '澜起科技', code: '688008', price: 68.72, changePercent: 6.52 },
];

type TabType = 'sector' | 'stock' | 'star50';
const tabs: { key: TabType; label: string }[] = [
  { key: 'sector', label: '板块排行' }, { key: 'stock', label: '个股排行' }, { key: 'star50', label: '科创50' },
];

const MobileQuotesPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('sector');
  return (
    <div className="bg-[#f5f5f5] min-h-full pb-4">
      <div className="bg-white px-3 py-2 border-b border-[#eee]">
        <div className="h-8 bg-[#f0f0f0] rounded-full flex items-center px-3 text-[#999] text-sm">
          <Search size={14} className="mr-1.5" />搜索股票/代码/板块
        </div>
      </div>
      <div className="bg-white px-3 flex gap-6 border-b border-[#eee]">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`py-3 text-sm font-medium relative ${activeTab === tab.key ? 'text-[#1890ff]' : 'text-[#333]'}`}>
            {tab.label}
            {activeTab === tab.key && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#1890ff] rounded-full" />}
          </button>
        ))}
      </div>
      {activeTab === 'sector' && (
        <div className="bg-white">
          {sectorList.map((s, i) => (
            <div key={s.name} className="flex items-center px-3 py-3 border-b border-[#f5f5f5]">
              <div className={`w-6 text-sm font-medium ${i < 3 ? 'text-[#f5222d]' : 'text-[#999]'}`}>{i + 1}</div>
              <div className="flex-1 text-sm text-[#333] font-medium">{s.name}</div>
              <div className={`w-20 text-right text-sm font-semibold ${changeColor(s.changePercent)}`}>{formatPercent(s.changePercent)}</div>
            </div>
          ))}
        </div>
      )}
      {activeTab === 'stock' && (
        <div className="bg-white">
          {stockRanking.map((s, i) => (
            <div key={s.code} className="flex items-center px-3 py-3 border-b border-[#f5f5f5]">
              <div className={`w-6 text-sm font-medium ${i < 3 ? 'text-[#f5222d]' : 'text-[#999]'}`}>{i + 1}</div>
              <div className="flex-1">
                <div className="text-sm text-[#333] font-medium flex items-center gap-1.5">{s.name}
                  <MiniSparkline data={generateIntradayData(s.price, s.changePercent)} upColor="#f5222d" downColor="#52c41a" width={60} height={24} />
                </div>
                <div className="text-xs text-[#999]">{s.code}</div>
              </div>
              <div className={`w-20 text-right text-sm font-medium ${changeColor(s.changePercent)}`}>{formatPrice(s.price)}</div>
              <div className={`w-20 text-right text-sm font-semibold ${changeColor(s.changePercent)}`}>{formatPercent(s.changePercent)}</div>
            </div>
          ))}
        </div>
      )}
      {activeTab === 'star50' && <div className="bg-white p-6 text-center text-sm text-[#999]">科创50数据加载中...</div>}
    </div>
  );
};
export default MobileQuotesPage;