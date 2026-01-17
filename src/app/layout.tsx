import { type Metadata } from 'next';
import { Inter, Lexend } from 'next/font/google';
import clsx from 'clsx';

import '@/styles/tailwind.css';

export const metadata: Metadata = {
  title: {
    template: '%s - Qetta',
    default: 'Qetta - in·ev·it·able | Data Flows. Evidence Follows.',
  },
  description:
    '증빙 자동화 및 기술조합 추천 플랫폼. 기계 데이터에서 정부 제출 증빙까지, AI가 자동으로 처리합니다.',
  keywords: ['증빙', '자동화', '기술조합', 'AI', '문서생성', 'Evidence', 'Tech Stack', 'Qetta'],
  authors: [{ name: 'Qetta' }],
  openGraph: {
    title: 'Qetta - in·ev·it·able',
    description: 'Data Flows. Evidence Follows.',
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Qetta - in·ev·it·able',
    description: 'Data Flows. Evidence Follows.',
  },
};

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const lexend = Lexend({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lexend',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={clsx(
        'h-full scroll-smooth bg-white antialiased',
        inter.variable,
        lexend.variable
      )}
    >
      <body className="flex h-full flex-col">{children}</body>
    </html>
  );
}
