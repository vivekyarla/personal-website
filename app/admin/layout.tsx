import AdminSwitcher from "@/components/admin/AdminSwitcher";

export const dynamic = "force-dynamic";

// Belt-and-suspenders alongside robots.txt: never index the admin.
export const metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pt-12 sm:pt-24 pb-20 flex flex-col gap-8 text-[0.9rem]">
      {/* Renders only on /admin/tasks, /admin/habits, /admin/inbound* —
          persists across those navigations so the underline slides. */}
      <AdminSwitcher />
      {children}
    </div>
  );
}
