# A股智监系统 (astock-monitor)

A股智能数据监测与量化模拟交易系统，基于 React + NestJS + PostgreSQL 全栈开发。

## 功能模块

1. **行情监测** - 大盘指数、板块涨跌、消息速递
2. **板块资金** - 板块资金曲线、科技AI细分赛道(上中下游25个)
3. **个股排名** - Top30个股、四维深度分析(资金/消息/技术/领涨领跌)
4. **龙虎榜分析** - 席位风格库、上板概率分析
5. **模拟交易** - PC+移动端模拟盘、持仓、交易记录
6. **消息资讯** - 6大分类消息流
7. **复盘学习** - 升级点、学习路径
8. **知识库** - 股票知识管理

## 技术栈

- **前端**: React 19 + TypeScript + Tailwind CSS 4 + ECharts 6
- **后端**: NestJS 10 + Drizzle ORM + PostgreSQL
- **双视图**: PC端深色主题 / 移动端浅色主题(同花顺风格)

## 数据日期

基准数据日期: 2026-09-24

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式(前后端同时启动)
npm run dev

# 构建生产版本
npm run build
```

## 目录结构

```
astock-monitor/
├── client/          # React 前端
├── server/          # NestJS 后端
├── shared/          # 前后端共享类型
├── scripts/         # 构建/开发脚本
└── package.json
```

## 数据库

共 12 张表: stock_index, stock_basic, sector_info, sector_fund_flow_history,
dragon_tiger, news_message, sim_account, sim_position, sim_trade, sim_review,
trade_signal, knowledge_item
