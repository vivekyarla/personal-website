import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vivek Y.",
  description: "Personal site of Vivek Yarlagedda.",
  metadataBase: new URL("https://vivekyarla.com"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://pbs.twimg.com" />
        <link rel="preconnect" href="https://abs.twimg.com" />
        <link rel="dns-prefetch" href="https://cdn.syndication.twimg.com" />
      </head>
      <body className="min-h-full flex flex-col">
        <div className="mx-auto w-full max-w-2xl px-6 sm:px-8 flex-1 flex flex-col">
          <main className="flex-1 flex flex-col">{children}</main>
          <footer className="py-6 text-[0.7rem] text-muted/60 text-center">
            © {new Date().getFullYear()} Vivek Yarlagedda
          </footer>
        </div>
      </body>
    </html>
  );
}
