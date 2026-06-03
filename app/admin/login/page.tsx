import LoginForm from "@/components/admin/LoginForm";
import { requireAuth } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata = { title: "Admin · Sign in" };

export default async function AdminLogin() {
  if (await requireAuth()) redirect("/admin");
  return (
    <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <LoginForm />
    </div>
  );
}
