import { FormEvent, useState } from 'react';
import { CheckCircle2, Minus, Plus, X } from 'lucide-react';
import { CATEGORIES, COMPANY_INFO } from '../data/catalog';
import { DeliveryZone, Order, PaymentMethod, Product, WeightOption } from '../types';

interface OrderModalProps {
  product: Product | null;
  initialWeight?: WeightOption;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
  onViewOrdersPage: () => void;
}

export function OrderModal({
  product,
  initialWeight,
  onClose,
  onOrderCreated,
  onViewOrdersPage,
}: OrderModalProps) {
  const [selectedWeight, setSelectedWeight] = useState<WeightOption>(
    initialWeight ?? product?.unitLabel ?? '৫০০ গ্রাম'
  );
  const [quantity, setQuantity] = useState(1);
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone>('dhaka');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [transactionId, setTransactionId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  if (!product) return null;

  const activeVariant =
    product.variants.find((v) => v.label === selectedWeight) ?? product.variants[0];

  const categoryName =
    CATEGORIES.find((c) => c.id === product.categoryId)?.name ?? '';

  const subtotal = activeVariant.price * quantity;
  const isFreeDelivery = subtotal >= COMPANY_INFO.freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery
    ? 0
    : deliveryZone === 'dhaka'
      ? COMPANY_INFO.dhakaDeliveryFee
      : COMPANY_INFO.outsideDhakaDeliveryFee;
  const totalAmount = subtotal + deliveryFee;

  const paymentNumber =
    paymentMethod === 'bkash'
      ? COMPANY_INFO.bkashNumber
      : paymentMethod === 'nagad'
        ? COMPANY_INFO.nagadNumber
        : paymentMethod === 'rocket'
          ? COMPANY_INFO.rocketNumber
          : '';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setErrorMsg('অনুগ্রহ করে আপনার নাম, মোবাইল নাম্বার এবং সম্পূর্ণ ঠিকানা লিখুন।');
      return;
    }

    if (paymentMethod !== 'cod' && !transactionId.trim()) {
      setErrorMsg('মোবাইল ব্যাংকিং পেমেন্টের জন্য ট্রানজেকশন আইডি (TrxID) লিখুন।');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          productImage: product.image,
          categoryName,
          unitLabel: activeVariant.label,
          unitPrice: activeVariant.price,
          quantity,
          deliveryZone,
          paymentMethod,
          transactionId: paymentMethod !== 'cod' ? transactionId.trim() : undefined,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim(),
          note: note.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.order) {
        throw new Error(data.error || 'অর্ডার জমা দিতে সমস্যা হয়েছে।');
      }

      onOrderCreated(data.order);
      setConfirmedOrder(data.order);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'অর্ডার সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-[#E5E4DF] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E4DF] bg-[#FAFAF8]">
          <div>
            <h2 id="order-modal-title" className="text-lg font-bold text-[#18201B]">
              {confirmedOrder ? 'অর্ডার সফলভাবে সম্পন্ন হয়েছে' : 'দ্রুত অর্ডার ফর্ম'}
            </h2>
            <p className="text-xs text-[#57615A]">Maltibazar BD · নিরাপদ চেকআউট</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-[#E5E4DF] bg-white text-[#4B554E] hover:text-[#18201B] hover:bg-[#F3F2EE] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6">
          {confirmedOrder ? (
            <div className="text-center py-4">
              <CheckCircle2
                className="w-14 h-14 text-[#155E3F] mx-auto mb-3"
                aria-hidden="true"
              />
              <h3 className="text-xl font-bold text-[#18201B]">
                ধন্যবাদ, {confirmedOrder.customerName}!
              </h3>
              <p className="text-sm text-[#4B554E] mt-1">
                আপনার অর্ডারটি <strong className="text-[#155E3F]">{confirmedOrder.orderNumber}</strong>{' '}
                নম্বরে আমাদের অর্ডার পেজে জমা রাখা হয়েছে।
              </p>

              <div className="mt-6 text-left bg-[#FAFAF8] border border-[#E5E4DF] rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#57615A]">পণ্য:</span>
                  <span className="font-semibold text-[#18201B]">
                    {confirmedOrder.productName} ({confirmedOrder.quantity} ×{' '}
                    {confirmedOrder.unitLabel})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57615A]">মোবাইল:</span>
                  <span className="font-medium text-[#18201B] tabular-nums">
                    {confirmedOrder.customerPhone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57615A]">ঠিকানা:</span>
                  <span className="font-medium text-[#18201B] text-right max-w-xs">
                    {confirmedOrder.customerAddress}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E5E4DF]">
                  <span className="font-semibold text-[#18201B]">সর্বমোট বিল:</span>
                  <span className="font-bold text-[#155E3F] tabular-nums">
                    ৳ {confirmedOrder.totalAmount.toLocaleString('bn-BD')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewOrdersPage();
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#155E3F] text-white text-sm font-semibold hover:bg-[#0F472F] transition-colors"
                >
                  অর্ডার পেজে দেখুন
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-[#D4D2CA] bg-white text-[#18201B] text-sm font-medium hover:bg-[#F3F2EE] transition-colors"
                >
                  আরও কেনাকাটা করুন
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Selected Product Summary */}
              <div className="flex items-center gap-4 p-3.5 rounded-xl bg-[#FAFAF8] border border-[#E5E4DF]">
                <img
                  src={product.image}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-16 rounded-lg object-cover border border-[#E5E4DF] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[#57615A]">
                    {categoryName} · {activeVariant.label}
                  </div>
                  <h3 className="text-base font-bold text-[#18201B] truncate">{product.name}</h3>
                  <div className="text-sm font-semibold text-[#155E3F] tabular-nums">
                    ৳ {activeVariant.price.toLocaleString('bn-BD')} / {activeVariant.label}
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="পরিমাণ কমান"
                    className="w-8 h-8 inline-flex items-center justify-center rounded-md border border-[#D4D2CA] bg-white text-[#18201B] hover:bg-[#F3F2EE]"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm font-bold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="পরিমাণ বাড়ান"
                    className="w-8 h-8 inline-flex items-center justify-center rounded-md border border-[#D4D2CA] bg-white text-[#18201B] hover:bg-[#F3F2EE]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Weight Variant Selector (৫০০ গ্রাম / ১ কেজি) */}
              <div>
                <span className="block text-sm font-medium text-[#18201B] mb-1.5">
                  প্যাকের পরিমাণ নির্বাচন করুন (৫০০ গ্রাম / ১ কেজি)
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {product.variants.map((variant) => {
                    const isSelected = variant.label === activeVariant.label;
                    return (
                      <button
                        key={variant.label}
                        type="button"
                        onClick={() => setSelectedWeight(variant.label)}
                        className={`p-3 rounded-lg border text-left text-sm transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'border-[#155E3F] bg-[#155E3F]/8 text-[#18201B] font-semibold'
                            : 'border-[#E5E4DF] bg-white text-[#4B554E] hover:bg-[#FAFAF8]'
                        }`}
                      >
                        <span>{variant.label}</span>
                        <span className="tabular-nums text-[#155E3F] font-bold">
                          ৳ {variant.price.toLocaleString('bn-BD')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="customer-name"
                    className="block text-sm font-medium text-[#18201B] mb-1"
                  >
                    আপনার নাম *
                  </label>
                  <input
                    id="customer-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="যেমন: মোঃ মাহবুবুর রহমান"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4D2CA] text-sm text-[#18201B] focus:outline-none focus:ring-2 focus:ring-[#155E3F]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="customer-phone"
                    className="block text-sm font-medium text-[#18201B] mb-1"
                  >
                    মোবাইল নাম্বার *
                  </label>
                  <input
                    id="customer-phone"
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="০১৭১২-XXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D4D2CA] text-sm text-[#18201B] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#155E3F]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="customer-address"
                  className="block text-sm font-medium text-[#18201B] mb-1"
                >
                  ডেলিভেরি ঠিকানা *
                </label>
                <textarea
                  id="customer-address"
                  required
                  rows={2}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="বাসা/হোল্ডিং নম্বর, রোড, এলাকা ও জেলার নাম লিখুন"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D4D2CA] text-sm text-[#18201B] focus:outline-none focus:ring-2 focus:ring-[#155E3F]"
                />
              </div>

              {/* Delivery Area Selection */}
              <div>
                <span className="block text-sm font-medium text-[#18201B] mb-1.5">
                  ডেলিভেরি এলাকা (২,০০০+ টাকায় ডেলিভেরি ফ্রি)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeliveryZone('dhaka')}
                    className={`p-3 rounded-lg border text-left text-sm transition-colors ${
                      deliveryZone === 'dhaka'
                        ? 'border-[#155E3F] bg-[#155E3F]/5 text-[#18201B] font-semibold'
                        : 'border-[#E5E4DF] bg-white text-[#4B554E] hover:bg-[#FAFAF8]'
                    }`}
                  >
                    <div>ঢাকার ভিতরে (২৪ ঘণ্টায়)</div>
                    <div className="text-xs text-[#57615A] tabular-nums mt-0.5">
                      চার্জ: {isFreeDelivery ? 'ফ্রি' : '৳ ৬০'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryZone('outside')}
                    className={`p-3 rounded-lg border text-left text-sm transition-colors ${
                      deliveryZone === 'outside'
                        ? 'border-[#155E3F] bg-[#155E3F]/5 text-[#18201B] font-semibold'
                        : 'border-[#E5E4DF] bg-white text-[#4B554E] hover:bg-[#FAFAF8]'
                    }`}
                  >
                    <div>ঢাকার বাইরে (সারা বাংলাদেশ)</div>
                    <div className="text-xs text-[#57615A] tabular-nums mt-0.5">
                      চার্জ: {isFreeDelivery ? 'ফ্রি' : '৳ ১২০'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <span className="block text-sm font-medium text-[#18201B] mb-1.5">
                  পেমেন্ট পদ্ধতি নির্বাচন করুন
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'cod', label: 'ক্যাশ অন ডেলিভেরি' },
                    { id: 'bkash', label: 'বিকাশ (bKash)' },
                    { id: 'nagad', label: 'নগদ (Nagad)' },
                    { id: 'rocket', label: 'রকেট (Rocket)' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-semibold text-center transition-colors ${
                        paymentMethod === method.id
                          ? 'border-[#155E3F] bg-[#155E3F] text-white'
                          : 'border-[#E5E4DF] bg-white text-[#18201B] hover:bg-[#F3F2EE]'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>

                {paymentMethod !== 'cod' && (
                  <div className="mt-3 p-3.5 rounded-lg bg-[#FAFAF8] border border-[#E5E4DF] space-y-2.5">
                    <p className="text-xs text-[#4B554E]">
                      অনুগ্রহ করে{' '}
                      <strong className="text-[#18201B] tabular-nums">{paymentNumber}</strong>{' '}
                      নম্বরে{' '}
                      <strong className="text-[#155E3F] tabular-nums">
                        ৳ {totalAmount.toLocaleString('bn-BD')}
                      </strong>{' '}
                      সেন্ড মানি / পেমেন্ট করে নিচের ঘরে TrxID লিখুন।
                    </p>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="ট্রানজেকশন আইডি (যেমন: 9K7A21BC45)"
                      className="w-full px-3 py-2 rounded-lg border border-[#D4D2CA] bg-white text-sm text-[#18201B] focus:outline-none focus:ring-2 focus:ring-[#155E3F]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="order-note" className="block text-sm font-medium text-[#18201B] mb-1">
                  বিশেষ নির্দেশনা (ঐচ্ছিক)
                </label>
                <input
                  id="order-note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="যেমন: মাছ কেটে দেবেন বা বিকালে ডেলিভেরি দেবেন"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D4D2CA] text-sm text-[#18201B] focus:outline-none focus:ring-2 focus:ring-[#155E3F]"
                />
              </div>

              {/* Order Total Breakdown */}
              <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E5E4DF] space-y-1.5 text-sm">
                <div className="flex justify-between text-[#4B554E]">
                  <span>
                    পণ্যের মূল্য ({quantity} × {activeVariant.label}):
                  </span>
                  <span className="tabular-nums font-medium text-[#18201B]">
                    ৳ {subtotal.toLocaleString('bn-BD')}
                  </span>
                </div>
                <div className="flex justify-between text-[#4B554E]">
                  <span>ডেলিভেরি চার্জ:</span>
                  <span className="tabular-nums font-medium text-[#18201B]">
                    {isFreeDelivery ? 'ফ্রি' : `৳ ${deliveryFee.toLocaleString('bn-BD')}`}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E5E4DF] text-base font-bold text-[#18201B]">
                  <span>সর্বমোট পরিশোধযোগ্য:</span>
                  <span className="tabular-nums text-[#155E3F]">
                    ৳ {totalAmount.toLocaleString('bn-BD')}
                  </span>
                </div>
              </div>

              {errorMsg && (
                <p
                  role="alert"
                  className="text-sm text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3.5 py-2.5"
                >
                  {errorMsg}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-lg border border-[#D4D2CA] bg-white text-sm font-medium text-[#18201B] hover:bg-[#F3F2EE]"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-lg bg-[#155E3F] text-white text-sm font-semibold hover:bg-[#0F472F] disabled:opacity-60 transition-colors"
                >
                  {submitting ? 'অর্ডার জমা হচ্ছে...' : 'অর্ডার নিশ্চিত করুন'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
