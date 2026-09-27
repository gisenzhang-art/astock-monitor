export const formatNumber = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return '--';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (Number.isNaN(n)) return '--';
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
};
export const formatPercent = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return '--';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (Number.isNaN(n)) return '--';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
};
export const formatAmount = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null) return '--';
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return '--';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e8) return `${sign}${(abs / 1e8).toFixed(2)}亿`;
  if (abs >= 1e4) return `${sign}${(abs / 1e4).toFixed(2)}万`;
  return `${sign}${abs.toFixed(2)}`;
};
export const getUpDownClass = (value: number | undefined | null): string => {
  if (value === undefined || value === null || value === 0) return 'text-[#8b949e]';
  return value > 0 ? 'text-[#f85149]' : 'text-[#3fb950]';
};
export const getUpDownBgClass = (value: number | undefined | null): string => {
  if (value === undefined || value === null || value === 0) return 'bg-[#8b949e]/10';
  return value > 0 ? 'bg-[#f85149]/10' : 'bg-[#3fb950]/10';
};
export const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const formatDateTime = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
export const formatSignAmount = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) return '--';
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
  return `${sign}${formatAmount(Math.abs(amount))}`;
};
export const formatVolume = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '--';
  const abs = Math.abs(value);
  if (abs >= 1e8) return `${(abs / 1e8).toFixed(2)}亿`;
  if (abs >= 1e4) return `${(abs / 1e4).toFixed(0)}万`;
  return abs.toFixed(0);
};
export const formatPrice = (value: number | undefined | null, digits = 2): string => {
  if (value === undefined || value === null) return '--';
  return value.toFixed(digits);
};
export const formatMoney = formatAmount;
export const changeColor = getUpDownClass;