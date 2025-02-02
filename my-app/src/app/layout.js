import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Quiz App",
  description: "An AI-powered quiz application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Navbar */}
        <nav className="bg-gray-900 text-white p-4 flex justify-between">
          <Link href="/" className="text-lg font-bold">
            Quiz App
          </Link>
          <div>
            <Link href="/courses" className="px-4">Courses</Link>
            <Link href="/login" className="px-4">Login</Link>
            <Link href="/register" className="px-4">Register</Link>
          </div>
        </nav>

        <main className="p-8">{children}</main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white text-center p-4 mt-10">
          © {new Date().getFullYear()} Quiz App. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
