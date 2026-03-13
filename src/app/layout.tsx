import { WalletProvider } from "@/lib/WalletContext";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import NextAuthProvider from "@/components/NextAuthProvider";

export const metadata = {
  title: "VeriDegree | Decentralized Academic Credentials",
  description: "Secure, private, and verifiable soulbound degrees on Algorand.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased font-inter bg-background text-foreground scroll-smooth">
        <NextAuthProvider>
          <WalletProvider>
            <Navbar />
            <Toaster 
              position="bottom-right" 
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'rgba(13, 13, 13, 0.8)',
                  backdropFilter: 'blur(16px)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(235, 203, 144, 0.2)',
                  borderRadius: '1.25rem',
                  padding: '1rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                },
                success: {
                  iconTheme: {
                    primary: '#EBCB90',
                    secondary: '#0D0D0D',
                  },
                },
              }} 
            />
            {children}
          </WalletProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
