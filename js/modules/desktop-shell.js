/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Apple Desktop Shell Controller (desktop-shell.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import { t, applyTranslations } from './i18n.js';
import { TAB_ICONS } from './tab-bar.js';
import { showActivityIndicator, hideActivityIndicator } from './activity-indicator.js';
import { getVisitorUuid, generateIdenticonSvg } from './identicon.js';
import { isMobileLayout, isDesktopLayout } from './device-detect.js';
import { resetPageLifecycle } from '../core/lifecycle.js';
import { resolveSiteUrl, getTabFromUrl, isDetailSubpage, SEARCH_INDEX } from '../core/routes.js';

export { resolveSiteUrl, getTabFromUrl };

/* Ensure stylesheet isolation between home and subpages */
export async function ensurePageStylesheets(isHome) {
    if (isMobileLayout()) return;

    const varHref = resolveSiteUrl('css/variables.css');
    let varLink = document.getElementById('sys-style-variables') || document.querySelector('link[href*="variables.css"]');
    if (!varLink) {
        varLink = document.createElement('link');
        varLink.id = 'sys-style-variables';
        varLink.rel = 'stylesheet';
        varLink.href = varHref;
        document.head.insertBefore(varLink, document.head.firstChild);
    } else {
        varLink.id = 'sys-style-variables';
        if (varLink.href !== varHref) varLink.href = varHref;
    }

    const baseHref = resolveSiteUrl('css/base.css');
    let baseLink = document.getElementById('sys-style-base') || document.querySelector('link[href*="base.css"]');
    if (!baseLink) {
        baseLink = document.createElement('link');
        baseLink.id = 'sys-style-base';
        baseLink.rel = 'stylesheet';
        baseLink.href = baseHref;
        varLink.parentNode.insertBefore(baseLink, varLink.nextSibling);
    } else {
        baseLink.id = 'sys-style-base';
        if (baseLink.href !== baseHref) baseLink.href = baseHref;
    }

    const shellHref = resolveSiteUrl('css/components/desktop-shell.css');
    let shellLink = document.getElementById('sys-style-desktop-shell') || document.querySelector('link[href*="desktop-shell.css"]');
    if (!shellLink) {
        shellLink = document.createElement('link');
        shellLink.id = 'sys-style-desktop-shell';
        shellLink.rel = 'stylesheet';
        shellLink.href = shellHref;
        document.head.appendChild(shellLink);
    } else {
        shellLink.id = 'sys-style-desktop-shell';
        if (shellLink.href !== shellHref) shellLink.href = shellHref;
    }

    const indHref = resolveSiteUrl('css/components/activity-indicator.css');
    let indLink = document.getElementById('sys-style-activity') || document.querySelector('link[href*="activity-indicator.css"]');
    if (!indLink) {
        indLink = document.createElement('link');
        indLink.id = 'sys-style-activity';
        indLink.rel = 'stylesheet';
        indLink.href = indHref;
        document.head.appendChild(indLink);
    } else {
        indLink.id = 'sys-style-activity';
        if (indLink.href !== indHref) indLink.href = indHref;
    }

    const activeId = isHome ? 'sys-style-home' : 'sys-style-subpage';
    const activeSubstr = isHome ? 'main/style.css' : 'subpage.css';
    const activePath = isHome ? 'main/style.css' : 'css/components/subpage.css';
    const inactiveId = isHome ? 'sys-style-subpage' : 'sys-style-home';
    const inactiveSubstr = isHome ? 'subpage.css' : 'main/style.css';

    const activeHref = resolveSiteUrl(activePath);
    let activeLink = document.getElementById(activeId) || document.querySelector('link[href*="' + activeSubstr + '"]');

    if (activeLink && !activeLink.disabled && !activeLink.hasAttribute('disabled')) {
        activeLink.id = activeId;
        if (activeLink.href !== activeHref) {
            activeLink.href = activeHref;
        }
        /* Keep page stylesheet ordered strictly before desktop-shell.css */
        if (!(activeLink.compareDocumentPosition(shellLink) & Node.DOCUMENT_POSITION_FOLLOWING)) {
            shellLink.parentNode.insertBefore(activeLink, shellLink);
        }
    } else {
        if (activeLink) {
            activeLink.remove();
        }
        const newLink = document.createElement('link');
        newLink.id = activeId;
        newLink.rel = 'stylesheet';

        const loadPromise = new Promise((resolve) => {
            let settled = false;
            const finish = () => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve();
            };
            const timer = setTimeout(finish, 2000);
            newLink.addEventListener('load', finish, { once: true });
            newLink.addEventListener('error', finish, { once: true });
        });

        newLink.href = activeHref;
        shellLink.parentNode.insertBefore(newLink, shellLink);
        await loadPromise;
    }

    /* Remove the inactive page stylesheet after the active one is ready */
    const inactiveLink = document.getElementById(inactiveId) || document.querySelector('link[href*="' + inactiveSubstr + '"]');
    if (inactiveLink) {
        inactiveLink.disabled = true;
        inactiveLink.remove();
    }
}

