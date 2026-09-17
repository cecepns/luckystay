import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import wonderfulImg from '../assets/wonderful-indonesia.png';

export default function Footer() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async (platform) => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      toast.success(
        platform === 'ios'
          ? 'Untuk iOS: Buka Safari, tap tombol Share (Bagikan), lalu pilih "Add to Home Screen".'
          : 'PWA Siap! Pilih opsi "Add to Home Screen" atau "Install App" di menu browser Anda.'
      );
    }
  };

  return (
    <footer className="bg-white border-t border-gray-200 py-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* PWA Download Title */}
        <p className="text-base sm:text-lg font-bold text-gray-800 mb-5">
          Download Lucky Stay App for FREE!
        </p>

        {/* PWA Install Badges (Google Play & App Store styles) */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
          {/* Google Play Button */}
          <button
            type="button"
            onClick={() => handleInstallClick('android')}
            className="flex items-center gap-3 bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer text-left border border-black"
          >
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 512 512">
              <path fill="#4285F4" d="M32.5 13.5c-4.4 4.8-7 12.3-7 21.6v441.8c0 9.3 2.6 16.8 7 21.6l238.1-242.5L32.5 13.5z"/>
              <path fill="#FFBA00" d="M352.3 328.6l-81.7-83.1 81.7-83.1 93 53.4c26.4 15.2 26.4 40.1 0 55.3l-93 57.5z"/>
              <path fill="#FF3333" d="M270.6 245.5L32.5 498.5c7.3 7.8 19.3 8.7 32.7 1.1l287.1-171-81.7-83.1z"/>
              <path fill="#00D763" d="M352.3 162.4L65.2 12.4C51.8 4.8 39.8 5.7 32.5 13.5l238.1 232 81.7-83.1z"/>
            </svg>
            <div>
              <div className="text-[9px] uppercase tracking-wider font-semibold text-gray-300 leading-none">
                ANDROID APP ON
              </div>
              <div className="text-sm font-bold tracking-tight text-white leading-tight mt-0.5">
                Google Play
              </div>
            </div>
          </button>

          {/* App Store Button */}
          <button
            type="button"
            onClick={() => handleInstallClick('ios')}
            className="flex items-center gap-3 bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer text-left border border-black"
          >
            <svg className="w-6 h-6 fill-white shrink-0" viewBox="0 0 170 170">
              <path fill="currentColor" d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.66-7.79-11.89-14.24-7.29-11.08-13.06-23.77-17.3-38.08-4.24-14.31-6.36-27.18-6.36-38.6 0-14.42 3.86-26.47 11.59-36.14 7.73-9.67 17.51-14.64 29.34-14.92 5.01 0 10.55 1.25 16.63 3.75 6.08 2.5 10.27 3.85 12.56 4.05 2.07-.2 6.53-1.63 13.38-4.3 6.85-2.67 12.63-3.79 17.35-3.35 13.06.87 23.38 5.76 30.98 14.68-11.31 6.85-16.86 16.29-16.63 28.32.22 9.57 3.86 17.56 10.92 23.97 7.07 6.41 15.44 10.12 25.13 11.13-2.18 6.53-4.9 12.89-8.16 19.09l-1.95 2.96zm-27.28-113.88c0 4.13-1.25 8.32-3.75 12.56-2.5 4.24-5.93 7.67-10.3 10.3-3.48 2.18-7.39 3.59-11.75 4.24-.22-.87-.33-1.74-.33-2.61 0-4.13 1.3-8.37 3.91-12.72 2.61-4.35 6.14-7.77 10.6-10.27 3.37-1.96 7.18-3.26 11.42-3.91.11.87.2 1.67.2 2.41z"/>
            </svg>
            <div>
              <div className="text-[9px] tracking-wider font-medium text-gray-300 leading-none">
                Available on the
              </div>
              <div className="text-sm font-bold tracking-tight text-white leading-tight mt-0.5">
                App Store
              </div>
            </div>
          </button>
        </div>

        {/* Thin Divider Line */}
        <hr className="border-gray-200 mb-8 max-w-xl mx-auto" />

        {/* Wonderful Indonesia Logo */}
        <div className="flex justify-center mb-6">
          <img
            src={wonderfulImg}
            alt="Wonderful Indonesia"
            className="h-12 sm:h-14 w-auto object-contain"
          />
        </div>

        {/* Lucky Stay Logo */}
        <div className="flex justify-center mb-5">
          <img
            src="/logo.png"
            alt="Lucky Stay"
            className="h-12 sm:h-14 w-auto object-contain"
          />
        </div>

        {/* Copyright */}
        <p className="text-xs sm:text-sm font-semibold text-gray-800 mb-2">
          © PT. Lucky Stay Indonesia All rights reserved.
        </p>

        {/* Privacy & Terms */}
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-600 font-medium">
          <span className="hover:text-orange-600 cursor-pointer transition-colors">
            Kebijakan Privasi
          </span>
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shrink-0" />
          <span className="hover:text-orange-600 cursor-pointer transition-colors">
            Syarat & Ketentuan
          </span>
        </div>
      </div>
    </footer>
  );
}
