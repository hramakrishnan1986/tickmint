'use client';

import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Award, Brain, ClipboardCheck, Clock3, Gauge, HeartPulse, ShieldCheck, BarChart3, Bell, BookOpen, CalendarDays, ChevronDown, ChevronRight, Check, CircleDollarSign, Download, LayoutDashboard, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Palette, Plus, Search, Settings, Sun, Target, TrendingDown, TrendingUp, UserCircle, X, MessageSquare, LifeBuoy, FileText, RefreshCw, Zap } from 'lucide-react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase, supabaseConfigured } from '../../lib/supabase';
import {
  sampleAccounts,
  sampleCapitalEntries,
  sampleTrades,
  sampleDailyReviews,
  type CapitalEntry,
  type Trade,
  type TradingAccount,
  type DailyReview,
} from '../../lib/sampleData';
import type { AuthMode, ThemeMode, View } from '../../lib/tickmint/types';
import { money } from '../../lib/tickmint/format';
import {
  accountToRow,
  reviewToRow,
  rowToAccount,
  rowToCapital,
  rowToReview,
  rowToTrade,
  tradeToRow,
} from '../../lib/tickmint/mappers';
import { TickMintLogo } from './brand/TickMintLogo';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import {
  downloadTradesCsv,
  downloadWorkspaceBackup,
  printPerformanceReport,
} from '../../lib/tickmint/export';
import { calculateExtendedMetrics } from '../../lib/tickmint/performance';

