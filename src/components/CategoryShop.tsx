import { useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { CATEGORIES, PRODUCTS } from '../data/catalog';
import { CategoryId, Product, WeightOption } from '../types';
import { ProductCard } from './ProductCard';

interface CategoryShopProps {
  selectedCategory: CategoryId | 'all';
  onSelectCategory: (id: CategoryId | 'all') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOrderClick: (product: Product, selectedWeight: WeightOption) => void;
}

export function CategoryShop({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onOrderClick,
}: CategoryShopProps) {
  const categoryMap = useMemo(() => {
    const map = new Map<CategoryId, string>();
    CATEGORIES.forEach((cat) => map.set(cat.id, cat.name));
    return map;
  }, []);

  const activeCategoryObj = useMemo(
    () => CATEGORIES.find((c) => c.id === selectedCategory),
    [selectedCategory]
  );

  const hasSearch = searchQuery.trim().length > 0;

  // When searching, search across ALL 10 categories automatically for customer convenience
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PRODUCTS.filter((product) => {
      if (q) {
        const catName = categoryMap.get(product.categoryId)?.toLowerCase() ?? '';
        return (
          product.name.toLowerCase().includes(q) ||
          product.englishName.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q) ||
          catName.includes(q)
        );
      }
      return selectedCategory === 'all' || product.categoryId === selectedCategory;
    });
  }, [selectedCategory, searchQuery, categoryMap]);

  return (
    <section id="shop-section" className="py-12 lg:py-16 bg-[#FAFAF8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading & Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-xs font-semibold text-[#155E3F] tracking-wide mb-1.5">
              আমাদের ১০টি বিশেষ ক্যাটাগরি · ৫০০ গ্রাম ও ১ কেজি প্যাক
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#18201B]">
              {hasSearch
                ? `“${searchQuery.trim()}” খোঁজার ফলাফল`
                : activeCategoryObj
                  ? activeCategoryObj.name
                  : 'সকল ক্যাটাগরির পণ্য'}
            </h2>
            <p className="text-sm sm:text-base text-[#4B554E] mt-1">
              {hasSearch
                ? 'সকল ক্যাটাগরি থেকে মিল পাওয়া পণ্যগুলো নিচে দেখানো হয়েছে'
                : activeCategoryObj
                  ? activeCategoryObj.subtitle
                  : 'প্রতিটি ক্যাটাগরিতে বাছাইকৃত খাঁটি ও তাজা পণ্যের একক সংগ্রহ'}
            </p>
          </div>

          {/* Synced Shop Search Input */}
          <div className="relative w-full md:w-80">
            <Search
              className="w-4 h-4 text-[#6B746E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="পণ্য খুঁজুন (যেমন: ইলিশ, মধু, আখরোট)..."
              aria-label="পণ্য খুঁজুন"
              className="w-full pl-10 pr-9 py-2.5 rounded-lg border border-[#D4D2CA] bg-white text-sm text-[#18201B] placeholder:text-[#78827B] focus:outline-none focus:ring-2 focus:ring-[#155E3F] focus:border-[#155E3F]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="খোঁজা মুছুন"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#6B746E] hover:text-[#18201B]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 10 Category Filter Cards / Tabs */}
        <div
          role="tablist"
          aria-label="পণ্যের ১০টি ক্যাটাগরি"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2.5 mb-10"
        >
          {CATEGORIES.map((category) => {
            const isSelected = !hasSearch && selectedCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  if (hasSearch) onSearchChange('');
                  onSelectCategory(category.id);
                }}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155E3F] ${
                  isSelected
                    ? 'bg-[#155E3F] border-[#155E3F] text-white shadow-sm'
                    : 'bg-white border-[#E5E4DF] text-[#18201B] hover:border-[#155E3F]/50 hover:bg-[#F3F2EE]'
                }`}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-lg object-cover shrink-0 border border-black/10"
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{category.name}</div>
                  <div
                    className={`text-xs tabular-nums truncate ${
                      isSelected ? 'text-white/80' : 'text-[#57615A]'
                    }`}
                  >
                    {category.itemCountLabel}
                  </div>
                </div>
              </button>
            );
          })}

          <button
            type="button"
            role="tab"
            aria-selected={!hasSearch && selectedCategory === 'all'}
            onClick={() => {
              if (hasSearch) onSearchChange('');
              onSelectCategory('all');
            }}
            className={`flex items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155E3F] ${
              !hasSearch && selectedCategory === 'all'
                ? 'bg-[#18201B] border-[#18201B] text-white shadow-sm'
                : 'bg-[#F3F2EE] border-[#E5E4DF] text-[#18201B] hover:bg-[#E7E5DD]'
            }`}
          >
            <div>
              <div className="text-sm font-semibold">সকল পণ্য</div>
              <div
                className={`text-xs tabular-nums ${
                  !hasSearch && selectedCategory === 'all' ? 'text-white/80' : 'text-[#57615A]'
                }`}
              >
                {PRODUCTS.length}টি একক পণ্য
              </div>
            </div>
          </button>
        </div>

        {/* Active Category Result Count */}
        <div className="flex items-center justify-between gap-4 pb-4 mb-6 border-b border-[#E5E4DF] text-xs sm:text-sm text-[#57615A]">
          <span>
            দেখানো হচ্ছে{' '}
            <strong className="text-[#18201B] tabular-nums">{filteredProducts.length}</strong> টি
            পণ্য
            {hasSearch
              ? ` · সকল ক্যাটাগরিতে “${searchQuery.trim()}”`
              : activeCategoryObj
                ? ` · ${activeCategoryObj.name}`
                : ''}
          </span>
          {hasSearch ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="text-[#155E3F] font-medium hover:underline"
            >
              খোঁজা বাতিল করুন
            </button>
          ) : (
            selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => onSelectCategory('all')}
                className="text-[#155E3F] font-medium hover:underline"
              >
                সব ক্যাটাগরি একসাথে দেখুন
              </button>
            )
          )}
        </div>

        {/* 3-Column Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={categoryMap.get(product.categoryId) ?? ''}
                onOrderClick={onOrderClick}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#E5E4DF] rounded-xl p-10 text-center">
            <p className="text-base font-semibold text-[#18201B]">
              “{searchQuery}” নামে কোনো পণ্য পাওয়া যায়নি
            </p>
            <p className="text-sm text-[#57615A] mt-1 mb-4">
              অন্য নাম দিয়ে খুঁজুন অথবা সব ক্যাটাগরি দেখুন।
            </p>
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                onSelectCategory('all');
              }}
              className="px-4 py-2 rounded-lg bg-[#155E3F] text-white text-sm font-semibold hover:bg-[#0F472F] transition-colors"
            >
              সব পণ্য দেখুন
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
