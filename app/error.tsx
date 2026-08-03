'use client';
import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
export default function ErrorPage({error,reset}:{error:Error & {digest?:string};reset:()=>void}){
  useEffect(()=>{console.error(error)},[error]);
  return <main className="errorPage"><section className="errorBox"><div style={{fontSize:42}}>⚠️</div><h1>Something interrupted the journal</h1><p>Your saved cloud data has not been removed. Retry the screen, or return to the home page if the problem continues.</p><div><button className="primaryLg" onClick={reset}><RefreshCw size={17}/> Try again</button><button className="secondaryLg" onClick={()=>location.href='/'}>Go home</button></div></section></main>
}
