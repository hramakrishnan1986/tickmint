import type {
  CapitalEntry,
  DailyReview,
  Trade,
  TradingAccount,
} from '../sampleData';

export function rowToTrade(row: any): Trade {
  return {
    id: row.id,
    date: row.trade_date,
    accountId: row.account_id || '',
    market: row.market || 'Futures',
    instrument: row.instrument,
    instrumentType: row.instrument_type || 'Futures',
    direction: row.direction,
    optionType: row.option_type || '',
    strikePrice:
      row.strike_price == null ? undefined : Number(row.strike_price),
    expiryDate: row.expiry_date || '',
    strategy: row.strategy,
    entry: Number(row.entry_price),
    exit: Number(row.exit_price),
    quantity: Number(row.quantity),
    lotSize: Number(row.lot_size || 1),
    lots: Number(row.lots || 1),
    stopLoss: row.stop_loss == null ? undefined : Number(row.stop_loss),
    target: row.target == null ? undefined : Number(row.target),
    brokerage: Number(row.brokerage || 0),
    exchangeCharges: Number(row.exchange_charges || 0),
    taxes: Number(row.taxes || 0),
    slippage: Number(row.slippage || 0),
    charges: Number(row.charges || 0),
    grossPnl: Number(row.gross_pnl || 0),
    pnl: Number(row.net_pnl),
    followedRules: Boolean(row.followed_rules),
    emotion: row.emotion || 'Focused',
    notes: row.notes || '',
    screenshotUrl: row.screenshot_url || '',
  };
}

export function tradeToRow(trade: Trade, userId: string) {
  return {
    id: trade.id,
    user_id: userId,
    account_id: trade.accountId || null,
    trade_date: trade.date,
    market: trade.market,
    instrument: trade.instrument,
    instrument_type: trade.instrumentType,
    direction: trade.direction,
    option_type: trade.optionType || null,
    strike_price: trade.strikePrice || null,
    expiry_date: trade.expiryDate || null,
    strategy: trade.strategy,
    entry_price: trade.entry,
    exit_price: trade.exit,
    quantity: trade.quantity,
    lot_size: trade.lotSize,
    lots: trade.lots,
    stop_loss: trade.stopLoss || null,
    target: trade.target || null,
    brokerage: trade.brokerage,
    exchange_charges: trade.exchangeCharges,
    taxes: trade.taxes,
    slippage: trade.slippage,
    charges: trade.charges,
    gross_pnl: trade.grossPnl,
    net_pnl: trade.pnl,
    followed_rules: trade.followedRules,
    emotion: trade.emotion,
    notes: trade.notes,
    screenshot_url: trade.screenshotUrl || null,
  };
}

export function rowToAccount(row: any): TradingAccount {
  return {
    id: row.id,
    name: row.name,
    broker: row.broker,
    accountType: row.account_type,
    startingCapital: Number(row.starting_capital),
    isDefault: Boolean(row.is_default),
  };
}

export function accountToRow(account: TradingAccount, userId: string) {
  return {
    id: account.id,
    user_id: userId,
    name: account.name,
    broker: account.broker,
    account_type: account.accountType,
    starting_capital: account.startingCapital,
    is_default: account.isDefault,
  };
}

export function rowToCapital(row: any): CapitalEntry {
  return {
    id: row.id,
    date: row.entry_date,
    accountId: row.account_id || '',
    type: row.entry_type,
    amount: Number(row.amount),
    note: row.note || '',
  };
}

export function rowToReview(row: any): DailyReview {
  return {
    id: row.id,
    date: row.review_date,
    mood: row.mood || 'Neutral',
    focus: Number(row.focus || 3),
    sleep: Number(row.sleep || 3),
    stress: Number(row.stress || 3),
    confidence: Number(row.confidence || 3),
    followedPlan: Boolean(row.followed_plan),
    overtraded: Boolean(row.overtraded),
    revengeTraded: Boolean(row.revenge_traded),
    movedStopLoss: Boolean(row.moved_stop_loss),
    positionSizeCorrect: Boolean(row.position_size_correct),
    wentWell: row.went_well || '',
    wentWrong: row.went_wrong || '',
    lesson: row.lesson || '',
    completed: Boolean(row.completed),
  };
}

export function reviewToRow(review: DailyReview, userId: string) {
  return {
    id: review.id,
    user_id: userId,
    review_date: review.date,
    mood: review.mood,
    focus: review.focus,
    sleep: review.sleep,
    stress: review.stress,
    confidence: review.confidence,
    followed_plan: review.followedPlan,
    overtraded: review.overtraded,
    revenge_traded: review.revengeTraded,
    moved_stop_loss: review.movedStopLoss,
    position_size_correct: review.positionSizeCorrect,
    went_well: review.wentWell,
    went_wrong: review.wentWrong,
    lesson: review.lesson,
    completed: review.completed,
  };
}
