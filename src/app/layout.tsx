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
                var attemptKey = 'celebque_chunk_reload_attempts';
                var maxAttempts = 3;

                function parseAttempts() {
                  var raw = sessionStorage.getItem(attemptKey) || '0';
                  var count = parseInt(raw, 10);
                  return Number.isFinite(count) ? count : 0;
                }

                function isAssetFailureText(text) {
                  return (
                    text.includes('ChunkLoadError') ||
                    text.includes('Failed to load chunk') ||
                    text.includes('/_next/static/chunks/') ||
                    text.includes('/_next/static/media/') ||
                    text.includes('.woff2')
                  );
                }

                async function clearClientCaches() {
                  try {
                    if ('serviceWorker' in navigator) {
                      var registrations = await navigator.serviceWorker.getRegistrations();
                      await Promise.all(registrations.map(function (registration) {
                        return registration.unregister();
                      }));
                    }
                  } catch (e) {}

                  try {
                    if ('caches' in window) {
                      var cacheKeys = await caches.keys();
                      await Promise.all(cacheKeys.map(function (key) {
                        return caches.delete(key);
                      }));
                    }
                  } catch (e) {}
                }

                async function recoverFromAssetError(message) {
                  var text = String(message || '');
                  if (!isAssetFailureText(text)) return;

                  var attempts = parseAttempts();
                  if (attempts >= maxAttempts) return;

                  sessionStorage.setItem(attemptKey, String(attempts + 1));
                  await clearClientCaches();

                  var separator = window.location.search ? '&' : '?';
                  var bustedUrl = window.location.pathname + window.location.search + separator + 'v=' + Date.now() + window.location.hash;
                  window.location.replace(bustedUrl);
                }

                window.addEventListener('error', function (event) {
                  var srcElement = event && event.target;
                  var src = srcElement && (srcElement.src || srcElement.href || '');
                  recoverFromAssetError(src || (event && (event.message || (event.error && event.error.message))));
                });

                window.addEventListener('unhandledrejection', function (event) {
                  var reason = event && event.reason;
                  recoverFromAssetError(reason && (reason.message || reason));
                });

                window.addEventListener('load', function () {
                  // Clear recovery state after a successful page load.
                  sessionStorage.removeItem(attemptKey);
                });
              })();
            `,
          }}
        />
          {/* Favicons */}
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon_16.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon_32.png" />
          <link rel="icon" type="image/png" sizes="48x48" href="/favicon_48.png" />
          {/* PWA Icons */}
          <link rel="icon" type="image/png" sizes="192x192" href="/icon_192.png" />
          <link rel="icon" type="image/png" sizes="512x512" href="/icon_512.png" />
          {/* Adaptive Icon */}
          <link rel="icon" type="image/png" sizes="432x432" href="/adaptive_432.png" />
          {/* Splash Icon */}
          <link rel="apple-touch-startup-image" href="/splash_1024.png" />
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