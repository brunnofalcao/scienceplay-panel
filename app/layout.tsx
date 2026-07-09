import type { Metadata } from "next";
import { Geist_Mono, Inter, Sora } from "next/font/google";
import "./globals.css";

// Tipografia do Brandbook v2.1 §14: Sora (display) + Inter (UI/corpo)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Science Play — Panel",
    template: "%s · Science Play Panel",
  },
  description: "Cockpit interno da Science Play (COO, editorial e operação).",
  // Painel interno: nunca indexar. Reforçado pelo X-Robots-Tag no middleware.
  robots: { index: false, follow: false },
};

// Aplica o tema salvo ANTES da primeira pintura (evita flash claro/escuro).
const themeInitScript = `try{if(localStorage.getItem("sp-panel-theme")==="light")document.documentElement.classList.add("light")}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} ${sora.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
