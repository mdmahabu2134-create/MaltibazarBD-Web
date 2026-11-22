import { FormEvent, useState } from 'react';
import { CheckCircle2, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { COMPANY_INFO } from '../data/catalog';

export function ContactSection() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;
    setSent(true);
    setName('');
    setPhone('');
    setMessage('');
  };

  return (
    <section id="contact-section" className="py-14 lg:py-16 bg-[#FAFAF8] border-t border-[#E5E4DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Company Location & Contact Details */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <p className="text-xs font-semibold text-[#155E3F] mb-1.5">
                যোগাযোগ ও ঠিকানা · কন্টাক্ট
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#18201B]">
                আমাদের সাথে যোগাযোগ করুন
              </h2>
              <p className="text-sm sm:text-base text-[#4B554E] mt-1.5">
                যেকোনো পণ্য সম্পর্কে জানতে, পাইকারি অর্ডার দিতে কিংবা ডেলিভেরি সংক্রান্ত সহায়তার জন্য সরাসরি কল করুন।
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <MapPin className="w-5 h-5 text-[#155E3F] mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-sm font-semibold text-[#18201B]">প্রধান অফিস ও সেলস হাব</div>
                  <div className="text-sm text-[#4B554E] mt-0.5">{COMPANY_INFO.address}</div>
                  <div className="text-xs text-[#57615A] mt-0.5">
                    ডিস্ট্রিবিউশন পয়েন্ট: {COMPANY_INFO.warehouseAddress}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <Phone className="w-5 h-5 text-[#155E3F] mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-sm font-semibold text-[#18201B]">মোবাইল নাম্বার (হটলাইন)</div>
                  <div className="text-sm text-[#4B554E] tabular-nums mt-0.5 space-y-0.5">
                    <div>{COMPANY_INFO.phones[0]} (অর্ডার ও কাস্টমার কেয়ার)</div>
                    <div>{COMPANY_INFO.phones[1]} (হোয়াটসঅ্যাপ ও কর্পোরেট)</div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <Mail className="w-5 h-5 text-[#155E3F] mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-sm font-semibold text-[#18201B]">ইমেইল</div>
                  <div className="text-sm text-[#4B554E] mt-0.5">{COMPANY_INFO.email}</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <Clock className="w-5 h-5 text-[#155E3F] mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-sm font-semibold text-[#18201B]">সার্ভিস সময়</div>
                  <div className="text-sm text-[#4B554E] mt-0.5">{COMPANY_INFO.hours}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Message Form */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-[#E5E4DF] rounded-2xl p-6 sm:p-8">
              <h3 className="text-lg font-bold text-[#18201B] mb-1">সরাসরি বার্তা পাঠান</h3>
              <p className="text-xs text-[#57615A] mb-5">
                আপনার প্রশ্ন বা মতামত লিখে পাঠালে আমাদের প্রতিনিধি দ্রুত যোগাযোগ করবেন।
              </p>

              {sent ? (
                <div className="p-6 rounded-xl bg-[#FAFAF8] border border-[#E5E4DF] text-center">
                  <CheckCircle2 className="w-10 h-10 text-[#155E3F] mx-auto mb-2" aria-hidden="true" />
                  <p className="text-base font-semibold text-[#18201B]">
                    আপনার বার্তা সফলভাবে পাঠানো হয়েছে!
                  </p>
                  <p className="text-sm text-[#4B554E] mt-1 mb-4">
                    Maltibazar BD টিম শীঘ্রই আপনার মোবাইল নাম্বারে যোগাযোগ করবে।
                  </p>
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="px-4 py-2 rounded-lg bg-[#155E3F] text-white text-xs font-semibold hover:bg-[#0F472F]"
                  >
                    নতুন বার্তা লিখুন
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-name" className="block text-sm font-medium text-[#18201B] mb-1">
                        আপনার নাম *
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="আপনার পূর্ণ নাম"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4D2CA] text-sm text-[#18201B] focus:outline-none focus:ring-2 focus:ring-[#155E3F]"
                      />
                    </div>

                    <div>
                      <label htmlFor="contact-phone" className="block text-sm font-medium text-[#18201B] mb-1">
                        মোবাইল নাম্বার *
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="০১৭১২-XXXXXX"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4D2CA] text-sm text-[#18201B] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#155E3F]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-msg" className="block text-sm font-medium text-[#18201B] mb-1">
                      বার্তা *
                    </label>
                    <textarea
                      id="contact-msg"
                      rows={4}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="আপনার প্রয়োজনীয় পণ্য বা প্রশ্ন সম্পর্কে বিস্তারিত লিখুন..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4D2CA] text-sm text-[#18201B] focus:outline-none focus:ring-2 focus:ring-[#155E3F]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg bg-[#155E3F] text-white text-sm font-semibold hover:bg-[#0F472F] transition-colors"
                  >
                    বার্তা পাঠান
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
