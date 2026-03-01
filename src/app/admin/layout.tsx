import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { AppNav } from "@/components/app-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await requireAdmin();
  if (!result.authorized) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-background">
      <AppNav />
      {children}
    </main>
  );
}
