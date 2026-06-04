// main.js
// Shared utilities for Mr. LetsGo: product access + cart (localStorage) + common UI init

const CART_KEY = 'mrletsgo_cart';

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

// Convenience: call after cart mutations if you want immediate feedback elsewhere
window.MrLetsGo = { getCart, addToCart, removeFromCart, updateCartQuantity, getCartTotal, clearCart, updateCartCount };
