export type CategoryId =
  | 'nuts'
  | 'dry-fruits'
  | 'seeds'
  | 'spices'
  | 'honey'
  | 'dates'
  | 'vegetables'
  | 'fish'
  | 'meat'
  | 'oil-ghee';

export type WeightOption = '৫০০ গ্রাম' | '১ কেজি';

export interface WeightVariant {
  label: WeightOption;
  price: number;
}

export interface Category {
  id: CategoryId;
  name: string;
  subtitle: string;
  image: string;
  itemCountLabel: string;
}

export interface Product {
  id: string;
  categoryId: CategoryId;
  name: string;
  englishName: string;
  unitLabel: WeightOption;
  price: number;
  variants: [WeightVariant, WeightVariant];
  origin: string;
  description: string;
  image: string;
}

export type PaymentMethod = 'cod' | 'bkash' | 'nagad' | 'rocket';
export type DeliveryZone = 'dhaka' | 'outside';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered';

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  productId: string;
  productName: string;
  productImage: string;
  categoryName: string;
  unitLabel: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  deliveryZone: DeliveryZone;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  note?: string;
  status: OrderStatus;
}

export type ActivePage = 'home' | 'shop' | 'orders' | 'about' | 'contact';
