import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import LogoutButton from "@/components/admin/LogoutButton";
import EnrollPasskeyButton from "@/components/admin/EnrollPasskeyButton";

export const metadata = { title: "Admin" };

export default async function AdminHome() {
  if (!(await requireAuth())) redirect("/admin/login");

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <LogoutButton />
      </header>

      <section>
        <h2 className="text-base font-semibold tracking-tight mb-2">
          Inbound
        </h2>
        <ul className="space-y-1.5">
          <li>
            <Link
              href="/admin/inbound/new"
              className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
            >
              Add a new reading →
            </Link>
          </li>
          <li>
            <Link
              href="/admin/inbound"
              className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
            >
              Manage existing readings →
            </Link>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight mb-2">
          Repository
        </h2>
        <ul className="space-y-1.5">
          <li>
            <Link
              href="/admin/categories"
              className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
            >
              Manage categories →
            </Link>
          </li>
          <li>
            <Link
              href="/admin/tweets"
              className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
            >
              Manage tweets →
            </Link>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight mb-2">
          Habits
        </h2>
        <Link
          href="/admin/habits"
          className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
        >
          Open habit tracker →
        </Link>
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight mb-2">
          Security
        </h2>
        <EnrollPasskeyButton />
        <p className="text-xs text-muted/70 mt-2">
          Enroll a passkey to sign in with TouchID / FaceID next time. Apple
          syncs it across your devices via iCloud Keychain.
        </p>
      </section>
    </div>
  );
}