/* Ensure right-hand content stage container exists */
function ensureStageContainer() {
    if (isMobileLayout()) return null;

    let stage = document.getElementById('desktop-stage');
    if (stage) return stage;

    stage = document.createElement('main');
    stage.id = 'desktop-stage';
    stage.className = 'desktop-stage';

    const sidebar = document.getElementById('desktop-sidebar');
    const nodesToMove = [];
    const children = Array.from(document.body.childNodes);

    children.forEach(node => {
        if (node === sidebar) return;
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();
            if (tag === 'script' || tag === 'style' || tag === 'link') return;
            if (node.id === 'bg-music') return;
            if (node.classList && (node.classList.contains('apple-top-nav') || node.classList.contains('apple-tab-bar'))) return;
        }
        nodesToMove.push(node);
    });

    nodesToMove.forEach(node => stage.appendChild(node));
    document.body.appendChild(stage);
    return stage;
}

/* Extract content to be injected into the stage from a parsed Document */
function extractStageContent(doc) {
    const docStage = doc.getElementById('desktop-stage');
    if (docStage) {
        return docStage.innerHTML;
    }

    const tempWrapper = document.createElement('div');
    const nodes = Array.from(doc.body.childNodes);
    nodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();
            if (tag === 'script' || tag === 'style' || tag === 'link') return;
            if (node.id === 'desktop-sidebar' || node.id === 'bg-music') return;
            if (node.classList && (node.classList.contains('apple-top-nav') || node.classList.contains('apple-tab-bar'))) return;
        }
        tempWrapper.appendChild(node.cloneNode(true));
    });
    return tempWrapper.innerHTML;
}

