"use client";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./auth.module.css";

export function ForgotPasswordForm() {
  const [email,setEmail]=useState(""); const [error,setError]=useState(""); const [success,setSuccess]=useState(""); const [loading,setLoading]=useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess(""); setLoading(true);
    const { error:e } = await createClient().auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/auth/confirm?next=/update-password`});
    if(e) setError(e.message); else setSuccess("Check your inbox for the TickMint password reset link.");
    setLoading(false);
  }
  return <form className={styles.form} onSubmit={handleSubmit}>
    {error && <p className={`${styles.message} ${styles.error}`}>{error}</p>}
    {success && <p className={`${styles.message} ${styles.success}`}>{success}</p>}
    <label className={styles.field}>Email address<input className={styles.input} type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
    <button className={styles.button} disabled={loading}>{loading?"Sending…":"Send reset link"}</button>
  </form>;
}
