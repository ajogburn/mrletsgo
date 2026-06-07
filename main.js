// main.js
// Shared utilities for Mr. LetsGo: product access + cart (localStorage) + common UI init

const CART_KEY = 'mrletsgo_cart';

// Load products from Supabase and populate window.products for consistent addToCart etc.
async function loadProductsFromSupabase() {
  try {
    const client = window.supabaseClient || window.getSupabase?.();
    if (!client) {
      console.warn('Supabase client not available for loading products');
      return [];
    }
    const { data, error } = await client
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    window.products = Array.isArray(data) ? data : [];
    console.log(`✅ Loaded ${window.products.length} products from Supabase`);
    return window.products;
  } catch (err) {
    console.error('Failed to load products from Supabase:', err);
    // Fallback to whatever was already set (e.g. static product.js on some pages)
    if (!window.products || !Array.isArray(window.products)) window.products = [];
    return window.products;
  }
}

function getProducts() {
  return (window.products && Array.isArray(window.products)) ? window.products : [];
}

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + (item.quantity || 1), 0);
}

function updateCartCount() {
  const el = document.getElementById('cart-count');
  if (el) el.textContent = getCartCount();
}

function addToCart(id, size = null) {
  const products = getProducts();
  const product = products.find(p => p.id === id);
  if (!product) {
    console.warn('Product not found:', id);
    return false;
  }

  const cart = getCart();
  const existingIndex = cart.findIndex(item => item.id === id && item.size === size);

  if (existingIndex > -1) {
    cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      img: product.img,
      size: size || null,
      quantity: 1
    });
  }

  saveCart(cart);
  updateCartCount();
  return true;
}

function removeFromCart(id, size) {
  let cart = getCart().filter(item => !(item.id === id && item.size === size));
  saveCart(cart);
  updateCartCount();
  return cart;
}

function updateCartQuantity(id, size, quantity) {
  const cart = getCart();
  const item = cart.find(i => i.id === id && i.size === size);
  if (item) {
    item.quantity = Math.max(1, parseInt(quantity, 10) || 1);
    saveCart(cart);
    updateCartCount();
  }
  return cart;
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCount();
}

// Initialize header, footer, mobile menu, and cart badge.
// Call this early in each page's script.
function initCommonUI() {
  const headerPh = document.getElementById('header-placeholder');
  const footerPh = document.getElementById('footer-placeholder');

  if (headerPh) {
    fetch('header.html')
      .then(r => r.text())
      .then(html => {
        headerPh.innerHTML = html;
        updateCartCount(); // badge lives in header
        // Wire up search + ensure mobile menu still works for this injection
        setupHeaderInteractions();
      })
      .catch(() => {});
  }

  if (footerPh) {
    fetch('footer.html')
      .then(r => r.text())
      .then(html => { footerPh.innerHTML = html; })
      .catch(() => {});
  }

  // Mobile menu toggle (idempotent)
  if (!window.__mlgMobileInit) {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#mobile-menu-btn');
      if (!btn) return;
      const menu = document.getElementById('mobile-menu');
      if (!menu) return;
      menu.classList.toggle('hidden');
      btn.innerHTML = menu.classList.contains('hidden')
        ? '<i class="fa-solid fa-bars"></i>'
        : '<i class="fa-solid fa-xmark"></i>';
    });
    window.__mlgMobileInit = true;
  }
}

