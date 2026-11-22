import { CreditCard, Leaf, ShieldCheck, Truck } from 'lucide-react';
import { COMPANY_INFO } from '../data/catalog';

export function AboutDeliverySection() {
  return (
    <section id="about-section" className="py-14 lg:py-16 bg-white border-t border-[#E5E4DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* About Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-12 border-b border-[#E5E4DF]">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold text-[#155E3F] mb-2">
              আমাদের সম্পর্কে · এবাউট
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#18201B] leading-snug">
              Maltibazar BD — খাঁটি ও ভেজালমুক্ত খাদ্যপণ্যের নির্ভরযোগ্য প্রতিষ্ঠান
            </h2>
          </div>

          <div className="lg:col-span-7 space-y-4 text-sm sm:text-base text-[#4B554E] leading-relaxed">
            <p>
              প্রতিদিনের সুস্থ জীবনের জন্য খাঁটি ও নিরাপদ খাদ্যের বিকল্প নেই। এই বিশ্বাস থেকেই{' '}
              <strong className="text-[#18201B]">Maltibazar BD</strong> সরাসরি দেশের প্রত্যন্ত অঞ্চলের
              কৃষক, মৌয়াল, নদী ও হাওরের জেলে এবং বিশ্বস্ত আমদানিকারকদের কাছ থেকে বাছাইকৃত পণ্য সংগ্রহ
              করে ক্রেতাদের দোরগোড়ায় পৌঁছে দেয়।
            </p>
            <p>
              আমাদের প্রতিটি ক্যাটাগরির পণ্য—বাদাম, ড্রাই ফ্রুটস, সীডস, মশলা, মধু, খেজুর, তাজা সবজি,
              মাছ, গোস্ত ও তেল-ঘি—কঠোর মান নিয়ন্ত্রণের মাধ্যমে পরিচ্ছন্ন ও স্বাস্থ্যসম্মতভাবে প্যাকেটজাত
              করা হয়।
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3">
                <Leaf className="w-5 h-5 text-[#155E3F] mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold text-[#18201B]">সরাসরি উৎস থেকে সংগ্রহ</h3>
                  <p className="text-xs text-[#57615A] mt-0.5">
                    কোনো মধ্যস্বত্বভোগী ছাড়াই খাঁটি মধু, ঘি ও তাজা সবজি সংগ্রহ।
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#155E3F] mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold text-[#18201B]">১০০% ফরমালিন ও কেমিক্যালমুক্ত</h3>
                  <p className="text-xs text-[#57615A] mt-0.5">
                    মাছ, গোস্ত ও ফলে কোনো ক্ষতিকর সংরক্ষণ রাসায়নিক ব্যবহার করা হয় না।
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment System & Delivery System */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
          {/* Payment System */}
          <div className="bg-[#FAFAF8] border border-[#E5E4DF] rounded-2xl p-6 sm:p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#155E3F]/10 text-[#155E3F] flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#18201B]">পেমেন্ট সিস্টেম</h3>
                <p className="text-xs text-[#57615A]">নিরাপদ ও ঝামেলামুক্ত লেনদেন</p>
              </div>
            </div>

            <ul className="space-y-3 text-sm text-[#4B554E]">
              <li className="pb-3 border-b border-[#E5E4DF]">
                <strong className="text-[#18201B] block">ক্যাশ অন ডেলিভেরি (COD)</strong>
                পণ্য হাতে বুঝে পেয়ে যাচাই করার পর ডেলিভেরি প্রতিনিধির কাছে নগদ অর্থ পরিশোধ করার সুবিধা।
              </li>
              <li className="pb-3 border-b border-[#E5E4DF]">
                <strong className="text-[#18201B] block">বিকাশ, নগদ ও রকেট মোবাইল ব্যাংকিং</strong>
                বিকাশ: <span className="tabular-nums font-medium">{COMPANY_INFO.bkashNumber}</span> ·
                নগদ: <span className="tabular-nums font-medium">{COMPANY_INFO.nagadNumber}</span> ·
                রকেট: <span className="tabular-nums font-medium">{COMPANY_INFO.rocketNumber}</span>
              </li>
              <li>
                <strong className="text-[#18201B] block">কর্পোরেট ও বাল্ক অর্ডার পেমেন্ট</strong>
                বড় পরিমাণ অর্ডারের জন্য সরাসরি ব্যাংক ট্রান্সফার ও অফিসিয়াল ইনভয়েস সুবিধা রয়েছে।
              </li>
            </ul>
          </div>

          {/* Delivery System */}
          <div className="bg-[#FAFAF8] border border-[#E5E4DF] rounded-2xl p-6 sm:p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#155E3F]/10 text-[#155E3F] flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#18201B]">ডেলিভেরি সিস্টেম</h3>
                <p className="text-xs text-[#57615A]">ঢাকা ও সারা বাংলাদেশে দ্রুত হোম ডেলিভেরি</p>
              </div>
            </div>

            <ul className="space-y-3 text-sm text-[#4B554E]">
              <li className="pb-3 border-b border-[#E5E4DF]">
                <strong className="text-[#18201B] block">ঢাকা মেট্রো এলাকা (২৪ ঘণ্টার মধ্যে)</strong>
                ঢাকার ভিতরে দ্রুত নিজস্ব রাইডারের মাধ্যমে হোম ডেলিভেরি। ডেলিভেরি চার্জ মাত্র{' '}
                <span className="tabular-nums font-semibold text-[#18201B]">৬০ টাকা</span>।
              </li>
              <li className="pb-3 border-b border-[#E5E4DF]">
                <strong className="text-[#18201B] block">সারা বাংলাদেশ (৪৮–৭২ ঘণ্টা)</strong>
                ঢাকার বাইরে ৬৪ জেলায় বিশ্বস্ত কুরিয়ার সার্ভিসের মাধ্যমে নিরাপদ পার্সেল ডেলিভেরি। চার্জ{' '}
                <span className="tabular-nums font-semibold text-[#18201B]">১২০ টাকা</span>।
              </li>
              <li>
                <strong className="text-[#18201B] block">ফ্রি ডেলিভেরি ও কুল-বক্স প্যাকেজিং</strong>
                <span className="tabular-nums font-semibold text-[#155E3F]">২,০০০ টাকা</span> বা তার
                বেশি অর্ডারে ডেলিভেরি সম্পূর্ণ ফ্রি। মাছ ও গোস্ত ইনসুলেটেড কুল-বক্সে পাঠানো হয়।
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
