import React from 'react';
import { Route, Routes } from 'react-router-dom';
import PcLayout from './components/PcLayout';
import MobileLayout from './components/MobileLayout';
import NotFound from './pages/NotFound/NotFound';
import MarketMonitorPage from './pages/MarketMonitor/MarketMonitorPage';
import SectorFundFlowPage from './pages/SectorFundFlow/SectorFundFlowPage';
import StockRankingPage from './pages/StockRanking/StockRankingPage';
import DragonTigerPage from './pages/DragonTiger/DragonTigerPage';
import SimTradePage from './pages/SimTrade/SimTradePage';
import NewsFeedPage from './pages/NewsFeed/NewsFeedPage';
import ReviewLearningPage from './pages/ReviewLearning/ReviewLearningPage';
import KnowledgeBasePage from './pages/KnowledgeBase/KnowledgeBasePage';
import MobileHomePage from './pages/mobile/MobileHome/MobileHomePage';
import MobileQuotesPage from './pages/mobile/MobileQuotes/MobileQuotesPage';
import MobileTradePage from './pages/mobile/MobileTrade/MobileTradePage';
import MobileNewsPage from './pages/mobile/MobileNews/MobileNewsPage';
import MobileProfilePage from './pages/mobile/MobileProfile/MobileProfilePage';
import ViewTogglePage from './pages/ViewToggle/ViewTogglePage';

const RoutesComponent = () => {
  return (
    <Routes>
      <Route path="/" element={<ViewTogglePage />} />
      <Route element={<PcLayout />}>
        <Route path="pc" element={<MarketMonitorPage />} />
        <Route path="pc/market" element={<MarketMonitorPage />} />
        <Route path="pc/sector" element={<SectorFundFlowPage />} />
        <Route path="pc/ranking" element={<StockRankingPage />} />
        <Route path="pc/dragon-tiger" element={<DragonTigerPage />} />
        <Route path="pc/sim-trade" element={<SimTradePage />} />
        <Route path="pc/news" element={<NewsFeedPage />} />
        <Route path="pc/review" element={<ReviewLearningPage />} />
        <Route path="pc/knowledge" element={<KnowledgeBasePage />} />
      </Route>
      <Route element={<MobileLayout />}>
        <Route path="m" element={<MobileHomePage />} />
        <Route path="m/home" element={<MobileHomePage />} />
        <Route path="m/quotes" element={<MobileQuotesPage />} />
        <Route path="m/trade" element={<MobileTradePage />} />
        <Route path="m/news" element={<MobileNewsPage />} />
        <Route path="m/profile" element={<MobileProfilePage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;
