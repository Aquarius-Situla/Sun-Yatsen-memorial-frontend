/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Subpage Controller (subpage.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

/* ============================================================================
 * Markdown Styles Generator
 * ============================================================================ */
function getMarkdownStyles(isLight) {
    if (isLight) {
        return `.markdown-body {
            color: #2c1810 !important;
            background-color: transparent !important;
            font-family: -apple-system, BlinkMacSystemFont, "PingFang TC", "PingFang SC", "Microsoft JhengHei", sans-serif !important;
            line-height: 1.8;
            padding: 0 15px !important;
            overflow-wrap: break-word !important;
            word-wrap: break-word !important;
            word-break: break-all !important;
        }
        .markdown-body h1, .markdown-body h2 {
            color: #2c1810 !important;
            border-bottom-color: #c4a876 !important;
            padding-bottom: 10px;
        }
        .markdown-body a { color: #b8860b !important; text-decoration: none; }
        .markdown-body a:hover { text-decoration: underline; }
        .markdown-body ul { margin-bottom: 20px !important; }
        .markdown-body li { margin-bottom: 8px !important; }
        .markdown-body blockquote {
            border-left: 4px solid #b8860b !important;
            color: #5a3e2a !important;
            background: rgba(184,134,11,0.08) !important;
            padding: 12px 20px !important;
            border-radius: 0 6px 6px 0 !important;
        }` + (document.querySelector('.festival-hero') ? `
        .markdown-body > h1:first-child { display: none !important; }` : '');
    } else {
        return `.markdown-body {
            color: #e5e7eb !important;
            background-color: transparent !important;
            font-family: -apple-system, BlinkMacSystemFont, "PingFang TC", "PingFang SC", "Microsoft JhengHei", sans-serif !important;
            line-height: 1.8;
            padding: 0 15px !important;
            overflow-wrap: break-word !important;
            word-wrap: break-word !important;
            word-break: break-all !important;
        }
        .markdown-body h1, .markdown-body h2 {
            color: #ffffff !important;
            border-bottom-color: #333333 !important;
            padding-bottom: 10px;
        }
        .markdown-body a { color: #f1c40f !important; text-decoration: none; }
        .markdown-body a:hover { text-decoration: underline; }
        .markdown-body ul { margin-bottom: 20px !important; }
        .markdown-body li { margin-bottom: 8px !important; }
        .markdown-body blockquote {
            border-left: 4px solid #b8860b !important;
            color: #cccccc !important;
            background: rgba(184,134,11,0.07) !important;
            padding: 12px 20px !important;
            border-radius: 0 6px 6px 0 !important;
        }` + (document.querySelector('.festival-hero') ? `
        .markdown-body > h1:first-child { display: none !important; }` : '');
    }
}

import { t, applyTranslations, syncTabBarLabels, getCurrentLang, getLanguageMode, setGlobalLang } from './modules/i18n.js';
import { initTabBar, syncStandaloneTabBar } from './modules/tab-bar.js';
import { setupDiagnosticTrigger } from './modules/debug-panel.js';
import { initIOSNavTransition } from './modules/ios-nav-transition.js';
import { initDesktopShell } from './modules/desktop-shell.js';
import { showActivityIndicator, hideActivityIndicator } from './modules/activity-indicator.js';
import { initDeviceLayout, initOrientationGuard, isMobileLayout, isDesktopLayout } from './modules/device-detect.js';
import { getPageSignal } from './core/lifecycle.js';
import { getBackNavMeta, getPageTopTitleKey, isSubpageRoute } from './core/routes.js';

/* ============================================================================
 * Subpage Initialization Engine
 * ============================================================================ */
export function initSubpage(options) {
    const {
        texts = null,
        activeBottomTab = null,
        basePath = '../../',
        onRendered = null
    } = options;

    const pageSignal = getPageSignal();

    /* Initialize device layout classes and smartphone orientation blocker */
    initDeviceLayout();
    initOrientationGuard();

    /* Initialize diagnostic HUD trigger (3-tap on header) */
    setupDiagnosticTrigger();

    /* Initialize Apple Native Bottom Tab Bar (root hubs only) and Desktop Sidebar */
    if (activeBottomTab) {
        initTabBar({
            activeTab: activeBottomTab,
            basePath: basePath
        });
        initDesktopShell({
            activeTab: activeBottomTab,
            basePath: basePath
        });
    }

    /* Distinguish between root menu hub pages and pushed subpages */
    const isMenuHubPage = document.body.classList.contains('page-announcement-menu') ||
                          document.body.classList.contains('page-settings-menu') ||
                          document.body.classList.contains('page-library-menu') ||
                          !isSubpageRoute();

    if (!isMenuHubPage) {
        document.body.classList.add('is-subpage');
        const tabBarEl = document.getElementById('apple-tab-bar');
        if (tabBarEl && isMobileLayout()) {
            tabBarEl.style.setProperty('display', 'none', 'important');
        }
    } else {
        document.body.classList.remove('is-subpage');
        const tabBarEl = document.getElementById('apple-tab-bar');
        if (tabBarEl) {
            tabBarEl.style.removeProperty('display');
        }
        /* Synchronize standalone viewport on root hub pages */
        syncStandaloneTabBar();
    }

    /* Guarantee Apple Native Top Navigation Bar and Back Link are visible and interactable on mobile only */
    const topNav = document.querySelector('.apple-top-nav');
    if (topNav) {
        if (isMobileLayout()) {
            topNav.classList.remove('nav-hidden');
            topNav.style.removeProperty('display');
            topNav.style.setProperty('display', 'flex', 'important');
        } else {
            topNav.style.setProperty('display', 'none', 'important');
        }
    }
    const navBackLink = document.querySelector('.apple-top-nav .nav-back-link');
    if (navBackLink) {
        if (isMobileLayout()) {
            navBackLink.style.setProperty('display', 'flex', 'important');
            navBackLink.style.setProperty('visibility', 'visible', 'important');
            navBackLink.style.setProperty('opacity', '1', 'important');
            navBackLink.style.setProperty('pointer-events', 'auto', 'important');
        } else {
            navBackLink.style.setProperty('display', 'none', 'important');
        }
    }

    /* Dismiss any full-page activity indicator from prior mobile navigation */
    hideActivityIndicator(document.body);

    const langBtn = document.getElementById('lang-btn');
    const mdViewer = document.getElementById('md-viewer');
    const container = document.querySelector('.markdown-container');
    if (container && mdViewer) {
        container.classList.remove('loaded');
        showActivityIndicator(container);
    } else if (container) {
        container.classList.add('loaded');
    }
    const heroTitle = document.getElementById('hero-title');
    const heroDate = document.getElementById('hero-date');
    const heroDesc = document.getElementById('hero-desc');
    const pageTitle = document.getElementById('page-title');
    const iosOptionItems = document.querySelectorAll('.ios-option-item[data-lang]');

    let isTraditional = getCurrentLang() === 'tc';

    /* Check URL param for explicit override */
    const params = new URLSearchParams(window.location.search);
    if (params.get('lang') === 'sc') {
        isTraditional = false;
    } else if (params.get('lang') === 'tc') {
        isTraditional = true;
    }

    function updateContent() {
        applyTranslations();
        document.documentElement.lang = isTraditional ? 'zh-TW' : 'zh-CN';

        if (isMenuHubPage) {
            syncTabBarLabels();
        }

        if (langBtn) {
            langBtn.textContent = isTraditional ? t('common.toggle_to_sc') : t('common.toggle_to_tc');
        }

        /* Update iOS Inset Grouped Option Selection (e.g. Language Selector) */
        const currentMode = (typeof getLanguageMode === 'function') ? getLanguageMode() : (isTraditional ? 'tc' : 'sc');
        iosOptionItems.forEach(opt => {
            const optLang = opt.getAttribute('data-lang');
            const isSelected = (optLang === currentMode);
            if (isSelected) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });

        if (texts) {
            /* Standard subpage / hero banner handling */
            const localized = texts[isTraditional ? 'tc' : 'sc'] || {};
            if (langBtn && localized.btn) langBtn.textContent = localized.btn;
            if (heroTitle) {
                if (localized.titleKey) heroTitle.textContent = t(localized.titleKey);
                else if (localized.title) heroTitle.textContent = localized.title;
            }
            if (heroDate) {
                if (localized.dateKey) heroDate.textContent = t(localized.dateKey);
                else if (localized.date) heroDate.textContent = localized.date;
            }
            if (heroDesc) {
                if (localized.descKey) heroDesc.textContent = t(localized.descKey);
                else if (localized.desc) heroDesc.textContent = localized.desc;
            }
            if (pageTitle) {
                if (localized.pageTitleKey) document.title = t(localized.pageTitleKey);
                else if (localized.pageTitle) document.title = localized.pageTitle;
            }

            if (mdViewer && localized.src && mdViewer.getAttribute('src') !== localized.src) {
                mdViewer.setAttribute('src', localized.src);
            }
        }

        /* Synchronize Apple Native Back Button Text */
        const navBackText = document.getElementById('nav-back-text');
        const navBackLink = document.getElementById('nav-back-link');
        const desktopBackText = document.querySelector('.top-back-btn span');
        let mobileBackLabel = '';
        let desktopBackLabel = '';

        if (navBackLink) {
            const explicitTc = navBackLink.getAttribute('data-back-text-tc');
            const explicitSc = navBackLink.getAttribute('data-back-text-sc');
            if (explicitTc && explicitSc) {
                mobileBackLabel = isTraditional ? explicitTc : explicitSc;
            }
        }

        const backMeta = getBackNavMeta(window.location.href);
        if (!mobileBackLabel) mobileBackLabel = t(backMeta.mobileKey);
        desktopBackLabel = t(backMeta.desktopKey);

        if (navBackText && !navBackText.hasAttribute('data-i18n')) {
            navBackText.textContent = mobileBackLabel;
        }
        if (desktopBackText && !desktopBackText.hasAttribute('data-i18n')) {
            desktopBackText.textContent = desktopBackLabel;
        }

        /* Synchronize Apple Native Frosted Top Navigation Bar Title */
        const topNavTitle = document.getElementById('top-nav-title');
        if (topNavTitle && !topNavTitle.hasAttribute('data-i18n')) {
            const localized = texts ? texts[isTraditional ? 'tc' : 'sc'] : null;
            const routeTitleKey = getPageTopTitleKey(window.location.href);
            if (localized && localized.titleKey) {
                topNavTitle.textContent = t(localized.titleKey);
            } else if (localized && localized.title) {
                topNavTitle.textContent = localized.title;
            } else if (routeTitleKey) {
                topNavTitle.textContent = t(routeTitleKey);
            }
        }
    }

    /* Native navigation via href is used for nav-back-link to ensure reliable transitions */

    /* Global Language Synchronization Listener */
    window.addEventListener('sys-lang-change', (e) => {
        if (e.detail && e.detail.lang) {
            isTraditional = e.detail.lang === 'tc';
            updateContent();
        }
    }, { signal: pageSignal });

    if (langBtn) {
        langBtn.addEventListener('click', () => {
            isTraditional = !isTraditional;
            setGlobalLang(isTraditional ? 'tc' : 'sc');
            updateContent();
        }, { signal: pageSignal });
    }

    function handleMarkdownRendered() {
        if (container) {
            hideActivityIndicator(container);
            container.classList.add('loaded');
        }
        if (mdViewer && mdViewer.shadowRoot) {
            const links = mdViewer.shadowRoot.querySelectorAll('a');
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('http')) {
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                }
            });
        }
        if (typeof onRendered === 'function') {
            onRendered({ isTraditional, mdViewer });
        }
    }

    if (mdViewer) {
        mdViewer.addEventListener('zero-md-rendered', handleMarkdownRendered, { signal: pageSignal });
        if (mdViewer.shadowRoot && mdViewer.shadowRoot.querySelector('.markdown-body')) {
            handleMarkdownRendered();
        }
    }

    /* Page Navigation & Back Transition is handled by initIOSNavTransition */

    /* Theme Switcher for Zero-MD */
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: light)');
    function applyMarkdownTemplateTheme() {
        if (!mdViewer) return;
        const isLight = colorSchemeQuery.matches;
        const template = mdViewer.querySelector('template');
        if (template) {
            const link = template.content.querySelector('link');
            if (link) {
                link.href = isLight
                    ? basePath + 'css/github-markdown.css'
                    : basePath + 'css/github-markdown-dark.css';
            }
            const style = template.content.querySelector('style');
            if (style) {
                style.textContent = getMarkdownStyles(isLight);
            }
        }
    }

    function updateMarkdownTheme() {
        if (!mdViewer) return;
        applyMarkdownTemplateTheme();
        const fallbackSrc = mdViewer.getAttribute('src');
        if (fallbackSrc) {
            mdViewer.removeAttribute('src');
            requestAnimationFrame(() => {
                if (pageSignal.aborted) return;
                const liveSrc = mdViewer.getAttribute('src') || fallbackSrc;
                mdViewer.setAttribute('src', liveSrc);
            });
        }
    }

    colorSchemeQuery.addEventListener('change', updateMarkdownTheme, { signal: pageSignal });
    if (colorSchemeQuery.matches) {
        applyMarkdownTemplateTheme();
    }

    /* Initial Render */
    updateContent();

    /* Initialize iOS Native Navigation Slide-Out Animation & Edge-Swipe Gesture */
    initIOSNavTransition();

    return {
        isTraditional: () => isTraditional,
        setTraditional: (val) => {
            isTraditional = !!val;
            updateContent();
        },
        updateContent
    };
}
