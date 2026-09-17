import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StatusBadge from '../components/StatusBadge';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import { 
  Printer, 
  Upload, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Building2, 
  Calendar, 
  ShieldCheck, 
  AlertCircle,
  Copy,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import ImageWithFallback from '../components/ImageWithFallback';

export default function InvoicePage() {
  const { invoiceNumber } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchInvoice = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.BOOKINGS.DETAIL(invoiceNumber));
      if (res.success) {
        setBooking(res.data);
      }
    } catch (err) {
      toast.error('Gagal mengambil data invoice');
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.PAYMENTS.BANK_ACCOUNTS);
      if (res.success) {
        setBankAccounts(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInvoice();
    fetchBanks();
  }, [invoiceNumber]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadProof = async (e) => {
    e.preventDefault();
    if (!proofFile) {
      toast.error('Pilih file bukti transfer terlebih dahulu');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('payment_proof', proofFile);

      const res = await request.upload(API_ENDPOINTS.BOOKINGS.UPLOAD_PROOF(invoiceNumber), formData);
      if (res.success) {
        toast.success('Bukti transfer berhasil diunggah! Menunggu verifikasi admin.');
        fetchInvoice();
      } else {
        toast.error(res.message || 'Gagal mengunggah bukti');
      }
    } catch (err) {
      toast.error(err.customMessage || 'Gagal mengunggah bukti transfer');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto w-full p-8 animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-1/4" />
          <div className="h-64 bg-gray-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
          <h2 className="text-xl font-bold text-gray-800">Invoice Tidak Ditemukan</h2>
          <p className="text-xs text-gray-500 mt-1">Periksa kembali nomor invoice atau hubungi CS kami.</p>
          <Link to="/" className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-semibold">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const property = booking.property || {};

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="no-print">
        <Navbar />
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        
        {/* Top Actions Bar (Hidden on print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-600">Status Pesanan:</span>
            <StatusBadge status={booking.payment_status} />
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span>Cetak / Simpan Invoice</span>
            </button>

            <a
              href={`https://wa.me/6282167656446?text=Halo%20Admin%20Lucky%20Stay,%20saya%20sudah%20transfer%20untuk%20invoice%20${booking.invoice_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Konfirmasi via WA</span>
            </a>
          </div>
        </div>

        {/* PRINTABLE INVOICE CARD */}
        <div id="printable-invoice" className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-xl shadow-gray-200/50 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-gray-200">
            <div>
              <img src="/logo.png" alt="Lucky Stay" className="h-14 w-auto object-contain mb-3" />
              <div className="text-xs text-gray-500 space-y-0.5">
                <p className="font-bold text-gray-800">PT LUCKY STAY INDONESIA</p>
                <p>Apartment & Hotel Booking Services</p>
                <p>WhatsApp: +62 821-6765-6446 | cs@luckystay.com</p>
                <p>Jakarta • Bandung • Bali • Surabaya</p>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block mb-1">
                INVOICE RESMI
              </span>
              <div className="text-xl sm:text-2xl font-mono font-extrabold text-gray-900">
                {booking.invoice_number}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Tanggal Pemesanan: {formatDateIndo(booking.created_at)}
              </p>
              <div className="mt-2 inline-block">
                <StatusBadge status={booking.payment_status} />
              </div>
            </div>
          </div>

          {/* Guest & Stay Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-5 rounded-2xl border border-gray-200/80 text-xs">
            <div>
              <span className="font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Ditagihkan Kepada (Tamu):
              </span>
              <p className="font-bold text-sm text-gray-900">{booking.guest_name}</p>
              <p className="text-gray-600 mt-0.5">WhatsApp / HP: {booking.guest_phone}</p>
              {booking.guest_email && <p className="text-gray-600">Email: {booking.guest_email}</p>}
              <p className="text-gray-600 mt-1">Jumlah Tamu: <strong>{booking.number_of_guests} Orang</strong></p>
            </div>

            <div>
              <span className="font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Unit Properti & Alamat:
              </span>
              <p className="font-bold text-sm text-gray-900">{property.name}</p>
              <p className="text-gray-600 mt-0.5">
                {property.building_name} {property.unit_number ? `- ${property.unit_number}` : ''}
              </p>
              <p className="text-gray-600 leading-snug">{property.address}</p>
            </div>
          </div>

          {/* Schedule Range */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border border-gray-200 rounded-2xl p-4 text-center">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Tanggal Check-In</div>
              <div className="text-sm font-bold text-gray-900 mt-0.5">{formatDateIndo(booking.check_in_date)}</div>
              <div className="text-[11px] text-gray-500">Mulai 14.00 WIB</div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Tanggal Check-Out</div>
              <div className="text-sm font-bold text-gray-900 mt-0.5">{formatDateIndo(booking.check_out_date)}</div>
              <div className="text-[11px] text-gray-500">Maksimal 12.00 WIB</div>
            </div>

            <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-gray-200 pt-2 sm:pt-0">
              <div className="text-[10px] font-bold text-gray-400 uppercase">Total Durasi</div>
              <div className="text-sm font-bold text-orange-600 mt-0.5">{booking.total_nights} Malam</div>
              <div className="text-[11px] text-gray-500">Konfirmasi Instan</div>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b-2 border-gray-200 text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-2 font-bold">Rincian Layanan</th>
                  <th className="py-3 px-2 text-center font-bold">Durasi / Qty</th>
                  <th className="py-3 px-2 text-right font-bold">Tarif</th>
                  <th className="py-3 px-2 text-right font-bold">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3.5 px-2">
                    <span className="font-bold text-gray-800 block">Sewa Unit ({property.type || 'Apartemen'})</span>
                    <span className="text-[11px] text-gray-500">{property.name}</span>
                  </td>
                  <td className="py-3.5 px-2 text-center font-medium text-gray-700">{booking.total_nights} Malam</td>
                  <td className="py-3.5 px-2 text-right font-medium text-gray-700">{formatRupiah(booking.room_price_per_night)}</td>
                  <td className="py-3.5 px-2 text-right font-bold text-gray-900">{formatRupiah(booking.total_room_price)}</td>
                </tr>

                <tr>
                  <td className="py-3 px-2">
                    <span className="font-semibold text-gray-800">Biaya Kebersihan (Cleaning Fee)</span>
                    <span className="text-[11px] text-gray-400 block">Pembersihan standar hotel & linen steril</span>
                  </td>
                  <td className="py-3 px-2 text-center text-gray-700">1x</td>
                  <td className="py-3 px-2 text-right text-gray-700">{formatRupiah(booking.cleaning_fee)}</td>
                  <td className="py-3 px-2 text-right font-bold text-gray-900">{formatRupiah(booking.cleaning_fee)}</td>
                </tr>

                <tr>
                  <td className="py-3 px-2">
                    <span className="font-semibold text-gray-800">Security Deposit Jaminan</span>
                    <span className="text-[11px] text-emerald-600 block">100% Refundable saat check-out</span>
                  </td>
                  <td className="py-3 px-2 text-center text-gray-700">1x</td>
                  <td className="py-3 px-2 text-right text-gray-700">{formatRupiah(booking.security_deposit)}</td>
                  <td className="py-3 px-2 text-right font-bold text-gray-900">{formatRupiah(booking.security_deposit)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300">
                  <td colSpan={3} className="py-4 px-2 text-right font-bold text-gray-900 text-sm">
                    TOTAL DITAGIHKAN:
                  </td>
                  <td className="py-4 px-2 text-right font-extrabold text-base text-orange-600">
                    {formatRupiah(booking.grand_total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Hostex Integration Sync Notice if confirmed */}
          {booking.payment_status === 'confirmed' && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-xs text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-emerald-800 block mb-0.5">
                  Pembayaran Terverifikasi & Reservasi Terkonfirmasi!
                </strong>
                <p>
                  Status kalender telah disinkronkan ke Hostex Channel Manager ({booking.hostex_reservation_code || 'HTX-SYNCED'}). Tanggal menginap Anda telah terkunci di seluruh platform online. Kode akses smart lock akan dikirim ke WhatsApp {booking.guest_phone}.
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-200 space-y-1">
            <p>• Check-in mandiri dapat dilakukan mulai pukul 14:00 WIB dengan akses smart lock / keybox.</p>
            <p>• Security deposit akan dikembalikan via transfer dalam 1x24 jam setelah tim inspeksi memeriksa unit.</p>
            <p>• Syarat & Ketentuan berlaku sesuai ketentuan sewa resmi Lucky Stay Indonesia.</p>
          </div>

        </div>

        {/* PAYMENT INSTRUCTION & PROOF UPLOAD (Hidden on print) */}
        {booking.payment_status !== 'confirmed' && (
          <div className="no-print mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Payment Transfer Info */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>Instruksi Transfer Pembayaran</span>
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Silakan lakukan pembayaran sejumlah <strong className="text-orange-600 font-bold">{formatRupiah(booking.grand_total)}</strong> ke salah satu rekening resmi kami berikut:
              </p>

              <div className="space-y-3">
                {bankAccounts.map((bank) => (
                  <div key={bank.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-800">{bank.bank_name}</span>
                      <span className="text-[11px] font-semibold text-gray-500">{bank.account_holder}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="font-mono text-base font-extrabold text-orange-600 tracking-wider">
                        {bank.account_number}
                      </span>
                      <button
                        onClick={() => copyToClipboard(bank.account_number.replace(/[^0-9]/g, ''), 'Nomor Rekening')}
                        className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-700 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3 h-3" /> Salin
                      </button>
                    </div>

                    {bank.qris_image && (
                      <div className="pt-2 pb-1 flex flex-col items-center justify-center bg-white rounded-xl p-3 border border-purple-100">
                        <div className="w-44 h-44 bg-white p-1 rounded-lg flex items-center justify-center">
                          <img
                            src={bank.qris_image}
                            alt={`QRIS ${bank.bank_name}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="text-[11px] text-purple-900 font-semibold mt-1.5 text-center">
                          Scan QRIS ini dengan GoPay, OVO, Dana, BCA Mobile, dll.
                        </span>
                      </div>
                    )}

                    {bank.instructions && (
                      <p className="text-[11px] text-gray-500 pt-0.5 leading-relaxed">
                        {bank.instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Bukti Pembayaran */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-orange-500" />
                <span>Unggah Bukti Transfer / Resi</span>
              </h3>

              {booking.payment_proof_image ? (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-3 text-xs text-blue-900">
                  <div className="flex items-center gap-2 font-bold text-blue-800">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Bukti Telah Diunggah (Menunggu Verifikasi Admin)</span>
                  </div>
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-900 border border-blue-200">
                    <ImageWithFallback
                      src={booking.payment_proof_image}
                      alt="Bukti Transfer"
                      className="w-full h-full object-contain"
                      showText={true}
                      fallbackText="Bukti Transfer Tidak Dapat Dimuat"
                    />
                  </div>
                  <p className="text-[11px] text-blue-700">
                    Admin kami sedang mengecek mutasi transfer Anda. Kalender Hostex akan otomatis ditutup saat status menjadi Lunas.
                  </p>
                </div>
              ) : null}

              <form onSubmit={handleUploadProof} className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 hover:border-orange-500 rounded-2xl p-6 text-center transition-colors cursor-pointer bg-gray-50/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="proof-upload"
                  />
                  <label htmlFor="proof-upload" className="cursor-pointer block">
                    {proofPreview ? (
                      <div className="space-y-2">
                        <img src={proofPreview} alt="Preview" className="max-h-48 mx-auto rounded-xl object-contain border border-gray-200" />
                        <span className="text-xs text-orange-600 font-semibold underline block">Ganti Gambar</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                        <div className="text-xs font-semibold text-gray-700">
                          Klik untuk pilih foto resi transfer
                        </div>
                        <div className="text-[10px] text-gray-400">JPG, PNG, atau WEBP maks 10MB</div>
                      </div>
                    )}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={uploading || !proofFile}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                >
                  {uploading ? 'Mengunggah Bukti...' : 'Kirim Bukti Pembayaran'}
                </button>
              </form>
            </div>

          </div>
        )}

      </main>

      <div className="no-print">
        <Footer />
      </div>
    </div>
  );
}