// Inject + wire global search modal + header search button (called after each header injection)
function setupHeaderInteractions() {
  // Search button (may be re-injected)
  const searchBtn = document.getElementById('search-btn');
  if (searchBtn && !searchBtn.dataset.wired) {
    searchBtn.addEventListener('click', openSearchModal);
    searchBtn.dataset.wired = 'true';
  }

  // Ensure search modal exists once in body
  if (!document.getElementById('search-modal')) {
    const modal = document.createElement('div');
    modal.id = 'search-modal';
    modal.className = 'hidden fixed inset-0 z-[200] bg-black/80 flex items-start justify-center pt-20';
    modal.innerHTML = `
      <div class="w-full max-w-2xl mx-4 bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-700">
        <div class="p-4 flex items-center gap-3 border-b border-zinc-800">
          <i class="fa-solid fa-magnifying-glass text-yellow-400"></i>
          <input id="search-input" type="text" placeholder="Search sneakers, brands..." 
                 class="flex-1 bg-transparent text-lg outline-none placeholder:text-zinc-500">
          <button id="search-close" class="text-2xl leading-none px-2 text-gray-400 hover:text-white">&times;</button>
        </div>
        <div id="search-results" class="max-h-[60vh] overflow-auto p-2"></div>
        <div class="p-3 text-xs text-gray-500 border-t border-zinc-800">Press Esc to close • Results update as you type</div>
      </div>
    `;
    document.body.appendChild(modal);

    // Close handlers
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'search-modal') modal.classList.add('hidden');
    });
    modal.querySelector('#search-close').addEventListener('click', () => modal.classList.add('hidden'));

    // Live search
    const input = modal.querySelector('#search-input');
    const resultsEl = modal.querySelector('#search-results');

    let debounce;
    input.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(async () => {
        await renderSearchResults(input.value, resultsEl);
      }, 120);
    });

    // Keyboard close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        modal.classList.add('hidden');
      }
    });

    // Allow Enter to go to shop with query
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const q = input.value.trim();
        modal.classList.add('hidden');
        if (q) {
          window.location.href = `shop.html?search=${encodeURIComponent(q)}`;
        } else {
          window.location.href = 'shop.html';
        }
      }
    });
  }
}

async function openSearchModal() {
  const modal = document.getElementById('search-modal');
  if (!modal) return;
  modal.classList.remove('hidden');

  const input = modal.querySelector('#search-input');
  const resultsEl = modal.querySelector('#search-results');

  // Make sure we have latest products
  if (!getProducts().length) {
    await loadProductsFromSupabase();
  }

  input.value = '';
  input.focus();
  renderSearchResults('', resultsEl);
}

async function renderSearchResults(query, container) {
  if (!container) return;
  const products = getProducts().length ? getProducts() : await loadProductsFromSupabase();

  const results = searchProducts(query, products).slice(0, 8);

  if (!results.length) {
    container.innerHTML = `<div class="p-6 text-center text-gray-400">No matches for “${query || ''}”</div>`;
    return;
  }

  container.innerHTML = results.map(p => {
    const img = (getProductImages(p)[0]) || p.img;
    return `
      <a href="product.html?id=${p.id}" class="flex gap-4 items-center p-3 rounded-2xl hover:bg-zinc-800 transition">
        <img src="${img}" class="w-14 h-14 object-cover rounded-xl flex-shrink-0" 
             onerror="this.src='https://via.placeholder.com/56x56/27272a/fff?text=Img'">
        <div class="min-w-0 flex-1">
          <div class="font-medium truncate">${p.name}</div>
          <div class="text-sm text-gray-400">${p.brand || ''} • $${p.price}</div>
        </div>
        <div class="text-yellow-400 text-sm font-semibold">View →</div>
      </a>
    `;
  }).join('');
}

// Convenience: call after cart mutations if you want immediate feedback elsewhere
window.MrLetsGo = {
  getCart,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  getCartTotal,
  clearCart,
  updateCartCount,
  loadProductsFromSupabase,
  getProducts
};

// ============================================
// NEW: Multi-image, Brands, Search, Favorites
// ============================================

/** Return array of all images for a product (cover first + any additional) */
function getProductImages(product) {
  if (!product) return [];
  const imgs = [];
  if (product.img) imgs.push(product.img);
  if (Array.isArray(product.images)) {
    product.images.forEach(u => { if (u && !imgs.includes(u)) imgs.push(u); });
  } else if (typeof product.images === 'string') {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed)) parsed.forEach(u => { if (u && !imgs.includes(u)) imgs.push(u); });
    } catch (_) {}
  }
  return imgs.length ? imgs : ['https://via.placeholder.com/600x400/27272a/fff?text=No+Image'];
}

