'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('TickMint route error', error); }, [error]);
  return <main className="releaseState"><section><p className="eyebrow">WORKSPACE ERROR</p><h1>TickMint could not open this screen.</h1><p>Your data has not been changed. Retry the screen or check your connection.</p><button className="primaryLg" onClick={reset}>Try again</button></section></main>;
}
