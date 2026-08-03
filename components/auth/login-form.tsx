"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./auth.module.css";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [error,setError]=useState(""); const [loading,setLoading]=useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const { error: e } = await createClient().auth.signInWithPassword({ email, password });
    if (e) { setError(e.message); setLoading(false); return; }
    const next = searchParams.get("next");
    router.replace(next?.startsWith("/") ? next : "/dashboard"); router.refresh();
  }

  return <form className={styles.form} onSubmit={handleSubmit}>
    {error && <p className={`${styles.message} ${styles.error}`}>{error}</p>}
    <label className={styles.field}>Email address<input className={styles.input} type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
    <label className={styles.field}><span className={styles.row}><span>Password</span><Link className={styles.link} href="/forgot-password">Forgot password?</Link></span><input className={styles.input} type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required /></label>
    <button className={styles.button} disabled={loading}>{loading?"Signing in…":"Sign in to TickMint"}</button>
  </form>;
}
