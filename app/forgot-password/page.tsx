import Link from "next/link";
import { AuthBrand } from "@/components/auth/auth-brand";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import styles from "@/components/auth/auth.module.css";
export default function ForgotPasswordPage(){return <main className={styles.page}><section className={styles.card}><AuthBrand/><h1 className={styles.title}>Reset your password</h1><p className={styles.subtitle}>Enter your email and we will send you a secure password reset link.</p><ForgotPasswordForm/><p className={styles.finePrint}><Link className={styles.link} href="/login">Return to sign in</Link></p></section></main>;}
