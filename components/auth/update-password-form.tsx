"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./auth.module.css";

export function UpdatePasswordForm() {
  const router=useRouter(); const [password,setPassword]=useState(""); const [confirm,setConfirm]=useState(""); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if(password!==confirm){setError("Passwords do not match.");return;}
    setLoading(true); const {error:e}=await createClient().auth.updateUser({password});
    if(e){setError(e.message);setLoading(false);return;}
    router.replace("/dashboard");router.refresh();
  }
  return <form className={styles.form} onSubmit={handleSubmit}>
    {error && <p className={`${styles.message} ${styles.error}`}>{error}</p>}
    <label className={styles.field}>New password<input className={styles.input} type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} required /></label>
    <label className={styles.field}>Confirm new password<input className={styles.input} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} minLength={8} required /></label>
    <button className={styles.button} disabled={loading}>{loading?"Updating…":"Update password"}</button>
  </form>;
}