export default function TickMintApp(){
  const [view,setView]=useState<View>('landing');
  const [authMode,setAuthMode]=useState<AuthMode>('login');
  const [session,setSession]=useState<Session|null>(null);
  const [user,setUser]=useState<User|null>(null);
  const [profileName,setProfileName]=useState('Trader');
  const [currency,setCurrency]=useState('INR');
  const [startingCapital,setStartingCapital]=useState(120000);
  const [trades,setTrades]=useState<Trade[]>([]);
  const [accounts,setAccounts]=useState<TradingAccount[]>([]);
  const [capitalEntries,setCapitalEntries]=useState<CapitalEntry[]>([]);
  const [reviews,setReviews]=useState<DailyReview[]>([]);
  const [demoMode,setDemoMode]=useState(false);
  const [loading,setLoading]=useState(true);
  const [syncing,setSyncing]=useState(false);
  const [error,setError]=useState('');
  const [menu,setMenu]=useState(false);
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState<Trade|null>(null);
  const [filter,setFilter]=useState('All');
  const [query,setQuery]=useState('');
  const [consent,setConsent]=useState(true);
  const [toast,setToast]=useState('');
  const [theme,setTheme]=useState<ThemeMode>('system');
  const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
  const [commandOpen,setCommandOpen]=useState(false);
  const [themeOpen,setThemeOpen]=useState(false);
  const [profileOpen,setProfileOpen]=useState(false);
  const online=useNetworkStatus();

  useEffect(()=>{
    let mounted=true;
    setConsent(localStorage.getItem('jiq_analytics_consent')!==null);
    async function boot(){
      try{
        if(!supabaseConfigured){setLoading(false);return}
        const {data,error:sessionError}=await supabase.auth.getSession();
        if(sessionError)throw sessionError;
        if(!mounted)return;
        setSession(data.session);setUser(data.session?.user||null);
        if(data.session){setView('dashboard');await loadCloudData(data.session.user)}
      }catch(error:any){
        if(mounted)setError(error?.message||'Unable to initialise the secure workspace.');
      }finally{
        if(mounted)setLoading(false);
      }
    }
    boot();
    const {data:listener}=supabase.auth.onAuthStateChange(async (_event,next)=>{
      if(!mounted)return;
      setSession(next);setUser(next?.user||null);
      if(next){setDemoMode(false);setView('dashboard');await loadCloudData(next.user)}
      else if(!demoMode){setTrades([]);setView('landing')}
    });
    return()=>{mounted=false;listener.subscription.unsubscribe()}
  },[]);


  useEffect(()=>{
    const stored=(localStorage.getItem('tickmint_theme')||'system') as ThemeMode;
    const collapsed=localStorage.getItem('tickmint_sidebar_collapsed')==='yes';
    setTheme(stored);
    setSidebarCollapsed(collapsed);
  },[]);

  useEffect(()=>{
    const root=document.documentElement;
    const apply=()=>{
      const resolved=theme==='system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')
        : theme;
      root.dataset.theme=resolved;
      root.style.colorScheme=resolved==='light'?'light':'dark';
    };
    apply();
    localStorage.setItem('tickmint_theme',theme);
    const media=window.matchMedia('(prefers-color-scheme: dark)');
    const listener=()=>theme==='system'&&apply();
    media.addEventListener?.('change',listener);
    return()=>media.removeEventListener?.('change',listener);
  },[theme]);

  useEffect(()=>{
    localStorage.setItem('tickmint_sidebar_collapsed',sidebarCollapsed?'yes':'no');
  },[sidebarCollapsed]);

  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
        event.preventDefault();
        setCommandOpen(true);
      }
      if(event.key==='Escape'){
        setCommandOpen(false);
        setThemeOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[]);

  async function loadCloudData(currentUser:User){
    setSyncing(true);setError('');
    try{
    const [{data:profile,error:profileError},{data:accountRows,error:accountError},{data:rows,error:tradeError},{data:capitalRows,error:capitalError},{data:reviewRows,error:reviewError}]=await Promise.all([
      supabase.from('profiles').select('display_name,currency,starting_capital').eq('id',currentUser.id).maybeSingle(),
      supabase.from('trading_accounts').select('*').eq('user_id',currentUser.id).order('is_default',{ascending:false}),
      supabase.from('trades').select('*').eq('user_id',currentUser.id).order('trade_date',{ascending:false}),
      supabase.from('capital_entries').select('*').eq('user_id',currentUser.id).order('entry_date',{ascending:false}),
      supabase.from('daily_reviews').select('*').eq('user_id',currentUser.id).order('review_date',{ascending:false})
    ]);
    if(profile?.display_name)setProfileName(profile.display_name);
    if(profile?.currency)setCurrency(profile.currency);
    if(profile?.starting_capital!=null)setStartingCapital(Number(profile.starting_capital));
    else setStartingCapital(120000);
    if(!profile?.display_name)setProfileName(currentUser.user_metadata?.display_name||currentUser.email?.split('@')[0]||'Trader');
    setAccounts((accountRows||[]).map(rowToAccount));
    setCapitalEntries((capitalRows||[]).map(rowToCapital));
    setReviews((reviewRows||[]).map(rowToReview));
    setTrades((rows||[]).map(rowToTrade));
    const cloudErrors=[profileError,accountError,tradeError,capitalError,reviewError].filter(Boolean);
    if(cloudErrors.length)setError(cloudErrors.map((e:any)=>e.message).join(' · '));
    }catch(error:any){
      setError(error?.message||'Unable to load your cloud workspace.');
    }finally{
      setSyncing(false);
    }
  }

  function notify(message:string){setToast(message);window.setTimeout(()=>setToast(''),2600)}
  function openTradeEntry(){
    if(!demoMode&&!accounts.length){
      setView('accounts');
      notify('Create a trading account before logging your first trade.');
      return;
    }
    setEditing(null);
    setModal(true);
  }
  function track(event:string,meta:Record<string,unknown>={}){
    if(typeof window==='undefined'||localStorage.getItem('jiq_analytics_consent')!=='yes')return;
    const rows=JSON.parse(localStorage.getItem('jiq_product_events')||'[]');
    rows.push({event,meta,at:new Date().toISOString()});
    localStorage.setItem('jiq_product_events',JSON.stringify(rows.slice(-200)));
  }
  function openDemo(){track('demo_opened');setDemoMode(true);setSession(null);setUser(null);setProfileName('Harish');setCurrency('INR');setStartingCapital(120000);setAccounts(sampleAccounts);setCapitalEntries(sampleCapitalEntries);setTrades(sampleTrades);setReviews(sampleDailyReviews);setView('dashboard')}
  async function logout(){if(demoMode){setDemoMode(false);setTrades([]);setAccounts([]);setCapitalEntries([]);setReviews([]);setView('landing');return}await supabase.auth.signOut()}
  async function saveTrade(t:Trade,file?:File|null){
    if(syncing)return;
    if(demoMode){
      track('trade_saved',{market:t.market,direction:t.direction});
      if(file)t.screenshotUrl=URL.createObjectURL(file);
      setTrades(previous=>editing
        ?previous.map(item=>item.id===t.id?t:item)
        :[t,...previous]);
      setModal(false);
      notify(editing?'Trade updated.':'Trade logged.');
      return;
    }
    if(!user){setError('Your session has expired. Please sign in again.');return}
    if(!online){setError('You are offline. Reconnect before saving this trade.');return}
    setSyncing(true);setError('');
    try{
      if(file){
        if(file.size>5*1024*1024)throw new Error('Screenshot must be 5 MB or smaller.');
        if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Only PNG, JPG and WebP screenshots are allowed.');
        const ext=(file.name.split('.').pop()||'png').toLowerCase();
        const path=`${user.id}/${t.id}-${Date.now()}.${ext}`;
        const {error:uploadError}=await supabase.storage.from('trade-screenshots').upload(path,file,{upsert:true});
        if(uploadError)throw uploadError;
        t.screenshotUrl=supabase.storage.from('trade-screenshots').getPublicUrl(path).data.publicUrl;
      }
      const {data,error}=await supabase.from('trades')
        .upsert(tradeToRow(t,user.id),{onConflict:'id'})
        .select().single();
      if(error)throw error;
      const saved=rowToTrade(data);
      setTrades(previous=>editing
        ?previous.map(item=>item.id===saved.id?saved:item)
        :[saved,...previous]);
      setModal(false);
      notify(editing?'Trade updated.':'Trade logged.');
    }catch(error:unknown){
      setError(error instanceof Error?error.message:'Unable to save the trade.');
    }finally{
      setSyncing(false);
    }
  }

  async function deleteTrade(id:string){
    if(!confirm('Delete this trade permanently?'))return;
    if(demoMode){setTrades(previous=>previous.filter(trade=>trade.id!==id));return}
    if(!user){setError('Your session has expired. Please sign in again.');return}
    setSyncing(true);setError('');
    try{
      const {error}=await supabase.from('trades').delete().eq('id',id).eq('user_id',user.id);
      if(error)throw error;
      setTrades(previous=>previous.filter(trade=>trade.id!==id));
      notify('Trade deleted.');
    }catch(error:unknown){
      setError(error instanceof Error?error.message:'Unable to delete the trade.');
    }finally{setSyncing(false)}
  }

  async function saveAccount(account:TradingAccount){
    if(demoMode){
      setAccounts(previous=>previous.some(item=>item.id===account.id)
        ?previous.map(item=>item.id===account.id?account:item)
        :[account,...previous]);
      return;
    }
    if(!user){setError('Your session has expired. Please sign in again.');return}
    setSyncing(true);setError('');
    try{
      if(account.isDefault){
        const {error:defaultError}=await supabase.from('trading_accounts').update({is_default:false}).eq('user_id',user.id);
        if(defaultError)throw defaultError;
      }
      const {data,error}=await supabase.from('trading_accounts')
        .upsert(accountToRow(account,user.id),{onConflict:'id'})
        .select().single();
      if(error)throw error;
      const saved=rowToAccount(data);
      setAccounts(previous=>{
        let updated=previous.some(item=>item.id===saved.id)
          ?previous.map(item=>item.id===saved.id?saved:item)
          :[saved,...previous];
        if(saved.isDefault)updated=updated.map(item=>({...item,isDefault:item.id===saved.id}));
        return updated;
      });
      notify('Trading account saved.');
    }catch(error:unknown){
      setError(error instanceof Error?error.message:'Unable to save the trading account.');
    }finally{setSyncing(false)}
  }

  async function deleteAccount(id:string){
    if(trades.some(trade=>trade.accountId===id)){alert('Move or delete trades linked to this account first.');return}
    if(!confirm('Delete this trading account permanently?'))return;
    if(demoMode){setAccounts(previous=>previous.filter(account=>account.id!==id));return}
    if(!user){setError('Your session has expired. Please sign in again.');return}
    setSyncing(true);setError('');
    try{
      const {error}=await supabase.from('trading_accounts').delete().eq('id',id).eq('user_id',user.id);
      if(error)throw error;
      setAccounts(previous=>previous.filter(account=>account.id!==id));
      notify('Trading account deleted.');
    }catch(error:unknown){
      setError(error instanceof Error?error.message:'Unable to delete the trading account.');
    }finally{setSyncing(false)}
  }

  async function saveCapital(entry:CapitalEntry){
    if(demoMode){setCapitalEntries(previous=>[entry,...previous]);return}
    if(!user){setError('Your session has expired. Please sign in again.');return}
    setSyncing(true);setError('');
    try{
      const {data,error}=await supabase.from('capital_entries').insert({
        id:entry.id,user_id:user.id,account_id:entry.accountId||null,
        entry_date:entry.date,entry_type:entry.type,amount:entry.amount,note:entry.note||null
      }).select().single();
      if(error)throw error;
      setCapitalEntries(previous=>[rowToCapital(data),...previous]);
      notify('Capital entry saved.');
    }catch(error:unknown){
      setError(error instanceof Error?error.message:'Unable to save the capital entry.');
    }finally{setSyncing(false)}
  }

  async function deleteCapital(id:string){
    if(!confirm('Delete this capital entry permanently?'))return;
    if(demoMode){setCapitalEntries(previous=>previous.filter(entry=>entry.id!==id));return}
    if(!user){setError('Your session has expired. Please sign in again.');return}
    setSyncing(true);setError('');
    try{
      const {error}=await supabase.from('capital_entries').delete().eq('id',id).eq('user_id',user.id);
      if(error)throw error;
      setCapitalEntries(previous=>previous.filter(entry=>entry.id!==id));
      notify('Capital entry deleted.');
    }catch(error:unknown){
      setError(error instanceof Error?error.message:'Unable to delete the capital entry.');
    }finally{setSyncing(false)}
  }

  async function saveReview(review:DailyReview){
    if(syncing)return;
    if(demoMode){
      setReviews(previous=>previous.some(item=>item.date===review.date)
        ?previous.map(item=>item.date===review.date?review:item)
        :[review,...previous]);
      notify('Daily review saved.');
      return;
    }
    if(!user){setError('Your session has expired. Please sign in again.');return}
    if(!online){setError('You are offline. Reconnect before saving the review.');return}
    setSyncing(true);setError('');
    try{
      const {data,error}=await supabase.from('daily_reviews')
        .upsert(reviewToRow(review,user.id),{onConflict:'user_id,review_date'})
        .select().single();
      if(error)throw error;
      const saved=rowToReview(data);
      setReviews(previous=>previous.some(item=>item.date===saved.date)
        ?previous.map(item=>item.date===saved.date?saved:item)
        :[saved,...previous]);
      notify('Daily review saved.');
    }catch(error:unknown){
      setError(error instanceof Error?error.message:'Unable to save the daily review.');
    }finally{
      setSyncing(false);
    }
  }

  const stats=useMemo(()=>{
    const net=trades.reduce((s,t)=>s+t.pnl,0);const wins=trades.filter(t=>t.pnl>0);const losses=trades.filter(t=>t.pnl<0);const grossWin=wins.reduce((s,t)=>s+t.pnl,0);const grossLoss=Math.abs(losses.reduce((s,t)=>s+t.pnl,0));
    const accountBase=accounts.length?accounts.reduce((s,a)=>s+a.startingCapital,0):startingCapital;
    const ledger=capitalEntries.reduce((s,e)=>s+(e.type==='Deposit'||e.type==='Dividend'||e.type==='Adjustment'?e.amount:-e.amount),0);
    return {net,wins:wins.length,losses:losses.length,winRate:trades.length?wins.length/trades.length*100:0,profitFactor:grossLoss?grossWin/grossLoss:grossWin,capital:accountBase+ledger+net,discipline:trades.length?trades.filter(t=>t.followedRules).length/trades.length*100:0,ledger,accountBase};
  },[trades,startingCapital,accounts,capitalEntries]);
  const extendedMetrics=useMemo(()=>calculateExtendedMetrics(trades),[trades]);
  const equity=useMemo(()=>{let c=stats.accountBase+stats.ledger;return [...trades].sort((a,b)=>a.date.localeCompare(b.date)).map(t=>({date:t.date.slice(5),equity:c+=t.pnl,pnl:t.pnl}));},[trades,stats.accountBase,stats.ledger]);
  const instrumentData=useMemo(()=>Object.values(trades.reduce((acc:any,t)=>{acc[t.instrument]??={name:t.instrument,pnl:0,trades:0,wins:0};acc[t.instrument].pnl+=t.pnl;acc[t.instrument].trades++;if(t.pnl>0)acc[t.instrument].wins++;return acc;},{})).map((x:any)=>({...x,winRate:x.trades?Math.round(x.wins/x.trades*100):0})),[trades]);
  const strategyData=useMemo(()=>Object.values(trades.reduce((acc:any,t)=>{acc[t.strategy]??={name:t.strategy,pnl:0,trades:0,wins:0};acc[t.strategy].pnl+=t.pnl;acc[t.strategy].trades++;if(t.pnl>0)acc[t.strategy].wins++;return acc;},{})).map((x:any)=>({...x,winRate:x.trades?Math.round(x.wins/x.trades*100):0})),[trades]);
  const directionData=useMemo(()=>['Bull','Bear'].map(d=>{const list=trades.filter(t=>t.direction===d);return {name:d,value:list.reduce((s,t)=>s+t.pnl,0),trades:list.length,winRate:list.length?Math.round(list.filter(t=>t.pnl>0).length/list.length*100):0};}),[trades]);
  const filtered=trades.filter(t=>(filter==='All'||t.instrument===filter)&&(`${t.instrument} ${t.strategy} ${t.notes}`.toLowerCase().includes(query.toLowerCase())));

  if(loading)return <div className="auth"><div className="authCard"><div className="brand center"><TickMintLogo/></div><h1>Loading workspace…</h1><p>Checking your secure session.</p></div></div>;
  if(view==='landing')return <Landing onDemo={openDemo} onLogin={()=>{setAuthMode('login');setView('login')}}/>;
  if(view==='login')return <AuthScreen mode={authMode} setMode={setAuthMode} onBack={()=>setView('landing')} onDemo={openDemo}/>;

  const nav=[['dashboard','Dashboard',LayoutDashboard],['journal','Trade Journal',BookOpen],['accounts','Trading Accounts',CircleDollarSign],['capital','Capital Ledger',Activity],['analytics','Analytics',BarChart3],['psychology','Psychology',Brain],['review','Daily Review',ClipboardCheck],['calendar','Calendar',CalendarDays],['expiry','Expiry Calendar',Clock3],['reports','Reports',FileText],['achievements','Achievements',Award],['feedback','Feedback & Help',LifeBuoy],['settings','Settings',Settings]] as const;
  const navGroups=[
    {label:'Workspace',items:nav.slice(0,4)},
    {label:'Intelligence',items:nav.slice(4,9)},
    {label:'Management',items:nav.slice(9)}
  ] as const;
  return <div className={`appShell ${sidebarCollapsed?'sidebarIsCollapsed':''}`}>
    <aside className={`${menu?'sidebar open':'sidebar'} ${sidebarCollapsed?'collapsed':''}`}>
      <div className="brand"><TickMintLogo compact={sidebarCollapsed}/><small>Performance intelligence</small><button className="collapseBtn" aria-label={sidebarCollapsed?'Expand sidebar':'Collapse sidebar'} onClick={()=>setSidebarCollapsed(v=>!v)}>{sidebarCollapsed?<PanelLeftOpen size={16}/>:<PanelLeftClose size={16}/>}</button></div>
      <button className="newTrade" onClick={openTradeEntry}><Plus size={18}/><span>Log a trade</span></button>
      <nav className="navGroups">{navGroups.map(group=><div className="navGroup" key={group.label}><span className="navLabel">{group.label}</span>{group.items.map(([id,label,Icon])=><button key={id} className={view===id?'nav active':'nav'} onClick={()=>{setView(id);setMenu(false);track('view_opened',{view:id})}}><Icon size={18} strokeWidth={1.8}/><span className="navText">{label}</span></button>)}</div>)}</nav>
      <div className="sidebarFoot"><div className="avatar">{profileName.charAt(0).toUpperCase()}</div><div className="sidebarProfileText"><b>{profileName}</b><small><i className={demoMode?'statusDot demo':'statusDot'}></i>{demoMode?'Demo workspace':'Cloud secured'}</small></div><button aria-label="Sign out" title="Sign out" onClick={logout}><LogOut size={16}/></button></div>
    </aside>
    <main className="main">
      <header className="topbar">
        <div className="topbarLeft">
          <button className="menuBtn" aria-label="Open navigation" onClick={()=>setMenu(!menu)}><Menu size={19}/></button>
          <div className="breadcrumb"><span className="crumb">Workspace</span><ChevronRight size={13}/><b>{nav.find(n=>n[0]===view)?.[1]}</b></div>
        </div>
        <button className="commandTrigger" onClick={()=>setCommandOpen(true)}><Search size={16}/><span>Search workspace</span><kbd>Ctrl K</kbd></button>
        <div className="topActions">
          <span className={`syncState ${syncing?'busy':'ok'}`}>{syncing?'Syncing…':demoMode?'Demo data':'Cloud synced'}</span>
          <div className="topPopoverWrap">
            <button className="iconButton" aria-label="Choose appearance" title="Appearance" onClick={()=>{setThemeOpen(v=>!v);setProfileOpen(false)}}><Palette size={17}/></button>
            {themeOpen&&<ThemeMenu theme={theme} setTheme={(next:ThemeMode)=>{setTheme(next);setThemeOpen(false)}}/>}
          </div>
          <button className="iconButton" aria-label="Notifications" title="Notifications" onClick={()=>notify('You are all caught up.')}><Bell size={17}/><span className="notificationDot"></span></button>
          <div className="topPopoverWrap">
            <button className="profileTrigger" onClick={()=>{setProfileOpen(v=>!v);setThemeOpen(false)}}><span>{profileName.charAt(0).toUpperCase()}</span><ChevronDown size={14}/></button>
            {profileOpen&&<div className="profileMenu"><div className="profileMenuHead"><div className="avatar">{profileName.charAt(0).toUpperCase()}</div><div><b>{profileName}</b><small>{user?.email||'Demo workspace'}</small></div></div><button onClick={()=>{setView('settings');setProfileOpen(false)}}><UserCircle size={16}/> Profile & settings</button><button onClick={logout}><LogOut size={16}/> Sign out</button></div>}
          </div>
          <button className="primarySm" onClick={openTradeEntry}><Plus size={16}/> Log trade</button>
        </div>
      </header>
      <div className="content">
        {!online&&<div className="offlineBanner"><b>Offline mode:</b> reconnect to save or sync cloud data.</div>}
        {error&&<div className="errorBanner"><b>Unable to sync:</b> {error}<span className="errorActions">{user&&online&&<button onClick={()=>loadCloudData(user)}><RefreshCw size={14}/> Retry</button>}<button aria-label="Dismiss error" onClick={()=>setError('')}>×</button></span></div>}
        {!supabaseConfigured&&!demoMode&&<div className="setupBanner">Add Supabase keys to <code>.env.local</code> to enable real accounts and cloud data.</div>}
        {view==='dashboard'&&<Dashboard stats={stats} equity={equity} directionData={directionData} instrumentData={instrumentData} onLog={openTradeEntry} onNav={setView}/>} 
        {view==='journal'&&<Journal
          trades={filtered}
          allTrades={trades}
          accounts={accounts}
          filter={filter}
          setFilter={setFilter}
          query={query}
          setQuery={setQuery}
          onAdd={()=>{setEditing(null);setModal(true)}}
          onEdit={(t:Trade)=>{setEditing(t);setModal(true)}}
          onDelete={deleteTrade}
        />} 
        {view==='accounts'&&<AccountsView accounts={accounts} trades={trades} onSave={saveAccount} onDelete={deleteAccount}/>} 
        {view==='capital'&&<CapitalLedger entries={capitalEntries} accounts={accounts} onSave={saveCapital} onDelete={deleteCapital}/>} 
        {view==='analytics'&&<Analytics equity={equity} instrumentData={instrumentData} strategyData={strategyData} directionData={directionData} trades={trades} stats={stats}/>} 
        {view==='psychology'&&<PsychologyView trades={trades} reviews={reviews}/>} 
        {view==='review'&&<DailyReviewView trades={trades} reviews={reviews} onSave={saveReview}/>} 
        {view==='calendar'&&<CalendarView trades={trades} reviews={reviews}/>} 
        {view==='expiry'&&<ExpiryCalendarView/>}
        {view==='reports'&&<Reports trades={trades} stats={stats} extendedMetrics={extendedMetrics} instrumentData={instrumentData} accounts={accounts} capitalEntries={capitalEntries} reviews={reviews} profileName={profileName}/>} 
        {view==='achievements'&&<Achievements trades={trades} discipline={stats.discipline} reviews={reviews}/>} 
        {view==='feedback'&&<FeedbackView demoMode={demoMode} userId={user?.id||''} email={user?.email||''} onSent={()=>notify('Thank you — feedback submitted.')} />}
        {view==='settings'&&<SettingsView name={profileName} currency={currency} startingCapital={startingCapital} demoMode={demoMode} userId={user?.id||''} accounts={accounts} trades={trades} capitalEntries={capitalEntries} reviews={reviews} theme={theme} setTheme={setTheme} onSaved={(next:any)=>{setProfileName(next.name);setCurrency(next.currency);setStartingCapital(next.startingCapital)}}/>}
      </div>
    </main>
    {!consent&&<ConsentBanner onAccept={()=>{localStorage.setItem('jiq_analytics_consent','yes');setConsent(true);notify('Anonymous product analytics enabled.')}} onDecline={()=>{localStorage.setItem('jiq_analytics_consent','no');setConsent(true)}}/>}
    {toast&&<div className="toast">{toast}</div>}
    {modal&&<TradeModal trade={editing} accounts={accounts} onClose={()=>setModal(false)} onSave={saveTrade}/>}
    {commandOpen&&<CommandPalette currentView={view} onClose={()=>setCommandOpen(false)} onNavigate={(next:View)=>{setView(next);setCommandOpen(false)}} onTrade={()=>{setCommandOpen(false);openTradeEntry()}}/>}
  </div>
}


