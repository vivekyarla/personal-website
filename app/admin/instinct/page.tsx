import { redirect } from "next/navigation";
import { requireAuthOrAgentSession } from "@/lib/session";
import InstinctLoginForm from "@/components/admin/InstinctLoginForm";

export const metadata = { title: "Admin · Instinct sign in" };

// Sign-in for Instinct (AI assistant): its vault fills the token into the
// password field. Grants only Tasks, Calendar, Habits and Readings.
export default async function InstinctLogin() {
  if (await requireAuthOrAgentSession()) redirect("/admin/tasks");
  return (
    <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Instinct</h1>
      <p className="text-[0.8rem] text-muted">
        Sign in with the Instinct access token. This opens Tasks, Calendar,
        Habits and Readings only.
      </p>
      <InstinctLoginForm />
    </div>
  );
}
