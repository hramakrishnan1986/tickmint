export type TradingAccount = {
  id: string;
  name: string;
  broker: string;
  accountType: 'Live' | 'Paper';
  startingCapital: number;
  isDefault: boolean;
};

export type CapitalEntry = {
  id: string;
  date: string;
  accountId: string;
  type: 'Deposit' | 'Withdrawal' | 'Fee' | 'Adjustment' | 'Dividend';
  amount: number;
  note: string;
};

export type Trade = {
  id: string;
  date: string;
  accountId: string;
  market: 'Equity' | 'Futures' | 'Options' | 'Commodity' | 'Crypto' | 'Forex';
  instrument: string;
  instrumentType: string;
  direction: 'Bull' | 'Bear';
  optionType?: 'CE' | 'PE' | '';
  strikePrice?: number;
  expiryDate?: string;
  strategy: string;
  entry: number;
  exit: number;
  quantity: number;
  lotSize: number;
  lots: number;
  stopLoss?: number;
  target?: number;
  brokerage: number;
  exchangeCharges: number;
  taxes: number;
  slippage: number;
  charges: number;
  grossPnl: number;
  pnl: number;
  followedRules: boolean;
  emotion: string;
  notes: string;
  screenshotUrl?: string;
};


export type DailyReview = {
  id: string;
  date: string;
  mood: 'Excellent' | 'Good' | 'Neutral' | 'Stressed' | 'Frustrated';
  focus: number;
  sleep: number;
  stress: number;
  confidence: number;
  followedPlan: boolean;
  overtraded: boolean;
  revengeTraded: boolean;
  movedStopLoss: boolean;
  positionSizeCorrect: boolean;
  wentWell: string;
  wentWrong: string;
  lesson: string;
  completed: boolean;
};

export const sampleAccounts: TradingAccount[] = [
  {id:'acc-dhan',name:'Dhan Main',broker:'Dhan',accountType:'Live',startingCapital:120000,isDefault:true},
  {id:'acc-paper',name:'Strategy Practice',broker:'Paper Trading',accountType:'Paper',startingCapital:50000,isDefault:false}
];

export const sampleCapitalEntries: CapitalEntry[] = [
  {id:'cap-1',date:'2026-07-01',accountId:'acc-dhan',type:'Deposit',amount:20000,note:'Additional trading capital'},
  {id:'cap-2',date:'2026-07-05',accountId:'acc-dhan',type:'Fee',amount:499,note:'Data and platform charge'},
  {id:'cap-3',date:'2026-07-10',accountId:'acc-paper',type:'Adjustment',amount:5000,note:'Reset paper account balance'}
];

