import { redirect } from "next/navigation";
import { AuthBrand } from "@/components/auth/auth-brand";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { createClient } from "@/lib/supabase/server";
import styles from "@/components/auth/auth.module.css";
export default async function UpdatePasswordPage(){const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");return <main className={styles.page}><section className={styles.card}><AuthBrand/><h1 className={styles.title}>Choose a new password</h1><p className={styles.subtitle}>Use at least eight characters.</p><UpdatePasswordForm/></section></main>;}
