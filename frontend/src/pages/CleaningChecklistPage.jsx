import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  Circle, 
  Camera, 
  Video, 
  AlertTriangle, 
  FileText, 
  Send, 
  Copy, 
  Check, 
  Building2, 
  Clock, 
  Calendar, 
  User, 
  Trash2, 
  Eye, 
  Sparkles, 
  CheckSquare, 
  ShieldCheck, 
  ArrowRight,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { compressImage, formatBytes } from '../utils/compressor';

const CHECKLIST_SECTIONS = [
  {
    id: 'kamar_tidur',
    title: 'Kamar Tidur',
    items: [
      'Tempat tidur rapi dan bersih',
      'Sprei dan sarung bantal bersih',
      'Lantai sudah disapu dan dipel',
      'Meja dan lemari bersih',
      'AC dan remote berfungsi',
    ],
  },
  {
    id: 'kamar_mandi',
    title: 'Kamar Mandi',
    items: [
      'Closet bersih',
      'Wastafel dan cermin bersih',
      'Shower berfungsi normal',
      'Lantai dan saluran air bersih',
      'Sabun dan sampo tersedia',
      'Tidak ada kebocoran air',
    ],
  },
  {
    id: 'ruang_tamu',
    title: 'Ruang Tamu',
    items: [
      'Sofa dan meja bersih',
      'TV dan remote berfungsi',
      'Lantai sudah dipel',
      'Jendela dan kaca bersih',
      'AC dan remote berfungsi',
    ],
  },
  {
    id: 'dapur',
    title: 'Dapur',
    items: [
      'Kompor dan kitchen set bersih',
      'Piring dan peralatan makan bersih',
      'Kulkas bersih',
      'Tempat sampah kosong',
      'Tidak ada sisa makanan',
    ],
  },
  {
    id: 'inventaris_final',
    title: 'Inventaris & Final Check',
    items: [
      'Handuk tersedia dan bersih',
      'Tisu tersedia',
      'Air mineral tersedia (jika disediakan)',
      'Lampu dan stop kontak normal',
      'Pintu dan kunci berfungsi',
      'Unit wangi dan siap ditempati',
    ],
  },
];

const TOTAL_CHECKLIST_COUNT = CHECKLIST_SECTIONS.reduce(
  (acc, sec) => acc + sec.items.length,
  0
);

