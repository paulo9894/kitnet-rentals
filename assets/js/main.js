/* Jijoca Residencial — interações do site */
(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ---------- Header, botão flutuante e barra fixa ---------- */
    const header = document.querySelector('.site-header');
    const fab = document.querySelector('.wa-fab');
    const heroArt = document.querySelector('.hero-art');
    const parallaxItems = document.querySelectorAll('[data-parallax]');
    let ticking = false;

    const onScroll = () => {
        const y = window.scrollY;
        header?.classList.toggle('is-scrolled', y > 24);
        fab?.classList.toggle('is-visible', y > 420);

        if (!reduceMotion) {
            if (heroArt && y < window.innerHeight * 1.5) {
                heroArt.style.setProperty('--parallax', (y * 0.22).toFixed(1) + 'px');
            }
            parallaxItems.forEach(el => {
                const rect = el.getBoundingClientRect();
                const progress = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
                const clamped = Math.max(-1, Math.min(1, progress));
                el.style.setProperty('--shift', (clamped * -36).toFixed(1) + 'px');
            });
        }
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(onScroll);
        }
    }, { passive: true });
    onScroll();

    /* ---------- Menu mobile ---------- */
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.getElementById('mobile-menu');
    const backdrop = document.querySelector('.menu-backdrop');

    const setMenu = open => {
        if (!toggle || !menu) return;
        root.classList.toggle('menu-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        menu.inert = !open;
    };

    if (toggle && menu) {
        menu.inert = true;
        toggle.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
        menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
        backdrop?.addEventListener('click', () => setMenu(false));
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && root.classList.contains('menu-open')) {
                setMenu(false);
                toggle.focus();
            }
        });
        window.addEventListener('resize', () => { if (window.innerWidth > 960) setMenu(false); });
    }

    /* ---------- Animações ao rolar ---------- */
    const revealItems = document.querySelectorAll('[data-reveal]');
    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealItems.forEach(el => el.classList.add('is-visible'));
    } else {
        const revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        revealItems.forEach(el => revealObserver.observe(el));
    }

    /* ---------- Link ativo no menu ---------- */
    const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
    const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    if (sections.length && 'IntersectionObserver' in window) {
        const spy = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id));
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        sections.forEach(s => spy.observe(s));
    }

    /* ---------- Botões magnéticos (seguem o cursor) ---------- */
    if (finePointer && !reduceMotion) {
        document.querySelectorAll('[data-magnetic]').forEach(el => {
            const area = el.closest('[data-magnetic-area]') || el;
            const strength = parseFloat(el.dataset.magnetic) || 0.3;
            const limit = 14;
            let frame = 0;

            area.addEventListener('pointermove', e => {
                cancelAnimationFrame(frame);
                frame = requestAnimationFrame(() => {
                    const rect = el.getBoundingClientRect();
                    const clamp = v => Math.max(-limit, Math.min(limit, v));
                    const x = clamp((e.clientX - (rect.left + rect.width / 2)) * strength);
                    const y = clamp((e.clientY - (rect.top + rect.height / 2)) * strength);
                    el.style.setProperty('--mx', x.toFixed(1) + 'px');
                    el.style.setProperty('--my', y.toFixed(1) + 'px');
                });
            });

            area.addEventListener('pointerleave', () => {
                cancelAnimationFrame(frame);
                el.style.setProperty('--mx', '0px');
                el.style.setProperty('--my', '0px');
            });
        });
    }

    /* ---------- Efeito de onda ao clicar ---------- */
    if (!reduceMotion) {
        document.addEventListener('pointerdown', e => {
            const btn = e.target.closest('.btn');
            if (!btn) return;
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 2.2;
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            btn.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    }

    /* ---------- Galeria de fotos ---------- */
    document.querySelectorAll('[data-gallery]').forEach(gallery => {
        const track = gallery.querySelector('.gallery-track');
        const slides = [...track.children];
        const counter = gallery.querySelector('.gallery-counter');
        const thumbs = [...document.querySelectorAll(`[data-gallery-thumbs="${gallery.id}"] button`)];
        let index = 0;

        const go = i => {
            index = (i + slides.length) % slides.length;
            track.style.transform = `translateX(${-index * 100}%)`;
            slides.forEach((slide, k) => slide.setAttribute('aria-hidden', String(k !== index)));
            thumbs.forEach((thumb, k) => {
                thumb.classList.toggle('is-active', k === index);
                thumb.setAttribute('aria-current', String(k === index));
            });
            if (counter) counter.textContent = `${index + 1} / ${slides.length}`;
        };

        gallery.querySelector('.gallery-arrow.prev')?.addEventListener('click', () => go(index - 1));
        gallery.querySelector('.gallery-arrow.next')?.addEventListener('click', () => go(index + 1));
        thumbs.forEach((thumb, k) => thumb.addEventListener('click', () => go(k)));
        gallery.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft') go(index - 1);
            if (e.key === 'ArrowRight') go(index + 1);
        });

        // Arrastar / deslizar com o dedo
        let startX = 0, deltaX = 0, dragging = false;
        track.addEventListener('pointerdown', e => {
            if (e.button !== 0) return;
            dragging = true;
            startX = e.clientX;
            deltaX = 0;
            track.classList.add('is-dragging');
            track.setPointerCapture(e.pointerId);
        });
        track.addEventListener('pointermove', e => {
            if (!dragging) return;
            deltaX = e.clientX - startX;
            track.style.transform = `translateX(calc(${-index * 100}% + ${deltaX}px))`;
        });
        const endDrag = () => {
            if (!dragging) return;
            dragging = false;
            track.classList.remove('is-dragging');
            if (Math.abs(deltaX) > 50) go(index + (deltaX < 0 ? 1 : -1));
            else go(index);
        };
        track.addEventListener('pointerup', endDrag);
        track.addEventListener('pointercancel', endDrag);

        go(0);
    });

    /* ---------- Barra fixa de contato (mobile) ---------- */
    const mobileBar = document.querySelector('.mobile-bar');
    const bookingCard = document.querySelector('.booking-card');
    const galleryEl = document.querySelector('.gallery');
    if (mobileBar && bookingCard && 'IntersectionObserver' in window) {
        let bookingVisible = false;
        const update = () => {
            const pastGallery = galleryEl ? galleryEl.getBoundingClientRect().top < 0 : window.scrollY > 300;
            mobileBar.classList.toggle('is-visible', pastGallery && !bookingVisible);
        };
        new IntersectionObserver(([entry]) => {
            bookingVisible = entry.isIntersecting;
            update();
        }).observe(bookingCard);
        window.addEventListener('scroll', update, { passive: true });
        update();
    }
})();
