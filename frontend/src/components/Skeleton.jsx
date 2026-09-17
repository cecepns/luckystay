import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="aspect-[16/10] bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-4/5" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="pt-3 flex justify-between items-center">
          <div className="h-5 bg-gray-100 rounded w-1/3" />
          <div className="h-8 bg-gray-100 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }) {
  return (
    <tr className="animate-pulse border-b border-gray-50">
      {Array.from({ length: cols }).map((_, idx) => (
        <td key={idx} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export function EmptyState({ icon: Icon, title, description, actionText, onAction }) {
  return (
    <div className="text-center py-16 px-4 bg-white rounded-xl border border-gray-100">
      {Icon && (
        <div className="inline-flex p-4 rounded-xl bg-orange-50 text-orange-500 mb-4">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-5">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