/* Synchronize sidebar navigation active indicator and item states */
function syncSidebarActiveState(sidebarEl, activeTab) {
    if (!sidebarEl || !activeTab) return;
    const navItems = sidebarEl.querySelectorAll('.desktop-nav-item');
    navItems.forEach(item => {
        if (item.getAttribute('data-sidebar-tab') === activeTab) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

/* Execute scripts associated with target page */
async function executeStageScripts(doc, targetUrl) {
    /* If target page contains zero-md and it is not registered, dynamically load it */
    if (doc.querySelector('zero-md') && !window.customElements.get('zero-md')) {
        const zeroMdUrl = resolveSiteUrl('js/zero-md.min.js');
        try {
            await import(zeroMdUrl);
        } catch (err) {
            console.error('[Router Zero-MD Load Error]:', err);
        }
    }

    /* Dynamically load Chart.js when entering pages that render canvas charts (e.g. biography) */
    const needsChartJs = doc.querySelector('#influenceChart, #sanminChart, canvas[data-chart]') ||
                         doc.querySelector('script[src*="chart.min.js"]');
    if (needsChartJs && typeof window.Chart === 'undefined') {
        try {
            if (!window.__chartJsLoadPromise) {
                window.__chartJsLoadPromise = new Promise((resolve, reject) => {
                    const chartScript = document.createElement('script');
                    chartScript.src = resolveSiteUrl('js/chart.min.js');
                    chartScript.async = false;
                    chartScript.onload = () => resolve();
                    chartScript.onerror = (err) => {
                        window.__chartJsLoadPromise = null;
                        reject(err);
                    };
                    document.head.appendChild(chartScript);
                });
            }
            await window.__chartJsLoadPromise;
        } catch (err) {
            console.error('[Router Chart.js Load Error]:', err);
        }
    }

    const isHome = getTabFromUrl(targetUrl) === 'home';
    if (isHome) {
        /* Mount background music element if desktop session started from a subpage */
        if (!document.getElementById('bg-music')) {
            const docBgMusic = doc.getElementById('bg-music');
            if (docBgMusic) {
                const bgMusicClone = docBgMusic.cloneNode(true);
                bgMusicClone.querySelectorAll('source[src]').forEach(sourceEl => {
                    const rawSrc = sourceEl.getAttribute('src');
                    if (rawSrc) {
                        sourceEl.setAttribute('src', new URL(rawSrc, targetUrl).href);
                    }
                });
                document.body.appendChild(bgMusicClone);
            }
        }

        /* Ensure runtime environment configuration is loaded before Home bootstrap */
        if (typeof window.ENV === 'undefined') {
            await new Promise((resolve) => {
                const envScript = document.createElement('script');
                envScript.src = resolveSiteUrl('api/env.js');
                envScript.async = false;
                envScript.onload = () => resolve();
                envScript.onerror = () => resolve();
                document.head.appendChild(envScript);
            });
        }

        if (typeof window.initApp === 'function') {
            try {
                window.initApp();
            } catch (err) {
                console.error('[Router Home Init Error]:', err);
            }
        } else {
            try {
                const appMod = await import(resolveSiteUrl('js/app.js'));
                if (!window.__appInitialized && typeof appMod.initApp === 'function') {
                    appMod.initApp();
                }
            } catch (err) {
                console.error('[Router Home Module Load Error]:', err);
            }
        }
        return;
    }

    /* Boot declarative subpage controllers via unified boot dispatcher when available */
    const pageName = doc.body ? doc.body.getAttribute('data-page') : null;
    if (pageName) {
        try {
            const bootMod = await import(resolveSiteUrl('js/boot.js'));
            if (typeof bootMod.bootPage === 'function') {
                await bootMod.bootPage(pageName);
            }
            return;
        } catch (err) {
            console.error('[Router Page Boot Error]:', err);
        }
    }

    /* Fallback: execute inline module scripts extracted from target document */
    const inlineModules = doc.querySelectorAll('body script[type="module"]:not([src])');
    inlineModules.forEach(oldScript => {
        const newScript = document.createElement('script');
        newScript.type = 'module';
        newScript.textContent = oldScript.textContent;
        document.body.appendChild(newScript);
        setTimeout(() => {
            if (newScript.parentNode) {
                newScript.parentNode.removeChild(newScript);
            }
        }, 300);
    });
}

/* Desktop Split Stage Navigator */
let activeNavToken = 0;
let activeFetchCtrl = null;

export async function navigateDesktopStage(targetHref, pushState = true, fromSidebar = false) {
    if (isMobileLayout()) {
        window.location.href = targetHref;
        return;
    }

    const targetUrl = new URL(targetHref, window.location.href);

    /* Don't re-navigate to the exact same URL without hash */
    if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search && !targetUrl.hash) {
        return;
    }

    /* Supersede any in-flight navigation rather than dropping rapid user clicks */
    if (activeFetchCtrl) {
        activeFetchCtrl.abort();
        activeFetchCtrl = null;
    }
    const navToken = ++activeNavToken;

    const targetTab = getTabFromUrl(targetUrl.href);

    /* 1. Instant indicator glide with fluid Apple Music compression physics */
    if (window.__glideNavIndicator && targetTab) {
        window.__glideNavIndicator(targetTab);
    }
    const sidebarEl = document.getElementById('desktop-sidebar');
    syncSidebarActiveState(sidebarEl, targetTab);

    /* 2. Fade out current desktop stage */
    const stage = ensureStageContainer();
    stage.classList.add('stage-fading');

    const fetchCtrl = new AbortController();
    activeFetchCtrl = fetchCtrl;
    const timeoutId = setTimeout(() => fetchCtrl.abort(), 8000);

    try {
        let fetchCompleted = false;

        const resPromise = fetch(targetUrl.href, { signal: fetchCtrl.signal })
            .then(res => {
                clearTimeout(timeoutId);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.text();
            });

        resPromise.then(() => { fetchCompleted = true; }).catch(() => {});

        /* Wait 120ms for stage fade out animation to finish */
        await new Promise(resolve => setTimeout(resolve, 120));
        if (navToken !== activeNavToken) return;

        /* If content has not arrived yet, reveal centered native Apple activity indicator */
        let indicatorEl = null;
        if (!fetchCompleted) {
            stage.innerHTML = '';
            indicatorEl = showActivityIndicator(stage);
            stage.classList.remove('stage-fading');
        }

        const html = await resPromise;
        if (navToken !== activeNavToken) return;

        const doc = new DOMParser().parseFromString(html, 'text/html');

        /* 3. Synchronize browser history, document head title i18n attributes, and document title */
        if (pushState) {
            window.history.pushState({ url: targetUrl.href }, doc.title, targetUrl.href);
        }
        const docTitleEl = doc.head ? doc.head.querySelector('title') : null;
        let headTitleEl = document.head.querySelector('title');
        if (!headTitleEl) {
            headTitleEl = document.createElement('title');
            document.head.appendChild(headTitleEl);
        }
        if (docTitleEl && docTitleEl.id) {
            headTitleEl.id = docTitleEl.id;
        }
        if (docTitleEl && docTitleEl.hasAttribute('data-i18n')) {
            headTitleEl.setAttribute('data-i18n', docTitleEl.getAttribute('data-i18n'));
        } else {
            headTitleEl.removeAttribute('data-i18n');
        }
        if (docTitleEl && docTitleEl.hasAttribute('data-page-title-key')) {
            headTitleEl.setAttribute('data-page-title-key', docTitleEl.getAttribute('data-page-title-key'));
        } else {
            headTitleEl.removeAttribute('data-page-title-key');
        }
        document.title = doc.title;

        /* 4. Switch stylesheets between home and subpages WHILE STAGE IS FULLY INVISIBLE */
        const isHome = targetTab === 'home';
        await ensurePageStylesheets(isHome);
        if (navToken !== activeNavToken) return;

        /* 5. Synchronize document.body classes and page metadata attributes */
        document.body.className = doc.body.className;
        const pageAttrs = ['data-page', 'data-event'];
        pageAttrs.forEach((attr) => {
            const val = doc.body.getAttribute(attr);
            if (val !== null) {
                document.body.setAttribute(attr, val);
            } else {
                document.body.removeAttribute(attr);
            }
        });
        document.body.classList.add('has-desktop-sidebar', 'has-desktop-indicator');
        if (isHome) {
            document.body.classList.add('is-desktop-home');
            document.body.classList.remove('is-desktop-subpage');
        } else {
            document.body.classList.remove('is-desktop-home');
            document.body.classList.add('is-desktop-subpage');
        }

        /* Track navigation source to conditionally show or hide top-back-btn */
        if (fromSidebar) {
            document.body.classList.add('nav-from-sidebar');
            document.body.classList.remove('nav-from-content');
        } else {
            document.body.classList.remove('nav-from-sidebar');
            document.body.classList.add('nav-from-content');
        }

        /* 6. Extract stage content from parsed document */
        const newContent = extractStageContent(doc);

        /* If indicator was showing, fade it out smoothly */
        if (indicatorEl) {
            hideActivityIndicator(stage);
            await new Promise(resolve => setTimeout(resolve, 100));
            if (navToken !== activeNavToken) return;
        }

        /* Tear down outgoing page listeners and cleanup hooks before mounting incoming DOM */
        resetPageLifecycle();

        stage.classList.add('stage-fading');
        stage.innerHTML = newContent;
        window.scrollTo(0, 0);

        /* Apply declarative translations before executing page-specific overrides */
        applyTranslations(document);

        /* 7. Execute scripts associated with the new page */
        await executeStageScripts(doc, targetUrl.href);
        if (navToken !== activeNavToken) return;

        /* Guarantee mobile top navigation bar is strictly hidden on desktop */
        const topNav = document.querySelector('.apple-top-nav');
        if (topNav) {
            topNav.style.setProperty('display', 'none', 'important');
        }

        /* 8. Allow browser engine to calculate layout and apply styles before revealing */
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (navToken !== activeNavToken) return;

        /* 9. Fade fully-styled stage back in */
        stage.classList.remove('stage-fading');

        /* 10. Sync sidebar active state and language labels */
        syncSidebarActiveState(sidebarEl, targetTab);
        syncSidebarLabels(sidebarEl);
        if (window.__syncIndicatorPosition) {
            window.__syncIndicatorPosition();
        }
    } catch (err) {
        if (navToken !== activeNavToken || (err && err.name === 'AbortError')) {
            return;
        }
        console.error('[Stage Navigation Fallback]:', err);
        window.location.href = targetUrl.href;
    } finally {
        clearTimeout(timeoutId);
        if (activeFetchCtrl === fetchCtrl) {
            activeFetchCtrl = null;
        }
    }
}

/* Attach Delegated Router Listeners */
let isRouterBound = false;

function setupDesktopRouter(sidebarEl, basePath) {
    ensureStageContainer();

    if (isRouterBound) return;
    isRouterBound = true;

    /* Delegated internal link click handler for desktop */
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        window.__lastClick = {
            target: e.target ? e.target.tagName : null,
            button: e.button,
            innerWidth: window.innerWidth,
            hasLink: !!link,
            href: link ? link.getAttribute('href') : null
        };

        if (!link) return;
        if (isMobileLayout()) return;
        if (e.button !== 0 && typeof e.button === 'number') return;
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        if (link.getAttribute('target') === '_blank' || link.hasAttribute('download')) return;

        const targetUrl = new URL(href, window.location.href);
        if (targetUrl.origin !== window.location.origin) return;

        /* External anchor or hash only */
        if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search && targetUrl.hash) {
            return;
        }

        /* Prevent reload if clicking the current page */
        if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search && !targetUrl.hash) {
            e.preventDefault();
            return;
        }

        e.preventDefault();
        navigateDesktopStage(targetUrl.href, true);
    });

    /* Browser back/forward button support */
    window.addEventListener('popstate', () => {
        if (isMobileLayout()) return;
        navigateDesktopStage(window.location.href, false);
    });
}

