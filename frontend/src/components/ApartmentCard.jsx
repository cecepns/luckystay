import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bed, ChevronLeft, ChevronRight, Percent } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import ImageWithFallback from './ImageWithFallback';

export default function ApartmentCard({ property }) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const images = property.images && property.images.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'];

  const nextImage = (e) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    setCurrentImgIndex((prev) => (prev + 1) % images.length); 
  };
  
  const prevImage = (e) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length); 
  };

  // Discount calculation
  const price = Number(property.price_per_night);
  let originalPrice = property.original_price ? Number(property.original_price) : null;
  let discountPercent = property.discount_percent ? Number(property.discount_percent) : 0;

  if (originalPrice && originalPrice > price && !discountPercent) {
    discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
  } else if (discountPercent > 0 && !originalPrice) {
    originalPrice = Math.round(price / (1 - discountPercent / 100));
  }

  const hasDiscount = discountPercent > 0 && originalPrice && originalPrice > price;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col h-full relative">
      
      {/* Media & Badges Wrapper with strict max-height for uniform cards */}
      <div className="relative h-48 sm:h-52 max-h-52 w-full shrink-0">
        {/* Clipped Image Container */}
        <div className="w-full h-full max-h-full overflow-hidden bg-gray-100 rounded-t-2xl relative">
          <ImageWithFallback
            src={images[currentImgIndex]}
            alt={property.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            containerClassName="w-full h-full"
            loading="lazy"
          />

          {/* Carousel arrows */}
          {images.length > 1 && (
            <>
              <button 
                type="button"
                onClick={prevImage} 
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-md flex items-center justify-center z-10 cursor-pointer" 
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                type="button"
                onClick={nextImage} 
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-md flex items-center justify-center z-10 cursor-pointer" 
                aria-label="Next image"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
                {images.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all ${idx === currentImgIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} 
                  />
                ))}
              </div>
            </>
          )}

          {/* Location Pill (Top-Left) */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-gray-800 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1 z-10">
            <MapPin className="w-3.5 h-3.5 text-gray-600" />
            <span className="truncate max-w-[130px]">{property.location || property.city}</span>
          </div>
        </div>

        {/* Bottom Overlapping Badges (Discount Ribbon + Room Type Pill) - OUTSIDE clipped image container */}
        <div className="absolute -bottom-3.5 left-0 right-0 px-3 flex items-center justify-between pointer-events-none z-20">
          {/* Left Ribbon: Hemat X% */}
          {hasDiscount ? (
            <div className="flex items-center gap-1.5 bg-[#d93a3a] text-white text-[11px] font-extrabold px-3 py-1.5 rounded-md shadow-md">
              <Percent className="w-3 h-3 stroke-[2.5]" />
              <span>Hemat {discountPercent}%</span>
            </div>
          ) : (
            <div />
          )}

          {/* Right Pill: Unit Type & Bedroom */}
          <div className="flex items-center gap-1.5 bg-white text-gray-800 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md border border-gray-100">
            <Bed className="w-3.5 h-3.5 text-red-500" />
            <span>{property.type ? property.type : `${property.bedrooms || 1} Kamar`}</span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="pt-6 pb-4 px-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <Link to={`/apartment/${property.slug || property.id}`}>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-1 hover:text-orange-600 transition-colors">
              {property.name}
            </h3>
          </Link>

          {/* Thin Divider */}
          <hr className="border-gray-100 my-2.5" />
        </div>

        {/* Pricing Area */}
        <div className="mt-1">
          {hasDiscount ? (
            <div>
              {/* Normal Strikethrough Price + Discount Tag */}
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-gray-400 line-through font-medium">
                  IDR {formatRupiah(originalPrice).replace('Rp ', '')}
                </span>
                <span className="text-xs font-bold text-emerald-600">
                  {discountPercent}% OFF
                </span>
              </div>

              {/* Highlighted Discounted Price */}
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-black text-red-500 tracking-tight">
                  IDR {formatRupiah(price).replace('Rp ', '')}
                </span>
                <span className="text-xs font-semibold text-gray-400">
                  / Bulan
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-[11px] text-gray-400 font-medium mb-0.5">Mulai dari</div>
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-bold text-orange-600 tracking-tight">
                  IDR {formatRupiah(price).replace('Rp ', '')}
                </span>
                <span className="text-xs font-semibold text-gray-400">
                  / malam
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
