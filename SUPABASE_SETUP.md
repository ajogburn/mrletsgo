# Supabase Setup (One-time — do this before deploying/using admin)

This project uses Supabase for products + admin auth. Follow these steps exactly once.

## 1. Go to your Supabase project
https://supabase.com/dashboard/project/zggmjpbgnxqrlootnqvk

## 2. Create the `products` table (if it doesn't already exist)

Go to **SQL Editor** and run this:

```sql
-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  img TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: add a few indexes
CREATE INDEX IF NOT EXISTS idx_products_id ON products(id);
```

## 3. Set up Row Level Security (RLS) — THIS IS THE KEY FIX

Run this entire block in the **SQL Editor**:

```sql
-- Enable RLS (safe default)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (even not logged in) can VIEW products (needed for shop + homepage)
DROP POLICY IF EXISTS "Public can read products" ON products;
CREATE POLICY "Public can read products"
  ON products
  FOR SELECT
  USING (true);

-- 2. Only logged-in users can INSERT new products (admin use)
DROP POLICY IF EXISTS "Authenticated can insert products" ON products;
CREATE POLICY "Authenticated can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3. Only logged-in users can UPDATE
DROP POLICY IF EXISTS "Authenticated can update products" ON products;
CREATE POLICY "Authenticated can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true);

-- 4. Only logged-in users can DELETE
DROP POLICY IF EXISTS "Authenticated can delete products" ON products;
CREATE POLICY "Authenticated can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (true);
```

After running, go to **Authentication → Policies** and verify the 4 policies exist on the products table.

## 4. Enable Authentication (Email + Password)

1. Go to **Authentication** in the sidebar.
2. Under **Providers**, make sure **Email** is enabled.
3. (Recommended for tonight) Go to **Email Templates → Confirm signup** and turn **Enable email confirmation** OFF (so you can sign up and use immediately without checking email).
   - You can turn it back on later and manually confirm users.

## 5. Create your admin user

**Easiest & most reliable:**
- Go to **Authentication → Users**
- Click **Add user** → "Create new user"
- Enter your email + a strong password
- Create the user (no confirmation email needed when you disabled it above)

You can now use that email + password in the Admin panel (`admin.html`).

Alternative: use the "Create account" button on admin.html after the policies are in place (if you enabled signups).

## 6. (Optional but recommended) Seed some initial products

You can either:
- Use the Admin panel after logging in, or
- In SQL Editor, run a few INSERTs with your existing data.

## 7. (Recommended) Seed your original 20 products quickly

After creating the table + policies, run this in SQL Editor to populate the store immediately with your existing catalog:

```sql
INSERT INTO products (name, price, img) VALUES
('Travis Scott x Air Jordan 1 Low OG TS SP', 220, 'https://photo.yupoo.com/dc32168168/6a928804d2/medium.jpg'),
('Nigel Sylvester x Jordan 4 OG', 210, 'https://photo.yupoo.com/dc32168168/1773d0435a/medium.jpg'),
('Awake NY x Air Jordan 6 ''Playful Pink''', 195, 'https://photo.yupoo.com/dc32168168/576bdeb251/medium.jpg'),
('Jordan 11 Retro ''Mother''s Day''', 180, 'https://photo.yupoo.com/dc32168168/009ab8954b/medium.jpg'),
('Jordan 3 Retro ''White and True Blue'' (GX)', 165, 'https://photo.yupoo.com/dc32168168/5c68679c7b/medium.jpg'),
('Jordan 3 Retro OG ''Brasil''', 155, 'https://photo.yupoo.com/dc32168168/278a4d4fdd/medium.jpg'),
('Jordan 4 Retro ''Comic''', 165, 'https://photo.yupoo.com/dc32168168/cdea8fa0be/medium.jpg'),
('Jordan 12 Retro ''Bloodline'' (GX)', 170, 'https://photo.yupoo.com/dc32168168/ef75d55afa/medium.jpg'),
('Jordan 6 Retro ''Oreo''', 155, 'https://photo.yupoo.com/dc32168168/30bb926281/medium.jpg'),
('Jordan 6 ''BIN23''', 160, 'https://photo.yupoo.com/dc32168168/cb9bc7e2/medium.jpg'),
('Nike Zoom Kobe 5 Protro ''Dodgers''', 145, 'https://photo.yupoo.com/dc32168168/7f545fae73/medium.jpg'),
('Balenciaga Jet Low ''Shell Yellow''', 195, 'https://photo.yupoo.com/dc32168168/830b5150f8/medium.jpg'),
('OFF-WHITE Low Top Brown', 175, 'https://photo.yupoo.com/dc32168168/616d53d6e9/medium.jpg'),
('New Balance 9060 Grey', 135, 'https://photo.yupoo.com/dc32168168/b6a361928a/medium.jpg'),
('Nike Air Max 95 ''Grape'' Big Bubble OG', 150, 'https://photo.yupoo.com/dc32168168/9c3fcbeef1/medium.jpg'),
('UNDEFEATED x Nike Air Max 95 SP', 155, 'https://photo.yupoo.com/dc32168168/5a6d2d5cdb/medium.jpg'),
('Air Jordan 17 Low SP ''Lightning''', 145, 'https://photo.yupoo.com/dc32168168/216e6fb4d0/medium.jpg'),
('Jordan 10 Retro ''Red Steel''', 145, 'https://photo.yupoo.com/dc32168168/b363520458/medium.jpg'),
('Jordan 4 ''Birds of Paradise''', 160, 'https://photo.yupoo.com/dc32168168/a65840902c/medium.jpg'),
('Jordan 3 Retro ''World''s Best Dad''', 160, 'https://photo.yupoo.com/dc32168168/1991365bf2/medium.jpg');
```

