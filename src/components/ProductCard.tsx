import { useState } from 'react';
import { PackageCheck, ShoppingCart } from 'lucide-react';
import { Product, WeightOption } from '../types';

interface ProductCardProps {
  product: Product;
  categoryName: string;
  onOrderClick: (product: Product, selectedWeight: WeightOption) => void;
}

export function ProductCard({ product, categoryName, onOrderClick }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [selectedWeight, setSelectedWeight] = useState<WeightOption>(product.unitLabel);

  const activeVariant =
    product.variants.find((v) => v.label === selectedWeight) ?? product.variants[0];

  return (
    <article className="group bg-white border border-[#E5E4DF] rounded-xl overflow-hidden flex flex-col transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      {/* 4:3 Product Media Slot with Zero-Broken-Image Fallback */}
      <div className="relative aspect-[4/3] bg-[#F3F2EE] overflow-hidden border-b border-[#EFECE5]">
        {!imageError ? (
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#F3F2EE] to-[#E6E3DA]">
            <PackageCheck className="w-10 h-10 text-[#155E3F] mb-2" aria-hidden="true" />
            <span className="text-sm font-semibold text-[#18201B]">{product.name}</span>
            <span className="text-xs text-[#57615A] mt-1">{categoryName}</span>
          </div>
        )}
      </div>

      {/* Product Body (Consistent field order across all cards) */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Clean Unboxed Metadata (Zero-Pill Discipline) */}
          <div className="flex items-center gap-1.5 text-xs text-[#57615A] mb-1.5">
            <span className="font-medium text-[#155E3F]">{categoryName}</span>
            <span aria-hidden="true">·</span>
            <span>৫০০ গ্রাম ও ১ কেজি</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{product.origin}</span>
          </div>

          <div className="flex items-baseline justify-between gap-3 mb-2">
            <h3 className="text-lg font-semibold text-[#18201B] leading-snug">
              {product.name}
            </h3>
            <span className="text-lg font-bold text-[#155E3F] tabular-nums whitespace-nowrap shrink-0">
              ৳ {activeVariant.price.toLocaleString('bn-BD')}
            </span>
          </div>

          <p className="text-sm text-[#4B554E] leading-relaxed mb-4">
            {product.description}
          </p>
        </div>

        <div className="space-y-3">
          {/* Interactive 500g / 1kg Quantity Options */}
          <div className="grid grid-cols-2 gap-2" role="group" aria-label={`${product.name} পরিমাণ`}>
            {product.variants.map((variant) => {
              const isActive = variant.label === selectedWeight;
              return (
                <button
                  key={variant.label}
                  type="button"
                  onClick={() => setSelectedWeight(variant.label)}
                  aria-pressed={isActive}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors tabular-nums flex items-center justify-between gap-1 ${
                    isActive
                      ? 'border-[#155E3F] bg-[#155E3F]/8 text-[#155E3F] font-semibold'
                      : 'border-[#E5E4DF] bg-[#FAFAF8] text-[#4B554E] hover:bg-[#F3F2EE]'
                  }`}
                >
                  <span>{variant.label}</span>
                  <span>৳ {variant.price.toLocaleString('bn-BD')}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onOrderClick(product, activeVariant.label)}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#155E3F] text-white text-sm font-semibold hover:bg-[#0F472F] active:scale-[0.99] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#155E3F]"
          >
            <ShoppingCart className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>অর্ডার করুন ({activeVariant.label})</span>
          </button>
        </div>
      </div>
    </article>
  );
}
