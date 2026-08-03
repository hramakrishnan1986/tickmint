import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { LogoutButton } from "../../components/auth/logout-button";
import styles from "../../components/auth/auth.module.css";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "Trader";

  return (
    <main className={styles.dashboard}>
      <div className={styles.dashboardShell}>
        <header className={styles.dashboardTop}>
          <div>
            <p>TickMint</p>
            <h1>Welcome, {fullName}</h1>
            <p>{user.email}</p>
          </div>

          <LogoutButton />
        </header>

        <section className={styles.panel}>
          <h2>Your protected dashboard is working</h2>
          <p>
            Replace this sample panel with your current TickMint dashboard after
            confirming authentication works.
          </p>
        </section>
      </div>
    </main>
  );
}