function ThemeMenu({theme,setTheme}:{theme:ThemeMode;setTheme:(theme:ThemeMode)=>void}){
  const options:[ThemeMode,string,any][]=[
    ['system','System',Zap],
    ['light','Pearl',Sun],
    ['dark','Graphite',Moon],
    ['midnight','Midnight',ShieldCheck],
    ['trading','Trading Dark',Activity]
  ];
  return <div className="themeMenu popoverMenu"><div className="popoverTitle">Appearance</div>{options.map(([id,label,Icon])=><button key={id} className={theme===id?'selected':''} onClick={()=>setTheme(id)}><Icon size={16}/><span>{label}</span>{theme===id&&<Check size={15}/>}</button>)}</div>
}

function CommandPalette({currentView,onClose,onNavigate,onTrade}:{currentView:View;onClose:()=>void;onNavigate:(view:View)=>void;onTrade:()=>void}){
  const [search,setSearch]=useState('');
  const commands:{id:string;label:string;hint:string;icon:any;view?:View;action?:()=>void}[]=[
    {id:'trade',label:'Log a new trade',hint:'Create a complete journal entry',icon:Plus,action:onTrade},
    {id:'dashboard',label:'Open dashboard',hint:'Portfolio overview and KPIs',icon:LayoutDashboard,view:'dashboard'},
    {id:'journal',label:'Open trade journal',hint:'Search and manage trades',icon:BookOpen,view:'journal'},
    {id:'accounts',label:'Open trading accounts',hint:'Manage brokers and capital',icon:CircleDollarSign,view:'accounts'},
    {id:'analytics',label:'Open analytics',hint:'Instrument, strategy and direction edge',icon:BarChart3,view:'analytics'},
    {id:'review',label:'Open daily review',hint:'Complete your behavioural review',icon:ClipboardCheck,view:'review'},
    {id:'settings',label:'Open settings',hint:'Profile, guardrails and backup',icon:Settings,view:'settings'}
  ];
  const filtered=commands.filter(c=>`${c.label} ${c.hint}`.toLowerCase().includes(search.toLowerCase()));
  useEffect(()=>{document.getElementById('tickmint-command-search')?.focus()},[]);
  return <div className="commandOverlay" onMouseDown={onClose}><div className="commandPalette" onMouseDown={e=>e.stopPropagation()}><div className="commandSearch"><Search size={19}/><input id="tickmint-command-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search pages and actions…"/><kbd>Esc</kbd></div><div className="commandResults">{filtered.map(({id,label,hint,icon:Icon,view,action})=><button key={id} className={view===currentView?'current':''} onClick={()=>action?action():view&&onNavigate(view)}><span className="commandIcon"><Icon size={18}/></span><span><b>{label}</b><small>{hint}</small></span>{view===currentView&&<span className="currentBadge">Current</span>}</button>)}{!filtered.length&&<div className="commandEmpty">No matching page or action.</div>}</div><div className="commandFooter"><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>Enter</kbd> Open</span></div></div></div>
}

function AuthScreen({mode,setMode,onBack,onDemo}:{mode:AuthMode;setMode:(m:AuthMode)=>void;onBack:()=>void;onDemo:()=>void}){
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [name,setName]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');
  async function submit(){
    setBusy(true);setError('');setMessage('');
    if(!supabaseConfigured){setError('Supabase is not configured yet. Add the environment variables or use the demo.');setBusy(false);return}
    if(mode==='signup'){
      const {error}=await supabase.auth.signUp({email,password,options:{data:{display_name:name},emailRedirectTo:window.location.origin}});if(error)setError(error.message);else setMessage('Account created. Check your inbox to verify your email, then log in.');
    }else if(mode==='forgot'){
      const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});if(error)setError(error.message);else setMessage('Password reset email sent.');
    }else{
      const {error}=await supabase.auth.signInWithPassword({email,password});if(error)setError(error.message);
    }
    setBusy(false);
  }
  return <div className="auth"><button className="back" onClick={onBack}>← Back</button><div className="authCard"><div className="brand center"><TickMintLogo/></div><h1>{mode==='signup'?'Create your free account':mode==='forgot'?'Reset your password':'Welcome back'}</h1><p>{mode==='signup'?'Your trades will be securely stored in your private cloud workspace.':mode==='forgot'?'We will email you a secure reset link.':'Log in to continue your daily trading review.'}</p>{mode==='signup'&&<label>Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label>}<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>{mode!=='forgot'&&<label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimum 6 characters"/></label>}{error&&<div className="authError">{error}</div>}{message&&<div className="authSuccess">{message}</div>}<button className="primaryLg wide" disabled={busy} onClick={submit}>{busy?'Please wait…':mode==='signup'?'Create free account':mode==='forgot'?'Send reset link':'Login to workspace'}</button>{mode==='login'&&<><button className="linkAuth" onClick={()=>setMode('forgot')}>Forgot password?</button><p className="authSwitch">New here? <button onClick={()=>setMode('signup')}>Create an account</button></p></>}{mode!=='login'&&<p className="authSwitch">Already have an account? <button onClick={()=>setMode('login')}>Log in</button></p>}<div className="authDivider"><span>or</span></div><button className="secondaryLg wide" onClick={onDemo}>Continue with demo data</button></div></div>
}

function Landing({onDemo,onLogin}:{onDemo:()=>void;onLogin:()=>void}){return <div className="landing">
  <header className="landingNav"><div className="brand"><TickMintLogo/></div><nav><a href="#features">Features</a><a href="#how">How it works</a><a href="#free">Free</a></nav><div><button className="ghost" onClick={onLogin}>Login</button><button className="primarySm" onClick={onDemo}>View product</button></div></header>
  <section className="hero"><div><span className="pill">Professional trading performance workspace</span><h1>Turn every trade into a <em>better decision.</em></h1><p>A structured performance operating system for serious traders—journal execution, measure edge, manage capital and review behaviour in one secure workspace.</p><div className="heroBtns"><button className="primaryLg" onClick={onDemo}>Create workspace <ChevronRight size={18}/></button><button className="secondaryLg" onClick={onDemo}>Explore product</button></div><div className="trust"><span>✓ Free in Phase 1</span><span>✓ No card required</span><span>✓ Your data stays in your browser</span></div></div><DashboardMock/></section>
  <section id="features" className="section"><div className="sectionHead"><span className="eyebrow">THE DAILY TRADING WORKSPACE</span><h2>Everything required to understand your trading edge</h2><p>Move beyond a spreadsheet. Connect execution, risk, psychology and capital performance in a single professional workflow.</p></div><div className="featureGrid">{[[CircleDollarSign,'Capital & equity','Track starting capital, current balance, ROI and drawdown.'],[TrendingUp,'Bull vs bear edge','See whether long or short positions actually suit you.'],[Brain,'Behaviour review','Connect outcomes with discipline, emotion and rule-following.'],[BarChart3,'Instrument analytics','Compare Nifty, Crude Oil, Gold, Natural Gas and more.'],[Zap,'Daily habit loop','Build review streaks and complete the day intentionally.'],[CalendarDays,'Trading calendar','Spot green days, red days and missing journal entries.']].map(([Icon,title,copy]:any)=><div className="feature" key={title}><div className="featureIcon"><Icon size={21}/></div><h3>{title}</h3><p>{copy}</p></div>)}</div></section>
  <section id="how" className="section alt"><div className="sectionHead"><span className="eyebrow">HOW IT WORKS</span><h2>A disciplined workflow after every session</h2></div><div className="steps">{[['01','Log the trade','Add instrument, direction, prices, quantity, setup and emotion.'],['02','See the numbers','P&L, win rate, equity curve and instrument performance update instantly.'],['03','Finish the review','Capture what worked, what failed and what to avoid tomorrow.']].map(x=><div className="step" key={x[0]}><span>{x[0]}</span><h3>{x[1]}</h3><p>{x[2]}</p></div>)}</div></section>
  <section id="free" className="cta"><span className="pill">Phase 1 is completely free</span><h2>Build a measurable trading process before adding intelligence.</h2><p>Create an account, log trades and analyse your performance without a subscription.</p><button className="primaryLg" onClick={onDemo}>Open the workspace</button></section><footer className="landingFooter"><div className="brand"><TickMintLogo/></div><p>Trading journal and performance analytics. Not investment advice.</p><div><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="mailto:support@example.com">Contact</a></div></footer>
</div>}

