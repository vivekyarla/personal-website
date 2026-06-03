import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { fetchCategories } from "@/lib/tweets";
import CategoryManager from "@/components/admin/CategoryManager";

export const metadata = { title: "Admin · Categories" };
export const dynamic = "force-dynamic";

export default async function AdminCategories() {
  if (!(await requireAuth())) redirect("/admin/login");
  const categories = await fetchCategories();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin"
          className="text-xs text-muted/70 hover:text-foreground transition-colors"
        >
          ← admin
        </Link>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
      <p className="text-[0.8rem] text-muted">
        Categories are how tweets get sorted on /repository. The Apple Shortcut
        will reference a category by its <code>slug</code>.
      </p>
      <CategoryManager initial={categories} />
    </div>
  );
}