/* ============================================================================
 * Desktop Shell Initialization Controller
 * ============================================================================ */
export function initDesktopShell(options = {}) {
    /* Mobile isolation guard: desktop shell is strictly disabled on mobile/tablet devices or small viewports */
    if (isMobileLayout()) {
        if (!window.__desktopShellResizeBound) {
            window.__desktopShellResizeBound = true;
            window.addEventListener('resize', () => {
                if (isDesktopLayout()) {
                    initDesktopShell(options);
                }
            });
        }
        return;
    }

    let {
        activeTab = 'home',
        basePath = './'
    } = options;

    /* Canonical tab detection via shared route registry */
    activeTab = getTabFromUrl(window.location.href) || activeTab;

    /* Add layout helper class to body for wide desktop viewports */
    document.body.classList.add('has-desktop-sidebar');
    if (activeTab === 'home') {
        document.body.classList.add('is-desktop-home');
        document.body.classList.remove('is-desktop-subpage');
    } else {
        document.body.classList.remove('is-desktop-home');
        document.body.classList.add('is-desktop-subpage');
    }

    /* Determine navigation source for initial page load if not already set by router.
     * Second-level detail subpages always display top-back-btn; top-level exhibits inspect
     * document.referrer on hard load to decide whether to show top-back-btn. */
    if (!document.body.classList.contains('nav-from-sidebar') && !document.body.classList.contains('nav-from-content')) {
        if (isDetailSubpage(window.location.href)) {
            document.body.classList.remove('nav-from-sidebar');
            document.body.classList.add('nav-from-content');
        } else {
            const exhibitTabs = new Set(['biography', 'xinhai', 'whampoa', 'mayfourth', 'militaries', 'yatsen-birth', 'yatsen-passing']);
            if (exhibitTabs.has(activeTab)) {
                const ref = document.referrer;
                const cameFromLibrary = ref && (ref.includes('/pages/library/') || ref.includes('library.html'));
                if (cameFromLibrary) {
                    document.body.classList.remove('nav-from-sidebar');
                    document.body.classList.add('nav-from-content');
                } else {
                    document.body.classList.add('nav-from-sidebar');
                    document.body.classList.remove('nav-from-content');
                }
            } else {
                document.body.classList.remove('nav-from-sidebar');
                document.body.classList.add('nav-from-content');
            }
        }
    }

    /* Ensure head links (manifest, icons, splash, stylesheets) are absolute to prevent 404/CORS when pushState alters location */
    const headLinks = document.querySelectorAll('link[rel*="icon"], link[rel="manifest"], link[rel*="startup"], link[rel*="stylesheet"]');
    const slashSlash = String.fromCharCode(47, 47);
    headLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.includes(slashSlash) && !href.startsWith('/')) {
            let cleanPath = href;
            while (cleanPath.startsWith('../')) {
                cleanPath = cleanPath.substring(3);
            }
            while (cleanPath.startsWith('./')) {
                cleanPath = cleanPath.substring(2);
            }
            link.href = resolveSiteUrl(cleanPath);
        }
    });

    /* Ensure content stage container exists and stylesheets are properly isolated */
    ensureStageContainer();
    ensurePageStylesheets(activeTab === 'home');

    /* Guarantee mobile top navigation bar is strictly hidden on desktop */
    const topNav = document.querySelector('.apple-top-nav');
    if (topNav) {
        topNav.style.setProperty('display', 'none', 'important');
    }

    /* Check if sidebar already exists */
    let sidebarEl = document.getElementById('desktop-sidebar');
    if (sidebarEl && sidebarEl.dataset.initialized === 'true') {
        syncSidebarActiveState(sidebarEl, activeTab);
        syncSidebarLabels(sidebarEl);
        syncSidebarProfile(sidebarEl);
        if (window.__syncIndicatorPosition) {
            window.__syncIndicatorPosition();
        }
        return;
    }

    if (!sidebarEl) {
        sidebarEl = createSidebarElement(activeTab, basePath);
        document.body.insertBefore(sidebarEl, document.body.firstChild);
    }

    sidebarEl.dataset.initialized = 'true';

    /* Setup Apple-style dynamic red indicator transition */
    setupAnimatedNavIndicator(sidebarEl, activeTab);

    /* Bind Search Input and Dropdown */
    setupDesktopSearch(sidebarEl, basePath);

    /* Sync Sidebar Language Labels */
    syncSidebarLabels(sidebarEl);

    /* Sync Visitor Profile with Identicon and UUID */
    syncSidebarProfile(sidebarEl);

    /* Setup Desktop Split View Stage and Router */
    if (isDesktopLayout()) {
        setupDesktopRouter(sidebarEl, basePath);
    }

    /* Listen for Global Language Changes */
    window.addEventListener('sys-lang-change', () => {
        syncSidebarLabels(sidebarEl);
    });

    /* Re-sync indicator and stage on window resize */
    window.addEventListener('resize', () => {
        if (isDesktopLayout()) {
            ensureStageContainer();
            const topNav = document.querySelector('.apple-top-nav');
            if (topNav) {
                topNav.style.setProperty('display', 'none', 'important');
            }
            if (window.__syncIndicatorPosition) {
                window.__syncIndicatorPosition();
            }
        } else {
            const topNav = document.querySelector('.apple-top-nav');
            if (topNav) {
                topNav.style.removeProperty('display');
            }
        }
    });
}