function DashboardMock(){return <div className="mock"><div className="mockTop"><span></span><span></span><span></span></div><div className="mockBody"><div className="mockSide"></div><div className="mockMain"><div className="mockCards"><div><small>Net P&L</small><b className="green">+₹15,305</b></div><div><small>Win rate</small><b>70%</b></div><div><small>Capital</small><b>₹1.35L</b></div></div><div className="mockChart"><svg viewBox="0 0 500 160"><path d="M0 140 C70 120 80 100 130 105 S210 55 270 75 S350 20 500 28" fill="none" stroke="#10b981" strokeWidth="5"/><path d="M0 140 C70 120 80 100 130 105 S210 55 270 75 S350 20 500 28 L500 160 L0 160Z" fill="url(#g)" opacity=".35"/><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#10b981"/><stop offset="1" stopColor="#fff"/></linearGradient></defs></svg></div><div className="mockSplit"><div className="bullCard"><TrendingUp size={15}/> Bull edge<br/><b>74% win rate</b></div><div className="bearCard"><TrendingDown size={15}/> Bear edge<br/><b>61% win rate</b></div></div></div></div></div>}

function Dashboard({stats,equity,directionData,instrumentData,onLog,onNav}:any){return <>
  <div className="pageHead"><div><span className="eyebrow">PERFORMANCE WORKSPACE</span><h1>Your trading performance, organised.</h1><p>Track execution quality, capital efficiency and behavioural consistency from one workspace.</p></div><button className="primaryLg" onClick={onLog}><Plus size={18}/> Log today’s trade</button></div>
  <div className="kpis"><Kpi label="Current capital" value={money(stats.capital)} note={`${money(stats.net)} total growth`} icon={<CircleDollarSign/>}/><Kpi label="Net P&L" value={money(stats.net)} note="Across all logged trades" positive={stats.net>=0} icon={stats.net>=0?<TrendingUp/>:<TrendingDown/>}/><Kpi label="Win rate" value={`${stats.winRate.toFixed(1)}%`} note={`${stats.wins} wins · ${stats.losses} losses`} icon={<Target/>}/><Kpi label="Discipline" value={`${stats.discipline.toFixed(0)}%`} note="Rule-following score" icon={<Activity/>}/></div>
  <div className="grid2"><section className="panel big"><div className="panelHead"><div><h3>Capital growth</h3><p>Equity curve after every logged trade</p></div><button className="linkBtn" onClick={()=>onNav('analytics')}>Full analytics →</button></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={equity}><defs><linearGradient id="eq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#10b981" stopOpacity={.35}/><stop offset="1" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date"/><YAxis tickFormatter={(v)=>`₹${Math.round(v/1000)}k`}/><Tooltip formatter={(v:any)=>money(Number(v))}/><Area type="monotone" dataKey="equity" stroke="#10b981" fill="url(#eq)" strokeWidth={3}/></AreaChart></ResponsiveContainer></div></section>
  <section className="panel"><div className="panelHead"><div><h3>Bull vs bear</h3><p>Which direction pays you better?</p></div></div>{directionData.map((d:any)=><div className={`directionCard ${d.name.toLowerCase()}`} key={d.name}><div><span>{d.name==='Bull'?<TrendingUp size={17}/>:<TrendingDown size={17}/>} {d.name} trades</span><b>{money(d.value)}</b></div><div><strong>{d.winRate}%</strong><small>Win rate</small></div></div>)}</section></div>
  <div className="grid3"><section className="panel"><h3>Today’s close-out</h3><div className="check"><input type="checkbox" defaultChecked/> All trades logged</div><div className="check"><input type="checkbox"/> Screenshot attached</div><div className="check"><input type="checkbox"/> Lesson written</div><button className="secondaryLg wide" onClick={()=>alert('Daily review saved. Your streak is now 15 days.')}>Complete daily review</button></section><section className="panel"><h3>Habit streak</h3><div className="streak"> <b>14 days</b></div><p>Complete today’s review to extend the streak.</p><div className="progress"><span style={{width:'72%'}}></span></div></section><section className="panel"><div className="panelHead"><h3>Top instruments</h3><button className="linkBtn" onClick={()=>onNav('analytics')}>View all</button></div>{instrumentData.sort((a:any,b:any)=>b.pnl-a.pnl).slice(0,4).map((x:any)=><div className="rank" key={x.name}><span>{x.name}</span><b className={x.pnl>=0?'green':'red'}>{money(x.pnl)}</b></div>)}</section></div>
</>}

function Kpi({label,value,note,positive,icon}:any){return <div className="kpi"><div className="kpiIcon">{icon}</div><span>{label}</span><h2 className={positive===true?'green':positive===false?'red':''}>{value}</h2><small>{note}</small></div>}

function Journal({trades,allTrades,accounts,filter,setFilter,query,setQuery,onAdd,onEdit,onDelete}:any){
  const instruments:string[]=['All',...Array.from(new Set<string>(allTrades.map((t:Trade)=>t.instrument)))];
  const accountName=(id:string)=>accounts.find((a:TradingAccount)=>a.id===id)?.name||'Unassigned';
  return <><div className="pageHead"><div><span className="eyebrow">BATTLE LOG</span><h1>Trade journal</h1><p>Every entry should explain the decision, risk and outcome.</p></div><button className="primaryLg" onClick={onAdd}><Plus size={18}/> Add trade</button></div>
  <div className="toolbar"><input placeholder="Search instrument, setup or note…" value={query} onChange={e=>setQuery(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}>{instruments.map(x=><option key={x}>{x}</option>)}</select><button className="secondaryLg" onClick={()=>exportCsv(allTrades)}><Download size={16}/> Export CSV</button></div>
  <div className="tableWrap"><table><thead><tr><th>Date</th><th>Account</th><th>Market</th><th>Instrument</th><th>Direction</th><th>Gross</th><th>Charges</th><th>Net P&L</th><th>Rules</th><th></th></tr></thead><tbody>{trades.map((t:Trade)=><tr key={t.id}><td>{t.date}</td><td>{accountName(t.accountId)}</td><td>{t.market}</td><td><b>{t.instrument}</b>{t.optionType&&<small className="tableSub">{t.strikePrice} {t.optionType}</small>}</td><td><span className={`badge ${t.direction.toLowerCase()}`}>{t.direction==='Bull'?<TrendingUp size={14}/>:<TrendingDown size={14}/>} {t.direction}</span></td><td>{money(t.grossPnl)}</td><td>{money(t.charges)}</td><td className={t.pnl>=0?'green':'red'}><b>{money(t.pnl)}</b></td><td>{t.followedRules?<span className="good">Followed</span>:<span className="bad">Broken</span>}</td><td><div className="rowActions">{t.screenshotUrl&&<button onClick={()=>window.open(t.screenshotUrl,'_blank')}>Chart</button>}<button onClick={()=>onEdit(t)}>Edit</button><button onClick={()=>confirm('Delete this trade?')&&onDelete(t.id)}>Delete</button></div></td></tr>)}</tbody></table>{!trades.length&&<div className="empty premiumEmpty"><BookOpen size={30}/><h3>{allTrades.length?'No matching trades':'Your journal is ready for its first trade'}</h3><p>{allTrades.length?'Adjust the search or instrument filter.':'Record a completed trade to begin measuring your edge, discipline and capital growth.'}</p>{!allTrades.length&&<button className="primaryLg" onClick={onAdd}><Plus size={17}/> Log first trade</button>}</div>}</div></>
}


function AccountsView({accounts,trades,onSave,onDelete}:any){
  const [editing,setEditing]=useState<TradingAccount|null>(null);
  const [open,setOpen]=useState(false);
  const totals=accounts.map((a:TradingAccount)=>{const list=trades.filter((t:Trade)=>t.accountId===a.id);return {...a,pnl:list.reduce((s:number,t:Trade)=>s+t.pnl,0),trades:list.length}});
  return <><div className="pageHead"><div><span className="eyebrow">MULTI-ACCOUNT WORKSPACE</span><h1>Trading accounts</h1><p>Track live, paper and broker accounts separately or as one portfolio.</p></div><button className="primaryLg" onClick={()=>{setEditing(null);setOpen(true)}}><Plus size={18}/> Add account</button></div>
  <div className="accountGrid">{totals.map((a:any)=><section className="accountCard" key={a.id}><div className="accountHead"><div><span className={`accountType ${a.accountType.toLowerCase()}`}>{a.accountType}</span><h3>{a.name}</h3><p>{a.broker}</p></div>{a.isDefault&&<span className="pill">Default</span>}</div><div className="accountMetrics"><div><small>Starting capital</small><b>{money(a.startingCapital)}</b></div><div><small>Net P&L</small><b className={a.pnl>=0?'green':'red'}>{money(a.pnl)}</b></div><div><small>Trades</small><b>{a.trades}</b></div></div><div className="accountActions"><button onClick={()=>{setEditing(a);setOpen(true)}}>Edit</button><button onClick={()=>confirm('Delete this account?')&&onDelete(a.id)}>Delete</button></div></section>)}</div>
  {!accounts.length&&<div className="empty panel premiumEmpty"><CircleDollarSign size={32}/><h3>Create your first trading account</h3><p>Separate live, paper and broker accounts while keeping portfolio analytics consolidated.</p><button className="primaryLg" onClick={()=>{setEditing(null);setOpen(true)}}><Plus size={17}/> Add first account</button></div>}
  {open&&<AccountModal account={editing} onClose={()=>setOpen(false)} onSave={(a:TradingAccount)=>{onSave(a);setOpen(false)}}/>}</>
}
function AccountModal({account,onClose,onSave}:any){
 const [f,setF]=useState<TradingAccount>(account||{id:crypto.randomUUID(),name:'',broker:'Dhan',accountType:'Live',startingCapital:0,isDefault:false});
 return <div className="overlay" onMouseDown={onClose}><div className="modal compact" onMouseDown={e=>e.stopPropagation()}><div className="modalHead"><div><span className="eyebrow">TRADING ACCOUNT</span><h2>{account?'Edit account':'Add account'}</h2></div><button onClick={onClose}><X/></button></div><div className="formGrid"><label>Account name<input value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></label><label>Broker<select value={f.broker} onChange={e=>setF({...f,broker:e.target.value})}>{['Dhan','Zerodha','Upstox','Angel One','Delta Exchange','Interactive Brokers','Paper Trading','Other'].map(x=><option key={x}>{x}</option>)}</select></label><label>Account type<select value={f.accountType} onChange={e=>setF({...f,accountType:e.target.value as any})}><option>Live</option><option>Paper</option></select></label><label>Starting capital<input type="number" value={f.startingCapital||''} onChange={e=>setF({...f,startingCapital:Number(e.target.value)})}/></label></div><label className="ruleCheck"><input type="checkbox" checked={f.isDefault} onChange={e=>setF({...f,isDefault:e.target.checked})}/> Use as default account</label><div className="modalActions"><button className="secondaryLg" onClick={onClose}>Cancel</button><button className="primaryLg" disabled={!f.name} onClick={()=>onSave(f)}>Save account</button></div></div></div>
}
function CapitalLedger({entries,accounts,onSave,onDelete}:any){
 const [open,setOpen]=useState(false);const net=entries.reduce((s:number,e:CapitalEntry)=>s+(e.type==='Deposit'||e.type==='Dividend'||e.type==='Adjustment'?e.amount:-e.amount),0);
 const accountName=(id:string)=>accounts.find((a:TradingAccount)=>a.id===id)?.name||'Portfolio';
 return <><div className="pageHead"><div><span className="eyebrow">TRUE CAPITAL TRACKING</span><h1>Capital ledger</h1><p>Separate deposits and withdrawals from trading performance.</p></div><button className="primaryLg" onClick={()=>setOpen(true)}><Plus size={18}/> Add entry</button></div>
 <div className="calendarStats"><Kpi label="Net capital movement" value={money(net)} note="Deposits less debits" icon={<CircleDollarSign/>}/><Kpi label="Deposits" value={money(entries.filter((e:CapitalEntry)=>e.type==='Deposit').reduce((s:number,e:CapitalEntry)=>s+e.amount,0))} note="Capital added" icon={<TrendingUp/>}/><Kpi label="Withdrawals" value={money(entries.filter((e:CapitalEntry)=>e.type==='Withdrawal').reduce((s:number,e:CapitalEntry)=>s+e.amount,0))} note="Capital removed" icon={<TrendingDown/>}/><Kpi label="Fees" value={money(entries.filter((e:CapitalEntry)=>e.type==='Fee').reduce((s:number,e:CapitalEntry)=>s+e.amount,0))} note="Non-trade costs" icon={<Activity/>}/></div>
 <div className="tableWrap"><table><thead><tr><th>Date</th><th>Account</th><th>Type</th><th>Note</th><th>Amount</th><th></th></tr></thead><tbody>{entries.map((e:CapitalEntry)=><tr key={e.id}><td>{e.date}</td><td>{accountName(e.accountId)}</td><td><span className="pill">{e.type}</span></td><td>{e.note}</td><td className={e.type==='Deposit'||e.type==='Dividend'||e.type==='Adjustment'?'green':'red'}><b>{e.type==='Deposit'||e.type==='Dividend'||e.type==='Adjustment'?'+':'-'}{money(e.amount)}</b></td><td><button className="textDanger" onClick={()=>confirm('Delete this ledger entry?')&&onDelete(e.id)}>Delete</button></td></tr>)}</tbody></table>{!entries.length&&<div className="empty">No capital movements recorded.</div>}</div>
 {open&&<CapitalModal accounts={accounts} onClose={()=>setOpen(false)} onSave={(e:CapitalEntry)=>{onSave(e);setOpen(false)}}/>}</>
}
function CapitalModal({accounts,onClose,onSave}:any){
 const [f,setF]=useState<CapitalEntry>({id:crypto.randomUUID(),date:new Date().toISOString().slice(0,10),accountId:accounts[0]?.id||'',type:'Deposit',amount:0,note:''});
 return <div className="overlay" onMouseDown={onClose}><div className="modal compact" onMouseDown={e=>e.stopPropagation()}><div className="modalHead"><div><span className="eyebrow">CAPITAL MOVEMENT</span><h2>Add ledger entry</h2></div><button onClick={onClose}><X/></button></div><div className="formGrid"><label>Date<input type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/></label><label>Account<select value={f.accountId} onChange={e=>setF({...f,accountId:e.target.value})}>{accounts.map((a:TradingAccount)=><option value={a.id} key={a.id}>{a.name}</option>)}</select></label><label>Entry type<select value={f.type} onChange={e=>setF({...f,type:e.target.value as any})}>{['Deposit','Withdrawal','Fee','Adjustment','Dividend'].map(x=><option key={x}>{x}</option>)}</select></label><label>Amount<input type="number" value={f.amount||''} onChange={e=>setF({...f,amount:Number(e.target.value)})}/></label></div><label>Note<textarea value={f.note} onChange={e=>setF({...f,note:e.target.value})}/></label><div className="modalActions"><button className="secondaryLg" onClick={onClose}>Cancel</button><button className="primaryLg" disabled={!f.amount} onClick={()=>onSave(f)}>Save entry</button></div></div></div>
}

function Analytics({equity,instrumentData,strategyData,directionData,trades,stats}:any){
 const monthly=Object.values(trades.reduce((a:any,t:Trade)=>{const m=t.date.slice(0,7);a[m]??={month:m,pnl:0};a[m].pnl+=t.pnl;return a;},{}));
 const drawdown=equity.map((x:any,i:number)=>{const peak=Math.max(...equity.slice(0,i+1).map((e:any)=>e.equity));return {...x,drawdown:x.equity-peak,drawdownPct:peak?((x.equity-peak)/peak*100):0};});
 const maxDrawdown=Math.abs(Math.min(0,...drawdown.map((x:any)=>x.drawdown)));
 const winners=trades.filter((t:Trade)=>t.pnl>0), losers=trades.filter((t:Trade)=>t.pnl<0);
 const avgWinner=winners.length?winners.reduce((s:number,t:Trade)=>s+t.pnl,0)/winners.length:0;
 const avgLoser=losers.length?Math.abs(losers.reduce((s:number,t:Trade)=>s+t.pnl,0)/losers.length):0;
 const expectancy=trades.length?(stats.winRate/100*avgWinner)-((1-stats.winRate/100)*avgLoser):0;
 const payoff=avgLoser?avgWinner/avgLoser:0;
 const returns=trades.map((t:Trade)=>stats.accountBase?t.pnl/stats.accountBase:0);
 const mean=returns.length?returns.reduce((a:number,b:number)=>a+b,0)/returns.length:0;
 const sd=returns.length>1?Math.sqrt(returns.reduce((a:number,b:number)=>a+Math.pow(b-mean,2),0)/(returns.length-1)):0;
 const downside=returns.filter((r:number)=>r<0);const downsideDev=downside.length?Math.sqrt(downside.reduce((a:number,b:number)=>a+b*b,0)/downside.length):0;
 const sharpe=sd?mean/sd*Math.sqrt(252):0, sortino=downsideDev?mean/downsideDev*Math.sqrt(252):0;
 const recovery=maxDrawdown?stats.net/maxDrawdown:0;
 const dayData=Object.values(trades.reduce((a:any,t:Trade)=>{const d=new Date(t.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'short'});a[d]??={name:d,pnl:0,trades:0};a[d].pnl+=t.pnl;a[d].trades++;return a;},{}));
 const ruleData=[true,false].map(flag=>{const list=trades.filter((t:Trade)=>t.followedRules===flag);return {name:flag?'Rules followed':'Rules broken',pnl:list.reduce((s:number,t:Trade)=>s+t.pnl,0),winRate:list.length?Math.round(list.filter((t:Trade)=>t.pnl>0).length/list.length*100):0}});
 const maxWin=Math.max(0,...trades.map((t:Trade)=>t.pnl)),maxLoss=Math.min(0,...trades.map((t:Trade)=>t.pnl));
 return <><div className="pageHead"><div><span className="eyebrow">ADVANCED EDGE ANALYTICS</span><h1>Know the quality of your edge.</h1><p>Measure return, risk, consistency and the behaviours behind the result.</p></div></div>
 <div className="analyticsKpis">
  <Kpi label="Expectancy / trade" value={money(expectancy)} note="Average statistical edge" icon={<Gauge/>}/>
  <Kpi label="Max drawdown" value={money(maxDrawdown)} note="Largest peak-to-trough fall" positive={false} icon={<TrendingDown/>}/>
  <Kpi label="Payoff ratio" value={`${payoff.toFixed(2)}x`} note="Avg winner ÷ avg loser" icon={<Target/>}/>
  <Kpi label="Recovery factor" value={`${recovery.toFixed(2)}x`} note="Net profit ÷ max drawdown" icon={<ShieldCheck/>}/>
  <Kpi label="Sharpe estimate" value={sharpe.toFixed(2)} note="Risk-adjusted consistency" icon={<Activity/>}/>
  <Kpi label="Sortino estimate" value={sortino.toFixed(2)} note="Downside-risk efficiency" icon={<TrendingUp/>}/>
 </div>
 <div className="grid2"><ChartPanel title="Equity curve" subtitle="Capital progression over time"><ResponsiveContainer width="100%" height="100%"><LineChart data={equity}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date"/><YAxis tickFormatter={(v)=>`₹${Math.round(v/1000)}k`}/><Tooltip formatter={(v:any)=>money(Number(v))}/><Line type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={3}/></LineChart></ResponsiveContainer></ChartPanel><ChartPanel title="Drawdown profile" subtitle="Peak-to-trough account decline"><ResponsiveContainer width="100%" height="100%"><AreaChart data={drawdown}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date"/><YAxis/><Tooltip formatter={(v:any)=>money(Number(v))}/><Area type="monotone" dataKey="drawdown" stroke="#ef4444" fill="#fee2e2"/></AreaChart></ResponsiveContainer></ChartPanel></div>
 <div className="grid2"><ChartPanel title="P&L by instrument" subtitle="Which market contributes most?"><ResponsiveContainer width="100%" height="100%"><BarChart data={instrumentData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name"/><YAxis/><Tooltip formatter={(v:any)=>money(Number(v))}/><Bar dataKey="pnl" radius={[8,8,0,0]}>{instrumentData.map((x:any,i:number)=><Cell key={i} fill={x.pnl>=0?'#10b981':'#ef4444'}/>)}</Bar></BarChart></ResponsiveContainer></ChartPanel><ChartPanel title="Strategy performance" subtitle="P&L generated by each playbook"><ResponsiveContainer width="100%" height="100%"><BarChart data={strategyData} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number"/><YAxis dataKey="name" type="category" width={95}/><Tooltip formatter={(v:any)=>money(Number(v))}/><Bar dataKey="pnl" radius={[0,8,8,0]}>{strategyData.map((x:any,i:number)=><Cell key={i} fill={x.pnl>=0?'#4f46e5':'#ef4444'}/>)}</Bar></BarChart></ResponsiveContainer></ChartPanel></div>
 <div className="grid2"><ChartPanel title="Day-of-week performance" subtitle="Find your strongest and weakest sessions"><ResponsiveContainer width="100%" height="100%"><BarChart data={dayData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name"/><YAxis/><Tooltip formatter={(v:any)=>money(Number(v))}/><Bar dataKey="pnl" radius={[8,8,0,0]}>{dayData.map((x:any,i:number)=><Cell key={i} fill={x.pnl>=0?'#10b981':'#ef4444'}/>)}</Bar></BarChart></ResponsiveContainer></ChartPanel><ChartPanel title="Rules vs outcome" subtitle="The financial effect of discipline"><ResponsiveContainer width="100%" height="100%"><BarChart data={ruleData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name"/><YAxis/><Tooltip formatter={(v:any)=>money(Number(v))}/><Bar dataKey="pnl" radius={[8,8,0,0]}><Cell fill="#10b981"/><Cell fill="#ef4444"/></Bar></BarChart></ResponsiveContainer></ChartPanel></div>
 <div className="grid2"><ChartPanel title="Monthly P&L" subtitle="Month-by-month result"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month"/><YAxis/><Tooltip formatter={(v:any)=>money(Number(v))}/><Bar dataKey="pnl" fill="#4f46e5" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></ChartPanel><section className="panel insight"><h3>Automated performance diagnosis</h3><ul><li><b>{stats.discipline>=80?'Discipline is supporting the edge.':'Rule-breaking is damaging results.'}</b> Rule-following stands at {stats.discipline.toFixed(0)}%.</li><li><b>Average winner:</b> {money(avgWinner)} versus <b>average loser:</b> {money(avgLoser)}.</li><li><b>Largest win:</b> {money(maxWin)} and <b>largest loss:</b> {money(maxLoss)}.</li><li><b>{expectancy>=0?'Positive':'Negative'} expectancy:</b> the current sample implies {money(expectancy)} per trade.</li></ul><p className="metricDisclaimer">Sharpe and Sortino are directional estimates based on trade-level returns—not audited portfolio statistics.</p></section></div></>}

function ChartPanel({title,subtitle,children}:any){return <section className="panel big"><div className="panelHead"><div><h3>{title}</h3><p>{subtitle}</p></div></div><div className="chart">{children}</div></section>}

function CalendarView({trades,reviews}:{trades:Trade[];reviews:DailyReview[]}){const map=trades.reduce((a:any,t)=>{a[t.date]=(a[t.date]||0)+t.pnl;return a;},{});const reviewMap=Object.fromEntries(reviews.map(r=>[r.date,r]));const days=Array.from({length:31},(_,i)=>i+1);const profitDays=Object.values(map).filter((x:any)=>x>0).length,lossDays=Object.values(map).filter((x:any)=>x<0).length;return <><div className="pageHead"><div><span className="eyebrow">CONSISTENCY HEATMAP</span><h1>July 2026</h1><p>Profit, loss and completed reflection in one behavioural calendar.</p></div></div><div className="calendarStats"><Kpi label="Profitable days" value={String(profitDays)} note="Across July" icon={<TrendingUp/>}/><Kpi label="Loss days" value={String(lossDays)} note="Review patterns" icon={<TrendingDown/>}/><Kpi label="Reviews completed" value={String(reviews.filter(r=>r.completed).length)} note="Reflection creates retention" icon={<ClipboardCheck/>}/><Kpi label="Completion" value={`${Math.round(reviews.length/Math.max(1,Object.keys(map).length)*100)}%`} note="Reviewed trading days" icon={<Target/>}/></div><div className="panel"><div className="weekLabels">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=><b key={x}>{x}</b>)}</div><div className="calendarGrid">{[null,null,...days].map((d:any,i)=>{if(!d)return <div key={i} className="day empty"></div>;const key=`2026-07-${String(d).padStart(2,'0')}`;const p=map[key];const rev=reviewMap[key];return <button key={i} className={`day ${p>0?'win':p<0?'loss':''} ${rev?.completed?'reviewed':''}`} onClick={()=>alert(`${key}\n${p!=null?'Net P&L: '+money(p):'No logged trade'}\n${rev?.completed?'Review completed — '+rev.lesson:'Review not completed'}`)}><b>{d}</b><span>{p!=null?money(p):'—'}</span>{rev?.completed&&<i title="Daily review completed">✓</i>}</button>})}</div></div><div className="calendarLegend"><span><b className="legendBox win"></b> Profitable</span><span><b className="legendBox loss"></b> Loss</span><span><b className="legendDot">✓</b> Review completed</span></div></>}


function ExpiryCalendarView(){
  const rows=[
    {group:'Index derivatives',instrument:'Nifty',cycle:'Weekly and monthly',note:'Use the exchange/broker contract page for the active expiry date.'},
    {group:'Index derivatives',instrument:'Bank Nifty',cycle:'Monthly',note:'Weekly availability and expiry weekday may change under exchange circulars.'},
    {group:'Index derivatives',instrument:'Sensex',cycle:'Weekly and monthly',note:'Verify the active BSE contract before entering a trade.'},
    {group:'Index derivatives',instrument:'FINNIFTY',cycle:'Monthly',note:'Confirm current contract specifications with NSE.'},
    {group:'Commodities',instrument:'Crude Oil',cycle:'Contract-month expiry',note:'Expiry varies by listed MCX contract month.'},
    {group:'Commodities',instrument:'Natural Gas',cycle:'Contract-month expiry',note:'Verify tender/expiry dates with MCX or your broker.'},
    {group:'Commodities',instrument:'Gold / Gold Mini',cycle:'Contract-month expiry',note:'Different variants can have different contract dates.'},
    {group:'Commodities',instrument:'Silver / Silver Mini',cycle:'Contract-month expiry',note:'Check the exact symbol and current contract calendar.'},
    {group:'Commodities',instrument:'Copper',cycle:'Contract-month expiry',note:'Use the MCX contract specification for the selected month.'}
  ];
  return <section><div className="pageHead"><div><span className="eyebrow">CONTRACT AWARENESS</span><h1>Expiry calendar</h1><p>Keep expiry context beside your journal. Dates shown in a production launch should come from an exchange-maintained source, not hardcoded assumptions.</p></div></div><div className="card"><div className="tableWrap"><table><thead><tr><th>Segment</th><th>Instrument</th><th>Cycle</th><th>Verification note</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}><td>{r.group}</td><td><b>{r.instrument}</b></td><td>{r.cycle}</td><td>{r.note}</td></tr>)}</tbody></table></div></div><div className="setupBanner" style={{marginTop:16}}>Trading reminder: always verify the exact contract expiry, lot size and final trading date with the exchange or broker before placing an order.</div></section>
}
function Reports({trades,stats,extendedMetrics,instrumentData,accounts,capitalEntries,reviews,profileName}:any){
  const best=[...instrumentData].sort((a:any,b:any)=>b.pnl-a.pnl)[0];
  const summary={
    trader:profileName,
    generatedAt:new Date().toLocaleString(),
    trades:trades.length,
    netPnl:money(stats.net),
    winRate:`${stats.winRate.toFixed(1)}%`,
    currentCapital:money(stats.capital),
    discipline:`${stats.discipline.toFixed(0)}%`,
    profitFactor:Number(stats.profitFactor||0).toFixed(2),
    expectancy:money(extendedMetrics.expectancy),
    averageWinner:money(extendedMetrics.averageWinner),
    averageLoser:money(extendedMetrics.averageLoser),
    payoffRatio:extendedMetrics.payoffRatio.toFixed(2),
    maxDrawdown:money(extendedMetrics.maxDrawdown),
    bestInstrument:best?.name||'-',
  };
  return <>
    <div className="pageHead">
      <div><span className="eyebrow">PERFORMANCE REVIEW</span><h1>Reports & backup</h1><p>Export your journal, generate a print-ready review and keep a portable backup.</p></div>
      <div className="pageActions">
        <button className="secondaryLg" onClick={()=>downloadTradesCsv(trades,accounts)}><Download size={17}/> Export CSV</button>
        <button className="primaryLg" onClick={()=>printPerformanceReport(summary,instrumentData)}><FileText size={17}/> Print report</button>
      </div>
    </div>
    <div className="reportHero">
      <div><span className="pill">Release-ready reporting</span><h2>{trades.length?'Your journal is ready for structured review.':'Log your first trade to generate a report.'}</h2><p>Use exports for independent analysis, coaching, taxes or personal archival.</p></div>
      <div><span>Net P&L</span><b className={stats.net>=0?'green':'red'}>{money(stats.net)}</b></div>
    </div>
    <div className="reportMetricGrid">
      <div><span>Profit factor</span><b>{Number(stats.profitFactor||0).toFixed(2)}</b></div>
      <div><span>Expectancy</span><b>{money(extendedMetrics.expectancy)}</b></div>
      <div><span>Payoff ratio</span><b>{extendedMetrics.payoffRatio.toFixed(2)}</b></div>
      <div><span>Maximum drawdown</span><b className="red">{money(extendedMetrics.maxDrawdown)}</b></div>
    </div>
    <div className="reportCards">
      <button onClick={()=>downloadWorkspaceBackup({profileName,accounts,trades,capitalEntries,reviews})}><div><ShieldCheck/></div><h3>Full workspace backup</h3><p>Download a portable JSON copy of the complete workspace.</p><span>Download JSON →</span></button>
      <button onClick={()=>downloadTradesCsv(trades,accounts)}><div><Download/></div><h3>Trade journal export</h3><p>Export execution, charges, notes, account and net P&L data.</p><span>Download CSV →</span></button>
      <button onClick={()=>printPerformanceReport(summary,instrumentData)}><div><FileText/></div><h3>Performance report</h3><p>Open a print-friendly report that can be saved as PDF.</p><span>Open report →</span></button>
      <button onClick={()=>alert(`Average winner: ${money(extendedMetrics.averageWinner)}\nAverage loser: ${money(extendedMetrics.averageLoser)}\nRecovery factor: ${extendedMetrics.recoveryFactor.toFixed(2)}`)}><div><BarChart3/></div><h3>Advanced metrics</h3><p>Review expectancy, drawdown, payoff and recovery factor.</p><span>View summary →</span></button>
    </div>
  </>
}

