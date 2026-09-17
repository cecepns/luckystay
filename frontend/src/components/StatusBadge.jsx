import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export default function StatusBadge({ status, type = 'payment' }) {
  if (type === 'hostex') {
    switch (status) {
      case 'synced':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Hostex Synced
          </span>
        );
      case 'sync_failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Sync Pending/Retry
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <Clock className="w-3 h-3 text-gray-400" />
            Belum Sinkron
          </span>
        );
    }
  }

  // Payment Status Badges
  switch (status) {
    case 'confirmed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Terkonfirmasi (Lunas)
        </span>
      );
    case 'waiting_approval':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          <Clock className="w-3 h-3 text-blue-600" />
          Menunggu Verifikasi Admin
        </span>
      );
    case 'pending_payment':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Menunggu Pembayaran
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" />
          Ditolak
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
          <CheckCircle2 className="w-3 h-3 text-purple-600" />
          Selesai (Check-out)
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          <XCircle className="w-3 h-3 text-gray-500" />
          Dibatalkan
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          {status}
        </span>
      );
  }
}
