import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Pagination from '../components/Pagination';
import DatePickerInput from '../components/DatePickerInput';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { formatRupiah } from '../utils/formatters';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Building2, 
  Bed, 
  Bath, 
  Maximize2, 
  Heart, 
  Droplets, 
  Users, 
  Briefcase, 
  ChevronDown, 
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  X,
  Percent
} from 'lucide-react';
import toast from 'react-hot-toast';
import ImageWithFallback from '../components/ImageWithFallback';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL Query state
  const initialCity = searchParams.get('city') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialType = searchParams.get('type') || '';
  const initialSearch = searchParams.get('search') || '';
  const initialCheckIn = searchParams.get('check_in') || '';
  const initialCheckOut = searchParams.get('check_out') || '';
  const initialGuests = searchParams.get('guests') || '';
  const initialSort = searchParams.get('sort') || 'price_asc';
  const initialMinPrice = searchParams.get('min_price') || '';
  const initialMaxPrice = searchParams.get('max_price') || '';

  // Search Filter Bar States
  const [durationTab, setDurationTab] = useState('Harian');
  const [cityInput, setCityInput] = useState(initialCity || initialSearch);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [propertyCategory, setPropertyCategory] = useState(initialCategory);
  const [unitType, setUnitType] = useState(initialType);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [furnishType, setFurnishType] = useState('All');
  const [promoOnly, setPromoOnly] = useState(false);

  // Sorting & Sidebar Filter States
  const [sortBy, setSortBy] = useState(initialSort);
  const [unitPreferences, setUnitPreferences] = useState({
    instantConfirmation: false,
    fullFurnished: false,
    waterHeater: false,
    freeWifi: false,
  });

  // Data & Loading States
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // Fetch properties from backend
  const fetchProperties = async (page = 1, currentLimit = pagination.limit) => {
    setLoading(true);
    try {
      let sortCol = 'price_per_night';
      let sortDir = 'ASC';

      if (sortBy === 'price_desc') {
        sortCol = 'price_per_night';
        sortDir = 'DESC';
      } else if (sortBy === 'newest') {
        sortCol = 'created_at';
        sortDir = 'DESC';
      } else if (sortBy === 'rating' || sortBy === 'popular') {
        sortCol = 'id';
        sortDir = 'DESC';
      }

      const params = {
        page,
        limit: currentLimit,
        search: cityInput,
        city: searchParams.get('city') || '',
        type: unitType,
        category: propertyCategory,
        min_price: minPrice,
        max_price: maxPrice,
        sort_by: sortCol,
        sort_order: sortDir,
      };

      const res = await request.get(API_ENDPOINTS.PROPERTIES.LIST, params);
      if (res.success) {
        let list = res.data || [];
        // Apply client-side filters for preferences if toggled
        if (furnishType === 'Full Furnished' || unitPreferences.fullFurnished) {
          list = list.filter(p => !p.name?.toLowerCase().includes('unfurnished'));
        }
        if (unitPreferences.waterHeater) {
          list = list.filter(p => 
            Array.isArray(p.amenities) && 
            p.amenities.some(a => a.toLowerCase().includes('water heater') || a.toLowerCase().includes('air panas'))
          );
        }
        if (unitPreferences.freeWifi) {
          list = list.filter(p => 
            Array.isArray(p.amenities) && 
            p.amenities.some(a => a.toLowerCase().includes('wifi') || a.toLowerCase().includes('internet'))
          );
        }

        setProperties(list);
        setPagination(res.pagination || { page, limit: currentLimit, total: res.data.length, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data pencarian');
    } finally {
      setLoading(false);
    }
  };

  // Sync state when URL searchParams change
  useEffect(() => {
    const qCity = searchParams.get('city') || searchParams.get('search') || '';
    const qCategory = searchParams.get('category') || '';
    const qType = searchParams.get('type') || '';
    const qCheckIn = searchParams.get('check_in') || '';
    const qCheckOut = searchParams.get('check_out') || '';
    const qSort = searchParams.get('sort') || 'price_asc';
    const qMinPrice = searchParams.get('min_price') || '';
    const qMaxPrice = searchParams.get('max_price') || '';

    setCityInput(qCity);
    setPropertyCategory(qCategory);
    setUnitType(qType);
    setCheckIn(qCheckIn);
    setCheckOut(qCheckOut);
    setSortBy(qSort);
    setMinPrice(qMinPrice);
    setMaxPrice(qMaxPrice);
  }, [searchParams]);

  useEffect(() => {
    fetchProperties(1, pagination.limit);
  }, [sortBy, unitType, propertyCategory, furnishType, unitPreferences, searchParams, minPrice, maxPrice]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    // Sync with URL params
    const newParams = new URLSearchParams();
    if (cityInput) newParams.set('city', cityInput);
    if (propertyCategory) newParams.set('category', propertyCategory);
    if (unitType) newParams.set('type', unitType);
    if (checkIn) newParams.set('check_in', checkIn);
    if (checkOut) newParams.set('check_out', checkOut);
    if (sortBy) newParams.set('sort', sortBy);
    if (minPrice) newParams.set('min_price', minPrice);
    if (maxPrice) newParams.set('max_price', maxPrice);
    setSearchParams(newParams);

    fetchProperties(1, pagination.limit);
  };

  const toggleWishlist = (id, e) => {
    e.stopPropagation();
    setWishlist(prev => {
      const nextState = !prev[id];
      if (nextState) toast.success('Disimpan ke daftar favorit!');
      return { ...prev, [id]: nextState };
    });
  };

  const handleResetFilters = () => {
    setCityInput('');
    setPropertyCategory('');
    setUnitType('');
    setMinPrice('');
    setMaxPrice('');
    setFurnishType('All');
    setPromoOnly(false);
    setSortBy('price_asc');
    setUnitPreferences({
      instantConfirmation: false,
      fullFurnished: false,
      waterHeater: false,
      freeWifi: false,
    });
    setSearchParams(new URLSearchParams());
    setTimeout(() => {
      fetchProperties(1, pagination.limit);
    }, 50);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Top Search Bar (Travelio Style) */}
      <section className="bg-white border-b border-gray-200 shadow-xs py-4 px-4 sm:px-6 lg:px-8 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto space-y-3">
          
          {/* Row 1: Duration Tabs + Location + Datepicker */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            
            {/* Duration Tabs */}
            <div className="inline-flex p-1 bg-gray-100 rounded-xl shrink-0 self-start lg:self-auto">
              {['Harian', 'Bulanan', 'Tahunan'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setDurationTab(tab)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    durationTab === tab
                      ? 'bg-red-500 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Location Input */}
            <div className="relative flex-1">
              <MapPin className="w-4 h-4 text-red-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                placeholder="Mau menginap di mana? (Contoh: Tangerang, Jakarta Selatan, dsb)"
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            {/* Date Range Inputs */}
            <div className="grid grid-cols-2 gap-2 lg:w-96 shrink-0">
              <div>
                <DatePickerInput
                  value={checkIn}
                  onChange={(d) => setCheckIn(d)}
                  placeholder="Tgl Check-in"
                />
              </div>
              <div>
                <DatePickerInput
                  value={checkOut}
                  onChange={(d) => setCheckOut(d)}
                  minDate={checkIn ? new Date(checkIn) : new Date()}
                  placeholder="Tgl Check-out"
                />
              </div>
            </div>

          </div>

          {/* Row 2: Property Type + Room Type + Furnish Type + Promo Checkbox + Search CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            
            {/* Dropdowns Group */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              
              {/* Tipe Properti */}
              <div className="relative min-w-[140px]">
                <select
                  value={propertyCategory}
                  onChange={(e) => setPropertyCategory(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="">Tipe Properti (Semua)</option>
                  <option value="Apartemen">Apartemen</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Villa">Villa</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Tipe Kamar */}
              <div className="relative min-w-[140px]">
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="">Tipe Kamar (Semua)</option>
                  <option value="Studio">Studio</option>
                  <option value="1BR">1BR (1 Kamar)</option>
                  <option value="2BR">2BR (2 Kamar)</option>
                  <option value="Penthouse">3BR+ (Penthouse)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Tipe Furnish */}
              <div className="relative min-w-[140px]">
                <select
                  value={furnishType}
                  onChange={(e) => setFurnishType(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="All">Tipe Furnish (Semua)</option>
                  <option value="Full Furnished">Full Furnished</option>
                  <option value="Unfurnished">Unfurnished</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Promo Checkbox */}
              <label className="inline-flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={promoOnly}
                  onChange={(e) => setPromoOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 border-gray-300 accent-orange-500"
                />
                <span>Tampilkan Unit Promosi</span>
              </label>

            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3.5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                title="Reset Semua Filter"
              >
                <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                Reset
              </button>

              <button
                type="button"
                onClick={handleSearchSubmit}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Cari Sekarang</span>
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* Main Results Layout: 2 Columns */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Properties Listings (8 of 12 cols) */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Results Header Info */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-gray-900">
                  {cityInput ? `Hasil Pencarian di "${cityInput}"` : 'Semua Unit Properti Siap Huni'}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ditemukan {pagination.total || properties.length} unit akomodasi terbaik
                </p>
              </div>

              {/* Mobile Quick Sort Selector */}
              <div className="lg:hidden">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs font-semibold bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700"
                >
                  <option value="price_asc">Harga Terendah</option>
                  <option value="price_desc">Harga Tertinggi</option>
                  <option value="newest">Newly Added</option>
                  <option value="popular">Paling Populer</option>
                </select>
              </div>
            </div>

            {/* Active Filters Badges (Budget & Category) */}
            {(minPrice || maxPrice || propertyCategory) && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {(minPrice || maxPrice) && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-xs font-bold text-orange-700 shadow-xs">
                    <span>
                      💰 Budget: {minPrice && Number(minPrice) > 0 ? `Rp ${Number(minPrice).toLocaleString('id-ID')}` : 'Rp 0'} {maxPrice ? `– Rp ${Number(maxPrice).toLocaleString('id-ID')}` : '+'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMinPrice('');
                        setMaxPrice('');
                        const nextParams = new URLSearchParams(searchParams);
                        nextParams.delete('min_price');
                        nextParams.delete('max_price');
                        setSearchParams(nextParams);
                      }}
                      className="hover:text-red-600 font-extrabold text-sm ml-1 cursor-pointer"
                      title="Hapus Filter Budget"
                    >
                      ×
                    </button>
                  </div>
                )}
                {propertyCategory && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 shadow-xs">
                    <span>🏢 {propertyCategory}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPropertyCategory('');
                        const nextParams = new URLSearchParams(searchParams);
                        nextParams.delete('category');
                        setSearchParams(nextParams);
                      }}
                      className="hover:text-red-600 font-extrabold text-sm ml-1 cursor-pointer"
                      title="Hapus Filter Kategori"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Properties List */}
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-gray-200 animate-pulse flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-72 h-48 bg-gray-200 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-3 py-2">
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-6 bg-gray-200 rounded w-1/4 mt-6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-xs">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900">Tidak ada unit properti yang sesuai</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Coba ubah kata kunci pencarian, hilangkan beberapa filter, atau atur tanggal menginap yang lain.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Reset Semua Filter
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {properties.map((prop) => {
                  const defaultImg =
                    prop.images?.[0] ||
                    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';
                  
                  const isFav = wishlist[prop.id];

                  // Discount calculation
                  const price = Number(prop.price_per_night);
                  let originalPrice = prop.original_price ? Number(prop.original_price) : null;
                  let discountPercent = prop.discount_percent ? Number(prop.discount_percent) : 0;
                  if (originalPrice && originalPrice > price && !discountPercent) {
                    discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
                  } else if (discountPercent > 0 && !originalPrice) {
                    originalPrice = Math.round(price / (1 - discountPercent / 100));
                  }
                  const hasDiscount = discountPercent > 0 && originalPrice && originalPrice > price;

                  return (
                    <div
                      key={prop.id}
                      onClick={() => navigate(`/apartment/${prop.id}`)}
                      className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col md:flex-row group cursor-pointer"
                    >
                      {/* Left: Image Container (Travelio style) */}
                      <div className="relative w-full md:w-72 h-52 md:h-auto shrink-0 overflow-hidden bg-gray-100">
                        <ImageWithFallback
                          src={defaultImg}
                          alt={prop.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        
                        {/* Top Left Tag */}
                        <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                          {prop.building_name || 'Lucky Stay'}
                        </div>

                        {/* Top Right Wishlist Button */}
                        <button
                          type="button"
                          onClick={(e) => toggleWishlist(prop.id, e)}
                          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xs transition-all ${
                            isFav ? 'bg-red-500 text-white' : 'bg-white/80 hover:bg-white text-gray-700'
                          }`}
                          title="Simpan ke Favorit"
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                        </button>

                        {/* Bottom Tags (Discount + Availability) */}
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                          {hasDiscount && (
                            <span className="bg-[#d93a3a] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1">
                              <Percent className="w-3 h-3 stroke-[2.5]" />
                              Hemat {discountPercent}%
                            </span>
                          )}
                          <div className="bg-white/95 text-gray-800 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs border border-gray-200/50">
                            1 unit tersedia
                          </div>
                        </div>
                      </div>

                      {/* Right: Property Details */}
                      <div className="flex-1 p-5 flex flex-col justify-between">
                        
                        <div>
                          {/* Title */}
                          <h3 className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-orange-600 transition-colors line-clamp-1 mb-1.5">
                            {prop.name} By Lucky Stay
                          </h3>

                          {/* Specs Bar (Apartment, Studio, 1 Bath, 31 sqm, 5.0, Full Furnished) */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-2">
                            <span className="flex items-center gap-1 font-semibold text-gray-800">
                              <Building2 className="w-3.5 h-3.5 text-red-500" />
                              {prop.category || 'Apartment'}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center gap-1 font-semibold">
                              <Bed className="w-3.5 h-3.5 text-red-500" />
                              {prop.type || 'Studio'}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center gap-1 font-semibold">
                              <Bath className="w-3.5 h-3.5 text-red-500" />
                              {prop.bathrooms || 1}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center gap-1 font-semibold">
                              <Maximize2 className="w-3.5 h-3.5 text-red-500" />
                              {prop.size_sqm || 35} sqm
                            </span>
                            <span className="text-gray-300">|</span>
                            
                            {/* Rating badge */}
                            <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                              5.0
                            </span>

                            {/* Furnish Tag */}
                            <span className="text-red-600 font-bold text-xs">
                              Full Furnished
                            </span>
                          </div>

                          {/* Location Subtitle */}
                          <p className="text-xs text-gray-500 line-clamp-1 mb-3">
                            {prop.location}, Apartemen {prop.building_name || prop.name}
                          </p>

                          {/* Amenities Badges */}
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-red-100">
                              <Droplets className="w-3.5 h-3.5 text-red-500" />
                              <span>Water Heater</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold border border-amber-100">
                              <Users className="w-3.5 h-3.5 text-amber-500" />
                              <span>{prop.max_guests || 2} Orang</span>
                            </span>
                            {prop.amenities?.slice(0, 2).map((am, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium border border-gray-100">
                                {am}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Bottom Row: Property Management & Price */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 bg-gray-100/80 px-2.5 py-1 rounded-full text-gray-700 text-xs font-semibold">
                            <div className="w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center">
                              <Briefcase className="w-3 h-3" />
                            </div>
                            <span>Lucky Stay Property Management</span>
                          </div>

                          <div className="text-right">
                            {hasDiscount ? (
                              <div>
                                <div className="flex items-center justify-end gap-1.5 mb-0.5">
                                  <span className="text-xs text-gray-400 line-through font-medium">
                                    IDR {formatRupiah(originalPrice).replace('Rp ', '')}
                                  </span>
                                  <span className="text-[11px] font-bold text-emerald-600">
                                    {discountPercent}% OFF
                                  </span>
                                </div>
                                <p className="text-lg sm:text-xl font-black text-red-500 tracking-tight">
                                  IDR {formatRupiah(price).replace('Rp ', '')} <span className="text-xs font-semibold text-gray-400">/ malam</span>
                                </p>
                              </div>
                            ) : (
                              <p className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                                IDR {formatRupiah(price).replace('Rp ', '')} <span className="text-xs font-semibold text-gray-400">/ malam</span>
                              </p>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}

                {/* Pagination */}
                <div className="pt-4">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={(p) => fetchProperties(p, pagination.limit)}
                    perPage={pagination.limit}
                    onPerPageChange={(l) => fetchProperties(1, l)}
                    totalItems={pagination.total}
                  />
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Filter & Sorting Sidebar (4 of 12 cols) */}
          <aside className="hidden lg:block lg:col-span-4 space-y-6">
            
            {/* Box 1: Urutkan Hasil Berdasarkan */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs sticky top-48">
              <h3 className="font-extrabold text-gray-900 text-sm mb-4">
                Urutkan Hasil Berdasarkan
              </h3>

              <div className="space-y-3">
                {[
                  { id: 'price_asc', label: 'Harga Terendah' },
                  { id: 'price_desc', label: 'Harga Tertinggi' },
                  { id: 'rating', label: 'Rating Terbaik' },
                  { id: 'newest', label: 'Newly Added Property' },
                  { id: 'popular', label: 'Paling Populer' },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <span className="text-xs font-semibold text-gray-700">
                      {opt.label}
                    </span>
                    <input
                      type="radio"
                      name="sort_option"
                      value={opt.id}
                      checked={sortBy === opt.id}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-4 h-4 text-orange-500 accent-orange-500 border-gray-300 focus:ring-orange-400 cursor-pointer"
                    />
                  </label>
                ))}
              </div>

              {/* Divider */}
              <hr className="border-gray-100 my-5" />

              {/* Box: Rentang Budget */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-extrabold text-gray-900 text-sm">
                  Rentang Budget
                </h3>
                {(minPrice || maxPrice) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMinPrice('');
                      setMaxPrice('');
                      const nextParams = new URLSearchParams(searchParams);
                      nextParams.delete('min_price');
                      nextParams.delete('max_price');
                      setSearchParams(nextParams);
                    }}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="space-y-1.5 mb-2">
                {[
                  { label: 'Semua Budget', min: '', max: '' },
                  { label: '< Rp 450.000 (Hemat)', min: '0', max: '450000' },
                  { label: 'Rp 450rb – Rp 800rb (Populer)', min: '450000', max: '800000' },
                  { label: '> Rp 800.000 (Mewah)', min: '800000', max: '' },
                ].map((b, idx) => {
                  const isSelected = (minPrice === b.min && maxPrice === b.max) || (!minPrice && !maxPrice && !b.min && !b.max);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setMinPrice(b.min);
                        setMaxPrice(b.max);
                        const nextParams = new URLSearchParams(searchParams);
                        if (b.min) nextParams.set('min_price', b.min); else nextParams.delete('min_price');
                        if (b.max) nextParams.set('max_price', b.max); else nextParams.delete('max_price');
                        setSearchParams(nextParams);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                        isSelected 
                          ? 'bg-orange-500 text-white font-bold shadow-xs' 
                          : 'text-gray-700 hover:bg-gray-50 border border-gray-100'
                      }`}
                    >
                      <span>{b.label}</span>
                      {isSelected && <span>✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <hr className="border-gray-100 my-5" />

              {/* Box 2: Pilihan Unit */}
              <h3 className="font-extrabold text-gray-900 text-sm mb-4">
                Pilihan Unit
              </h3>

              <div className="space-y-3">
                {[
                  { key: 'instantConfirmation', label: 'Instant Confirmation' },
                  { key: 'fullFurnished', label: 'Full Furnished Only' },
                  { key: 'waterHeater', label: 'Water Heater Ready' },
                  { key: 'freeWifi', label: 'High Speed WiFi' },
                ].map((pref) => (
                  <label
                    key={pref.key}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <span className="text-xs font-semibold text-gray-700">
                      {pref.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={unitPreferences[pref.key]}
                      onChange={(e) =>
                        setUnitPreferences((prev) => ({
                          ...prev,
                          [pref.key]: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded text-orange-500 accent-orange-500 border-gray-300 focus:ring-orange-400 cursor-pointer"
                    />
                  </label>
                ))}
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Reset Semua Pilihan
                </button>
              </div>

            </div>

          </aside>

        </div>
      </main>

      <Footer />
    </div>
  );
}
