import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/theme-provider';
import { AccentThemeProvider } from '@/contexts/accent-theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeCustomizer } from '@/components/theme-customizer';

export const metadata: Metadata = {
  title: 'Truth or Dare Showdown',
  description: 'A competitive party game for friends and family.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AccentThemeProvider>
          <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
          >
              {children}
              <ThemeCustomizer />
              <ThemeToggle />
              <Toaster />
          </ThemeProvider>
        </AccentThemeProvider>
      </body>
    </html>
  );
}
