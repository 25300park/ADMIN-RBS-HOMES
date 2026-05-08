import "./globals.css";
import { AuthProvider, AntdProvider, QueryProvider } from "@/providers";



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
          <AntdProvider>
            <QueryProvider>{children}</QueryProvider>
          </AntdProvider>
      </body>
    </html>
  );
}
