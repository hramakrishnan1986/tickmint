import './styles.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TickMint — Trading Performance Workspace',
  description: 'TickMint trading journal, analytics and performance workspace'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
