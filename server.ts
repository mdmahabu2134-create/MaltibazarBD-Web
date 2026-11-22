import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

interface StoredOrder {
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
  deliveryZone: 'dhaka' | 'outside';
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: 'cod' | 'bkash' | 'nagad' | 'rocket';
  transactionId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  note?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
}

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readOrders(): StoredOrder[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOrders(orders: StoredOrder[]) {
  ensureStorage();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Get all stored orders (newest first)
  app.get('/api/orders', (_req, res) => {
    const orders = readOrders();
    res.json({ orders });
  });

  // Create and store a new order
  app.post('/api/orders', (req, res) => {
    const body = req.body ?? {};
    const customerName = String(body.customerName ?? '').trim();
    const customerPhone = String(body.customerPhone ?? '').trim();
    const customerAddress = String(body.customerAddress ?? '').trim();
    const productId = String(body.productId ?? '').trim();
    const productName = String(body.productName ?? '').trim();
    const productImage = String(body.productImage ?? '').trim();
    const categoryName = String(body.categoryName ?? '').trim();
    const unitLabel = String(body.unitLabel ?? '').trim();
    const unitPrice = Number(body.unitPrice);
    const quantity = Number(body.quantity);
    const deliveryZone = body.deliveryZone === 'outside' ? 'outside' : 'dhaka';
    const paymentMethod = ['cod', 'bkash', 'nagad', 'rocket'].includes(body.paymentMethod)
      ? body.paymentMethod
      : 'cod';
    const transactionId = body.transactionId ? String(body.transactionId).trim() : undefined;
    const note = body.note ? String(body.note).trim() : undefined;

    if (!customerName || !customerPhone || !customerAddress || !productId || !productName) {
      res.status(400).json({ error: 'অনুগ্রহ করে নাম, মোবাইল নাম্বার, ঠিকানা এবং পণ্যের তথ্য দিন।' });
      return;
    }

    if (!Number.isFinite(unitPrice) || unitPrice <= 0 || !Number.isFinite(quantity) || quantity < 1) {
      res.status(400).json({ error: 'পণ্যের মূল্য বা পরিমাণ সঠিক নয়।' });
      return;
    }

    const subtotal = Math.round(unitPrice * quantity);
    const deliveryFee = subtotal >= 2000 ? 0 : deliveryZone === 'dhaka' ? 60 : 120;
    const totalAmount = subtotal + deliveryFee;

    const existing = readOrders();
    const nextNumber = 1001 + existing.length;

    const newOrder: StoredOrder = {
      id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      orderNumber: `MB-${nextNumber}`,
      createdAt: new Date().toISOString(),
      productId,
      productName,
      productImage,
      categoryName,
      unitLabel,
      unitPrice,
      quantity,
      subtotal,
      deliveryZone,
      deliveryFee,
      totalAmount,
      paymentMethod,
      transactionId,
      customerName,
      customerPhone,
      customerAddress,
      note,
      status: 'pending',
    };

    const updated = [newOrder, ...existing];
    writeOrders(updated);
    res.status(201).json({ order: newOrder });
  });

  // Update order status
  app.patch('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const status = req.body?.status;
    if (!['pending', 'processing', 'shipped', 'delivered'].includes(status)) {
      res.status(400).json({ error: 'সঠিক অর্ডার স্ট্যাটাস নির্বাচন করুন।' });
      return;
    }

    const orders = readOrders();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'অর্ডারটি খুঁজে পাওয়া যায়নি।' });
      return;
    }

    orders[idx] = { ...orders[idx], status };
    writeOrders(orders);
    res.json({ order: orders[idx] });
  });

  // Delete an order
  app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const orders = readOrders();
    const filtered = orders.filter((o) => o.id !== id);
    if (filtered.length === orders.length) {
      res.status(404).json({ error: 'অর্ডারটি খুঁজে পাওয়া যায়নি।' });
      return;
    }
    writeOrders(filtered);
    res.json({ deleted: true });
  });

  // Mount Vite middleware in development, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Maltibazar BD server running at http://localhost:${PORT}`);
  });
}

startServer();