/* ============================================================================
 * DOM Factory: Create Sidebar Node
 * ============================================================================ */
function createSidebarElement(activeTab, basePath) {
    const routes = {
        home: resolveSiteUrl('index.html'),
        announcement: resolveSiteUrl('pages/announcement/announcement.html'),
        library: resolveSiteUrl('pages/library/library.html'),
        settings: resolveSiteUrl('pages/settings/settings.html'),
        xinhai: resolveSiteUrl('events/xinhai/xinhai.html'),
        whampoa: resolveSiteUrl('events/whampoa/whampoa.html'),
        mayfourth: resolveSiteUrl('events/mayfourth/mayfourth.html'),
        biography: resolveSiteUrl('pages/biography/biography.html')
    };

    const aside = document.createElement('aside');
    aside.id = 'desktop-sidebar';
    aside.className = 'desktop-sidebar';
    aside.setAttribute('role', 'navigation');
    aside.setAttribute('data-i18n-aria-label', 'sidebar.aria_nav');
    aside.setAttribute('aria-label', t('sidebar.aria_nav'));

    aside.innerHTML = `
        <div class="desktop-sidebar-top">
            <!-- Brand Header -->
            <a href="${routes.home}" class="desktop-sidebar-brand">
                <div class="desktop-sidebar-brand-icon">🏛️</div>
                <div class="desktop-sidebar-brand-text" id="desktop-brand-text" data-i18n="sidebar.brand">${t('sidebar.brand')}</div>
            </a>

            <!-- Apple Music Search Box -->
            <div class="desktop-search-box">
                <div class="desktop-search-input-wrapper">
                    <svg viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input type="text" class="desktop-search-input" id="desktop-search-input" data-i18n-placeholder="sidebar.search_placeholder" placeholder="${t('sidebar.search_placeholder')}" autocomplete="off">
                </div>
                <div class="desktop-search-dropdown" id="desktop-search-dropdown"></div>
            </div>

            <!-- Primary Navigation Section (The 4 Core Tabs) -->
            <div class="desktop-nav-section">
                <div class="desktop-nav-header" id="desktop-menu-header" data-i18n="sidebar.menu_header">${t('sidebar.menu_header')}</div>
                <a href="${routes.home}" class="desktop-nav-item ${activeTab === 'home' ? 'active' : ''}" data-sidebar-tab="home">
                    ${TAB_ICONS.home}
                    <span class="desktop-nav-label" id="label-nav-home" data-i18n="sidebar.home">${t('sidebar.home')}</span>
                </a>
                <a href="${routes.announcement}" class="desktop-nav-item ${activeTab === 'announcement' ? 'active' : ''}" data-sidebar-tab="announcement">
                    ${TAB_ICONS.announcement}
                    <span class="desktop-nav-label" id="label-nav-announcement" data-i18n="sidebar.announcement">${t('sidebar.announcement')}</span>
                </a>
                <a href="${routes.library}" class="desktop-nav-item ${activeTab === 'library' ? 'active' : ''}" data-sidebar-tab="library">
                    ${TAB_ICONS.library}
                    <span class="desktop-nav-label" id="label-nav-library" data-i18n="sidebar.library">${t('sidebar.library')}</span>
                </a>
                <a href="${routes.settings}" class="desktop-nav-item ${activeTab === 'settings' ? 'active' : ''}" data-sidebar-tab="settings">
                    ${TAB_ICONS.settings}
                    <span class="desktop-nav-label" id="label-nav-settings" data-i18n="sidebar.settings">${t('sidebar.settings')}</span>
                </a>
            </div>

            <!-- Subgroup: Historical Exhibitions -->
            <div class="desktop-nav-section">
                <div class="desktop-nav-header" id="desktop-exhibits-header" data-i18n="sidebar.exhibits_header">${t('sidebar.exhibits_header')}</div>
                <a href="${routes.biography}" class="desktop-nav-item ${activeTab === 'biography' ? 'active' : ''}" data-sidebar-tab="biography">
                    <svg viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
                    <span class="desktop-nav-label" id="label-exhibit-biography" data-i18n="sidebar.exhibit_biography">${t('sidebar.exhibit_biography')}</span>
                </a>
                <a href="${routes.xinhai}" class="desktop-nav-item ${activeTab === 'xinhai' ? 'active' : ''}" data-sidebar-tab="xinhai">
                    <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    <span class="desktop-nav-label" id="label-exhibit-xinhai" data-i18n="sidebar.exhibit_xinhai">${t('sidebar.exhibit_xinhai')}</span>
                </a>
                <a href="${routes.whampoa}" class="desktop-nav-item ${activeTab === 'whampoa' ? 'active' : ''}" data-sidebar-tab="whampoa">
                    <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                    <span class="desktop-nav-label" id="label-exhibit-whampoa" data-i18n="sidebar.exhibit_whampoa">${t('sidebar.exhibit_whampoa')}</span>
                </a>
                <a href="${routes.mayfourth}" class="desktop-nav-item ${activeTab === 'mayfourth' ? 'active' : ''}" data-sidebar-tab="mayfourth">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    <span class="desktop-nav-label" id="label-exhibit-mayfourth" data-i18n="sidebar.exhibit_mayfourth">${t('sidebar.exhibit_mayfourth')}</span>
                </a>
            </div>
        </div>

        <!-- Sidebar Footer Visitor Profile (Apple Music Profile Style with Identicon) -->
        <div class="desktop-sidebar-bottom" style="border-top: 0.5px solid rgba(255, 255, 255, 0.08); padding-top: 10px; margin: 8px -12px 0 -12px; padding-left: 12px; padding-right: 12px; overflow: hidden !important; min-width: 0 !important; flex-shrink: 0;">
            <div class="desktop-profile-card" id="desktop-profile-card" tabindex="0" role="button" data-i18n-aria-label="sidebar.visitor_label" aria-label="${t('sidebar.visitor_label')}" style="display: flex !important; align-items: center !important; gap: 8px !important; height: 24px !important; padding: 0 6px !important; min-width: 0 !important; overflow: hidden !important; width: 100% !important; box-sizing: border-box !important;">
                <div class="desktop-profile-avatar" id="desktop-profile-avatar" style="width: 16px !important; height: 16px !important; border-radius: 50% !important; overflow: hidden !important; flex-shrink: 0 !important;"></div>
                <span class="desktop-profile-uuid" id="desktop-profile-uuid" style="font-size: 11px !important; font-weight: 500 !important; font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace !important; letter-spacing: -0.2px !important; line-height: 1 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; min-width: 0 !important; flex: 1 !important; display: block !important;"></span>
            </div>
        </div>
    `;

    return aside;
}

