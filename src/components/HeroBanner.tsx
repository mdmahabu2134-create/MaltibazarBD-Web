import { FormEvent } from 'react';
import { ArrowRight, MapPin, Phone, Search, ShieldCheck, Truck, X } from 'lucide-react';
import { BRAND_ASSETS, COMPANY_INFO } from '../data/catalog';
import { ActivePage } from '../types';

interface HeroBannerProps {
  onNavigate: (page: ActivePage) => void;
  onExploreShop: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (q?: string) => void;
}

const POPULAR_SEARCHES = ['ইলিশ', 'সরিষা ফুলের মধু', 'কাজুবাদাম', 'গাওয়া ঘি', 'আজওয়া খেজুর', 'তেলাপিয়া'];

export function HeroBanner({
  onNavigate,
  onExploreShop,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}: HeroBannerProps) {
  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearchSubmit();
  };

  return (
    <section className="border-b border-[#E5E4DF] bg-[#FAFAF8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 lg:pt-10 lg:pb-14">
        {/* Top Location & Hotline Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-[#E5E4DF]">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-[#4B554E]">
            <MapPin className="w-4 h-4 text-[#155E3F] shrink-0" aria-hidden="true" />
            <span>{COMPANY_INFO.address}</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#18201B] tabular-nums">
            <Phone className="w-4 h-4 text-[#155E3F] shrink-0" aria-hidden="true" />
            <span>{COMPANY_INFO.phones[0]}</span>
          </div>
        </div>

        {/* Prominent Customer Search Bar inside Banner */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E4DF] shadow-xs">
          <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="w-5 h-5 text-[#155E3F] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="পছন্দের পণ্য খুঁজুন (যেমন: ইলিশ, তেলাপিয়া, মধু, ঘি, কাজুবাদাম, খেজুর)..."
                aria-label="পছন্দের পণ্য খুঁজুন"
                className="w-full pl-12 pr-10 py-3 rounded-xl border border-[#D4D2CA] bg-[#FAFAF8] text-sm sm:text-base text-[#18201B] placeholder:text-[#78827B] focus:outline-none focus:ring-2 focus:ring-[#155E3F] focus:bg-white focus:border-[#155E3F] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="খোঁজা মুছুন"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#6B746E] hover:text-[#18201B]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#155E3F] text-white font-semibold text-sm sm:text-base hover:bg-[#0F472F] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#155E3F]"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              <span>পণ্য খুঁজুন</span>
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-[#57615A]">
            <span className="font-medium text-[#18201B]">জনপ্রিয়:</span>
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  onSearchChange(term);
                  onSearchSubmit(term);
                }}
                className="px-2.5 py-1 rounded-md bg-[#F3F2EE] hover:bg-[#E7E5DD] text-[#18201B] font-medium transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Editorial Split Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between py-2">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <img
                  src={BRAND_ASSETS.logo}
                  alt="Maltibazar BD লোগো"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover border border-[#E5E4DF]"
                />
                <div className="text-xs sm:text-sm text-[#57615A]">
                  <span className="font-semibold text-[#155E3F]">Maltibazar BD</span>
                  <span aria-hidden="true" className="mx-2">·</span>
                  <span>১০টি প্রিমিয়াম ক্যাটাগরি</span>
                  <span aria-hidden="true" className="mx-2">·</span>
                  <span>৫০০ গ্রাম ও ১ কেজি প্যাক</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[#18201B] leading-[1.2] mb-5">
                খাঁটি বাদাম, ড্রাই ফ্রুটস, মধু ও তাজা বাজার এখন এক ঠিকানায়
              </h1>

              <p className="text-base sm:text-lg text-[#4B554E] leading-relaxed max-w-xl mb-8">
                Maltibazar BD সরাসরি খামার, বাগান ও বিশ্বস্ত উৎস থেকে সংগ্রহ করে প্রিমিয়াম বাদাম,
                সীডস, খাঁটি মশলা, প্রাকৃতিক মধু, আরবের খেজুর, খাঁটি তেল-ঘি এবং ফরমালিনমুক্ত তাজা সবজি, মাছ ও গোস্ত।
              </p>

              {/* Primary Hero CTA + Orders */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <button
                  type="button"
                  onClick={onExploreShop}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#155E3F] text-white font-semibold text-base hover:bg-[#0F472F] transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#155E3F]"
                >
                  <span>Shop Now · পণ্য দেখুন</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('orders')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-[#D4D2CA] bg-white text-[#18201B] font-medium text-base hover:bg-[#F3F2EE] transition-colors duration-150 whitespace-nowrap shrink-0"
                >
                  <span>Orders · জমা থাকা অর্ডার</span>
                </button>
              </div>
            </div>

            {/* Banner Quick Section Buttons in English (Home, Shop, About, Contact) */}
            <div className="pt-5 border-t border-[#E5E4DF] flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-medium text-[#6B746E] mr-1">Quick Menu:</span>
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#F3F2EE] text-[#18201B] hover:bg-[#E7E5DD] transition-colors whitespace-nowrap shrink-0"
              >
                Home
              </button>
              <button
                type="button"
                onClick={onExploreShop}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#F3F2EE] text-[#18201B] hover:bg-[#E7E5DD] transition-colors whitespace-nowrap shrink-0"
              >
                Shop
              </button>
              <button
                type="button"
                onClick={() => onNavigate('about')}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#F3F2EE] text-[#18201B] hover:bg-[#E7E5DD] transition-colors whitespace-nowrap shrink-0"
              >
                About
              </button>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#F3F2EE] text-[#18201B] hover:bg-[#E7E5DD] transition-colors whitespace-nowrap shrink-0"
              >
                Contact
              </button>
            </div>
          </div>

          {/* Right Hero Image Container (All items showcased) */}
          <div className="lg:col-span-6">
            <div className="relative h-64 sm:h-80 lg:h-full min-h-[340px] rounded-2xl overflow-hidden border border-[#E5E4DF] bg-[#EFECE5]">
              <img
                src={BRAND_ASSETS.heroBanner}
                alt="Maltibazar BD — খাঁটি বাদাম, খেজুর, মধু, মশলা, মাছ, গোস্ত ও তাজা সবজির সমাহার"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
              />
              <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 text-white">
                <p className="text-xs sm:text-sm text-white/85 mb-1">
                  প্রতিদিন তাজা সংগ্রহ · ৫০০ গ্রাম ও ১ কেজি প্যাক · কুল-বক্স ডেলিভেরি
                </p>
                <p className="text-lg sm:text-xl font-semibold">
                  ২,০০০ টাকা বা তার বেশি অর্ডারে ফ্রি হোম ডেলিভেরি
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column Service Strip below Hero Split */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-[#E5E4DF]">
          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 text-[#155E3F] mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-[#18201B]">দ্রুত হোম ডেলিভেরি</p>
              <p className="text-xs text-[#57615A] mt-0.5">ঢাকায় ২৪ ঘণ্টা · সারা দেশে ৪৮-৭২ ঘণ্টায়</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#155E3F] mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-[#18201B]">১০০% খাঁটি ও নিরাপদ</p>
              <p className="text-xs text-[#57615A] mt-0.5">ফরমালিন ও কেমিক্যালমুক্ত নিশ্চয়তা</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-[#155E3F] mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-[#18201B]">সহজ পেমেন্ট ব্যবস্থা</p>
              <p className="text-xs text-[#57615A] mt-0.5">ক্যাশ অন ডেলিভেরি, বিকাশ, নগদ ও রকেট</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#155E3F] mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-[#18201B]">সরাসরি কাওরান বাজার হাব</p>
              <p className="text-xs text-[#57615A] mt-0.5">প্রতিদিন সকাল থেকে রাত অবধি সচল</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
