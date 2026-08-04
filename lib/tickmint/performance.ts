import type { Trade } from '../sampleData';

export type ExtendedMetrics = {
  averageWinner: number;
  averageLoser: number;
  expectancy: number;
  payoffRatio: number;
  maxDrawdown: number;
  recoveryFactor: number;
  largestWinner: number;
  largestLoser: number;
  consecutiveWins: number;
  consecutiveLosses: number;
};

function longestStreak(trades: Trade[], predicate: (trade: Trade) => boolean): number {
  let longest = 0;
  let current = 0;
  for (const trade of [...trades].sort((a, b) => a.date.localeCompare(b.date))) {
    current = predicate(trade) ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
}

export function calculateExtendedMetrics(trades: Trade[]): ExtendedMetrics {
  const wins = trades.filter((trade) => trade.pnl > 0);
  const losses = trades.filter((trade) => trade.pnl < 0);
  const averageWinner = wins.length ? wins.reduce((sum, trade) => sum + trade.pnl, 0) / wins.length : 0;
  const averageLoser = losses.length ? Math.abs(losses.reduce((sum, trade) => sum + trade.pnl, 0) / losses.length) : 0;
  const winRate = trades.length ? wins.length / trades.length : 0;
  const expectancy = winRate * averageWinner - (1 - winRate) * averageLoser;
  const payoffRatio = averageLoser ? averageWinner / averageLoser : 0;

  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;
  for (const trade of [...trades].sort((a, b) => a.date.localeCompare(b.date))) {
    equity += trade.pnl;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, peak - equity);
  }

  const netPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);

  return {
    averageWinner,
    averageLoser,
    expectancy,
    payoffRatio,
    maxDrawdown,
    recoveryFactor: maxDrawdown ? netPnl / maxDrawdown : netPnl > 0 ? 1 : 0,
    largestWinner: wins.length ? Math.max(...wins.map((trade) => trade.pnl)) : 0,
    largestLoser: losses.length ? Math.abs(Math.min(...losses.map((trade) => trade.pnl))) : 0,
    consecutiveWins: longestStreak(trades, (trade) => trade.pnl > 0),
    consecutiveLosses: longestStreak(trades, (trade) => trade.pnl < 0),
  };
}