function Achievements({trades,discipline,reviews}:{trades:Trade[];discipline:number;reviews:DailyReview[]}){const unlocked=[trades.length>=1,trades.length>=10,discipline>=80,trades.filter(t=>t.direction==='Bull'&&t.pnl>0).length>=3,trades.length>=100,reviews.length>=30];const badges=[['🏁','First Trade','Log your first complete entry'],['','10-Trade Habit','Build the logging habit'],['🛡️','Risk Keeper','Maintain 80% rule-following'],['','Bull Specialist','Win three bull trades'],['💯','Century Club','Log 100 trades'],['🏆','30-Day Streak','Complete thirty daily reviews']];return <><div className="pageHead"><div><span className="eyebrow">HABIT SYSTEM</span><h1>Achievements</h1><p>Reward consistency and review quality—not trading frequency.</p></div></div><div className="achievementGrid">{badges.map((b,i)=><div key={b[1]} className={unlocked[i]?'achievement':'achievement locked'}><div>{b[0]}</div><h3>{b[1]}</h3><p>{b[2]}</p><span>{unlocked[i]?'Unlocked':'Locked'}</span></div>)}</div></>}


function PsychologyView({trades,reviews}:{trades:Trade[];reviews:DailyReview[]}){
 const byEmotion=Object.values(trades.reduce((a:any,t)=>{a[t.emotion]??={name:t.emotion,pnl:0,trades:0,wins:0};a[t.emotion].pnl+=t.pnl;a[t.emotion].trades++;if(t.pnl>0)a[t.emotion].wins++;return a;},{})).map((x:any)=>({...x,winRate:x.trades?Math.round(x.wins/x.trades*100):0}));
 const joined=reviews.map(r=>{const pnl=trades.filter(t=>t.date===r.date).reduce((s,t)=>s+t.pnl,0);return {...r,pnl}});
 const buckets=(key:'sleep'|'focus'|'stress')=>[1,2,3,4,5].map(score=>{const list=joined.filter(x=>x[key]===score);return {score:String(score),pnl:list.reduce((s,x)=>s+x.pnl,0),days:list.length}});
 const lowSleep=joined.filter(x=>x.sleep<=2),highSleep=joined.filter(x=>x.sleep>=4);
 const avg=(list:any[])=>list.length?list.reduce((s,x)=>s+x.pnl,0)/list.length:0;
 const revenge=joined.filter(x=>x.revengeTraded),planned=joined.filter(x=>x.followedPlan);
 return <><div className="pageHead"><div><span className="eyebrow">TRADER PSYCHOLOGY</span><h1>Measure the person behind the trades.</h1><p>Connect mood, sleep, focus and discipline with actual P&L.</p></div></div>
 <div className="psychSummary"><div className="psychHero"><HeartPulse/><div><span>Behavioural insight</span><h2>{avg(highSleep)>=avg(lowSleep)?'Better sleep is improving execution.':'Sleep has not yet shown a positive edge.'}</h2><p>High-sleep days average {money(avg(highSleep))}; low-sleep days average {money(avg(lowSleep))}.</p></div></div><div className="psychAlert"><b>Revenge-trading impact</b><strong className={avg(revenge)>=0?'green':'red'}>{money(avg(revenge))}</strong><span>Average P&L on flagged days</span></div><div className="psychAlert"><b>Plan-following impact</b><strong className={avg(planned)>=0?'green':'red'}>{money(avg(planned))}</strong><span>Average P&L on disciplined days</span></div></div>
 <div className="grid2"><ChartPanel title="P&L by emotion" subtitle="The emotional states associated with results"><ResponsiveContainer width="100%" height="100%"><BarChart data={byEmotion}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name"/><YAxis/><Tooltip formatter={(v:any)=>money(Number(v))}/><Bar dataKey="pnl" radius={[8,8,0,0]}>{byEmotion.map((x:any,i:number)=><Cell key={i} fill={x.pnl>=0?'#10b981':'#ef4444'}/>)}</Bar></BarChart></ResponsiveContainer></ChartPanel><ChartPanel title="Sleep quality vs P&L" subtitle="Score 1 is poor; 5 is excellent"><ResponsiveContainer width="100%" height="100%"><BarChart data={buckets('sleep')}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="score"/><YAxis/><Tooltip formatter={(v:any)=>money(Number(v))}/><Bar dataKey="pnl" fill="#6366f1" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></ChartPanel></div>
 <div className="grid2"><ChartPanel title="Focus vs P&L" subtitle="Does concentration improve outcomes?"><ResponsiveContainer width="100%" height="100%"><BarChart data={buckets('focus')}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="score"/><YAxis/><Tooltip formatter={(v:any)=>money(Number(v))}/><Bar dataKey="pnl" fill="#10b981" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></ChartPanel><ChartPanel title="Stress vs P&L" subtitle="Higher scores mean more stress"><ResponsiveContainer width="100%" height="100%"><BarChart data={buckets('stress')}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="score"/><YAxis/><Tooltip formatter={(v:any)=>money(Number(v))}/><Bar dataKey="pnl" fill="#ef4444" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></ChartPanel></div>
 <section className="panel insight"><h3>Behaviour patterns to watch</h3><ul><li><b>{revenge.length?'Revenge trading is present.':'No revenge-trading days logged.'}</b> {revenge.length?`${revenge.length} review(s) were flagged.`:'Keep tracking honestly.'}</li><li><b>Plan-following days:</b> {planned.length} of {reviews.length} reviews.</li><li><b>Low-sleep days:</b> {lowSleep.length}; consider a no-trade rule when sleep is 1–2.</li><li><b>Emotion logging:</b> {trades.filter(t=>t.emotion).length} of {trades.length} trades include context.</li></ul></section></>
}

