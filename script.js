// Netflix-Style Portfolio JavaScript

class PortfolioApp {
    constructor() {
        this.currentSection = 'introduction';
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupRevealAnimations();
        this.setupKeyboardNavigation();
        this.setupAccessibility();
        this.animateStatsCounters();
        
        // Show default section
        this.showSection('introduction');
        
        console.log('Netflix-Style Portfolio initialized successfully');
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetSection = e.currentTarget.getAttribute('data-target');
                this.showSection(targetSection);
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
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        const targetButton = document.querySelector(`[data-target="${sectionId}"]`);

        if (targetSection && targetButton) {
            targetSection.classList.add('active');
            targetButton.classList.add('active');
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
        }
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
        const elements = container.querySelectorAll('[data-reveal]');
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('revealed');
            }, index * 100);
        });
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
                if (target >= 1000) {
                    element.textContent = Math.floor(current).toLocaleString();
                } else {
                    element.textContent = Math.floor(current);
                }
            }, 20);
        };

        // Observe stats and animate when visible
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const statNumber = entry.target.querySelector('.stat-number');
                    const targetValue = parseInt(statNumber.textContent.replace(/[,+]/g, ''));
                    animateCounter(statNumber, targetValue);
                    statsObserver.unobserve(entry.target);
                }
            });
        });

        document.querySelectorAll('.stat-card').forEach(card => {
            statsObserver.observe(card);
        });
    }

    // Utility methods for dynamic content updates
    updateSectionContent(sectionId, content) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.innerHTML = content;
            this.revealElements(section);
        }
    }

    addProject(projectData) {
        const projectsGrid = document.querySelector('.projects-grid');
        if (projectsGrid) {
            const projectCard = this.createProjectCard(projectData);
            projectsGrid.appendChild(projectCard);
            this.observer.observe(projectCard);
        }
    }

    createProjectCard(data) {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.setAttribute('data-reveal', '');
        
        card.innerHTML = `
            <div class="project-header">
                <h3>${data.title}</h3>
                <span class="project-status">${data.status || 'Completed'}</span>
            </div>
            <p>${data.description}</p>
            <div class="tech-stack">
                ${data.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
            </div>
        `;
        
        return card;
    }

    // Smooth scrolling for internal links
    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Performance monitoring
    logPerformance() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.timing;
                    const loadTime = perfData.loadEventEnd - perfData.navigationStart;
                    console.log(`Page load time: ${loadTime}ms`);
                }, 0);
            });
        }
    }

    // Theme management (for future dark/light mode toggle)
    toggleTheme() {
        document.body.classList.toggle('light-theme');
        const theme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
        localStorage.setItem('portfolio-theme', theme);
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('portfolio-theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
        }
    }
}

// Enhanced error handling
window.addEventListener('error', (e) => {
    console.error('Portfolio Error:', e.error);
});

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.portfolioApp = new PortfolioApp();
    } catch (error) {
        console.error('Failed to initialize portfolio:', error);
        
        // Fallback: Basic navigation without animations
        document.querySelectorAll('.nav-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetSection = e.currentTarget.getAttribute('data-target');
                
                document.querySelectorAll('.content-section').forEach(section => {
                    section.style.display = 'none';
                });
                
                document.querySelectorAll('.nav-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                const target = document.getElementById(targetSection);
                if (target) {
                    target.style.display = 'block';
                    e.currentTarget.classList.add('active');
                }
            });
        });
        
        // Show introduction section by default
        const introSection = document.getElementById('introduction');
        const introButton = document.querySelector('[data-target="introduction"]');
        if (introSection && introButton) {
            introSection.style.display = 'block';
            introButton.classList.add('active');
        }
    }
});

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioApp;
}
