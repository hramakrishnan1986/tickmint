"use client";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./auth.module.css";

export function SignupForm() {
  const [fullName,setFullName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [error,setError]=useState(""); const [success,setSuccess]=useState(""); const [loading,setLoading]=useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess(""); setLoading(true);
    const { error: e } = await createClient().auth.signUp({
      email, password,
      options:{ emailRedirectTo:`${window.location.origin}/auth/confirm`, data:{ full_name:fullName.trim() } }
    });
    if (e) setError(e.message); else setSuccess("Check your email and click the confirmation link to activate your TickMint account.");
    setLoading(false);
  }

  return <form className={styles.form} onSubmit={handleSubmit}>
    {error && <p className={`${styles.message} ${styles.error}`}>{error}</p>}
    {success && <p className={`${styles.message} ${styles.success}`}>{success}</p>}
    <label className={styles.field}>Full name<input className={styles.input} value={fullName} onChange={e=>setFullName(e.target.value)} required /></label>
    <label className={styles.field}>Email address<input className={styles.input} type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
    <label className={styles.field}>Password<input className={styles.input} type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} required /></label>
    <button className={styles.button} disabled={loading}>{loading?"Creating account…":"Create free account"}</button>
  </form>;
}