/* ============================================================================
 * Search Interaction Engine
 * ============================================================================ */
function setupDesktopSearch(sidebarEl, basePath) {
    const searchInput = sidebarEl.querySelector('#desktop-search-input');
    const searchDropdown = sidebarEl.querySelector('#desktop-search-dropdown');
    if (!searchInput || !searchDropdown) return;

    function renderResults(query) {
        const q = query.trim().toLowerCase();
        if (!q) {
            searchDropdown.classList.remove('active');
            searchDropdown.innerHTML = '';
            return;
        }

        const matched = SEARCH_INDEX.filter(item => {
            const title = t(item.titleKey).toLowerCase();
            const cat = t(item.categoryKey).toLowerCase();
            const kw = item.keywords.join(' ').toLowerCase();
            return title.includes(q) || cat.includes(q) || kw.includes(q);
        });

        if (matched.length === 0) {
            searchDropdown.innerHTML = `<div class="desktop-search-empty">${t('sidebar.no_results')}</div>`;
            searchDropdown.classList.add('active');
            return;
        }

        searchDropdown.innerHTML = matched.slice(0, 8).map(item => {
            const title = t(item.titleKey);
            const category = t(item.categoryKey);
            const targetUrl = resolveSiteUrl(item.url);

            return `
                <a href="${targetUrl}" class="desktop-search-item">
                    <span>${item.icon}</span>
                    <span style="font-weight: 500;">${title}</span>
                    <span class="desktop-search-item-badge">${category}</span>
                </a>
            `;
        }).join('');

        searchDropdown.classList.add('active');
    }

    searchDropdown.addEventListener('click', () => {
        searchDropdown.classList.remove('active');
    });

    searchInput.addEventListener('input', (e) => {
        renderResults(e.target.value);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchDropdown.classList.remove('active');
            searchInput.blur();
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.desktop-search-box')) {
            searchDropdown.classList.remove('active');
        }
    });
}


