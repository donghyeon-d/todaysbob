import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘 뭐 먹지?",
  description: "오늘 뭐 먹지?",
  openGraph: {
    title: "오늘 뭐 먹지?",
    description: "오늘 뭐 먹지?",
    url: "https://crosstep.kr",
    siteName: "Crosstep",
    images: [
      {
        url: "/logo_2_1.png",
        width: 1200,
        height: 630,
        alt: "Crosstep",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
