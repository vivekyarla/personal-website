export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pt-12 sm:pt-24 pb-20 flex flex-col gap-8 text-[0.9rem]">
      {children}
    </div>
  );
}
