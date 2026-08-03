import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // The main TickMint application already lives at app/page.tsx.
  // It detects the authenticated session and opens the dashboard.
  redirect("/");
}