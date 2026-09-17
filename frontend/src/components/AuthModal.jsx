import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, User, Phone, Eye, EyeOff, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuthModal() {
  const { authModalOpen, authModalMode, setAuthModalMode, closeAuthModal, login, register, loading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  // Reset form when modal opens/changes mode
  useEffect(() => {
    if (authModalOpen) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
      });
      setShowPassword(false);
    }
  }, [authModalOpen, authModalMode]);

  if (!authModalOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (authModalMode === 'login') {
      if (!formData.email || !formData.password) {
        toast.error('Email dan password wajib diisi!');
        return;
      }
      await login(formData.email, formData.password);
    } else {
      if (!formData.name.trim()) {
        toast.error('Nama lengkap wajib diisi!');
        return;
      }
      if (!formData.email.trim()) {
        toast.error('Email aktif wajib diisi!');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('Password minimal 6 karakter!');
        return;
      }
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Graphic */}
        <div className="bg-white border-b border-gray-100 text-gray-900 px-6 pt-7 pb-5 relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <img src="/logo.png" alt="Lucky Stay" className="h-10 w-auto" />
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-600">Akun Tamu & Pelanggan</span>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                {authModalMode === 'login' ? 'Selamat Datang Kembali' : 'Gabung Bersama Lucky Stay'}
              </h3>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            {authModalMode === 'login'
              ? 'Masuk untuk mengelola pesanan, konfirmasi cepat, dan melihat riwayat staycation.'
              : 'Daftar akun gratis untuk kemudahan reservasi apartemen & villa terbaik.'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 p-1.5 m-4 rounded-2xl">
          <button
            type="button"
            onClick={() => setAuthModalMode('login')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              authModalMode === 'login'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Masuk ke Akun
          </button>
          <button
            type="button"
            onClick={() => setAuthModalMode('register')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              authModalMode === 'register'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Daftar Akun Baru
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {authModalMode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Contoh: Rian Hidayat"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="nama@email.com"
                required
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          {authModalMode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Nomor WhatsApp / HP
              </label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="081234567890"
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={authModalMode === 'login' ? '••••••••' : 'Minimal 6 karakter'}
                required
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-400 hover:text-gray-600 p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {authModalMode === 'register' && (
            <div className="flex items-start gap-2 pt-1 text-xs text-gray-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Data pribadi Anda terlindungi & digunakan hanya untuk konfirmasi reservasi dan check-in resmi.</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{authModalMode === 'login' ? 'Masuk Sekarang' : 'Buat Akun Lucky Stay'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Mode Switch Footer */}
          <div className="text-center pt-2 text-xs text-gray-500">
            {authModalMode === 'login' ? (
              <p>
                Belum memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => setAuthModalMode('register')}
                  className="font-bold text-orange-600 hover:underline cursor-pointer"
                >
                  Daftar di sini
                </button>
              </p>
            ) : (
              <p>
                Sudah memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => setAuthModalMode('login')}
                  className="font-bold text-orange-600 hover:underline cursor-pointer"
                >
                  Masuk ke akun
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
