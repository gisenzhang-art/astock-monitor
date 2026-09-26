# 系统架构

## 技术栈
- 前端：React 18 + TypeScript + Tailwind CSS + ECharts 5 + shadcn/ui
- 后端：NestJS + RESTful API
- 数据库：PostgreSQL（12张表）
- 权限：RLS行级权限控制

## 数据库表
1. indices - 大盘指数（含历史）
2. stocks - 个股信息
3. sectors - 板块信息（申万一级）
4. sector_fund_flows - 板块资金流向历史
5. stock_fund_flows - 个股资金流向
6. dragon_tiger - 龙虎榜数据
7. simulation_account - 模拟账户
8. simulation_holdings - 模拟持仓
9. simulation_trades - 交易记录
10. messages - 消息中心（6分类）
11. knowledge_base - 知识库
12. trade_reviews - 交易复盘

## API模块
- MarketModule: 行情/板块/汇报
- SectorFundModule: 资金曲线/AI赛道
- StockRankingModule: Top30排名/分析
- DragonTigerModule: 龙虎榜/推荐
- SimulationModule: 账户/持仓/买卖(T+1)/信号
- MessageModule: 6分类消息
- KnowledgeModule: 知识库/统计

## 模拟盘策略
- T+1: 买入次日才可卖出
- 评分: 资金流向30% + 技术面30% + 消息面25% + 板块轮动15%
- 买入信号: 综合评分>70
- 卖出信号: 评分<40或触及止损
- 止损: -5%(个股)/-8%(组合)
- 止盈: +10%(个股)或移动止盈(最高回撤3%)
