import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { formatRupiah, formatDateIndo, calculateNights } from '../utils/formatters';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Users, 
  CreditCard, 
  ChevronLeft, 
  QrCode, 
  Landmark,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import ImageWithFallback from '../components/ImageWithFallback';

export default function BookingCheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const bookingState = location.state;

  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync user details if user logs in while on page
  useEffect(() => {
    if (user) {
      if (!guestName) setGuestName(user.name || '');
      if (!guestPhone) setGuestPhone(user.phone || '');
      if (!guestEmail) setGuestEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (!bookingState?.property) {
      toast.error('Silakan pilih apartemen terlebih dahulu');
      navigate('/');
      return;
    }

    // Fetch active bank accounts
    const fetchBanks = async () => {
      try {
        const res = await request.get(API_ENDPOINTS.PAYMENTS.BANK_ACCOUNTS);
        if (res.success) {
          setBankAccounts(res.data);
          if (res.data.length > 0) setSelectedBankId(res.data[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchBanks();
  }, [bookingState, navigate]);

  if (!bookingState?.property) return null;

  const { property, checkInDate, checkOutDate, nights, guestsCount, totalRoomPrice, cleaningFee, deposit, grandTotal } = bookingState;

  // Safe numeric conversions to prevent string concatenation and NaN
  const parsedPricePerNight = Number(property.price_per_night) || 0;
  const parsedNights = Number(nights) > 0 ? Number(nights) : calculateNights(checkInDate, checkOutDate);
  const parsedCleaningFee = Number(cleaningFee ?? property.cleaning_fee ?? 0) || 0;
  const parsedDeposit = Number(deposit ?? property.security_deposit ?? 0) || 0;
  const parsedTotalRoomPrice = (typeof totalRoomPrice === 'number' && !isNaN(totalRoomPrice) && totalRoomPrice > 0)
    ? totalRoomPrice
    : (parsedPricePerNight * parsedNights);
  const parsedGrandTotal = (typeof grandTotal === 'number' && !isNaN(grandTotal) && grandTotal > 0)
    ? grandTotal
    : (parsedTotalRoomPrice + parsedCleaningFee + parsedDeposit);

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Silakan masuk atau daftar akun terlebih dahulu untuk melanjutkan!');
      openAuthModal('login');
      return;
    }

    if (!guestName.trim()) {
      toast.error('Nama lengkap tamu wajib diisi!');
      return;
    }
    if (!guestPhone.trim()) {
      toast.error('Nomor WhatsApp / HP tamu wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalRentalType = bookingState.rentalType || (parsedNights >= 365 ? 'yearly' : parsedNights >= 30 ? 'monthly' : 'daily');
      const payload = {
        property_id: property.id,
        user_id: user?.id || null,
        guest_name: guestName,
        guest_phone: guestPhone,
        guest_email: guestEmail,
        number_of_guests: guestsCount,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        rental_type: finalRentalType,
        special_requests: specialRequests,
        payment_method: paymentMethod
      };

      const res = await request.post(API_ENDPOINTS.BOOKINGS.CREATE, payload);
      if (res.success) {
        toast.success('Reservasi berhasil dibuat! Menuju halaman invoice...');
        navigate(`/invoice/${res.data.invoice_number}`);
      } else {
        toast.error(res.message || 'Gagal membuat reservasi');
      }
    } catch (err) {
      toast.error(err.customMessage || 'Terjadi kesalahan saat membuat booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Detail Unit</span>
        </button>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6">
          Konfirmasi Pemesanan & Pembayaran
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Section (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Customer Login / Register Banner */}
            {!isAuthenticated ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold flex items-center gap-1.5 mb-1 text-sm text-amber-950">
                    <Sparkles className="w-4 h-4 text-orange-500" /> Wajib Masuk atau Daftar Akun
                  </span>
                  <span>Anda perlu masuk atau mendaftar akun Lucky Stay terlebih dahulu untuk melanjutkan pemesanan unit ini.</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuthModal('register')}
                    className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    Daftar Baru
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs text-emerald-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">{user?.name}</span>
                    <span className="text-[11px] text-gray-500">{user?.email} • {user?.phone || 'Nomor WhatsApp'}</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-emerald-200 shadow-xs">
                  ✓ Akun Terverifikasi
                </span>
              </div>
            )}

            {/* 1. Guest Information Form */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                <span>1. Data Informasi Tamu</span>
              </h2>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nama Lengkap (Sesuai KTP/Paspor) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Nomor WhatsApp / HP Aktif <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 081234567890"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    <span className="text-[11px] text-gray-400">Instruksi check-in & kode smart lock akan dikirim ke nomor ini.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Alamat Email (Untuk Invoice)
                    </label>
                    <input
                      type="email"
                      placeholder="Contoh: budi@gmail.com"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Catatan / Permintaan Khusus
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Perkiraan tiba jam 15.00, butuh handuk ekstra, lantai bebas rokok."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Payment Method */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-500" />
                <span>2. Metode Pembayaran (Verifikasi Manual)</span>
              </h2>

              <p className="text-xs text-gray-500 leading-relaxed">
                Pembayaran dilakukan secara transfer manual atau scan QRIS. Setelah transfer, silakan unggah bukti transfer di invoice untuk diverifikasi admin kami.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-orange-500 bg-orange-50/40 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Landmark className={`w-5 h-5 mt-0.5 ${paymentMethod === 'bank_transfer' ? 'text-orange-600' : 'text-gray-400'}`} />
                  <div>
                    <div className="text-xs font-bold text-gray-900">Transfer Bank Manual</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">BCA, Mandiri, BNI</div>
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod('qris')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                    paymentMethod === 'qris'
                      ? 'border-orange-500 bg-orange-50/40 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <QrCode className={`w-5 h-5 mt-0.5 ${paymentMethod === 'qris' ? 'text-orange-600' : 'text-gray-400'}`} />
                  <div>
                    <div className="text-xs font-bold text-gray-900">QRIS Lucky Stay</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">GoPay, OVO, Dana, BCA Mobile</div>
                  </div>
                </div>
              </div>

              {/* Bank accounts instructions preview */}
              <div className="mt-4 p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-xs text-gray-600">
                <span className="font-semibold text-gray-800 block">Daftar Rekening Resmi Lucky Stay:</span>
                {bankAccounts.map((b) => (
                  <div key={b.id} className="flex justify-between py-1 border-b border-gray-200/60 last:border-0">
                    <span className="font-medium text-gray-700">{b.bank_name}</span>
                    <span className="font-mono font-bold text-orange-600">{b.account_number}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Summary Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl shadow-gray-200/50 space-y-5 sticky top-28">
              <h3 className="text-base font-bold text-gray-900">Ringkasan Pesanan</h3>

              {/* Property Preview */}
              <div className="flex gap-3 pb-4 border-b border-gray-100">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                  <ImageWithFallback
                    src={property.images?.[0]}
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                    {property.type}
                  </span>
                  <h4 className="text-xs font-bold text-gray-900 mt-1 line-clamp-2">{property.name}</h4>
                  <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                    <span>{property.location}</span>
                  </div>
                </div>
              </div>

              {/* Dates & Guests */}
              <div className="space-y-2 text-xs text-gray-600 py-1">
                <div className="flex justify-between">
                  <span>Check-In</span>
                  <span className="font-semibold text-gray-800">{formatDateIndo(checkInDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-Out</span>
                  <span className="font-semibold text-gray-800">{formatDateIndo(checkOutDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Durasi</span>
                  <span className="font-semibold text-gray-800">{nights} Malam</span>
                </div>
                <div className="flex justify-between">
                  <span>Jumlah Tamu</span>
                  <span className="font-semibold text-gray-800">{guestsCount} Tamu</span>
                </div>
              </div>

              {/* Cost breakdown */}
              <div className="space-y-2 pt-3 border-t border-gray-100 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Sewa ({parsedNights} malam)</span>
                  <span className={`font-semibold ${bookingState.discountAmount > 0 ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {formatRupiah(bookingState.rawRoomPrice || parsedTotalRoomPrice)}
                  </span>
                </div>
                {bookingState.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                    <span>{bookingState.discountLabel || 'Diskon Sewa'}</span>
                    <span>- {formatRupiah(bookingState.discountAmount)}</span>
                  </div>
                )}
                {bookingState.discountAmount > 0 && (
                  <div className="flex justify-between text-gray-700 font-semibold">
                    <span>Tarif Bersih Kamar</span>
                    <span className="font-bold text-orange-600">{formatRupiah(parsedTotalRoomPrice)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Biaya Kebersihan</span>
                  <span className="font-semibold text-gray-800">{formatRupiah(parsedCleaningFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Security Deposit (Refundable)</span>
                  <span className="font-semibold text-gray-800">{formatRupiah(parsedDeposit)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-gray-900">Total Tagihan</span>
                <span className="text-xl font-extrabold text-orange-600">
                  {formatRupiah(parsedGrandTotal)}
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmitBooking}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-2xl shadow-sm transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Memproses Reservasi...' : 'Lanjutkan ke Pembayaran'}
              </button>

            </div>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
