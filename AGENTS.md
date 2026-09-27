# A股智监 - 全局研发规范

## 项目概览

A股智能数据监测与量化模拟交易系统，包含8大模块，支持PC端深色主题管理看板和移动端（同花顺风格）两个视图。

- 数据日期基准：2026-09-24
- 涨红跌绿（A股惯例）
- 真实数据标注「实时数据」，模拟数据标注「模拟数据」

## 技术架构

- 前端：React 19 + TypeScript + Tailwind CSS + ECharts
- 后端：NestJS + Drizzle ORM + PostgreSQL
- 双视图：PC端深色主题 / 移动端浅色主题（同花顺风格）

## 设计规范

### 色彩系统

**PC端深色主题**
- 背景主色：#0d1117
- 背景次色：#161b22
- 背景卡片：#1c2128
- 边框色：#30363d
- 文字主色：#e6edf3
- 文字次色：#8b949e
- 上涨红：#f85149
- 下跌绿：#3fb950
- 主色调：#58a6ff

**移动端浅色主题（同花顺风格）**
- 背景主色：#f5f5f5
- 背景卡片：#ffffff
- 文字主色：#333333
- 文字次色：#999999
- 上涨红：#f5222d
- 下跌绿：#52c41a
- 主色调：#1890ff

### 布局规范

**PC端**
- 左侧导航栏宽度：220px
- 顶部状态栏高度：56px
- 内容区内边距：16px
- 卡片间距：12px
- 数据密集型布局，信息密度高

**移动端（375px宽度模拟）**
- 底部导航高度：50px
- 顶部搜索栏高度：44px
- 卡片圆角：8px
- 内容区内边距：12px

### 字号层级

- 大标题：20px / 700
- 模块标题：16px / 600
- 正文：14px / 400
- 辅助文字：12px / 400
- 数据大字：24px / 700（指数点位）

### 数据标注

- 真实数据：蓝色标签「实时数据」
- 模拟数据：灰色标签「模拟数据」

## 模块清单

1. 行情板块实时监测（market-monitor）
2. 板块资金曲线可视化（sector-fund-flow）
3. 个股资金排名Top30（stock-ranking）
4. 龙虎榜分析（dragon-tiger）
5. 模拟盘（sim-trade）- PC + 移动端
6. 消息栏（news-feed）- 6分类
7. 自动化升级与复盘学习（review-learning）
8. 专属知识库（knowledge-base）

## 数据库表

- stock_index：大盘指数（含历史）
- stock_basic：个股基础信息
- sector_info：板块信息
- sector_fund_flow：板块资金流向
- stock_fund_flow：个股资金流向
- dragon_tiger：龙虎榜数据
- news_message：消息记录
- sim_account：模拟账户
- sim_position：模拟持仓
- sim_trade：交易记录
- sim_review：交易复盘
- knowledge_item：知识库条目
