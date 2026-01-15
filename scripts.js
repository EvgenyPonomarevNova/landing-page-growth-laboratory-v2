(() => {
  // ===== INITIAL SETUP & UTILITIES =====
  document.documentElement.classList.add("has-js");
  
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const off = (el, ev, fn) => el && el.removeEventListener(ev, fn);
  
  // Performance detection
  const isSlowDevice = () => {
    if ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency < 4) return true;
    if ('deviceMemory' in navigator && navigator.deviceMemory < 4) return true;
    return false;
  };
  
  const isLowPerformance = isSlowDevice() || 
    window.matchMedia("(max-width: 768px)").matches;
  
  const reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  
  const isMobile = window.matchMedia &&
    window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  
  const supportsPassive = (() => {
    let supports = false;
    try {
      const opts = Object.defineProperty({}, 'passive', {
        get: () => { supports = true; }
      });
      window.addEventListener('test', null, opts);
      window.removeEventListener('test', null, opts);
    } catch (e) {}
    return supports;
  })();
  
  // ===== DEBOUNCE & THROTTLE =====
  const debounce = (fn, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  };
  
  const throttle = (fn, limit) => {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };
  
  // ===== PRELOADER (MOBILE OPTIMIZED) =====
  const initPreloader = () => {
    const preloader = document.getElementById("site-preloader");
    const preloadBar = preloader ? preloader.querySelector(".spl-bar-fill") : null;
    
    if (!preloader) {
      document.documentElement.classList.remove("is-loading");
      return;
    }
    
    const MIN_TIME = isLowPerformance ? 800 : (reduceMotion ? 500 : 1500);
    const MAX_TIME = isLowPerformance ? 4000 : 4500;
    
    let minTimeElapsed = false;
    let readyToShow = false;
    let preloaderEnded = false;
    
    const endPreloader = () => {
      if (preloaderEnded) return;
      preloaderEnded = true;
      
      if (preloadBar) {
        preloadBar.style.transform = "scaleX(1)";
        preloadBar.style.animation = "none";
      }
      
      const transitionTime = isLowPerformance ? 300 : 550;
      
      setTimeout(() => {
        preloader.classList.add("is-done");
        document.documentElement.classList.remove("is-loading");
        
        setTimeout(() => {
          try {
            preloader.remove();
          } catch (e) {
            preloader.parentNode?.removeChild(preloader);
          }
        }, transitionTime);
      }, 80);
    };
    
    const checkPreloader = () => {
      if (!preloaderEnded && minTimeElapsed && readyToShow) {
        endPreloader();
      }
    };
    
    setTimeout(() => {
      minTimeElapsed = true;
      checkPreloader();
    }, MIN_TIME);
    
    const waitCriticalResources = async () => {
      const promises = [];
      
      if (isLowPerformance) {
        promises.push(new Promise(res => {
          if (document.readyState === 'complete') res();
          else window.addEventListener('load', res, { once: true });
        }));
      } else {
        promises.push(new Promise(res => 
          window.addEventListener('load', res, { once: true })
        ));
      }
      
      if (document.fonts && !isLowPerformance) {
        promises.push(document.fonts.ready.catch(() => {}));
      }
      
      const criticalImages = $$('img[data-preload="1"]');
      if (criticalImages.length && !isLowPerformance) {
        const imgPromises = criticalImages.map(img => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise(resolve => {
            const imgLoad = () => {
              off(img, 'load', imgLoad);
              off(img, 'error', imgLoad);
              resolve();
            };
            on(img, 'load', imgLoad);
            on(img, 'error', imgLoad);
          });
        });
        promises.push(Promise.all(imgPromises));
      }
      
      try {
        await Promise.race([
          Promise.all(promises),
          new Promise(res => setTimeout(res, 2000))
        ]);
      } catch (e) {}
      
      readyToShow = true;
      checkPreloader();
    };
    
    waitCriticalResources();
    
    setTimeout(endPreloader, MAX_TIME);
  };
  
  initPreloader();
  
  // ===== THEME SYSTEM =====
  const initTheme = () => {
    const STORAGE_KEY = "growth-lab-theme";
    
    const getCurrentTheme = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return saved;
      
      if (window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches 
          ? "dark" : "light";
      }
      return "light";
    };
    
    const applyTheme = (theme) => {
      const isDark = theme === "dark";
      
      document.documentElement.classList.toggle("dark-theme", isDark);
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
      
      localStorage.setItem(STORAGE_KEY, theme);
      
      $$(".theme-toggle").forEach(btn => {
        const sun = btn.querySelector(".theme-icon.sun");
        const moon = btn.querySelector(".theme-icon.moon");
        if (sun && moon) {
          sun.style.display = isDark ? "none" : "block";
          moon.style.display = isDark ? "block" : "none";
        }
      });
    };
    
    const toggleTheme = () => {
      const current = getCurrentTheme();
      const newTheme = current === "light" ? "dark" : "light";
      applyTheme(newTheme);
      return newTheme;
    };
    
    applyTheme(getCurrentTheme());
    
    on($("#themeToggle"), "click", () => toggleTheme());
    on($("#themeToggleMobile"), "click", () => toggleTheme());
  };
  
  initTheme();
  
  // ===== SMOOTH SCROLL =====
  if (!isLowPerformance) {
    document.documentElement.style.scrollBehavior = "smooth";
  }
  
  // Current year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  
  // ===== SCROLL PROGRESS =====
  const initScrollProgress = () => {
    const progress = $("#progress");
    const hdr = $("#hdr");
    
    if (!progress && !hdr) return;
    
    const updateProgress = throttle(() => {
      const h = document.documentElement;
      const scrollTop = h.scrollTop || document.body.scrollTop;
      const scrollHeight = h.scrollHeight - h.clientHeight || 1;
      const p = Math.max(0, Math.min(1, scrollTop / scrollHeight));
      
      if (progress) {
        progress.style.width = (p * 100).toFixed(2) + "%";
      }
      
      if (hdr) {
        hdr.classList.toggle("scrolled", scrollTop > 16);
      }
    }, isLowPerformance ? 100 : 16);
    
    on(window, "scroll", updateProgress, supportsPassive ? { passive: true } : false);
    updateProgress();
  };
  
  initScrollProgress();
  
  // ===== MOBILE MENU =====
  const initMobileMenu = () => {
    const burgerBtn = $("#burgerBtn");
    const mobileMenu = $("#mobileMenu");
    
    if (!burgerBtn || !mobileMenu) return;
    
    let isMenuOpen = false;
    
    const setMenu = (open) => {
      isMenuOpen = open;
      burgerBtn.setAttribute("aria-expanded", String(open));
      mobileMenu.hidden = !open;
      document.body.style.overflow = open ? "hidden" : "";
      
      if (open) {
        mobileMenu.classList.add("is-open");
      } else {
        mobileMenu.classList.remove("is-open");
      }
    };
    
    on(burgerBtn, "click", (e) => {
      e.stopPropagation();
      setMenu(!isMenuOpen);
    });
    
    $$(".mLink").forEach(link => {
      on(link, "click", () => {
        if (isMenuOpen) setMenu(false);
      });
    });
    
    on(document, "click", (e) => {
      if (isMenuOpen && 
          !mobileMenu.contains(e.target) && 
          !burgerBtn.contains(e.target)) {
        setMenu(false);
      }
    });
    
    on(document, "keydown", (e) => {
      if (e.key === "Escape" && isMenuOpen) {
        setMenu(false);
      }
    });
  };
  
  initMobileMenu();
  
  // ===== MODALS =====
  const initModals = () => {
    let activeModal = null;
    
    const openModal = (id) => {
      const modal = document.getElementById(id);
      if (!modal || activeModal === modal) return;
      
      if (activeModal) closeModal(activeModal);
      
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      activeModal = modal;
      
      const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable) focusable.focus();
    };
    
    const closeModal = (modal) => {
      if (!modal) return;
      
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
      activeModal = null;
    };
    
    on($("#openBrief"), "click", () => openModal("briefModal"));
    on($("#heroCta"), "click", () => openModal("briefModal"));
    on($("#openBriefMobile"), "click", () => openModal("briefModal"));
    on($("#openCallback"), "click", () => openModal("callbackModal"));
    
    $$(".modal").forEach(modal => {
      on(modal, "click", (e) => {
        if (e.target === modal) closeModal(modal);
      });
      
      $$(".x", modal).forEach(btn => {
        on(btn, "click", () => closeModal(modal));
      });
    });
    
    on(document, "keydown", (e) => {
      if (e.key === "Escape" && activeModal) {
        closeModal(activeModal);
      }
    });
    
    const initForms = () => {
      const fakeSubmit = (form) => {
        if (!form) return;
        
        on(form, "submit", async (e) => {
          e.preventDefault();
          
          const requiredInputs = form.querySelectorAll("[required]");
          let isValid = true;
          
          requiredInputs.forEach(input => {
            if (!input.value.trim()) {
              input.classList.add("error");
              isValid = false;
            } else {
              input.classList.remove("error");
            }
          });
          
          if (!isValid) {
            alert("Пожалуйста, заполните все обязательные поля (отмечены *)");
            return;
          }
          
          const btn = form.querySelector('button[type="submit"]');
          if (!btn) return;
          
          const originalText = btn.textContent;
          const originalHTML = btn.innerHTML;
          
          btn.innerHTML = '<span class="loading-spinner"></span> Отправка...';
          btn.disabled = true;
          
          await new Promise(res => setTimeout(res, isLowPerformance ? 800 : 1200));
          
          btn.textContent = "✓ Заявка принята";
          btn.disabled = true;
          
          setTimeout(() => {
            closeModal(form.closest(".modal"));
            setTimeout(() => {
              btn.innerHTML = originalHTML;
              btn.disabled = false;
              form.reset();
            }, 300);
          }, 1000);
        });
      };
      
      fakeSubmit($("#briefForm"));
      fakeSubmit($("#callbackForm"));
    };
    
    initForms();
  };
  
  initModals();
  
  // ===== COPY EMAIL =====
  on($("#copyEmail"), "click", async () => {
    const email = ($("#emailVal")?.textContent || "").trim();
    if (!email || !navigator.clipboard) return;
    
    try {
      await navigator.clipboard.writeText(email);
      const btn = $("#copyEmail");
      const original = btn.innerHTML;
      
      btn.innerHTML = '<span class="check-icon">✓</span> Скопировано';
      btn.disabled = true;
      
      setTimeout(() => {
        btn.innerHTML = original;
        btn.disabled = false;
      }, 1500);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = email;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      
      const btn = $("#copyEmail");
      const original = btn.textContent;
      btn.textContent = "Скопировано!";
      setTimeout(() => btn.textContent = original, 1500);
    }
  });
  
  // ===== REVEAL ON SCROLL =====
  const initReveal = () => {
    const revealEls = $$(".reveal");
    if (!revealEls.length) return;
    
    if ("IntersectionObserver" in window) {
      const threshold = isLowPerformance ? 0.05 : 0.12;
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
            if (isLowPerformance) {
              observer.unobserve(entry.target);
            }
          }
        });
      }, {
        threshold,
        rootMargin: isLowPerformance ? "50px" : "100px"
      });
      
      revealEls.forEach(el => observer.observe(el));
    } else {
      revealEls.forEach(el => el.classList.add("show"));
    }
  };
  
  setTimeout(initReveal, isLowPerformance ? 500 : 100);
  
  // ===== BLOB PARALLAX =====
  const initBlobParallax = () => {
    const blobs = $$(".blob");
    if (!blobs.length) return;
    
    const canParallax = !reduceMotion && 
      !isMobile && 
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !isLowPerformance;
    
    if (!canParallax) {
      blobs.forEach(b => b.style.transform = "none");
      return;
    }
    
    let mx = 0, my = 0, tx = 0, ty = 0;
    let frameId = null;
    
    const tick = () => {
      tx += (mx - tx) * 0.08;
      ty += (my - ty) * 0.08;
      
      blobs.forEach((b, i) => {
        const k = (i + 1) * 0.015;
        b.style.transform = `translate3d(${(tx - innerWidth / 2) * k}px, ${
          (ty - innerHeight / 2) * k
        }px, 0)`;
      });
      
      frameId = requestAnimationFrame(tick);
    };
    
    const handleMove = throttle((e) => {
      mx = e.clientX;
      my = e.clientY;
    }, 16);
    
    on(window, "pointermove", handleMove, supportsPassive ? { passive: true } : false);
    
    tick();
    
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      off(window, "pointermove", handleMove);
    };
  };
  
  if (!isMobile) {
    setTimeout(initBlobParallax, 1000);
  }
  
  // ===== MAGNETIC BUTTONS =====
  const initMagneticButtons = () => {
    const magnets = $$(".magnetic");
    if (!magnets.length || isMobile || reduceMotion || isLowPerformance) return;
    
    magnets.forEach((el) => {
      let rect = null;
      
      on(el, "pointerenter", () => {
        rect = el.getBoundingClientRect();
      });
      
      on(el, "pointerleave", () => {
        el.style.transform = "";
        rect = null;
      });
      
      on(el, "pointermove", throttle((e) => {
        if (!rect) return;
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        const damp = el.classList.contains("primary") ? 0.12 : 0.1;
        el.style.transform = `translate(${x * damp}px, ${y * damp}px)`;
      }, 16));
    });
  };
  
  initMagneticButtons();
  
  // ===== CASES SLIDER =====
  const initCasesSlider = () => {
    const track = $("#casesTrack");
    const prevBtn = $("#casesPrev");
    const nextBtn = $("#casesNext");
    const prog = $("#casesProg");
    
    if (!track) return;
    
    let autoScrollInterval = null;
    let isScrolling = false;
    let startX = 0;
    let scrollLeft = 0;
    
    const scrollByCard = (dir) => {
      if (isScrolling) return;
      
      const card = track.querySelector(".case");
      const cardWidth = card ? card.getBoundingClientRect().width : 340;
      const gap = 14;
      
      track.scrollBy({
        left: dir * (cardWidth + gap),
        behavior: reduceMotion || isLowPerformance ? "auto" : "smooth"
      });
      
      isScrolling = true;
      setTimeout(() => isScrolling = false, 300);
    };
    
    if (prevBtn) on(prevBtn, "click", () => scrollByCard(-1));
    if (nextBtn) on(nextBtn, "click", () => scrollByCard(1));
    
    const updateProgress = throttle(() => {
      if (!prog) return;
      const max = track.scrollWidth - track.clientWidth;
      const p = max <= 0 ? 1 : Math.max(0, Math.min(1, track.scrollLeft / max));
      prog.style.width = (p * 100).toFixed(1) + "%";
    }, 50);
    
    on(track, "scroll", updateProgress, supportsPassive ? { passive: true } : false);
    updateProgress();
    
    const handleTouchStart = (e) => {
      startX = e.touches[0].pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    };
    
    const handleTouchMove = (e) => {
      if (!startX) return;
      e.preventDefault();
      const x = e.touches[0].pageX - track.offsetLeft;
      const walk = (x - startX) * 2;
      track.scrollLeft = scrollLeft - walk;
    };
    
    on(track, "touchstart", handleTouchStart, supportsPassive ? { passive: true } : false);
    on(track, "touchmove", handleTouchMove, supportsPassive ? { passive: false } : false);
    on(track, "touchend", () => { startX = 0; });
    
    const startAutoScroll = () => {
      if (reduceMotion || isMobile || isLowPerformance || autoScrollInterval) return;
      
      autoScrollInterval = setInterval(() => {
        const maxScroll = track.scrollWidth - track.clientWidth;
        if (track.scrollLeft >= maxScroll - 10) {
          track.scrollTo({ left: 0, behavior: "smooth" });
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
    
    if (!isMobile) {
      startAutoScroll();
      
      on(track, "mouseenter", stopAutoScroll);
      on(track, "mouseleave", startAutoScroll);
      on(track, "touchstart", stopAutoScroll);
      on(track, "touchend", () => setTimeout(startAutoScroll, 3000));
    }
  };
  
  initCasesSlider();
  
  // ===== EXPANDABLE SECTIONS =====
  const initExpandables = () => {
    $$(".benefit.expandable").forEach(benefit => {
      const header = benefit.querySelector(".benefit-header");
      const details = benefit.querySelector(".benefit-details");
      const icon = benefit.querySelector(".expand-icon");
      
      if (!header || !details) return;
      
      const toggle = () => {
        const isExpanded = benefit.classList.toggle("expanded");
        
        if (isExpanded) {
          details.style.maxHeight = details.scrollHeight + "px";
          if (icon) icon.textContent = "−";
        } else {
          details.style.maxHeight = "0";
          if (icon) icon.textContent = "+";
        }
      };
      
      if (isMobile) {
        on(header, "click", toggle);
      } else {
        let timeout;
        on(header, "mouseenter", () => {
          clearTimeout(timeout);
          if (!benefit.classList.contains("expanded")) {
            benefit.classList.add("expanded");
            details.style.maxHeight = details.scrollHeight + "px";
            if (icon) icon.textContent = "−";
          }
        });
        
        on(header, "mouseleave", () => {
          timeout = setTimeout(() => {
            benefit.classList.remove("expanded");
            details.style.maxHeight = "0";
            if (icon) icon.textContent = "+";
          }, 300);
        });
      }
    });
    
    $$(".svc .more").forEach(more => {
      on(more, "click", (e) => {
        e.preventDefault();
        const svc = more.closest(".svc");
        const details = svc.querySelector(".svc-details");
        
        if (details) {
          details.style.maxHeight = "0";
          setTimeout(() => details.remove(), 300);
          more.textContent = "Подробнее →";
        } else {
          const detailsText = more.getAttribute("data-details");
          if (detailsText) {
            const detailsDiv = document.createElement("div");
            detailsDiv.className = "svc-details";
            detailsDiv.innerHTML = `<p>${detailsText}</p>`;
            more.parentNode.insertBefore(detailsDiv, more.nextSibling);
            more.textContent = "Скрыть";
            
            setTimeout(() => {
              detailsDiv.style.maxHeight = detailsDiv.scrollHeight + "px";
            }, 10);
          }
        }
      });
    });
  };
  
  initExpandables();
  
  // ===== INTERACTIVE GROWTH CHART (OPTIMIZED FOR MOBILE) =====
  const initGrowthChart = () => {
    const chart = document.getElementById("chart");
    const grid = document.getElementById("grid");
    const line = document.getElementById("line");
    const area = document.getElementById("area");
    const ptsGroup = document.getElementById("points");
    const tooltip = document.getElementById("tooltip");
    const ttTitle = document.getElementById("ttTitle");
    const ttText = document.getElementById("ttText");
    const wrap = document.getElementById("chartWrap");
    const stage = document.getElementById("chartStage");
    const kpiNum = document.getElementById("kpiNum");
    const kpiLabel = document.getElementById("kpiLabel");
    const crossV = document.getElementById("crossV");
    const glowDot = document.getElementById("glowDot");
    
    if (!chart || !grid || !line || !area || !ptsGroup || !tooltip || 
        !ttTitle || !ttText || !wrap || !kpiNum || !kpiLabel || 
        !stage || !crossV || !glowDot) {
      return;
    }
    
    // Mobile optimizations
    const shouldSimplify = isLowPerformance || reduceMotion;
    if (isMobile) {
      chart.style.touchAction = "pan-y";
      stage.style.cursor = "default";
    }
    
    const vb = chart.viewBox.baseVal;
    const W = vb.width || 720;
    const H = vb.height || 260;
    
    const pad = { l: 18, r: 16, t: 18, b: 30 };
    const innerW = W - pad.l - pad.r;
    const innerH = H - pad.t - pad.b;
    
    const labels = ["Мес 1", "Мес 2", "Мес 3", "Мес 4", "Мес 5", "Мес 6"];
    
    const series = {
      revenue: { name: "Выручка", unit: "%", data: [12, 28, 45, 62, 76, 92] },
      leads: { name: "Лиды", unit: "%", data: [10, 18, 34, 49, 63, 78] },
      roi: { name: "ROI", unit: "%", data: [8, 16, 31, 44, 58, 71] },
    };
    let activeKey = "revenue";
    
    const maxY = 100, minY = 0;
    const xAt = (i) => pad.l + innerW * (i / (labels.length - 1));
    const yAt = (v) => pad.t + innerH * (1 - (v - minY) / (maxY - minY));
    
    const makePath = (vals) =>
      vals
        .map(
          (v, i) => `${i ? "L" : "M"} ${xAt(i).toFixed(2)} ${yAt(v).toFixed(2)}`
        )
        .join(" ");
    
    const makeArea = (vals) => {
      const d = makePath(vals);
      const xEnd = xAt(labels.length - 1);
      const x0 = xAt(0);
      const y0 = pad.t + innerH;
      return `${d} L ${xEnd.toFixed(2)} ${y0.toFixed(2)} L ${x0.toFixed(2)} ${y0.toFixed(2)} Z`;
    };
    
    // Simplified grid rendering for mobile
    const renderGrid = () => {
      if (shouldSimplify) {
        grid.innerHTML = '';
        return;
      }
      
      grid.innerHTML = "";
      const lines = isMobile ? 3 : 4;
      
      for (let i = 0; i <= lines; i++) {
        const y = pad.t + innerH * (i / lines);
        const el = document.createElementNS("http://www.w3.org/2000/svg", "line");
        el.setAttribute("x1", pad.l);
        el.setAttribute("x2", pad.l + innerW);
        el.setAttribute("y1", y);
        el.setAttribute("y2", y);
        el.setAttribute("stroke", "rgba(255,255,255,.08)");
        el.setAttribute("stroke-width", "1");
        grid.appendChild(el);
      }
    };
    
    const animatePath = () => {
      if (shouldSimplify) {
        line.style.transition = "none";
        area.style.transition = "none";
        return;
      }
      
      const len = line.getTotalLength ? line.getTotalLength() : 0;
      if (!len) return;
      
      line.style.strokeDasharray = String(len);
      line.style.strokeDashoffset = String(len);
      line.getBoundingClientRect();
      
      // Faster animations on mobile
      const duration = isMobile ? 600 : 900;
      line.style.transition = `stroke-dashoffset ${duration}ms cubic-bezier(.2,.8,.2,1)`;
      line.style.strokeDashoffset = "0";
      
      area.style.opacity = "0";
      const areaDelay = isMobile ? 80 : 120;
      area.style.transition = `opacity ${duration - 200}ms cubic-bezier(.2,.8,.2,1) ${areaDelay}ms`;
      
      requestAnimationFrame(() => {
        area.style.opacity = "0.95";
      });
    };
    
    const setKPI = (idx) => {
      const vals = series[activeKey].data;
      const next = vals[idx];
      const label = `${series[activeKey].name} • ${labels[idx]}`;
      kpiLabel.textContent = label;
      
      if (shouldSimplify) {
        kpiNum.textContent = `+${next}${series[activeKey].unit}`;
        return;
      }
      
      const from = parseInt((kpiNum.textContent || "0").replace(/[^\d]/g, ""), 10) || 0;
      const to = next;
      const start = performance.now();
      const dur = isMobile ? 300 : 420;
      
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
      
      line.setAttribute("d", makePath(vals));
      area.setAttribute("d", makeArea(vals));
      
      // Fewer/simpler points on mobile
      ptsGroup.innerHTML = "";
      vals.forEach((v, i) => {
        const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.classList.add("pt");
        c.setAttribute("cx", xAt(i));
        c.setAttribute("cy", yAt(v));
        c.setAttribute("r", isMobile ? 4 : 4.8);
        c.dataset.idx = String(i);
        ptsGroup.appendChild(c);
      });
      
      crossV.setAttribute("y1", String(pad.t));
      crossV.setAttribute("y2", String(pad.t + innerH));
      
      setIdx(vals.length - 1, true);
      animatePath();
    };
    
    const showTooltip = (idx, clientX, clientY) => {
      if (shouldSimplify || isMobile) return;
      
      const vals = series[activeKey].data;
      ttTitle.textContent = labels[idx];
      ttText.textContent = `${series[activeKey].name}: +${vals[idx]}${series[activeKey].unit}`;
      
      const rect = stage.getBoundingClientRect();
      const x = Math.min(rect.width - 12, Math.max(12, clientX - rect.left));
      const y = Math.max(14, clientY - rect.top);
      tooltip.style.left = x + "px";
      tooltip.style.top = y + "px";
      tooltip.classList.add("show");
    };
    
    const hideTooltip = () => {
      if (tooltip) tooltip.classList.remove("show");
    };
    
    const nearestIdxByClientX = (clientX) => {
      const rect = stage.getBoundingClientRect();
      const x = clientX - rect.left;
      const u = Math.max(0, Math.min(1, x / rect.width));
      const i = Math.round(u * (labels.length - 1));
      return Math.max(0, Math.min(labels.length - 1, i));
    };
    
    const setIdx = (idx, silent = false) => {
      const vals = series[activeKey].data;
      const cx = xAt(idx);
      const cy = yAt(vals[idx]);
      
      crossV.setAttribute("x1", String(cx));
      crossV.setAttribute("x2", String(cx));
      glowDot.setAttribute("cx", String(cx));
      glowDot.setAttribute("cy", String(cy));
      
      if (!shouldSimplify) {
        glowDot.style.opacity = "1";
      }
      
      if (!silent) setKPI(idx);
    };
    
    // Optimized pointer tracking for mobile
    let active = false;
    let moveTimeout = null;
    
    const onMove = (e) => {
      if (shouldSimplify && isMobile) return;
      
      active = true;
      const idx = nearestIdxByClientX(e.clientX);
      
      // Throttle updates on mobile
      if (isMobile && moveTimeout) return;
      
      setIdx(idx);
      showTooltip(idx, e.clientX, e.clientY);
      
      if (isMobile) {
        moveTimeout = setTimeout(() => {
          moveTimeout = null;
        }, 50);
      }
    };
    
    const onEnter = (e) => {
      if (shouldSimplify) return;
      if (!reduceMotion) glowDot.style.opacity = "1";
      onMove(e);
    };
    
    const onLeave = () => {
      active = false;
      hideTooltip();
      
      const vals = series[activeKey].data;
      setIdx(vals.length - 1, true);
      setKPI(vals.length - 1);
      
      if (!shouldSimplify) {
        glowDot.style.opacity = "0.6";
      }
    };
    
    // Use appropriate events for device type
    if (isMobile) {
      on(stage, "touchstart", (e) => {
        if (e.touches.length === 1) {
          onMove(e.touches[0]);
        }
      });
      
      on(stage, "touchmove", throttle((e) => {
        if (e.touches.length === 1) {
          e.preventDefault();
          onMove(e.touches[0]);
        }
      }, 100));
      
      on(stage, "touchend", onLeave);
    } else {
      on(stage, "pointermove", throttle(onMove, isLowPerformance ? 100 : 16));
      on(stage, "pointerenter", onEnter);
      on(stage, "pointerleave", onLeave);
    }
    
    // Legend switching
    $$(".legend .tag", wrap).forEach((tag) => {
      on(tag, "click", () => {
        const key = tag.getAttribute("data-series");
        if (!key || !series[key] || key === activeKey) return;
        
        activeKey = key;
        $$(".legend .tag", wrap).forEach((t) =>
          t.classList.toggle("active", t === tag)
        );
        
        render();
      });
    });
    
    // Idle animation (disabled on mobile/low performance)
    let idleT = 0;
    let idleFrame = null;
    
    const startIdleAnimation = () => {
      if (shouldSimplify || isMobile) return;
      
      const idle = (t) => {
        if (!active) {
          const vals = series[activeKey].data;
          const w = labels.length - 1;
          const s = (Math.sin(t / 900) * 0.5 + 0.5) * w;
          const idx = Math.round(s);
          if (idx !== idleT) {
            idleT = idx;
            setIdx(idx, true);
          }
          glowDot.style.opacity = "0.7";
        }
        idleFrame = requestAnimationFrame(idle);
      };
      
      idleFrame = requestAnimationFrame(idle);
    };
    
    const stopIdleAnimation = () => {
      if (idleFrame) {
        cancelAnimationFrame(idleFrame);
        idleFrame = null;
      }
    };
    
    // Initialize
    const firstTag = $('.legend .tag[data-series="revenue"]', wrap);
    if (firstTag) firstTag.classList.add("active");
    
    render();
    
    if (!shouldSimplify) {
      startIdleAnimation();
    }
    
    // Cleanup on resize
    on(window, "resize", () => {
      hideTooltip();
      if (!shouldSimplify) {
        render();
      }
    });
    
    // Cleanup function
    return () => {
      stopIdleAnimation();
      hideTooltip();
      
      if (isMobile) {
        off(stage, "touchstart", onMove);
        off(stage, "touchmove", onMove);
        off(stage, "touchend", onLeave);
      } else {
        off(stage, "pointermove", onMove);
        off(stage, "pointerenter", onEnter);
        off(stage, "pointerleave", onLeave);
      }
    };
  };
  
  // Initialize chart with delay for better mobile performance
  setTimeout(() => {
    const chartCleanup = initGrowthChart();
    
    // Cleanup on page hide
    on(window, "pagehide", () => {
      if (chartCleanup) chartCleanup();
    });
  }, isLowPerformance ? 1500 : 800);
  
  // ===== INFINITE MARQUEE =====
  const initMarquee = () => {
    const marqueeTrack = $(".marquee-track");
    if (!marqueeTrack) return;
    
    const items = $$(".logo-pill", marqueeTrack);
    if (items.length === 0) return;
    
    if (!isLowPerformance) {
      items.forEach(item => {
        const clone = item.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        marqueeTrack.appendChild(clone);
      });
    }
    
    const singleWidth = items[0]?.offsetWidth || 200;
    const gap = 10;
    const totalItems = items.length;
    const totalWidth = (singleWidth + gap) * totalItems;
    const duration = Math.max(30, totalWidth / (isLowPerformance ? 20 : 30));
    
    if (!reduceMotion) {
      marqueeTrack.style.animation = `marquee ${duration}s linear infinite`;
    }
    
    if (!isMobile) {
      on(marqueeTrack, "mouseenter", () => {
        marqueeTrack.style.animationPlayState = "paused";
      });
      
      on(marqueeTrack, "mouseleave", () => {
        marqueeTrack.style.animationPlayState = "running";
      });
    }
  };
  
  setTimeout(initMarquee, 1000);
  
  // ===== PERFORMANCE OPTIMIZATIONS =====
  on(window, "pagehide", () => {
    $$('.modal.open').forEach(modal => modal.classList.remove('open'));
    document.body.classList.remove('modal-open');
  });
  
  on(document, "visibilitychange", () => {
    if (document.hidden) {
      $$('.marquee-track').forEach(track => {
        track.style.animationPlayState = 'paused';
      });
    } else {
      $$('.marquee-track').forEach(track => {
        track.style.animationPlayState = 'running';
      });
    }
  });
  
  const handleResize = debounce(() => {
    initMarquee();
    
    const chart = $("#chart");
    if (chart) {
      chart.dispatchEvent(new CustomEvent('resize'));
    }
  }, 250);
  
  on(window, "resize", handleResize);
  
  // Mark content as loaded
  setTimeout(() => {
    document.documentElement.classList.add("content-loaded");
  }, 100);
  
  // Enhanced features for good devices
  if (!isLowPerformance) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        document.documentElement.classList.add("enhanced");
      }, 500);
    });
  }
})();