import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReceitAI - Receitas Inteligentes com IA",
  description: "Tire uma foto dos seus ingredientes e descubra receitas incríveis com inteligência artificial. Informações nutricionais, vídeos tutoriais e muito mais.",
  keywords: ["receitas", "culinária", "IA", "inteligência artificial", "ingredientes", "comida", "gastronomia"],
  authors: [{ name: "ReceitAI" }],
  openGraph: {
    title: "ReceitAI - Receitas Inteligentes com IA",
    description: "Descubra receitas incríveis a partir dos seus ingredientes usando IA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
