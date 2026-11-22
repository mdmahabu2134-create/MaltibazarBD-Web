/**
 * Maltibazar BD — Pure Cloud Database API & Realtime Client (Supabase REST, Auth & WebSocket)
 *
 * Strictly Cloud-First:
 * - Zero localStorage fallback for orders, contact messages, or admin login.
 * - Order creation only succeeds after Supabase PostgreSQL returns a persisted record.
 * - Always normalizes every API call into strict JSON:
 *   { ok: boolean, status: number, data: object | null, error: string | null }
 *
 * Security:
 * - Uses ONLY public SUPABASE_URL + SUPABASE_ANON_KEY from window.MALTIBAZAR_CONFIG.
 * - Never embeds any service_role secret key in frontend code.
 * - Admin authentication uses Supabase Auth JWT stored in sessionStorage only.
 * - Database access is enforced by Supabase Row Level Security (RLS).
 */
(function () {
  const SESSION_KEY = 'maltibazar_admin_session';
  const MY_RECEIPTS_KEY = 'maltibazar_my_cloud_receipts';

  function getConfig() {
    const cfg = window.MALTIBAZAR_CONFIG || {};
    const url = String(cfg.SUPABASE_URL || '').trim().replace(/\/+$/, '');
    const anonKey = String(cfg.SUPABASE_ANON_KEY || '').trim();

    const hasValidUrl =
      /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(url) &&
      !url.includes('YOUR_PROJECT_ID') &&
      !url.includes('example.com');
    const hasValidKey =
      anonKey.length > 20 &&
      !anonKey.includes('YOUR_SUPABASE_ANON_KEY') &&
      !anonKey.includes('service_role');

    return {
      url,
      anonKey,
      isConfigured: hasValidUrl && hasValidKey,
    };
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
      // Ignore storage restrictions
    }
  }

  function getMySessionOrders() {
    try {
      const raw = sessionStorage.getItem(MY_RECEIPTS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map(mapOrderRow).filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  function saveMySessionOrder(order) {
    if (!order || !order.id || !order.orderNumber) return;
    try {
      const existing = getMySessionOrders().filter((o) => o.id !== order.id);
      const updated = [order, ...existing].slice(0, 20);
      sessionStorage.setItem(MY_RECEIPTS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage restrictions
    }
  }

  async function requestJSON(endpoint, options = {}) {
    const { url, anonKey, isConfigured } = getConfig();
    if (!isConfigured) {
      return {
        ok: false,
        status: 503,
        data: null,
        error: 'Cloud Database সংযুক্ত নয়। অনুগ্রহ করে public/js/config.js ফাইলে আপনার Supabase URL ও Anon Key সেট করুন।',
      };
    }

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
        error:
          err instanceof Error
            ? `সার্ভার/ইন্টারনেট সংযোগ ব্যর্থ হয়েছে: ${err.message}`
            : 'নেটওয়ার্ক সংযোগে সমস্যা হয়েছে।',
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

  // ---- Cloud Database Connection Verification ----

  async function checkDatabaseConnection() {
    const cfg = getConfig();
    if (!cfg.isConfigured) {
      return {
        ok: false,
        status: 503,
        data: { configured: false, connected: false },
        error: 'public/js/config.js-এ এখনো Supabase URL ও Anon Key বসানো হয়নি।',
      };
    }

    const res = await requestJSON('/rest/v1/rpc/check_db_health', {
      method: 'POST',
      body: {},
    });

    if (res.ok && res.data?.ok) {
      return {
        ok: true,
        status: res.status,
        data: { configured: true, connected: true, details: res.data },
        error: null,
      };
    }

    // Fallback check if check_db_health RPC was not yet run, verify REST schema reachability
    if (res.status === 404) {
      const schemaRes = await requestJSON('/rest/v1/', { method: 'GET' });
      if (schemaRes.ok) {
        return {
          ok: false,
          status: 404,
          data: { configured: true, connected: true, schemaMissing: true },
          error: 'Supabase সংযুক্ত হয়েছে, তবে supabase/schema.sql এখনো SQL Editor-এ রান করা হয়নি।',
        };
      }
    }

    return {
      ok: false,
      status: res.status,
      data: { configured: true, connected: false },
      error: res.error || 'Cloud Database-এর সাথে সংযোগ স্থাপন করা যায়নি।',
    };
  }

  // ---- Public Customer Actions (Strictly Cloud Database) ----

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
      return {
        ok: false,
        status: 503,
        data: null,
        error:
          'Cloud Database সংযুক্ত নয়, তাই অর্ডার সংরক্ষণ করা যায়নি। সাইট অ্যাডমিনকে public/js/config.js-এ Supabase সেটআপ সম্পন্ন করতে হবে।',
      };
    }

    // Save strictly via Supabase Cloud Database RPC (no localStorage fallback)
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

    if (
      !rpcRes.ok ||
      !rpcRes.data ||
      rpcRes.data.ok === false ||
      !rpcRes.data.order ||
      !rpcRes.data.order.id ||
      !rpcRes.data.order.orderNumber
    ) {
      return {
        ok: false,
        status: rpcRes.status || 500,
        data: rpcRes.data,
        error:
          rpcRes.error ||
          'Cloud Database-এ অর্ডার সেভ করা যায়নি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
      };
    }

    const order = mapOrderRow(rpcRes.data.order);
    saveMySessionOrder(order);
    return { ok: true, status: 201, data: { order }, error: null };
  }

  async function trackOrder(orderNumber, phone) {
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
        error: res.error || 'Cloud Database থেকে অর্ডার খোঁজা যায়নি।',
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

    const mapped = mapOrderRow(res.data.order);
    return {
      ok: true,
      status: 200,
      data: { order: mapped },
      error: null,
    };
  }

  async function refreshMySessionOrders() {
    const cfg = getConfig();
    const receipts = getMySessionOrders();
    if (!cfg.isConfigured || receipts.length === 0) return receipts;

    const refreshed = await Promise.all(
      receipts.map(async (item) => {
        const res = await trackOrder(item.orderNumber, item.customerPhone);
        return res.ok && res.data?.order ? res.data.order : item;
      })
    );

    try {
      sessionStorage.setItem(MY_RECEIPTS_KEY, JSON.stringify(refreshed));
    } catch {
      // Ignore storage errors
    }
    return refreshed;
  }

  async function submitContactMessage(payload) {
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
        error: res.error || 'Cloud Database-এ বার্তা পাঠানো যায়নি।',
      };
    }

    return { ok: true, status: 201, data: { sent: true }, error: null };
  }

  // ---- Admin Auth & Management Actions (Strictly Supabase Auth + RLS) ----

  async function adminSignIn(email, password) {
    const cfg = getConfig();
    const cleanEmail = String(email || '').trim();
    const cleanPassword = String(password || '');

    if (!cleanEmail || !cleanPassword) {
      return {
        ok: false,
        status: 400,
        data: null,
        error: 'অনুগ্রহ করে অ্যাডমিন ইমেইল এবং পাসওয়ার্ড দিন।',
      };
    }

    if (!cfg.isConfigured) {
      return {
        ok: false,
        status: 503,
        data: null,
        error: 'Cloud Database সংযুক্ত নয়। public/js/config.js-এ Supabase URL ও Anon Key সেট করুন।',
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
        error:
          res.status === 0
            ? res.error
            : 'ইমেইল বা পাসওয়ার্ড সঠিক নয়, অথবা Supabase Auth-এ ইউজার তৈরি করা হয়নি।',
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

    // Auto-link primary admin in public.admin_users if eligible, then verify via RLS
    await requestJSON('/rest/v1/rpc/sync_primary_admin_on_login', {
      method: 'POST',
      useAdminToken: true,
      body: {},
    });

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
        error: 'এই অ্যাকাউন্টটি অ্যাডমিন তালিকায় অনুমোদিত নয়। Supabase SQL Editor-এ schema.sql রান করুন।',
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

  // ---- Supabase Realtime WebSocket Subscription (Instant Cross-Device Orders) ----

  function subscribeToOrdersRealtime(onOrderChange, onStatus) {
    const cfg = getConfig();
    const session = getAdminSession();
    if (!cfg.isConfigured || !session?.accessToken || typeof WebSocket === 'undefined') {
      if (typeof onStatus === 'function') onStatus('polling');
      return () => {};
    }

    let ws = null;
    let heartbeatTimer = null;
    let reconnectTimer = null;
    let closedByCaller = false;
    let refCounter = 1;

    const wsBase = cfg.url.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
    const wsUrl = `${wsBase}/realtime/v1/websocket?apikey=${encodeURIComponent(cfg.anonKey)}&vsn=1.0.0`;

    function sendMsg(topic, event, payload) {
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      ws.send(
        JSON.stringify({
          topic,
          event,
          payload,
          ref: String(refCounter++),
        })
      );
    }

    function connect() {
      if (closedByCaller) return;
      const activeSession = getAdminSession();
      if (!activeSession?.accessToken) return;

      try {
        ws = new WebSocket(wsUrl);
      } catch {
        if (typeof onStatus === 'function') onStatus('polling');
        return;
      }

      ws.onopen = () => {
        if (typeof onStatus === 'function') onStatus('realtime');
        sendMsg('realtime:public:orders', 'phx_join', {
          config: {
            broadcast: { self: false },
            presence: { key: '' },
            postgres_changes: [{ event: '*', schema: 'public', table: 'orders' }],
          },
          access_token: activeSession.accessToken,
        });

        clearInterval(heartbeatTimer);
        heartbeatTimer = setInterval(() => {
          sendMsg('phoenix', 'heartbeat', {});
        }, 25000);
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.event === 'postgres_changes' && msg.payload?.data) {
            const evtData = msg.payload.data;
            const mapped = evtData.record ? mapOrderRow(evtData.record) : null;
            if (typeof onOrderChange === 'function') {
              onOrderChange({
                eventType: evtData.type || 'INSERT',
                order: mapped,
              });
            }
          }
        } catch {
          // Ignore non-JSON frames
        }
      };

      ws.onerror = () => {
        if (typeof onStatus === 'function') onStatus('polling');
      };

      ws.onclose = () => {
        clearInterval(heartbeatTimer);
        if (typeof onStatus === 'function') onStatus('polling');
        if (!closedByCaller && getAdminSession()) {
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(connect, 6000);
        }
      };
    }

    connect();

    return function unsubscribe() {
      closedByCaller = true;
      clearInterval(heartbeatTimer);
      clearTimeout(reconnectTimer);
      if (ws) {
        try {
          ws.close();
        } catch {
          // Ignore close errors
        }
        ws = null;
      }
    };
  }

  window.MALTIBAZAR_API = {
    getConfig,
    checkDatabaseConnection,
    getAdminSession,
    getMySessionOrders,
    refreshMySessionOrders,
    createOrder,
    trackOrder,
    submitContactMessage,
    adminSignIn,
    adminSignOut,
    adminListOrders,
    adminUpdateOrderStatus,
    adminDeleteOrder,
    adminListMessages,
    subscribeToOrdersRealtime,
  };
})();