export default function CleaningChecklistPage() {
  const [properties, setProperties] = useState([]);
  const [isCustomProperty, setIsCustomProperty] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    cleaning_date: new Date().toISOString().slice(0, 10),
    cleaner_name: '',
    property_name: '',
    unit_number: '',
    unit_status: 'Siap Huni',
    start_time: '',
    end_time: '',
    damage_notes: '',
    additional_notes: '',
    is_confirmed: false,
    confirmed_by: '',
    video_url: '',
  });

  // Checklist state
  const [checklist, setChecklist] = useState(() => {
    const initial = {};
    CHECKLIST_SECTIONS.forEach((sec) => {
      initial[sec.id] = {};
      sec.items.forEach((item) => {
        initial[sec.id][item] = false;
      });
    });
    return initial;
  });

  // Photo uploads state: { file, preview, originalSize, compressedSize, ratio, compressing }
  const [photos, setPhotos] = useState({
    photo_bedroom: null,
    photo_bathroom: null,
    photo_living_room: null,
    photo_kitchen: null,
    photo_overview: null,
  });

  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [hasCopied, setHasCopied] = useState(false);

  // Fetch properties for fast autocomplete / selection
  useEffect(() => {
    const fetchProps = async () => {
      try {
        const res = await request.get(API_ENDPOINTS.PROPERTIES.LIST, { limit: 100 });
        if (res?.data && Array.isArray(res.data)) {
          setProperties(res.data);
        }
      } catch (err) {
        // Silent fallback
      }
    };
    fetchProps();
  }, []);

  // Calculate Progress
  const completedCount = Object.values(checklist).reduce((secAcc, itemsObj) => {
    return secAcc + Object.values(itemsObj).filter(Boolean).length;
  }, 0);

  const progressPercent = Math.round((completedCount / TOTAL_CHECKLIST_COUNT) * 100);

  // Handle single check toggle
  const toggleItem = (sectionId, itemName) => {
    setChecklist((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [itemName]: !prev[sectionId]?.[itemName],
      },
    }));
  };

  // Section check/uncheck all
  const toggleSectionAll = (sectionId) => {
    const currentSection = checklist[sectionId] || {};
    const allChecked = Object.values(currentSection).every(Boolean);
    const updated = {};
    const section = CHECKLIST_SECTIONS.find((s) => s.id === sectionId);
    section.items.forEach((item) => {
      updated[item] = !allChecked;
    });

    setChecklist((prev) => ({
      ...prev,
      [sectionId]: updated,
    }));
  };

  // Check all items
  const checkAllItems = () => {
    const updated = {};
    CHECKLIST_SECTIONS.forEach((sec) => {
      updated[sec.id] = {};
      sec.items.forEach((item) => {
        updated[sec.id][item] = true;
      });
    });
    setChecklist(updated);
    toast.success('Semua 27 item berhasil dicentang!');
  };

  // Handle photo upload with CompressorJS
  const handlePhotoSelect = async (fieldKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Set compressing indicator
    setPhotos((prev) => ({
      ...prev,
      [fieldKey]: { compressing: true },
    }));

    const toastId = toast.loading('Mengompres foto...');
    try {
      const { file: compressedFile, originalSize, compressedSize, ratio } = await compressImage(file, {
        quality: 0.75,
        maxWidth: 1600,
        maxHeight: 1600,
      });

      const previewUrl = URL.createObjectURL(compressedFile);

      setPhotos((prev) => ({
        ...prev,
        [fieldKey]: {
          file: compressedFile,
          preview: previewUrl,
          originalSize,
          compressedSize,
          ratio,
          compressing: false,
        },
      }));

      toast.success(
        `Foto berhasil dikompres: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (-${ratio}%)`,
        { id: toastId }
      );
    } catch (err) {
      console.error('Compression error:', err);
      toast.error('Gagal mengompres foto, menggunakan ukuran standar', { id: toastId });
      const previewUrl = URL.createObjectURL(file);
      setPhotos((prev) => ({
        ...prev,
        [fieldKey]: {
          file,
          preview: previewUrl,
          originalSize: file.size,
          compressedSize: file.size,
          ratio: 0,
          compressing: false,
        },
      }));
    }
  };

  const removePhoto = (fieldKey) => {
    setPhotos((prev) => {
      if (prev[fieldKey]?.preview) {
        URL.revokeObjectURL(prev[fieldKey].preview);
      }
      return {
        ...prev,
        [fieldKey]: null,
      };
    });
  };

  // Handle Video
  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Ukuran video maksimal 50 MB!');
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    toast.success(`Video terpilih: ${file.name} (${formatBytes(file.size)})`);
  };

  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(null);
    setVideoPreview('');
  };

  // Quick set time to now
  const setTimeToNow = (field) => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setFormData((prev) => ({ ...prev, [field]: `${hours}:${minutes}` }));
  };

  // Copy Formatted Checklist text to Clipboard (for WhatsApp / Telegram sharing)
  const copyChecklistText = () => {
    const dateFormatted = formData.cleaning_date || new Date().toISOString().slice(0, 10);
    let text = `*DAILY AFTER CLEANING REPORT*\n*LUCKYSTAY PROPERTY MANAGEMENT*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*A. INFORMASI UNIT*\n`;
    text += `• Tanggal Cleaning: ${dateFormatted}\n`;
    text += `• Nama Petugas: ${formData.cleaner_name || '-'}\n`;
    text += `• Nama Apartemen: ${formData.property_name || '-'}\n`;
    text += `• Tower/Lt/Unit: ${formData.unit_number || '-'}\n`;
    text += `• Status Unit: ${formData.unit_status || 'Siap Huni'}\n`;
    text += `• Waktu: ${formData.start_time || '-'} s/d ${formData.end_time || '-'}\n\n`;

    text += `*B. CHECKLIST AFTER CLEANING (${progressPercent}% - ${completedCount}/${TOTAL_CHECKLIST_COUNT})*\n`;
    CHECKLIST_SECTIONS.forEach((sec) => {
      text += `\n*${sec.title}:*\n`;
      sec.items.forEach((item) => {
        const isDone = checklist[sec.id]?.[item];
        text += `${isDone ? '✅' : '❌'} ${item}\n`;
      });
    });

    if (formData.damage_notes) {
      text += `\n*C. KONDISI KHUSUS / KERUSAKAN:*\n${formData.damage_notes}\n`;
    }

    if (formData.additional_notes) {
      text += `\n*D. CATATAN TAMBAHAN:*\n${formData.additional_notes}\n`;
    }

    text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*Konfirmasi:* Unit telah dibersihkan & diperiksa sesuai checklist.\n`;
    text += `Petugas: ${formData.cleaner_name || '-'}\n`;

    navigator.clipboard.writeText(text);
    setHasCopied(true);
    toast.success('Laporan ceklis berhasil disalin ke clipboard!');
    setTimeout(() => setHasCopied(false), 3000);
  };

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.cleaning_date) {
      toast.error('Mohon isi tanggal cleaning!');
      return;
    }
    if (!formData.cleaner_name.trim()) {
      toast.error('Mohon isi nama petugas cleaning!');
      return;
    }
    if (!formData.property_name.trim()) {
      toast.error('Mohon pilih atau isi nama apartemen!');
      return;
    }
    if (!formData.unit_number.trim()) {
      toast.error('Mohon isi Tower / Lantai / Nomor Unit!');
      return;
    }
    if (!formData.is_confirmed) {
      toast.error('Harap centang konfirmasi bahwa unit telah dibersihkan sesuai checklist!');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Mengirim laporan ceklis...');

    try {
      const dataPayload = new FormData();
      dataPayload.append('cleaning_date', formData.cleaning_date);
      dataPayload.append('cleaner_name', formData.cleaner_name.trim());
      dataPayload.append('property_name', formData.property_name.trim());
      dataPayload.append('unit_number', formData.unit_number.trim());
      dataPayload.append('unit_status', formData.unit_status);
      dataPayload.append('start_time', formData.start_time || '');
      dataPayload.append('end_time', formData.end_time || '');
      dataPayload.append('damage_notes', formData.damage_notes.trim());
      dataPayload.append('additional_notes', formData.additional_notes.trim());
      dataPayload.append('confirmed_by', formData.cleaner_name.trim());
      dataPayload.append('checklist_items', JSON.stringify(checklist));
      dataPayload.append('video_url', formData.video_url || '');

      // Append photo files
      if (photos.photo_bedroom?.file) {
        dataPayload.append('photo_bedroom', photos.photo_bedroom.file);
      }
      if (photos.photo_bathroom?.file) {
        dataPayload.append('photo_bathroom', photos.photo_bathroom.file);
      }
      if (photos.photo_living_room?.file) {
        dataPayload.append('photo_living_room', photos.photo_living_room.file);
      }
      if (photos.photo_kitchen?.file) {
        dataPayload.append('photo_kitchen', photos.photo_kitchen.file);
      }
      if (photos.photo_overview?.file) {
        dataPayload.append('photo_overview', photos.photo_overview.file);
      }

      // Append video file if uploaded
      if (videoFile) {
        dataPayload.append('video_file', videoFile);
      }

      const res = await request.upload(API_ENDPOINTS.CLEANING_CHECKLISTS.SUBMIT, dataPayload);

      if (res?.success) {
        toast.success('Laporan ceklis kebersihan berhasil disimpan ke sistem!', { id: toastId });
        setSubmittedData(res.data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(res?.message || 'Gagal menyimpan laporan');
      }
    } catch (err) {
      console.error('Submit checklist error:', err);
      toast.error(err.customMessage || err.message || 'Gagal mengirim laporan', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedData(null);
    setFormData({
      cleaning_date: new Date().toISOString().slice(0, 10),
      cleaner_name: '',
      property_name: '',
      unit_number: '',
      unit_status: 'Siap Huni',
      start_time: '',
      end_time: '',
      damage_notes: '',
      additional_notes: '',
      is_confirmed: false,
      confirmed_by: '',
      video_url: '',
    });
    const initial = {};
    CHECKLIST_SECTIONS.forEach((sec) => {
      initial[sec.id] = {};
      sec.items.forEach((item) => {
        initial[sec.id][item] = false;
      });
    });
    setChecklist(initial);
    setPhotos({
      photo_bedroom: null,
      photo_bathroom: null,
      photo_living_room: null,
      photo_kitchen: null,
      photo_overview: null,
    });
    setVideoFile(null);
    setVideoPreview('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 selection:bg-orange-500 selection:text-white">
      <div className="max-w-3xl mx-auto">
        
        {/* Top Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 p-6 sm:p-8 mb-6 shadow-2xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold tracking-wider uppercase mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                DAILY AFTER CLEANING REPORT
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                LUCKYSTAY PROPERTY MANAGEMENT
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
                Format laporan after cleaning harian apartemen yang digunakan oleh tim housekeeping setelah selesai membersihkan unit.
              </p>
            </div>
            <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
              <ClipboardCheck className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Success Modal / Banner */}
        {submittedData && (
          <div className="mb-8 rounded-3xl bg-emerald-950/60 border border-emerald-500/30 p-6 sm:p-8 shadow-xl text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold tracking-wide uppercase">
              Laporan Terkirim & Tercatat
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">
              Terima Kasih, Laporan Berhasil Dikirim!
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Kode Laporan: <span className="font-mono font-bold text-emerald-400">{submittedData.report_code}</span>
            </p>
            <div className="mt-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left max-w-md mx-auto text-xs space-y-1.5 text-slate-300">
              <div><strong className="text-slate-400">Unit:</strong> {submittedData.property_name} ({submittedData.unit_number})</div>
              <div><strong className="text-slate-400">Petugas:</strong> {submittedData.cleaner_name}</div>
              <div><strong className="text-slate-400">Status:</strong> <span className="text-emerald-400 font-semibold">{submittedData.unit_status}</span></div>
              <div><strong className="text-slate-400">Penyelesaian:</strong> {submittedData.completion_percent}% ({submittedData.completed_items}/{submittedData.total_items} checklist)</div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={copyChecklistText}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 shadow-sm"
              >
                {hasCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-orange-400" />}
                <span>{hasCopied ? 'Tersalin!' : 'Salin Laporan ke WhatsApp'}</span>
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-lg shadow-orange-500/20"
              >
                <span>Isi Laporan Baru</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section A: INFORMASI UNIT */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-7 shadow-lg">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm">
                A
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">INFORMASI UNIT</h2>
                <p className="text-xs text-slate-400">Lengkapi data properti dan waktu pelaksanaan cleaning</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tanggal Cleaning */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tanggal Cleaning <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={formData.cleaning_date}
                    onChange={(e) => setFormData({ ...formData, cleaning_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              {/* Nama Petugas */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama Petugas Cleaning <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={formData.cleaner_name}
                    onChange={(e) => setFormData({ ...formData, cleaner_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 transition-colors placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Nama Apartemen */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Nama Apartemen <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomProperty(!isCustomProperty);
                      setFormData((prev) => ({ ...prev, property_name: '' }));
                    }}
                    className="text-[11px] text-orange-400 hover:text-orange-300 underline font-medium"
                  >
                    {isCustomProperty ? 'Pilih dari daftar properti' : 'Ketik manual / Nama baru'}
                  </button>
                </div>

                {isCustomProperty || properties.length === 0 ? (
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Grand Asia Afrika Residence"
                    value={formData.property_name}
                    onChange={(e) => setFormData({ ...formData, property_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 transition-colors placeholder:text-slate-600"
                  />
                ) : (
                  <select
                    required
                    value={formData.property_name}
                    onChange={(e) => {
                      const selected = e.target.value;
                      const matched = properties.find((p) => p.name === selected);
                      setFormData((prev) => ({
                        ...prev,
                        property_name: selected,
                        unit_number: matched?.unit_number || prev.unit_number,
                      }));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="">-- Pilih Apartemen / Properti --</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} {p.building_name ? `(${p.building_name})` : ''} - {p.city}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Tower / Lantai / Nomor Unit */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tower / Lantai / Nomor Unit <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tower B / Lt 15 / Unit 1502"
                  value={formData.unit_number}
                  onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 transition-colors placeholder:text-slate-600"
                />
              </div>

              {/* Status Unit */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Status Unit <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.unit_status}
                  onChange={(e) => setFormData({ ...formData, unit_status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 transition-colors font-medium"
                >
                  <option value="Siap Huni">✅ Siap Huni (Clean & Ready to Check-In)</option>
                  <option value="Perlu Perbaikan">⚠️ Perlu Perbaikan (Ada Kerusakan)</option>
                  <option value="Menunggu Linen">🧺 Menunggu Linen / Laundry</option>
                  <option value="Dalam Pembersihan">🧹 Dalam Pembersihan</option>
                </select>
              </div>

              {/* Waktu Mulai & Selesai */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Waktu Mulai</label>
                  <button
                    type="button"
                    onClick={() => setTimeToNow('start_time')}
                    className="text-[10px] text-orange-400 hover:text-orange-300"
                  >
                    Set Sekarang
                  </button>
                </div>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Waktu Selesai</label>
                  <button
                    type="button"
                    onClick={() => setTimeToNow('end_time')}
                    className="text-[10px] text-orange-400 hover:text-orange-300"
                  >
                    Set Sekarang
                  </button>
                </div>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Section B: CHECKLIST AFTER CLEANING */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-7 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm">
                  B
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">CHECKLIST AFTER CLEANING</h2>
                  <p className="text-xs text-slate-400">Centang setelah memastikan setiap bagian sudah bersih dan siap digunakan.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={checkAllItems}
                className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-semibold border border-orange-500/20 transition-colors"
              >
                Centang Semua (27 Item)
              </button>
            </div>

            {/* Progress Bar Widget */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-6">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-300">Progress checklist:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {progressPercent}% <span className="text-xs text-slate-500 font-normal">({completedCount} dari {TOTAL_CHECKLIST_COUNT} item selesai)</span>
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Checklist Groups */}
            <div className="space-y-6">
              {CHECKLIST_SECTIONS.map((section) => {
                const sectionItems = checklist[section.id] || {};
                const sectionCompleted = Object.values(sectionItems).filter(Boolean).length;
                const isAllDone = sectionCompleted === section.items.length;

                return (
                  <div key={section.id} className="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white tracking-wide">{section.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isAllDone ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {sectionCompleted}/{section.items.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSectionAll(section.id)}
                        className="text-[11px] text-slate-400 hover:text-orange-400 transition-colors"
                      >
                        {isAllDone ? 'Hapus Centang' : 'Centang Bagian Ini'}
                      </button>
                    </div>

                    <div className="space-y-2">
                      {section.items.map((item) => {
                        const isChecked = !!sectionItems[item];
                        return (
                          <label
                            key={item}
                            onClick={() => toggleItem(section.id, item)}
                            className={`flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer select-none ${
                              isChecked
                                ? 'bg-emerald-950/30 border border-emerald-500/20 text-slate-200'
                                : 'bg-slate-900/40 hover:bg-slate-900/80 border border-transparent text-slate-400 hover:text-slate-300'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isChecked ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-950/60" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-600 hover:text-slate-500" />
                              )}
                            </div>
                            <span className={`text-xs sm:text-sm font-medium ${isChecked ? 'line-through text-slate-400' : ''}`}>
                              {item}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section C: KONDISI KHUSUS / KERUSAKAN */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-7 shadow-lg">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm">
                C
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">KONDISI KHUSUS / KERUSAKAN</h2>
                <p className="text-xs text-slate-400">
                  Catat jika ditemukan barang rusak, hilang, noda membandel, atau fasilitas tidak berfungsi.
                </p>
              </div>
            </div>

            <textarea
              rows={3}
              placeholder="Contoh: Remote AC rusak, gelas pecah, keran wastafel bocor, noda sprei tidak hilang..."
              value={formData.damage_notes}
              onChange={(e) => setFormData({ ...formData, damage_notes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-rose-500 transition-colors placeholder:text-slate-600"
            />
          </div>

          {/* Section D: CATATAN TAMBAHAN */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-7 shadow-lg">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                D
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">CATATAN TAMBAHAN</h2>
                <p className="text-xs text-slate-400">Catatan khusus dari petugas cleaning untuk tim operasional</p>
              </div>
            </div>

            <textarea
              rows={3}
              placeholder="Catatan petugas cleaning (opsional)..."
              value={formData.additional_notes}
              onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
            />
          </div>

          {/* Section E: FOTO DOKUMENTASI (WITH FRONTEND COMPRESSION) */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-7 shadow-lg">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                E
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">FOTO DOKUMENTASI</h2>
                <p className="text-xs text-slate-400">
                  Foto otomatis dikompres di browser agar upload cepat dan hemat kuota
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: 'photo_bedroom', label: 'Foto Kamar Tidur' },
                { key: 'photo_bathroom', label: 'Foto Kamar Mandi' },
                { key: 'photo_living_room', label: 'Foto Ruang Tamu' },
                { key: 'photo_kitchen', label: 'Foto Dapur' },
                { key: 'photo_overview', label: 'Foto Keseluruhan Unit' },
              ].map((item) => {
                const photoState = photos[item.key];
                return (
                  <div
                    key={item.key}
                    className="relative rounded-2xl bg-slate-950 border border-slate-800 p-3 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-200">{item.label}</span>
                      {photoState?.ratio > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          -{photoState.ratio}%
                        </span>
                      )}
                    </div>

                    {photoState?.preview ? (
                      <div className="relative group rounded-xl overflow-hidden aspect-video bg-slate-900 border border-slate-800">
                        <img
                          src={photoState.preview}
                          alt={item.label}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(item.key)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 text-white hover:bg-rose-700 transition-colors shadow-md"
                          title="Hapus foto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 p-1.5 bg-black/70 text-[10px] text-slate-300 truncate">
                          {formatBytes(photoState.compressedSize)}
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-800 hover:border-orange-500/50 bg-slate-900/40 hover:bg-slate-900 aspect-video cursor-pointer transition-all">
                        <Camera className="w-6 h-6 text-slate-500 mb-1 group-hover:text-orange-400" />
                        <span className="text-[11px] text-slate-400 font-medium">Ambil / Upload Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handlePhotoSelect(item.key, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                );
              })}

              {/* Video Dokumentasi (File or URL) */}
              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-200">Video Kondisi Akhir Unit</span>
                  <span className="text-[10px] text-slate-500 font-normal">(Opsional)</span>
                </div>

                {videoPreview ? (
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <video src={videoPreview} controls className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 text-white hover:bg-rose-700 transition-colors shadow-md z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-800 hover:border-orange-500/50 bg-slate-900/40 hover:bg-slate-900 aspect-video cursor-pointer transition-all mb-2">
                      <Video className="w-6 h-6 text-slate-500 mb-1" />
                      <span className="text-[11px] text-slate-400 font-medium">Upload File Video</span>
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/webm"
                        onChange={handleVideoSelect}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="url"
                      placeholder="Atau link Google Drive / Video URL"
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-orange-500 placeholder:text-slate-600"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section F: KONFIRMASI */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-7 shadow-lg">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm">
                F
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">KONFIRMASI</h2>
                <p className="text-xs text-slate-400">Pernyataan kepatuhan checklist kebersihan harian</p>
              </div>
            </div>

            <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                required
                checked={formData.is_confirmed}
                onChange={(e) => setFormData({ ...formData, is_confirmed: e.target.checked })}
                className="w-5 h-5 mt-0.5 rounded text-orange-500 focus:ring-orange-500 focus:ring-offset-slate-950 bg-slate-900 border-slate-700"
              />
              <span className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                Saya menyatakan unit telah dibersihkan dan diperiksa dengan teliti sesuai checklist di atas, serta seluruh dokumentasi kondisi aktual telah dilampirkan.
              </span>
            </label>

            {formData.cleaner_name && (
              <div className="mt-3 text-xs text-slate-400">
                Nama Petugas: <strong className="text-slate-200">{formData.cleaner_name}</strong>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sedang Mengirim Laporan...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Kirim Laporan Ceklis Kebersihan</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={copyChecklistText}
              className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {hasCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-orange-400" />}
              <span>Salin Laporan Checklist</span>
            </button>
          </div>

          {/* SOP Guide Box (as shown in user image) */}
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-bold mb-2">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <span>Saran SOP untuk tim Housekeeping Luckystay</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-slate-400">
              <li>Petugas wajib mengisi laporan setiap selesai cleaning satu unit.</li>
              <li>Wajib mengambil foto dan video kondisi unit setelah dibersihkan.</li>
              <li>Jika ditemukan kerusakan atau barang hilang, wajib melapor sebelum meninggalkan unit.</li>
              <li>Tim operasional melakukan pengecekan laporan sebelum unit dinyatakan siap check-in tamu.</li>
            </ol>
          </div>

        </form>
      </div>
    </div>
  );
}
