import './style.css'
import { supabase } from './supabase.js'
import { escapeHtml } from './utils.js'
import { isDropsPage, isLightweightPage } from './modules/pageContext.js'
import { initLegalPageLite } from './modules/legalPage.js'
import {
  STANDARD_PRICES,
  POLERA_COMPARE_AT_PRICE,
  normalizeCatalogProducts,
} from './modules/catalog.js'
import { CATALOG_FALLBACK } from './data/catalogFallback.js'
import { loadShopCatalogFromStorage } from './modules/catalogStorage.js'
import {
  CART_STORAGE_KEY,
  WISHLIST_STORAGE_KEY,
  COUPON_STORAGE_KEY,
  VALID_COUPONS,
  sanitizeQuantity,
  sanitizeSize,
  parseMoney,
  saveJsonInStorage,
  readJsonFromStorage,
} from './modules/commerce.js'
import { runIfMotionAllowed } from './modules/effects.js'

const WHATSAPP_PHONE = '51970663060'

document.addEventListener('DOMContentLoaded', async () => {
  if (isLightweightPage()) {
    initLegalPageLite();
    return;
  }

  function applyStandardPricesToDom() {
    const setPriceForCardCategory = (category, price) => {
      document.querySelectorAll(`.product-card[data-category="${category}"]`).forEach((card) => {
        card.querySelectorAll('[data-price]').forEach((el) => el.setAttribute('data-price', String(price)));
        const cardPrice = card.querySelector('.card-header .price');
        if (cardPrice && !cardPrice.classList.contains('price-discount')) {
          cardPrice.textContent = `S/${price.toFixed(2)}`;
        }
      });
    };

    setPriceForCardCategory('polo', STANDARD_PRICES.polo);
    setPriceForCardCategory('bividi', STANDARD_PRICES.bividi);
    setPriceForCardCategory('short', STANDARD_PRICES.short);

    document.querySelectorAll('.product-card[data-category="polera"]').forEach((card) => {
      card.querySelectorAll('[data-price]').forEach((el) => el.setAttribute('data-price', String(STANDARD_PRICES.polera)));
      const compareAt = card.querySelector('.price-strikethrough');
      if (compareAt) compareAt.textContent = `S/${POLERA_COMPARE_AT_PRICE.toFixed(2)}`;
      const discountPrice = card.querySelector('.price.price-discount');
      if (discountPrice) discountPrice.textContent = `S/${STANDARD_PRICES.polera.toFixed(2)}`;
      const basePrice = card.querySelector('.card-header .price:not(.price-discount)');
      if (basePrice) basePrice.textContent = `S/${STANDARD_PRICES.polera.toFixed(2)}`;
    });

    // Fresh drops cards (bividis + bermudas) at fixed price.
    document.querySelectorAll('.drop-card').forEach((card) => {
      const name = (card.querySelector('h3')?.textContent || '').toUpperCase();
      const isBividi = name.includes('BIVIDI');
      const isBaggy = name.includes('BERMUDAS BAGGY');
      if (!isBividi && !isBaggy) return;

      const price = 45;
      card.querySelectorAll('[data-price]').forEach((el) => el.setAttribute('data-price', String(price)));
      const dropPrice = card.querySelector('.drop-info .price');
      if (dropPrice) dropPrice.textContent = `S/${price.toFixed(2)}`;
    });

    // Featured strip polos at fixed price.
    document.querySelectorAll('.featured-strip .featured-item').forEach((item) => {
      item.setAttribute('data-price', String(STANDARD_PRICES.polo));
      const featuredPrice = item.querySelector('.featured-price');
      if (featuredPrice) featuredPrice.textContent = `S/${STANDARD_PRICES.polo}`;
    });

    const heroPrice = document.querySelector('.car-polo-price');
    if (heroPrice) heroPrice.textContent = `S/${STANDARD_PRICES.polo}`;
  }

  /** Catálogo inicial inmediato (no bloquea el primer pintado ni el resto del JS por await a Supabase). */
  let products = [...CATALOG_FALLBACK];
  const storedCatalog = loadShopCatalogFromStorage();
  if (storedCatalog?.length) products = storedCatalog;
  try {
    products = normalizeCatalogProducts(products);
    applyStandardPricesToDom();
  } catch (e) {
    console.warn('[NOCTURNA] Error al normalizar catálogo.', e);
  }

  /** Sincronización con Supabase en segundo plano: evita demoras si la API o la red van lentos. */
  if (supabase) {
    void (async () => {
      try {
        const { data, error } = await supabase.from('products').select('*').order('sort_order', { ascending: true });
        if (error || !data?.length) return;
        products = normalizeCatalogProducts(
          data.map((p) => ({
            id: p.id,
            name: p.name,
            price: parseFloat(p.price),
            image: p.image,
            images: (Array.isArray(p.images) && p.images.length) ? p.images : [p.image],
            category: p.category,
            stock: p.stock ?? 0,
            drop: p.drop_name || '',
            newItem: p.new_item ?? false
          }))
        );
        applyStandardPricesToDom();
      } catch (e) {
        console.warn('[NOCTURNA] Catálogo Supabase no disponible, usando datos locales.', e);
      }
    })();
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

    const interactiveElements = document.querySelectorAll('a, button, .product-card, .perfume-card, .hero-car-btn');
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

  if (menuBtn && mobileMenu && mobileMenuOverlay) {
    menuBtn.addEventListener('click', openMobileMenu);
    closeMenu?.addEventListener('click', closeMobileMenu);
    mobileMenuOverlay.addEventListener('click', closeMobileMenu);
    mobileNavLinks.forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  // =========== HERO BG CAROUSEL ===========
  const carSlides = document.querySelectorAll('.car-slide');
  const heroCarPrev = document.getElementById('heroCarPrev');
  const heroCarNext = document.getElementById('heroCarNext');
  const carVehicleHintEl = document.querySelector('.car-vehicle-hint');
  const carPoloNameEl = document.querySelector('.car-polo-name');
  const carPoloPriceEl = document.querySelector('.car-polo-price');
  let carIndex = 0;
  let carSlideTimer = null;

  /** Vehículo del hero + polo de la tienda asociado (precio alineado al catálogo) */
  const heroCars = [
    { year: 'R34', model: 'SKYLINE GT-R', poloName: 'GODZILLA GTR', price: 45 },
    { year: 'MKIV', model: 'SUPRA', poloName: 'SUPRA MK4', price: 45 },
    { year: 'FD', model: 'RX-7', poloName: 'MAZDA RX7', price: 45 },
    { year: 'S15', model: 'SILVIA', poloName: 'SILVIA S15', price: 45 },
    { year: '69', model: 'CHARGER R/T', poloName: 'WEST COAST CHOPPERS', price: 45 },
    { year: '69', model: 'MUSTANG BOSS', poloName: 'FUTURE BLACK', price: 45 },
    { year: 'GSX', model: 'ECLIPSE', poloName: 'NISSAN 180SX', price: 45 },
    { year: 'SS', model: 'MONTE CARLO', poloName: 'SPACE BLACK', price: 45 },
  ];

  function formatVehicleHint(entry) {
    if (!entry) return '';
    return `${entry.year} · ${entry.model}`;
  }

  function updateCarSlide(index) {
    const total = carSlides.length;
    if (total === 0) return;
    carIndex = ((index % total) + total) % total;

    carSlides.forEach((slide, i) => {
      slide.classList.toggle('active', i === carIndex);
    });

    const entry = heroCars[carIndex];
    const fade = (el, text) => {
      if (!el || entry == null) return;
      el.style.opacity = '0';
      setTimeout(() => {
        el.textContent = text;
        el.style.opacity = '1';
      }, 200);
    };

    if (entry) {
      fade(carVehicleHintEl, formatVehicleHint(entry));
      fade(carPoloNameEl, entry.poloName);
      fade(carPoloPriceEl, `S/${entry.price}`);
    }
  }

  function resetCarSlideTimer() {
    if (carSlideTimer) clearInterval(carSlideTimer);
    carSlideTimer = setInterval(() => {
      updateCarSlide(carIndex + 1);
    }, 5000);
  }

  if (carSlides.length > 0 && heroCars.length >= carSlides.length) {
    updateCarSlide(0);

    heroCarPrev?.addEventListener('click', () => {
      updateCarSlide(carIndex - 1);
      resetCarSlideTimer();
    });
    heroCarNext?.addEventListener('click', () => {
      updateCarSlide(carIndex + 1);
      resetCarSlideTimer();
    });

    resetCarSlideTimer();

    document.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, select')) return;
      if (e.key === 'ArrowLeft' && heroCarPrev) {
        updateCarSlide(carIndex - 1);
        resetCarSlideTimer();
      } else if (e.key === 'ArrowRight' && heroCarNext) {
        updateCarSlide(carIndex + 1);
        resetCarSlideTimer();
      }
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

  // =========== FRESH DROPS HORIZONTAL SCROLL ===========
  const freshDropsScroller = document.getElementById('freshDropsScroller');
  const freshDropsPrev = document.getElementById('freshDropsPrev');
  const freshDropsNext = document.getElementById('freshDropsNext');

  function updateFreshDropsNavState() {
    if (!freshDropsScroller || !freshDropsPrev || !freshDropsNext) return;
    const { scrollLeft, scrollWidth, clientWidth } = freshDropsScroller;
    const maxScroll = scrollWidth - clientWidth;
    const eps = 2;
    freshDropsPrev.disabled = scrollLeft <= eps;
    freshDropsNext.disabled = scrollLeft >= maxScroll - eps;
  }

  function scrollFreshDrops(direction) {
    if (!freshDropsScroller) return;
    const firstCard = freshDropsScroller.querySelector('.drop-card');
    const track = freshDropsScroller.querySelector('.fresh-drops-track');
    const gap = track ? (parseFloat(getComputedStyle(track).gap) || 32) : 32;
    const cardW = firstCard ? firstCard.offsetWidth : 280;
    const step = cardW + gap;
    freshDropsScroller.scrollBy({
      left: direction === 'next' ? step : -step,
      behavior: 'smooth',
    });
  }

  if (freshDropsScroller && freshDropsPrev && freshDropsNext) {
    freshDropsPrev.addEventListener('click', () => scrollFreshDrops('prev'));
    freshDropsNext.addEventListener('click', () => scrollFreshDrops('next'));
    freshDropsScroller.addEventListener('scroll', () => {
      window.requestAnimationFrame(updateFreshDropsNavState);
    });
    window.addEventListener('resize', updateFreshDropsNavState);
    updateFreshDropsNavState();
    const freshDropsRo = new ResizeObserver(() => updateFreshDropsNavState());
    freshDropsRo.observe(freshDropsScroller);
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
  }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });

  revealElements.forEach(el => revealObserver.observe(el));

  requestAnimationFrame(() => {
    document.querySelectorAll('#hero .reveal-up').forEach((el) => el.classList.add('visible'));
  });

  // =========== MODERN MOTION SYSTEM ===========
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion) {
    const motionSections = document.querySelectorAll('.section-container, .drops-hero-section, .timeline, .drops-cta-section');
    const motionCards = document.querySelectorAll('.product-card, .perfume-card, .drop-card, .timeline-content');

    motionSections.forEach((section, index) => {
      section.classList.add('motion-section');
      section.style.setProperty('--motion-delay', `${index * 40}ms`);
    });

    /** Tall sections (e.g. #polos) rarely reach 16% intersection ratio; threshold 0 + fallback avoids stuck opacity:0 */
    let sectionObserver;
    const activateMotionSection = (section) => {
      if (!section.classList.contains('motion-section')) return;
      section.classList.add('motion-in');
      sectionObserver.unobserve(section);
      section.querySelectorAll('.reveal-up').forEach((el) => {
        el.classList.add('visible');
        revealObserver.unobserve(el);
      });
    };

    const ensureMotionSectionsVisible = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      motionSections.forEach((section) => {
        if (section.classList.contains('motion-in')) return;
        const rect = section.getBoundingClientRect();
        if (rect.top < vh && rect.bottom > 0) {
          activateMotionSection(section);
        }
      });
    };

    sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activateMotionSection(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px 0px 0px' });

    motionSections.forEach((section) => sectionObserver.observe(section));

    ensureMotionSectionsVisible();
    requestAnimationFrame(ensureMotionSectionsVisible);
    window.addEventListener('load', ensureMotionSectionsVisible, { once: true });
    let motionScrollRaf = null;
    window.addEventListener('scroll', () => {
      if (motionScrollRaf != null) return;
      motionScrollRaf = requestAnimationFrame(() => {
        motionScrollRaf = null;
        ensureMotionSectionsVisible();
      });
    }, { passive: true });
    window.setTimeout(ensureMotionSectionsVisible, 400);
    window.setTimeout(ensureMotionSectionsVisible, 2500);

    const unstickHiddenSections = () => {
      document.querySelectorAll('.motion-section:not(.motion-in)').forEach((section) => {
        section.classList.add('motion-in');
        section.querySelectorAll('.reveal-up').forEach((el) => {
          el.classList.add('visible');
        });
      });
      document.querySelectorAll('.reveal-up:not(.visible)').forEach((el) => el.classList.add('visible'));
    };
    window.setTimeout(unstickHiddenSections, 3200);
    window.addEventListener('load', () => window.setTimeout(unstickHiddenSections, 600), { once: true });

    if (window.innerWidth > 900) {
      motionCards.forEach((card) => {
        card.classList.add('motion-card');
        card.addEventListener('mousemove', (event) => {
          const rect = card.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          const rotateX = (0.5 - y) * 8;
          const rotateY = (x - 0.5) * 10;
          card.style.transform = `translateY(-6px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = '';
        });
      });
    }
  }

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

  function applyDropFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const drop = params.get('drop');
    if (!drop || drop === 'all') return;
    const opts = document.getElementById('dropDropdownOptions');
    if (!opts) return;
    const opt = opts.querySelector(`.drop-dropdown-option[data-drop="${drop}"]`);
    if (!opt) return;
    opt.click();
    const polos = document.getElementById('polos');
    if (polos) {
      requestAnimationFrame(() => {
        polos.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  applyDropFromQuery();

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
      const label = btn.querySelector('.btn-copy-label');
      const prevLabel = label ? label.textContent : null;
      const afterCopy = () => {
        showToast('Copiado al portapapeles');
        if (label && prevLabel) {
          label.textContent = 'Copiado';
          setTimeout(() => {
            label.textContent = prevLabel;
          }, 2000);
        }
      };
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(afterCopy);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        afterCopy();
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

  let cart = readJsonFromStorage(CART_STORAGE_KEY, [])
  let activeCoupon = readJsonFromStorage(COUPON_STORAGE_KEY, null)

  function saveCartToStorage() {
    saveJsonInStorage(CART_STORAGE_KEY, cart)
  }

  function saveCouponToStorage() {
    saveJsonInStorage(COUPON_STORAGE_KEY, activeCoupon)
  }

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
      if (cartTotal) cartTotal.textContent = 'S/0.00';
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
            <span class="cart-item-price">S/${subtotal.toFixed(2)}</span>
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

    if (cartSubtotal) cartSubtotal.textContent = 'S/' + subtotal.toFixed(2);
    if (cartSubtotalRow) cartSubtotalRow.style.display = activeCoupon ? 'flex' : 'none';
    if (cartDiscountRow) {
      cartDiscountRow.style.display = activeCoupon ? 'flex' : 'none';
      if (couponCodeDisplay) couponCodeDisplay.textContent = activeCoupon?.code || '';
      if (cartDiscount) cartDiscount.textContent = '-S/' + discountAmount.toFixed(2);
    }
    if (cartTotal) cartTotal.textContent = 'S/' + total.toFixed(2);

    // Event delegation for cart controls
    if (cartItems) cartItems.onclick = (e) => {
      const btn = e.target.closest('[data-index]');
      if (!btn) return;
      const index = parseInt(btn.getAttribute('data-index'));

      if (btn.classList.contains('qty-minus')) {
        if (cart[index].quantity > 1) {
          cart[index].quantity = sanitizeQuantity(cart[index].quantity - 1, 1, 99);
        } else {
          cart.splice(index, 1);
        }
        saveCartToStorage();
        updateCartUI();
      } else if (btn.classList.contains('qty-plus')) {
        cart[index].quantity = sanitizeQuantity(cart[index].quantity + 1, 1, 99);
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
    const safeQuantity = sanitizeQuantity(quantity);
    const safeSize = sanitizeSize(size);
    const safePrice = parseMoney(price, 45);
    const existingItem = cart.find(item => item.name === name && item.size === safeSize);
    if (existingItem) {
      existingItem.quantity = sanitizeQuantity(existingItem.quantity + safeQuantity, 1, 99);
    } else {
      cart.push({ name, price: safePrice, image, quantity: safeQuantity, size: safeSize });
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

  if (activeCoupon && !VALID_COUPONS[activeCoupon.code]) {
    activeCoupon = null;
    saveCouponToStorage();
  }
  if (activeCoupon && couponInput && couponMessage) {
    couponInput.value = activeCoupon.code;
    couponMessage.textContent = `Cupón activo: ${activeCoupon.code}`;
    couponMessage.className = 'coupon-message success';
  }

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
        saveCouponToStorage();
        couponMessage.textContent = `¡Descuento aplicado! (${coupon.discount}${coupon.type === 'percent' ? '%' : 'S/'})`;
        couponMessage.className = 'coupon-message success';
        updateCartUI();
      } else {
        activeCoupon = null;
        saveCouponToStorage();
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

  let wishlist = readJsonFromStorage(WISHLIST_STORAGE_KEY, [])

  let currentQuickViewProduct = null;
  let selectedSize = 'M';

  function saveWishlistToStorage() {
    saveJsonInStorage(WISHLIST_STORAGE_KEY, wishlist)
  }

  function openWishlist() {
    wishlistSidebar?.classList.add('open');
    wishlistOverlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeWishlistFn() {
    wishlistSidebar?.classList.remove('open');
    wishlistOverlay?.classList.remove('open');
    document.body.style.overflow = '';
  }

  function syncQuickViewWishlistButton() {
    const btn = document.getElementById('addToWishlistModal');
    if (!btn) return;
    if (!currentQuickViewProduct) {
      btn.classList.remove('in-wishlist');
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', 'Agregar a favoritos');
      return;
    }
    const inList = wishlist.some((item) => item.name === currentQuickViewProduct.name);
    btn.classList.toggle('in-wishlist', inList);
    btn.setAttribute('aria-pressed', inList ? 'true' : 'false');
    btn.setAttribute('aria-label', inList ? 'Quitar de favoritos' : 'Agregar a favoritos');
  }

  function updateWishlistUI() {
    if (wishlistCount) wishlistCount.textContent = wishlist.length;
    if (wishlistBtn) wishlistBtn.classList.toggle('has-favorites', wishlist.length > 0);

    if (wishlist.length === 0) {
      if (wishlistItems) wishlistItems.innerHTML = '<p class="empty-wishlist">No tienes favoritos aún</p>';
      syncQuickViewWishlistButton();
      return;
    }

    if (!wishlistItems) return;
    wishlistItems.innerHTML = wishlist.map((item, index) => `
      <div class="wishlist-item">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
        <div class="wishlist-item-info">
          <h4>${escapeHtml(item.name)}</h4>
          <span>S/${item.price.toFixed(2)}</span>
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

    syncQuickViewWishlistButton();
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
          <span>S/${product.price.toFixed(2)}</span>
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
    quickViewPrice.textContent = 'S/' + product.price.toFixed(2);
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
    syncQuickViewWishlistButton();
  }

  function closeQuickViewFn() {
    quickViewModal.classList.remove('open');
    quickViewOverlay.classList.remove('open');
    document.body.style.overflow = '';
    currentQuickViewProduct = null;
    syncQuickViewWishlistButton();
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
        const qty = sanitizeQuantity(qtyInput?.value || 1);
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

  // Add to wishlist from quick view (clic de nuevo quita de favoritos)
  if (addToWishlistModal) {
    addToWishlistModal.addEventListener('click', () => {
      if (!currentQuickViewProduct) return;
      const { name, price, image } = currentQuickViewProduct;
      const idx = wishlist.findIndex((item) => item.name === name);
      if (idx !== -1) {
        wishlist.splice(idx, 1);
        saveWishlistToStorage();
        updateWishlistUI();
        showToast('Quitado de favoritos');
        return;
      }
      addToWishlist(name, price, image);
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
    const starsLiteMq = window.matchMedia('(max-width: 768px)');
    const starsReducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const starsLiteMode = () => starsLiteMq.matches || starsReducedMq.matches;
    let globalStarsAnimId = null;

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
      const area = gWidth * gHeight;
      const lite = starsLiteMode();
      const count = lite
        ? Math.min(42, Math.max(18, Math.floor(area / 22000)))
        : Math.min(300, Math.floor(area / 4000));
      for (let i = 0; i < count; i++) {
        globalStars.push(new GlobalStar());
      }
    }

    function drawGlobalStarsFrame() {
      gCtx.fillStyle = 'rgba(10, 10, 10, 0.1)';
      gCtx.fillRect(0, 0, gWidth, gHeight);
      globalStars.forEach((star) => {
        star.update();
        star.draw();
      });
    }

    function animateGlobalStars() {
      drawGlobalStarsFrame();
      globalStarsAnimId = requestAnimationFrame(animateGlobalStars);
    }

    function paintGlobalStarsStatic() {
      gCtx.fillStyle = '#0a0a0a';
      gCtx.fillRect(0, 0, gWidth, gHeight);
      globalStars.forEach((star) => star.draw());
    }

    function stopGlobalStarsAnim() {
      if (globalStarsAnimId != null) {
        cancelAnimationFrame(globalStarsAnimId);
        globalStarsAnimId = null;
      }
    }

    function applyGlobalStarsMode() {
      stopGlobalStarsAnim();
      gResize();
      initGlobalStars();
      if (starsLiteMode()) {
        globalCanvas.classList.add('global-stars-canvas--static');
        paintGlobalStarsStatic();
      } else {
        globalCanvas.classList.remove('global-stars-canvas--static');
        animateGlobalStars();
      }
    }

    window.addEventListener('resize', applyGlobalStarsMode);
    starsLiteMq.addEventListener('change', applyGlobalStarsMode);
    starsReducedMq.addEventListener('change', applyGlobalStarsMode);

    applyGlobalStarsMode();
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
  const dropsViewActive = isDropsPage();
  const sections = dropsViewActive
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
      let current = dropsViewActive ? 'Drops' : 'Inicio';
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
      const open = aboutSection.classList.contains('expanded');
      aboutToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
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
      const answer = item.querySelector('.faq-answer');
      document.querySelectorAll('.faq-item').forEach((i) => {
        i.classList.remove('open');
        const q = i.querySelector('.faq-question');
        const a = i.querySelector('.faq-answer');
        if (q) q.setAttribute('aria-expanded', 'false');
        if (a) a.setAttribute('aria-hidden', 'true');
      });
      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        if (answer) answer.setAttribute('aria-hidden', 'false');
      }
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
        if (next === '2' && checkoutForm) {
          const requiredStep1 = checkoutForm.querySelectorAll('#step1 [required]');
          const hasInvalid = Array.from(requiredStep1).some((input) => !input.checkValidity());
          if (hasInvalid) {
            requiredStep1.forEach((input) => input.reportValidity());
            showToast('Completa los datos de envío antes de continuar');
            return;
          }
        }
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

        if (cart.length === 0) {
          showToast('Tu carrito está vacío');
          btn.innerHTML = originalHTML;
          btn.disabled = false;
          return;
        }

        const phoneDigits = String(customer.phone).replace(/\D/g, '');
        if (phoneDigits.length < 9) {
          showToast('Ingresa un teléfono válido');
          btn.innerHTML = originalHTML;
          btn.disabled = false;
          return;
        }

        let subtotal = cart.reduce((sum, item) => sum + parseMoney(item.price) * sanitizeQuantity(item.quantity, 1, 99), 0);
        let discountAmount = 0;
        if (activeCoupon) {
          discountAmount = activeCoupon.type === 'percent'
            ? subtotal * (activeCoupon.discount / 100)
            : Math.min(activeCoupon.discount, subtotal);
        }
        const total = Math.max(0, subtotal - discountAmount);
        const items = cart.map(item => ({
          name: item.name,
          price: parseMoney(item.price),
          quantity: sanitizeQuantity(item.quantity, 1, 99),
          size: sanitizeSize(item.size)
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
          const itemsText = cart.map(i => `• ${i.name} x${i.quantity} (Talla ${i.size}) - S/${(i.price * i.quantity).toFixed(2)}`).join('\n');
          const msg = `Hola! Quiero confirmar mi pedido #${orderNumber}

*Productos:*
${itemsText}

*Total:* S/${total.toFixed(2)}

*Datos de envío:*
Nombre: ${customer.name}
Tel: ${customer.phone}
Dirección: ${customer.address}, ${customer.city}${customer.postal ? ' ' + customer.postal : ''}`;

          window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');

          document.getElementById('orderId').textContent = orderNumber;
          switchStep(3);
          cart = [];
          activeCoupon = null;
          saveCouponToStorage();
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

  runIfMotionAllowed(() => {
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
  });

  // 2. Glitch Trigger
  const glitchTitle = document.querySelector('.glitch-title');
  if (glitchTitle) {
    runIfMotionAllowed(() => {
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
    });
  }

  // 3. Magnetic Buttons
  if (window.innerWidth > 768 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
