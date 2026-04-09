import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { Toaster } from "sonner";
import SessionProvider from '@/components/SessionProvider';

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: "Celebque",
  description: "Sign in to your Celebque account",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var reloadFlagKey = 'celebque_chunk_reload_once';

                function recoverFromChunkError(message) {
                  var text = String(message || '');
                  var isChunkError =
                    text.includes('ChunkLoadError') ||
                    text.includes('Failed to load chunk') ||
                    text.includes('/_next/static/chunks/');

                  if (!isChunkError) return;
                  if (sessionStorage.getItem(reloadFlagKey) === '1') return;

                  sessionStorage.setItem(reloadFlagKey, '1');
                  var separator = window.location.search ? '&' : '?';
                  window.location.replace(window.location.pathname + window.location.search + separator + 'v=' + Date.now() + window.location.hash);
                }

                window.addEventListener('error', function (event) {
                  recoverFromChunkError(event && (event.message || (event.error && event.error.message)));
                });

                window.addEventListener('unhandledrejection', function (event) {
                  var reason = event && event.reason;
                  recoverFromChunkError(reason && (reason.message || reason));
                });
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`}>
        <SessionProvider>
          <AuthProvider>
            <SidebarProvider>
            {children}
            <Toaster />
            </SidebarProvider>
          </AuthProvider>
        </SessionProvider>

      </body>
    </html>
  );
}