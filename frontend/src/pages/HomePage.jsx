import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FilterBar from '../components/FilterBar';
import ApartmentCard from '../components/ApartmentCard';
import Pagination from '../components/Pagination';
import { CardSkeleton, EmptyState } from '../components/Skeleton';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { formatRupiah } from '../utils/formatters';
import {
  Building2,
  Sparkles,
  ShieldCheck,
  Clock,
  Award,
  BadgePercent,
  SlidersHorizontal,
  Wallet,
  Hotel,
  Home,
  CheckCircle2,
  Star,
  Compass,
  ArrowRight,
  TrendingUp,
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  MessageSquareQuote
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state for main listing
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // Filters state
  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    category: searchParams.get('category') || '',
    type: searchParams.get('type') || '',
    guests: searchParams.get('guests') || '',
    check_in: searchParams.get('check_in') || '',
    check_out: searchParams.get('check_out') || '',
    search: searchParams.get('search') || '',
    sort: 'recommended',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
  });

  // Dynamic Cities from Database
  const [cityTabs, setCityTabs] = useState([]);

  // Customer Reviews & Slider State
  const [reviewsList, setReviewsList] = useState([]);
  const [currentReviewSlide, setCurrentReviewSlide] = useState(0);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [guestReviewForm, setGuestReviewForm] = useState({
    user_name: '',
    user_role_label: '',
    rating: 5,
    comment: ''
  });

  // Active budget tier filter
  const [activeBudgetTier, setActiveBudgetTier] = useState(null); // 'low' | 'mid' | 'luxury' | null
  const [maxBudgetSlider, setMaxBudgetSlider] = useState(1500000);

  // Fetch properties for the main listing section (limited to 10 on homepage)
  const fetchProperties = async (page = 1, currentLimit = 10, customFilters = filters) => {
    setLoading(true);
    try {
      const params = {
        page: 1,
        limit: 10,
        city: customFilters.city,
        category: customFilters.category,
        type: customFilters.type,
        guests: customFilters.guests,
        search: customFilters.search,
        min_price: customFilters.min_price || '',
        max_price: customFilters.max_price || '',
      };

      const res = await request.get(API_ENDPOINTS.PROPERTIES.LIST, params);
      if (res.success) {
        setProperties(res.data);
        setPagination(res.pagination || { page: 1, limit: 10, total: res.data.length, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat daftar properti');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all active properties once for the curated sections (Rekomendasi Apartemen, Rekomendasi Hotel, Budget Preview)
  const fetchAllProperties = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.PROPERTIES.LIST, { limit: 50 });
      if (res.success) {
        setAllProperties(res.data || []);
      }
    } catch (err) {
      console.error('Fetch all properties error:', err);
    }
  };

  useEffect(() => {
    fetchAllProperties();
  }, []);

  // Fetch dynamic cities & public reviews on mount
  useEffect(() => {
    const fetchCityTabs = async () => {
      try {
        const res = await request.get(API_ENDPOINTS.CITIES.ALL);
        if (res.success && res.data) {
          setCityTabs(res.data);
        }
      } catch (err) {
        console.error('Failed to load city tabs', err);
      }
    };

    const fetchPublicReviews = async () => {
      try {
        const res = await request.get(API_ENDPOINTS.REVIEWS.PUBLIC);
        if (res.success && res.data) {
          setReviewsList(res.data);
        }
      } catch (err) {
        console.error('Failed to load public reviews', err);
      }
    };

    fetchCityTabs();
    fetchPublicReviews();
  }, []);

  const handleGuestReviewSubmit = async (e) => {
    e.preventDefault();
    if (!guestReviewForm.user_name.trim() || !guestReviewForm.comment.trim()) {
      toast.error('Nama dan isi ulasan wajib diisi!');
      return;
    }

    setReviewSubmitting(true);
    try {
      const res = await request.post(API_ENDPOINTS.REVIEWS.SUBMIT, guestReviewForm);
      if (res.success) {
        toast.success('Terima kasih! Ulasan Anda berhasil dikirim.');
        setReviewModalOpen(false);
        setGuestReviewForm({
          user_name: '',
          user_role_label: '',
          rating: 5,
          comment: ''
        });
        // Reload reviews
        const updated = await request.get(API_ENDPOINTS.REVIEWS.PUBLIC);
        if (updated.success && updated.data) {
          setReviewsList(updated.data);
          setCurrentReviewSlide(0);
        }
      }
    } catch (err) {
      toast.error(err.customMessage || 'Gagal mengirim ulasan');
    } finally {
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    fetchProperties(1, pagination.limit, filters);
  }, [filters.city, filters.category, filters.type, filters.guests, filters.min_price, filters.max_price]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key === 'city' || key === 'category' || key === 'type') {
      setActiveBudgetTier(null);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (filters.city) params.set('city', filters.city);
    if (filters.category) params.set('category', filters.category);
    if (filters.type) params.set('type', filters.type);
    if (filters.guests) params.set('guests', filters.guests);
    if (filters.check_in) params.set('check_in', filters.check_in);
    if (filters.check_out) params.set('check_out', filters.check_out);
    if (filters.search) params.set('search', filters.search);
    navigate(`/search?${params.toString()}`);
  };

  // Handle Quick Budget Tier Click -> Direct Redirect to /search with budget filter
  const handleBudgetTierClick = (tier) => {
    let min = '';
    let max = '';

    if (tier === 'low') {
      min = '0';
      max = '450000';
    } else if (tier === 'mid') {
      min = '450000';
      max = '800000';
    } else if (tier === 'luxury') {
      min = '800000';
      max = '';
    }

    const params = new URLSearchParams();
    if (filters.city) params.set('city', filters.city);
    if (filters.category) params.set('category', filters.category);
    if (filters.type) params.set('type', filters.type);
    if (min) params.set('min_price', min);
    if (max) params.set('max_price', max);
    navigate(`/search?${params.toString()}`);
  };

  // Filtered recommendations for Apartemen
  const recommendedApartments = useMemo(() => {
    return allProperties
      .filter((p) => (p.category === 'Apartemen' || !p.category) && p.type !== 'Villa')
      .slice(0, 3);
  }, [allProperties]);

  // Filtered recommendations for Hotel & Villa
  const recommendedHotelsAndVillas = useMemo(() => {
    return allProperties
      .filter((p) => p.category === 'Hotel' || p.category === 'Villa' || p.type === 'Penthouse' || p.type === 'Villa')
      .slice(0, 3);
  }, [allProperties]);

  // Count matching units for current maxBudgetSlider
  const budgetMatchingCount = useMemo(() => {
    return allProperties.filter((p) => Number(p.price_per_night) <= maxBudgetSlider).length;
  }, [allProperties, maxBudgetSlider]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 selection:bg-orange-500 selection:text-white">
      <Navbar />

      {/* ========================================================== */}
      {/* 1. HERO SECTION WITH TRAVELIO-INSPIRED CLEAN MOBILE LAYOUT */}
      {/* ========================================================== */}
      <section className="relative bg-white pt-6 sm:pt-12 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 border-b border-gray-100">

        <div className="max-w-5xl mx-auto mb-6 sm:mb-10">

          <div className="text-left sm:text-center space-y-2 sm:space-y-3">

            {/* Official Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Sewa Apartemen & Villa Pilihan</span>
              <span className="w-1 h-1 rounded-full bg-orange-400" />
            </div>

            {/* Lucky Stay Bold Headline */}
            <h1 className="text-2xl sm:text-4xl lg:text-[3.25rem] font-black text-gray-900 tracking-tight leading-tight">
              Sewa Apartemen & Villa{' '}
              <br className="hidden sm:block" />
              <span className="text-orange-500 font-black">
                #LuckyStay!
              </span>
            </h1>

            {/* Modern Subtitle */}
            <p className="text-xs sm:text-sm text-gray-500 max-w-xl sm:mx-auto pt-1 leading-relaxed">
              Temukan hunian apartemen dan villa eksklusif untuk staycation, bisnis, dan liburan dengan harga terbaik & konfirmasi instan.
            </p>

          </div>

        </div>

        {/* Filter / Search Bar Container */}
        <div className="max-w-5xl mx-auto -mb-12 sm:-mb-16 relative z-30">
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
          />
        </div>
      </section>

      {/* Spacing for overlapping FilterBar */}
      <div className="h-14 sm:h-20" />

      {/* ========================================================== */}
      {/* 2. TRAVELIO-STYLE DEALS SECTION (DIRECTLY UNDER SEARCH) */}
      {/* ========================================================== */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-end justify-between gap-4 mb-2">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-1.5">
              <span>Sewa Staycation Lebih Murah</span>
              <span>🤑</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Diskon hingga IDR 1.000.000 & jaminan konfirmasi instan
            </p>
          </div>

          <button
            onClick={() => {
              const params = new URLSearchParams();
              if (filters.city) params.set('city', filters.city);
              navigate(`/search?${params.toString()}`);
            }}
            className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 hover:underline shrink-0 cursor-pointer inline-flex items-center gap-1"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* City Filter Pills (Dynamic from Database) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 mb-4">
          {['Semua Kota', ...(cityTabs.length > 0 ? cityTabs.map(c => c.name) : ['Jakarta Selatan', 'Bandung', 'Bali', 'Tangerang', 'Surabaya'])].map((city) => {
            const isSelected = (!filters.city && city === 'Semua Kota') || filters.city === city;
            return (
              <button
                key={city}
                type="button"
                onClick={() => handleFilterChange('city', city === 'Semua Kota' ? '' : city)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${isSelected
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
              >
                {city.replace(' Selatan', '')}
              </button>
            );
          })}
        </div>

        {/* Property Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recommendedApartments.map((prop) => (
            <ApartmentCard key={prop.id} property={prop} />
          ))}
        </div>
      </section>

      {/* ========================================================== */}
      {/* 3. SECTION: "ATUR SESUAI BUDGETMU!" (INTERACTIVE) */}
      {/* ========================================================== */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="bg-sky-50/70 rounded-3xl p-6 sm:p-10 text-gray-900 shadow-sm border border-sky-200/70 relative overflow-hidden">

          {/* Section Heading */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-sky-200/80 text-orange-600 text-xs font-bold mb-2 shadow-xs">
                <Wallet className="w-3.5 h-3.5 text-orange-500" />
                <span>Pencarian Cerdas</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Atur Sesuai Budgetmu!
              </h2>
              <p className="text-sm text-gray-600 mt-1 max-w-xl">
                Temukan hunian menginap dengan harga yang pas di kantong Anda. Pilih tier budget atau gunakan slider rentang harga interaktif.
              </p>
            </div>
          </div>

          {/* 3 Budget Tier Interactive Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

            {/* Tier 1: Hemat & Nyaman */}
            <div
              onClick={() => handleBudgetTierClick('low')}
              className="group relative p-5 sm:p-6 rounded-2xl border transition-all duration-300 cursor-pointer bg-white hover:bg-white border-gray-200 hover:border-orange-400 shadow-xs hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">🌟</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Hemat & Cerdas
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">&lt; Rp 450.000</h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Studio modern dan 1BR nyaman, WiFi cepat, kasur empuk, dan akses kolam renang lengkap.
              </p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 group-hover:translate-x-1 transition-transform">
                <span>Lihat Unit Budget Ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Tier 2: Populer & Lengkap */}
            <div
              onClick={() => handleBudgetTierClick('mid')}
              className="group relative p-5 sm:p-6 rounded-2xl border transition-all duration-300 cursor-pointer bg-white hover:bg-white border-gray-200 hover:border-orange-400 shadow-xs hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">🏢</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Paling Populer
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Rp 450rb – Rp 800rb</h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Unit 2BR luas, direct access mall, kitchen set lengkap, gym, cocok untuk keluarga kecil.
              </p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 group-hover:translate-x-1 transition-transform">
                <span>Lihat Unit Budget Ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Tier 3: Mewah & Eksklusif */}
            <div
              onClick={() => handleBudgetTierClick('luxury')}
              className="group relative p-5 sm:p-6 rounded-2xl border transition-all duration-300 cursor-pointer bg-white hover:bg-white border-gray-200 hover:border-orange-400 shadow-xs hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">👑</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Mewah & Eksklusif
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">&gt; Rp 800.000</h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Hotel Suite berbintang, Grand Penthouse, dan Tropical Villa dengan private swimming pool.
              </p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 group-hover:translate-x-1 transition-transform">
                <span>Lihat Unit Budget Ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>

          {/* Interactive Budget Slider Bar */}
          <div className="bg-white rounded-2xl p-5 border border-sky-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="w-full md:w-2/3">
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-gray-700 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-orange-500" />
                  Maksimal Budget Anda / Malam:
                </span>
                <span className="text-base font-bold text-orange-600 font-mono">
                  {formatRupiah(maxBudgetSlider)}
                </span>
              </div>
              <input
                type="range"
                min="350000"
                max="1600000"
                step="50000"
                value={maxBudgetSlider}
                onChange={(e) => setMaxBudgetSlider(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer h-2 bg-gray-200 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-gray-400 mt-1 font-medium">
                <span>Rp 350.000</span>
                <span>Rp 900.000</span>
                <span>Rp 1.600.000+</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams();
                  if (filters.city) params.set('city', filters.city);
                  if (filters.category) params.set('category', filters.category);
                  if (filters.type) params.set('type', filters.type);
                  params.set('min_price', '0');
                  params.set('max_price', String(maxBudgetSlider));
                  navigate(`/search?${params.toString()}`);
                }}
                className="w-full md:w-auto px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 text-center cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Terapkan Budget ({budgetMatchingCount} Unit Tersedia)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================== */}
      {/* 4. SECTION: "REKOMENDASI HOTEL & VILLA MEWAH" */}
      {/* ========================================================== */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
                <Hotel className="w-4 h-4" />
                <span>Liburan Mewah & Staycation Berbintang</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Rekomendasi Hotel & Villa Mewah
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Koleksi kamar suite hotel berbintang dan private pool villa dengan fasilitas resort kelas dunia
              </p>
            </div>

            <button
              onClick={() => {
                navigate('/search?category=Hotel');
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline cursor-pointer"
            >
              <span>Lihat Semua Hotel & Villa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedHotelsAndVillas.map((prop) => (
              <ApartmentCard key={prop.id} property={prop} />
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================== */}
      {/* 5. ALL PROPERTIES SEARCH & PAGINATED LISTING */}
      {/* ========================================================== */}
      <section id="all-properties" className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 scroll-mt-28">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span>Katalog Lengkap</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {filters.city
                ? `Properti di ${filters.city}`
                : filters.category
                  ? `Katalog ${filters.category}`
                  : 'Semua Properti Siap Huni'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Ditemukan {pagination.total} unit dengan jaminan kebersihan, keamanan, dan konfirmasi instan
            </p>
          </div>

          {/* Right Header: Badges & Quick Lihat Semua Button */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-4 text-xs text-gray-600 font-medium bg-white px-4 py-2 rounded-2xl border border-gray-200">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Verified
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-4 h-4 text-orange-600" /> Jaminan Harga Resmi
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-blue-600" /> Instant Sync Hostex
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams();
                if (filters.city) params.set('city', filters.city);
                if (filters.category) params.set('category', filters.category);
                if (filters.type) params.set('type', filters.type);
                navigate(`/search?${params.toString()}`);
              }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 hover:underline shrink-0 cursor-pointer"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Property Grid List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Tidak ada properti yang cocok dengan filter"
            description="Coba ubah kriteria pencarian kota, budget, atau tanggal check-in untuk menemukan unit lainnya."
            actionText="Tampilkan Semua Properti"
            onAction={() => {
              setFilters({
                city: '',
                category: '',
                type: '',
                guests: '',
                check_in: '',
                check_out: '',
                search: '',
                min_price: '',
                max_price: '',
              });
              setActiveBudgetTier(null);
              fetchProperties(1, pagination.limit, {
                city: '',
                category: '',
                type: '',
                guests: '',
                check_in: '',
                check_out: '',
                search: '',
                min_price: '',
                max_price: '',
              });
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.slice(0, 10).map((prop) => (
              <ApartmentCard key={prop.id} property={prop} />
            ))}
          </div>
        )}

        {/* Tombol Lihat Semua yang Redirect ke Page Search */}
        {!loading && properties.length > 0 && (
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams();
                if (filters.city) params.set('city', filters.city);
                if (filters.category) params.set('category', filters.category);
                if (filters.type) params.set('type', filters.type);
                navigate(`/search?${params.toString()}`);
              }}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all cursor-pointer"
            >
              <span>Lihat Semua Akomodasi ({pagination.total || properties.length} Properti)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>

      {/* ========================================================== */}
      {/* 6. WHY CHOOSE LUCKY STAY (BENEFITS & TRUST) */}
      {/* ========================================================== */}
      <section className="bg-white border-t border-gray-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Standar Kualitas Tertinggi</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              Kenapa Memilih Lucky Stay?
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Kenyamanan, privasi, dan kepastian reservasi tanpa drama kalender bentrok atau potongan tidak jelas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4 font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Booking Instan Tanpa Ribet</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Pesan unit pilihan Anda dalam hitungan menit. Konfirmasi reservasi langsung terbit otomatis dengan panduan check-in praktis.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Deposit Aman & Cepat</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Security deposit dikembalikan 100% penuh setelah check-out tanpa potongan tersembunyi langsung ke rekening Anda.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Unit Higienis & Terawat</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Linen dicuci steril berstandar hotel, kasur bermerek (King Koil), Smart TV, AC dingin, dan water heater berfungsi optimal.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Layanan CS Siaga 24 Jam</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Tim staf dan customer care siap membantu proses check-in mandiri dan panduan unit kapan saja melalui WhatsApp.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================== */}
      {/* 7. CUSTOMER TESTIMONIALS & REVIEWS SLIDER */}
      {/* ========================================================== */}
      <section className="bg-gray-50 border-t border-gray-200 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquareQuote className="w-4 h-4 text-amber-500" />
                Testimoni Tamu
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
                Pengalaman Menginap Nyata
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Dipercaya oleh ribuan wisatawan, pebisnis, dan keluarga di berbagai kota besar
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-orange-50 text-orange-600 hover:text-orange-700 font-semibold text-xs rounded-xl border border-orange-200 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tulis Ulasan Tamu</span>
              </button>

              {/* Slider Navigation Arrows */}
              {reviewsList.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentReviewSlide((prev) => Math.max(0, prev - 1))}
                    disabled={currentReviewSlide === 0}
                    className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
                    aria-label="Previous review"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentReviewSlide((prev) => Math.min(Math.max(0, reviewsList.length - 1), prev + 1))}
                    disabled={currentReviewSlide >= reviewsList.length - 1}
                    className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
                    aria-label="Next review"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Slider Track */}
          <div className="relative">
            {reviewsList.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                Belum ada ulasan yang ditampilkan. Jadilah yang pertama memberikan ulasan!
              </div>
            ) : (
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{
                    transform: `translateX(-${currentReviewSlide * (window?.innerWidth >= 1024 ? 33.333 : window?.innerWidth >= 768 ? 50 : 100)}%)`
                  }}
                >
                  {reviewsList.map((review) => {
                    const initials = (review.user_name || 'Tamu')
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <div
                        key={review.id}
                        className="w-full md:w-1/2 lg:w-1/3 shrink-0 p-3"
                      >
                        <div className="h-full bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                          <div>
                            <div className="flex items-center gap-1 text-amber-400 mb-3">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                                  }`}
                                />
                              ))}
                              <span className="text-xs font-bold text-gray-700 ml-1">
                                {review.rating}.0
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed mb-4 italic">
                              &ldquo;{review.comment}&rdquo;
                            </p>
                          </div>

                          <div className="flex items-center gap-3 pt-3 border-t border-gray-100 mt-2">
                            <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div className="truncate">
                              <h4 className="font-bold text-xs text-gray-900 truncate">
                                {review.user_name}
                              </h4>
                              <span className="text-[11px] text-gray-400 truncate block">
                                {review.user_role_label || 'Tamu Terverifikasi'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Slider Dots */}
            {reviewsList.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-6">
                {reviewsList.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setCurrentReviewSlide(dotIdx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      currentReviewSlide === dotIdx ? 'w-6 bg-orange-500' : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${dotIdx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Modal Guest Review Submission */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Tulis Ulasan & Pengalaman Menginap"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleGuestReviewSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Nama Lengkap Anda <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Rian Pratama"
              value={guestReviewForm.user_name}
              onChange={(e) => setGuestReviewForm({ ...guestReviewForm, user_name: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Unit / Pengalaman Menginap
            </label>
            <input
              type="text"
              placeholder="Contoh: Staycation Liburan • Bassura City Jakarta"
              value={guestReviewForm.user_role_label}
              onChange={(e) => setGuestReviewForm({ ...guestReviewForm, user_role_label: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Penilaian / Rating
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setGuestReviewForm({ ...guestReviewForm, rating: star })}
                  className="p-1 hover:scale-110 transition-transform cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= guestReviewForm.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-200 hover:text-amber-200'
                    }`}
                  />
                </button>
              ))}
              <span className="text-sm font-bold text-gray-800 ml-2">
                {guestReviewForm.rating} dari 5 Bintang
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Isi Ulasan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="Ceritakan pengalaman Anda selama menginap di Lucky Stay..."
              value={guestReviewForm.comment}
              onChange={(e) => setGuestReviewForm({ ...guestReviewForm, comment: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 mt-5">
            <button
              type="button"
              onClick={() => setReviewModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={reviewSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {reviewSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}
            </button>
          </div>
        </form>
      </Modal>

      <Footer />
    </div>
  );
}
