import Link from "next/link";
import { AuthBrand } from "@/components/auth/auth-brand";
import { SignupForm } from "@/components/auth/signup-form";
import styles from "@/components/auth/auth.module.css";
export default function SignupPage(){return <main className={styles.page}><section className={styles.card}><AuthBrand/><h1 className={styles.title}>Build your trading edge</h1><p className={styles.subtitle}>Create your TickMint account and turn every trade into a better decision.</p><SignupForm/><p className={styles.finePrint}>Already have an account? <Link className={styles.link} href="/login">Sign in</Link></p></section></main>;}