/* ============================================================================
 * Label Synchronization (i18n)
 * ============================================================================ */
function syncSidebarLabels(sidebarEl) {
    if (!sidebarEl) return;
    applyTranslations(sidebarEl);
}

/* ============================================================================
 * Visitor Profile & Identicon Synchronizer (Apple Music Style)
 * ============================================================================ */
function syncSidebarProfile(sidebarEl) {
    if (!sidebarEl) return;

    const card = sidebarEl.querySelector('#desktop-profile-card');
    const avatarEl = sidebarEl.querySelector('#desktop-profile-avatar');
    const uuidEl = sidebarEl.querySelector('#desktop-profile-uuid');

    const uuid = getVisitorUuid();

    /* Render 5x5 symmetrical SVG Identicon avatar */
    if (avatarEl && !avatarEl.querySelector('svg')) {
        avatarEl.innerHTML = generateIdenticonSvg(uuid, 16);
    }

    /* Set truncated UUID text with native browser tooltip */
    if (uuidEl) {
        uuidEl.textContent = uuid;
        uuidEl.setAttribute('title', uuid);
    }
    if (card) {
        card.setAttribute('title', uuid);
    }

    /* Interactive click-to-copy handler with fluid Apple UI inline feedback */
    if (card && !card.dataset.copyBound) {
        card.dataset.copyBound = 'true';
        let resetTimer = null;

        card.addEventListener('click', async (e) => {
            e.stopPropagation();

            let copied = false;
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(uuid);
                    copied = true;
                }
            } catch (err) {
                /* Clipboard write failed or permissions error */
            }

            if (!copied) {
                try {
                    const ta = document.createElement('textarea');
                    ta.value = uuid;
                    ta.style.position = 'fixed';
                    ta.style.top = '-9999px';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.focus();
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                } catch (err) {
                    /* Fallback copy failure ignored */
                }
            }

            if (uuidEl) {
                if (resetTimer) clearTimeout(resetTimer);
                uuidEl.textContent = '✓ ' + t('sidebar.copied_hint');
                uuidEl.classList.add('copied');
                resetTimer = setTimeout(() => {
                    uuidEl.textContent = uuid;
                    uuidEl.classList.remove('copied');
                }, 1500);
            }
        });

        /* Accessible keyboard activation */
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
    }
}

/* ============================================================================
 * Animated Red Indicator Controller (Apple Fluid Shorten-Glide-Elongate Physics)
 * ============================================================================ */
