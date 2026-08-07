import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'SmartBasket — Compare Grocery Prices in India',
  description: 'Find the cheapest grocery prices across DMart, BigBasket, Blinkit, Zepto, JioMart, Swiggy Instamart, and more.',
  keywords: 'grocery price comparison, cheapest grocery, DMart prices, BigBasket, Blinkit, India',
  openGraph: {
    title: 'SmartBasket',
    description: 'Compare grocery prices across all major stores',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
