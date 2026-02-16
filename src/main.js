import './style.css'
import { supabase } from './supabase.js'
import { escapeHtml } from './utils.js'

const WHATSAPP_PHONE = '51970663060'

document.addEventListener('DOMContentLoaded', async () => {

  // =========== PRODUCT DATA ===========
  const productsFallback = [
    // SEGUNDO DROP — POLOS JDM
    { id: 1, name: 'SUPRA BEIGE', price: 45, image: '/segundo-drop/supra-beige.jpeg', images: ['/segundo-drop/supra-beige.jpeg', '/segundo-drop/supra2-beige.jpeg'], category: 'polo', stock: 5, drop: 'segundo' },
    { id: 2, name: 'GODZILLA GTR', price: 50, image: '/segundo-drop/godzilla.jpeg', images: ['/segundo-drop/godzilla.jpeg', '/segundo-drop/godzilla-2.jpeg'], category: 'polo', stock: 7, drop: 'segundo' },
    { id: 3, name: 'SILVIA S15', price: 45, image: '/segundo-drop/silvias15-1.jpeg', images: ['/segundo-drop/silvias15-1.jpeg', '/segundo-drop/silvias15-2.jpeg'], category: 'polo', stock: 10, drop: 'segundo' },
    { id: 4, name: 'NISSAN 180SX', price: 48, image: '/segundo-drop/nissanlust-1.jpeg', images: ['/segundo-drop/nissanlust-1.jpeg', '/segundo-drop/nissanlust-2.jpeg'], category: 'polo', stock: 4, drop: 'segundo' },
    { id: 5, name: 'MAZDA RX7', price: 50, image: '/segundo-drop/mazdarx7-1.jpeg', images: ['/segundo-drop/mazdarx7-1.jpeg', '/segundo-drop/mazdarx7-2.jpeg'], category: 'polo', stock: 6, drop: 'segundo' },
    // TERCER DROP — COLECCIÓN ESPECIAL
    { id: 6, name: 'FUTURE BLACK', price: 55, image: '/tercer-drop/blackfuture-1.jpeg', category: 'polo', stock: 8, drop: 'tercer', newItem: true },
    { id: 7, name: 'FUTURE GRAY', price: 55, image: '/tercer-drop/grayfuture-1.jpeg', category: 'polo', stock: 10, drop: 'tercer', newItem: true },
    { id: 8, name: 'FUTURE WHITE', price: 55, image: '/tercer-drop/whitefuture-1.jpeg', category: 'polo', stock: 12, drop: 'tercer', newItem: true },
    { id: 9, name: 'GTR R35 NISMO', price: 55, image: '/tercer-drop/gt35-1.jpeg', category: 'polo', stock: 5, drop: 'tercer', newItem: true },
    { id: 10, name: 'SUPRA MK4', price: 55, image: '/tercer-drop/supramk4-1.jpeg', category: 'polo', stock: 6, drop: 'tercer', newItem: true },
    { id: 11, name: 'MAZDA RX7 V2', price: 55, image: '/tercer-drop/mazdarx7-1.jpeg', category: 'polo', stock: 7, drop: 'tercer', newItem: true },
    // PRIMER DROP — CHOPPERS
    { id: 12, name: 'WEST COAST CHOPPERS', price: 50, image: '/primer-drop/producto-principal.jpeg', category: 'polo', stock: 3, drop: 'primer' },
    // PERFUMES (nueva estructura con subcarpetas e imágenes múltiples)
    { id: 13, name: 'KHAMRA', price: 89, image: '/perfumes-drop/perfume-khamra/product-khamra.png', images: ['/perfumes-drop/perfume-khamra/product-khamra.png', '/perfumes-drop/perfume-khamra/khamra.png'], category: 'perfume', stock: 15 },
    { id: 14, name: 'SCEPTRE', price: 95, image: '/perfumes-drop/perfume-sceptre/product-sceptre.png', images: ['/perfumes-drop/perfume-sceptre/product-sceptre.png', '/perfumes-drop/perfume-sceptre/sceptre.png'], category: 'perfume', stock: 8 },
    { id: 15, name: 'WANTED', price: 78, image: '/perfumes-drop/perfume-mostwanted/product-mostwanted.png', images: ['/perfumes-drop/perfume-mostwanted/product-mostwanted.png', '/perfumes-drop/perfume-mostwanted/azzaro.png'], category: 'perfume', stock: 20 },
    { id: 16, name: 'NUIT', price: 85, image: '/perfumes-drop/perfume-nuit/product-nuit.png', images: ['/perfumes-drop/perfume-nuit/product-nuit.png', '/perfumes-drop/perfume-nuit/nuit.png'], category: 'perfume', stock: 11 },
    { id: 17, name: 'AQUA', price: 72, image: '/perfumes-drop/perfume-aqua/product-aqua.png', images: ['/perfumes-drop/perfume-aqua/product-aqua.png', '/perfumes-drop/perfume-aqua/aqua.png'], category: 'perfume', stock: 25 },
    { id: 18, name: 'WITH YOU', price: 82, image: '/perfumes-drop/perfume-with/product-with.png', images: ['/perfumes-drop/perfume-with/product-with.png', '/perfumes-drop/perfume-with/with.png'], category: 'perfume', stock: 6 },
    { id: 19, name: 'MANGO', price: 68, image: '/perfumes-drop/perfume-mango/product-mango.png', images: ['/perfumes-drop/perfume-mango/product-mango.png', '/perfumes-drop/perfume-mango/mango.png'], category: 'perfume', stock: 30 },
    { id: 20, name: 'HARAMAIN', price: 98, image: '/perfumes-drop/perfume-haramain/producto-haramain.png', images: ['/perfumes-drop/perfume-haramain/producto-haramain.png', '/perfumes-drop/perfume-haramain/haramain.png'], category: 'perfume', stock: 5 },
    // BIVIDIS COLLECTION
    { id: 21, name: 'BIVIDI BLANCO', price: 35, image: '/quinto-drop/bividi-blanco.jpeg', category: 'bividi', stock: 12, newItem: true },
    { id: 22, name: 'BIVIDI GRIS', price: 35, image: '/quinto-drop/bividi-gris.jpeg', category: 'bividi', stock: 15, newItem: true },
    { id: 23, name: 'BIVIDI NEGRO', price: 35, image: '/quinto-drop/bividi-negro.jpeg', category: 'bividi', stock: 10, newItem: true },
    { id: 24, name: 'BLANCO V2', price: 38, image: '/quinto-drop/blanco-2.jpeg', category: 'bividi', stock: 8, newItem: true },
    { id: 25, name: 'GRIS V2', price: 38, image: '/quinto-drop/gris-2.jpeg', category: 'bividi', stock: 9, newItem: true },
    { id: 26, name: 'NEGRO V2', price: 38, image: '/quinto-drop/negro-2.jpeg', category: 'bividi', stock: 14, newItem: true },
    { id: 27, name: 'TRES EDICIÓN', price: 40, image: '/quinto-drop/tres.jpeg', category: 'bividi', stock: 5, newItem: true },
    // BERMUDAS BAGGY COLLECTION
    { id: 28, name: 'BERMUDAS BAGGY BLANCO', price: 42, image: '/cuarto-drop/short-blanco.jpeg', category: 'short', stock: 18, drop: 'cuarto', newItem: true },
    { id: 29, name: 'BERMUDAS BAGGY CAFÉ', price: 42, image: '/cuarto-drop/short-cafe.jpeg', category: 'short', stock: 16, drop: 'cuarto', newItem: true },
    { id: 30, name: 'BERMUDAS BAGGY NEGRO', price: 42, image: '/cuarto-drop/short-negro.jpeg', category: 'short', stock: 20, drop: 'cuarto', newItem: true },
    // DROP SPACE
    { id: 31, name: 'SPACE BLACK', price: 48, image: '/drop-space/black-space.jpeg', category: 'polo', stock: 10, drop: 'space' },
    { id: 32, name: 'SPACE WHITE', price: 48, image: '/drop-space/white-space.jpeg', category: 'polo', stock: 12, drop: 'space' },
    { id: 33, name: 'SPACE RED', price: 48, image: '/drop-space/red-space.jpeg', category: 'polo', stock: 8, drop: 'space' },
    // POLERAS
    { id: 34, name: 'BLACK POLERA', price: 99, image: '/drop-poleras/blackpolera-1.jpeg', category: 'polera', stock: 5, drop: 'poleras' },
  ];

  let products = [...productsFallback];
  if (supabase) {
    const { data } = await supabase.from('products').select('*').order('sort_order', { ascending: true });
    if (data?.length > 0) {
      products = data.map((p, i) => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.price),
        image: p.image,
        images: (Array.isArray(p.images) && p.images.length) ? p.images : [p.image],
        category: p.category,
        stock: p.stock ?? 0,
        drop: p.drop_name || '',
        newItem: p.new_item ?? false
      }));
    }
  }

  // =========== CUSTOM CURSOR ===========
  const cursor = document.querySelector('.cursor');
  const follower = document.querySelector('.cursor-follower');

  if (cursor && follower && window.innerWidth > 768) {
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animateCursor() {
      cursorX += (mouseX - cursorX) * 0.2;
      cursorY += (mouseY - cursorY) * 0.2;
      followerX += (mouseX - followerX) * 0.1;
      followerY += (mouseY - followerY) * 0.1;

      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
      follower.style.left = followerX + 'px';
      follower.style.top = followerY + 'px';

      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    const interactiveElements = document.querySelectorAll('a, button, .product-card, .perfume-card');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => follower.classList.add('hover'));
      el.addEventListener('mouseleave', () => follower.classList.remove('hover'));
    });
  }

  // =========== MOBILE MENU ===========
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const closeMenu = document.getElementById('closeMenu');
  const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  function openMobileMenu() {
    mobileMenu.classList.add('open');
    mobileMenuOverlay.classList.add('open');
    menuBtn.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    mobileMenu.classList.remove('open');
    mobileMenuOverlay.classList.remove('open');
    menuBtn.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', openMobileMenu);
    closeMenu.addEventListener('click', closeMobileMenu);
    mobileMenuOverlay.addEventListener('click', closeMobileMenu);
    mobileNavLinks.forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  // =========== HERO BG CAROUSEL ===========
  const carSlides = document.querySelectorAll('.car-slide');
  const carDots = document.querySelectorAll('.car-dot');
  const carYearEl = document.querySelector('.car-year');
  const carModelEl = document.querySelector('.car-model');
  let carIndex = 0;

  const carNames = [
    { year: 'R34', model: 'SKYLINE GT-R' },
    { year: 'MKIV', model: 'SUPRA' },
    { year: 'FD', model: 'RX-7' },
    { year: 'S15', model: 'SILVIA' },
    { year: '69', model: 'CHARGER R/T' },
    { year: '69', model: 'MUSTANG BOSS' },
    { year: 'GSX', model: 'ECLIPSE' },
    { year: 'SS', model: 'MONTE CARLO' },
  ];

  function updateCarSlide(index) {
    carSlides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    carDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    if (carYearEl && carModelEl && carNames[index]) {
      carYearEl.style.opacity = '0';
      carModelEl.style.opacity = '0';
      setTimeout(() => {
        carYearEl.textContent = carNames[index].year;
        carModelEl.textContent = carNames[index].model;
        carYearEl.style.opacity = '1';
        carModelEl.style.opacity = '1';
      }, 300);
    }
  }

  if (carSlides.length > 0) {
    setInterval(() => {
      carIndex = (carIndex + 1) % carSlides.length;
      updateCarSlide(carIndex);
    }, 5000);

    carDots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        carIndex = i;
        updateCarSlide(carIndex);
      });
    });
  }

  // =========== FEATURED PRODUCTS CAROUSEL ===========
  const featuredItems = document.querySelectorAll('.featured-strip-inner .featured-item');
  const featuredPrevBtn = document.getElementById('featuredPrev');
  const featuredNextBtn = document.getElementById('featuredNext');
  const featuredDotsContainer = document.getElementById('featuredDots');
  const featuredDots = featuredDotsContainer ? featuredDotsContainer.querySelectorAll('.featured-dot') : [];
  let featuredIndex = 0;
  let featuredAutoPlay;

  function updateFeaturedCarousel(index) {
    // Remove all carousel classes
    featuredItems.forEach(item => {
      item.classList.remove('carousel-active', 'carousel-prev', 'carousel-next', 'carousel-far-prev', 'carousel-far-next');
    });

    const total = featuredItems.length;
    const prevIndex = (index - 1 + total) % total;
    const nextIndex = (index + 1) % total;
    const farPrevIndex = (index - 2 + total) % total;
    const farNextIndex = (index + 2) % total;

    featuredItems[index].classList.add('carousel-active');
    featuredItems[prevIndex].classList.add('carousel-prev');
    featuredItems[nextIndex].classList.add('carousel-next');
    if (total > 3) {
      featuredItems[farPrevIndex].classList.add('carousel-far-prev');
      featuredItems[farNextIndex].classList.add('carousel-far-next');
    }

    // Update dots
    featuredDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  function featuredNext() {
    featuredIndex = (featuredIndex + 1) % featuredItems.length;
    updateFeaturedCarousel(featuredIndex);
  }

  function featuredPrev() {
    featuredIndex = (featuredIndex - 1 + featuredItems.length) % featuredItems.length;
    updateFeaturedCarousel(featuredIndex);
  }

  if (featuredItems.length > 0) {
    // Initialize
    updateFeaturedCarousel(0);

    // Navigation buttons
    if (featuredPrevBtn) featuredPrevBtn.addEventListener('click', () => {
      featuredPrev();
      resetFeaturedAutoPlay();
    });
    if (featuredNextBtn) featuredNextBtn.addEventListener('click', () => {
      featuredNext();
      resetFeaturedAutoPlay();
    });

    // Dot navigation
    featuredDots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        featuredIndex = i;
        updateFeaturedCarousel(featuredIndex);
        resetFeaturedAutoPlay();
      });
    });

    // Click on prev/next items to navigate
    featuredItems.forEach((item) => {
      item.addEventListener('click', () => {
        if (item.classList.contains('carousel-prev')) {
          featuredPrev();
          resetFeaturedAutoPlay();
        } else if (item.classList.contains('carousel-next')) {
          featuredNext();
          resetFeaturedAutoPlay();
        }
      });
    });

    // Auto-play
    function startFeaturedAutoPlay() {
      featuredAutoPlay = setInterval(featuredNext, 4000);
    }
    function resetFeaturedAutoPlay() {
      clearInterval(featuredAutoPlay);
      startFeaturedAutoPlay();
    }
    startFeaturedAutoPlay();

    // Touch/swipe support
    let featuredTouchStartX = 0;
    const featuredCarouselEl = document.getElementById('featuredCarousel');
    if (featuredCarouselEl) {
      featuredCarouselEl.addEventListener('touchstart', (e) => {
        featuredTouchStartX = e.touches[0].clientX;
      }, { passive: true });
      featuredCarouselEl.addEventListener('touchend', (e) => {
        const diff = featuredTouchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) featuredNext();
          else featuredPrev();
          resetFeaturedAutoPlay();
        }
      });
    }
  }

  // =========== PRODUCTS CAROUSEL ===========
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const items = document.querySelectorAll('.carousel-item');
  const titleElement = document.querySelector('.product-title');
  const priceElement = document.querySelector('.showcase-header .product-price');
  const currentCounter = document.querySelector('.carousel-counter .current');
  let currentIndex = 0;

  function updateCarousel(direction) {
    items.forEach(item => item.classList.remove('active', 'next', 'prev'));

    if (direction === 'next') {
      currentIndex = (currentIndex + 1) % items.length;
    } else if (direction === 'prev') {
      currentIndex = (currentIndex - 1 + items.length) % items.length;
    }

    const activeIndex = currentIndex;
    const nextIndex = (currentIndex + 1) % items.length;
    const prevIndex = (currentIndex - 1 + items.length) % items.length;

    items[activeIndex].classList.add('active');
    items[nextIndex].classList.add('next');
    items[prevIndex].classList.add('prev');

    const activeTitle = items[activeIndex].getAttribute('data-title');
    const activePrice = items[activeIndex].getAttribute('data-price');
    if (titleElement && activeTitle) titleElement.textContent = activeTitle;
    if (priceElement && activePrice) priceElement.textContent = activePrice;
    if (currentCounter) currentCounter.textContent = String(currentIndex + 1).padStart(2, '0');
  }

  if (prevBtn && nextBtn) {
    nextBtn.addEventListener('click', () => updateCarousel('next'));
    prevBtn.addEventListener('click', () => updateCarousel('prev'));

    let touchStartX = 0;
    const carouselWrapper = document.querySelector('.carousel-wrapper');
    if (carouselWrapper) {
      carouselWrapper.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
      });
      carouselWrapper.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) updateCarousel('next');
          else updateCarousel('prev');
        }
      });
    }
  }

  // =========== COUNTER ANIMATION ===========
  const counters = document.querySelectorAll('.stat-number');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const countTo = parseInt(target.getAttribute('data-count'));
        let count = 0;
        const duration = 2000;
        const increment = countTo / (duration / 16);

        function updateCount() {
          count += increment;
          if (count < countTo) {
            target.textContent = Math.floor(count).toString().padStart(2, '0');
            requestAnimationFrame(updateCount);
          } else {
            target.textContent = countTo.toString().padStart(2, '0');
          }
        }
        updateCount();
        counterObserver.unobserve(target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => counterObserver.observe(counter));

  // =========== SCROLL REVEAL ===========
  const revealElements = document.querySelectorAll('.reveal-up');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  revealElements.forEach(el => revealObserver.observe(el));

  // =========== PRODUCT FILTER ===========
  const filterBtns = document.querySelectorAll('.filter-btn');
  const dropDropdown = document.getElementById('dropDropdown');
  const dropDropdownTrigger = document.getElementById('dropDropdownTrigger');
  const dropDropdownOptions = document.getElementById('dropDropdownOptions');
  const dropDropdownText = dropDropdownTrigger?.querySelector('.drop-dropdown-text');
  const productsSearch = document.getElementById('productsSearch');
  const productCards = document.querySelectorAll('.product-card');

  let currentCategoryFilter = 'all';
  let currentDropFilter = 'all';
  let currentSearchQuery = '';

  function applyFilters() {
    productCards.forEach(card => {
      const category = card.getAttribute('data-category');
      const drop = card.getAttribute('data-drop') || '';
      const name = (card.getAttribute('data-name') || '').toLowerCase();
      const title = (card.querySelector('h3')?.textContent || '').toLowerCase();

      let categoryMatch = currentCategoryFilter === 'all' || category === currentCategoryFilter;
      let dropMatch = currentDropFilter === 'all' || drop === currentDropFilter;
      let searchMatch = !currentSearchQuery || name.includes(currentSearchQuery) || title.includes(currentSearchQuery);

      const shouldShow = categoryMatch && dropMatch && searchMatch;

      if (shouldShow) {
        card.style.display = 'flex';
        setTimeout(() => card.style.opacity = '1', 10);
      } else {
        card.style.opacity = '0';
        setTimeout(() => card.style.display = 'none', 300);
      }
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategoryFilter = btn.getAttribute('data-filter');
      applyFilters();
    });
  });

  if (dropDropdown && dropDropdownTrigger && dropDropdownOptions) {
    dropDropdownTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropDropdown.classList.toggle('open');
      dropDropdownTrigger.setAttribute('aria-expanded', dropDropdown.classList.contains('open'));
    });
    dropDropdownOptions.querySelectorAll('.drop-dropdown-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const drop = opt.getAttribute('data-drop');
        const label = opt.textContent;
        dropDropdownOptions.querySelectorAll('.drop-dropdown-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        if (dropDropdownText) dropDropdownText.textContent = label;
        dropDropdown.classList.remove('open');
        dropDropdownTrigger.setAttribute('aria-expanded', 'false');
        currentDropFilter = drop;
        applyFilters();
      });
    });
    document.addEventListener('click', (e) => {
      if (!dropDropdown.contains(e.target)) dropDropdown.classList.remove('open');
    });
  }

  if (productsSearch) {
    productsSearch.addEventListener('input', () => {
      currentSearchQuery = productsSearch.value.trim().toLowerCase();
      applyFilters();
    });
    productsSearch.addEventListener('search', () => {
      currentSearchQuery = productsSearch.value.trim().toLowerCase();
      applyFilters();
    });
  }

  applyFilters();

  // =========== TOAST ===========
  const toast = document.getElementById('toast');

  function showToast(message = 'Producto agregado al carrito') {
    if (!toast) return;
    toast.querySelector('.toast-message').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // =========== COPY BUTTONS (Métodos de pago) ===========
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-copy');
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(() => showToast('Copiado al portapapeles'));
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Copiado al portapapeles');
      }
    });
  });

  // =========== CART FUNCTIONALITY ===========
  const cartBtn = document.getElementById('cartBtn');
  const cartSidebar = document.getElementById('cartSidebar');
  const closeCart = document.getElementById('closeCart');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartItems = document.getElementById('cartItems');
  const cartCount = document.querySelector('.cart-count');
  const cartTotal = document.getElementById('cartTotal');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartSubtotalRow = document.getElementById('cartSubtotalRow');
  const cartDiscountRow = document.getElementById('cartDiscountRow');
  const cartDiscount = document.getElementById('cartDiscount');
  const couponCodeDisplay = document.getElementById('couponCodeDisplay');

  const CART_STORAGE_KEY = 'nocturna_cart'
  let cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]')
  let activeCoupon = null; // { code, discount: 10, type: 'percent' } or { code, discount: 5, type: 'fixed' }

  function saveCartToStorage() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }

  const VALID_COUPONS = {
    'NOCTURNA10': { discount: 10, type: 'percent' },
    'BIENVENIDO15': { discount: 15, type: 'percent' },
    'ENVIO5': { discount: 5, type: 'fixed' }
  };

  function openCart() {
    if (cartSidebar) cartSidebar.classList.add('open');
    if (cartOverlay) cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCartFn() {
    if (cartSidebar) cartSidebar.classList.remove('open');
    if (cartOverlay) cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalItems;

    if (cart.length === 0) {
      if (cartItems) cartItems.innerHTML = '<p class="empty-cart">Tu carrito está vacío</p>';
      if (cartTotal) cartTotal.textContent = '$0.00';
      if (cartSubtotalRow) cartSubtotalRow.style.display = 'none';
      if (cartDiscountRow) cartDiscountRow.style.display = 'none';
      return;
    }

    let total = 0;
    const cartHTML = cart.map((item, index) => {
      const subtotal = item.price * item.quantity;
      total += subtotal;
      return `
        <div class="cart-item" data-index="${index}">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="cart-item-img">
          <div class="cart-item-details">
            <span class="cart-item-name">${escapeHtml(item.name)}</span>
            <span class="cart-item-size">Talla: ${item.size}</span>
            <span class="cart-item-price">$${subtotal.toFixed(2)}</span>
            <div class="cart-item-controls">
              <button class="qty-btn qty-minus" data-index="${index}">−</button>
              <span class="cart-item-qty">${item.quantity}</span>
              <button class="qty-btn qty-plus" data-index="${index}">+</button>
              <button class="cart-item-remove" data-index="${index}" title="Eliminar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (cartItems) cartItems.innerHTML = cartHTML;

    let subtotal = total;
    let discountAmount = 0;
    if (activeCoupon) {
      if (activeCoupon.type === 'percent') {
        discountAmount = subtotal * (activeCoupon.discount / 100);
      } else {
        discountAmount = Math.min(activeCoupon.discount, subtotal);
      }
    }
    total = Math.max(0, subtotal - discountAmount);

    if (cartSubtotal) cartSubtotal.textContent = '$' + subtotal.toFixed(2);
    if (cartSubtotalRow) cartSubtotalRow.style.display = activeCoupon ? 'flex' : 'none';
    if (cartDiscountRow) {
      cartDiscountRow.style.display = activeCoupon ? 'flex' : 'none';
      if (couponCodeDisplay) couponCodeDisplay.textContent = activeCoupon?.code || '';
      if (cartDiscount) cartDiscount.textContent = '-$' + discountAmount.toFixed(2);
    }
    if (cartTotal) cartTotal.textContent = '$' + total.toFixed(2);

    // Event delegation for cart controls
    if (cartItems) cartItems.onclick = (e) => {
      const btn = e.target.closest('[data-index]');
      if (!btn) return;
      const index = parseInt(btn.getAttribute('data-index'));

      if (btn.classList.contains('qty-minus')) {
        if (cart[index].quantity > 1) {
          cart[index].quantity--;
        } else {
          cart.splice(index, 1);
        }
        saveCartToStorage();
        updateCartUI();
      } else if (btn.classList.contains('qty-plus')) {
        cart[index].quantity++;
        saveCartToStorage();
        updateCartUI();
      } else if (btn.classList.contains('cart-item-remove')) {
        cart.splice(index, 1);
        saveCartToStorage();
        updateCartUI();
        showToast('Producto eliminado');
      }
    };
  }

  function addToCart(name, price, image, quantity = 1, size = 'M') {
    const existingItem = cart.find(item => item.name === name && item.size === size);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ name, price: parseFloat(price), image, quantity, size });
    }
    saveCartToStorage();
    updateCartUI();
    showToast(`¡${name} agregado al carrito!`);
    // Auto-open cart so user sees the product was added
    openCart();
  }

  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (closeCart) closeCart.addEventListener('click', closeCartFn);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCartFn);

  updateCartUI();

  // Coupon
  const couponInput = document.getElementById('couponInput');
  const applyCouponBtn = document.getElementById('applyCouponBtn');
  const couponMessage = document.getElementById('couponMessage');

  if (applyCouponBtn && couponInput && couponMessage) {
    applyCouponBtn.addEventListener('click', () => {
      const code = couponInput.value.trim().toUpperCase();
      if (!code) {
        couponMessage.textContent = 'Ingresa un código';
        couponMessage.className = 'coupon-message error';
        return;
      }
      const coupon = VALID_COUPONS[code];
      if (coupon) {
        activeCoupon = { code, ...coupon };
        couponMessage.textContent = `¡Descuento aplicado! (${coupon.discount}${coupon.type === 'percent' ? '%' : '$'})`;
        couponMessage.className = 'coupon-message success';
        updateCartUI();
      } else {
        activeCoupon = null;
        couponMessage.textContent = 'Código inválido o expirado';
        couponMessage.className = 'coupon-message error';
        updateCartUI();
      }
    });
  }

  // Add to cart buttons on cards
  document.querySelectorAll('.add-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const product = btn.getAttribute('data-product') || 'Producto';
      const price = btn.getAttribute('data-price') || '45';
      const image = btn.getAttribute('data-img') || (btn.closest('.product-card')?.querySelector('img')?.src) || '';
      addToCart(product, price, image);
    });
  });

  // Hero add to cart
  const heroAddCart = document.getElementById('heroAddCart');
  if (heroAddCart) {
    heroAddCart.addEventListener('click', () => {
      const activeItem = document.querySelector('.carousel-item.active');
      if (activeItem) {
        const title = activeItem.getAttribute('data-title');
        const price = activeItem.getAttribute('data-price')?.replace('$', '') || '45';
        const image = activeItem.querySelector('img')?.src;
        addToCart(title, price, image);
      }
    });
  }

  // =========== WISHLIST FUNCTIONALITY ===========
  const wishlistBtn = document.getElementById('wishlistBtn');
  const wishlistSidebar = document.getElementById('wishlistSidebar');
  const closeWishlist = document.getElementById('closeWishlist');
  const wishlistOverlay = document.getElementById('wishlistOverlay');
  const wishlistItems = document.getElementById('wishlistItems');
  const wishlistCount = document.querySelector('.wishlist-count');
  const moveAllToCart = document.getElementById('moveAllToCart');

  const WISHLIST_STORAGE_KEY = 'nocturna_wishlist'
  let wishlist = JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) || '[]')

  function saveWishlistToStorage() {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist))
  }

  function openWishlist() {
    wishlistSidebar.classList.add('open');
    wishlistOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeWishlistFn() {
    wishlistSidebar.classList.remove('open');
    wishlistOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function updateWishlistUI() {
    if (wishlistCount) wishlistCount.textContent = wishlist.length;

    if (wishlist.length === 0) {
      wishlistItems.innerHTML = '<p class="empty-wishlist">No tienes favoritos aún</p>';
      return;
    }

    wishlistItems.innerHTML = wishlist.map((item, index) => `
      <div class="wishlist-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="wishlist-item-info">
          <h4>${item.name}</h4>
          <span>$${item.price.toFixed(2)}</span>
          <div class="wishlist-item-actions">
            <button class="move-to-cart-btn" data-index="${index}">AL CARRITO</button>
            <button class="remove-wishlist-btn" data-index="${index}">×</button>
          </div>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.move-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.getAttribute('data-index'));
        const item = wishlist[index];
        addToCart(item.name, item.price, item.image);
        wishlist.splice(index, 1);
        saveWishlistToStorage();
        updateWishlistUI();
      });
    });

    document.querySelectorAll('.remove-wishlist-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.getAttribute('data-index'));
        wishlist.splice(index, 1);
        saveWishlistToStorage();
        updateWishlistUI();
        showToast('Eliminado de favoritos');
      });
    });
  }

  function addToWishlist(name, price, image) {
    const exists = wishlist.find(item => item.name === name);
    if (exists) {
      showToast('Ya está en favoritos');
      return;
    }
    wishlist.push({ name, price: parseFloat(price), image });
    saveWishlistToStorage();
    updateWishlistUI();
    showToast('¡Agregado a favoritos!');
  }

  if (wishlistBtn) wishlistBtn.addEventListener('click', openWishlist);
  if (closeWishlist) closeWishlist.addEventListener('click', closeWishlistFn);
  if (wishlistOverlay) wishlistOverlay.addEventListener('click', closeWishlistFn);

  updateWishlistUI();

  if (moveAllToCart) {
    moveAllToCart.addEventListener('click', () => {
      if (wishlist.length === 0) {
        showToast('No hay favoritos');
        return;
      }
      wishlist.forEach(item => {
        addToCart(item.name, item.price, item.image);
      });
      wishlist = [];
      saveWishlistToStorage();
      updateWishlistUI();
      closeWishlistFn();
      openCart();
    });
  }

  // =========== SEARCH FUNCTIONALITY ===========
  const searchBtn = document.getElementById('searchBtn');
  const searchModal = document.getElementById('searchModal');
  const closeSearch = document.getElementById('closeSearch');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const suggestionTags = document.querySelectorAll('.suggestion-tag');

  function openSearch() {
    searchModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => searchInput?.focus(), 300);
  }

  function closeSearchFn() {
    searchModal.classList.remove('open');
    document.body.style.overflow = '';
    if (searchInput) searchInput.value = '';
    if (searchResults) searchResults.innerHTML = '';
  }

  function performSearch(query) {
    if (!query.trim()) {
      searchResults.innerHTML = '';
      return;
    }

    const results = products.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase())
    );

    if (results.length === 0) {
      searchResults.innerHTML = '<p class="no-results">No se encontraron productos</p>';
      return;
    }

    searchResults.innerHTML = results.map((product, idx) => `
      <div class="search-result-item" data-index="${idx}">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
        <div class="search-result-info">
          <h4>${escapeHtml(product.name)}</h4>
          <span>$${product.price.toFixed(2)}</span>
        </div>
      </div>
    `).join('');

    const resultItems = document.querySelectorAll('.search-result-item');
    resultItems.forEach((item, idx) => {
      item.addEventListener('click', () => {
        openQuickView(results[idx]);
        closeSearchFn();
      });
    });
  }

  if (searchBtn) searchBtn.addEventListener('click', openSearch);
  if (closeSearch) closeSearch.addEventListener('click', closeSearchFn);

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      performSearch(e.target.value);
    });
  }

  suggestionTags.forEach(tag => {
    tag.addEventListener('click', () => {
      const searchTerm = tag.getAttribute('data-search');
      if (searchInput) searchInput.value = searchTerm;
      performSearch(searchTerm);
    });
  });

  // =========== QUICK VIEW ===========
  const quickViewModal = document.getElementById('quickViewModal');
  const quickViewOverlay = document.getElementById('quickViewOverlay');
  const closeQuickView = document.getElementById('closeQuickView');
  const quickViewImage = document.getElementById('quickViewImage');
  const quickViewTitle = document.getElementById('quickViewTitle');
  const qvThumbnails = document.getElementById('qvThumbnails');
  const quickViewSizes = document.querySelector('.quick-view-sizes');
  const quickViewPrice = document.getElementById('quickViewPrice');
  const quickViewStock = document.getElementById('quickViewStock');
  const quickViewDesc = document.getElementById('quickViewDesc');
  const quickViewCategory = document.getElementById('quickViewCategory');
  const addToCartModal = document.getElementById('addToCartModal');
  const addToWishlistModal = document.getElementById('addToWishlistModal');
  const qtyInput = document.getElementById('qtyInput');
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const sizeOptions = document.querySelectorAll('.size-option');

  let currentQuickViewProduct = null;
  let selectedSize = 'M';

  const PRODUCT_DESCRIPTIONS = {
    perfume: {
      KHAMRA: 'Fragancia oriental amaderada con notas de ámbar, vainilla y especias. Duración prolongada para la noche.',
      SCEPTRE: 'Frescura oceánica con acordes acuáticos y cítricos. Ideal para el día.',
      WANTED: 'Alma rebelde: cuero, especias y tonos amaderados. Personalidad intensa.',
      NUIT: 'Misterio nocturno: maderas oscuras, almizcle y notas sensuales.',
      AQUA: 'Acordes marinos, cítricos y frescos. Perfecto para verano.',
      'WITH YOU': 'Romance dulce: flores, tonos cálidos y acogedores.',
      MANGO: 'Tropical y frutal: mango, dulzura y vibración veraniega.',
      HARAMAIN: 'Oud árabe, incienso y rosa. Lujo oriental auténtico.'
    },
    polo: 'Polo de alta calidad con diseño exclusivo inspirado en la cultura motorsport japonesa. Material 100% algodón premium.',
    bividi: 'Bividi de algodón premium, corte urbano y diseño minimalista. Perfecto para el verano.',
    short: 'Bermudas baggy de algodón suave, corte holgado y cómodo. Esencial para el día a día.',
    polera: 'Polera heavy weight de algodón grueso. Cortes oversize y diseño urbano.',
    default: 'Producto de calidad premium. Edición limitada Nocturna PR.'
  };

  function getProductDescription(product) {
    const name = (product.name || '').toUpperCase();
    if (product.isPerfume || product.category === 'perfume') {
      for (const [key, desc] of Object.entries(PRODUCT_DESCRIPTIONS.perfume)) {
        if (name.includes(key)) return desc;
      }
      return PRODUCT_DESCRIPTIONS.perfume.SCEPTRE;
    }
    return PRODUCT_DESCRIPTIONS[product.category] || PRODUCT_DESCRIPTIONS.default;
  }

  function getProductCategoryLabel(product) {
    if (product.isPerfume || product.category === 'perfume') return 'ESENCIAS';
    if (product.category === 'bividi') return 'BIVIDIS';
    if (product.category === 'short') return 'BERMUDAS BAGGY';
    if (product.category === 'polera') return 'POLERAS';
    return 'COLECCIÓN';
  }

  function openQuickView(product) {
    currentQuickViewProduct = product;
    quickViewImage.src = product.image;
    quickViewImage.alt = product.name;
    quickViewTitle.textContent = product.name;
    quickViewPrice.textContent = '$' + product.price.toFixed(2);
    if (quickViewDesc) quickViewDesc.textContent = getProductDescription(product);
    if (quickViewCategory) quickViewCategory.textContent = getProductCategoryLabel(product);

    const stockText = product.stock <= 3
      ? `Pocas unidades - Solo quedan ${product.stock}`
      : `En stock - ${product.stock} disponibles`;
    quickViewStock.textContent = stockText;

    const stockIndicator = quickViewStock.previousElementSibling;
    stockIndicator.className = 'stock-indicator';
    if (product.stock <= 3) stockIndicator.classList.add('low-stock');
    else stockIndicator.classList.add('in-stock');

    if (qtyInput) qtyInput.value = 1;

    // Galería de miniaturas
    if (qvThumbnails) {
      const imgs = product.images || [product.image];
      if (imgs.length > 1) {
        qvThumbnails.innerHTML = imgs.map((src, i) =>
          `<img src="${src}" alt="${product.name}" data-index="${i}" class="${i === 0 ? 'active' : ''}">`
        ).join('');
        qvThumbnails.onclick = (e) => {
          const thumb = e.target.closest('img');
          if (thumb) {
            quickViewImage.src = thumb.src;
            qvThumbnails.querySelectorAll('img').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
          }
        };
      } else {
        qvThumbnails.innerHTML = '';
      }
    }

    // Ocultar tallas para perfumes
    if (quickViewSizes) quickViewSizes.style.display = product.isPerfume ? 'none' : '';

    quickViewModal.classList.add('open');
    quickViewOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeQuickViewFn() {
    quickViewModal.classList.remove('open');
    quickViewOverlay.classList.remove('open');
    document.body.style.overflow = '';
    currentQuickViewProduct = null;
  }

  // Quick view buttons
  document.querySelectorAll('.quick-view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const card = btn.closest('.product-card') || btn.closest('.perfume-card') || btn.closest('.drop-card');
      const productName = btn.getAttribute('data-product') || card?.querySelector('h3')?.textContent || 'Producto';
      const productPrice = btn.getAttribute('data-price') || '45';
      const productImage = btn.getAttribute('data-img') || card?.querySelector('img')?.src || '';
      const dataImages = btn.getAttribute('data-images');
      const images = dataImages ? dataImages.split(',').map(s => s.trim()) : [productImage];
      const isPerfume = card?.classList.contains('perfume-card');
      let category = card?.getAttribute('data-category') || 'polo';
      if (isPerfume) category = 'perfume';
      if (productName.toUpperCase().includes('BIVIDI')) category = 'bividi';
      if (productName.toUpperCase().includes('BERMUDAS') || productName.toUpperCase().includes('SHORT')) category = 'short';

      openQuickView({
        name: productName.toUpperCase(),
        price: parseFloat(productPrice),
        image: productImage,
        images: images,
        stock: Math.floor(Math.random() * 15) + 1,
        isPerfume,
        category
      });
    });
  });

  if (closeQuickView) closeQuickView.addEventListener('click', closeQuickViewFn);
  if (quickViewOverlay) quickViewOverlay.addEventListener('click', closeQuickViewFn);

  // Size selection
  sizeOptions.forEach(option => {
    option.addEventListener('click', () => {
      sizeOptions.forEach(o => o.classList.remove('active'));
      option.classList.add('active');
      selectedSize = option.getAttribute('data-size');
    });
  });

  // Quantity controls
  if (qtyMinus && qtyPlus && qtyInput) {
    qtyMinus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value);
      if (val > 1) qtyInput.value = val - 1;
    });
    qtyPlus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value);
      if (val < 10) qtyInput.value = val + 1;
    });
  }

  // Add to cart from quick view
  if (addToCartModal) {
    addToCartModal.addEventListener('click', () => {
      if (currentQuickViewProduct) {
        const qty = parseInt(qtyInput?.value || 1);
        addToCart(
          currentQuickViewProduct.name,
          currentQuickViewProduct.price,
          currentQuickViewProduct.image,
          qty,
          selectedSize
        );
        closeQuickViewFn();
      }
    });
  }

  // Add to wishlist from quick view
  if (addToWishlistModal) {
    addToWishlistModal.addEventListener('click', () => {
      if (currentQuickViewProduct) {
        addToWishlist(
          currentQuickViewProduct.name,
          currentQuickViewProduct.price,
          currentQuickViewProduct.image
        );
      }
    });
  }

  // =========== ENHANCED VIDEO PLAYER ===========
  const mainVideo = document.getElementById('main-video');
  const playBtn = document.getElementById('playBtn');
  const videoWrapper = document.querySelector('.video-main');
  const progressBar = document.getElementById('progressBar');
  const muteBtn = document.getElementById('muteBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const videoTitle = document.getElementById('currentVideoTitle');
  const timeDisplay = document.getElementById('timeDisplay');
  const currentVideoNum = document.getElementById('currentVideoNum');
  const thumbs = document.querySelectorAll('.video-thumb.enhanced');

  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (mainVideo && playBtn) {
    // Play/Pause on play button click
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (mainVideo.paused) {
        mainVideo.play();
        mainVideo.muted = false;
        videoWrapper.classList.add('playing');
      } else {
        mainVideo.pause();
        videoWrapper.classList.remove('playing');
      }
    });

    // Play/Pause on overlay click
    const videoOverlay = document.getElementById('videoOverlay');
    if (videoOverlay) {
      videoOverlay.addEventListener('click', () => {
        if (mainVideo.paused) {
          mainVideo.play();
          mainVideo.muted = false;
          videoWrapper.classList.add('playing');
        }
      });
    }

    // Play/Pause on video wrapper click
    videoWrapper.addEventListener('click', () => {
      if (mainVideo.paused) {
        mainVideo.play();
        mainVideo.muted = false;
        videoWrapper.classList.add('playing');
      } else {
        mainVideo.pause();
        videoWrapper.classList.remove('playing');
      }
    });



    mainVideo.addEventListener('timeupdate', () => {
      if (progressBar) {
        const progress = (mainVideo.currentTime / mainVideo.duration) * 100;
        progressBar.style.width = progress + '%';
      }
      if (timeDisplay) {
        timeDisplay.textContent = `${formatTime(mainVideo.currentTime)} / ${formatTime(mainVideo.duration)}`;
      }
    });

    mainVideo.addEventListener('loadedmetadata', () => {
      if (timeDisplay) {
        timeDisplay.textContent = `0:00 / ${formatTime(mainVideo.duration)}`;
      }
    });

    mainVideo.addEventListener('ended', () => {
      videoWrapper.classList.remove('playing');
    });

    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        mainVideo.muted = !mainVideo.muted;
        muteBtn.style.opacity = mainVideo.muted ? '0.5' : '1';
      });
    }

    // Fullscreen functionality
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        const videoContainer = document.querySelector('.video-frame');
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (videoContainer) {
          videoContainer.requestFullscreen().catch(err => {
            console.log('Fullscreen error:', err);
          });
        }
      });
    }

    // Progress bar seek
    const progressContainer = document.querySelector('.video-controls.enhanced .progress-container');
    if (progressContainer) {
      progressContainer.addEventListener('click', (e) => {
        const rect = progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        mainVideo.currentTime = pos * mainVideo.duration;
      });
    }
  }

  if (thumbs.length > 0 && mainVideo) {
    thumbs.forEach((thumb, index) => {
      thumb.addEventListener('click', () => {
        thumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');

        const src = thumb.getAttribute('data-src');
        const poster = thumb.getAttribute('data-poster');
        const title = thumb.getAttribute('data-title');

        mainVideo.src = src;
        mainVideo.poster = poster;
        if (videoTitle) videoTitle.textContent = title;
        if (currentVideoNum) currentVideoNum.textContent = index + 1;

        mainVideo.load();
        videoWrapper.classList.remove('playing');
      });
    });
  }

  // =========== GLOBAL STAR BACKGROUND ===========
  const globalCanvas = document.getElementById('global-stars-canvas');
  if (globalCanvas) {
    const gCtx = globalCanvas.getContext('2d');
    let gWidth = window.innerWidth;
    let gHeight = window.innerHeight;
    let globalStars = [];

    function gResize() {
      gWidth = window.innerWidth;
      gHeight = window.innerHeight;
      globalCanvas.width = gWidth;
      globalCanvas.height = gHeight;
    }

    class GlobalStar {
      constructor() {
        this.x = Math.random() * gWidth;
        this.y = Math.random() * gHeight;
        this.size = Math.random() * 2 + 0.3;
        this.speedY = Math.random() * 0.2 + 0.05;
        this.brightness = Math.random();
        this.isAccent = Math.random() > 0.97;
      }

      update() {
        this.y += this.speedY;
        if (this.y > gHeight) {
          this.y = 0;
          this.x = Math.random() * gWidth;
        }
        this.brightness += (Math.random() - 0.5) * 0.03;
        this.brightness = Math.max(0.2, Math.min(1, this.brightness));
      }

      draw() {
        gCtx.fillStyle = this.isAccent
          ? `rgba(255, 0, 60, ${this.brightness})`
          : `rgba(255, 255, 255, ${this.brightness})`;
        gCtx.beginPath();
        gCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        gCtx.fill();
      }
    }

    function initGlobalStars() {
      globalStars = [];
      const count = Math.min(300, Math.floor((gWidth * gHeight) / 4000));
      for (let i = 0; i < count; i++) {
        globalStars.push(new GlobalStar());
      }
    }

    function animateGlobalStars() {
      gCtx.fillStyle = 'rgba(10, 10, 10, 0.1)';
      gCtx.fillRect(0, 0, gWidth, gHeight);
      globalStars.forEach(star => {
        star.update();
        star.draw();
      });
      requestAnimationFrame(animateGlobalStars);
    }

    window.addEventListener('resize', () => {
      gResize();
      initGlobalStars();
    });

    gResize();
    initGlobalStars();
    animateGlobalStars();
  }

  // =========== SPACE CANVAS ===========
  const canvas = document.getElementById('space-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    let stars = [];
    let mouseCanvasX = 0, mouseCanvasY = 0;

    function resize() {
      const section = canvas.parentElement;
      width = section.offsetWidth;
      height = section.offsetHeight;
      canvas.width = width;
      canvas.height = height;
      mouseCanvasX = width / 2;
      mouseCanvasY = height / 2;
    }

    class Star {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.brightness = Math.random();
        this.isAccent = Math.random() > 0.95;
      }

      update() {
        const dx = mouseCanvasX - this.x;
        const dy = mouseCanvasY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          this.x -= dx * 0.008;
          this.y -= dy * 0.008;
        }

        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;

        this.brightness += (Math.random() - 0.5) * 0.04;
        this.brightness = Math.max(0.3, Math.min(1, this.brightness));
      }

      draw() {
        ctx.fillStyle = this.isAccent
          ? `rgba(255, 0, 60, ${this.brightness})`
          : `rgba(255, 255, 255, ${this.brightness})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function initStars() {
      stars = [];
      const count = Math.min(250, Math.floor((width * height) / 5000));
      for (let i = 0; i < count; i++) {
        stars.push(new Star());
      }
    }

    function animate() {
      ctx.fillStyle = 'rgba(10, 10, 10, 0.15)';
      ctx.fillRect(0, 0, width, height);

      stars.forEach(star => {
        star.update();
        star.draw();
      });
      requestAnimationFrame(animate);
    }

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseCanvasX = e.clientX - rect.left;
      mouseCanvasY = e.clientY - rect.top;
    });

    window.addEventListener('resize', () => {
      resize();
      initStars();
    });

    resize();
    initStars();
    animate();
  }

  // =========== BACK TO TOP ===========
  const backToTop = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    if (backToTop) {
      if (window.scrollY > 500) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }
  });

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // =========== NEWSLETTER ===========
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('emailInput') || newsletterForm.querySelector('input[type="email"]');
      const email = emailInput?.value?.trim();
      if (!email) {
        showToast('Ingresa tu email');
        return;
      }

      const btn = newsletterForm.querySelector('button[type="submit"]');
      const originalText = btn?.textContent || 'Suscribirse';
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Enviando...';
      }

      try {
        if (!supabase) {
          showToast('Servicio temporalmente no disponible. Intenta más tarde.');
          return;
        }

        const { error } = await supabase
          .from('newsletter_subscribers')
          .insert({ email });

        if (error) {
          if (error.code === '23505') {
            showToast('Este email ya está suscrito');
          } else if (error.code === '42P01') {
            showToast('Configura la base de datos. Ejecuta supabase-setup.sql');
            console.error('Newsletter error:', error);
          } else {
            showToast('Error al suscribir. Intenta de nuevo.');
            console.error('Newsletter error:', error);
          }
          return;
        }

        showToast('¡Gracias por suscribirte!');
        newsletterForm.reset();
      } catch (err) {
        showToast('Error de conexión. Intenta más tarde.');
        console.error('Newsletter error:', err);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = originalText;
        }
      }
    });
  }

  // =========== SMOOTH SCROLL ===========
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const headerOffset = 100;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    });
  });

  // =========== HEADER SCROLL ===========
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (header) {
      header.style.background = window.scrollY > 100
        ? 'rgba(0, 0, 0, 0.95)'
        : 'rgba(0, 0, 0, 0.8)';
    }
  });

  // =========== KEYBOARD NAVIGATION ===========
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (cartSidebar?.classList.contains('open')) closeCartFn();
      if (wishlistSidebar?.classList.contains('open')) closeWishlistFn();
      if (searchModal?.classList.contains('open')) closeSearchFn();
      if (quickViewModal?.classList.contains('open')) closeQuickViewFn();
      if (mobileMenu?.classList.contains('open')) closeMobileMenu();
    }

    if (e.key === 'ArrowLeft' && prevBtn) updateCarousel('prev');
    if (e.key === 'ArrowRight' && nextBtn) updateCarousel('next');

    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
  });

  // =========== COUNTDOWN TIMER ===========
  const countDays = document.getElementById('countDays');
  const countHours = document.getElementById('countHours');
  const countMins = document.getElementById('countMins');
  const countSecs = document.getElementById('countSecs');

  if (countDays && countHours && countMins && countSecs) {
    const dropDate = new Date();
    dropDate.setDate(dropDate.getDate() + 45);
    dropDate.setHours(12, 0, 0, 0);

    function updateCountdown() {
      const now = new Date();
      const diff = dropDate - now;

      if (diff <= 0) {
        countDays.textContent = '00';
        countHours.textContent = '00';
        countMins.textContent = '00';
        countSecs.textContent = '00';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      countDays.textContent = days.toString().padStart(2, '0');
      countHours.textContent = hours.toString().padStart(2, '0');
      countMins.textContent = mins.toString().padStart(2, '0');
      countSecs.textContent = secs.toString().padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // =========== SCROLL PROGRESS BAR ===========
  const scrollProgress = document.getElementById('scrollProgress');
  if (scrollProgress) {
    window.addEventListener('scroll', () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      scrollProgress.style.width = height > 0 ? (winScroll / height) * 100 + '%' : '0%';
    });
  }

  // =========== BREADCRUMBS ===========
  const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
  const isDropsPage = window.location.pathname.includes('drops');
  const sections = isDropsPage
    ? [
        { id: 'drop-primer', label: 'Primer Drop' },
        { id: 'drop-segundo', label: 'Segundo Drop' },
        { id: 'drop-tercer', label: 'Tercer Drop' },
        { id: 'drop-cuarto', label: 'Cuarto Drop' },
        { id: 'drop-quinto', label: 'Quinto Drop' },
        { id: 'drop-poleras', label: 'Drop Poleras' },
        { id: 'drop-space', label: 'Drop Space' },
        { id: 'drop-perfumes', label: 'Esencias' },
      ]
    : [
        { id: 'hero', label: 'Inicio' },
        { id: 'countdown', label: 'Próximo Drop' },
        { id: 'fresh-drops', label: 'Drops' },
        { id: 'polos', label: 'Colección' },
        { id: 'perfumes', label: 'Esencias' },
        { id: 'lookbook', label: 'Lookbook' },
        { id: 'nosotros', label: 'Nosotros' },
        { id: 'faq', label: 'FAQ' },
        { id: 'contacto', label: 'Contacto' },
        { id: 'newsletter', label: 'Newsletter' }
      ];
  if (breadcrumbCurrent) {
    const updateBreadcrumb = () => {
      const scrollY = window.scrollY + 150;
      let current = isDropsPage ? 'Drops' : 'Inicio';
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= scrollY) {
          current = sections[i].label;
          break;
        }
      }
      breadcrumbCurrent.textContent = current;
    };
    window.addEventListener('scroll', updateBreadcrumb);
    updateBreadcrumb();
  }

  // =========== COLLAPSIBLE SECTIONS (reduce content overload) ===========
  const aboutSection = document.querySelector('.about-section');
  const aboutToggle = document.getElementById('aboutToggle');

  if (aboutToggle && aboutSection) {
    aboutToggle.addEventListener('click', () => {
      aboutSection.classList.toggle('expanded');
    });
  }

  // =========== TIMELINE DROPS TOGGLE (drops.html) ===========
  document.querySelectorAll('.timeline-toggle').forEach(btn => {
    const txt = btn.querySelector('.toggle-text');
    if (txt) txt.dataset.original = txt.textContent;
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const target = document.getElementById(targetId);
      if (!target) return;
      const isExpanded = target.classList.toggle('expanded');
      btn.setAttribute('aria-expanded', isExpanded);
      if (txt) txt.textContent = isExpanded ? 'Ocultar imágenes' : txt.dataset.original;
    });
  });

  // =========== FAQ ACCORDION ===========
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  // =========== PRODUCT SORTING (CUSTOM DROPDOWN) ===========
  const sortDropdown = document.getElementById('sortDropdown');
  const sortTrigger = document.getElementById('sortTrigger');
  const sortTriggerText = sortTrigger?.querySelector('.sort-trigger-text');
  const sortOptions = document.getElementById('sortOptions');
  const productsGrid = document.getElementById('productsGrid');

  function applySort(value) {
    if (!productsGrid) return;
    const cards = Array.from(productsGrid.querySelectorAll('.product-card'));
    const visibleCards = cards.filter(c => c.style.display !== 'none' && c.style.opacity !== '0');

    visibleCards.sort((a, b) => {
      const priceA = parseFloat(a.querySelector('.price')?.textContent?.replace(/[^0-9.]/g, '') || 0);
      const priceB = parseFloat(b.querySelector('.price')?.textContent?.replace(/[^0-9.]/g, '') || 0);
      const badgeA = a.querySelector('.card-badge.new') ? 1 : 0;
      const badgeB = b.querySelector('.card-badge.new') ? 1 : 0;

      if (value === 'price-asc') return priceA - priceB;
      if (value === 'price-desc') return priceB - priceA;
      if (value === 'newest') return badgeB - badgeA;
      return 0;
    });

    visibleCards.forEach(card => productsGrid.appendChild(card));
  }

  if (sortDropdown && sortTrigger && sortOptions) {
    sortTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      sortDropdown.classList.toggle('open');
      sortTrigger.setAttribute('aria-expanded', sortDropdown.classList.contains('open'));
    });

    sortOptions.querySelectorAll('.sort-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const value = opt.getAttribute('data-value');
        const label = opt.textContent;
        sortOptions.querySelectorAll('.sort-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        if (sortTriggerText) sortTriggerText.textContent = label;
        sortDropdown.classList.remove('open');
        sortTrigger.setAttribute('aria-expanded', 'false');
        applySort(value);
      });
    });

    document.addEventListener('click', (e) => {
      if (!sortDropdown.contains(e.target)) sortDropdown.classList.remove('open');
    });
  }

  // =========== LOADING SCREEN ===========
  window.addEventListener('load', () => {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.classList.remove('show');
    }
  });
  // =========== CHECKOUT MODAL ===========
  const checkoutModal = document.getElementById('checkoutModal');
  const checkoutOverlay = document.getElementById('checkoutOverlay');
  const closeCheckoutBtn = document.getElementById('closeCheckout');
  const checkoutBtn = document.querySelector('.checkout-btn');
  const checkoutForm = document.getElementById('checkoutForm');
  const checkoutSteps = document.querySelectorAll('.step');
  const checkoutStepContents = document.querySelectorAll('.checkout-step-content');
  const nextStepBtns = document.querySelectorAll('.next-step');
  const prevStepBtns = document.querySelectorAll('.prev-step');
  const paymentOptions = document.querySelectorAll('.payment-option');

  if (checkoutBtn && checkoutModal) {
    checkoutBtn.addEventListener('click', () => {
      cartSidebar.classList.remove('open');
      cartOverlay.classList.remove('open');
      checkoutModal.classList.add('open');
      checkoutOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';

      // Update checkout totals
      const total = document.getElementById('cartTotal').textContent;
      document.getElementById('checkoutSubtotal').textContent = total;
      document.getElementById('checkoutTotal').textContent = total;
    });

    function closeCheckout() {
      checkoutModal.classList.remove('open');
      checkoutOverlay.classList.remove('open');
      document.body.style.overflow = '';
      // Reset form after delay
      setTimeout(() => {
        checkoutForm.reset();
        switchStep(1);
      }, 500);
    }

    closeCheckoutBtn.addEventListener('click', closeCheckout);
    checkoutOverlay.addEventListener('click', closeCheckout);

    document.querySelector('.close-checkout-final')?.addEventListener('click', closeCheckout);

    // Steps Navigation
    function switchStep(stepNum) {
      checkoutSteps.forEach(s => s.classList.remove('active'));
      checkoutStepContents.forEach(c => c.classList.remove('active'));

      document.querySelector(`.step[data-step="${stepNum}"]`).classList.add('active');
      document.getElementById(`step${stepNum}`).classList.add('active');
    }

    nextStepBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const next = btn.getAttribute('data-next');
        switchStep(next);
      });
    });

    prevStepBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const prev = btn.getAttribute('data-prev');
        switchStep(prev);
      });
    });

    // Payment Selection
    paymentOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        paymentOptions.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      });
    });

    // Form Submit - Supabase + WhatsApp
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.querySelector('.pay-now');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span>PROCESANDO...</span>';
        btn.disabled = true;

        const formData = new FormData(checkoutForm);
        const customer = {
          name: formData.get('customer_name') || '',
          phone: formData.get('customer_phone') || '',
          email: formData.get('customer_email') || null,
          address: formData.get('customer_address') || '',
          city: formData.get('customer_city') || '',
          postal: formData.get('customer_postal') || ''
        };

        let subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let discountAmount = 0;
        if (activeCoupon) {
          discountAmount = activeCoupon.type === 'percent'
            ? subtotal * (activeCoupon.discount / 100)
            : Math.min(activeCoupon.discount, subtotal);
        }
        const total = Math.max(0, subtotal - discountAmount);
        const items = cart.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size
        }));

        let orderNumber = '-';
        let success = false;

        if (supabase) {
          const { data, error } = await supabase.rpc('create_order', {
            p_customer_name: customer.name,
            p_customer_phone: customer.phone,
            p_customer_email: customer.email || null,
            p_customer_address: customer.address,
            p_customer_city: customer.city,
            p_customer_postal: customer.postal || null,
            p_items: items,
            p_subtotal: subtotal,
            p_discount: discountAmount,
            p_total: total,
            p_coupon_code: activeCoupon?.code || null
          });

          if (!error && data != null) {
            orderNumber = data;
            success = true;
          } else {
            console.error('Supabase error:', error);
            showToast('Error al guardar. Intenta de nuevo.');
          }
        } else {
          orderNumber = Date.now().toString().slice(-6);
          success = true;
        }

        if (success) {
          const itemsText = cart.map(i => `• ${i.name} x${i.quantity} (Talla ${i.size}) - $${(i.price * i.quantity).toFixed(2)}`).join('\n');
          const msg = `Hola! Quiero confirmar mi pedido #${orderNumber}

*Productos:*
${itemsText}

*Total:* $${total.toFixed(2)}

*Datos de envío:*
Nombre: ${customer.name}
Tel: ${customer.phone}
Dirección: ${customer.address}, ${customer.city}${customer.postal ? ' ' + customer.postal : ''}`;

          window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');

          document.getElementById('orderId').textContent = orderNumber;
          switchStep(3);
          cart = [];
          activeCoupon = null;
          if (couponInput) couponInput.value = '';
          if (couponMessage) { couponMessage.textContent = ''; couponMessage.className = 'coupon-message'; }
          saveCartToStorage();
          updateCartUI();
          showToast('¡Pedido registrado! Revisa WhatsApp.');
        }

        btn.innerHTML = originalHTML;
        btn.disabled = false;
      });
    }
  }

  // =========== SIZE GUIDE MODAL ===========
  const sizeModal = document.getElementById('sizeModal');
  const sizeOverlay = document.getElementById('sizeOverlay');
  const closeSizeBtn = document.getElementById('closeSize');
  const sizeTableBody = document.getElementById('sizeTableBody');
  const sizeTabs = document.querySelectorAll('.size-tab');

  const sizeData = {
    polos: [
      { size: 'S', chest: '50', length: '70', shoulder: '42' },
      { size: 'M', chest: '52', length: '72', shoulder: '44' },
      { size: 'L', chest: '54', length: '74', shoulder: '46' },
      { size: 'XL', chest: '56', length: '76', shoulder: '48' }
    ],
    bividis: [
      { size: 'S', chest: '48', length: '68', shoulder: '30' },
      { size: 'M', chest: '50', length: '70', shoulder: '32' },
      { size: 'L', chest: '52', length: '72', shoulder: '34' }
    ],
    shorts: [
      { size: 'S', chest: '30-32', length: '45', shoulder: '-' },
      { size: 'M', chest: '32-34', length: '47', shoulder: '-' },
      { size: 'L', chest: '34-36', length: '49', shoulder: '-' }
    ]
  };

  function updateSizeTable(category) {
    if (!sizeTableBody) return;
    const data = sizeData[category] || sizeData['polos'];
    sizeTableBody.innerHTML = data.map(row => `
      <tr>
        <td>${row.size}</td>
        <td>${row.chest}</td>
        <td>${row.length}</td>
        <td>${row.shoulder}</td>
      </tr>
    `).join('');
  }

  if (sizeModal) {
    // Inject "Size Guide" link into Quick View
    const quickViewSizes = document.querySelector('.quick-view-sizes');
    if (quickViewSizes && !document.querySelector('.open-size-guide')) {
      const link = document.createElement('button');
      link.textContent = 'Guía de Tallas';
      link.className = 'open-size-guide';
      link.style.cssText = 'background:none; border:none; color:var(--color-primary); text-decoration:underline; cursor:pointer; font-size:0.8rem; margin-left:1rem;';

      link.addEventListener('click', () => {
        sizeModal.classList.add('open');
        sizeOverlay.classList.add('open');
        updateSizeTable('polos'); // default
      });

      quickViewSizes.querySelector('.size-label').appendChild(link);
    }

    function closeSize() {
      sizeModal.classList.remove('open');
      sizeOverlay.classList.remove('open');
    }

    closeSizeBtn.addEventListener('click', closeSize);
    sizeOverlay.addEventListener('click', closeSize);

    sizeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        sizeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        updateSizeTable(tab.getAttribute('data-cat'));
      });
    });
  }



  // =========== QUICK VIEW TABS ===========
  const qvTabs = document.querySelectorAll('.qv-tab');
  const qvContents = document.querySelectorAll('.qv-tab-content');

  qvTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      qvTabs.forEach(t => t.classList.remove('active'));
      qvContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const target = tab.getAttribute('data-target');
      const content = document.getElementById(`qv-${target}`);
      if (content) content.classList.add('active');
    });
  });

  // =========== SPECTACULAR EFFECTS (PHASE 5) ===========

  // 1. Parallax & Scroll Reveal
  const heroBg = document.querySelector('.hero-bg-carousel');
  const heroContent = document.querySelector('.hero-content');
  const scrollIndicator = document.querySelector('.scroll-indicator');

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    if (heroBg && scrolled < window.innerHeight) {
      heroBg.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
    if (heroContent && scrolled < window.innerHeight) {
      heroContent.style.transform = `translateY(${scrolled * 0.2}px)`;
      heroContent.style.opacity = 1 - scrolled / 800;
    }
    if (scrollIndicator) {
      scrollIndicator.style.opacity = 1 - scrolled / 300;
    }
  });

  // 2. Glitch Trigger
  const glitchTitle = document.querySelector('.glitch-title');
  if (glitchTitle) {
    setInterval(() => {
      if (Math.random() > 0.92) {
        const lines = glitchTitle.querySelectorAll('.line');
        lines.forEach(line => {
          line.style.animation = 'none';
          void line.offsetWidth;
          line.style.animation = 'glitch-anim 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both';
          setTimeout(() => {
            line.style.animation = '';
          }, 200);
        });
      }
    }, 3000);
  }

  // 3. Magnetic Buttons
  if (window.innerWidth > 768) {
    const magneticBtns = document.querySelectorAll('.btn-primary, .btn-outline, .icon-button, .filter-btn');

    magneticBtns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
      });
    });
  }

});