function DailyReviewView({trades,reviews,onSave}:{trades:Trade[];reviews:DailyReview[];onSave:(r:DailyReview)=>void}){
 const today=new Date().toISOString().slice(0,10);const existing=reviews.find(r=>r.date===today);
 const blank:DailyReview={id:existing?.id||crypto.randomUUID(),date:today,mood:'Neutral',focus:3,sleep:3,stress:3,confidence:3,followedPlan:true,overtraded:false,revengeTraded:false,movedStopLoss:false,positionSizeCorrect:true,wentWell:'',wentWrong:'',lesson:'',completed:false};
 const [f,setF]=useState<DailyReview>(existing||blank);const dayTrades=trades.filter(t=>t.date===f.date);const dayPnl=dayTrades.reduce((s,t)=>s+t.pnl,0);
 useEffect(()=>{const r=reviews.find(x=>x.date===f.date);setF(r||{...blank,id:crypto.randomUUID(),date:f.date})},[f.date]);
 const score=Math.max(0,Math.round(((f.followedPlan?20:0)+(f.positionSizeCorrect?20:0)+(!f.overtraded?15:0)+(!f.revengeTraded?15:0)+(!f.movedStopLoss?10:0)+(f.focus/5*10)+(f.sleep/5*10))));
 function save(){const next={...f,completed:true};onSave(next);setF(next);alert(`Daily review completed.\nDiscipline score: ${score}/100`)}
 return <><div className="pageHead"><div><span className="eyebrow">END-OF-DAY RITUAL</span><h1>Complete the day before you close it.</h1><p>Build the habit of reflection—not the habit of taking more trades.</p></div><button className="primaryLg" onClick={save}><ClipboardCheck size={18}/> Complete review</button></div>
 <div className="reviewTop"><label>Review date<input type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/></label><div><span>Trades logged</span><b>{dayTrades.length}</b></div><div><span>Net P&L</span><b className={dayPnl>=0?'green':'red'}>{money(dayPnl)}</b></div><div className="scoreRing"><strong>{score}</strong><span>Discipline score</span></div></div>
 <div className="grid2"><section className="panel"><h3>State before and during trading</h3><label>Mood<select value={f.mood} onChange={e=>setF({...f,mood:e.target.value as any})}>{['Excellent','Good','Neutral','Stressed','Frustrated'].map(x=><option key={x}>{x}</option>)}</select></label><ScoreInput label="Focus" value={f.focus} onChange={(v:number)=>setF({...f,focus:v})}/><ScoreInput label="Sleep quality" value={f.sleep} onChange={(v:number)=>setF({...f,sleep:v})}/><ScoreInput label="Stress" value={f.stress} onChange={(v:number)=>setF({...f,stress:v})}/><ScoreInput label="Confidence" value={f.confidence} onChange={(v:number)=>setF({...f,confidence:v})}/></section>
 <section className="panel"><h3>Execution audit</h3><ReviewCheck label="I followed my trading plan" value={f.followedPlan} onChange={(v:boolean)=>setF({...f,followedPlan:v})}/><ReviewCheck label="My position size was correct" value={f.positionSizeCorrect} onChange={(v:boolean)=>setF({...f,positionSizeCorrect:v})}/><ReviewCheck label="I overtraded" danger value={f.overtraded} onChange={(v:boolean)=>setF({...f,overtraded:v})}/><ReviewCheck label="I revenge traded" danger value={f.revengeTraded} onChange={(v:boolean)=>setF({...f,revengeTraded:v})}/><ReviewCheck label="I moved my stop loss" danger value={f.movedStopLoss} onChange={(v:boolean)=>setF({...f,movedStopLoss:v})}/><div className={`reviewStatus ${f.completed?'complete':''}`}>{f.completed?'✓ This day is complete':'Complete the written reflection to close the day'}</div></section></div>
 <section className="panel reviewWriting"><h3>Written reflection</h3><div className="formGrid"><label>What went well?<textarea value={f.wentWell} onChange={e=>setF({...f,wentWell:e.target.value})} placeholder="What behaviour should you repeat?"/></label><label>What went wrong?<textarea value={f.wentWrong} onChange={e=>setF({...f,wentWrong:e.target.value})} placeholder="What mistake or condition hurt execution?"/></label></div><label>One lesson for the next session<textarea value={f.lesson} onChange={e=>setF({...f,lesson:e.target.value})} placeholder="Write one specific, actionable lesson."/></label></section>
 <section className="panel"><div className="panelHead"><div><h3>Recent review history</h3><p>Click a date above to reopen or update a review.</p></div></div><div className="reviewHistory">{reviews.slice(0,8).map(r=><button key={r.id} onClick={()=>setF(r)}><span>{r.date}</span><b>{r.mood}</b><small>{r.lesson||'No lesson written'}</small><i>✓</i></button>)}</div></section></>
}
function ScoreInput({label,value,onChange}:{label:string;value:number;onChange:(v:number)=>void}){return <div className="scoreInput"><div><b>{label}</b><span>{value}/5</span></div><input type="range" min="1" max="5" value={value} onChange={e=>onChange(Number(e.target.value))}/></div>}
function ReviewCheck({label,value,onChange,danger=false}:{label:string;value:boolean;onChange:(v:boolean)=>void;danger?:boolean}){return <label className={`reviewCheck ${danger?'danger':''}`}><input type="checkbox" checked={value} onChange={e=>onChange(e.target.checked)}/><span>{label}</span></label>}


