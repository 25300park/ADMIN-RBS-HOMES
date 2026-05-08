import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import RouteClientLayout from "@/components/route-client-layout";
import { MENU_ITEMS, ROUTES } from "@/utils/constants";
import { AuthProvider } from "@/providers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(ROUTES.LOGIN);
  }

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
