-- ============================================================================
-- Maltibazar BD — Supabase PostgreSQL Schema & Row Level Security (RLS)
-- Run this entire script once in your Supabase Dashboard -> SQL Editor.
-- ============================================================================

-- 1. Sequence for human-friendly order numbers (MB-1001, MB-1002, ...)
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1001 INCREMENT BY 1;

-- 2. Admin Allowlist Table (links Supabase Auth users who can manage orders)
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT NOT NULL DEFAULT '',
  category_name TEXT NOT NULL DEFAULT '',
  unit_label TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price > 0),
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal > 0),
  delivery_zone TEXT NOT NULL CHECK (delivery_zone IN ('dhaka', 'outside')),
  delivery_fee NUMERIC(10, 2) NOT NULL CHECK (delivery_fee >= 0),
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'bkash', 'nagad', 'rocket')),
  transaction_id TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered'))
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number_phone ON public.orders (order_number, customer_phone);

-- 4. Contact Messages Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages (created_at DESC);

-- 5. Enable Row Level Security (RLS) on ALL tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
  );
$$;

-- 6. RLS Policies for admin_users
DROP POLICY IF EXISTS "Admins can read own admin record" ON public.admin_users;
CREATE POLICY "Admins can read own admin record"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 7. RLS Policies for orders
-- Customers (anon & authenticated) can INSERT new orders only as 'pending'
DROP POLICY IF EXISTS "Public can place pending orders" ON public.orders;
CREATE POLICY "Public can place pending orders"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND length(trim(customer_name)) > 0
    AND length(trim(customer_phone)) > 0
    AND length(trim(customer_address)) > 0
    AND unit_price > 0
    AND quantity >= 1
    AND total_amount > 0
  );

-- Only Admins can view all customer orders
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
CREATE POLICY "Admins can read all orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Only Admins can update order status
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only Admins can delete orders
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 8. RLS Policies for contact_messages
DROP POLICY IF EXISTS "Public can submit contact messages" ON public.contact_messages;
CREATE POLICY "Public can submit contact messages"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(trim(name)) > 0
    AND length(trim(phone)) > 0
    AND length(trim(message)) > 0
  );

