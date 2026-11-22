import { useCallback, useEffect, useState } from 'react';
import { AboutDeliverySection } from './components/AboutDeliverySection';
import { CategoryShop } from './components/CategoryShop';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { HeroBanner } from './components/HeroBanner';
import { Navbar } from './components/Navbar';
import { OrderModal } from './components/OrderModal';
import { OrdersPage } from './components/OrdersPage';
import { ActivePage, CategoryId, Order, OrderStatus, Product, WeightOption } from './types';

interface OrderSelection {
  product: Product;
  weight: WeightOption;
}

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('nuts');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderSelection, setOrderSelection] = useState<OrderSelection | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      }
    } catch {
      // Keep current state if network fails
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const scrollToSection = (sectionId: string) => {
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const handleNavigate = (page: ActivePage) => {
    setActivePage(page);
    if (page === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (page === 'shop') {
      scrollToSection('shop-section');
    } else if (page === 'about') {
      scrollToSection('about-section');
    } else if (page === 'contact') {
      scrollToSection('contact-section');
    } else if (page === 'orders') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearchSubmit = () => {
    setActivePage('shop');
    scrollToSection('shop-section');
  };

  const handleOrderCreated = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
      }
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
    if (res.ok) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-[#18201B]">
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        orderCount={orders.length}
      />

      <main className="flex-1">
        {activePage === 'orders' ? (
          <OrdersPage
            orders={orders}
            loading={ordersLoading}
            onUpdateStatus={handleUpdateOrderStatus}
            onDeleteOrder={handleDeleteOrder}
            onBackToShop={() => handleNavigate('shop')}
          />
        ) : (
          <>
            <HeroBanner
              onNavigate={handleNavigate}
              onExploreShop={() => handleNavigate('shop')}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearchSubmit={handleSearchSubmit}
            />
            <CategoryShop
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOrderClick={(product, weight) => setOrderSelection({ product, weight })}
            />
            <AboutDeliverySection />
            <ContactSection />
          </>
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      <OrderModal
        key={orderSelection ? `${orderSelection.product.id}-${orderSelection.weight}` : 'closed'}
        product={orderSelection?.product ?? null}
        initialWeight={orderSelection?.weight}
        onClose={() => setOrderSelection(null)}
        onOrderCreated={handleOrderCreated}
        onViewOrdersPage={() => handleNavigate('orders')}
      />
    </div>
  );
}
