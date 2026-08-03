import Link from "next/link";
import { Suspense } from "react";
import { AuthBrand } from "@/components/auth/auth-brand";
import { LoginForm } from "@/components/auth/login-form";
import styles from "@/components/auth/auth.module.css";

export default function LoginPage(){
  return <main className={styles.page}><section className={styles.card}>
    <AuthBrand/><h1 className={styles.title}>Welcome back</h1>
    <p className={styles.subtitle}>Sign in to continue tracking, reviewing and improving every trade.</p>
    <Suspense fallback={<p>Loading…</p>}><LoginForm/></Suspense>
    <p className={styles.finePrint}>New to TickMint? <Link className={styles.link} href="/signup">Create a free account</Link></p>
  </section></main>;
}
