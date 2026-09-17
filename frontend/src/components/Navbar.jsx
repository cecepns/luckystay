import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, FileText, ShieldCheck, Menu, X, User, LogOut, Briefcase, ChevronDown, Download, Home, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const dropdownRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      toast.success('PWA Siap! Pilih opsi "Add to Home Screen" di browser Anda untuk install aplikasi.');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group py-1">
            <img 
              src="/logo.png" 
              alt="Lucky Stay" 
              className="h-10 sm:h-12 w-auto object-contain" 
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-5">
            <Link 
              to="/search" 
              className={`text-sm font-medium transition-colors ${isActive('/search') ? 'text-orange-600 font-bold' : 'text-gray-600 hover:text-orange-600'}`}
            >
              Cari Properti
            </Link>

            <Link 
              to="/my-bookings" 
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isActive('/my-bookings') ? 'text-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
            >
              <Briefcase className="w-4 h-4" />
              Pesanan Saya
            </Link>
            
            <Link 
              to="/check-booking" 
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isActive('/check-booking') ? 'text-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
            >
              <FileText className="w-4 h-4" />
              Cek Invoice
            </Link>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all text-left border border-gray-100"
                >
                  <div className="w-7 h-7 rounded-lg bg-orange-500 text-white font-bold text-xs flex items-center justify-center">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-xs font-semibold text-gray-900 leading-tight truncate max-w-[100px]">{user?.name}</p>
                    <span className="text-[10px] text-gray-400">Tamu Terdaftar</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to="/my-bookings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-orange-600"
                    >
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      Pesanan Saya
                    </Link>

                    <Link
                      to="/check-booking"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-orange-600"
                    >
                      <FileText className="w-4 h-4 text-gray-400" />
                      Cek Invoice
                    </Link>

                    <div className="my-1 border-t border-gray-100" />

                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-amber-700 bg-amber-50/70 hover:bg-amber-100/80 font-medium"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        Admin Panel
                      </Link>
                    )}

                    <button
                      onClick={() => { setUserDropdownOpen(false); logout(); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Masuk / Daftar</span>
              </button>
            )}
          </nav>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2">
            {!isAuthenticated ? (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Masuk
              </button>
            ) : (
              <Link
                to="/my-bookings"
                className="w-8 h-8 rounded-xl bg-orange-500 text-white font-bold text-xs flex items-center justify-center shadow-xs"
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* MODERN SLIDE-OVER DRAWER FOR MOBILE MENU (NO EMOJIS) */}
      {/* ========================================================== */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs md:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Drawer Header */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                  <img src="/logo.png" alt="Lucky Stay" className="h-8 w-auto object-contain" />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                  aria-label="Tutup menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Greeting / Auth Status Card */}
              <div className="my-4">
                {isAuthenticated ? (
                  <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200/70 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 leading-snug">{user?.name}</div>
                        <div className="text-[11px] text-gray-500 truncate max-w-[130px]">{user?.email}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setMobileMenuOpen(false); logout(); }}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
                    >
                      Keluar
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80">
                    <div className="text-xs font-bold text-gray-900 mb-1">Selamat Datang di Lucky Stay</div>
                    <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                      Masuk atau daftar untuk kelola pesanan & status invoice.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setMobileMenuOpen(false); openAuthModal('login'); }}
                        className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer text-center"
                      >
                        Masuk Akun
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMobileMenuOpen(false); openAuthModal('register'); }}
                        className="flex-1 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 font-semibold text-xs rounded-xl transition-colors cursor-pointer text-center"
                      >
                        Daftar Baru
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Links with Icons & Chevrons */}
              <nav className="space-y-1">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-2xl transition-colors ${
                    isActive('/') ? 'bg-orange-50 text-orange-700 font-bold' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Beranda</div>
                      <div className="text-[10px] text-gray-400">Halaman utama</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>

                <Link
                  to="/search"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-2xl transition-colors ${
                    isActive('/search') ? 'bg-orange-50 text-orange-700 font-bold' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Search className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Cari Properti</div>
                      <div className="text-[10px] text-gray-400">Jelajahi semua hunian & filter</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>

                <Link
                  to="/my-bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-2xl transition-colors ${
                    isActive('/my-bookings') ? 'bg-orange-50 text-orange-700 font-bold' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Pesanan Saya</div>
                      <div className="text-[10px] text-gray-400">Daftar reservasi & voucher</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>

                <Link
                  to="/check-booking"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-2xl transition-colors ${
                    isActive('/check-booking') ? 'bg-orange-50 text-orange-700 font-bold' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Cek Status Invoice</div>
                      <div className="text-[10px] text-gray-400">Verifikasi & bukti bayar</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </nav>
            </div>

            {/* Bottom Section: PWA Install & Admin (if logged in as admin) */}
            <div className="pt-4 mt-6 border-t border-gray-100 space-y-2.5">
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">Admin Portal</div>
                      <div className="text-[10px] text-gray-500">Panel Kelola & Hostex</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    Admin
                  </span>
                </Link>
              )}

              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); handleInstallClick(); }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-gray-300 text-gray-600 hover:text-gray-900 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-orange-500" />
                <span>Install Lucky Stay App (PWA)</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
}
