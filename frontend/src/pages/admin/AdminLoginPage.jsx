import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, isAuthenticated, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // If already logged in as admin, redirect to admin dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      const from = location.state?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email dan password wajib diisi!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        if (res.user?.role !== 'admin') {
          toast.error('Akun Anda bukan akun administrator!');
          return;
        }
        toast.success(`Selamat datang, Admin ${res.user.name}!`);
        const from = location.state?.from?.pathname || '/admin';
        navigate(from, { replace: true });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fillDefaultAdmin = () => {
    setEmail('admin@luckystay.com');
    setPassword('admin123');
    toast.success('Kredensial admin bawaan dimuat');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Glow background effects */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-xl shadow-orange-500/20 mb-4 ring-4 ring-orange-500/20">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Lucky Stay <span className="text-orange-500">Admin</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Portal Khusus Manajemen Properti & Operasional
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Administrator
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@luckystay.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-11 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting || loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk ke Dashboard Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Helper */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={fillDefaultAdmin}
              className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-medium py-1 px-3 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gunakan Akun Admin Bawaan</span>
            </button>
            <p className="text-[11px] text-slate-500 mt-2">
              admin@luckystay.com / admin123
            </p>
          </div>
        </div>

        {/* Back to Homepage */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Utama Tamu</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
