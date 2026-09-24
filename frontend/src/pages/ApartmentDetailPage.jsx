import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { formatRupiah, calculateNights } from '../utils/formatters';
import { 
  MapPin, 
  Users, 
  Bed, 
  Bath, 
  Maximize2, 
  Check, 
  ShieldCheck, 
  Calendar, 
  ChevronRight, 
  ChevronLeft,
  Share2, 
  Sparkles,
  AlertCircle,
  X,
  Image as ImageIcon,
  Tag
} from 'lucide-react';
import toast from 'react-hot-toast';
import ImageWithFallback from '../components/ImageWithFallback';

export default function ApartmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Booking states
  const [checkInDate, setCheckInDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const [checkOutDate, setCheckOutDate] = useState(() => {
    const afterTomorrow = new Date();
    afterTomorrow.setDate(afterTomorrow.getDate() + 3);
    return afterTomorrow.toISOString().split('T')[0];
  });

  const [guestsCount, setGuestsCount] = useState(1);
  const [isBooking, setIsBooking] = useState(false);

  // Discount calculation
  const hasDiscount = property && Number(property.original_price) > Number(property.price_per_night);
  const discountPercent = property ? (property.discount_percent || (hasDiscount ? Math.round(((Number(property.original_price) - Number(property.price_per_night)) / Number(property.original_price)) * 100) : 0)) : 0;

  useEffect(() => {
    const fetchPropertyDetail = async () => {
      setLoading(true);
      try {
        const res = await request.get(API_ENDPOINTS.PROPERTIES.DETAIL(id));
        if (res.success) {
          setProperty(res.data);
        }
      } catch (err) {
        toast.error('Gagal memuat informasi apartemen');
      } finally {
        setLoading(false);
      }
    };
    fetchPropertyDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto w-full p-6 animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-96 bg-gray-200 rounded-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-64 bg-gray-200 rounded-2xl" />
            <div className="h-64 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
          <h2 className="text-xl font-bold text-gray-800">Properti Tidak Ditemukan</h2>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-semibold"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const propertyPrice = Number(property.price_per_night) || 0;
  const nights = calculateNights(checkInDate, checkOutDate);
  const rawRoomPrice = propertyPrice * nights;

  let rentalType = 'daily';
  let totalRoomPrice = rawRoomPrice;
  let discountAmount = 0;
  let discountLabel = '';

  if (nights >= 365) {
    rentalType = 'yearly';
    const yearlyDisc = property.yearly_discount_percent !== undefined ? Number(property.yearly_discount_percent) : 25;
    const yearlyRate = Number(property.price_per_year) || Math.round(propertyPrice * 365 * (1 - yearlyDisc / 100));
    const fullYears = Math.floor(nights / 365);
    const remDays = nights % 365;
    totalRoomPrice = (fullYears * yearlyRate) + Math.round(remDays * (yearlyRate / 365));
    discountAmount = Math.max(0, rawRoomPrice - totalRoomPrice);
    discountLabel = `Diskon Sewa Tahunan (${yearlyDisc}%)`;
  } else if (nights >= 30) {
    rentalType = 'monthly';
    const monthlyDisc = property.monthly_discount_percent !== undefined ? Number(property.monthly_discount_percent) : 15;
    const monthlyRate = Number(property.price_per_month) || Math.round(propertyPrice * 30 * (1 - monthlyDisc / 100));
    const fullMonths = Math.floor(nights / 30);
    const remDays = nights % 30;
    totalRoomPrice = (fullMonths * monthlyRate) + Math.round(remDays * (monthlyRate / 30));
    discountAmount = Math.max(0, rawRoomPrice - totalRoomPrice);
    discountLabel = `Diskon Sewa Bulanan (${monthlyDisc}%)`;
  }

  const cleaningFee = Number(property.cleaning_fee) || 0;
  const deposit = Number(property.security_deposit) || 0;
  const grandTotal = totalRoomPrice + cleaningFee + deposit;

  const images = property.images && property.images.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'];

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      toast('Silakan masuk atau daftar akun terlebih dahulu untuk memesan unit ini.', {
        icon: '🔐',
        duration: 4000
      });
      openAuthModal('login');
      return;
    }

    if (!checkInDate || !checkOutDate) {
      toast.error('Pilih tanggal check-in dan check-out terlebih dahulu');
      return;
    }
    if (nights <= 0) {
      toast.error('Tanggal check-out harus lebih besar dari tanggal check-in');
      return;
    }

    navigate('/checkout', {
      state: {
        property,
        checkInDate,
        checkOutDate,
        nights,
        guestsCount,
        rentalType,
        rawRoomPrice,
        discountAmount,
        discountLabel,
        totalRoomPrice,
        cleaningFee,
        deposit,
        grandTotal
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-8 sm:pb-12">
        
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500 mb-3 min-w-0 flex-nowrap overflow-hidden">
          <span 
            className="hover:text-orange-600 transition-colors cursor-pointer shrink-0 whitespace-nowrap font-medium text-gray-600" 
            onClick={() => navigate('/')}
          >
            Beranda
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          {property.city && (
            <>
              <span 
                className="hover:text-orange-600 transition-colors cursor-pointer shrink-0 whitespace-nowrap font-medium text-gray-600"
                onClick={() => navigate(`/search?city=${encodeURIComponent(property.city)}`)}
              >
                {property.city}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            </>
          )}
          <span className="text-gray-900 font-semibold truncate min-w-0" title={property.name}>
            {property.name}
          </span>
        </nav>

        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-gray-900 text-white uppercase tracking-wider">
                {property.type}
              </span>
              {hasDiscount && (
                <span className="flex items-center gap-1 text-xs font-bold text-white bg-red-600 px-2.5 py-0.5 rounded-md shadow-sm">
                  <Tag className="w-3 h-3" /> Hemat {discountPercent}%
                </span>
              )}
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                <Sparkles className="w-3 h-3" /> Konfirmasi Instan & Terverifikasi
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {property.name}
            </h1>
            <p className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 mt-1">
              <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
              <span>{property.address}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Tautan apartemen berhasil disalin!');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Bagikan</span>
            </button>
          </div>
        </div>

        {/* Photo Gallery Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-10">
          {/* Main Large Photo */}
          <div 
            onClick={() => setIsLightboxOpen(true)}
            className="lg:col-span-3 aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:h-[460px] rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-200 relative group cursor-pointer"
          >
            <ImageWithFallback
              src={images[selectedImage]}
              alt={property.name}
              className="w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.02]"
              showText={true}
              fallbackText="Foto Properti"
            />

            {/* Quick arrows on main photo */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage((prev) => (prev > 0 ? prev - 1 : images.length - 1));
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md flex items-center justify-center transition-all z-10"
                  title="Foto Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage((prev) => (prev < images.length - 1 ? prev + 1 : 0));
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md flex items-center justify-center transition-all z-10"
                  title="Foto Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Overlay button to open full lightbox */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
              className="absolute bottom-4 right-4 flex items-center gap-2 px-3.5 py-2 bg-white/95 hover:bg-white text-gray-900 font-bold text-xs rounded-xl shadow-md backdrop-blur-xs border border-gray-200/80 transition-all active:scale-95 z-10"
            >
              <ImageIcon className="w-4 h-4 text-orange-500" />
              <span>Lihat Semua ({images.length} Foto)</span>
            </button>
          </div>

          {/* Compact Thumbnails Strip (Mini Thumbnails on Mobile, Sidebar on Desktop) */}
          <div className="flex lg:flex-col gap-2 sm:gap-2.5 overflow-x-auto lg:overflow-y-auto lg:max-h-[460px] py-1 pb-1 lg:py-0 lg:pr-1 no-scrollbar">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImage(idx)}
                className={`relative w-20 h-14 sm:w-24 sm:h-16 lg:w-full lg:h-[105px] rounded-xl overflow-hidden shrink-0 border-2 cursor-pointer transition-all ${
                  selectedImage === idx 
                    ? 'border-orange-500 shadow-md ring-2 ring-orange-500/20 scale-[1.02] opacity-100' 
                    : 'border-transparent opacity-65 hover:opacity-100 hover:border-gray-200'
                }`}
                title={`Lihat Foto ${idx + 1}`}
              >
                <ImageWithFallback src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                {selectedImage === idx && (
                  <div className="absolute inset-0 bg-orange-500/10 pointer-events-none" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Fullscreen Photo Lightbox Modal */}
        {isLightboxOpen && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between text-white max-w-5xl mx-auto w-full z-10">
              <span className="text-sm font-semibold tracking-wide bg-white/10 px-3 py-1.5 rounded-lg">
                {selectedImage + 1} / {images.length} Foto
              </span>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup Galeri"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Middle Main Preview */}
            <div 
              className="flex-1 flex items-center justify-center relative max-w-5xl mx-auto w-full my-4"
              onClick={(e) => e.stopPropagation()}
            >
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedImage((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  className="absolute left-2 sm:-left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/30 hover:bg-white text-gray-900 flex items-center justify-center transition-all cursor-pointer shadow-lg z-20"
                  title="Foto Sebelumnya"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <div className="max-h-[75vh] max-w-full flex items-center justify-center">
                <ImageWithFallback
                  src={images[selectedImage]}
                  alt={`Photo ${selectedImage + 1}`}
                  className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl transition-all"
                  containerClassName="max-h-[75vh] max-w-full flex items-center justify-center"
                  showText={true}
                  fallbackText="Foto tidak dapat dimuat"
                />
              </div>

              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedImage((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  className="absolute right-2 sm:-right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/30 hover:bg-white text-gray-900 flex items-center justify-center transition-all cursor-pointer shadow-lg z-20"
                  title="Foto Selanjutnya"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Bottom Thumbnails */}
            <div 
              className="flex items-center justify-center gap-2 overflow-x-auto max-w-5xl mx-auto w-full py-2"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-14 h-10 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                    selectedImage === idx ? 'border-orange-500 scale-105 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <ImageWithFallback src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column: Details, Specifications, Amenities */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Specs Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-white rounded-2xl border border-gray-200/80 flex items-center gap-3">
                <Users className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="text-[11px] text-gray-400 font-medium">Kapasitas</div>
                  <div className="text-xs font-bold text-gray-800">Maks {property.max_guests} Tamu</div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-gray-200/80 flex items-center gap-3">
                <Bed className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="text-[11px] text-gray-400 font-medium">Kamar Tidur</div>
                  <div className="text-xs font-bold text-gray-800">{property.bedrooms} Kamar ({property.beds} Bed)</div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-gray-200/80 flex items-center gap-3">
                <Bath className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="text-[11px] text-gray-400 font-medium">Kamar Mandi</div>
                  <div className="text-xs font-bold text-gray-800">{property.bathrooms} Kamar Mandi</div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-gray-200/80 flex items-center gap-3">
                <Maximize2 className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="text-[11px] text-gray-400 font-medium">Luas Unit</div>
                  <div className="text-xs font-bold text-gray-800">{property.size_sqm || 35} m²</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 space-y-3">
              <h2 className="text-lg font-bold text-gray-900">Tentang Properti Ini</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Fasilitas Lengkap Unit</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(property.amenities || []).map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-gray-700 font-medium">
                    <div className="p-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* House Rules */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 space-y-3">
              <h2 className="text-lg font-bold text-gray-900">Peraturan & Kebijakan Menginap</h2>
              <div className="text-sm text-gray-600 bg-amber-50/60 p-4 rounded-xl border border-amber-200/60 leading-relaxed">
                {property.house_rules || 'Check-in: Mulai pukul 14.00 WIB. Check-out: Maksimal pukul 12.00 WIB. Dilarang merokok dan menjaga ketenangan.'}
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Booking & Calculation Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white rounded-3xl p-6 border border-gray-200 shadow-xl shadow-gray-200/50 space-y-6">
              
              {/* Price Banner */}
              <div className="border-b border-gray-100 pb-4">
                {hasDiscount && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-400 line-through font-medium">
                      {formatRupiah(property.original_price)}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                      {discountPercent}% OFF
                    </span>
                  </div>
                )}
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-red-600">
                      {formatRupiah(property.price_per_night)}
                    </span>
                    <span className="text-xs text-gray-500 font-medium ml-1">/ malam</span>
                  </div>
                  {hasDiscount ? (
                    <div className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200 flex items-center gap-1">
                      Hemat {discountPercent}%
                    </div>
                  ) : (
                    <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Ready
                    </div>
                  )}
                </div>
              </div>

              {/* Dates Input */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Check-In
                    </label>
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
                    />
                  </div>
                  <div className="border-l border-gray-200 pl-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Check-Out
                    </label>
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Guests Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Jumlah Tamu
                  </label>
                  <select
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    {Array.from({ length: property.max_guests || 2 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} Tamu
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Breakdown Calculation */}
              <div className="space-y-2.5 pt-2 border-t border-gray-100 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>{formatRupiah(property.price_per_night)} × {nights} Malam</span>
                  <span className={`font-semibold ${discountAmount > 0 ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {formatRupiah(rawRoomPrice)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100">
                    <span>{discountLabel}</span>
                    <span>- {formatRupiah(discountAmount)}</span>
                  </div>
                )}

                {discountAmount > 0 && (
                  <div className="flex justify-between text-gray-700 font-semibold">
                    <span>Tarif Bersih Kamar</span>
                    <span className="text-orange-600 font-bold">{formatRupiah(totalRoomPrice)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Biaya Kebersihan (Cleaning Fee)</span>
                  <span className="font-semibold text-gray-800">{formatRupiah(cleaningFee)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1">
                    Deposit Jaminan
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded">Refundable</span>
                  </span>
                  <span className="font-semibold text-gray-800">{formatRupiah(deposit)}</span>
                </div>

                <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-gray-900 block">Total Pembayaran</span>
                    <span className="text-[10px] text-gray-400">Termasuk pajak & deposit</span>
                  </div>
                  <span className="text-xl font-extrabold text-orange-600">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Booking CTA Button */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-sm transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Pesan Sekarang (Booking)</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Jaminan Reservasi 100% Aman & Terpercaya</span>
              </div>

            </div>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
