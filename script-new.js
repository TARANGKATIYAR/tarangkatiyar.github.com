// Netflix-Style Sidebar Portfolio JavaScript

class NetflixPortfolio {
    constructor() {
        this.currentSection = 'home';
        this.init();
    }

    init() {
        this.setupSidebarNavigation();
        this.setupRevealAnimations();
        this.setupKeyboardNavigation();
        this.setupAccessibility();
        this.animateStatsCounters();
    this.autoTagRevealElements();
    this.initMusicPlayer();
    this.initNavCollapse();
    this.initMobileMenu();
    this.initProjectFilters();
    this.initExpandableProjects();
    this.initProjectTimelineObserver();
        
        // Show default section
        this.showSection('introduction');
        
        console.log('Netflix-Style Sidebar Portfolio initialized');
    }

    setupSidebarNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(button => {
            // Insert ripple container
            if (!button.querySelector('.ripple')) {
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                button.appendChild(ripple);
            }
            button.addEventListener('click', (e) => {
                const targetSection = e.currentTarget.getAttribute('data-target');
                this.showSection(targetSection);
                this.createRipple(e, button);
            });
        });
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active state from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(button => {
            button.classList.remove('active');
            button.setAttribute('aria-selected', 'false');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        const targetButton = document.querySelector(`[data-target="${sectionId}"]`);

        if (targetSection && targetButton) {
            targetSection.classList.add('active');
            targetButton.classList.add('active');
            targetButton.setAttribute('aria-selected', 'true');
            this.currentSection = sectionId;

            // Update page title
            const sectionTitle = targetButton.querySelector('.nav-text').textContent;
            document.title = `Tarang Katiyar - ${sectionTitle}`;

            // Announce section change for screen readers
            this.announcePageChange(sectionTitle);

            // Re-trigger reveal animations for the new section
            setTimeout(() => {
                this.revealElements(targetSection);
            }, 100);

            // Always scroll viewport to the very top after navigation
            this.scrollToTop();
        }
    }

    scrollToTop() {
        // Use smooth scroll when supported
        try {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (_) {
            // Fallback for older browsers
            window.scrollTo(0, 0);
        }
        // Also reset potential scrolling containers if later added
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            contentArea.scrollTop = 0;
        }
    }

    /* ================= Music Player ================= */
    initMusicPlayer() {
        this.mp = {
            root: document.getElementById('music-player'),
            audio: document.getElementById('mpAudio'),
            playBtn: document.getElementById('mpPlayBtn'),
            prevBtn: document.getElementById('mpPrevBtn'),
            nextBtn: document.getElementById('mpNextBtn'),
            progressWrap: document.querySelector('.mp-progress'),
            progressBar: document.getElementById('mpProgressBar'),
            volume: document.getElementById('mpVolume'),
            title: document.getElementById('mpTrackTitle'),
            status: document.getElementById('mpStatus'),
            toggle: document.getElementById('mpCollapseBtn'),
            // close button removed
            select: document.getElementById('mpTrackSelect')
        };
        if (!this.mp.root) return; // Safety

        // Define playlist (ensure these files exist in root)
        this.mp.playlist = [
            { src: 'td.mp3', title: 'Tokyo Drift Mix' },
            { src: 'f1.mp3', title: 'F1 Theme' },
            { src: 'y2mate--Tokyo-Drift-Six-Days-4K.mp3', title: 'Six Days' }
        ];
        this.mp.index = 0;

        // Populate track selector
        if (this.mp.select) {
            this.mp.playlist.forEach((t,i)=>{
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = t.title || this.extractTrackName(t.src);
                this.mp.select.appendChild(opt);
            });
            this.mp.select.addEventListener('change', ()=>{
                this.loadTrack(parseInt(this.mp.select.value,10), true);
            });
        }
        this.loadTrack(0, false);

        // Play / Pause
        this.mp.playBtn.addEventListener('click', () => {
            if (this.mp.audio.paused) {
                this.mp.audio.play().then(()=>{
                    this.updatePlayUI(true);
                }).catch(err=>{
                    console.warn('Play blocked:', err);
                });
            } else {
                this.mp.audio.pause();
                this.updatePlayUI(false);
            }
        });

        // Update progress
        this.mp.audio.addEventListener('timeupdate', () => this.syncProgress());
        this.mp.audio.addEventListener('loadedmetadata', () => this.syncProgress());
        this.mp.audio.addEventListener('ended', () => {
            if (!this.nextTrack(true)) {
                this.updatePlayUI(false);
                this.mp.status.textContent = 'Finished';
            }
        });
        // Extra listeners to ensure reactive state stays in sync
        this.mp.audio.addEventListener('play', () => this.setMusicReactive(true));
        this.mp.audio.addEventListener('pause', () => {
            if (!this.mp.audio.ended) this.setMusicReactive(false);
        });

        // Seek
        this.mp.progressWrap.addEventListener('click', (e) => {
            const rect = this.mp.progressWrap.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            if (this.mp.audio.duration) {
                this.mp.audio.currentTime = pct * this.mp.audio.duration;
                this.syncProgress();
            }
        });

        // Keyboard seek (left/right on progress focus)
        this.mp.progressWrap.addEventListener('keydown', (e) => {
            if (!this.mp.audio.duration) return;
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const delta = e.key === 'ArrowRight' ? 5 : -5;
                this.mp.audio.currentTime = Math.min(Math.max(0, this.mp.audio.currentTime + delta), this.mp.audio.duration);
                this.syncProgress();
            }
        });

    // Volume
        this.mp.volume.addEventListener('input', () => {
            this.mp.audio.volume = parseFloat(this.mp.volume.value);
        });

    // Prev / Next
    this.mp.prevBtn.addEventListener('click', ()=> this.prevTrack());
    this.mp.nextBtn.addEventListener('click', ()=> this.nextTrack(true));

        // Collapse / expand
        this.mp.toggle.addEventListener('click', () => {
            this.mp.root.classList.toggle('collapsed');
            this.mp.toggle.setAttribute('aria-expanded', !this.mp.root.classList.contains('collapsed'));
        });

    // Close control removed per request

        // Initial status
        this.mp.status.textContent = 'Idle';
    }

