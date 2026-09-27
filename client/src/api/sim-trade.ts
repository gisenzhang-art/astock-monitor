import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { SimAccount, SimPosition, SimTrade, TradeSignal } from '@shared/api.interface';

export const MOCK_ACCOUNT: SimAccount = { id: 'acc1', userId: 'user1', totalAsset: 100000, positionValue: 0, availableCash: 100000, todayProfit: 0, todayProfitPercent: 0, totalProfit: 0, totalProfitPercent: 0, initialCapital: 100000 };
export const MOCK_POSITIONS: SimPosition[] = [];
export const MOCK_TRADES: SimTrade[] = [];
export const MOCK_SIGNALS: TradeSignal[] = [];
export const getSimAccount = async (): Promise<SimAccount> => { try { const res = await axiosForBackend.get('/api/sim-trade/account'); return res.data?.data ?? MOCK_ACCOUNT; } catch (e) { logger.warn('getSimAccount fallback to mock', e); return MOCK_ACCOUNT; } };
export const getSimPositions = async (): Promise<SimPosition[]> => { try { const res = await axiosForBackend.get('/api/sim-trade/positions'); return res.data?.data ?? MOCK_POSITIONS; } catch (e) { logger.warn('getSimPositions fallback to mock', e); return MOCK_POSITIONS; } };
export const getSimTrades = async (): Promise<SimTrade[]> => { try { const res = await axiosForBackend.get('/api/sim-trade/trades'); return res.data?.data ?? MOCK_TRADES; } catch (e) { logger.warn('getSimTrades fallback to mock', e); return MOCK_TRADES; } };
export const getTradeSignals = async (): Promise<TradeSignal[]> => { try { const res = await axiosForBackend.get('/api/sim-trade/signals'); return res.data?.data ?? MOCK_SIGNALS; } catch (e) { logger.warn('getTradeSignals fallback to mock', e); return MOCK_SIGNALS; } };
export const resetAccount = async (): Promise<SimAccount> => { try { const res = await axiosForBackend.post('/api/sim-trade/reset'); return res.data?.data ?? MOCK_ACCOUNT; } catch (e) { logger.warn('resetAccount fallback to mock', e); return MOCK_ACCOUNT; } };