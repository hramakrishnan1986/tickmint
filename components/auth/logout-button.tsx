"use client";

import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import styles from "./auth.module.css";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Unable to sign out:", error.message);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <button
      className={styles.logout}
      type="button"
      onClick={handleLogout}
    >
      Sign out
    </button>
  );
}