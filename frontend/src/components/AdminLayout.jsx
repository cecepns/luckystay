import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Building, 
  Share2, 
  ExternalLink, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Home,
  MapPin,
  Layers,
  CreditCard,
  MessageSquareQuote,
  LogOut,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Kelola Booking & Approval', href: '/admin/bookings', icon: CalendarCheck },
    { name: 'Daftar Properti', href: '/admin/properties', icon: Building },
    { name: 'Kelola Kota / Destinasi', href: '/admin/cities', icon: MapPin },
    { name: 'Tipe Unit', href: '/admin/property-types', icon: Layers },
    { name: 'Rekening & QRIS', href: '/admin/payment-methods', icon: CreditCard },
    { name: 'Ulasan Pelanggan', href: '/admin/reviews', icon: MessageSquareQuote },
    { name: 'Hostex Channel Manager', href: '/admin/hostex', icon: Share2 },
  ];

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.href;
    return location.pathname.startsWith(item.href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Top Navbar Mobile & Tablet */}
      <header className="lg:hidden sticky top-0 z-40 bg-white text-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            {isMobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <img src="/logo.png" alt="Lucky Stay" className="h-8 w-auto" />
          <span className="font-bold text-sm tracking-wide text-gray-900">ADMIN PORTAL</span>
        </div>

        <Link
          to="/"
          className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-semibold px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Web Tamu</span>
        </Link>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Mobile Sidebar Overlay Drawer */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <div 
              className="w-72 bg-white h-full p-5 flex flex-col justify-between shadow-2xl transition-transform duration-300 border-r border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="flex items-center justify-between pb-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Lucky Stay" className="h-9 w-auto" />
                    <div>
                      <div className="font-bold text-gray-900 text-sm">Lucky Stay</div>
                      <div className="text-[11px] text-orange-600 font-semibold uppercase tracking-wider">Admin Workspace</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="mt-5 space-y-1">
                  {navigation.map((item) => {
                    const active = isActive(item);
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          active
                            ? 'bg-orange-500 text-white font-semibold shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-2">
                {user && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div className="truncate flex-1">
                      <div className="text-xs font-bold text-gray-900 truncate">{user.name}</div>
                      <div className="text-[10px] text-gray-500 truncate">{user.email}</div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar dari Admin</span>
                </button>

                <Link
                  to="/"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Lihat Website Tamu</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar (Collapsible with smooth transition) */}
        <aside
          className={`hidden lg:flex flex-col justify-between bg-white text-gray-700 border-r border-gray-200 shadow-xs transition-all duration-300 ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          <div>
            {/* Header */}
            <div className="h-18 flex items-center px-4 border-b border-gray-100 justify-between">
              {!isSidebarCollapsed && (
                <Link to="/admin" className="flex items-center gap-2.5 overflow-hidden">
                  <img src="/logo.png" alt="Lucky Stay" className="h-9 w-auto shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-gray-900 text-sm leading-tight">Lucky Stay</div>
                    <div className="text-[10px] text-orange-600 font-semibold tracking-wider uppercase">Admin Portal</div>
                  </div>
                </Link>
              )}

              {isSidebarCollapsed && (
                <img src="/logo.png" alt="Lucky Stay" className="h-9 w-auto mx-auto" />
              )}

              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ml-auto"
                title={isSidebarCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
              >
                {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Navigation items */}
            <nav className="p-3 space-y-1">
              {navigation.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-orange-500 text-white font-semibold shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    title={isSidebarCollapsed ? item.name : undefined}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom links */}
          <div className="p-3 border-t border-gray-100 space-y-2">
            {!isSidebarCollapsed && (
              <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800">
                <div className="flex items-center gap-1.5 font-bold mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hostex Connected</span>
                </div>
                <div className="truncate text-emerald-700/80">Token: zxWpN...ftV9</div>
              </div>
            )}

            {user && !isSidebarCollapsed && (
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="truncate min-w-0">
                  <div className="text-xs font-bold text-gray-900 truncate">{user.name}</div>
                  <div className="text-[10px] text-gray-400 truncate">{user.email}</div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer ${
                isSidebarCollapsed ? 'justify-center' : ''
              }`}
              title="Keluar Admin"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Keluar Admin</span>}
            </button>

            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-colors ${
                isSidebarCollapsed ? 'justify-center' : ''
              }`}
              title="Lihat Website Tamu"
            >
              <ExternalLink className="w-4 h-4 shrink-0 text-orange-500" />
              {!isSidebarCollapsed && <span>Website Tamu</span>}
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