function setupAnimatedNavIndicator(sidebarEl, activeTab) {
    const topContainer = sidebarEl.querySelector('.desktop-sidebar-top');
    if (!topContainer) return;

    let indicator = topContainer.querySelector('#desktop-nav-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'desktop-nav-indicator';
        indicator.className = 'desktop-nav-indicator';
        topContainer.appendChild(indicator);
    }

    document.body.classList.add('has-desktop-indicator');

    const navItems = sidebarEl.querySelectorAll('.desktop-nav-item');
    const activeItem = sidebarEl.querySelector(`.desktop-nav-item[data-sidebar-tab="${activeTab}"]`);

    function getItemPosition(itemEl) {
        if (!itemEl || !topContainer) return null;
        let top = 0;
        let curr = itemEl;
        let found = false;
        while (curr && curr !== topContainer) {
            top += curr.offsetTop;
            curr = curr.offsetParent;
            if (curr === topContainer) {
                found = true;
                break;
            }
        }
        if (!found) {
            const itemRect = itemEl.getBoundingClientRect();
            const parentRect = topContainer.getBoundingClientRect();
            top = itemRect.top - parentRect.top;
        }
        const height = itemEl.offsetHeight || 32;
        return top + (height - 16) / 2;
    }

    function moveIndicator(fromY, toY, onFinish) {
        if (typeof fromY !== 'number' || typeof toY !== 'number') {
            if (typeof toY === 'number') {
                indicator.style.top = `${toY}px`;
                indicator.style.height = '16px';
                indicator.style.opacity = '1';
            }
            if (onFinish) onFinish();
            return;
        }

        indicator.style.opacity = '1';

        if (Math.abs(toY - fromY) < 1) {
            indicator.style.top = `${toY}px`;
            indicator.style.height = '16px';
            if (onFinish) onFinish();
            return;
        }

        const isDown = toY > fromY;
        const keyframes = isDown ? [
            /* 0%: Full length at origin */
            { top: `${fromY}px`, height: '16px', easing: 'cubic-bezier(0.32, 0.72, 0, 1)' },
            /* 26%: In place, shorten towards bottom */
            { top: `${fromY + 12}px`, height: '4px', easing: 'cubic-bezier(0.25, 1, 0.5, 1)' },
            /* 66%: Move to destination top while compressed */
            { top: `${toY}px`, height: '4px', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
            /* 88%: Slight elastic overshoot elongation */
            { top: `${toY}px`, height: '17.5px', easing: 'ease-out' },
            /* 100%: Settle at target 16px */
            { top: `${toY}px`, height: '16px' }
        ] : [
            /* 0%: Full length at origin */
            { top: `${fromY}px`, height: '16px', easing: 'cubic-bezier(0.32, 0.72, 0, 1)' },
            /* 26%: In place, shorten towards top */
            { top: `${fromY}px`, height: '4px', easing: 'cubic-bezier(0.25, 1, 0.5, 1)' },
            /* 66%: Move to destination bottom while compressed */
            { top: `${toY + 12}px`, height: '4px', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
            /* 88%: Slight elastic overshoot elongation */
            { top: `${toY - 1.5}px`, height: '17.5px', easing: 'ease-out' },
            /* 100%: Settle at target 16px */
            { top: `${toY}px`, height: '16px' }
        ];

        const anim = indicator.animate(keyframes, {
            duration: 300,
            fill: 'forwards',
            easing: 'linear'
        });

        anim.onfinish = () => {
            indicator.style.top = `${toY}px`;
            indicator.style.height = '16px';
            if (onFinish) onFinish();
        };
    }

    /* Record session state for active tab */
    sessionStorage.setItem('sys_last_nav_tab', activeTab);

    /* Direct, rock-solid initial positioning without cross-page jump or offset glitch */
    function syncIndicatorPosition() {
        if (!activeItem) return;
        const toPos = getItemPosition(activeItem);
        if (toPos !== null) {
            indicator.style.top = `${toPos}px`;
            indicator.style.height = '16px';
            indicator.style.opacity = '1';
        }
    }

    requestAnimationFrame(syncIndicatorPosition);
    setTimeout(syncIndicatorPosition, 50);
    setTimeout(syncIndicatorPosition, 150);

    /* Re-sync on window resize */
    window.addEventListener('resize', syncIndicatorPosition);

    /* Expose fluid glide controller globally for router and subpage transitions */
    function glideNavIndicator(tabName, onFinish) {
        const targetItem = sidebarEl.querySelector(`.desktop-nav-item[data-sidebar-tab="${tabName}"]`);
        if (!targetItem) {
            if (onFinish) onFinish();
            return;
        }

        const currentActive = sidebarEl.querySelector('.desktop-nav-item.active');
        const fromY = getItemPosition(currentActive);
        const toY = getItemPosition(targetItem);

        if (currentActive) currentActive.classList.remove('active');
        targetItem.classList.add('active');

        sessionStorage.setItem('sys_last_nav_tab', tabName);

        if (fromY !== null && toY !== null && Math.abs(toY - fromY) >= 1) {
            moveIndicator(fromY, toY, onFinish);
        } else if (toY !== null) {
            indicator.style.top = `${toY}px`;
            indicator.style.height = '16px';
            indicator.style.opacity = '1';
            if (onFinish) onFinish();
        } else {
            if (onFinish) onFinish();
        }
    }

    window.__glideNavIndicator = glideNavIndicator;
    window.__syncIndicatorPosition = syncIndicatorPosition;

    /* Apple-style animated glide triggered on explicit user tab clicks */
    navItems.forEach((item) => {
        item.addEventListener('click', (e) => {
            const targetTab = item.getAttribute('data-sidebar-tab');
            const targetHref = item.getAttribute('href');
            if (!targetHref || targetHref.startsWith('javascript:')) return;

            e.preventDefault();
            e.stopPropagation();

            if (targetTab === sessionStorage.getItem('sys_last_nav_tab') && window.location.pathname.endsWith(targetHref)) {
                return;
            }

            glideNavIndicator(targetTab);
            navigateDesktopStage(targetHref, true, true);
        });
    });
}
