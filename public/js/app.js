/**
 * Maltibazar BD — Pure Vanilla JS Frontend Controller
 */
(function () {
  const { COMPANY_INFO, CATEGORIES, PRODUCTS } = window.MALTIBAZAR_CATALOG;
  const API = window.MALTIBAZAR_API;

  const POPULAR_SEARCHES = [
    'ইলিশ',
    'সরিষা ফুলের মধু',
    'কাজুবাদাম',
    'গাওয়া ঘি',
    'আজওয়া খেজুর',
    'তেলাপিয়া',
  ];

  const STATUS_META = {
    pending: { label: 'অর্ডার গৃহীত', color: '#B45309' },
    processing: { label: 'প্যাকেজিং চলছে', color: '#1D4ED8' },
    shipped: { label: 'ডেলিভারির পথে', color: '#0F766E' },
    delivered: { label: 'ডেলিভারি সম্পন্ন', color: '#155E3F' },
  };

  const PAYMENT_LABELS = {
    cod: 'ক্যাশ অন ডেলিভেরি',
    bkash: 'বিকাশ (bKash)',
    nagad: 'নগদ (Nagad)',
    rocket: 'রকেট (Rocket)',
  };

  const categoryMap = new Map(CATEGORIES.map((c) => [c.id, c.name]));

  const state = {
    activePage: 'home',
    selectedCategory: 'nuts',
    searchQuery: '',
    cardWeights: {}, // productId -> '৫০০ গ্রাম' | '১ কেজি'
    ordersTab: 'customer', // 'customer' | 'admin'
    myOrders: API.getMySessionOrders(),
    adminOrders: [],
    adminMessages: [],
    adminOrdersLoading: false,
    adminSearch: '',
    adminStatusFilter: 'all',
    confirmDeleteId: null,
    knownOrderIds: null, // Set<string> once baseline loaded
    unreadOrderIds: new Set(),
    adminSyncTimer: null,
    realtimeUnsubscribe: null,
    toastHideTimer: null,
    syncInFlight: false,
    baseTitle: document.title,
    modal: null, // { product, selectedWeight, quantity, deliveryZone, paymentMethod, transactionId, customerName, customerPhone, customerAddress, note, submitting, errorMsg, confirmedOrder }
  };

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatBDT(num) {
    return Number(num || 0).toLocaleString('bn-BD');
  }

  function formatDate(iso) {
    try {
      return new Intl.DateTimeFormat('bn-BD', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(iso));
    } catch {
      return String(iso || '');
    }
  }

  function el(id) {
    return document.getElementById(id);
  }

  // ---- Static Company Info Hydration ----
  function hydrateStaticContent() {
    el('top-company-address').textContent = COMPANY_INFO.address;
    el('top-company-phone').textContent = COMPANY_INFO.phones[0];

    el('about-mfs-numbers').innerHTML = `
      <strong class="item-head">বিকাশ, নগদ ও রকেট মোবাইল ব্যাংকিং</strong>
      বিকাশ: <span class="tabular-nums" style="font-weight:500;">${escapeHtml(COMPANY_INFO.bkashNumber)}</span> ·
      নগদ: <span class="tabular-nums" style="font-weight:500;">${escapeHtml(COMPANY_INFO.nagadNumber)}</span> ·
      রকেট: <span class="tabular-nums" style="font-weight:500;">${escapeHtml(COMPANY_INFO.rocketNumber)}</span>
    `;

    el('contact-details-list').innerHTML = `
      <div class="contact-row">
        <svg class="icon-emerald" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-top:2px;">
          <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <div>
          <div style="font-size:0.875rem;font-weight:600;">প্রধান অফিস ও সেলস হাব</div>
          <div style="font-size:0.875rem;color:var(--ink-secondary);margin-top:2px;">${escapeHtml(COMPANY_INFO.address)}</div>
          <div style="font-size:0.75rem;color:var(--ink-muted);margin-top:2px;">ডিস্ট্রিবিউশন পয়েন্ট: ${escapeHtml(COMPANY_INFO.warehouseAddress)}</div>
        </div>
      </div>

      <div class="contact-row">
        <svg class="icon-emerald" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-top:2px;">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        <div>
          <div style="font-size:0.875rem;font-weight:600;">মোবাইল নাম্বার (হটলাইন)</div>
          <div class="tabular-nums" style="font-size:0.875rem;color:var(--ink-secondary);margin-top:2px;">
            <div>${escapeHtml(COMPANY_INFO.phones[0])} (অর্ডার ও কাস্টমার কেয়ার)</div>
            <div>${escapeHtml(COMPANY_INFO.phones[1])} (হোয়াটসঅ্যাপ ও কর্পোরেট)</div>
          </div>
        </div>
      </div>

      <div class="contact-row">
        <svg class="icon-emerald" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-top:2px;">
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        <div>
          <div style="font-size:0.875rem;font-weight:600;">ইমেইল</div>
          <div style="font-size:0.875rem;color:var(--ink-secondary);margin-top:2px;">${escapeHtml(COMPANY_INFO.email)}</div>
        </div>
      </div>

      <div class="contact-row">
        <svg class="icon-emerald" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-top:2px;">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <div>
          <div style="font-size:0.875rem;font-weight:600;">সার্ভিস সময়</div>
          <div style="font-size:0.875rem;color:var(--ink-secondary);margin-top:2px;">${escapeHtml(COMPANY_INFO.hours)}</div>
        </div>
      </div>
    `;

    el('footer-tagline').textContent =
      `${COMPANY_INFO.tagline}। খাঁটি বাদাম, ড্রাই ফ্রুটস, সীডস, মশলা, মধু, খেজুর, তাজা সবজি, নদীর মাছ এবং হালাল গোস্তের নির্ভরযোগ্য প্রতিষ্ঠান।`;
    el('footer-address').textContent = COMPANY_INFO.address;
    el('footer-phones').textContent = `মোবাইল: ${COMPANY_INFO.phones.join(' / ')}`;
    el('footer-email').textContent = `ইমেইল: ${COMPANY_INFO.email}`;
    el('footer-copyright').textContent = `© ${new Date().getFullYear()} Maltibazar BD। সর্বস্বত্ব সংরক্ষিত।`;

    // Popular search chips
    const popWrap = el('popular-searches');
    POPULAR_SEARCHES.forEach((term) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'popular-chip';
      btn.textContent = term;
      btn.addEventListener('click', () => {
        setSearchQuery(term);
        navigate('shop');
      });
      popWrap.appendChild(btn);
    });
  }

  // ---- Navigation ----
  function navigate(page) {
    state.activePage = page;

    document.querySelectorAll('.nav-link, .mobile-drawer-btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.nav === page);
    });
    el('orders-nav-btn').classList.toggle('is-active', page === 'orders');

    // Close mobile menu
    el('mobile-drawer').classList.add('hidden');
    el('mobile-menu-toggle').setAttribute('aria-expanded', 'false');
    el('mobile-menu-icon-open').classList.remove('hidden');
    el('mobile-menu-icon-close').classList.add('hidden');

    if (page === 'orders') {
      el('storefront-view').classList.add('hidden');
      el('orders-view').classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      renderOrdersPage();
      return;
    }

    el('orders-view').classList.add('hidden');
    el('storefront-view').classList.remove('hidden');

    if (page === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const targetId =
        page === 'shop'
          ? 'shop-section'
          : page === 'about'
            ? 'about-section'
            : 'contact-section';
      setTimeout(() => {
        const target = el(targetId);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 40);
    }
  }

  function updateNavOrderBadge() {
    const badge = el('nav-order-count');
    const session = API.getAdminSession();
    const count = session && state.adminOrders.length > 0 ? state.adminOrders.length : state.myOrders.length;
    if (count > 0) {
      badge.textContent = String(count);
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  // ---- Search & Shop Rendering ----
  function setSearchQuery(q) {
    state.searchQuery = q;
    const heroIn = el('hero-search-input');
    const shopIn = el('shop-search-input');
    if (heroIn.value !== q) heroIn.value = q;
    if (shopIn.value !== q) shopIn.value = q;

    el('hero-search-clear').classList.toggle('hidden', !q);
    el('shop-search-clear').classList.toggle('hidden', !q);
    renderShop();
  }

  function getFilteredProducts() {
    const q = state.searchQuery.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      if (q) {
        const catName = (categoryMap.get(p.categoryId) || '').toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.englishName.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          catName.includes(q)
        );
      }
      return state.selectedCategory === 'all' || p.categoryId === state.selectedCategory;
    });
  }

  function renderCategoryTabs() {
    const hasSearch = state.searchQuery.trim().length > 0;
    const grid = el('category-tabs-grid');
    grid.innerHTML = '';

    CATEGORIES.forEach((cat) => {
      const isActive = !hasSearch && state.selectedCategory === cat.id;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.role = 'tab';
      btn.setAttribute('aria-selected', String(isActive));
      btn.className = `cat-tab${isActive ? ' is-active' : ''}`;
      btn.innerHTML = `
        <img src="${escapeHtml(cat.image)}" alt="${escapeHtml(cat.name)}" referrerPolicy="no-referrer" class="cat-tab-img" />
        <div class="cat-tab-text">
          <div class="cat-tab-name">${escapeHtml(cat.name)}</div>
          <div class="cat-tab-count tabular-nums">${escapeHtml(cat.itemCountLabel)}</div>
        </div>
      `;
      btn.addEventListener('click', () => {
        if (state.searchQuery.trim()) setSearchQuery('');
        state.selectedCategory = cat.id;
        renderShop();
      });
      grid.appendChild(btn);
    });

    const isAll = !hasSearch && state.selectedCategory === 'all';
    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.role = 'tab';
    allBtn.setAttribute('aria-selected', String(isAll));
    allBtn.className = `cat-tab cat-tab-all${isAll ? ' is-active' : ''}`;
    allBtn.innerHTML = `
      <div>
        <div class="cat-tab-name">সকল পণ্য</div>
        <div class="cat-tab-count tabular-nums">${PRODUCTS.length}টি একক পণ্য</div>
      </div>
    `;
    allBtn.addEventListener('click', () => {
      if (state.searchQuery.trim()) setSearchQuery('');
      state.selectedCategory = 'all';
      renderShop();
    });
    grid.appendChild(allBtn);
  }

  function renderShop() {
    renderCategoryTabs();

    const hasSearch = state.searchQuery.trim().length > 0;
    const activeCat = CATEGORIES.find((c) => c.id === state.selectedCategory);
    const filtered = getFilteredProducts();

    el('shop-heading').textContent = hasSearch
      ? `“${state.searchQuery.trim()}” খোঁজার ফলাফল`
      : activeCat
        ? activeCat.name
        : 'সকল ক্যাটাগরির পণ্য';

    el('shop-subtitle').textContent = hasSearch
      ? 'সকল ক্যাটাগরি থেকে মিল পাওয়া পণ্যগুলো নিচে দেখানো হয়েছে'
      : activeCat
        ? activeCat.subtitle
        : 'প্রতিটি ক্যাটাগরিতে বাছাইকৃত খাঁটি ও তাজা পণ্যের একক সংগ্রহ';

    el('results-count-text').innerHTML = `
      দেখানো হচ্ছে <strong style="color:var(--ink);" class="tabular-nums">${filtered.length}</strong> টি পণ্য
      ${
        hasSearch
          ? ` · সকল ক্যাটাগরিতে “${escapeHtml(state.searchQuery.trim())}”`
          : activeCat
            ? ` · ${escapeHtml(activeCat.name)}`
            : ''
      }
    `;

    const resetBtn = el('results-reset-btn');
    if (hasSearch) {
      resetBtn.textContent = 'খোঁজা বাতিল করুন';
      resetBtn.classList.remove('hidden');
      resetBtn.onclick = () => setSearchQuery('');
    } else if (state.selectedCategory !== 'all') {
      resetBtn.textContent = 'সব ক্যাটাগরি একসাথে দেখুন';
      resetBtn.classList.remove('hidden');
      resetBtn.onclick = () => {
        state.selectedCategory = 'all';
        renderShop();
      };
    } else {
      resetBtn.classList.add('hidden');
    }

    const grid = el('products-grid');
    const emptyBox = el('products-empty');
    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.classList.add('hidden');
      emptyBox.classList.remove('hidden');
      el('products-empty-title').textContent = `“${state.searchQuery}” নামে কোনো পণ্য পাওয়া যায়নি`;
      return;
    }

    emptyBox.classList.add('hidden');
    grid.classList.remove('hidden');

    filtered.forEach((product) => {
      const selectedWeight = state.cardWeights[product.id] || product.unitLabel;
      const activeVariant =
        product.variants.find((v) => v.label === selectedWeight) || product.variants[0];
      const catName = categoryMap.get(product.categoryId) || '';

      const card = document.createElement('article');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-media">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" referrerpolicy="no-referrer" loading="lazy" />
        </div>
        <div class="product-body">
          <div>
            <div class="product-meta">
              <span class="product-meta-cat">${escapeHtml(catName)}</span>
              <span aria-hidden="true">·</span>
              <span>৫০০ গ্রাম ও ১ কেজি</span>
              <span aria-hidden="true">·</span>
              <span class="product-meta-origin">${escapeHtml(product.origin)}</span>
            </div>
            <div class="product-title-row">
              <h3 class="product-title">${escapeHtml(product.name)}</h3>
              <span class="product-price tabular-nums">৳ ${formatBDT(activeVariant.price)}</span>
            </div>
            <p class="product-desc">${escapeHtml(product.description)}</p>
          </div>
          <div class="product-actions">
            <div class="variant-grid" role="group" aria-label="${escapeHtml(product.name)} পরিমাণ">
              ${product.variants
                .map((v) => {
                  const isAct = v.label === activeVariant.label;
                  return `
                    <button type="button" class="variant-btn tabular-nums${isAct ? ' is-active' : ''}" data-weight="${escapeHtml(v.label)}" aria-pressed="${isAct}">
                      <span>${escapeHtml(v.label)}</span>
                      <span>৳ ${formatBDT(v.price)}</span>
                    </button>
                  `;
                })
                .join('')}
            </div>
            <button type="button" class="btn btn-primary order-card-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              <span>অর্ডার করুন (${escapeHtml(activeVariant.label)})</span>
            </button>
          </div>
        </div>
      `;

      const img = card.querySelector('.product-media img');
      img.addEventListener('error', () => {
        const media = card.querySelector('.product-media');
        media.innerHTML = `
          <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.5rem;text-align:center;">
            <strong style="font-size:0.9rem;color:var(--ink);">${escapeHtml(product.name)}</strong>
            <span style="font-size:0.75rem;color:var(--ink-muted);margin-top:4px;">${escapeHtml(catName)}</span>
          </div>
        `;
      });

      card.querySelectorAll('.variant-btn').forEach((vBtn) => {
        vBtn.addEventListener('click', () => {
          state.cardWeights[product.id] = vBtn.dataset.weight;
          renderShop();
        });
      });

      card.querySelector('.order-card-btn').addEventListener('click', () => {
        openOrderModal(product, activeVariant.label);
      });

      grid.appendChild(card);
    });
  }

  // ---- Order Modal ----
  function openOrderModal(product, initialWeight) {
    state.modal = {
      product,
      selectedWeight: initialWeight || product.unitLabel,
      quantity: 1,
      deliveryZone: 'dhaka',
      paymentMethod: 'cod',
      transactionId: '',
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      note: '',
      submitting: false,
      errorMsg: '',
      confirmedOrder: null,
    };
    el('order-modal').classList.remove('hidden');
    renderOrderModal();
  }

  function closeOrderModal() {
    state.modal = null;
    el('order-modal').classList.add('hidden');
  }

  function renderOrderModal() {
    const m = state.modal;
    if (!m) return;

    const titleEl = el('order-modal-title');
    const bodyEl = el('order-modal-body');

    if (m.confirmedOrder) {
      const ord = m.confirmedOrder;
      titleEl.textContent = 'অর্ডার সফলভাবে সম্পন্ন হয়েছে';
      bodyEl.innerHTML = `
        <div style="text-align:center;padding:1rem 0;">
          <svg class="icon-emerald" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 0.75rem;">
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <h3 style="font-size:1.25rem;font-weight:700;color:var(--ink);">ধন্যবাদ, ${escapeHtml(ord.customerName)}!</h3>
          <p style="font-size:0.875rem;color:var(--ink-secondary);margin-top:0.25rem;">
            আপনার অর্ডারটি <strong style="color:var(--primary);">${escapeHtml(ord.orderNumber)}</strong> নম্বরে সফলভাবে সংরক্ষণ করা হয়েছে।
          </p>

          <div style="margin-top:1.5rem;text-align:left;background:var(--bg);border:1px solid var(--border);border-radius:0.75rem;padding:1rem;display:flex;flex-direction:column;gap:0.5rem;font-size:0.875rem;">
            <div style="display:flex;justify-content:space-between;gap:1rem;">
              <span style="color:var(--ink-muted);">পণ্য:</span>
              <strong style="color:var(--ink);">${escapeHtml(ord.productName)} (${ord.quantity} × ${escapeHtml(ord.unitLabel)})</strong>
            </div>
            <div style="display:flex;justify-content:space-between;gap:1rem;">
              <span style="color:var(--ink-muted);">মোবাইল:</span>
              <span class="tabular-nums" style="font-weight:500;">${escapeHtml(ord.customerPhone)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;gap:1rem;">
              <span style="color:var(--ink-muted);">ঠিকানা:</span>
              <span style="font-weight:500;text-align:right;max-width:18rem;">${escapeHtml(ord.customerAddress)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;gap:1rem;padding-top:0.5rem;border-top:1px solid var(--border);">
              <strong style="color:var(--ink);">সর্বমোট বিল:</strong>
              <strong class="tabular-nums" style="color:var(--primary);">৳ ${formatBDT(ord.totalAmount)}</strong>
            </div>
          </div>

          <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:0.75rem;margin-top:1.5rem;">
            <button type="button" id="modal-view-orders-btn" class="btn btn-primary" style="padding:0.625rem 1.5rem;font-size:0.875rem;">
              অর্ডার পেজে দেখুন
            </button>
            <button type="button" id="modal-continue-btn" class="btn btn-secondary" style="padding:0.625rem 1.25rem;font-size:0.875rem;">
              আরও কেনাকাটা করুন
            </button>
          </div>
        </div>
      `;

      el('modal-view-orders-btn').addEventListener('click', () => {
        closeOrderModal();
        state.ordersTab = 'customer';
        navigate('orders');
      });
      el('modal-continue-btn').addEventListener('click', closeOrderModal);
      return;
    }

    titleEl.textContent = 'দ্রুত অর্ডার ফর্ম';
    const product = m.product;
    const activeVariant =
      product.variants.find((v) => v.label === m.selectedWeight) || product.variants[0];
    const catName = categoryMap.get(product.categoryId) || '';
    const subtotal = activeVariant.price * m.quantity;
    const isFreeDelivery = subtotal >= COMPANY_INFO.freeDeliveryThreshold;
    const deliveryFee = isFreeDelivery
      ? 0
      : m.deliveryZone === 'dhaka'
        ? COMPANY_INFO.dhakaDeliveryFee
        : COMPANY_INFO.outsideDhakaDeliveryFee;
    const totalAmount = subtotal + deliveryFee;
    const paymentNumber =
      m.paymentMethod === 'bkash'
        ? COMPANY_INFO.bkashNumber
        : m.paymentMethod === 'nagad'
          ? COMPANY_INFO.nagadNumber
          : m.paymentMethod === 'rocket'
            ? COMPANY_INFO.rocketNumber
            : '';

    bodyEl.innerHTML = `
      <form id="order-checkout-form" style="display:flex;flex-direction:column;gap:1.25rem;">
        <div class="modal-summary-card">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" referrerpolicy="no-referrer" style="width:5rem;height:4rem;border-radius:0.5rem;object-fit:cover;border:1px solid var(--border);flex-shrink:0;" />
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.75rem;color:var(--ink-muted);">${escapeHtml(catName)} · ${escapeHtml(activeVariant.label)}</div>
            <h3 style="font-size:1rem;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(product.name)}</h3>
            <div class="tabular-nums" style="font-size:0.875rem;font-weight:600;color:var(--primary);">৳ ${formatBDT(activeVariant.price)} / ${escapeHtml(activeVariant.label)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:0.5rem;flex-shrink:0;">
            <button type="button" id="modal-qty-minus" aria-label="পরিমাণ কমান" class="qty-btn">−</button>
            <span class="tabular-nums" style="width:1.75rem;text-align:center;font-size:0.875rem;font-weight:700;">${m.quantity}</span>
            <button type="button" id="modal-qty-plus" aria-label="পরিমাণ বাড়ান" class="qty-btn">+</button>
          </div>
        </div>

        <div>
          <span class="field-label">প্যাকের পরিমাণ নির্বাচন করুন (৫০০ গ্রাম / ১ কেজি)</span>
          <div class="form-grid-2" style="gap:0.625rem;">
            ${product.variants
              .map((v) => {
                const act = v.label === activeVariant.label;
                return `
                  <button type="button" class="choice-btn modal-weight-btn${act ? ' is-active' : ''}" data-weight="${escapeHtml(v.label)}" style="display:flex;align-items:center;justify-content:space-between;">
                    <span>${escapeHtml(v.label)}</span>
                    <span class="tabular-nums" style="color:var(--primary);font-weight:700;">৳ ${formatBDT(v.price)}</span>
                  </button>
                `;
              })
              .join('')}
          </div>
        </div>

        <div class="form-grid-2">
          <div>
            <label for="ord-cust-name" class="field-label">আপনার নাম *</label>
            <input id="ord-cust-name" type="text" required value="${escapeHtml(m.customerName)}" placeholder="যেমন: মোঃ মাহবুবুর রহমান" class="form-control" />
          </div>
          <div>
            <label for="ord-cust-phone" class="field-label">মোবাইল নাম্বার *</label>
            <input id="ord-cust-phone" type="tel" required value="${escapeHtml(m.customerPhone)}" placeholder="০১৭১২-XXXXXX" class="form-control tabular-nums" />
          </div>
        </div>

        <div>
          <label for="ord-cust-address" class="field-label">ডেলিভেরি ঠিকানা *</label>
          <textarea id="ord-cust-address" required rows="2" placeholder="বাসা/হোল্ডিং নম্বর, রোড, এলাকা ও জেলার নাম লিখুন" class="form-control">${escapeHtml(m.customerAddress)}</textarea>
        </div>

        <div>
          <span class="field-label">ডেলিভেরি এলাকা (২,০০০+ টাকায় ডেলিভেরি ফ্রি)</span>
          <div class="form-grid-2" style="gap:0.625rem;">
            <button type="button" class="choice-btn modal-zone-btn${m.deliveryZone === 'dhaka' ? ' is-active' : ''}" data-zone="dhaka">
              <div>ঢাকার ভিতরে (২৪ ঘণ্টায়)</div>
              <div class="tabular-nums" style="font-size:0.75rem;color:var(--ink-muted);margin-top:2px;">চার্জ: ${isFreeDelivery ? 'ফ্রি' : '৳ ৬০'}</div>
            </button>
            <button type="button" class="choice-btn modal-zone-btn${m.deliveryZone === 'outside' ? ' is-active' : ''}" data-zone="outside">
              <div>ঢাকার বাইরে (সারা বাংলাদেশ)</div>
              <div class="tabular-nums" style="font-size:0.75rem;color:var(--ink-muted);margin-top:2px;">চার্জ: ${isFreeDelivery ? 'ফ্রি' : '৳ ১২০'}</div>
            </button>
          </div>
        </div>

        <div>
          <span class="field-label">পেমেন্ট পদ্ধতি নির্বাচন করুন</span>
          <div class="payment-grid">
            ${[
              { id: 'cod', label: 'ক্যাশ অন ডেলিভেরি' },
              { id: 'bkash', label: 'বিকাশ (bKash)' },
              { id: 'nagad', label: 'নগদ (Nagad)' },
              { id: 'rocket', label: 'রকেট (Rocket)' },
            ]
              .map(
                (pm) => `
                <button type="button" class="payment-btn modal-pay-btn${m.paymentMethod === pm.id ? ' is-active' : ''}" data-pay="${pm.id}">
                  ${pm.label}
                </button>
              `
              )
              .join('')}
          </div>

          ${
            m.paymentMethod !== 'cod'
              ? `
            <div style="margin-top:0.75rem;padding:0.875rem;border-radius:0.5rem;background:var(--bg);border:1px solid var(--border);display:flex;flex-direction:column;gap:0.625rem;">
              <p style="font-size:0.75rem;color:var(--ink-secondary);">
                অনুগ্রহ করে <strong class="tabular-nums" style="color:var(--ink);">${escapeHtml(paymentNumber)}</strong> নম্বরে
                <strong class="tabular-nums" style="color:var(--primary);">৳ ${formatBDT(totalAmount)}</strong> সেন্ড মানি / পেমেন্ট করে নিচের ঘরে TrxID লিখুন।
              </p>
              <input id="ord-trx-id" type="text" value="${escapeHtml(m.transactionId)}" placeholder="ট্রানজেকশন আইডি (যেমন: 9K7A21BC45)" class="form-control" />
            </div>
          `
              : ''
          }
        </div>

        <div>
          <label for="ord-note" class="field-label">বিশেষ নির্দেশনা (ঐচ্ছিক)</label>
          <input id="ord-note" type="text" value="${escapeHtml(m.note)}" placeholder="যেমন: মাছ কেটে দেবেন বা বিকালে ডেলিভেরি দেবেন" class="form-control" />
        </div>

        <div style="padding:1rem;border-radius:0.75rem;background:var(--bg);border:1px solid var(--border);display:flex;flex-direction:column;gap:0.375rem;font-size:0.875rem;">
          <div style="display:flex;justify-content:space-between;color:var(--ink-secondary);">
            <span>পণ্যের মূল্য (${m.quantity} × ${escapeHtml(activeVariant.label)}):</span>
            <span class="tabular-nums" style="font-weight:500;color:var(--ink);">৳ ${formatBDT(subtotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:var(--ink-secondary);">
            <span>ডেলিভেরি চার্জ:</span>
            <span class="tabular-nums" style="font-weight:500;color:var(--ink);">${isFreeDelivery ? 'ফ্রি' : `৳ ${formatBDT(deliveryFee)}`}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding-top:0.5rem;border-top:1px solid var(--border);font-size:1rem;font-weight:700;">
            <span>সর্বমোট পরিশোধযোগ্য:</span>
            <span class="tabular-nums" style="color:var(--primary);">৳ ${formatBDT(totalAmount)}</span>
          </div>
        </div>

        ${m.errorMsg ? `<p role="alert" class="alert-error">${escapeHtml(m.errorMsg)}</p>` : ''}

        <div style="display:flex;justify-content:flex-end;gap:0.75rem;">
          <button type="button" id="modal-cancel-btn" class="btn btn-secondary" style="padding:0.625rem 1rem;font-size:0.875rem;">বাতিল</button>
          <button type="submit" ${m.submitting ? 'disabled' : ''} class="btn btn-primary" style="padding:0.625rem 1.5rem;font-size:0.875rem;">
            ${m.submitting ? 'অর্ডার জমা হচ্ছে...' : 'অর্ডার নিশ্চিত করুন'}
          </button>
        </div>
      </form>
    `;

    // Bind live modal inputs & controls
    const syncTextInputs = () => {
      m.customerName = el('ord-cust-name').value;
      m.customerPhone = el('ord-cust-phone').value;
      m.customerAddress = el('ord-cust-address').value;
      m.note = el('ord-note').value;
      const trx = el('ord-trx-id');
      if (trx) m.transactionId = trx.value;
    };

    el('modal-qty-minus').addEventListener('click', () => {
      syncTextInputs();
      m.quantity = Math.max(1, m.quantity - 1);
      renderOrderModal();
    });
    el('modal-qty-plus').addEventListener('click', () => {
      syncTextInputs();
      m.quantity += 1;
      renderOrderModal();
    });

    bodyEl.querySelectorAll('.modal-weight-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        syncTextInputs();
        m.selectedWeight = btn.dataset.weight;
        renderOrderModal();
      });
    });

    bodyEl.querySelectorAll('.modal-zone-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        syncTextInputs();
        m.deliveryZone = btn.dataset.zone;
        renderOrderModal();
      });
    });

    bodyEl.querySelectorAll('.modal-pay-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        syncTextInputs();
        m.paymentMethod = btn.dataset.pay;
        renderOrderModal();
      });
    });

    el('modal-cancel-btn').addEventListener('click', closeOrderModal);

    el('order-checkout-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      syncTextInputs();
      m.errorMsg = '';
      m.submitting = true;
      renderOrderModal();

      const res = await API.createOrder({
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        categoryName: catName,
        unitLabel: activeVariant.label,
        unitPrice: activeVariant.price,
        quantity: m.quantity,
        deliveryZone: m.deliveryZone,
        paymentMethod: m.paymentMethod,
        transactionId: m.paymentMethod !== 'cod' ? m.transactionId.trim() : undefined,
        customerName: m.customerName.trim(),
        customerPhone: m.customerPhone.trim(),
        customerAddress: m.customerAddress.trim(),
        note: m.note.trim() || undefined,
      });

      m.submitting = false;
      if (!res.ok || !res.data?.order || !res.data.order.id || !res.data.order.orderNumber) {
        m.errorMsg =
          res.error ||
          'Cloud Database-এ অর্ডার সেভ করা যায়নি। অর্ডার সম্পন্ন হয়নি—অনুগ্রহ করে আবার চেষ্টা করুন।';
        renderOrderModal();
        return;
      }

      m.confirmedOrder = res.data.order;
      state.myOrders = API.getMySessionOrders();
      if (API.getAdminSession()) {
        if (state.knownOrderIds) state.knownOrderIds.add(res.data.order.id);
        state.adminOrders = [res.data.order, ...state.adminOrders.filter((o) => o.id !== res.data.order.id)];
      }
      updateNavOrderBadge();
      renderOrderModal();
    });
  }

  // ---- Order Card Renderer (Shared between Tracker, My Orders & Admin) ----
  function renderOrderCardHTML(order, isAdmin) {
    const st = STATUS_META[order.status] || STATUS_META.pending;
    const payLbl = PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod;
    const isConfirmingDel = state.confirmDeleteId === order.id;

    return `
      <article class="order-card" data-order-id="${escapeHtml(order.id)}">
        <div class="order-card-head">
          <div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem 1rem;font-size:0.875rem;">
            <strong class="tabular-nums" style="color:var(--ink);">অর্ডার নং: ${escapeHtml(order.orderNumber)}</strong>
            <span style="color:#C7C5BD;">·</span>
            <span style="font-size:0.75rem;color:var(--ink-muted);">${escapeHtml(formatDate(order.createdAt))}</span>
            <span style="color:#C7C5BD;">·</span>
            <span style="font-size:0.75rem;font-weight:600;color:${st.color};">${escapeHtml(st.label)}</span>
          </div>

          ${
            isAdmin
              ? `
            <div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.625rem;">
              <select class="status-select admin-status-select" data-id="${escapeHtml(order.id)}" aria-label="অর্ডার স্ট্যাটাস পরিবর্তন">
                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>অর্ডার গৃহীত</option>
                <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>প্যাকেজিং চলছে</option>
                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>ডেলিভারির পথে</option>
                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>ডেলিভারি সম্পন্ন</option>
              </select>

              ${
                isConfirmingDel
                  ? `
                <button type="button" class="btn admin-delete-confirm" data-id="${escapeHtml(order.id)}" style="padding:0.35rem 0.65rem;font-size:0.75rem;background:var(--danger);color:#fff;border:none;">মুছুন</button>
                <button type="button" class="btn admin-delete-cancel" style="padding:0.35rem 0.65rem;font-size:0.75rem;background:#fff;border:1px solid var(--border-strong);color:var(--ink-secondary);">না</button>
              `
                  : `
                <button type="button" class="icon-btn danger admin-delete-ask" data-id="${escapeHtml(order.id)}" aria-label="অর্ডার বাতিল করুন">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              `
              }
            </div>
          `
              : ''
          }
        </div>

        <div class="order-card-body">
          <div class="order-prod-col" style="display:flex;align-items:flex-start;gap:0.875rem;">
            ${
              order.productImage
                ? `<img src="${escapeHtml(order.productImage)}" alt="${escapeHtml(order.productName)}" referrerpolicy="no-referrer" style="width:4rem;height:4rem;border-radius:0.5rem;object-fit:cover;border:1px solid var(--border);flex-shrink:0;" />`
                : ''
            }
            <div style="min-width:0;">
              <div style="font-size:0.75rem;color:var(--ink-muted);">${escapeHtml(order.categoryName)} · ${escapeHtml(order.unitLabel)}</div>
              <h3 style="font-size:1rem;font-weight:700;color:var(--ink);">${escapeHtml(order.productName)}</h3>
              <p class="tabular-nums" style="font-size:0.75rem;color:var(--ink-secondary);margin-top:2px;">
                পরিমাণ: ${order.quantity}টি × ৳ ${formatBDT(order.unitPrice)}
              </p>
            </div>
          </div>

          <div class="order-cust-col" style="font-size:0.875rem;display:flex;flex-direction:column;gap:0.2rem;">
            <div style="font-weight:600;color:var(--ink);">${escapeHtml(order.customerName)}</div>
            <div class="tabular-nums" style="color:var(--ink-secondary);">${escapeHtml(order.customerPhone)}</div>
            <div style="font-size:0.75rem;color:var(--ink-muted);line-height:1.5;">
              ${escapeHtml(order.customerAddress)} (${order.deliveryZone === 'dhaka' ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে'})
            </div>
            ${order.note ? `<div style="font-size:0.75rem;color:var(--primary);">নোট: ${escapeHtml(order.note)}</div>` : ''}
          </div>

          <div class="order-bill-col" style="font-size:0.875rem;display:flex;flex-direction:column;gap:0.2rem;">
            <div style="font-size:0.75rem;color:var(--ink-muted);">পেমেন্ট: <strong style="color:var(--ink);">${escapeHtml(payLbl)}</strong></div>
            ${order.transactionId ? `<div class="tabular-nums" style="font-size:0.75rem;color:var(--ink-muted);">TrxID: ${escapeHtml(order.transactionId)}</div>` : ''}
            <div class="tabular-nums" style="font-size:0.75rem;color:var(--ink-muted);">ডেলিভেরি চার্জ: ${order.deliveryFee === 0 ? 'ফ্রি' : `৳ ${formatBDT(order.deliveryFee)}`}</div>
            <div class="tabular-nums" style="font-size:1rem;font-weight:700;color:var(--primary);padding-top:0.25rem;">মোট: ৳ ${formatBDT(order.totalAmount)}</div>
          </div>
        </div>
      </article>
    `;
  }

  // ---- Orders Page & Admin Panel ----
  function renderOrdersStats() {
    const session = API.getAdminSession();
    const list = session && state.ordersTab === 'admin' ? state.adminOrders : state.myOrders;
    const pendingCount = list.filter((o) => o.status !== 'delivered').length;
    const totalVal = list.reduce((s, o) => s + Number(o.totalAmount || 0), 0);

    el('orders-summary-stats').innerHTML = `
      <div>
        <div class="stat-label">${session && state.ordersTab === 'admin' ? 'মোট অর্ডার' : 'আপনার অর্ডার'}</div>
        <div class="stat-value tabular-nums">${formatBDT(list.length)} টি</div>
      </div>
      <div>
        <div class="stat-label">চলমান অর্ডার</div>
        <div class="stat-value tabular-nums" style="color:var(--amber);">${formatBDT(pendingCount)} টি</div>
      </div>
      <div>
        <div class="stat-label">সর্বমোট অর্ডার মূল্য</div>
        <div class="stat-value tabular-nums" style="color:var(--primary);">৳ ${formatBDT(totalVal)}</div>
      </div>
    `;
  }

  function renderMyOrdersList() {
    state.myOrders = API.getMySessionOrders();
    const wrap = el('my-session-orders-list');
    if (state.myOrders.length === 0) {
      wrap.innerHTML = `
        <div class="empty-state-box">
          <p style="font-size:1rem;font-weight:700;color:var(--ink);">এই সেশনে এখনো কোনো অর্ডার জমা পড়েনি</p>
          <p style="font-size:0.875rem;color:var(--ink-muted);margin:0.35rem 0 1.25rem;">
            যেকোনো পণ্য অর্ডার করলে আপনার অর্ডার রিসিপ্ট এখানে দেখাবে, অথবা উপরের বক্সে অর্ডার নাম্বার ও মোবাইল দিয়ে খুঁজে দেখুন।
          </p>
          <button type="button" id="empty-go-shop-btn" class="btn btn-primary" style="padding:0.6rem 1.25rem;font-size:0.875rem;">
            সপ থেকে পণ্য অর্ডার করুন
          </button>
        </div>
      `;
      el('empty-go-shop-btn').addEventListener('click', () => navigate('shop'));
      return;
    }
    wrap.innerHTML = state.myOrders.map((o) => renderOrderCardHTML(o, false)).join('');
  }

  function playOrderChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      [659.25, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
        gain.gain.setValueAtTime(0.001, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.14 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.3);
      });
    } catch {
      // Ignore Web Audio restrictions if user hasn't interacted yet
    }
  }

  function updateNotifyButtonUI() {
    const btn = el('admin-notify-btn');
    if (!btn) return;
    if (!('Notification' in window)) {
      btn.textContent = 'সাউন্ড অ্যালার্ট টেস্ট';
      return;
    }
    if (Notification.permission === 'granted') {
      btn.textContent = 'নোটিফিকেশন চালু আছে';
      btn.classList.add('btn-notify-active');
    } else if (Notification.permission === 'denied') {
      btn.textContent = 'ব্রাউজারে ব্লক করা';
      btn.classList.remove('btn-notify-active');
    } else {
      btn.textContent = 'নোটিফিকেশন চালু করুন';
      btn.classList.remove('btn-notify-active');
    }
  }

  function hideNewOrderToast() {
    if (state.toastHideTimer) {
      clearTimeout(state.toastHideTimer);
      state.toastHideTimer = null;
    }
    const toast = el('new-order-toast');
    if (toast) toast.classList.add('hidden');
  }

  function showNewOrderToast(newOrders) {
    const toast = el('new-order-toast');
    if (!toast || !newOrders.length) return;
    const latest = newOrders[0];
    el('new-order-toast-heading').textContent =
      newOrders.length > 1
        ? `${formatBDT(newOrders.length)}টি নতুন অর্ডার এসেছে!`
        : `নতুন অর্ডার: ${latest.orderNumber}`;
    el('new-order-toast-body').innerHTML = `
      <strong>${escapeHtml(latest.customerName)}</strong> (${escapeHtml(latest.customerPhone)}) ·
      ${escapeHtml(latest.productName)} (${escapeHtml(latest.unitLabel)}) ·
      <strong class="tabular-nums">৳ ${formatBDT(latest.totalAmount)}</strong>
    `;
    toast.classList.remove('hidden');

    if (state.toastHideTimer) clearTimeout(state.toastHideTimer);
    state.toastHideTimer = setTimeout(hideNewOrderToast, 12000);
  }

  function fireBrowserNotification(newOrders) {
    if (!('Notification' in window) || Notification.permission !== 'granted' || !newOrders.length) {
      return;
    }
    const latest = newOrders[0];
    try {
      const n = new Notification(`Maltibazar BD — নতুন অর্ডার ${latest.orderNumber}`, {
        body: `${latest.customerName} (${latest.customerPhone}) — ${latest.productName} · ৳ ${formatBDT(latest.totalAmount)}`,
        icon: './assets/images/maltibazar_logo_1795244491759.jpg',
        tag: `mb-order-${latest.id}`,
      });
      n.onclick = () => {
        window.focus();
        state.ordersTab = 'admin';
        navigate('orders');
        n.close();
      };
    } catch {
      // Ignore Notification constructor errors in restricted browsers
    }
  }

  function updateDocumentTitleAndUnreadUI() {
    const unreadCount = state.unreadOrderIds.size;
    document.title =
      unreadCount > 0 ? `(${formatBDT(unreadCount)}) নতুন অর্ডার! — ${state.baseTitle}` : state.baseTitle;

    const banner = el('admin-unread-banner');
    const textEl = el('admin-unread-banner-text');
    if (!banner || !textEl) return;

    if (unreadCount > 0 && API.getAdminSession()) {
      textEl.textContent = `${formatBDT(unreadCount)}টি নতুন অর্ডার এসেছে ও অপেক্ষমাণ রয়েছে!`;
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }

  function stopAdminAutoSync() {
    if (state.adminSyncTimer) {
      clearInterval(state.adminSyncTimer);
      state.adminSyncTimer = null;
    }
    if (typeof state.realtimeUnsubscribe === 'function') {
      state.realtimeUnsubscribe();
      state.realtimeUnsubscribe = null;
    }
    state.knownOrderIds = null;
    state.unreadOrderIds.clear();
    updateDocumentTitleAndUnreadUI();
  }

  function startAdminAutoSync() {
    if (!API.getAdminSession()) return;

    if (!state.realtimeUnsubscribe && typeof API.subscribeToOrdersRealtime === 'function') {
      state.realtimeUnsubscribe = API.subscribeToOrdersRealtime(() => {
        loadAdminData({ silent: true });
      });
    }

    if (!state.adminSyncTimer) {
      state.adminSyncTimer = setInterval(() => {
        if (!API.getAdminSession()) {
          stopAdminAutoSync();
          return;
        }
        loadAdminData({ silent: true });
      }, 5000);
    }
  }

  async function loadAdminData(options = {}) {
    const silent = Boolean(options && options.silent);
    if (!API.getAdminSession() || state.syncInFlight) return;

    state.syncInFlight = true;
    if (!silent && state.adminOrders.length === 0) {
      state.adminOrdersLoading = true;
      renderAdminOrdersList();
    }

    try {
      const [ordersRes, msgRes] = await Promise.all([
        API.adminListOrders(),
        API.adminListMessages(),
      ]);

      state.adminOrdersLoading = false;
      if (ordersRes.ok && ordersRes.data?.orders) {
        const fetchedOrders = ordersRes.data.orders;
        if (state.knownOrderIds !== null) {
          const brandNewOrders = fetchedOrders.filter((o) => !state.knownOrderIds.has(o.id));
          if (brandNewOrders.length > 0) {
            brandNewOrders.forEach((o) => state.unreadOrderIds.add(o.id));
            playOrderChime();
            showNewOrderToast(brandNewOrders);
            fireBrowserNotification(brandNewOrders);
          }
        } else {
          // On initial admin login, highlight pending orders as awaiting review
          const pendingOrders = fetchedOrders.filter((o) => o.status === 'pending');
          if (pendingOrders.length > 0) {
            pendingOrders.forEach((o) => state.unreadOrderIds.add(o.id));
            showNewOrderToast(pendingOrders);
          }
        }
        state.knownOrderIds = new Set(fetchedOrders.map((o) => o.id));
        state.adminOrders = fetchedOrders;
      } else if (ordersRes.status === 401 || ordersRes.status === 403) {
        stopAdminAutoSync();
        await API.adminSignOut();
        renderOrdersPage();
        return;
      }

      if (msgRes.ok && msgRes.data?.messages) {
        state.adminMessages = msgRes.data.messages;
      }

      updateDocumentTitleAndUnreadUI();
      updateNavOrderBadge();
      if (state.activePage === 'orders' && state.ordersTab === 'admin') {
        renderOrdersStats();
        if (!state.confirmDeleteId) {
          renderAdminOrdersList();
        }
        renderAdminMessagesList();
      }
    } finally {
      state.syncInFlight = false;
    }
  }

  function bindAdminOrderCardEvents(container) {
    container.querySelectorAll('.admin-status-select').forEach((sel) => {
      sel.addEventListener('change', async () => {
        const orderId = sel.dataset.id;
        const newStatus = sel.value;
        const res = await API.adminUpdateOrderStatus(orderId, newStatus);
        if (res.ok && res.data?.order) {
          state.adminOrders = state.adminOrders.map((o) =>
            o.id === orderId ? res.data.order : o
          );
          renderOrdersStats();
          renderAdminOrdersList();
        }
      });
    });

    container.querySelectorAll('.admin-delete-ask').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.confirmDeleteId = btn.dataset.id;
        renderAdminOrdersList();
      });
    });

    container.querySelectorAll('.admin-delete-cancel').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.confirmDeleteId = null;
        renderAdminOrdersList();
      });
    });

    container.querySelectorAll('.admin-delete-confirm').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const orderId = btn.dataset.id;
        const res = await API.adminDeleteOrder(orderId);
        if (res.ok) {
          state.confirmDeleteId = null;
          state.adminOrders = state.adminOrders.filter((o) => o.id !== orderId);
          updateNavOrderBadge();
          renderOrdersStats();
          renderAdminOrdersList();
        }
      });
    });
  }

  function renderAdminOrdersList() {
    const wrap = el('admin-orders-list');
    if (state.adminOrdersLoading) {
      wrap.innerHTML = `<div class="empty-state-box" style="font-size:0.875rem;color:var(--ink-muted);">Supabase থেকে অর্ডার তালিকা লোড হচ্ছে...</div>`;
      return;
    }

    const q = state.adminSearch.trim().toLowerCase();
    const filtered = state.adminOrders.filter((o) => {
      if (state.adminStatusFilter !== 'all' && o.status !== state.adminStatusFilter) return false;
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q)
      );
    });

    if (filtered.length === 0) {
      wrap.innerHTML = `
        <div class="empty-state-box">
          <p style="font-size:1rem;font-weight:700;color:var(--ink);">
            ${state.adminOrders.length === 0 ? 'এখনো কোনো অর্ডার জমা পড়েনি' : 'খুঁজে পাওয়া যায়নি'}
          </p>
          <p style="font-size:0.875rem;color:var(--ink-muted);margin-top:0.25rem;">
            ${state.adminOrders.length === 0 ? 'নতুন কাস্টমার অর্ডার করলে স্বয়ংক্রিয়ভাবে এখানে জমা হবে।' : 'অন্য অর্ডার নাম্বার বা ফিল্টার দিয়ে চেষ্টা করুন।'}
          </p>
        </div>
      `;
      return;
    }

    wrap.innerHTML = filtered.map((o) => renderOrderCardHTML(o, true)).join('');
    bindAdminOrderCardEvents(wrap);
  }

  function renderAdminMessagesList() {
    const wrap = el('admin-messages-list');
    if (!state.adminMessages.length) {
      wrap.innerHTML = `<div class="empty-state-box" style="padding:1.5rem;font-size:0.875rem;color:var(--ink-muted);">এখনো কোনো কাস্টমার বার্তা আসেনি।</div>`;
      return;
    }

    wrap.innerHTML = state.adminMessages
      .map(
        (m) => `
      <div class="order-card" style="padding:1rem;">
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:0.5rem;margin-bottom:0.375rem;">
          <strong style="font-size:0.875rem;">${escapeHtml(m.name)} · <span class="tabular-nums">${escapeHtml(m.phone)}</span></strong>
          <span style="font-size:0.75rem;color:var(--ink-muted);">${escapeHtml(formatDate(m.created_at || m.createdAt))}</span>
        </div>
        <p style="font-size:0.875rem;color:var(--ink-secondary);">${escapeHtml(m.message)}</p>
      </div>
    `
      )
      .join('');
  }

  function renderOrdersPage() {
    const isCustomer = state.ordersTab === 'customer';
    el('tab-my-orders').classList.toggle('is-active', isCustomer);
    el('tab-admin-panel').classList.toggle('is-active', !isCustomer);
    el('customer-orders-panel').classList.toggle('hidden', !isCustomer);
    el('admin-orders-panel').classList.toggle('hidden', isCustomer);

    const cfg = API.getConfig();
    el('preview-mode-banner').classList.toggle('hidden', cfg.isConfigured);

    if (isCustomer) {
      renderMyOrdersList();
      renderOrdersStats();
      API.refreshMySessionOrders().then((freshOrders) => {
        if (state.ordersTab === 'customer' && Array.isArray(freshOrders)) {
          state.myOrders = freshOrders;
          renderMyOrdersList();
          renderOrdersStats();
        }
      });
      return;
    }

    const session = API.getAdminSession();
    if (!session) {
      stopAdminAutoSync();
      el('admin-login-card').classList.remove('hidden');
      el('admin-workspace').classList.add('hidden');
      renderOrdersStats();
    } else {
      el('admin-login-card').classList.add('hidden');
      el('admin-workspace').classList.remove('hidden');
      el('admin-supabase-warning').classList.toggle('hidden', cfg.isConfigured);
      el('admin-user-email').textContent = session.user?.email || 'Admin';
      updateNotifyButtonUI();
      updateDocumentTitleAndUnreadUI();
      startAdminAutoSync();
      loadAdminData({ silent: state.adminOrders.length > 0 });
    }
  }

  // ---- Event Listeners ----
  function bindEvents() {
    // Navigation buttons
    document.addEventListener('click', (e) => {
      const navBtn = e.target.closest('[data-nav]');
      if (navBtn) {
        navigate(navBtn.dataset.nav);
      }
    });

    // Mobile Menu
    el('mobile-menu-toggle').addEventListener('click', () => {
      const drawer = el('mobile-drawer');
      const isOpen = !drawer.classList.contains('hidden');
      drawer.classList.toggle('hidden', isOpen);
      el('mobile-menu-toggle').setAttribute('aria-expanded', String(!isOpen));
      el('mobile-menu-icon-open').classList.toggle('hidden', !isOpen);
      el('mobile-menu-icon-close').classList.toggle('hidden', isOpen);
    });

    // Synced Search Inputs
    el('hero-search-input').addEventListener('input', (e) => setSearchQuery(e.target.value));
    el('shop-search-input').addEventListener('input', (e) => setSearchQuery(e.target.value));
    el('hero-search-clear').addEventListener('click', () => setSearchQuery(''));
    el('shop-search-clear').addEventListener('click', () => setSearchQuery(''));
    el('empty-show-all-btn').addEventListener('click', () => {
      setSearchQuery('');
      state.selectedCategory = 'all';
      renderShop();
    });

    el('hero-search-form').addEventListener('submit', (e) => {
      e.preventDefault();
      navigate('shop');
    });

    // Contact Form -> Supabase contact_messages
    el('contact-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = el('contact-error-msg');
      errEl.classList.add('hidden');

      const btn = el('contact-submit-btn');
      btn.disabled = true;
      btn.textContent = 'পাঠানো হচ্ছে...';

      const res = await API.submitContactMessage({
        name: el('contact-name').value,
        phone: el('contact-phone').value,
        message: el('contact-msg').value,
      });

      btn.disabled = false;
      btn.textContent = 'বার্তা পাঠান';

      if (!res.ok) {
        errEl.textContent = res.error || 'বার্তা পাঠানো যায়নি।';
        errEl.classList.remove('hidden');
        return;
      }

      el('contact-name').value = '';
      el('contact-phone').value = '';
      el('contact-msg').value = '';
      el('contact-form').classList.add('hidden');
      el('contact-success-box').classList.remove('hidden');
    });

    el('contact-reset-btn').addEventListener('click', () => {
      el('contact-success-box').classList.add('hidden');
      el('contact-form').classList.remove('hidden');
    });

    // Modal Backdrop / Close / Escape
    el('order-modal-close').addEventListener('click', closeOrderModal);
    el('order-modal').addEventListener('click', (e) => {
      if (e.target === el('order-modal')) closeOrderModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.modal) closeOrderModal();
    });

    // Orders Subtabs (Customer Tracker vs Admin Panel)
    el('tab-my-orders').addEventListener('click', () => {
      state.ordersTab = 'customer';
      renderOrdersPage();
    });
    el('tab-admin-panel').addEventListener('click', () => {
      state.ordersTab = 'admin';
      renderOrdersPage();
    });
    el('back-to-shop-btn').addEventListener('click', () => navigate('shop'));

    // Customer Order Tracker
    el('track-order-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = el('track-error-msg');
      const resBox = el('tracked-order-result');
      errEl.classList.add('hidden');
      resBox.innerHTML = '';

      const btn = el('track-order-btn');
      btn.disabled = true;
      btn.textContent = 'খোঁজা হচ্ছে...';

      const res = await API.trackOrder(
        el('track-order-number').value,
        el('track-order-phone').value
      );

      btn.disabled = false;
      btn.textContent = 'অর্ডার খুঁজুন';

      if (!res.ok || !res.data?.order) {
        errEl.textContent = res.error || 'অর্ডার খুঁজে পাওয়া যায়নি।';
        errEl.classList.remove('hidden');
        return;
      }

      resBox.innerHTML = renderOrderCardHTML(res.data.order, false);
    });

    // Admin Login Form
    el('admin-login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = el('admin-login-error');
      errEl.classList.add('hidden');

      const btn = el('admin-login-btn');
      btn.disabled = true;
      btn.textContent = 'যাচাই করা হচ্ছে...';

      const res = await API.adminSignIn(
        el('admin-email').value,
        el('admin-password').value
      );

      btn.disabled = false;
      btn.textContent = 'অ্যাডমিন প্যানেলে প্রবেশ করুন';

      if (!res.ok) {
        errEl.textContent = res.error || 'লগইন ব্যর্থ হয়েছে।';
        errEl.classList.remove('hidden');
        return;
      }

      el('admin-password').value = '';
      state.knownOrderIds = null;
      startAdminAutoSync();
      renderOrdersPage();
    });

    el('login-db-check-btn').addEventListener('click', async () => {
      const btn = el('login-db-check-btn');
      const box = el('admin-db-check-result');
      btn.disabled = true;
      btn.textContent = 'পরীক্ষা হচ্ছে...';
      box.className = 'alert-info';
      box.textContent = 'Cloud Database ও API সংযোগ যাচাই করা হচ্ছে...';
      box.classList.remove('hidden');

      const res = await API.checkDatabaseConnection();
      btn.disabled = false;
      btn.textContent = 'Database পরীক্ষা করুন';

      if (res.ok) {
        box.className = 'alert-notify';
        box.textContent = 'Cloud Database সংযোগ এবং API সঠিকভাবে কাজ করছে!';
      } else {
        box.className = 'alert-error';
        box.textContent = res.error || 'Cloud Database সংযোগ ব্যর্থ হয়েছে।';
      }
    });

    el('admin-mark-seen-btn').addEventListener('click', () => {
      state.unreadOrderIds.clear();
      hideNewOrderToast();
      updateDocumentTitleAndUnreadUI();
    });

    el('admin-notify-btn').addEventListener('click', async () => {
      playOrderChime();
      if ('Notification' in window && Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch {
          // Ignore permission request failure
        }
      }
      updateNotifyButtonUI();
    });

    el('new-order-toast-close').addEventListener('click', hideNewOrderToast);
    el('new-order-toast-view').addEventListener('click', () => {
      hideNewOrderToast();
      state.ordersTab = 'admin';
      navigate('orders');
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && API.getAdminSession()) {
        loadAdminData({ silent: true });
      }
    });

    el('admin-refresh-btn').addEventListener('click', () => loadAdminData({ silent: false }));
    el('admin-logout-btn').addEventListener('click', async () => {
      stopAdminAutoSync();
      hideNewOrderToast();
      await API.adminSignOut();
      state.adminOrders = [];
      state.adminMessages = [];
      updateNavOrderBadge();
      renderOrdersPage();
    });

    el('admin-order-search').addEventListener('input', (e) => {
      state.adminSearch = e.target.value;
      renderAdminOrdersList();
    });

    el('admin-status-tabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.status-tab-btn');
      if (!btn) return;
      state.adminStatusFilter = btn.dataset.status;
      el('admin-status-tabs').querySelectorAll('.status-tab-btn').forEach((b) => {
        b.classList.toggle('is-active', b === btn);
      });
      renderAdminOrdersList();
    });
  }

  // ---- Init ----
  hydrateStaticContent();
  bindEvents();
  renderShop();
  updateNavOrderBadge();
  if (API.getAdminSession()) {
    startAdminAutoSync();
    loadAdminData({ silent: true });
  }
})();
