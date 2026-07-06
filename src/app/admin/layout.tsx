import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { AppShell } from "@/components/app-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await requireAdmin();
  if (!result.authorized) {
    redirect("/");
  }

  return <AppShell>{children}</AppShell>;
}