function FeedbackView({demoMode,userId,email,onSent}:any){
  const [category,setCategory]=useState('Feature request');
  const [message,setMessage]=useState('');
  const [rating,setRating]=useState(5);
  const [busy,setBusy]=useState(false);
  async function submit(){
    if(message.trim().length<10){alert('Please add at least 10 characters so we can understand the feedback.');return}
    setBusy(true);
    if(demoMode){const rows=JSON.parse(localStorage.getItem('jiq_feedback')||'[]');rows.push({category,message,rating,createdAt:new Date().toISOString()});localStorage.setItem('jiq_feedback',JSON.stringify(rows));}
    else {const {error}=await supabase.from('feedback').insert({user_id:userId||null,email:email||null,category,message,rating});if(error){alert(error.message);setBusy(false);return}}
    setMessage('');setBusy(false);onSent();
  }
  return <><div className="pageHead"><div><span className="eyebrow">PUBLIC BETA SUPPORT</span><h1>Feedback & help</h1><p>Report friction before it becomes a reason to stop journaling.</p></div></div>
  <div className="grid2"><section className="panel"><h3>Send product feedback</h3><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}><option>Feature request</option><option>Bug report</option><option>Usability issue</option><option>Analytics question</option><option>Other</option></select></label><label>Your rating<div className="ratingRow">{[1,2,3,4,5].map(n=><button key={n} className={rating>=n?'star active':'star'} onClick={()=>setRating(n)}>★</button>)}</div></label><label>Details<textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="What happened, what did you expect, and which screen were you using?"/></label><button className="primaryLg" disabled={busy} onClick={submit}>{busy?'Sending…':'Submit feedback'}</button></section>
  <section className="panel"><h3>Quick help</h3><div className="helpList"><details><summary>How is P&L calculated?</summary><p>Gross P&L is calculated from entry, exit, direction and quantity. Net P&L subtracts brokerage, exchange charges, taxes and slippage.</p></details><details><summary>Where is my data stored?</summary><p>Demo data remains in this browser. Cloud accounts store private rows in Supabase with Row Level Security.</p></details><details><summary>Can I import broker trades?</summary><p>CSV and broker imports are planned after the public beta. Manual entry remains the source of truth in this milestone.</p></details><details><summary>Is this trading advice?</summary><p>No. TickMint analyses the information you record; it does not recommend buying or selling securities.</p></details></div><div className="supportCard"><MessageSquare/><div><b>Need direct support?</b><p>Email support@example.com with a screenshot and the steps that caused the issue.</p></div></div></section></div></>
}

function ConsentBanner({onAccept,onDecline}:any){return <div className="consent"><div><b>Help improve the beta</b><p>Allow anonymous product events such as which screens are opened. Trade values, notes and personal data are never included.</p></div><div><button className="secondaryLg" onClick={onDecline}>No thanks</button><button className="primaryLg" onClick={onAccept}>Allow analytics</button></div></div>}

