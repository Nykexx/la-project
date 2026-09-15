/* LA Project — Studia 54 Aesthetic & Logic */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];

  /* ── 0. Мультиязычность (RU / KZ / EN) ─────────────────────────── */
  let currentLang = localStorage.getItem('la_lang') || 'ru';
  if (!['ru', 'kz', 'en'].includes(currentLang)) currentLang = 'ru';

  function setLanguage(lang) {
    if (typeof I18N === 'undefined' || !I18N[lang]) return;
    currentLang = lang;
    localStorage.setItem('la_lang', lang);
    document.documentElement.lang = (lang === 'kz') ? 'kk' : lang;

    // Обновляем активные кнопки в десктопном и мобильном переключателях
    $$('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    const dict = I18N[lang];

    // Обновляем все элементы с атрибутом data-i18n
    $$('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Обновляем плейсхолдеры
    $$('[data-i18n-ph]').forEach(el => {
      const key = el.dataset.i18nPh;
      if (dict[key]) {
        el.placeholder = dict[key];
      }
    });

    // Перерисовываем карточки проектов с новыми строками статусов и счетчиков
    renderAllProjects();

    // Обновляем расчет в квизе, если открыт экран результатов
    updateQuizCalculation();

    // Обновляем WhatsApp ссылку в форме
    updateWaLink();
  }

  // Навешиваем слушатели на кнопки переключения языка
  document.addEventListener('click', e => {
    const btn = e.target.closest('.lang-btn');
    if (btn && btn.dataset.lang) {
      setLanguage(btn.dataset.lang);
    }
  });

  /* ── 0б. Изображения: srcset и цели аналитики ──────────────────── */
  function imgSrcset(key) {
    const meta = (typeof IMG_SIZES !== 'undefined') ? IMG_SIZES[key] : null;
    if (!meta) return null;
    const widths = meta[2];
    const widest = widths[widths.length - 1];
    return widths
      .map(w => (w === widest ? `img/${key}.webp ${w}w` : `img/${key}-${w}.webp ${w}w`))
      .join(', ');
  }

  const SIZES_CARD = '(max-width: 700px) 92vw, (max-width: 1200px) 46vw, 30vw';
  const SIZES_FULL = '(max-width: 1400px) 100vw, 1304px';

  function picture(key, alt, opts) {
    opts = opts || {};
    const meta = (typeof IMG_SIZES !== 'undefined') ? IMG_SIZES[key] : null;
    const srcset = imgSrcset(key);
    const dims = meta ? ` width="${meta[0]}" height="${meta[1]}"` : '';
    const cls = opts.className ? ` class="${opts.className}"` : '';
    const loading = opts.eager ? '' : ' loading="lazy"';
    const dataFull = opts.dataFull ? ` data-full="img/${key}.webp"` : '';
    const img = `<img src="img/${key}.jpg" alt="${alt}"${dims}${loading}${dataFull} decoding="async" />`;
    if (!srcset) return img;
    return `<picture${cls}>` +
      `<source type="image/webp" sizes="${opts.sizes || SIZES_CARD}" srcset="${srcset}" />` +
      img +
      `</picture>`;
  }

  /* Блокировка прокрутки фона под меню, лайтбоксом и зумом */
  let lockedScrollY = 0;
  let lockCount = 0;

  function lockScroll(on) {
    if (on) {
      if (lockCount++ > 0) return;
      lockedScrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${lockedScrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      if (lockCount === 0 || --lockCount > 0) return;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, lockedScrollY);
    }
  }

  function track(goal, params) {
    try {
      if (window.LA_METRIKA_ID && typeof window.ym === 'function') {
        window.ym(window.LA_METRIKA_ID, 'reachGoal', goal, params || {});
      }
      if (typeof window.gtag === 'function') window.gtag('event', goal, params || {});
    } catch (e) { /* аналитика */ }
  }

  /* ── 1. Кастомный курсор с плавным сглаживанием (Lerp) ──────────── */
  const cursorDot = document.getElementById('cursor-dot');
  const cursorRing = document.getElementById('cursor-ring');
  const cursorLabel = document.getElementById('cursor-label');

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  let isHovering = false;
  let isCardHovering = false;
  let isVisible = false;
  let isTouchDevice = false;

  if (cursorDot && cursorRing) {
    window.addEventListener('touchstart', function onTouch() {
      isTouchDevice = true;
      document.documentElement.classList.remove('has-custom-cursor');
      cursorDot.style.display = 'none';
      cursorRing.style.display = 'none';
    }, { passive: true, once: true });

    window.addEventListener('mousemove', e => {
      if (isTouchDevice) return;
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        ringX = mouseX;
        ringY = mouseY;
        document.documentElement.classList.add('has-custom-cursor');
        cursorDot.style.opacity = '1';
        cursorRing.style.opacity = '1';
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      if (isTouchDevice) return;
      isVisible = false;
      cursorDot.style.opacity = '0';
      cursorRing.style.opacity = '0';
    });

    document.addEventListener('mouseenter', e => {
      if (isTouchDevice) return;
      mouseX = e.clientX;
      mouseY = e.clientY;
      isVisible = true;
      cursorDot.style.opacity = '1';
      cursorRing.style.opacity = '1';
    });

    function renderCursor() {
      if (!isTouchDevice && isVisible) {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;

        cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
        cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }
      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);

    document.addEventListener('mouseover', e => {
      if (isTouchDevice) return;

      const card = e.target.closest('.card, .st-track, .lightbox-gallery img');
      const interactive = e.target.closest('a, button, .hero-bullet, .hero-nav-btn, select, input, textarea, .lightbox-x, .svc-box, .adv-card, .theme-toggle, .quiz-option-card, .lang-btn');

      if (card) {
        isCardHovering = true;
        isHovering = false;
        document.body.classList.add('cursor-card-hover');
        document.body.classList.remove('cursor-hover');
        if (cursorLabel) {
          cursorLabel.textContent = (currentLang === 'en') ? 'VIEW' : (currentLang === 'kz' ? 'КӨРУ' : 'СМОТРЕТЬ');
        }
      } else if (interactive) {
        isHovering = true;
        isCardHovering = false;
        document.body.classList.add('cursor-hover');
        document.body.classList.remove('cursor-card-hover');
      } else {
        isHovering = false;
        isCardHovering = false;
        document.body.classList.remove('cursor-hover', 'cursor-card-hover');
      }
    });
  }

  /* ── 2. Hero Слайдер (Кинематографичный) ─────────────────── */
  const heroSlides = $$('.hero-slide');
  const SLIDES_DATA = heroSlides.map(el => ({
    key: el.dataset.key,
    tag: el.dataset.tag || ''
  }));

  function ensureSlideLoaded(i) {
    const el = heroSlides[i];
    if (!el || el.dataset.loaded === '1' || el.querySelector('img')) {
      if (el) el.dataset.loaded = '1';
      return;
    }
    el.dataset.loaded = '1';
    el.innerHTML = picture(SLIDES_DATA[i].key, SLIDES_DATA[i].tag, {
      className: 'hero-slide-bg',
      sizes: '100vw',
      eager: true
    });
  }
  const heroPagination = $('#hero-pagination');
  const heroCounter = $('#hero-counter');
  const heroSlideTag = $('#hero-slide-tag');
  const heroPrev = $('#hero-prev');
  const heroNext = $('#hero-next');

  let currentSlide = 0;
  const slideDuration = 6000;
  let slideStartTime = Date.now();
  let animFrameId = null;

  if (heroPagination) {
    heroPagination.innerHTML = SLIDES_DATA.map((_, i) => `
      <div class="hero-bullet${i === 0 ? ' active' : ''}" data-index="${i}">
        <div class="hero-bullet-fill"></div>
      </div>
    `).join('');
  }

  function setSlide(index) {
    if (index < 0) index = SLIDES_DATA.length - 1;
    if (index >= SLIDES_DATA.length) index = 0;

    currentSlide = index;

    ensureSlideLoaded(currentSlide);
    ensureSlideLoaded((currentSlide + 1) % SLIDES_DATA.length);

    heroSlides.forEach((slide, i) => {
      slide.classList.toggle('active', i === currentSlide);
    });

    $$('.hero-bullet', heroPagination).forEach((bullet, i) => {
      bullet.classList.toggle('active', i === currentSlide);
      const fill = $('.hero-bullet-fill', bullet);
      if (fill) {
        if (i < currentSlide) fill.style.width = '100%';
        else if (i > currentSlide) fill.style.width = '0%';
        else fill.style.width = '0%';
      }
    });

    if (heroCounter) {
      const pad = n => String(n).padStart(2, '0');
      heroCounter.innerHTML = `<span>${pad(currentSlide + 1)}</span> / ${pad(SLIDES_DATA.length)}`;
    }

    if (heroSlideTag && SLIDES_DATA[currentSlide]) {
      heroSlideTag.textContent = SLIDES_DATA[currentSlide].tag;
    }

    slideStartTime = Date.now();
  }

  function startSlideTimer() {
    cancelAnimationFrame(animFrameId);

    function tick() {
      const elapsed = Date.now() - slideStartTime;
      const progress = Math.min(100, (elapsed / slideDuration) * 100);

      const activeBulletFill = $(`#hero-pagination .hero-bullet[data-index="${currentSlide}"] .hero-bullet-fill`);
      if (activeBulletFill) {
        activeBulletFill.style.width = progress + '%';
      }

      if (elapsed >= slideDuration) {
        setSlide(currentSlide + 1);
      }
      animFrameId = requestAnimationFrame(tick);
    }
    animFrameId = requestAnimationFrame(tick);
  }

  if (heroPagination) {
    heroPagination.addEventListener('click', e => {
      const bullet = e.target.closest('.hero-bullet');
      if (bullet) setSlide(+bullet.dataset.index);
    });
  }

  if (heroPrev) heroPrev.addEventListener('click', () => setSlide(currentSlide - 1));
  if (heroNext) heroNext.addEventListener('click', () => setSlide(currentSlide + 1));

  const heroSlider = $('#top');
  if (heroSlider) {
    let touchStartX = 0;
    let touchStartY = 0;
    heroSlider.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    heroSlider.addEventListener('touchend', e => {
      const diffX = e.changedTouches[0].screenX - touchStartX;
      const diffY = e.changedTouches[0].screenY - touchStartY;
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) setSlide(currentSlide + 1);
        else setSlide(currentSlide - 1);
      }
    }, { passive: true });
  }

  setSlide(0);
  startSlideTimer();

  /* ── 3. Последовательная сетка карточек ─────────────────── */
  const archGrid = $('#arch-grid');
  const intGrid = $('#int-grid');
  const archCount = $('#arch-count');
  const intCount = $('#int-count');

  function renderCard(o) {
    const cover = picture(`${o.slug}/${o.shots[0]}`, `${o.title} — ${o.place}`, {
      sizes: SIZES_CARD
    });
    const statusText = (currentLang === 'en')
      ? (o.status === 'Реализован' ? 'Completed' : 'Concept')
      : (currentLang === 'kz' ? (o.status === 'Реализован' ? 'Жүзеге асырылды' : 'Жоба') : o.status);

    const photosLabel = (currentLang === 'en') ? 'photos' : (currentLang === 'kz' ? 'фото' : 'фото');

    return `
      <article class="card" data-slug="${o.slug}">
        <div class="card-img">
          ${cover}
          ${o.status === 'Реализован' ? `<span class="card-badge-top">${statusText}</span>` : ''}
        </div>
        <div class="card-caption">
          <h3 class="card-title">${o.title}</h3>
          <div class="card-meta">
            <span class="card-tag">${o.tag}</span>
            <span>${o.place} · ${o.shots.length} ${photosLabel}</span>
          </div>
        </div>
      </article>
    `;
  }

  function renderAllProjects() {
    if (typeof OBJECTS === 'undefined') return;

    const archList = OBJECTS.filter(o => o.cat === 'arch');
    const intList = OBJECTS.filter(o => o.cat === 'int');

    if (archGrid) archGrid.innerHTML = archList.map(renderCard).join('');
    if (intGrid) intGrid.innerHTML = intList.map(renderCard).join('');

    if (archCount) {
      archCount.textContent = (currentLang === 'en')
        ? `${archList.length} objects`
        : (currentLang === 'kz' ? `${archList.length} нысан` : `${archList.length} ${plural(archList.length, 'объект', 'объекта', 'объектов')}`);
    }
    if (intCount) {
      intCount.textContent = (currentLang === 'en')
        ? `${intList.length} objects`
        : (currentLang === 'kz' ? `${intList.length} нысан` : `${intList.length} ${plural(intList.length, 'объект', 'объекта', 'объектов')}`);
    }
  }

  function plural(n, a, b, c) {
    const m = n % 100, k = n % 10;
    if (m > 10 && m < 20) return c;
    if (k === 1) return a;
    if (k >= 2 && k <= 4) return b;
    return c;
  }

  renderAllProjects();

  /* ── 4. Полноэкранный Лайтбокс Проекта (Фича 3 + Дебаг) ─── */
  const lightbox = $('#lightbox');
  let currentProjectIndex = 0;
  let lastFocused = null;

  function openLightbox(slugOrIndex, updateHash) {
    if (typeof OBJECTS === 'undefined' || !lightbox) return;

    let index = -1;
    if (typeof slugOrIndex === 'number') {
      index = slugOrIndex;
    } else {
      index = OBJECTS.findIndex(x => x.slug === slugOrIndex);
    }

    if (index < 0 || index >= OBJECTS.length) return;
    currentProjectIndex = index;
    const o = OBJECTS[currentProjectIndex];

    const dirLabel = o.cat === 'arch'
      ? (currentLang === 'en' ? 'Architectural Project' : (currentLang === 'kz' ? 'Сәулеттік жоба' : 'Архитектурный проект'))
      : (currentLang === 'en' ? 'Interior Design' : (currentLang === 'kz' ? 'Интерьер дизайны' : 'Дизайн интерьера'));

    const statusText = (currentLang === 'en')
      ? (o.status === 'Реализован' ? 'Completed' : 'Concept')
      : (currentLang === 'kz' ? (o.status === 'Реализован' ? 'Жүзеге асырылды' : 'Жоба') : o.status);

    const shotsText = (currentLang === 'en')
      ? `${o.shots.length} shots`
      : (currentLang === 'kz' ? `${o.shots.length} кадр` : `${o.shots.length} ${plural(o.shots.length, 'кадр', 'кадра', 'кадров')}`);

    $('#lb-dir').textContent = dirLabel;
    $('#lb-tag').textContent = o.tag;
    $('#lb-title').textContent = o.title;
    $('#lb-meta').textContent = `${o.place} · ${statusText} · ${shotsText}`;
    $('#lb-desc').textContent = o.desc;

    $('#lb-specs').innerHTML = Object.entries(o.facts)
      .map(([k, v]) => `<div class="spec-cell"><b>${k}</b><span>${v}</span></div>`).join('');

    // Рендерим галерею с атрибутом data-full для зума
    $('#lb-gallery').innerHTML = o.shots
      .map((s, i) => picture(`${o.slug}/${s}`, `${o.title} — кадр ${i + 1}`, {
        sizes: SIZES_FULL,
        eager: i === 0,
        dataFull: true
      })).join('');

    if (updateHash !== false) {
      try {
        history.replaceState(null, '', `#project-${o.slug}`);
      } catch (e) { }
    }

    if (!lightbox.classList.contains('open')) {
      lastFocused = document.activeElement;
      lightbox.classList.add('open');
      document.body.classList.add('lb-open');
      lockScroll(true);
    }
    lightbox.scrollTop = 0;

    const closeBtn = $('#lb-x');
    if (closeBtn) closeBtn.focus({ preventScroll: true });
    track('project_open', { slug: o.slug, title: o.title });
  }

  function openPrevProject() {
    if (typeof OBJECTS === 'undefined' || !OBJECTS.length) return;
    const prevIdx = (currentProjectIndex - 1 + OBJECTS.length) % OBJECTS.length;
    openLightbox(prevIdx);
  }

  function openNextProject() {
    if (typeof OBJECTS === 'undefined' || !OBJECTS.length) return;
    const nextIdx = (currentProjectIndex + 1) % OBJECTS.length;
    openLightbox(nextIdx);
  }

  function closeLightbox() {
    if (!lightbox || !lightbox.classList.contains('open')) return;
    lightbox.classList.remove('open');
    document.body.classList.remove('lb-open');
    lockScroll(false);

    try {
      if (window.location.hash.startsWith('#project-')) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch (e) { }

    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus({ preventScroll: true });
    }
    lastFocused = null;
  }

  // Клик по карточке проекта
  document.addEventListener('click', e => {
    const c = e.target.closest('.card');
    if (c && c.dataset.slug) openLightbox(c.dataset.slug);
  });

  // Кнопки навигации внутри лайтбокса
  const lbPrev = $('#lb-prev-proj');
  const lbNext = $('#lb-next-proj');
  const lbShare = $('#lb-share-btn');
  const lbX = $('#lb-x');

  if (lbPrev) lbPrev.addEventListener('click', openPrevProject);
  if (lbNext) lbNext.addEventListener('click', openNextProject);
  if (lbX) lbX.addEventListener('click', closeLightbox);

  // Кнопка «Поделиться / Скопировать ссылку на проект»
  function showToast(msg) {
    const toast = $('#toast');
    if (!toast) return;
    if (msg) toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  if (lbShare) {
    lbShare.addEventListener('click', async () => {
      const o = OBJECTS[currentProjectIndex];
      if (!o) return;
      const url = `${window.location.origin}${window.location.pathname}#project-${o.slug}`;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
          const copyMsg = (typeof I18N !== 'undefined' && I18N[currentLang]) ? I18N[currentLang].lb_copied : '✓ Ссылка на проект скопирована!';
          showToast(copyMsg);
        } else {
          prompt('Скопируйте ссылку на проект:', url);
        }
      } catch (err) {
        prompt('Скопируйте ссылку на проект:', url);
      }
    });
  }

  if (lightbox) {
    lightbox.addEventListener('click', e => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  [$('#lb-cta'), $('#lb-cta-m')].forEach(btn => {
    if (btn) btn.addEventListener('click', closeLightbox);
  });

  /* ── 4б. Полноэкранный Зум фото (Zoom Overlay) ─────────── */
  const zoomOverlay = $('#zoom-overlay');
  const zoomImg = $('#zoom-img');
  const zoomClose = $('#zoom-close');

  function openZoom(src) {
    if (!zoomOverlay || !zoomImg || !src) return;
    zoomImg.src = src;
    zoomOverlay.classList.add('open');
  }

  function closeZoom() {
    if (!zoomOverlay) return;
    zoomOverlay.classList.remove('open');
  }

  if (zoomClose) zoomClose.addEventListener('click', closeZoom);
  if (zoomOverlay) {
    zoomOverlay.addEventListener('click', e => {
      if (e.target === zoomOverlay || e.target === zoomImg) closeZoom();
    });
  }

  // Клик по фото в лайтбоксе для открытия зума
  document.addEventListener('click', e => {
    const img = e.target.closest('#lb-gallery img');
    if (img) {
      const fullSrc = img.dataset.full || img.currentSrc || img.src;
      openZoom(fullSrc);
    }
  });

  // Клавиатурная навигация: Escape (закрыть зум / лайтбокс), ArrowLeft / ArrowRight
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (zoomOverlay && zoomOverlay.classList.contains('open')) {
        closeZoom();
      } else if (lightbox && lightbox.classList.contains('open')) {
        closeLightbox();
      } else if (lookbookModal && lookbookModal.classList.contains('open')) {
        closeLookbook();
      }
    } else if (lightbox && lightbox.classList.contains('open') && (!zoomOverlay || !zoomOverlay.classList.contains('open'))) {
      if (e.key === 'ArrowLeft') openPrevProject();
      else if (e.key === 'ArrowRight') openNextProject();
    }
  });

  // Сенсорный свайп закрытия лайтбокса
  if (lightbox) {
    let swipeStartY = 0;
    let swipeArmed = false;
    lightbox.addEventListener('touchstart', e => {
      swipeStartY = e.changedTouches[0].clientY;
      swipeArmed = lightbox.scrollTop <= 4;
    }, { passive: true });
    lightbox.addEventListener('touchend', e => {
      if (!swipeArmed) return;
      if (e.changedTouches[0].clientY - swipeStartY > 90) closeLightbox();
    }, { passive: true });
  }

  // Deep linking: открытие проекта по хэшу URL (#project-slug или #slug)
  function checkUrlHash() {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    const clean = hash.replace(/^#project-/, '').replace(/^#/, '');
    if (typeof OBJECTS !== 'undefined') {
      const match = OBJECTS.find(x => x.slug === clean);
      if (match) {
        setTimeout(() => openLightbox(match.slug, false), 150);
      }
    }
  }
  window.addEventListener('popstate', checkUrlHash);
  checkUrlHash();

  /* ── 5. Интерактивный Квиз / Конфигуратор (Фича 4) ──────── */
  const quizStepSegments = $$('.quiz-progress-seg');
  const quizSteps = $$('.quiz-step');
  const quizStepIndicator = $('#quiz-step-indicator');
  const quizStepName = $('#quiz-step-name');
  const quizPrevBtn = $('#quiz-prev-btn');
  const quizNextBtn = $('#quiz-next-btn');
  const quizSummaryText = $('#quiz-summary-text');
  const quizWaBtn = $('#quiz-wa-btn');
  const quizFillFormBtn = $('#quiz-fill-form-btn');

  let curQuizStep = 0;
  const quizState = {
    type: 'Загородный дом / Резиденция',
    area: '200 – 500 м²',
    scope: 'Полный рабочий проект под ключ',
    location: 'Алматы / Город'
  };

  const STEP_NAMES = {
    ru: ['Тип объекта', 'Площадь', 'Состав проекта', 'Локация и сроки', 'Результат расчета'],
    kz: ['Нысан түрі', 'Аумағы', 'Жоба құрамы', 'Орналасуы', 'Есептеу нәтижесі'],
    en: ['Property Type', 'Floor Area', 'Project Scope', 'Location', 'Estimate Result']
  };

  // Выбор опции в карточках квиза
  document.addEventListener('click', e => {
    const opt = e.target.closest('.quiz-option-card');
    if (opt && opt.dataset.field) {
      const field = opt.dataset.field;
      const val = opt.dataset.val;
      quizState[field] = val;

      const parentGrid = opt.closest('.quiz-options-grid');
      if (parentGrid) {
        $$('.quiz-option-card', parentGrid).forEach(c => c.classList.remove('selected'));
      }
      opt.classList.add('selected');
    }
  });

  function updateQuizCalculation() {
    if (!quizSummaryText || !quizWaBtn) return;

    let timeline = '2.5 – 4 месяца';
    if (quizState.area.includes('1 000') || quizState.area.includes('более')) timeline = '4 – 6 месяцев';
    else if (quizState.area.includes('до 200')) timeline = '1.5 – 2.5 месяца';

    const langNames = STEP_NAMES[currentLang] || STEP_NAMES.ru;
    if (quizStepName && langNames[curQuizStep]) {
      quizStepName.textContent = langNames[curQuizStep];
    }

    if (quizStepIndicator) {
      const stepWord = (currentLang === 'en') ? 'Step' : (currentLang === 'kz' ? 'Қадам' : 'Шаг');
      const ofWord = (currentLang === 'en') ? 'of' : (currentLang === 'kz' ? '/' : 'из');
      quizStepIndicator.innerHTML = `${stepWord} ${Math.min(4, curQuizStep + 1)} ${ofWord} 4`;
    }

    if (currentLang === 'en') {
      quizSummaryText.innerHTML = `
        <div><b>Property:</b> ${quizState.type}</div>
        <div><b>Approximate Area:</b> ${quizState.area}</div>
        <div><b>Selected Scope:</b> ${quizState.scope}</div>
        <div><b>Location:</b> ${quizState.location}</div>
        <div style="margin-top: 10px; color: var(--accent); font-weight: 600;"><b>Estimated Timeframe:</b> ~${timeline}</div>
      `;
    } else if (currentLang === 'kz') {
      quizSummaryText.innerHTML = `
        <div><b>Нысан:</b> ${quizState.type}</div>
        <div><b>Болжамды аумағы:</b> ${quizState.area}</div>
        <div><b>Жоба құрамы:</b> ${quizState.scope}</div>
        <div><b>Орналасуы:</b> ${quizState.location}</div>
        <div style="margin-top: 10px; color: var(--accent); font-weight: 600;"><b>Жобалау мерзімі:</b> ~${timeline}</div>
      `;
    } else {
      quizSummaryText.innerHTML = `
        <div><b>Объект:</b> ${quizState.type}</div>
        <div><b>Площадь:</b> ${quizState.area}</div>
        <div><b>Состав работ:</b> ${quizState.scope}</div>
        <div><b>Локация:</b> ${quizState.location}</div>
        <div style="margin-top: 10px; color: var(--accent); font-weight: 600;"><b>Ориентировочный срок:</b> ~${timeline}</div>
      `;
    }

    // Формируем WhatsApp текст
    const waText = `Здравствуйте! Рассчитал проект в онлайн-конфигураторе LA Project:\n• Объект: ${quizState.type}\n• Площадь: ${quizState.area}\n• Состав: ${quizState.scope}\n• Локация: ${quizState.location}\nХочу получить консультацию ведущего архитектора.`;
    quizWaBtn.href = `https://wa.me/77017864680?text=${encodeURIComponent(waText)}`;
  }

  function showQuizStep(step) {
    curQuizStep = step;

    quizSteps.forEach((el, idx) => {
      el.style.display = (idx === step) ? 'block' : 'none';
    });

    quizStepSegments.forEach((seg, idx) => {
      seg.classList.toggle('active', idx <= Math.min(3, step));
    });

    if (quizPrevBtn) {
      quizPrevBtn.style.visibility = (step === 0 || step === 4) ? 'hidden' : 'visible';
    }

    if (quizNextBtn) {
      if (step >= 3) {
        quizNextBtn.style.display = 'none';
      } else {
        quizNextBtn.style.display = 'inline-flex';
        quizNextBtn.textContent = (currentLang === 'en') ? 'Next →' : (currentLang === 'kz' ? 'Келесі →' : 'Далее →');
      }
    }

    if (step === 3) {
      // На 3 шаге кнопка "Сформировать расчет"
      if (quizNextBtn) {
        quizNextBtn.style.display = 'inline-flex';
        quizNextBtn.textContent = (currentLang === 'en') ? 'Calculate Estimate ⚡' : (currentLang === 'kz' ? 'Есептеуді алу ⚡' : 'Сформировать расчет ⚡');
      }
    }

    if (step === 4) {
      updateQuizCalculation();
    } else {
      const langNames = STEP_NAMES[currentLang] || STEP_NAMES.ru;
      if (quizStepName && langNames[step]) {
        quizStepName.textContent = langNames[step];
      }
      if (quizStepIndicator) {
        const stepWord = (currentLang === 'en') ? 'Step' : (currentLang === 'kz' ? 'Қадам' : 'Шаг');
        const ofWord = (currentLang === 'en') ? 'of' : (currentLang === 'kz' ? '/' : 'из');
        quizStepIndicator.innerHTML = `${stepWord} ${step + 1} ${ofWord} 4`;
      }
    }
  }

  if (quizNextBtn) {
    quizNextBtn.addEventListener('click', () => {
      if (curQuizStep < 4) {
        showQuizStep(curQuizStep + 1);
      }
    });
  }

  if (quizPrevBtn) {
    quizPrevBtn.addEventListener('click', () => {
      if (curQuizStep > 0) {
        showQuizStep(curQuizStep - 1);
      }
    });
  }

  if (quizFillFormBtn) {
    quizFillFormBtn.addEventListener('click', () => {
      const fDir = $('#f-dir');
      const fType = $('#f-type');
      const fMsg = $('#f-msg');

      if (fDir) fDir.value = quizState.scope.includes('Дизайн') ? 'Дизайн интерьера' : 'Архитектурное проектирование';
      if (fType) fType.value = quizState.type.includes('Квартира') ? 'Апартаменты / Квартира' : 'Загородный дом / Резиденция';
      if (fMsg) fMsg.value = `Площадь: ${quizState.area}, Локация: ${quizState.location}, Пакет: ${quizState.scope}`;
      updateWaLink();
    });
  }

  showQuizStep(0);

  /* ── 6. Модальное окно Lookbook (Фича 5) ─────────────────── */
  const lookbookModal = $('#lookbook-modal');
  const lookbookClose = $('#lookbook-close');
  const openLookbookBtns = [$('#open-lookbook-btn'), $('#open-lookbook-btn-m')];

  function openLookbook() {
    if (!lookbookModal) return;
    lookbookModal.classList.add('open');
    lockScroll(true);
  }

  function closeLookbook() {
    if (!lookbookModal) return;
    lookbookModal.classList.remove('open');
    lockScroll(false);
  }

  openLookbookBtns.forEach(btn => {
    if (btn) btn.addEventListener('click', openLookbook);
  });

  if (lookbookClose) lookbookClose.addEventListener('click', closeLookbook);
  if (lookbookModal) {
    lookbookModal.addEventListener('click', e => {
      if (e.target === lookbookModal) closeLookbook();
    });
  }

  /* ── 7. Секция «Как строится дом» ───────────────────────── */
  const STAGES = [
    { n: 'Стадия 01', t: 'Оригинальный фасадный чертёж', d: 'Проектная документация: раскладка камня, высотные отметки, конструктивные узлы и сейсмический расчёт.', hold: 3400, light: true },
    { n: 'Стадия 02', t: '3D-визуализация', d: 'Моделирование световых сценариев, текстур камня и ландшафта до начала стройки.', hold: 3600 },
    { n: 'Стадия 03', t: 'Строительство и авторский надзор', d: 'Реализация под контролем ведущего архитектора от фундамента до кровли.', hold: 0 },
    { n: 'Стадия 04', t: 'Готовый дом', d: 'Точное совпадение готового особняка с проектным решением.', hold: 5400 }
  ];

  const layers = $$('.st-layer');
  const segs = $$('.st-seg');
  const navTabs = $$('.st-nav-tab');
  const cap = $('#st-cap');
  const stVideo = $('#st-video');
  const stFinal = $('#st-final');
  let curStage = 0;
  let stageTimer = null;
  let stageStarted = false;

  function showStage(i) {
    curStage = i;
    layers.forEach(l => l.classList.toggle('on', +l.dataset.i === i));
    segs.forEach((s, k) => s.classList.toggle('done', k <= i));
    navTabs.forEach((tab, k) => tab.classList.toggle('active', k === i));
    const s = STAGES[i];

    if (cap) {
      cap.className = 'st-cap' + (s.light ? ' on-light' : '');
      cap.innerHTML = `<div class="n">${s.n}</div><div class="t">${s.t}</div><div class="d">${s.d}</div>`;
    }
    if (stFinal) stFinal.classList.toggle('on', i === 3);

    clearTimeout(stageTimer);
    if (i === 2) {
      if (stVideo) {
        try { stVideo.currentTime = 0; } catch (e) { }
        const p = stVideo.play();
        if (p && typeof p.catch === 'function') p.catch(() => { });
      }
      stageTimer = setTimeout(() => nextStage(), 16000);
    } else {
      try { if (stVideo) stVideo.pause(); } catch (e) { }
      stageTimer = setTimeout(() => nextStage(), s.hold);
    }
  }

  function nextStage() { showStage((curStage + 1) % STAGES.length); }

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const idx = +tab.dataset.i;
      showStage(idx);
    });
  });

  segs.forEach((seg, idx) => {
    seg.addEventListener('click', () => {
      showStage(idx);
    });
  });

  if (stVideo) {
    stVideo.addEventListener('ended', () => { if (curStage === 2) nextStage(); });
  }

  const stOpen = $('#st-open');
  if (stOpen) {
    stOpen.addEventListener('click', () => openLightbox('mansion-classic'));
  }

  const stTrack = $('#st-track');
  if (stTrack) {
    const stObserver = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting && !stageStarted) {
          stageStarted = true;
          showStage(0);
        } else if (!en.isIntersecting && stageStarted) {
          clearTimeout(stageTimer);
          stageStarted = false;
          try { if (stVideo) stVideo.pause(); } catch (e) { }
        }
      });
    }, { threshold: 0.35 });
    stObserver.observe(stTrack);
  }

  /* ── 8. Меню ─────────────────────────────────────────────── */
  const mmenu = $('#mmenu');
  const burger = $('#burger');

  function setMenu(open) {
    if (!mmenu || !burger) return;
    mmenu.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('menu-open', open);
    lockScroll(open);
  }

  if (burger && mmenu) {
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-controls', 'mmenu');
    burger.addEventListener('click', () => setMenu(!mmenu.classList.contains('open')));
    mmenu.addEventListener('click', e => {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mmenu.classList.contains('open')) setMenu(false);
    });
  }

  /* ── 9. Скролл шапки ─────────────────────────────────────── */
  const nav = $('#nav');
  const totop = $('#totop');
  const mobileCta = $('#mobile-cta');
  let lastScrollY = 0;
  let scrollTicking = false;

  function onScroll() {
    const y = window.scrollY;
    if (nav) {
      nav.classList.toggle('scrolled', y > 50);
      nav.classList.toggle('hide', y > 400 && y > lastScrollY);
    }
    if (totop) {
      totop.classList.toggle('on', y > 600);
    }
    if (mobileCta) {
      mobileCta.classList.toggle('on', y > window.innerHeight * 0.7);
    }
    lastScrollY = y;
    scrollTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(onScroll);
  }, { passive: true });
  onScroll();

  if (totop) {
    totop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ── 10. Reveal блоков ────────────────────────────────────── */
  const revObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  $$('.reveal').forEach(el => revObserver.observe(el));

  /* ── 11. Отправка формы заявки ────────────────────────────── */
  const fSend = $('#f-send');
  const fWaDirect = $('#f-wa-direct');
  const fName = $('#f-name');
  const fContact = $('#f-contact');
  const fDir = $('#f-dir');
  const fType = $('#f-type');
  const fMsg = $('#f-msg');
  const fOk = $('#f-ok');

  function updateWaLink() {
    if (!fWaDirect) return;
    const name = (fName ? fName.value.trim() : '') || (currentLang === 'en' ? 'Client' : 'Клиент');
    const contact = fContact ? fContact.value.trim() : '';
    const dir = fDir ? fDir.value : 'Архитектурное проектирование';
    const type = fType ? fType.value : 'Загородный дом';
    const msg = fMsg ? fMsg.value.trim() : '';

    let text = `Здравствуйте! Меня зовут ${name}. Хочу обсудить проект.\nНаправление: ${dir}\nТип объекта: ${type}`;
    if (contact) text += `\nКонтактный телефон: ${contact}`;
    if (msg) text += `\nПожелания: ${msg}`;

    fWaDirect.href = `https://wa.me/77017864680?text=${encodeURIComponent(text)}`;
  }

  [fName, fContact, fDir, fType, fMsg].forEach(input => {
    if (input) {
      input.addEventListener('input', updateWaLink);
      input.addEventListener('change', updateWaLink);
    }
  });
  updateWaLink();

  if (fSend) {
    fSend.addEventListener('click', async () => {
      const name = fName ? fName.value.trim() : '';
      const contact = fContact ? fContact.value.trim() : '';

      if (!name || !contact) {
        const alertMsg = (currentLang === 'en')
          ? 'Please provide your name and phone / WhatsApp contact.'
          : (currentLang === 'kz' ? 'Аты-жөніңізді және байланыс телефоныңызды көрсетіңіз.' : 'Пожалуйста, укажите ваше имя и контактный телефон (или WhatsApp).');
        alert(alertMsg);
        if (!name && fName) fName.focus();
        else if (!contact && fContact) fContact.focus();
        return;
      }

      const dir = fDir ? fDir.value : '';
      const type = fType ? fType.value : '';
      const msg = fMsg ? fMsg.value.trim() : '';

      const originalText = fSend.textContent;
      fSend.textContent = (currentLang === 'en') ? 'Sending inquiry...' : (currentLang === 'kz' ? 'Өтінім жіберілуде...' : 'Отправка заявки в бюро...');
      fSend.disabled = true;

      const payload = {
        name: name,
        contact: contact,
        direction: dir,
        type: type,
        message: msg,
        _subject: `Новая заявка на проект: ${name} (${dir})`,
        _template: 'table'
      };

      try {
        const response = await fetch('https://formsubmit.co/ajax/laproject.kz@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          track('form_submit', { direction: dir, type: type });
          if (fOk) {
            fOk.style.display = 'block';
            fOk.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          if (fName) fName.value = '';
          if (fContact) fContact.value = '';
          if (fMsg) fMsg.value = '';
        } else {
          throw new Error('Network response not ok');
        }
      } catch (err) {
        const body = encodeURIComponent(
          `Имя: ${name}\nКонтакт: ${contact}\nНаправление: ${dir}\nТип объекта: ${type}\nСообщение: ${msg}`
        );
        window.location.href = `mailto:laproject.kz@gmail.com?subject=${encodeURIComponent('Заявка на проектирование — ' + name)}&body=${body}`;
        if (fOk) fOk.style.display = 'block';
      } finally {
        fSend.textContent = originalText;
        fSend.disabled = false;
      }
    });
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (href.includes('wa.me') || href.includes('whatsapp')) {
      track('whatsapp_click', { place: a.id || a.className || 'link' });
    } else if (href.startsWith('tel:')) {
      track('phone_click');
    } else if (href.startsWith('mailto:')) {
      track('email_click');
    }
  });

  /* ── 12. Переключение темы (Светлая / Тёмная) ──────────── */
  const themeToggle = $('#theme-toggle');
  const themeToggleM = $('#theme-toggle-m');

  function initTheme() {
    const saved = localStorage.getItem('la_theme');
    if (saved === 'light') {
      document.body.classList.add('theme-light');
    }
  }

  function toggleTheme() {
    const isLight = document.body.classList.toggle('theme-light');
    localStorage.setItem('la_theme', isLight ? 'light' : 'dark');
  }

  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
  if (themeToggleM) themeToggleM.addEventListener('click', toggleTheme);
  initTheme();

  // Инициализация языка при старте
  setLanguage(currentLang);
})();
