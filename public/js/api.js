/**
 * Maltibazar BD — Supabase REST & Auth API Client (Pure Vanilla JS)
 * Always normalizes every API call into a strict JSON shape:
 *   { ok: boolean, status: number, data: object | null, error: string | null }
 *
 * Security:
 * - Only uses PUBLIC SUPABASE_URL + SUPABASE_ANON_KEY from window.MALTIBAZAR_CONFIG.
 * - Never embeds any service_role secret key in frontend code.
 * - Admin authentication uses Supabase Auth JWT stored in sessionStorage only.
 * - Row Level Security (RLS) on Supabase enforces access control at the database layer.
 */
(function () {
  const SESSION_KEY = 'maltibazar_admin_session';
  const MY_ORDERS_KEY = 'maltibazar_my_orders';
  const LOCAL_ORDERS_KEY = 'maltibazar_preview_orders';
  const LOCAL_MESSAGES_KEY = 'maltibazar_preview_messages';

  function getConfig() {
    const cfg = window.MALTIBAZAR_CONFIG || {};
    const url = String(cfg.SUPABASE_URL || '').trim().replace(/\/+$/, '');
    const anonKey = String(cfg.SUPABASE_ANON_KEY || '').trim();
    const isConfigured =
      Boolean(url) &&
      Boolean(anonKey) &&
      !url.includes('YOUR_PROJECT_ID') &&
      !anonKey.includes('YOUR_SUPABASE_ANON_KEY') &&
      /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url);

    return { url, anonKey, isConfigured };
  }

  function mapOrderRow(row) {
    if (!row || typeof row !== 'object') return null;
    return {
      id: row.id,
      orderNumber: row.orderNumber || row.order_number || '',
      createdAt: row.createdAt || row.created_at || new Date().toISOString(),
      productId: row.productId || row.product_id || '',
      productName: row.productName || row.product_name || '',
      productImage: row.productImage || row.product_image || '',
      categoryName: row.categoryName || row.category_name || '',
      unitLabel: row.unitLabel || row.unit_label || '৫০০ গ্রাম',
      unitPrice: Number(row.unitPrice ?? row.unit_price ?? 0),
      quantity: Number(row.quantity ?? 1),
      subtotal: Number(row.subtotal ?? 0),
      deliveryZone: (row.deliveryZone || row.delivery_zone) === 'outside' ? 'outside' : 'dhaka',
      deliveryFee: Number(row.deliveryFee ?? row.delivery_fee ?? 0),
      totalAmount: Number(row.totalAmount ?? row.total_amount ?? 0),
      paymentMethod: row.paymentMethod || row.payment_method || 'cod',
      transactionId: row.transactionId || row.transaction_id || undefined,
      customerName: row.customerName || row.customer_name || '',
      customerPhone: row.customerPhone || row.customer_phone || '',
      customerAddress: row.customerAddress || row.customer_address || '',
      note: row.note || undefined,
      status: row.status || 'pending',
    };
  }

  function getAdminSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.accessToken) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function setAdminSession(session) {
    try {
      if (!session) {
        sessionStorage.removeItem(SESSION_KEY);
      } else {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  function getMySessionOrders() {
    try {
      const raw = sessionStorage.getItem(MY_ORDERS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map(mapOrderRow).filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  function saveMySessionOrder(order) {
    if (!order) return;
    try {
      const existing = getMySessionOrders().filter((o) => o.id !== order.id);
      const updated = [order, ...existing].slice(0, 25);
      sessionStorage.setItem(MY_ORDERS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  }

  function readLocalStore(key) {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeLocalStore(key, items) {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch {
      // Ignore storage errors
    }
  }

  async function requestJSON(endpoint, options = {}) {
    const { url, anonKey } = getConfig();
    const session = getAdminSession();
    const useAuthToken = options.useAdminToken && session?.accessToken;

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${useAuthToken ? session.accessToken : anonKey}`,
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(`${url}${endpoint}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const rawText = await response.text();
      let parsed = null;
      if (rawText) {
        try {
          parsed = JSON.parse(rawText);
        } catch {
          parsed = { raw: rawText };
        }
      }

      if (!response.ok) {
        const message =
          (parsed && (parsed.message || parsed.error_description || parsed.error || parsed.hint)) ||
          `Request failed (${response.status})`;
        return {
          ok: false,
          status: response.status,
          data: parsed,
          error: String(message),
        };
      }

      return {
        ok: true,
        status: response.status,
        data: parsed,
        error: null,
      };
    } catch (err) {
      return {
        ok: false,
        status: 0,
        data: null,
        error: err instanceof Error ? err.message : 'নেটওয়ার্ক সংযোগে সমস্যা হয়েছে।',
      };
    }
  }

  async function ensureFreshAdminToken() {
    const cfg = getConfig();
    if (!cfg.isConfigured) return false;
    const session = getAdminSession();
    if (!session) return false;

    const nowSec = Math.floor(Date.now() / 1000);
    if (session.expiresAt && session.expiresAt - nowSec > 60) {
      return true;
    }
    if (!session.refreshToken) {
      setAdminSession(null);
      return false;
    }

    const res = await requestJSON('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: { refresh_token: session.refreshToken },
    });

    if (!res.ok || !res.data?.access_token) {
      setAdminSession(null);
      return false;
    }

    setAdminSession({
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token || session.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + Number(res.data.expires_in || 3600),
      user: {
        id: res.data.user?.id || session.user?.id || '',
        email: res.data.user?.email || session.user?.email || '',
      },
      mode: 'supabase',
    });
    return true;
  }

  // ---- Public Customer Actions ----

  async function createOrder(payload) {
    const cfg = getConfig();

    const customerName = String(payload.customerName || '').trim();
    const customerPhone = String(payload.customerPhone || '').trim();
    const customerAddress = String(payload.customerAddress || '').trim();
    const productId = String(payload.productId || '').trim();
    const productName = String(payload.productName || '').trim();
    const unitPrice = Number(payload.unitPrice);
    const quantity = Number(payload.quantity);
    const deliveryZone = payload.deliveryZone === 'outside' ? 'outside' : 'dhaka';
    const paymentMethod = ['cod', 'bkash', 'nagad', 'rocket'].includes(payload.paymentMethod)
      ? payload.paymentMethod
      : 'cod';
    const transactionId = payload.transactionId ? String(payload.transactionId).trim() : '';
    const note = payload.note ? String(payload.note).trim() : '';

    if (!customerName || !customerPhone || !customerAddress || !productId || !productName) {
      return {
        ok: false,
        status: 400,
        data: null,
        error: 'অনুগ্রহ করে নাম, মোবাইল নাম্বার, ঠিকানা এবং পণ্যের তথ্য দিন।',
      };
    }

    if (!Number.isFinite(unitPrice) || unitPrice <= 0 || !Number.isFinite(quantity) || quantity < 1) {
      return {
        ok: false,
        status: 400,
        data: null,
        error: 'পণ্যের মূল্য বা পরিমাণ সঠিক নয়।',
      };
    }

    if (paymentMethod !== 'cod' && !transactionId) {
      return {
        ok: false,
        status: 400,
        data: null,
        error: 'মোবাইল ব্যাংকিং পেমেন্টের জন্য ট্রানজেকশন আইডি (TrxID) লিখুন।',
      };
    }

    if (!cfg.isConfigured) {
      // Local browser preview mode before Supabase keys are pasted in config.js
      const subtotal = Math.round(unitPrice * quantity);
      const deliveryFee = subtotal >= 2000 ? 0 : deliveryZone === 'dhaka' ? 60 : 120;
      const totalAmount = subtotal + deliveryFee;
      const existing = readLocalStore(LOCAL_ORDERS_KEY);
      const order = {
        id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        orderNumber: `MB-${1001 + existing.length}`,
        createdAt: new Date().toISOString(),
        productId,
        productName,
        productImage: String(payload.productImage || ''),
        categoryName: String(payload.categoryName || ''),
        unitLabel: String(payload.unitLabel || '৫০০ গ্রাম'),
        unitPrice,
        quantity,
        subtotal,
        deliveryZone,
        deliveryFee,
        totalAmount,
        paymentMethod,
        transactionId: transactionId || undefined,
        customerName,
        customerPhone,
        customerAddress,
        note: note || undefined,
        status: 'pending',
      };
      writeLocalStore(LOCAL_ORDERS_KEY, [order, ...existing]);
      saveMySessionOrder(order);
      return { ok: true, status: 201, data: { order }, error: null };
    }

    // Live Supabase Mode via SECURITY DEFINER RPC (strict JSON response + RLS safe)
    const rpcRes = await requestJSON('/rest/v1/rpc/create_order', {
      method: 'POST',
      body: {
        p_product_id: productId,
        p_product_name: productName,
        p_product_image: String(payload.productImage || ''),
        p_category_name: String(payload.categoryName || ''),
        p_unit_label: String(payload.unitLabel || '৫০০ গ্রাম'),
        p_unit_price: unitPrice,
        p_quantity: quantity,
        p_delivery_zone: deliveryZone,
        p_payment_method: paymentMethod,
        p_transaction_id: transactionId || null,
        p_customer_name: customerName,
        p_customer_phone: customerPhone,
        p_customer_address: customerAddress,
        p_note: note || null,
      },
    });

    if (!rpcRes.ok || !rpcRes.data || !rpcRes.data.order) {
      return {
        ok: false,
        status: rpcRes.status || 400,
        data: rpcRes.data,
        error: rpcRes.error || 'অর্ডার সংরক্ষণ করা যায়নি।',
      };
    }

    const order = mapOrderRow(rpcRes.data.order);
    saveMySessionOrder(order);
    return { ok: true, status: 201, data: { order }, error: null };
  }

  async function trackOrder(orderNumber, phone) {
    const cfg = getConfig();
    const cleanNo = String(orderNumber || '').trim().toUpperCase();
    const cleanPhone = String(phone || '').replace(/[^0-9]/g, '');

    if (!cleanNo || !cleanPhone) {
      return {
        ok: false,
        status: 400,
        data: null,
        error: 'অনুগ্রহ করে অর্ডার নাম্বার এবং মোবাইল নাম্বার উভয়ই লিখুন।',
      };
    }

    if (!cfg.isConfigured) {
      const all = readLocalStore(LOCAL_ORDERS_KEY);
      const found = all.find(
        (o) =>
          String(o.orderNumber || '').toUpperCase() === cleanNo &&
          String(o.customerPhone || '').replace(/[^0-9]/g, '') === cleanPhone
      );
      if (!found) {
        return {
          ok: false,
          status: 404,
          data: null,
          error: 'অর্ডার নাম্বার বা মোবাইল নাম্বার মেলেনি।',
        };
      }
      return { ok: true, status: 200, data: { order: mapOrderRow(found) }, error: null };
    }

    const res = await requestJSON('/rest/v1/rpc/track_order', {
      method: 'POST',
      body: {
        p_order_number: cleanNo,
        p_phone: cleanPhone,
      },
    });

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data: res.data,
        error: res.error || 'অর্ডার খুঁজতে সমস্যা হয়েছে।',
      };
    }

    if (!res.data || res.data.ok === false || !res.data.order) {
      return {
        ok: false,
        status: 404,
        data: res.data,
        error: (res.data && res.data.error) || 'অর্ডার নাম্বার বা মোবাইল নাম্বার মেলেনি।',
      };
    }

    return {
      ok: true,
      status: 200,
      data: { order: mapOrderRow(res.data.order) },
      error: null,
    };
  }

  async function submitContactMessage(payload) {
    const cfg = getConfig();
    const name = String(payload.name || '').trim();
    const phone = String(payload.phone || '').trim();
    const message = String(payload.message || '').trim();

    if (!name || !phone || !message) {
      return {
        ok: false,
        status: 400,
        data: null,
        error: 'অনুগ্রহ করে নাম, মোবাইল নাম্বার এবং বার্তা লিখুন।',
      };
    }

    if (!cfg.isConfigured) {
      const existing = readLocalStore(LOCAL_MESSAGES_KEY);
      const item = {
        id: `msg_${Date.now()}`,
        createdAt: new Date().toISOString(),
        name,
        phone,
        message,
      };
      writeLocalStore(LOCAL_MESSAGES_KEY, [item, ...existing]);
      return { ok: true, status: 201, data: { message: item }, error: null };
    }

    const res = await requestJSON('/rest/v1/contact_messages', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: { name, phone, message },
    });

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data: res.data,
        error: res.error || 'বার্তা পাঠানো যায়নি।',
      };
    }

    return { ok: true, status: 201, data: { sent: true }, error: null };
  }

  // ---- Admin Auth & Management Actions (Supabase Auth + RLS) ----

  async function adminSignIn(email, password) {
    const cfg = getConfig();
    const cleanEmail = String(email || '').trim();
    const cleanPassword = String(password || '');

    if (!cfg.isConfigured) {
      // Local preview admin session before Supabase keys are added
      const session = {
        accessToken: 'local-preview-token',
        refreshToken: '',
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
        user: { id: 'preview-admin', email: cleanEmail || 'admin@maltibazarbd.com' },
        mode: 'local',
      };
      setAdminSession(session);
      return { ok: true, status: 200, data: { session }, error: null };
    }

    if (!cleanEmail || !cleanPassword) {
      return {
        ok: false,
        status: 400,
        data: null,
        error: 'অনুগ্রহ করে অ্যাডমিন ইমেইল এবং পাসওয়ার্ড দিন।',
      };
    }

    const res = await requestJSON('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: { email: cleanEmail, password: cleanPassword },
    });

    if (!res.ok || !res.data?.access_token) {
      return {
        ok: false,
        status: res.status || 401,
        data: res.data,
        error: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।',
      };
    }

    const session = {
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token || '',
      expiresAt: Math.floor(Date.now() / 1000) + Number(res.data.expires_in || 3600),
      user: {
        id: res.data.user?.id || '',
        email: res.data.user?.email || cleanEmail,
      },
      mode: 'supabase',
    };
    setAdminSession(session);

    // Verify user is listed in public.admin_users via RLS check
    const adminCheck = await requestJSON(
      `/rest/v1/admin_users?select=user_id,email&user_id=eq.${encodeURIComponent(session.user.id)}`,
      { method: 'GET', useAdminToken: true }
    );

    if (!adminCheck.ok || !Array.isArray(adminCheck.data) || adminCheck.data.length === 0) {
      setAdminSession(null);
      return {
        ok: false,
        status: 403,
        data: null,
        error: 'এই অ্যাকাউন্টটি অ্যাডমিন তালিকায় অনুমোদিত নয়। Supabase admin_users টেবিলে যুক্ত করুন।',
      };
    }

    return { ok: true, status: 200, data: { session }, error: null };
  }

  async function adminSignOut() {
    const cfg = getConfig();
    const session = getAdminSession();
    if (cfg.isConfigured && session?.accessToken && session.mode === 'supabase') {
      await requestJSON('/auth/v1/logout', { method: 'POST', useAdminToken: true });
    }
    setAdminSession(null);
    return { ok: true, status: 200, data: { signedOut: true }, error: null };
  }

  async function adminListOrders() {
    const cfg = getConfig();
    if (!cfg.isConfigured) {
      const orders = readLocalStore(LOCAL_ORDERS_KEY).map(mapOrderRow).filter(Boolean);
      return { ok: true, status: 200, data: { orders }, error: null };
    }

    const ready = await ensureFreshAdminToken();
    if (!ready) {
      return { ok: false, status: 401, data: null, error: 'অ্যাডমিন সেশন শেষ হয়েছে, অনুগ্রহ করে আবার লগইন করুন।' };
    }

    const res = await requestJSON('/rest/v1/orders?select=*&order=created_at.desc', {
      method: 'GET',
      useAdminToken: true,
    });

    if (!res.ok) {
      return { ok: false, status: res.status, data: res.data, error: res.error };
    }

    const rows = Array.isArray(res.data) ? res.data : [];
    return {
      ok: true,
      status: 200,
      data: { orders: rows.map(mapOrderRow).filter(Boolean) },
      error: null,
    };
  }

  async function adminUpdateOrderStatus(orderId, status) {
    if (!['pending', 'processing', 'shipped', 'delivered'].includes(status)) {
      return { ok: false, status: 400, data: null, error: 'সঠিক অর্ডার স্ট্যাটাস নির্বাচন করুন।' };
    }

    const cfg = getConfig();
    if (!cfg.isConfigured) {
      const orders = readLocalStore(LOCAL_ORDERS_KEY);
      const idx = orders.findIndex((o) => o.id === orderId);
      if (idx === -1) {
        return { ok: false, status: 404, data: null, error: 'অর্ডারটি খুঁজে পাওয়া যায়নি।' };
      }
      orders[idx] = { ...orders[idx], status };
      writeLocalStore(LOCAL_ORDERS_KEY, orders);
      return { ok: true, status: 200, data: { order: mapOrderRow(orders[idx]) }, error: null };
    }

    const ready = await ensureFreshAdminToken();
    if (!ready) {
      return { ok: false, status: 401, data: null, error: 'অ্যাডমিন সেশন শেষ হয়েছে, অনুগ্রহ করে আবার লগইন করুন।' };
    }

    const res = await requestJSON(`/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      useAdminToken: true,
      headers: { Prefer: 'return=representation' },
      body: { status },
    });

    if (!res.ok || !Array.isArray(res.data) || res.data.length === 0) {
      return {
        ok: false,
        status: res.status || 400,
        data: res.data,
        error: res.error || 'স্ট্যাটাস আপডেট করা যায়নি।',
      };
    }

    return {
      ok: true,
      status: 200,
      data: { order: mapOrderRow(res.data[0]) },
      error: null,
    };
  }

  async function adminDeleteOrder(orderId) {
    const cfg = getConfig();
    if (!cfg.isConfigured) {
      const orders = readLocalStore(LOCAL_ORDERS_KEY);
      const filtered = orders.filter((o) => o.id !== orderId);
      if (filtered.length === orders.length) {
        return { ok: false, status: 404, data: null, error: 'অর্ডারটি খুঁজে পাওয়া যায়নি।' };
      }
      writeLocalStore(LOCAL_ORDERS_KEY, filtered);
      return { ok: true, status: 200, data: { deleted: true }, error: null };
    }

    const ready = await ensureFreshAdminToken();
    if (!ready) {
      return { ok: false, status: 401, data: null, error: 'অ্যাডমিন সেশন শেষ হয়েছে, অনুগ্রহ করে আবার লগইন করুন।' };
    }

    const res = await requestJSON(`/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, {
      method: 'DELETE',
      useAdminToken: true,
      headers: { Prefer: 'return=representation' },
    });

    if (!res.ok) {
      return { ok: false, status: res.status, data: res.data, error: res.error };
    }

    return { ok: true, status: 200, data: { deleted: true }, error: null };
  }

  async function adminListMessages() {
    const cfg = getConfig();
    if (!cfg.isConfigured) {
      return {
        ok: true,
        status: 200,
        data: { messages: readLocalStore(LOCAL_MESSAGES_KEY) },
        error: null,
      };
    }

    const ready = await ensureFreshAdminToken();
    if (!ready) {
      return { ok: false, status: 401, data: null, error: 'অ্যাডমিন সেশন শেষ হয়েছে।' };
    }

    const res = await requestJSON('/rest/v1/contact_messages?select=*&order=created_at.desc', {
      method: 'GET',
      useAdminToken: true,
    });

    if (!res.ok) {
      return { ok: false, status: res.status, data: res.data, error: res.error };
    }

    return {
      ok: true,
      status: 200,
      data: { messages: Array.isArray(res.data) ? res.data : [] },
      error: null,
    };
  }

  window.MALTIBAZAR_API = {
    getConfig,
    getAdminSession,
    getMySessionOrders,
    createOrder,
    trackOrder,
    submitContactMessage,
    adminSignIn,
    adminSignOut,
    adminListOrders,
    adminUpdateOrderStatus,
    adminDeleteOrder,
    adminListMessages,
  };
})();
