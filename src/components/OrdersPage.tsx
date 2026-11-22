import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Package,
  Search,
  ShoppingBag,
  Trash2,
  Truck,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface OrdersPageProps {
  orders: Order[];
  loading: boolean;
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onBackToShop: () => void;
}

const STATUS_META: Record<
  OrderStatus,
  { label: string; colorClass: string; Icon: typeof Clock }
> = {
  pending: {
    label: 'অর্ডার গৃহীত',
    colorClass: 'text-[#B45309]',
    Icon: Clock,
  },
  processing: {
    label: 'প্যাকেজিং চলছে',
    colorClass: 'text-[#1D4ED8]',
    Icon: Package,
  },
  shipped: {
    label: 'ডেলিভারির পথে',
    colorClass: 'text-[#0F766E]',
    Icon: Truck,
  },
  delivered: {
    label: 'ডেলিভারি সম্পন্ন',
    colorClass: 'text-[#155E3F]',
    Icon: CheckCircle2,
  },
};

const PAYMENT_LABEL: Record<Order['paymentMethod'], string> = {
  cod: 'ক্যাশ অন ডেলিভেরি',
  bkash: 'বিকাশ (bKash)',
  nagad: 'নগদ (Nagad)',
  rocket: 'রকেট (Rocket)',
};

