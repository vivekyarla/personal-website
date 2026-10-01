import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import LogoutButton from "@/components/admin/LogoutButton";
import EnrollPasskeyButton from "@/components/admin/EnrollPasskeyButton";
import RevokeAllButton from "@/components/admin/RevokeAllButton";

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
          Hub
        </h2>
        <Link
          href="/admin/hub"
          className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
        >
          Open hub →
        </Link>
      </section>

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
          Analytics
        </h2>
        <Link
          href="/admin/analytics"
          className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
        >
          Open analytics →
        </Link>
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight mb-2">
          Security
        </h2>
        <EnrollPasskeyButton />
        <p className="text-xs text-muted/70 mt-2">
          Sign-in is passkey-only (Face ID / Touch ID). Apple syncs passkeys
          across your devices via iCloud Keychain; enroll one on any device
          that isn&apos;t synced. Sign-ins last 7 days.
        </p>
        <div className="mt-5">
          <RevokeAllButton />
          <p className="text-xs text-muted/70 mt-2">
            Ends every admin and Instinct session on every device, including
            this one.
          </p>
        </div>
      </section>
    </div>
  );
}
