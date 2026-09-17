import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-6xl font-extrabold text-orange-600 mb-2">404</h1>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Halaman Tidak Ditemukan</h2>
        <p className="text-xs text-gray-500 max-w-sm mb-6">
          Halaman yang Anda cari mungkin telah dipindahkan atau tidak tersedia.
        </p>
        <Link
          to="/"
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-orange-500/20 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
      <Footer />
    </div>
  );
}
