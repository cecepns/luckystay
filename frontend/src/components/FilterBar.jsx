import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Users, 
  Filter, 
  X, 
  Building2, 
  Hotel, 
  Home, 
  Bed, 
  Armchair, 
  ChevronDown, 
  Sparkles,
  RotateCcw,
  AlertCircle,
  SlidersHorizontal,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import DatePickerInput from './DatePickerInput';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';

export default function FilterBar({ filters, onFilterChange, onSearch }) {
  const [duration, setDuration] = useState('Harian');
  const [furnishing, setFurnishing] = useState('All');
  const [promoOnly, setPromoOnly] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [errors, setErrors] = useState({});

  // Dynamic Cities & Unit Types from Database
  const [citiesList, setCitiesList] = useState([]);
  const [typesList, setTypesList] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadDynamicFilters = async () => {
      try {
        const [citiesRes, typesRes] = await Promise.all([
          request.get(API_ENDPOINTS.CITIES.ALL),
          request.get(API_ENDPOINTS.PROPERTY_TYPES.ALL)
        ]);
        if (isMounted) {
          if (citiesRes.success && citiesRes.data) setCitiesList(citiesRes.data);
          if (typesRes.success && typesRes.data) setTypesList(typesRes.data);
        }
      } catch (err) {
        console.error('Failed to load dynamic filter options', err);
      }
    };
    loadDynamicFilters();
    return () => { isMounted = false; };
  }, []);

  const handleFieldChange = (field, val) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    onFilterChange(field, val);
  };

  const handleSearchSubmit = () => {
    const newErrors = {};

    if (!filters.city || filters.city.trim() === '') {
      newErrors.city = 'Kota tujuan belum dipilih';
    }

    if (!filters.check_in || filters.check_in.trim() === '') {
      newErrors.check_in = 'Tanggal Check-In belum dipilih';
    }

    if (!filters.check_out || filters.check_out.trim() === '') {
      newErrors.check_out = 'Tanggal Check-Out belum dipilih';
    } else if (filters.check_in && filters.check_out <= filters.check_in) {
      newErrors.check_out = 'Check-Out harus setelah Check-In';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstField = Object.keys(newErrors)[0];
      toast.error(newErrors[firstField]);
      return;
    }

    setErrors({});
    if (onSearch) {
      onSearch();
    }
  };

  const getMinCheckOutDate = () => {
    if (!filters.check_in) return new Date();
    const parts = filters.check_in.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + 1);
      return d;
    }
    return new Date();
  };

  const categories = [
    { key: '', label: 'Semua Hunian', icon: Sparkles },
    { key: 'Apartemen', label: 'Apartemen', icon: Building2 },
    { key: 'Villa', label: 'Villa Eksklusif', icon: Home },
    { key: 'Hotel', label: 'Hotel & Resort', icon: Hotel },
  ];

  const unitTypeOptions = [
    { label: 'Semua Tipe', value: '' },
    ...(typesList.length > 0
      ? typesList.map((t) => ({ label: t.name, value: t.name }))
      : [
          { label: 'Studio', value: 'Studio' },
          { label: '1BR', value: '1BR' },
          { label: '2BR', value: '2BR' },
          { label: '3BR+', value: 'Penthouse' },
        ])
  ];

  const furnishingOptions = ['All', 'Full Furnished', 'Unfurnished'];

  const hasActiveFilter = Boolean(
    filters.city || 
    filters.category || 
    filters.type || 
    filters.guests || 
    filters.check_in || 
    filters.check_out || 
    filters.search || 
    furnishing !== 'All' || 
    promoOnly
  );

  const handleReset = () => {
    setErrors({});
    onFilterChange('city', '');
    onFilterChange('category', '');
    onFilterChange('type', '');
    onFilterChange('guests', '');
    onFilterChange('check_in', '');
    onFilterChange('check_out', '');
    onFilterChange('search', '');
    setFurnishing('All');
    setPromoOnly(false);
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl shadow-gray-200/50 border border-gray-150 relative">
      
      {/* 1. Modern Horizontal Category Chips (Distinct from Travelio) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-4 border-b border-gray-100">
        {categories.map((cat) => {
          const isSelected = filters.category === cat.key;
          const IconComp = cat.icon;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onFilterChange('category', cat.key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/70'
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-orange-500'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        
        {/* 2. Destination / Kota Input Card */}
        <div className={`p-3 rounded-2xl border transition-all ${
          errors.city 
            ? 'bg-rose-50/30 border-rose-400' 
            : 'bg-gray-50/80 hover:bg-gray-100/70 border-gray-200/80 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20'
        }`}>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Destinasi / Kota Tujuan
          </label>
          <div className="relative flex items-center">
            <MapPin className={`w-4 h-4 mr-2.5 shrink-0 ${errors.city ? 'text-rose-500' : 'text-orange-500'}`} />
            <select
              value={filters.city || ''}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-bold text-gray-900 focus:outline-none cursor-pointer appearance-none pr-6"
            >
              <option value="">Pilih Kota Tujuan (Semua Area)</option>
              {citiesList.length > 0 ? (
                citiesList.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} {c.province ? `(${c.province})` : ''}
                  </option>
                ))
              ) : (
                <>
                  <option value="Jakarta Selatan">Jakarta Selatan</option>
                  <option value="Jakarta Pusat">Jakarta Pusat</option>
                  <option value="Tangerang">Tangerang / BSD</option>
                  <option value="Bandung">Bandung</option>
                  <option value="Bali">Bali</option>
                  <option value="Surabaya">Surabaya</option>
                </>
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-0 pointer-events-none" />
          </div>
          {errors.city && (
            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{errors.city}</span>
            </p>
          )}
        </div>

        {/* 3. Dates of Stay (Check-In & Check-Out Grid) */}
        <div className="grid grid-cols-2 gap-2.5">
          <DatePickerInput
            label="Check-In"
            value={filters.check_in}
            onChange={(val) => handleFieldChange('check_in', val)}
            placeholder="Pilih Tanggal"
            minDate={new Date()}
            hasError={!!errors.check_in}
            errorMessage={errors.check_in}
          />
          <DatePickerInput
            label="Check-Out"
            value={filters.check_out}
            onChange={(val) => handleFieldChange('check_out', val)}
            placeholder="Pilih Tanggal"
            minDate={getMinCheckOutDate()}
            hasError={!!errors.check_out}
            errorMessage={errors.check_out}
          />
        </div>

        {/* 4. Guests & Unit Type Row (Clean 2-Column Row) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Guest Count */}
          <div className="bg-gray-50/80 hover:bg-gray-100/70 transition-colors p-2.5 sm:p-3 rounded-2xl border border-gray-200/80 focus-within:bg-white focus-within:border-orange-500">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Jumlah Tamu
            </label>
            <div className="relative flex items-center">
              <Users className="w-4 h-4 text-orange-500 mr-2 shrink-0" />
              <select
                value={filters.guests || ''}
                onChange={(e) => onFilterChange('guests', e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-gray-900 focus:outline-none cursor-pointer appearance-none pr-5"
              >
                <option value="">Semua Tamu</option>
                <option value="1">1 Tamu</option>
                <option value="2">2 Tamu</option>
                <option value="3">3 Tamu</option>
                <option value="4">4+ Tamu</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-0 pointer-events-none" />
            </div>
          </div>

          {/* Unit Type */}
          <div className="bg-gray-50/80 hover:bg-gray-100/70 transition-colors p-2.5 sm:p-3 rounded-2xl border border-gray-200/80 focus-within:bg-white focus-within:border-orange-500">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Tipe Kamar
            </label>
            <div className="relative flex items-center">
              <Bed className="w-4 h-4 text-orange-500 mr-2 shrink-0" />
              <select
                value={filters.type || ''}
                onChange={(e) => onFilterChange('type', e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-gray-900 focus:outline-none cursor-pointer appearance-none pr-5"
              >
                {unitTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-0 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 5. Collapsible Filter Tambahan & Promo Checkbox */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-orange-600 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-orange-500" />
            <span>{showMoreFilters ? 'Tutup Filter Tambahan' : 'Filter Lengkap'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoreFilters ? 'rotate-180 text-orange-500' : 'text-gray-400'}`} />
          </button>

          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={promoOnly}
              onChange={(e) => setPromoOnly(e.target.checked)}
              className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 border-gray-300 accent-orange-500 cursor-pointer"
            />
            <span className="text-[11px] sm:text-xs font-medium text-gray-600">Promo Diskon Saja</span>
          </label>
        </div>

        {/* Collapsible Panel for Duration & Furnishing */}
        {showMoreFilters && (
          <div className="p-3.5 bg-gray-50/90 rounded-2xl border border-gray-200/80 space-y-3">
            {/* Durasi Menginap */}
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Pilihan Durasi Sewa
              </span>
              <div className="grid grid-cols-3 gap-2">
                {['Harian', 'Bulanan', 'Tahunan'].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setDuration(dur)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all text-center cursor-pointer ${
                      duration === dur
                        ? 'bg-orange-500 text-white font-bold shadow-xs'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {dur}
                  </button>
                ))}
              </div>
            </div>

            {/* Furnishing */}
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Kondisi Perabotan
              </span>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {furnishingOptions.map((fOpt) => {
                  const isSelected = furnishing === fOpt;
                  return (
                    <button
                      key={fOpt}
                      type="button"
                      onClick={() => setFurnishing(fOpt)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {fOpt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 6. Solid Orange Search Button */}
        <button
          type="button"
          onClick={handleSearchSubmit}
          className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
        >
          <Search className="w-4 h-4" />
          <span>Cari Akomodasi</span>
        </button>

        {/* Reset Active Filter */}
        {hasActiveFilter && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Semua Filter</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

