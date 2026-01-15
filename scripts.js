(() => {
  document.documentElement.classList.add('has-js');
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== Preloader (2s) =====
  const preloader = document.getElementById('site-preloader');
  const PRELOAD_MIN_MS = 2000;
  const preloadStart = (typeof window.__preloadStart === 'number') ? window.__preloadStart : performance.now();

  const endPreloader = () => {
    if (!preloader) {
      document.documentElement.classList.remove('is-loading');
      return;
    }
    preloader.classList.add('is-done');
    document.documentElement.classList.remove('is-loading');

    // remove node after fade
    window.setTimeout(() => {
      try { preloader.remove(); } catch (e) { preloader.parentNode && preloader.parentNode.removeChild(preloader); }
    }, 550);
  };

  // If the loader exists and user prefers reduced motion, show it instantly then fade out fast.
  if (preloader && reduceMotion) {
    // make the bar appear full (CSS sets it)
    window.addEventListener('load', () => {
      const elapsed = performance.now() - preloadStart;
      const wait = Math.max(0, 250 - elapsed);
      window.setTimeout(endPreloader, wait);
    }, { once: true });
  } else {
    window.addEventListener('load', () => {
      const elapsed = performance.now() - preloadStart;
      const wait = Math.max(0, PRELOAD_MIN_MS - elapsed);
      window.setTimeout(endPreloader, wait);
    }, { once: true });
  }


  // ===== МГНОВЕННОЕ ПЕРЕКЛЮЧЕНИЕ ТЕМЫ =====
  const STORAGE_KEY = 'growth-lab-theme';
  
  // Получить текущую тему
  const getCurrentTheme = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    // Если нет сохраненной темы, проверяем системную
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  };
  
  // Применить тему МГНОВЕННО
  const applyTheme = (theme) => {
    const isDark = theme === 'dark';
    
    // Мгновенное переключение через атрибут data-theme
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    
    localStorage.setItem(STORAGE_KEY, theme);
    
    // Обновить иконки на кнопках
    const themeBtns = $$('.theme-toggle');
    themeBtns.forEach(btn => {
      const sunIcon = btn.querySelector('.theme-icon.sun');
      const moonIcon = btn.querySelector('.theme-icon.moon');
      if (sunIcon && moonIcon) {
        sunIcon.style.display = isDark ? 'none' : 'block';
        moonIcon.style.display = isDark ? 'block' : 'none';
      }
    });
  };
  
  // Переключить тему
  const toggleTheme = () => {
    const current = getCurrentTheme();
    const newTheme = current === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    return newTheme;
  };
  
  // Инициализация темы при загрузке (сразу!)
  const initTheme = () => {
    const theme = getCurrentTheme();
    applyTheme(theme);
    
    // Обработчики для кнопок переключения темы
    const themeToggle = $('#themeToggle');
    const themeToggleMobile = $('#themeToggleMobile');
    
    if (themeToggle) {
      on(themeToggle, 'click', () => toggleTheme());
    }
    
    if (themeToggleMobile) {
      on(themeToggleMobile, 'click', () => toggleTheme());
    }
  };
  
  // Инициализируем тему СРАЗУ при загрузке
  initTheme();

  // ===== ОСТАЛЬНОЙ КОД БЕЗ ИЗМЕНЕНИЙ =====
  
  // Smooth scroll
  document.documentElement.style.scrollBehavior = 'smooth';

  // Year
  const y = $('#year');
  if (y) y.textContent = String(new Date().getFullYear());

  // Scroll progress + header tone
  const progress = $('#progress');
  const hdr = $('#hdr');
  const updateProgress = () => {
    const h = document.documentElement;
    const scrollTop = h.scrollTop || document.body.scrollTop;
    const scrollHeight = (h.scrollHeight - h.clientHeight) || 1;
    const p = Math.max(0, Math.min(1, scrollTop / scrollHeight));
    if (progress) progress.style.width = (p * 100).toFixed(2) + '%';
    if (hdr) hdr.classList.toggle('scrolled', scrollTop > 16);
  };
  on(window, 'scroll', updateProgress, { passive: true });
  updateProgress();

  // Mobile menu
  const burgerBtn = $('#burgerBtn');
  const mobileMenu = $('#mobileMenu');
  const setMenu = (open) => {
    if (!mobileMenu || !burgerBtn) return;
    burgerBtn.setAttribute('aria-expanded', String(open));
    mobileMenu.hidden = !open;
  };
  on(burgerBtn, 'click', () => setMenu(mobileMenu?.hidden));
  $$('.mLink').forEach(a => on(a, 'click', () => setMenu(false)));

  // Modals
  const openModal = (id) => {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    const focusEl = m.querySelector('input, textarea, button, select, a[href]');
    focusEl && focusEl.focus();
  };
  const closeModal = (m) => {
    if (!m) return;
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };

  on($('#openBrief'), 'click', () => openModal('briefModal'));
  on($('#heroCta'), 'click', () => openModal('briefModal'));
  on($('#openBriefMobile'), 'click', () => openModal('briefModal'));
  on($('#openCallback'), 'click', () => openModal('callbackModal'));

  $$('.modal').forEach(m => {
    on(m, 'click', (e) => { if (e.target === m) closeModal(m); });
    $$('.x', m).forEach(btn => on(btn, 'click', () => closeModal(m)));
  });

  on(document, 'keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = $('.modal.open');
    if (open) closeModal(open);
  });

  // Demo form submits with validation
  const fakeSubmit = (form) => {
    if (!form) return;
    on(form, 'submit', (e) => {
      e.preventDefault();
      
      // Basic validation
      const requiredInputs = form.querySelectorAll('input[required], select[required], textarea[required]');
      let isValid = true;
      
      requiredInputs.forEach(input => {
        if (!input.value.trim()) {
          input.style.borderColor = 'var(--a4)';
          isValid = false;
        } else {
          input.style.borderColor = '';
        }
      });
      
      if (!isValid) {
        alert('Пожалуйста, заполните все обязательные поля (отмечены *)');
        return;
      }
      
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        const prev = btn.textContent;
        btn.textContent = 'Заявка принята ✓';
        btn.disabled = true;
        setTimeout(() => { 
          btn.textContent = prev; 
          btn.disabled = false;
          closeModal(form.closest('.modal'));
        }, 1600);
      }
    });
  };
  fakeSubmit($('#briefForm'));
  fakeSubmit($('#callbackForm'));

  // Copy email
  on($('#copyEmail'), 'click', async () => {
    const email = ($('#emailVal')?.textContent || '').trim();
    if (!email) return;
    try{
      await navigator.clipboard.writeText(email);
      const btn = $('#copyEmail');
      const prev = btn.textContent;
      btn.textContent = 'Скопировано ✓';
      setTimeout(() => btn.textContent = prev, 1200);
    }catch(_){}
  });

  // Reveal on scroll
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) e.target.classList.add('show');
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('show'));
  }

  // Blob parallax (cursor glow removed)
  const blobs = $$('.blob');
  let mx = 0, my = 0, tx = 0, ty = 0;
  const tick = () => {
    tx += (mx - tx) * 0.08;
    ty += (my - ty) * 0.08;
    
    if (!reduceMotion) {
      blobs.forEach((b, i) => {
        const k = (i + 1) * 0.015;
        b.style.transform = `translate3d(${(tx - innerWidth/2) * k}px, ${(ty - innerHeight/2) * k}px, 0)`;
      });
    }
    requestAnimationFrame(tick);
  };
  on(window, 'pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
  requestAnimationFrame(tick);

  // Magnetic buttons (subtle)
  const magnets = $$('.magnetic');
  magnets.forEach((el) => {
    let rect = null;
    on(el, 'pointerenter', () => { rect = el.getBoundingClientRect(); });
    on(el, 'pointerleave', () => { el.style.transform = ''; rect = null; });
    on(el, 'pointermove', (e) => {
      if (reduceMotion || !rect) return;
      const x = e.clientX - (rect.left + rect.width/2);
      const y = e.clientY - (rect.top + rect.height/2);
      const damp = el.classList.contains('primary') ? 0.12 : 0.10;
      el.style.transform = `translate(${x*damp}px, ${y*damp}px)`;
    });
  });

  // ===== Cases slider controls =====
  const track = $('#casesTrack');
  const prog = $('#casesProg');
  let autoScrollInterval = null;
  
  const scrollByCard = (dir) => {
    if (!track) return;
    const card = track.querySelector('.case');
    const w = card ? card.getBoundingClientRect().width : 360;
    track.scrollBy({ left: dir * (w + 14), behavior: reduceMotion ? 'auto' : 'smooth' });
  };
  
  on($('#casesPrev'), 'click', () => scrollByCard(-1));
  on($('#casesNext'), 'click', () => scrollByCard(1));
  
  const updateCasesProg = () => {
    if (!track || !prog) return;
    const max = track.scrollWidth - track.clientWidth;
    const p = max <= 0 ? 1 : Math.max(0, Math.min(1, track.scrollLeft / max));
    prog.style.width = (p * 100).toFixed(1) + '%';
  };
  
  on(track, 'scroll', updateCasesProg, { passive: true });
  updateCasesProg();

  // Auto scroll cases
  const startAutoScroll = () => {
    if (reduceMotion || autoScrollInterval) return;
    autoScrollInterval = setInterval(() => {
      if (!track) return;
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (track.scrollLeft >= maxScroll - 10) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollByCard(1);
      }
    }, 4000);
  };
  
  const stopAutoScroll = () => {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  };
  
  // Start auto scroll
  startAutoScroll();
  
  // Pause on hover
  if (track) {
    on(track, 'mouseenter', stopAutoScroll);
    on(track, 'mouseleave', startAutoScroll);
    on(track, 'touchstart', stopAutoScroll);
    on(track, 'touchend', () => setTimeout(startAutoScroll, 3000));
  }

  // ===== Expandable benefits =====
  $$('.benefit.expandable').forEach(benefit => {
    const header = benefit.querySelector('.benefit-header');
    const details = benefit.querySelector('.benefit-details');
    const icon = benefit.querySelector('.expand-icon');
    
    if (header && details) {
      on(header, 'click', () => {
        const isExpanded = benefit.classList.toggle('expanded');
        details.style.maxHeight = isExpanded ? details.scrollHeight + 'px' : '0';
        if (icon) {
          icon.textContent = isExpanded ? '−' : '+';
        }
      });
    }
  });

  // ===== Expandable services =====
  $$('.svc .more').forEach(more => {
    on(more, 'click', (e) => {
      e.preventDefault();
      const svc = more.closest('.svc');
      const details = svc.querySelector('.svc-details');
      
      if (details) {
        // If details already exist, remove them
        details.remove();
        more.textContent = 'Подробнее →';
      } else {
        // Create and add details
        const detailsText = more.getAttribute('data-details');
        if (detailsText) {
          const detailsDiv = document.createElement('div');
          detailsDiv.className = 'svc-details';
          detailsDiv.innerHTML = `<p>${detailsText}</p>`;
          more.parentNode.insertBefore(detailsDiv, more.nextSibling);
          more.textContent = 'Скрыть';
          
          // Animate
          setTimeout(() => {
            detailsDiv.style.maxHeight = detailsDiv.scrollHeight + 'px';
          }, 10);
        }
      }
    });
  });

  // ===== Interactive Growth Chart (SVG) =====
  const chart = document.getElementById('chart');
  const grid = document.getElementById('grid');
  const line = document.getElementById('line');
  const area = document.getElementById('area');
  const ptsGroup = document.getElementById('points');
  const tooltip = document.getElementById('tooltip');
  const ttTitle = document.getElementById('ttTitle');
  const ttText = document.getElementById('ttText');
  const wrap = document.getElementById('chartWrap');
  const stage = document.getElementById('chartStage');
  const kpiNum = document.getElementById('kpiNum');
  const kpiLabel = document.getElementById('kpiLabel');
  const crossV = document.getElementById('crossV');
  const glowDot = document.getElementById('glowDot');

  if (chart && grid && line && area && ptsGroup && tooltip && ttTitle && ttText && wrap && kpiNum && kpiLabel && stage && crossV && glowDot) {
    const vb = chart.viewBox.baseVal;
    const W = vb.width || 720;
    const H = vb.height || 260;

    const pad = { l: 18, r: 16, t: 18, b: 30 };
    const innerW = W - pad.l - pad.r;
    const innerH = H - pad.t - pad.b;

    const labels = ['Мес 1','Мес 2','Мес 3','Мес 4','Мес 5','Мес 6'];

    const series = {
      revenue: { name: 'Выручка', unit: '%', data: [12, 28, 45, 62, 76, 92] },
      leads:   { name: 'Лиды', unit: '%', data: [10, 18, 34, 49, 63, 78] },
      roi:     { name: 'ROI', unit: '%', data: [8, 16, 31, 44, 58, 71] },
    };
    let activeKey = 'revenue';

    const maxY = 100, minY = 0;
    const xAt = (i) => pad.l + (innerW * (i / (labels.length - 1)));
    const yAt = (v) => pad.t + innerH * (1 - ((v - minY) / (maxY - minY)));

    const makePath = (vals) => vals.map((v, i) => `${i ? 'L' : 'M'} ${xAt(i).toFixed(2)} ${yAt(v).toFixed(2)}`).join(' ');
    const makeArea = (vals) => {
      const d = makePath(vals);
      const xEnd = xAt(labels.length - 1);
      const x0 = xAt(0);
      const y0 = pad.t + innerH;
      return `${d} L ${xEnd.toFixed(2)} ${y0.toFixed(2)} L ${x0.toFixed(2)} ${y0.toFixed(2)} Z`;
    };

    const renderGrid = () => {
      grid.innerHTML = '';
      const lines = 4;
      for (let i = 0; i <= lines; i++) {
        const y = pad.t + (innerH * (i / lines));
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        el.setAttribute('x1', pad.l);
        el.setAttribute('x2', pad.l + innerW);
        el.setAttribute('y1', y);
        el.setAttribute('y2', y);
        el.setAttribute('stroke', 'rgba(255,255,255,.08)');
        el.setAttribute('stroke-width', '1');
        grid.appendChild(el);
      }
    };

    const animatePath = () => {
      if (reduceMotion) return;
      const len = line.getTotalLength ? line.getTotalLength() : 0;
      if (!len) return;
      line.style.strokeDasharray = String(len);
      line.style.strokeDashoffset = String(len);
      line.getBoundingClientRect(); // force
      line.style.transition = 'stroke-dashoffset 900ms cubic-bezier(.2,.8,.2,1)';
      line.style.strokeDashoffset = '0';

      area.style.opacity = '0';
      area.style.transition = 'opacity 700ms cubic-bezier(.2,.8,.2,1) 120ms';
      requestAnimationFrame(() => { area.style.opacity = '0.95'; });
    };

    const setKPI = (idx) => {
      const vals = series[activeKey].data;
      const next = vals[idx];
      const label = `${series[activeKey].name} • ${labels[idx]}`;
      kpiLabel.textContent = label;

      if (reduceMotion) {
        kpiNum.textContent = `+${next}${series[activeKey].unit}`;
        return;
      }

      const from = parseInt((kpiNum.textContent || '0').replace(/[^\d]/g, ''), 10) || 0;
      const to = next;
      const start = performance.now();
      const dur = 420;

      const tick = (t) => {
        const p = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.round(from + (to - from) * eased);
        kpiNum.textContent = `+${val}${series[activeKey].unit}`;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const render = () => {
      renderGrid();
      const vals = series[activeKey].data;

      line.setAttribute('d', makePath(vals));
      area.setAttribute('d', makeArea(vals));

      ptsGroup.innerHTML = '';
      vals.forEach((v, i) => {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.classList.add('pt');
        c.setAttribute('cx', xAt(i));
        c.setAttribute('cy', yAt(v));
        c.setAttribute('r', 4.8);
        c.dataset.idx = String(i);
        ptsGroup.appendChild(c);
      });

      // init cursor line size
      crossV.setAttribute('y1', String(pad.t));
      crossV.setAttribute('y2', String(pad.t + innerH));

      setIdx(vals.length - 1, true);
      animatePath();
    };

    const showTooltip = (idx, clientX, clientY) => {
      const vals = series[activeKey].data;
      ttTitle.textContent = labels[idx];
      ttText.textContent = `${series[activeKey].name}: +${vals[idx]}${series[activeKey].unit}`;

      const rect = stage.getBoundingClientRect();
      const x = Math.min(rect.width - 12, Math.max(12, clientX - rect.left));
      const y = Math.max(14, clientY - rect.top);
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
      tooltip.classList.add('show');
    };
    const hideTooltip = () => tooltip.classList.remove('show');

    const nearestIdxByClientX = (clientX) => {
      const rect = stage.getBoundingClientRect();
      const x = (clientX - rect.left);
      const u = Math.max(0, Math.min(1, x / rect.width));
      const i = Math.round(u * (labels.length - 1));
      return Math.max(0, Math.min(labels.length - 1, i));
    };

    const setIdx = (idx, silent=false) => {
      const vals = series[activeKey].data;
      const cx = xAt(idx);
      const cy = yAt(vals[idx]);

      crossV.setAttribute('x1', String(cx));
      crossV.setAttribute('x2', String(cx));
      glowDot.setAttribute('cx', String(cx));
      glowDot.setAttribute('cy', String(cy));
      glowDot.style.opacity = '1';

      if (!silent) setKPI(idx);
    };

    // Pointer tracking across the whole stage (not only points)
    let active = false;
    const onMove = (e) => {
      active = true;
      const idx = nearestIdxByClientX(e.clientX);
      setIdx(idx);
      showTooltip(idx, e.clientX, e.clientY);
    };
    on(stage, 'pointermove', onMove);
    on(stage, 'pointerenter', (e) => { if (!reduceMotion) glowDot.style.opacity = '1'; onMove(e); });
    on(stage, 'pointerleave', () => {
      active = false;
      hideTooltip();
      setIdx(series[activeKey].data.length - 1, true);
      setKPI(series[activeKey].data.length - 1);
      if (!reduceMotion) glowDot.style.opacity = '0.6';
    });

    // Legend switching
    $$('.legend .tag', wrap).forEach(tag => {
      on(tag, 'click', () => {
        const key = tag.getAttribute('data-series');
        if (!key || !series[key] || key === activeKey) return;
        activeKey = key;
        $$('.legend .tag', wrap).forEach(t => t.classList.toggle('active', t === tag));
        render();
      });
    });

    // Idle "glow" movement (subtle)
    let idleT = 0;
    const idle = (t) => {
      if (!reduceMotion && !active) {
        const vals = series[activeKey].data;
        const w = labels.length - 1;
        const s = (Math.sin(t/900) * 0.5 + 0.5) * w;
        const idx = Math.round(s);
        if (idx !== idleT) {
          idleT = idx;
          setIdx(idx, true);
        }
        glowDot.style.opacity = '0.7';
      }
      requestAnimationFrame(idle);
    };

    // Initial state
    const firstTag = $('.legend .tag[data-series="revenue"]', wrap);
    if (firstTag) firstTag.classList.add('active');
    render();
    requestAnimationFrame(idle);

    on(window, 'resize', hideTooltip);
  }

  // ===== Infinite Marquee =====
  const initInfiniteMarquee = () => {
    const marqueeTrack = $('.marquee-track');
    if (!marqueeTrack) return;

    // Создаем копию всех элементов внутри track
    const items = $$('.logo-pill', marqueeTrack);
    if (items.length === 0) return;

    // Очищаем возможные предыдущие копии
    while (marqueeTrack.children.length > items.length) {
      marqueeTrack.lastChild.remove();
    }

    // Дублируем все элементы для бесшовной анимации
    items.forEach(item => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      marqueeTrack.appendChild(clone);
    });

    // Рассчитываем скорость анимации в зависимости от количества элементов
    const singleWidth = items[0]?.offsetWidth || 200;
    const gap = 10; // px, как в CSS
    const totalItems = items.length;
    const totalWidth = (singleWidth + gap) * totalItems;
    const duration = Math.max(20, totalWidth / 30); // Регулируем скорость (пикселей в секунду)

    // Применяем анимацию
    marqueeTrack.style.animation = `marquee ${duration}s linear infinite`;

    // Для reduced motion
    if (reduceMotion) {
      marqueeTrack.style.animation = 'none';
    }
  };

  // Инициализируем при загрузке
  initInfiniteMarquee();

  // Также при ресайзе (на случай изменения ширины)
  let resizeTimer;
  on(window, 'resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initInfiniteMarquee, 250);
  });
})();