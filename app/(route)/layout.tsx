import { checkAdmin } from "@/lib/require-admin";
import { redirect } from "next/navigation";
import RouteClientLayout from "@/components/route-client-layout";
import { MENU_ITEMS, ROUTES } from "@/utils/constants";
import { AuthProvider } from "@/providers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await checkAdmin();

  if (!admin.ok) {
    redirect(ROUTES.LOGIN);
  }
  const session = admin.session;

  const authorizedMenus = MENU_ITEMS.filter((menu) =>
    menu.allowedLevels.includes(session.user.level)
  );

  return (
    <AuthProvider session={session}>
      <RouteClientLayout authorizedMenus={authorizedMenus}>
        {children}
      </RouteClientLayout>
    </AuthProvider>
  );
}