/** Client-side search across name + brand */
function searchProducts(query, products = null) {
  const list = products || getProducts();
  if (!query || !query.trim()) return list;
  const q = query.toLowerCase().trim();
  return list.filter(p =>
    (p.name && p.name.toLowerCase().includes(q)) ||
    (p.brand && p.brand.toLowerCase().includes(q))
  );
}

/** Get unique sorted list of brands from current products */
function getAllBrands(products = null) {
  const list = products || getProducts();
  const brands = new Set();
  list.forEach(p => { if (p.brand) brands.add(p.brand); });
  return Array.from(brands).sort();
}

// ---------- FAVORITES (requires Supabase Auth) ----------

async function getCurrentUserId() {
  try {
    const client = window.supabaseClient || window.getSupabase?.();
    if (!client) return null;
    const { data: { user } } = await client.auth.getUser();
    return user ? user.id : null;
  } catch (_) { return null; }
}

/** Returns array of favorited product objects for the logged-in user */
async function getUserFavorites() {
  const client = window.supabaseClient || window.getSupabase?.();
  if (!client) return [];
  const userId = await getCurrentUserId();
  if (!userId) return [];

  try {
    const { data: favs, error } = await client
      .from('favorites')
      .select('product_id')
      .eq('user_id', userId);

    if (error) throw error;
    if (!favs || favs.length === 0) return [];

    const ids = favs.map(f => f.product_id);
    const products = getProducts();
    // Try to use cached products first; fall back to a targeted fetch if needed
    let favProducts = products.filter(p => ids.includes(p.id));

    if (favProducts.length < ids.length) {
      // fetch missing ones
      const { data: extra } = await client
        .from('products')
        .select('*')
        .in('id', ids);
      if (extra) {
        const map = new Map(products.map(p => [p.id, p]));
        extra.forEach(p => map.set(p.id, p));
        favProducts = ids.map(id => map.get(id)).filter(Boolean);
      }
    }
    return favProducts;
  } catch (err) {
    console.error('Failed to load favorites:', err);
    return [];
  }
}

/** Toggle favorite on/off. Returns true if now favorited. */
async function toggleFavorite(productId) {
  const client = window.supabaseClient || window.getSupabase?.();
  if (!client) {
    alert('Please log in to favorite items.');
    return false;
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    // Send them to account page
    window.location.href = 'account.html';
    return false;
  }

  try {
    // Check if exists
    const { data: existing } = await client
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (existing) {
      // remove
      await client.from('favorites').delete().eq('id', existing.id);
      return false;
    } else {
      await client.from('favorites').insert({ user_id: userId, product_id: productId });
      return true;
    }
  } catch (err) {
    console.error('toggleFavorite error:', err);
    return false;
  }
}

/** Returns boolean whether this product is favorited by current user */
async function isFavorited(productId) {
  const client = window.supabaseClient || window.getSupabase?.();
  if (!client) return false;
  const userId = await getCurrentUserId();
  if (!userId) return false;

  try {
    const { data } = await client
      .from('favorites')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('product_id', productId);
    return (data && data.length > 0) || false; // head count path sometimes returns differently
  } catch (_) {
    // Fallback: use getUserFavorites
    const favs = await getUserFavorites();
    return favs.some(p => p.id === productId);
  }
}

// Expose new helpers
Object.assign(window.MrLetsGo, {
  getProductImages,
  searchProducts,
  getAllBrands,
  getUserFavorites,
  toggleFavorite,
  isFavorited
});

// Also attach to window for easy console / inline script access
window.getProductImages = getProductImages;
window.searchProducts = searchProducts;
window.getAllBrands = getAllBrands;
window.toggleFavorite = toggleFavorite;
window.isFavorited = isFavorited;