After this your shop will have the full catalog and you can still add/edit/delete via the admin panel.

## 8. Test

1. Open `admin.html` locally or after deploy.
2. Sign in with the user you created.
3. (Optional) Add or edit a product to verify writes work.
4. Visit `shop.html` and the homepage `index.html` — products should appear.
5. Click into a product and use "ADD TO CART" — it should work and update the cart badge.
6. Go to Cart and Checkout — flows should be functional (demo mode on checkout).

## Troubleshooting

- "new row violates row-level security policy" → RLS policies not applied or you're not authenticated in the client.
- Can't sign in → Check that you created the user in the Users table, and email confirm is off.
- Products not showing on homepage → The homepage now calls `loadProductsFromSupabase()`. Hard refresh (Ctrl/Cmd + Shift + R).
- Still seeing old static products → Make sure you don't have a browser-cached version of product.js being loaded on that page.

You're good to go after the SQL + user creation above.

---

## 9. (NEW) Multi-image, Brands, New Drops, Featured + Customer Favorites (2026 updates)

Run this in **SQL Editor** to add support for:

- Multiple images per product
- Brand tagging + filtering
- Admin-controlled "Featured Sneakers" and "New Drops" sections
- Customer favorites / wishlist (requires logged-in users)

```sql
-- 1. Extend products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_new_drop BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Helpful index for brand filtering
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_new_drop ON products(is_new_drop);

-- 2. Create favorites table (for customer wishlists)
CREATE TABLE IF NOT EXISTS favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 3. Enable RLS on favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own favorites
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 4. (Optional but recommended) Backfill some brands + flags on existing products
-- Example (run/adapt as needed):
UPDATE products SET brand = 'Jordan' WHERE name ILIKE '%jordan%' AND brand IS NULL;
UPDATE products SET brand = 'Nike' WHERE (name ILIKE '%nike%' OR name ILIKE '%kobe%' OR name ILIKE '%air max%') AND brand IS NULL;
UPDATE products SET brand = 'Balenciaga' WHERE name ILIKE '%balenciaga%' AND brand IS NULL;
UPDATE products SET brand = 'New Balance' WHERE name ILIKE '%new balance%' AND brand IS NULL;
UPDATE products SET brand = 'Off-White' WHERE name ILIKE '%off-white%' OR name ILIKE '%off white%' AND brand IS NULL;

-- Mark a few as featured / new drops (customize):
UPDATE products SET is_featured = true WHERE id IN (1,2,3,4);
UPDATE products SET is_new_drop = true WHERE id IN (1,5,9);
```

After running:

- Existing products keep working (img still used as cover).
- In Admin you can now set brand, add extra image URLs, toggle featured/new.
- Customers can favorite products once logged into their Account dashboard.

## 10. (Recommended) Create a customer-friendly user

You can use the same Supabase Auth users for both admin and customers. 
- Use `admin.html` for store management (you can bookmark it or access directly).
- Customers use the user icon in header → `account.html` (clean customer login + dashboard).
- No need for separate "admin" users unless you add a profiles.role column later for extra security.
```

## 11. Test the new features

1. Run the ALTER + CREATE + UPDATE SQL above.
2. Hard refresh the site.
3. Go to Admin → add/edit a product: you should see Brand input, multiple image fields, Featured/New toggles.
4. Visit homepage: you should see separate "New Drops" + "Featured Sneakers".
5. Click the search icon (magnifying glass) in header — search modal should appear and filter live.
6. Click user icon → customer login page (says "Account" or "My Account", not Admin).
7. After logging in as customer: see Favorites section, be able to heart products from shop/product pages.
8. Shop page: use filters for New Drops / brands.
```