    loadTrack(i, autoplay) {
        if (i < 0 || i >= this.mp.playlist.length) return false;
        this.mp.index = i;
        const track = this.mp.playlist[i];
        this.mp.audio.src = track.src;
        this.mp.title.textContent = track.title || this.extractTrackName(track.src);
        if (this.mp.select && this.mp.select.value !== String(i)) this.mp.select.value = String(i);
        this.mp.status.textContent = 'Loaded';
        this.updatePlayUI(false);
        if (autoplay) {
            this.mp.audio.play().then(()=> this.updatePlayUI(true)).catch(()=>{});
        }
        return true;
    }

    nextTrack(autoplay) {
        const next = this.mp.index + 1;
        if (next < this.mp.playlist.length) {
            return this.loadTrack(next, autoplay);
        }
        return false;
    }

    prevTrack() {
        const prev = this.mp.index - 1;
        if (prev >= 0) this.loadTrack(prev, true);
    }

    /* ============ Mobile Menu ============ */
    initMobileMenu() {
        const menuBtn = document.getElementById('mobileMenuBtn');
        const menuOverlay = document.getElementById('mobileMenuOverlay');
        const closeBtn = document.getElementById('mobileMenuClose');
        const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');

        console.log('Initializing mobile menu...', {
            menuBtn: !!menuBtn,
            menuOverlay: !!menuOverlay,
            closeBtn: !!closeBtn,
            navBtns: mobileNavBtns.length
        });

        if (!menuBtn || !menuOverlay) {
            console.error('Mobile menu elements not found');
            return;
        }

        // Open mobile menu
        menuBtn.addEventListener('click', () => {
            console.log('Menu button clicked');
            menuBtn.classList.add('active');
            menuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        // Close mobile menu
        const closeMobileMenu = () => {
            console.log('Closing mobile menu');
            menuBtn.classList.remove('active');
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', closeMobileMenu);
        } else {
            console.warn('Close button not found');
        }

        // Close on overlay click (outside menu content)
        menuOverlay.addEventListener('click', (e) => {
            if (e.target === menuOverlay) {
                closeMobileMenu();
            }
        });

        // Mobile navigation
        mobileNavBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-target');
                
                // Update active state for mobile nav
                mobileNavBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update active state for desktop nav
                const desktopNavBtns = document.querySelectorAll('.nav-btn');
                desktopNavBtns.forEach(b => b.classList.remove('active'));
                const desktopBtn = document.querySelector(`.nav-btn[data-target="${target}"]`);
                if (desktopBtn) desktopBtn.classList.add('active');

                // Show section and close mobile menu
                this.showSection(target);
                closeMobileMenu();
            });
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menuOverlay.classList.contains('active')) {
                closeMobileMenu();
            }
        });
    }

    extractTrackName(filePath) {
        try {
            const base = filePath.split('/').pop();
            return base.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        } catch { return 'Track'; }
    }

    updatePlayUI(playing) {
        this.mp.playBtn.textContent = playing ? '⏸' : '▶';
        this.mp.playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
        this.mp.status.textContent = playing ? 'Playing' : 'Paused';
    this.setMusicReactive(playing);
    }

    syncProgress() {
        if (!this.mp.audio.duration) {
            this.mp.progressBar.style.width = '0%';
            this.mp.progressWrap.setAttribute('aria-valuenow', '0');
            return;
        }
        const pct = (this.mp.audio.currentTime / this.mp.audio.duration) * 100;
        this.mp.progressBar.style.width = pct + '%';
        this.mp.progressWrap.setAttribute('aria-valuenow', pct.toFixed(0));
    }

    /* ============ Navbar Collapse ============ */
    initNavCollapse() {
        const toggle = document.getElementById('navCollapseToggle');
        const sidebar = document.querySelector('.sidebar');
        if (!toggle || !sidebar) return;
        toggle.addEventListener('click', () => {
            const collapsed = sidebar.classList.toggle('collapsed');
            toggle.setAttribute('aria-expanded', (!collapsed).toString());
            toggle.textContent = collapsed ? '☰' : '⫶';
        });

        // Keyboard shortcut Ctrl + B to toggle collapse
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'b')) {
                e.preventDefault();
                toggle.click();
            }
        });
    }

    createRipple(evt, btn) {
        try {
            const rippleWrap = btn.querySelector('.ripple');
            if (!rippleWrap) return;
            const span = document.createElement('span');
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 1.2;
            span.style.width = span.style.height = size + 'px';
            span.style.left = (evt.clientX - rect.left - size / 2) + 'px';
            span.style.top = (evt.clientY - rect.top - size / 2) + 'px';
            rippleWrap.appendChild(span);
            setTimeout(() => span.remove(), 650);
        } catch (e) { /* ignore */ }
    }

    setupRevealAnimations() {
        // Create intersection observer for reveal animations
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe all elements with data-reveal attribute
        document.querySelectorAll('[data-reveal]').forEach(element => {
            this.observer.observe(element);
        });
    }

    revealElements(container) {
        const elements = container.querySelectorAll('[data-reveal], .metric-item, .focus-area, .initiative-item, .experience-item, .project-item');
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    autoTagRevealElements() {
        const selectors = [
            '.experience-item',
            '.project-item',
            '.award-item',
            '.certification-item',
            '.volunteer-item',
            '.attribute-item',
            '.skills-tags .skill-tag',
            '.section-header',
            '.page-header'
        ];
        const all = document.querySelectorAll(selectors.join(','));
        // Cap total stagger so late elements don't feel "slow" and keep UX snappy
        all.forEach((el, i) => {
            el.setAttribute('data-auto-reveal', '');
            const cappedIndex = i > 18 ? 18 : i; // max delay bucket
            const delay = cappedIndex * 25; // 0–450ms total
            el.style.setProperty('--reveal-delay', delay + 'ms');
        });

        // Tag index for skill tag pop sequence
        document.querySelectorAll('.skills-tags .skill-tag').forEach((tag, idx) => {
            tag.style.setProperty('--i', idx + 1);
        });

        // Add tilt effect to interactive cards
        const tiltTargets = document.querySelectorAll('.experience-card, .project-card, .award-item, .certification-item, .volunteer-item');
        tiltTargets.forEach(card => {
            card.classList.add('tilt-active');
            card.addEventListener('pointermove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                const rotateX = (0.5 - y) * 10; // max 10deg
                const rotateY = (x - 0.5) * 12;
                card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
            });
            card.addEventListener('pointerleave', () => {
                card.style.transform = '';
            });
        });

        // Intersection observer for new system
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    el.classList.add('revealed');
                    // After animation completes, drop expensive hints
                    setTimeout(() => {
                        el.style.removeProperty('will-change');
                    }, 1200);
                    io.unobserve(el);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

        all.forEach(el => io.observe(el));
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Navigate with arrow keys
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateWithKeyboard(e.key === 'ArrowUp' ? 'up' : 'down');
            }
            
            // Navigate with number keys (1-6)
            const numKey = parseInt(e.key);
            if (numKey >= 1 && numKey <= 6) {
                const sections = ['introduction', 'experience', 'awards', 'volunteering', 'certifications', 'projects'];
                if (sections[numKey - 1]) {
                    this.showSection(sections[numKey - 1]);
                }
            }
        });
    }

    navigateWithKeyboard(direction) {
        const sections = ['introduction', 'experience', 'awards', 'volunteering', 'certifications', 'projects'];
        const currentIndex = sections.indexOf(this.currentSection);
        
        let nextIndex;
        if (direction === 'up') {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : sections.length - 1;
        } else {
            nextIndex = currentIndex < sections.length - 1 ? currentIndex + 1 : 0;
        }
        
        this.showSection(sections[nextIndex]);
    }

    setupAccessibility() {
        // Add aria-live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.style.position = 'absolute';
        liveRegion.style.left = '-10000px';
        liveRegion.style.width = '1px';
        liveRegion.style.height = '1px';
        liveRegion.style.overflow = 'hidden';
        document.body.appendChild(liveRegion);
        this.liveRegion = liveRegion;

        // Add focus management
        document.querySelectorAll('.nav-btn').forEach(button => {
            button.addEventListener('focus', () => {
                button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        });
    }

    announcePageChange(sectionTitle) {
        if (this.liveRegion) {
            this.liveRegion.textContent = `Now viewing ${sectionTitle} section`;
        }
    }

    animateStatsCounters() {
        const animateCounter = (element, target) => {
            let current = 0;
            const increment = target / 100;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                
                // Format numbers appropriately
                const suffix = element.textContent.includes('+') ? '+' : '';
                if (target >= 1000) {
                    element.textContent = Math.floor(current).toLocaleString() + suffix;
                } else {
                    element.textContent = Math.floor(current) + suffix;
                }
            }, 20);
        };

        // Observe stats and animate when visible
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const statNumber = entry.target.querySelector('.metric-number');
                    const targetValue = parseInt(statNumber.textContent.replace(/[,+]/g, ''));
                    animateCounter(statNumber, targetValue);
                    statsObserver.unobserve(entry.target);
                }
            });
        });

        document.querySelectorAll('.metric-item').forEach(card => {
            statsObserver.observe(card);
        });
    }

    /* ================= Music Reactive Mode ================= */
    setMusicReactive(active) {
        if (active) {
            document.documentElement.classList.add('music-reactive');
            this.mp.root.classList.add('playing');
            // If CSS not yet injected (first play), inject dynamic CSS for wild animations
            if (!document.getElementById('musicReactiveStyles')) {
                const style = document.createElement('style');
                style.id = 'musicReactiveStyles';
                style.textContent = this.buildMusicReactiveCSS();
                document.head.appendChild(style);
            }
            this.startVisualizer();
        } else {
            document.documentElement.classList.remove('music-reactive');
            this.mp.root.classList.remove('playing');
            this.stopVisualizer();
        }
    }

    buildMusicReactiveCSS() {
        return `/* Music Reactive Crazy Animations */\n` + `
        .music-reactive body { --reactive-scale:1; }
        .music-reactive .content-area::before { animation-duration: 8s; filter: saturate(1.4) brightness(1.15); }
        .music-reactive .nav-btn.active { animation-duration:3s; }
        .music-reactive .experience-card, .music-reactive .project-card, .music-reactive .award-item, .music-reactive .certification-item, .music-reactive .volunteer-item { animation: reactiveShake 2.8s cubic-bezier(.36,.07,.19,.97) infinite; }
        .music-reactive .hero-title { animation: reactiveGlow 4s linear infinite; }
        .music-reactive .skills-tags .skill-tag { animation: reactiveHue 6s linear infinite; }
        .music-reactive .experience-timeline-dot::after, .music-reactive .project-timeline-dot::after { animation-duration: 2.2s; }
        .music-reactive .music-player.playing .mp-toggle { animation: reactivePulse 2.6s ease-in-out infinite; }
        .music-reactive .page-header .page-title::after { animation: reactiveUnderline 3s linear infinite; }
        .music-reactive .sidebar::before { animation-duration: 2.4s; }
        .music-reactive .page-title, .music-reactive .hero-title { filter: drop-shadow(0 0 12px rgba(229,9,20,.65)); }
        .music-reactive .ripple span { animation-duration:.35s; }
        /* Keyframes */
        @keyframes reactiveShake { 0%,100% { transform: translateZ(0) rotate(0deg);} 10% { transform: translate(2px,-2px) rotate(.8deg);} 20% { transform: translate(-3px,2px) rotate(-1deg);} 30% { transform: translate(3px,1px) rotate(.6deg);} 40% { transform: translate(-2px,-3px) rotate(-.8deg);} 50% { transform: translate(2px,2px) rotate(.4deg);} 60% { transform: translate(-1px,3px) rotate(-.6deg);} 70% { transform: translate(3px,-1px) rotate(.5deg);} 80% { transform: translate(-3px,2px) rotate(-.4deg);} 90% { transform: translate(2px,-2px) rotate(.3deg);} }
        @keyframes reactiveGlow { 0%,100% { text-shadow:0 0 14px rgba(var(--accent-rgb)/.5),0 0 30px rgba(var(--accent-rgb)/.35);} 50% { text-shadow:0 0 30px rgba(var(--accent-rgb)/.95),0 0 60px rgba(var(--accent-rgb)/.55);} }
        @keyframes reactiveHue { 0% { filter:hue-rotate(0deg) brightness(1);} 50% { filter:hue-rotate(140deg) brightness(1.3);} 100% { filter:hue-rotate(360deg) brightness(1);} }
        @keyframes reactivePulse { 0%,100% { box-shadow:0 0 0 2px rgba(var(--accent-rgb)/.6),0 0 14px -2px rgba(var(--accent-rgb)/.8);} 50% { box-shadow:0 0 0 4px rgba(var(--accent-rgb)/.8),0 0 26px -2px rgba(var(--accent-rgb)/.95);} }
        @keyframes reactiveUnderline { 0% { width:0;} 50% { width:100%;} 50.01% { left:auto; right:0;} 100% { width:0; } }
        `;
    }


    /* =============== Project Filters ================= */
    initProjectFilters() {
        const wrap = document.getElementById('projectFilters');
        if (!wrap) return;
        const cards = Array.from(document.querySelectorAll('.projects-timeline .project-item'));
        // Derive tags from skill tags inside project cards
        const tagSet = new Set();
        cards.forEach(item => {
            item.querySelectorAll('.skills-tags .skill-tag').forEach(t => tagSet.add(t.textContent.trim()));
        });
        const tags = Array.from(tagSet).slice(0, 12); // cap
        // Add special filters
        const filterDefs = ['All', 'AI', 'IoT', 'Full-Stack', 'Django', ...tags];
        const unique = [...new Set(filterDefs)];
        unique.forEach(name => {
            const btn = document.createElement('button');
            btn.textContent = name;
            if (name === 'All') btn.classList.add('active');
            btn.addEventListener('click', () => {
                wrap.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const term = name;
                cards.forEach(card => {
                    if (term === 'All') { card.style.display = ''; return; }
                    const text = card.textContent.toLowerCase();
                    card.style.display = text.includes(term.toLowerCase()) ? '' : 'none';
                });
            });
            wrap.appendChild(btn);
        });
    }

    /* =============== Expandable Project Cards ================= */
    initExpandableProjects() {
        // Disable expand/collapse; ensure all project descriptions fully visible
        document.querySelectorAll('.project-card').forEach(card => {
            card.classList.remove('collapsed');
        });
    }

    /* =============== Audio Visualizer ================= */
    startVisualizer() {
        if (!this.mp || !this.mp.audio) return;
        const container = document.getElementById('mpVisualizer');
        if (!container) return;
        if (!this._vizBars) {
            this._vizBars = [];
            for (let i=0;i<18;i++) { const s=document.createElement('span'); s.style.setProperty('--i', i); container.appendChild(s); this._vizBars.push(s); }
        }
        try {
            if (!this._audioCtx) {
                const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
                this._audioCtx = new Ctx();
                this._source = this._audioCtx.createMediaElementSource(this.mp.audio);
                this._analyser = this._audioCtx.createAnalyser();
                this._analyser.fftSize = 64;
                this._source.connect(this._analyser);
                this._analyser.connect(this._audioCtx.destination);
                this._data = new Uint8Array(this._analyser.frequencyBinCount);
            }
            if (this._audioCtx.state === 'suspended') this._audioCtx.resume();
        } catch(e) { return; }
        if (this._vizRAF) cancelAnimationFrame(this._vizRAF);
        const render = () => {
            if (!this._analyser) return;
            this._analyser.getByteFrequencyData(this._data);
            const slice = Math.min(this._vizBars.length, this._data.length);
            for (let i=0;i<slice;i++) {
                const v = this._data[i] / 255; // 0..1
                const h = Math.max(4, v * 22);
                const bar = this._vizBars[i];
                bar.style.height = h + 'px';
                bar.style.opacity = (0.35 + v * 0.65).toFixed(2);
            }
            this._vizRAF = requestAnimationFrame(render);
        };
        render();
    }

    stopVisualizer() {
        if (this._vizRAF) cancelAnimationFrame(this._vizRAF);
    }

    /* =============== Project Timeline Observer ================= */
    initProjectTimelineObserver() {
        const items = document.querySelectorAll('.projects-timeline .project-item');
        if (!items.length) return;
        const obs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3, rootMargin: '0px 0px -10% 0px' });
        items.forEach(i => obs.observe(i));
    }
}

// Enhanced error handling
window.addEventListener('error', (e) => {
    console.error('Portfolio Error:', e.error);
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.portfolio = new NetflixPortfolio();
        
        // Add initial reveal animations
        const allAnimatedElements = document.querySelectorAll('.metric-item, .focus-area, .initiative-item, .experience-item, .project-item');
        allAnimatedElements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        });
        
    } catch (error) {
        console.error('Failed to initialize portfolio:', error);
        
        // Fallback: Basic navigation without animations
        document.querySelectorAll('.nav-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetSection = e.currentTarget.getAttribute('data-target');
                
                document.querySelectorAll('.content-section').forEach(section => {
                    section.classList.remove('active');
                });
                
                document.querySelectorAll('.nav-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                const target = document.getElementById(targetSection);
                if (target) {
                    target.classList.add('active');
                    e.currentTarget.classList.add('active');
                    if (window.portfolio && typeof window.portfolio.scrollToTop === 'function') {
                        window.portfolio.scrollToTop();
                    } else {
                        window.scrollTo(0,0);
                    }
                }
            });
        });
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetflixPortfolio;
}
