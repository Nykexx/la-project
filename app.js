/* LA Project — Studia 54 Aesthetic & Logic */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];

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
    // Если пользователь на мобильном / тач-устройстве
    window.addEventListener('touchstart', function onTouch() {
      isTouchDevice = true;
      document.documentElement.classList.remove('has-custom-cursor');
      cursorDot.style.display = 'none';
      cursorRing.style.display = 'none';
    }, { passive: true, once: true });

    // Отслеживание мыши
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

    // Плавный цикл анимации курсора
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

    // Реакция на наведение
    document.addEventListener('mouseover', e => {
      if (isTouchDevice) return;

      const card = e.target.closest('.card, .st-track');
      const interactive = e.target.closest('a, button, .hero-bullet, .hero-nav-btn, select, input, textarea, .lightbox-x, .svc-box, .adv-card, .theme-toggle');

      if (card) {
        isCardHovering = true;
        isHovering = false;
        document.body.classList.add('cursor-card-hover');
        document.body.classList.remove('cursor-hover');
        if (cursorLabel) cursorLabel.textContent = 'СМОТРЕТЬ';
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
  const SLIDES_DATA = [
    { img: 'img/hotel-lobby/00.jpg', tag: 'Лобби и ресторан отеля · Алматы' },
    { img: 'img/hotel-lobby/01.jpg', tag: 'Парадный атриум с колоннадой · Алматы' },
    { img: 'img/hotel-lobby/02.jpg', tag: 'Ресторан высокой кухни · Казахстан' },
    { img: 'img/hotel-lobby/03.jpg', tag: 'Лаундж-бар и винная зона · Алматы' },
    { img: 'img/hotel-lobby/04.jpg', tag: 'Приватные залы отеля · Алматы' },
    { img: 'img/hotel-lobby/06.jpg', tag: 'Панорамный атриум · Казахстан' }
  ];

  const heroSlides = $$('.hero-slide');
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
      heroCounter.innerHTML = `<span>0${currentSlide + 1}</span> / 0${SLIDES_DATA.length}`;
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

  // Сенсорные свайпы (Swipe) для слайдера на смартфонах
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
        if (diffX < 0) setSlide(currentSlide + 1); // свайп влево
        else setSlide(currentSlide - 1);           // свайп вправо
      }
    }, { passive: true });
  }

  setSlide(0);
  startSlideTimer();

  /* ── 3. Последовательная сетка (Подписи под фото) ───────── */
  const archGrid = $('#arch-grid');
  const intGrid = $('#int-grid');
  const archCount = $('#arch-count');
  const intCount = $('#int-count');

  function renderCard(o) {
    return `
      <article class="card" data-slug="${o.slug}">
        <div class="card-img">
          <img src="img/${o.slug}/${o.shots[0]}_t.jpg" alt="${o.title}" loading="lazy" />
          ${o.status === 'Реализован' ? '<span class="card-badge-top">Реализован</span>' : ''}
        </div>
        <div class="card-caption">
          <h3 class="card-title">${o.title}</h3>
          <div class="card-meta">
            <span class="card-tag">${o.tag}</span>
            <span>${o.place} · ${o.shots.length} фото</span>
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

    if (archCount) archCount.textContent = `${archList.length} ${plural(archList.length, 'объект', 'объекта', 'объектов')}`;
    if (intCount) intCount.textContent = `${intList.length} ${plural(intList.length, 'объект', 'объекта', 'объектов')}`;
  }

  function plural(n, a, b, c) {
    const m = n % 100, k = n % 10;
    if (m > 10 && m < 20) return c;
    if (k === 1) return a;
    if (k >= 2 && k <= 4) return b;
    return c;
  }

  renderAllProjects();

  /* ── 4. Полноэкранный Лайтбокс Проекта ───────────────────── */
  const lightbox = $('#lightbox');

  function openLightbox(slug) {
    if (typeof OBJECTS === 'undefined' || !lightbox) return;
    const o = OBJECTS.find(x => x.slug === slug);
    if (!o) return;

    $('#lb-dir').textContent = o.cat === 'arch' ? 'Архитектурный проект' : 'Дизайн интерьера';
    $('#lb-tag').textContent = o.tag;
    $('#lb-title').textContent = o.title;
    $('#lb-meta').textContent = `${o.place} · ${o.status} · ${o.shots.length} ${plural(o.shots.length, 'кадр', 'кадра', 'кадров')}`;
    $('#lb-desc').textContent = o.desc;
    $('#lb-specs').innerHTML = Object.entries(o.facts)
      .map(([k, v]) => `<div class="spec-cell"><b>${k}</b><span>${v}</span></div>`).join('');
    $('#lb-gallery').innerHTML = o.shots
      .map(s => `<img src="img/${o.slug}/${s}.jpg" alt="${o.title}" loading="lazy" />`).join('');

    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    lightbox.scrollTop = 0;
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.addEventListener('click', e => {
    const c = e.target.closest('.card');
    if (c && c.dataset.slug) openLightbox(c.dataset.slug);
  });

  const lbX = $('#lb-x');
  if (lbX) lbX.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', e => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  const lbCta = $('#lb-cta');
  if (lbCta) lbCta.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

  /* ── 5. Секция «Как рождается дом» ───────────────────────── */
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
      try {
        if (stVideo) { stVideo.currentTime = 0; stVideo.play(); }
      } catch (e) { }
      stageTimer = setTimeout(() => nextStage(), 16000);
    } else {
      try { if (stVideo) stVideo.pause(); } catch (e) { }
      stageTimer = setTimeout(() => nextStage(), s.hold);
    }
  }

  function nextStage() { showStage((curStage + 1) % STAGES.length); }

  // Интерактивные клики по табам этапов и прогресс-бару
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

  /* ── 6. Меню ─────────────────────────────────────────────── */
  const mmenu = $('#mmenu');
  const burger = $('#burger');
  if (burger && mmenu) {
    burger.addEventListener('click', () => {
      const isOpen = mmenu.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
    });
    $$('#mmenu a').forEach(a => a.addEventListener('click', () => {
      mmenu.classList.remove('open');
      burger.classList.remove('open');
    }));
  }

  /* ── 7. Скролл шапки ─────────────────────────────────────── */
  const nav = $('#nav');
  const totop = $('#totop');
  let lastScrollY = 0;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (nav) {
      nav.classList.toggle('scrolled', y > 50);
      nav.classList.toggle('hide', y > 400 && y > lastScrollY);
    }
    if (totop) {
      totop.classList.toggle('on', y > 600);
    }
    lastScrollY = y;
  }, { passive: true });

  if (totop) {
    totop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ── 8. Reveal блоков ────────────────────────────────────── */
  const revObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  $$('.reveal').forEach(el => revObserver.observe(el));

  /* ── 9. Реальная отправка формы заявки ────────────────────── */
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
    const name = (fName ? fName.value.trim() : '') || 'Клиент';
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
        alert('Пожалуйста, укажите ваше имя и контактный телефон (или WhatsApp).');
        if (!name && fName) fName.focus();
        else if (!contact && fContact) fContact.focus();
        return;
      }

      const dir = fDir ? fDir.value : '';
      const type = fType ? fType.value : '';
      const msg = fMsg ? fMsg.value.trim() : '';

      const originalText = fSend.textContent;
      fSend.textContent = 'Отправка заявки в бюро...';
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

  /* ── 10. Переключение темы (Светлая / Тёмная) ──────────── */
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
})();