function SettingsView({name,currency,startingCapital,demoMode,userId,accounts,trades,capitalEntries,reviews,theme,setTheme,onSaved}:any){
 const [saved,setSaved]=useState(false);
 const [busy,setBusy]=useState(false);
 const [form,setForm]=useState({name,currency,startingCapital});

 async function save(){
   setBusy(true);
   if(!demoMode&&userId){
     const {error}=await supabase.from('profiles').upsert({
       id:userId,
       display_name:form.name,
       currency:form.currency,
       starting_capital:Number(form.startingCapital),
       updated_at:new Date().toISOString()
     },{onConflict:'id'});
     if(error){alert(error.message);setBusy(false);return}
   }
   onSaved({...form,startingCapital:Number(form.startingCapital)});
   setSaved(true);setBusy(false);setTimeout(()=>setSaved(false),2000)
 }

 function exportBackup(){
   const payload={
     product:'TickMint',
     schemaVersion:'phase-2a-v1',
     exportedAt:new Date().toISOString(),
     profile:{displayName:form.name,currency:form.currency,startingCapital:Number(form.startingCapital)},
     tradingAccounts:accounts,
     trades,
     capitalEntries,
     dailyReviews:reviews
   };
   downloadText(JSON.stringify(payload,null,2),`tickmint-backup-${new Date().toISOString().slice(0,10)}.json`,'application/json');
 }

 return <><div className="pageHead"><div><span className="eyebrow">COMMAND CENTER</span><h1>Settings</h1><p>Personalise your account, trading rules and cloud-data backup.</p></div><button className="primaryLg" disabled={busy} onClick={save}>{busy?'Saving…':saved?'Saved ✓':'Save changes'}</button></div><div className="settingsGrid"><section className="panel"><h3>Cloud profile</h3><label>Display name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Currency<select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}><option>INR</option><option>USD</option><option>AED</option></select></label><label>Starting capital<input type="number" value={form.startingCapital} onChange={e=>setForm({...form,startingCapital:Number(e.target.value)})}/></label><p>{demoMode?'Demo settings apply only during this session.':'These profile settings are saved securely in Supabase.'}</p></section><section className="panel"><h3>Trading guardrails</h3><label>Daily trade limit<input type="number" defaultValue="4"/></label><label>Maximum risk per trade (%)<input type="number" defaultValue="2"/></label><Toggle title="Daily journal reminder" text="Remind me before the trading day closes"/><Toggle title="Bull/Bear terminology" text="Show Bull/Long and Bear/Short labels"/><Toggle title="Risk alerts" text="Warn when a trade breaks my risk plan"/></section><section className="panel appearancePanel"><h3>Appearance</h3><p>Choose the workspace atmosphere that best matches your trading environment.</p><div className="themeGrid">{([['system','System','Adapts to your device'],['light','Pearl','Bright institutional workspace'],['dark','Graphite','Balanced low-light mode'],['midnight','Midnight','Deep navy premium workspace'],['trading','Trading Dark','Maximum chart contrast']] as [ThemeMode,string,string][]).map(([id,label,copy])=><button key={id} className={theme===id?'themeCard selected':'themeCard'} onClick={()=>setTheme(id)}><span className={`themePreview ${id}`}><i></i><i></i><i></i></span><b>{label}</b><small>{copy}</small>{theme===id&&<Check size={15}/>}</button>)}</div></section><section className="panel"><h3>Data backup</h3><p>Download a portable JSON copy of your profile, accounts, trades, capital ledger and daily reviews.</p><button className="secondaryLg wide" onClick={exportBackup}><Download size={16}/> Download full backup</button><small>This export contains your trading data. Store it securely.</small></section></div></>
}
function Toggle({title,text}:any){const [on,setOn]=useState(true);return <div className="toggleRow"><div><b>{title}</b><small>{text}</small></div><button className={on?'toggle on':'toggle'} onClick={()=>setOn(!on)}><span></span></button></div>}

function TradeModal({trade,accounts,onClose,onSave}:{trade:Trade|null;accounts:TradingAccount[];onClose:()=>void;onSave:(t:Trade,file?:File|null)=>void}){
 const blank:Trade={id:crypto.randomUUID(),date:new Date().toISOString().slice(0,10),accountId:accounts.find(a=>a.isDefault)?.id||accounts[0]?.id||'',market:'Futures',instrument:'Nifty',instrumentType:'Index Futures',direction:'Bull',optionType:'',strikePrice:0,expiryDate:'',strategy:'Breakout',entry:0,exit:0,quantity:1,lotSize:1,lots:1,stopLoss:0,target:0,brokerage:0,exchangeCharges:0,taxes:0,slippage:0,charges:0,grossPnl:0,pnl:0,followedRules:true,emotion:'Focused',notes:'',screenshotUrl:''};
 const [f,setF]=useState<Trade>(trade||blank);const [file,setFile]=useState<File|null>(null);const [advanced,setAdvanced]=useState(false);
 const calc=(next:Trade)=>{const actualQty=next.market==='Options'||next.market==='Futures'||next.market==='Commodity'?Math.max(1,next.lotSize)*Math.max(1,next.lots):Math.max(1,next.quantity);const gross=(next.direction==='Bull'?next.exit-next.entry:next.entry-next.exit)*actualQty;const charges=next.brokerage+next.exchangeCharges+next.taxes+next.slippage;return {...next,quantity:actualQty,charges,grossPnl:gross,pnl:gross-charges};};
 const update=(k:keyof Trade,v:any)=>setF(prev=>calc({...prev,[k]:v}));
 const marketInstruments:any={Equity:['Reliance','TCS','HDFC Bank','Infosys','Custom'],Futures:['Nifty','Bank Nifty','Sensex','FinNifty','Midcap Nifty'],Options:['Nifty','Bank Nifty','Sensex','FinNifty','Stock Option'],Commodity:['Crude Oil','Natural Gas','Gold','Silver','Copper'],Crypto:['BTC','ETH','SOL'],Forex:['USDINR','EURINR','GBPINR']};
 return <div className="overlay" onMouseDown={onClose}><div className="modal wide" onMouseDown={e=>e.stopPropagation()}><div className="modalHead"><div><span className="eyebrow">{trade?'EDIT TRADE':'PRODUCTION TRADE ENTRY'}</span><h2>{trade?'Update complete journal entry':'Log risk, costs and context'}</h2></div><button onClick={onClose}><X/></button></div>
 <div className="directionPick"><button className={f.direction==='Bull'?'bull selected':'bull'} onClick={()=>update('direction','Bull')}><TrendingUp size={20}/> Bull <small>Long / Buy</small></button><button className={f.direction==='Bear'?'bear selected':'bear'} onClick={()=>update('direction','Bear')}><TrendingDown size={20}/> Bear <small>Short / Sell</small></button></div>
 <div className="sectionTitle">Contract details</div><div className="formGrid three"><label>Account<select value={f.accountId} onChange={e=>update('accountId',e.target.value)}>{accounts.map(a=><option value={a.id} key={a.id}>{a.name}</option>)}</select></label><label>Date<input type="date" value={f.date} onChange={e=>update('date',e.target.value)}/></label><label>Market<select value={f.market} onChange={e=>{const m=e.target.value as Trade['market'];setF(prev=>calc({...prev,market:m,instrument:marketInstruments[m][0],instrumentType:m==='Options'?'Index Option':m==='Commodity'?'Commodity Futures':m}))}}>{Object.keys(marketInstruments).map(x=><option key={x}>{x}</option>)}</select></label>
 <label>Instrument<select value={f.instrument} onChange={e=>update('instrument',e.target.value)}>{marketInstruments[f.market].map((x:string)=><option key={x}>{x}</option>)}</select></label><label>Instrument type<input value={f.instrumentType} onChange={e=>update('instrumentType',e.target.value)}/></label><label>Strategy<select value={f.strategy} onChange={e=>update('strategy',e.target.value)}>{['Breakout','Pullback','Reversal','Momentum','Opening Range','Trend','Scalping','Swing'].map(x=><option key={x}>{x}</option>)}</select></label>
 {f.market==='Options'&&<><label>Option type<select value={f.optionType} onChange={e=>update('optionType',e.target.value)}><option value="CE">CE</option><option value="PE">PE</option></select></label><label>Strike price<input type="number" value={f.strikePrice||''} onChange={e=>update('strikePrice',Number(e.target.value))}/></label><label>Expiry date<input type="date" value={f.expiryDate||''} onChange={e=>update('expiryDate',e.target.value)}/></label></>}</div>
 <div className="sectionTitle">Execution</div><div className="formGrid three"><label>Entry price<input type="number" step="any" value={f.entry||''} onChange={e=>update('entry',Number(e.target.value))}/></label><label>Exit price<input type="number" step="any" value={f.exit||''} onChange={e=>update('exit',Number(e.target.value))}/></label><label>Lot size<input type="number" value={f.lotSize||''} onChange={e=>update('lotSize',Number(e.target.value))}/></label><label>Lots<input type="number" value={f.lots||''} onChange={e=>update('lots',Number(e.target.value))}/></label><label>Calculated quantity<input disabled value={f.quantity}/></label><label>Stop loss<input type="number" step="any" value={f.stopLoss||''} onChange={e=>update('stopLoss',Number(e.target.value))}/></label><label>Target<input type="number" step="any" value={f.target||''} onChange={e=>update('target',Number(e.target.value))}/></label></div>
 <button className="advancedToggle" onClick={()=>setAdvanced(!advanced)}>{advanced?'Hide':'Show'} detailed charges</button>{advanced&&<div className="formGrid four"><label>Brokerage<input type="number" value={f.brokerage||''} onChange={e=>update('brokerage',Number(e.target.value))}/></label><label>Exchange charges<input type="number" value={f.exchangeCharges||''} onChange={e=>update('exchangeCharges',Number(e.target.value))}/></label><label>Taxes<input type="number" value={f.taxes||''} onChange={e=>update('taxes',Number(e.target.value))}/></label><label>Slippage<input type="number" value={f.slippage||''} onChange={e=>update('slippage',Number(e.target.value))}/></label></div>}
 <div className="pnlSummary"><div><span>Gross P&L</span><b>{money(f.grossPnl)}</b></div><div><span>Total costs</span><b className="red">{money(f.charges)}</b></div><div><span>Net P&L</span><b className={f.pnl>=0?'green':'red'}>{money(f.pnl)}</b></div></div>
 <div className="sectionTitle">Review evidence</div><div className="formGrid"><label>Emotion<select value={f.emotion} onChange={e=>update('emotion',e.target.value)}>{['Focused','Calm','Patient','Impatient','Fearful','Revenge','Overconfident'].map(x=><option key={x}>{x}</option>)}</select></label><label>Chart screenshot<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)}/><small>{file?file.name:f.screenshotUrl?'Existing screenshot attached':'Max 5 MB'}</small></label></div><label className="ruleCheck"><input type="checkbox" checked={f.followedRules} onChange={e=>update('followedRules',e.target.checked)}/> I followed my trading rules and position-size plan</label><label>Lesson / notes<textarea value={f.notes} onChange={e=>update('notes',e.target.value)} placeholder="Why did you enter? What went right? What will you change?"/></label><div className="modalActions"><button className="secondaryLg" onClick={onClose}>Cancel</button><button className="primaryLg" disabled={!f.accountId||!f.entry||!f.exit} onClick={()=>onSave(f,file)}>{trade?'Save changes':'Save trade'}</button></div></div></div>
}

function exportCsv(trades:Trade[]){const rows=[['Date','Account','Market','Instrument','Type','Direction','Option','Strike','Expiry','Strategy','Entry','Exit','Quantity','Lot Size','Lots','Stop Loss','Target','Gross P&L','Brokerage','Exchange Charges','Taxes','Slippage','Total Charges','Net P&L','Rules','Emotion','Notes','Screenshot'],...trades.map(t=>[t.date,t.accountId,t.market,t.instrument,t.instrumentType,t.direction,t.optionType||'',t.strikePrice||'',t.expiryDate||'',t.strategy,t.entry,t.exit,t.quantity,t.lotSize,t.lots,t.stopLoss||'',t.target||'',t.grossPnl,t.brokerage,t.exchangeCharges,t.taxes,t.slippage,t.charges,t.pnl,t.followedRules?'Yes':'No',t.emotion,t.notes,t.screenshotUrl||''])];downloadText(rows.map(r=>r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(',')).join('\n'),'tickmint-trades.csv','text/csv')}
function downloadText(text:string,name:string,type='text/plain'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
