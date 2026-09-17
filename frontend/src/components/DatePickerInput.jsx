import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar as CalendarIcon, X, AlertCircle } from 'lucide-react';

// Custom Trigger Input Button
const CustomDateInput = forwardRef(({ value, onClick, onClear, placeholder, hasValue, hasError }, ref) => (
  <div className="relative w-full">
    <button
      type="button"
      onClick={onClick}
      ref={ref}
      className={`w-full flex items-center pl-9 pr-8 py-2.5 bg-white rounded-xl text-left text-sm transition-all focus:outline-none ${
        hasError
          ? 'border-2 border-rose-400 bg-rose-50/20 text-rose-800 focus:border-rose-500'
          : 'border border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400'
      } ${
        hasValue ? 'text-gray-900 font-semibold' : 'text-gray-400 font-medium'
      }`}
    >
      <CalendarIcon className={`w-4 h-4 absolute left-3 pointer-events-none ${hasError ? 'text-rose-500' : 'text-orange-500'}`} />
      <span className="truncate">{value || placeholder}</span>
    </button>
    {hasValue && onClear && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        title="Hapus tanggal"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
));

CustomDateInput.displayName = 'CustomDateInput';

export default function DatePickerInput({
  label,
  value,
  onChange,
  minDate = new Date(),
  maxDate,
  placeholder = 'Pilih Tanggal',
  required = false,
  hasError = false,
  errorMessage = ''
}) {
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDateToString = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDate = parseDate(value);

  const handleDateChange = (date) => {
    onChange(formatDateToString(date));
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="datepicker-wrapper relative">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          minDate={minDate}
          maxDate={maxDate}
          dateFormat="dd MMM yyyy"
          placeholderText={placeholder}
          customInput={
            <CustomDateInput
              placeholder={placeholder}
              hasValue={!!selectedDate}
              hasError={hasError}
              onClear={() => onChange('')}
            />
          }
          popperPlacement="bottom-start"
          popperClassName="datepicker-popper-override"
        />
      </div>
      {hasError && errorMessage && (
        <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{errorMessage}</span>
        </p>
      )}
    </div>
  );
}