export function OrdersPage({
  orders,
  loading,
  onUpdateStatus,
  onDeleteOrder,
  onBackToShop,
}: OrdersPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (!q) return true;
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.toLowerCase().includes(q) ||
        order.productName.toLowerCase().includes(q)
      );
    });
  }, [orders, searchTerm, statusFilter]);

  const totalOrderValue = useMemo(
    () => orders.reduce((sum, item) => sum + item.totalAmount, 0),
    [orders]
  );

  const pendingCount = useMemo(
    () => orders.filter((o) => o.status !== 'delivered').length,
    [orders]
  );

  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('bn-BD', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <section className="py-10 lg:py-14 bg-[#FAFAF8] min-h-[70vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#E5E4DF]">
          <div>
            <p className="text-xs font-semibold text-[#155E3F] mb-1">
              Maltibazar BD · অর্ডার ম্যানেজমেন্ট
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#18201B]">
              জমা থাকা অর্ডার সমূহ
            </h1>
            <p className="text-sm sm:text-base text-[#4B554E] mt-1">
              কাস্টমারদের করা সকল অর্ডার এখানে সংরক্ষিত থাকে। অর্ডার নাম্বার বা মোবাইল দিয়ে খুঁজুন এবং ডেলিভেরি স্ট্যাটাস আপডেট করুন।
            </p>
          </div>

          {/* Summary Totals (Clean unboxed tabular figures) */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-8 text-sm">
            <div>
              <div className="text-xs text-[#57615A]">মোট অর্ডার</div>
              <div className="text-xl font-bold text-[#18201B] tabular-nums">
                {orders.length.toLocaleString('bn-BD')} টি
              </div>
            </div>
            <div>
              <div className="text-xs text-[#57615A]">চলমান অর্ডার</div>
              <div className="text-xl font-bold text-[#B45309] tabular-nums">
                {pendingCount.toLocaleString('bn-BD')} টি
              </div>
            </div>
            <div>
              <div className="text-xs text-[#57615A]">সর্বমোট অর্ডার মূল্য</div>
              <div className="text-xl font-bold text-[#155E3F] tabular-nums">
                ৳ {totalOrderValue.toLocaleString('bn-BD')}
              </div>
            </div>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 my-6">
          <div className="relative flex-1 max-w-md">
            <Search
              className="w-4 h-4 text-[#6B746E] absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="অর্ডার নং (MB-1001), নাম বা মোবাইল নাম্বার দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#D4D2CA] bg-white text-sm text-[#18201B] focus:outline-none focus:ring-2 focus:ring-[#155E3F]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-[#EFECE5] p-1 rounded-lg">
            {[
              { id: 'all', label: 'সব অর্ডার' },
              { id: 'pending', label: 'গৃহীত' },
              { id: 'processing', label: 'প্যাকেজিং' },
              { id: 'shipped', label: 'ডেলিভারি পথে' },
              { id: 'delivered', label: 'সম্পন্ন' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as OrderStatus | 'all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-white text-[#18201B] shadow-xs font-semibold'
                    : 'text-[#4B554E] hover:text-[#18201B]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List / States */}
        {loading ? (
          <div className="bg-white border border-[#E5E4DF] rounded-xl p-10 text-center text-sm text-[#57615A]">
            অর্ডার তালিকা লোড হচ্ছে...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white border border-[#E5E4DF] rounded-xl p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-[#8A948D] mx-auto mb-3" aria-hidden="true" />
            <h2 className="text-lg font-bold text-[#18201B]">
              {orders.length === 0
                ? 'এখনো কোনো অর্ডার জমা পড়েনি'
                : 'খুঁজে পাওয়া যায়নি'}
            </h2>
            <p className="text-sm text-[#57615A] mt-1 mb-6 max-w-md mx-auto">
              {orders.length === 0
                ? 'আমাদের যেকোনো ক্যাটাগরি থেকে পণ্য বাছাই করে "অর্ডার করুন" বাটনে ক্লিক করলে অর্ডারটি সরাসরি এই পেজে জমা থাকবে।'
                : 'অন্য অর্ডার নাম্বার, মোবাইল নাম্বার বা ফিল্টার দিয়ে চেষ্টা করুন।'}
            </p>
            <button
              type="button"
              onClick={onBackToShop}
              className="px-5 py-2.5 rounded-lg bg-[#155E3F] text-white text-sm font-semibold hover:bg-[#0F472F] transition-colors"
            >
              সপ থেকে পণ্য অর্ডার করুন
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusInfo = STATUS_META[order.status];
              const StatusIcon = statusInfo.Icon;

              return (
                <article
                  key={order.id}
                  className="bg-white border border-[#E5E4DF] rounded-xl p-5 transition-shadow hover:shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#EFECE5]">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="font-bold text-[#18201B] tabular-nums">
                        অর্ডার নং: {order.orderNumber}
                      </span>
                      <span aria-hidden="true" className="text-[#C7C5BD]">·</span>
                      <span className="text-xs text-[#57615A]">{formatDate(order.createdAt)}</span>
                      <span aria-hidden="true" className="text-[#C7C5BD]">·</span>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${statusInfo.colorClass}`}>
                        <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <label htmlFor={`status-${order.id}`} className="sr-only">
                        অর্ডার স্ট্যাটাস পরিবর্তন
                      </label>
                      <select
                        id={`status-${order.id}`}
                        value={order.status}
                        onChange={(e) =>
                          onUpdateStatus(order.id, e.target.value as OrderStatus)
                        }
                        className="px-3 py-1.5 rounded-lg border border-[#D4D2CA] bg-[#FAFAF8] text-xs font-medium text-[#18201B] focus:outline-none focus:ring-2 focus:ring-[#155E3F]"
                      >
                        <option value="pending">অর্ডার গৃহীত</option>
                        <option value="processing">প্যাকেজিং চলছে</option>
                        <option value="shipped">ডেলিভারির পথে</option>
                        <option value="delivered">ডেলিভারি সম্পন্ন</option>
                      </select>

                      {confirmDeleteId === order.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={async () => {
                              await onDeleteOrder(order.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2.5 py-1.5 rounded-md bg-[#B91C1C] text-white text-xs font-semibold hover:bg-[#991B1B]"
                          >
                            মুছুন
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1.5 rounded-md border border-[#D4D2CA] text-xs text-[#4B554E] hover:bg-[#F3F2EE]"
                          >
                            না
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(order.id)}
                          aria-label="অর্ডার বাতিল করুন"
                          className="p-1.5 rounded-lg border border-[#E5E4DF] text-[#6B746E] hover:text-[#B91C1C] hover:border-[#FECACA] transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4 items-start">
                    {/* Product Info */}
                    <div className="md:col-span-5 flex items-start gap-3.5">
                      <img
                        src={order.productImage}
                        alt={order.productName}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-lg object-cover border border-[#E5E4DF] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs text-[#57615A]">
                          {order.categoryName} · {order.unitLabel}
                        </div>
                        <h3 className="text-base font-bold text-[#18201B]">
                          {order.productName}
                        </h3>
                        <p className="text-xs text-[#4B554E] tabular-nums mt-0.5">
                          পরিমাণ: {order.quantity}টি × ৳ {order.unitPrice.toLocaleString('bn-BD')}
                        </p>
                      </div>
                    </div>

                    {/* Customer & Delivery Info */}
                    <div className="md:col-span-4 text-sm space-y-1">
                      <div className="font-semibold text-[#18201B]">{order.customerName}</div>
                      <div className="text-[#4B554E] tabular-nums">{order.customerPhone}</div>
                      <div className="text-xs text-[#57615A] leading-relaxed">
                        {order.customerAddress} (
                        {order.deliveryZone === 'dhaka' ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে'})
                      </div>
                      {order.note && (
                        <div className="text-xs text-[#155E3F]">নোট: {order.note}</div>
                      )}
                    </div>

                    {/* Payment & Total */}
                    <div className="md:col-span-3 md:text-right text-sm space-y-1">
                      <div className="text-xs text-[#57615A]">
                        পেমেন্ট: <span className="font-medium text-[#18201B]">{PAYMENT_LABEL[order.paymentMethod]}</span>
                      </div>
                      {order.transactionId && (
                        <div className="text-xs text-[#57615A] tabular-nums">
                          TrxID: {order.transactionId}
                        </div>
                      )}
                      <div className="text-xs text-[#57615A] tabular-nums">
                        ডেলিভেরি চার্জ: {order.deliveryFee === 0 ? 'ফ্রি' : `৳ ${order.deliveryFee.toLocaleString('bn-BD')}`}
                      </div>
                      <div className="text-base font-bold text-[#155E3F] tabular-nums pt-1">
                        মোট: ৳ {order.totalAmount.toLocaleString('bn-BD')}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