DROP POLICY IF EXISTS "Admins can read contact messages" ON public.contact_messages;
CREATE POLICY "Admins can read contact messages"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete contact messages" ON public.contact_messages;
CREATE POLICY "Admins can delete contact messages"
  ON public.contact_messages
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 9. Secure JSON RPC: create_order (returns clean JSON receipt without exposing other orders)
CREATE OR REPLACE FUNCTION public.create_order(
  p_product_id TEXT,
  p_product_name TEXT,
  p_product_image TEXT,
  p_category_name TEXT,
  p_unit_label TEXT,
  p_unit_price NUMERIC,
  p_quantity INTEGER,
  p_delivery_zone TEXT,
  p_payment_method TEXT,
  p_transaction_id TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_address TEXT,
  p_note TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_zone TEXT;
  v_payment TEXT;
  v_subtotal NUMERIC(12, 2);
  v_delivery_fee NUMERIC(10, 2);
  v_total NUMERIC(12, 2);
  v_order_no TEXT;
  v_row public.orders%ROWTYPE;
BEGIN
  IF length(trim(coalesce(p_customer_name, ''))) = 0
     OR length(trim(coalesce(p_customer_phone, ''))) = 0
     OR length(trim(coalesce(p_customer_address, ''))) = 0
     OR length(trim(coalesce(p_product_id, ''))) = 0
     OR length(trim(coalesce(p_product_name, ''))) = 0 THEN
    RAISE EXCEPTION 'অনুগ্রহ করে নাম, মোবাইল নাম্বার, ঠিকানা এবং পণ্যের তথ্য দিন।';
  END IF;

  IF p_unit_price IS NULL OR p_unit_price <= 0 OR p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'পণ্যের মূল্য বা পরিমাণ সঠিক নয়।';
  END IF;

  v_zone := CASE WHEN p_delivery_zone = 'outside' THEN 'outside' ELSE 'dhaka' END;
  v_payment := CASE
    WHEN p_payment_method IN ('cod', 'bkash', 'nagad', 'rocket') THEN p_payment_method
    ELSE 'cod'
  END;

  IF v_payment <> 'cod' AND length(trim(coalesce(p_transaction_id, ''))) = 0 THEN
    RAISE EXCEPTION 'মোবাইল ব্যাংকিং পেমেন্টের জন্য ট্রানজেকশন আইডি (TrxID) প্রয়োজন।';
  END IF;

  v_subtotal := ROUND(p_unit_price * p_quantity);
  v_delivery_fee := CASE
    WHEN v_subtotal >= 2000 THEN 0
    WHEN v_zone = 'dhaka' THEN 60
    ELSE 120
  END;
  v_total := v_subtotal + v_delivery_fee;

  v_order_no := 'MB-' || nextval('public.order_number_seq')::TEXT;

  INSERT INTO public.orders (
    order_number,
    product_id,
    product_name,
    product_image,
    category_name,
    unit_label,
    unit_price,
    quantity,
    subtotal,
    delivery_zone,
    delivery_fee,
    total_amount,
    payment_method,
    transaction_id,
    customer_name,
    customer_phone,
    customer_address,
    note,
    status
  ) VALUES (
    v_order_no,
    trim(p_product_id),
    trim(p_product_name),
    coalesce(trim(p_product_image), ''),
    coalesce(trim(p_category_name), ''),
    coalesce(trim(p_unit_label), '৫০০ গ্রাম'),
    p_unit_price,
    p_quantity,
    v_subtotal,
    v_zone,
    v_delivery_fee,
    v_total,
    v_payment,
    NULLIF(trim(coalesce(p_transaction_id, '')), ''),
    trim(p_customer_name),
    trim(p_customer_phone),
    trim(p_customer_address),
    NULLIF(trim(coalesce(p_note, '')), ''),
    'pending'
  )
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'ok', true,
    'order', jsonb_build_object(
      'id', v_row.id,
      'orderNumber', v_row.order_number,
      'createdAt', v_row.created_at,
      'productId', v_row.product_id,
      'productName', v_row.product_name,
      'productImage', v_row.product_image,
      'categoryName', v_row.category_name,
      'unitLabel', v_row.unit_label,
      'unitPrice', v_row.unit_price,
      'quantity', v_row.quantity,
      'subtotal', v_row.subtotal,
      'deliveryZone', v_row.delivery_zone,
      'deliveryFee', v_row.delivery_fee,
      'totalAmount', v_row.total_amount,
      'paymentMethod', v_row.payment_method,
      'transactionId', v_row.transaction_id,
      'customerName', v_row.customer_name,
      'customerPhone', v_row.customer_phone,
      'customerAddress', v_row.customer_address,
      'note', v_row.note,
      'status', v_row.status
    )
  );
END;
$$;

-- 10. Secure JSON RPC: track_order (Customer can check ONLY their own order by Order Number + Phone)
CREATE OR REPLACE FUNCTION public.track_order(
  p_order_number TEXT,
  p_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.orders%ROWTYPE;
BEGIN
  SELECT *
  INTO v_row
  FROM public.orders
  WHERE upper(trim(order_number)) = upper(trim(coalesce(p_order_number, '')))
    AND regexp_replace(customer_phone, '[^0-9]', '', 'g') = regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'অর্ডার নাম্বার বা মোবাইল নাম্বার মেলেনি।'
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'order', jsonb_build_object(
      'id', v_row.id,
      'orderNumber', v_row.order_number,
      'createdAt', v_row.created_at,
      'productId', v_row.product_id,
      'productName', v_row.product_name,
      'productImage', v_row.product_image,
      'categoryName', v_row.category_name,
      'unitLabel', v_row.unit_label,
      'unitPrice', v_row.unit_price,
      'quantity', v_row.quantity,
      'subtotal', v_row.subtotal,
      'deliveryZone', v_row.delivery_zone,
      'deliveryFee', v_row.delivery_fee,
      'totalAmount', v_row.total_amount,
      'paymentMethod', v_row.payment_method,
      'transactionId', v_row.transaction_id,
      'customerName', v_row.customer_name,
      'customerPhone', v_row.customer_phone,
      'customerAddress', v_row.customer_address,
      'note', v_row.note,
      'status', v_row.status
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order(TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_order(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ============================================================================
-- AFTER CREATING YOUR ADMIN USER IN SUPABASE AUTH (Authentication -> Users),
-- RUN THIS ONE LINE WITH YOUR ADMIN USER'S EMAIL:
--
-- INSERT INTO public.admin_users (user_id, email)
-- SELECT id, email FROM auth.users WHERE email = 'your-admin@email.com'
-- ON CONFLICT (user_id) DO NOTHING;
-- ============================================================================