const base = {lotSize:1,lots:1,brokerage:40,exchangeCharges:35,taxes:25,slippage:0,charges:100,stopLoss:0,target:0,screenshotUrl:''};
export const sampleTrades: Trade[] = [
  {...base,id:'1',date:'2026-07-01',accountId:'acc-dhan',market:'Commodity',instrument:'Crude Oil',instrumentType:'Futures',direction:'Bull',strategy:'Breakout',entry:6120,exit:6165,quantity:10,grossPnl:4500,pnl:4400,followedRules:true,emotion:'Focused',notes:'Waited for retest.'},
  {...base,id:'2',date:'2026-07-02',accountId:'acc-dhan',market:'Options',instrument:'Nifty',instrumentType:'Index Option',optionType:'PE',strikePrice:25100,expiryDate:'2026-07-07',direction:'Bear',strategy:'Reversal',entry:186,exit:194.5,quantity:75,grossPnl:637.5,pnl:537.5,followedRules:true,emotion:'Calm',notes:'Good rejection at VWAP.'},
  {...base,id:'3',date:'2026-07-03',accountId:'acc-dhan',market:'Commodity',instrument:'Natural Gas',instrumentType:'Futures',direction:'Bull',strategy:'Momentum',entry:296,exit:292,quantity:125,grossPnl:-500,pnl:-600,followedRules:false,emotion:'Impatient',notes:'Entered before confirmation.'},
  {...base,id:'4',date:'2026-07-06',accountId:'acc-paper',market:'Options',instrument:'Bank Nifty',instrumentType:'Index Option',optionType:'CE',strikePrice:57200,expiryDate:'2026-07-29',direction:'Bull',strategy:'Pullback',entry:135.3,exit:139.95,quantity:30,grossPnl:139.5,pnl:39.5,followedRules:true,emotion:'Focused',notes:'Clean trend continuation.'},
  {...base,id:'5',date:'2026-07-07',accountId:'acc-dhan',market:'Commodity',instrument:'Gold',instrumentType:'Futures',direction:'Bear',strategy:'Reversal',entry:73520,exit:73410,quantity:10,grossPnl:1100,pnl:1000,followedRules:true,emotion:'Calm',notes:'Respected resistance.'},
  {...base,id:'6',date:'2026-07-08',accountId:'acc-dhan',market:'Commodity',instrument:'Crude Oil',instrumentType:'Futures',direction:'Bear',strategy:'Breakout',entry:6180,exit:6210,quantity:10,grossPnl:-300,pnl:-400,followedRules:false,emotion:'Revenge',notes:'Ignored invalidation.'},
  {...base,id:'7',date:'2026-07-09',accountId:'acc-dhan',market:'Options',instrument:'Nifty',instrumentType:'Index Option',optionType:'CE',strikePrice:25200,expiryDate:'2026-07-14',direction:'Bull',strategy:'Opening Range',entry:90.7,exit:95.42,quantity:75,grossPnl:354,pnl:254,followedRules:true,emotion:'Focused',notes:'Best trade of the week.'},
  {...base,id:'8',date:'2026-07-10',accountId:'acc-dhan',market:'Commodity',instrument:'Crude Oil',instrumentType:'Futures',direction:'Bull',strategy:'Pullback',entry:6095,exit:6148,quantity:10,grossPnl:530,pnl:430,followedRules:true,emotion:'Patient',notes:'A-grade setup.'},
  {...base,id:'9',date:'2026-07-13',accountId:'acc-paper',market:'Options',instrument:'Sensex',instrumentType:'Index Option',optionType:'PE',strikePrice:83000,expiryDate:'2026-07-16',direction:'Bear',strategy:'Breakout',entry:435,exit:444.35,quantity:20,grossPnl:187,pnl:87,followedRules:true,emotion:'Focused',notes:'Good follow-through.'},
  {...base,id:'10',date:'2026-07-14',accountId:'acc-dhan',market:'Commodity',instrument:'Crude Oil',instrumentType:'Futures',direction:'Bull',strategy:'Momentum',entry:6170,exit:6214,quantity:10,grossPnl:440,pnl:340,followedRules:true,emotion:'Calm',notes:'Strong continuation.'}
];

export const sampleDailyReviews: DailyReview[] = [
  {id:'rev-1',date:'2026-07-01',mood:'Good',focus:4,sleep:4,stress:2,confidence:4,followedPlan:true,overtraded:false,revengeTraded:false,movedStopLoss:false,positionSizeCorrect:true,wentWell:'Waited for confirmation.',wentWrong:'Could have booked partial profit.',lesson:'Keep waiting for the retest.',completed:true},
  {id:'rev-2',date:'2026-07-02',mood:'Excellent',focus:5,sleep:4,stress:1,confidence:4,followedPlan:true,overtraded:false,revengeTraded:false,movedStopLoss:false,positionSizeCorrect:true,wentWell:'Executed the reversal cleanly.',wentWrong:'Nothing material.',lesson:'Best trades feel calm.',completed:true},
  {id:'rev-3',date:'2026-07-03',mood:'Frustrated',focus:2,sleep:2,stress:5,confidence:3,followedPlan:false,overtraded:true,revengeTraded:false,movedStopLoss:true,positionSizeCorrect:false,wentWell:'Stopped after the loss.',wentWrong:'Entered early and increased risk.',lesson:'Do not trade when sleep is below 3.',completed:true},
  {id:'rev-4',date:'2026-07-06',mood:'Good',focus:4,sleep:4,stress:2,confidence:4,followedPlan:true,overtraded:false,revengeTraded:false,movedStopLoss:false,positionSizeCorrect:true,wentWell:'Followed the trend.',wentWrong:'Exit was slightly early.',lesson:'Let A-grade setups reach target.',completed:true},
  {id:'rev-5',date:'2026-07-08',mood:'Stressed',focus:2,sleep:3,stress:5,confidence:2,followedPlan:false,overtraded:true,revengeTraded:true,movedStopLoss:true,positionSizeCorrect:false,wentWell:'Journaled honestly.',wentWrong:'Revenge traded after invalidation.',lesson:'Stop after two losses.',completed:true},
  {id:'rev-6',date:'2026-07-10',mood:'Excellent',focus:5,sleep:5,stress:1,confidence:5,followedPlan:true,overtraded:false,revengeTraded:false,movedStopLoss:false,positionSizeCorrect:true,wentWell:'Patient entry and correct size.',wentWrong:'Could add screenshot annotation.',lesson:'Patience is the edge.',completed:true},
];
