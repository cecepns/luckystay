import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  RefreshCw, 
  Search, 
  User, 
  Phone, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Home, 
  Eye, 
  Edit3,
  CalendarCheck,
  Building,
  Info,
  ExternalLink,
  FileText
} from 'lucide-react';
import { request } from '../utils/request';
import { API_ENDPOINTS, getUploadUrl } from '../utils/endpoints';
import { 
  formatRupiah, 
  formatDateIndo, 
  formatLocalDateString, 
  getNextLocalDateString,
  getImageUrl
} from '../utils/formatters';
import ImageWithFallback from './ImageWithFallback';
import toast from 'react-hot-toast';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function MonthlyGanttTimeline({ 
  onOpenCreateBooking, 
  onViewBookingDetail, 
  onEditBooking,
  refreshKey
}) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [timelineData, setTimelineData] = useState({ properties: [], bookings: [] });
  const [loading, setLoading] = useState(true);
  const [searchProperty, setSearchProperty] = useState('');

  // Tooltip Popover State
  const [hoveredBooking, setHoveredBooking] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const fetchTimeline = async (year = currentYear, month = currentMonth) => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.BOOKINGS.TIMELINE, { year, month });
      if (res.success && res.data) {
        setTimelineData({
          properties: res.data.properties || [],
          bookings: res.data.bookings || []
        });
      }
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
      toast.error('Gagal memuat timeline pemesanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline(currentYear, currentMonth);
  }, [currentYear, currentMonth, refreshKey]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  };

  // Generate days array for the month
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateObj = new Date(currentYear, currentMonth - 1, dayNum);
    const dateString = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isToday = 
      today.getFullYear() === currentYear && 
      (today.getMonth() + 1) === currentMonth && 
      today.getDate() === dayNum;

    return {
      dayNum,
      dateString,
      dayName: DAY_NAMES[dayOfWeek],
      isWeekend,
      isToday
    };
  });

  // Filter properties by search term
  const filteredProperties = timelineData.properties.filter(prop => {
    if (!searchProperty.trim()) return true;
    const query = searchProperty.toLowerCase();
    return (
      (prop.name && prop.name.toLowerCase().includes(query)) ||
      (prop.building_name && prop.building_name.toLowerCase().includes(query)) ||
      (prop.unit_number && String(prop.unit_number).toLowerCase().includes(query)) ||
      (prop.city && prop.city.toLowerCase().includes(query)) ||
      (prop.type && prop.type.toLowerCase().includes(query))
    );
  });

  // Check booking covering a given property & date
  const getBookingForDate = (propertyId, dateString) => {
    return timelineData.bookings.find(b => {
      if (b.property_id !== propertyId) return false;
      const checkIn = formatLocalDateString(b.check_in_date);
      const checkOut = formatLocalDateString(b.check_out_date);
      return dateString >= checkIn && dateString < checkOut;
    });
  };

  // Check if date is the start/check-in day of this booking
  const isCheckInDay = (booking, dateString) => {
    if (!booking) return false;
    const checkIn = formatLocalDateString(booking.check_in_date);
    return dateString === checkIn;
  };

  // Check if date is the day before check-out day of this booking
  const isLastStayDay = (booking, dateString) => {
    if (!booking) return false;
    const checkOut = formatLocalDateString(booking.check_out_date);
    const nextDayString = getNextLocalDateString(dateString);
    return nextDayString === checkOut;
  };

  // Determine block color matching table status: Belum Lunas vs Lunas
  const getBlockColorStyles = (booking) => {
    if (!booking) return '';
    const status = booking.payment_status;
    if (status === 'confirmed' || status === 'completed') {
      return {
        bg: 'bg-emerald-500 hover:bg-emerald-600',
        text: 'text-white',
        border: 'border-emerald-600',
        pillBg: 'bg-emerald-100 text-emerald-800',
        statusLabel: 'Lunas'
      };
    }
    // pending_payment, waiting_approval, dp_paid, etc.
    return {
      bg: 'bg-amber-500 hover:bg-amber-600',
      text: 'text-white',
      border: 'border-amber-600',
      pillBg: 'bg-amber-100 text-amber-900',
      statusLabel: 'Belum Lunas'
    };
  };

  // Tooltip hover handlers
  const handleMouseEnterBar = (booking, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredBooking(booking);
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    });
  };

  const handleMouseLeaveBar = () => {
    setHoveredBooking(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      
      {/* 1. Header Toolbar & Controls */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/70 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Month Navigator */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 text-gray-700 transition-colors border-r border-gray-100"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3.5 py-1.5 flex items-center gap-2 font-bold text-gray-900 text-xs sm:text-sm">
              <CalendarIcon className="w-4 h-4 text-orange-500" />
              <span>{MONTH_NAMES[currentMonth - 1]} {currentYear}</span>
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 text-gray-700 transition-colors border-l border-gray-100"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-2 text-xs font-semibold bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl transition-colors shadow-xs"
          >
            Hari Ini
          </button>

          {/* Quick Month & Year Dropdown */}
          <div className="flex items-center gap-1">
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className="px-2.5 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>{name}</option>
              ))}
            </select>
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="px-2.5 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              {[2024, 2025, 2026, 2027, 2028].map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => fetchTimeline(currentYear, currentMonth)}
            className="p-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-xl transition-colors shadow-xs"
            title="Muat Ulang Timeline"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>

        {/* Search Property & Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter unit / kamar..."
              value={searchProperty}
              onChange={(e) => setSearchProperty(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <button
            type="button"
            onClick={() => onOpenCreateBooking && onOpenCreateBooking({})}
            className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-600/20 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Input Sewa Baru</span>
          </button>
        </div>

      </div>


      {/* Mobile Swipe Guidance Banner */}
      <div className="flex md:hidden items-center justify-between px-3.5 py-2 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 text-[11px] text-orange-900 border-b border-orange-200/70 font-semibold shadow-2xs">
        <span className="flex items-center gap-1.5">
          <span className="text-base animate-bounce">👉</span>
          <span>Geser tabel ke samping untuk melihat seluruh tanggal</span>
        </span>
        <span className="text-[10px] text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
          Scroll &rarr;
        </span>
      </div>

      {/* 3. Gantt Chart Timeline View with Loading Skeleton */}
      <div ref={containerRef} className="overflow-x-auto relative min-h-[380px] touch-pan-x overscroll-x-contain pb-2 scrollbar-thin">
        
        {loading ? (
          /* LOADING SKELETON */
          <div className="animate-pulse min-w-[1450px]">
            {/* Header Skeleton */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <div className="w-36 min-w-[144px] sm:w-60 sm:min-w-[240px] p-3 bg-gray-100 border-r border-gray-200 h-14 shrink-0" />
              <div className="flex-1 flex overflow-hidden">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} className="w-10 min-w-[40px] sm:w-12 sm:min-w-[48px] p-2 border-r border-gray-100 flex flex-col items-center justify-center gap-1 shrink-0">
                    <div className="w-5 h-2.5 bg-gray-200 rounded" />
                    <div className="w-6 h-3 bg-gray-300 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Row Skeletons */}
            {Array.from({ length: 5 }).map((_, rIdx) => (
              <div key={rIdx} className="flex border-b border-gray-100 items-center h-16">
                <div className="w-36 min-w-[144px] sm:w-60 sm:min-w-[240px] p-3 border-r border-gray-200 space-y-2 bg-gray-50/50 shrink-0">
                  <div className="w-3/4 h-3.5 bg-gray-200 rounded" />
                  <div className="w-1/2 h-2.5 bg-gray-100 rounded" />
                </div>
                <div className="flex-1 flex overflow-hidden h-full items-center">
                  {Array.from({ length: 30 }).map((_, cIdx) => (
                    <div key={cIdx} className="w-10 min-w-[40px] sm:w-12 sm:min-w-[48px] h-full border-r border-gray-50 flex items-center justify-center p-1 shrink-0">
                      {(rIdx + cIdx) % 7 === 2 && (
                        <div className="w-full h-8 bg-gray-200 rounded-lg" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-20 text-center text-gray-400 space-y-2">
            <Building className="w-10 h-10 mx-auto text-gray-300" />
            <p className="font-semibold text-gray-600 text-sm">Tidak ada unit properti yang ditemukan</p>
            <p className="text-xs text-gray-400">Silakan sesuaikan kata kunci pencarian unit di atas.</p>
          </div>
        ) : (
          /* REAL TIMELINE GRID */
          <table className="min-w-[1450px] w-full border-collapse text-left text-xs table-fixed">
            
            {/* Header Dates */}
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 sticky top-0 z-20">
                
                {/* Sticky Unit Column Header */}
                <th className="py-3 px-2.5 sm:px-4 w-36 min-w-[144px] max-w-[144px] sm:w-60 sm:min-w-[240px] sm:max-w-[240px] sticky left-0 z-30 bg-gray-100 border-r border-gray-200 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)] font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">
                  Unit ({filteredProperties.length})
                </th>

                {/* Days Columns */}
                {daysArray.map((day) => (
                  <th 
                    key={day.dayNum}
                    className={`p-1 sm:p-1.5 text-center w-10 min-w-[40px] max-w-[40px] sm:w-12 sm:min-w-[48px] sm:max-w-[48px] border-r border-gray-100 select-none ${
                      day.isToday 
                        ? 'bg-orange-100 text-orange-950 font-black ring-1 ring-orange-400 inset-0' 
                        : day.isWeekend 
                          ? 'bg-rose-50/50 text-rose-600' 
                          : 'text-gray-700'
                    }`}
                  >
                    <div className="text-[9px] sm:text-[10px] font-semibold uppercase">{day.dayName}</div>
                    <div className={`text-xs font-bold mt-0.5 ${day.isToday ? 'text-orange-600' : ''}`}>
                      {String(day.dayNum).padStart(2, '0')}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Properties Rows */}
            <tbody className="divide-y divide-gray-100">
              {filteredProperties.map((prop) => (
                <tr key={prop.id} className="hover:bg-gray-50/40 transition-colors h-16">
                  
                  {/* Sticky Unit Info Column */}
                  <td className="py-2 px-2 sm:px-3.5 w-36 min-w-[144px] max-w-[144px] sm:w-60 sm:min-w-[240px] sm:max-w-[240px] sticky left-0 z-20 bg-white border-r border-gray-200 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                        <ImageWithFallback
                          src={prop.images?.[0]}
                          alt={prop.name}
                          className="w-full h-full object-cover"
                          icon={Home}
                        />
                      </div>
                      <div className="overflow-hidden min-w-0">
                        <div className="font-bold text-gray-900 truncate text-[11px] sm:text-xs" title={prop.name}>
                          {prop.name}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                          <span className="font-semibold text-orange-600">{prop.type}</span>
                          {prop.unit_number && <span className="hidden sm:inline">• No. {prop.unit_number}</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Day Cells for this Property */}
                  {daysArray.map((day) => {
                    const booking = getBookingForDate(prop.id, day.dateString);
                    const colorStyles = getBlockColorStyles(booking);
                    const isStart = isCheckInDay(booking, day.dateString);
                    const isEnd = isLastStayDay(booking, day.dateString);

                    if (booking) {
                      return (
                        <td 
                          key={day.dayNum}
                          className="p-0 border-r border-gray-100 text-center relative select-none w-10 min-w-[40px] max-w-[40px] sm:w-12 sm:min-w-[48px] sm:max-w-[48px]"
                          onMouseEnter={(e) => handleMouseEnterBar(booking, e)}
                          onMouseLeave={handleMouseLeaveBar}
                          onClick={() => onViewBookingDetail && onViewBookingDetail(booking)}
                        >
                          <div 
                            className={`h-11 mx-0 flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.03] shadow-xs ${colorStyles.bg} ${colorStyles.text} ${
                              isStart ? 'rounded-l-lg ml-0.5 sm:ml-1 border-l-2 ' + colorStyles.border : ''
                            } ${
                              isEnd ? 'rounded-r-lg mr-0.5 sm:mr-1 border-r-2 ' + colorStyles.border : ''
                            }`}
                            title={`${booking.guest_name} (#${booking.invoice_number})`}
                          >
                            {isStart && (
                              <span className="text-[9px] sm:text-[10px] font-bold px-0.5 sm:px-1 truncate max-w-[36px] sm:max-w-[45px] drop-shadow-xs">
                                {booking.guest_name.split(' ')[0]}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    }

                    // EMPTY CELL (Putih Polos): Clicking opens Form Input Sewa Baru!
                    return (
                      <td
                        key={day.dayNum}
                        onClick={() => onOpenCreateBooking && onOpenCreateBooking({
                          property_id: prop.id,
                          check_in_date: day.dateString,
                          check_out_date: getNextLocalDateString(day.dateString)
                        })}
                        className={`p-0 border-r border-gray-100 text-center bg-white hover:bg-orange-50/80 cursor-pointer transition-colors group relative w-10 min-w-[40px] max-w-[40px] sm:w-12 sm:min-w-[48px] sm:max-w-[48px] ${
                          day.isToday ? 'bg-orange-50/20' : day.isWeekend ? 'bg-gray-50/30' : ''
                        }`}
                        title={`Tanggal ${day.dateString} Tersedia. Klik untuk buat sewa baru unit ini.`}
                      >
                        <div className="h-full w-full min-h-[48px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-3.5 h-3.5 text-orange-500" />
                        </div>
                      </td>
                    );
                  })}

                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>

      {/* 4. Rich Floating Pop-up Tooltip on Hover */}
      {hoveredBooking && (
        <div 
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-150"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <div className="bg-gray-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-gray-700/80 w-72 text-xs space-y-2 pointer-events-auto">
            
            {/* Header: Invoice & Status */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <span className="font-mono font-bold text-orange-400 text-xs">
                #{hoveredBooking.invoice_number}
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                hoveredBooking.payment_status === 'confirmed' || hoveredBooking.payment_status === 'completed'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500 text-white'
              }`}>
                {hoveredBooking.payment_status === 'confirmed' || hoveredBooking.payment_status === 'completed'
                  ? 'LUNAS'
                  : 'BELUM LUNAS'}
              </span>
            </div>

            {/* Guest Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-gray-200 font-bold">
                <User className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="truncate">{hoveredBooking.guest_name}</span>
                <span className="text-[10px] text-gray-400 font-normal">({hoveredBooking.number_of_guests || 1} Tamu)</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{hoveredBooking.guest_phone || '-'}</span>
              </div>
            </div>

            {/* Dates & Duration */}
            <div className="bg-gray-800/80 p-2 rounded-xl border border-gray-700/60 space-y-1 text-[11px]">
              <div className="flex justify-between text-gray-300">
                <span>Check-in:</span>
                <span className="font-semibold text-white">{formatDateIndo(hoveredBooking.check_in_date)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Check-out:</span>
                <span className="font-semibold text-white">{formatDateIndo(hoveredBooking.check_out_date)}</span>
              </div>
              <div className="flex justify-between text-orange-400 font-bold pt-1 border-t border-gray-700/60">
                <span>Durasi Menginap:</span>
                <span>{hoveredBooking.total_nights} Malam ({hoveredBooking.rental_type || 'Harian'})</span>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="space-y-1 pt-1 text-[11px]">
              <div className="flex justify-between text-gray-300">
                <span>Total Biaya Sewa:</span>
                <span className="font-extrabold text-orange-400 text-xs">{formatRupiah(hoveredBooking.grand_total)}</span>
              </div>
            </div>

            {/* Bukti Transfer Tamu (Clickable) */}
            {hoveredBooking.payment_proof_image ? (
              <div className="pt-2 border-t border-gray-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-300 font-medium flex items-center gap-1">
                    <FileText className="w-3 h-3 text-emerald-400" />
                    Bukti Transfer:
                  </span>
                  <a
                    href={getImageUrl(hoveredBooking.payment_proof_image)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-orange-400 hover:text-orange-300 font-bold text-[10px] flex items-center gap-0.5 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Buka Foto
                  </a>
                </div>
                <a
                  href={getImageUrl(hoveredBooking.payment_proof_image)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="block rounded-lg overflow-hidden border border-gray-700 hover:border-orange-500 transition-colors bg-gray-950 p-1 group cursor-pointer"
                  title="Klik untuk membuka bukti transfer ukuran penuh"
                >
                  <img
                    src={getImageUrl(hoveredBooking.payment_proof_image)}
                    alt="Bukti Transfer"
                    className="w-full h-24 object-contain rounded group-hover:scale-[1.03] transition-transform duration-150"
                  />
                </a>
              </div>
            ) : (
              <div className="pt-1 border-t border-gray-800 text-[10px] text-gray-400 italic">
                *Belum ada bukti transfer diunggah
              </div>
            )}

            {/* Quick Action Hint */}
            <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-400">
              <span>Klik balok untuk detail</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onViewBookingDetail && onViewBookingDetail(hoveredBooking)}
                  className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-white rounded font-semibold cursor-pointer"
                >
                  Detail
                </button>
                <button
                  type="button"
                  onClick={() => onEditBooking && onEditBooking(hoveredBooking)}
                  className="px-2 py-0.5 bg-orange-600 hover:bg-orange-700 text-white rounded font-semibold cursor-pointer"
                >
                  Edit
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
