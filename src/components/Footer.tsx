import { BRAND_ASSETS, COMPANY_INFO } from '../data/catalog';
import { ActivePage } from '../types';

interface FooterProps {
  onNavigate: (page: ActivePage) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#18201B] text-[#D7DBD8] border-t border-[#29332D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-white/10">
          {/* Brand Summary */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={BRAND_ASSETS.logo}
                alt="Maltibazar BD Logo"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-lg object-cover border border-white/15"
              />
              <span className="font-display text-xl font-bold text-white">
                Maltibazar BD
              </span>
            </div>
            <p className="text-sm text-[#AEB6B0] leading-relaxed max-w-sm">
              {COMPANY_INFO.tagline}। খাঁটি বাদাম, ড্রাই ফ্রুটস, সীডস, মশলা, মধু, খেজুর, তাজা সবজি,
              নদীর মাছ এবং হালাল গোস্তের নির্ভরযোগ্য প্রতিষ্ঠান।
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="md:col-span-3 space-y-2.5">
            <h3 className="text-sm font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { id: 'home', label: 'Home' },
                { id: 'shop', label: 'Shop' },
                { id: 'orders', label: 'Orders' },
                { id: 'about', label: 'About' },
                { id: 'contact', label: 'Contact' },
              ].map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(link.id as ActivePage)}
                    className="text-[#AEB6B0] hover:text-white transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Location & Contact */}
          <div className="md:col-span-4 space-y-2.5 text-sm">
            <h3 className="text-sm font-semibold text-white">লোকেশন ও মোবাইল</h3>
            <p className="text-[#AEB6B0] leading-relaxed">{COMPANY_INFO.address}</p>
            <p className="text-[#AEB6B0] tabular-nums">
              মোবাইল: {COMPANY_INFO.phones.join(' / ')}
            </p>
            <p className="text-[#AEB6B0]">ইমেইল: {COMPANY_INFO.email}</p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8E9891]">
          <p>© {new Date().getFullYear()} Maltibazar BD। সর্বস্বত্ব সংরক্ষিত।</p>
          <p>পেমেন্ট: ক্যাশ অন ডেলিভেরি · বিকাশ · নগদ · রকেট</p>
        </div>
      </div>
    </footer>
  );
}
