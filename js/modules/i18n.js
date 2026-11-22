/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Internationalization Module (i18n.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import tcLocale from './i18n/locales/tc.js';
import scLocale from './i18n/locales/sc.js';

export const STORAGE_KEY = 'sys_memorial_lang';
export const DEFAULT_LANG = 'tc';

/* ============================================================================
 * Registry & Cached State Management
 * ============================================================================ */
const registry = new Map();
const aliasMap = new Map();
let initialized = false;
let cachedMode = null;
let cachedEffectiveLang = null;

/* Register bundled or dynamically loaded locale packs */
export function registerLocale(locale) {
    if (!locale || !locale.code || !locale.translations) return;

    registry.set(locale.code, locale);
    aliasMap.set(locale.code.toLowerCase(), locale.code);

    if (Array.isArray(locale.aliases)) {
        locale.aliases.forEach((alias) => {
            aliasMap.set(alias.toLowerCase(), locale.code);
        });
    }

    if (initialized) {
        applyTranslations();
    }
}

/* Register default bundled locales */
registerLocale(tcLocale);
registerLocale(scLocale);

/* ============================================================================
 * Alias Resolution Engine
 * ============================================================================ */
export function resolveLocaleCode(input) {
    if (!input || typeof input !== 'string') return DEFAULT_LANG;
    const normalized = input.trim().toLowerCase();

    if (aliasMap.has(normalized)) {
        return aliasMap.get(normalized);
    }

    const prefix = normalized.split(/[-_]/)[0];
    if (aliasMap.has(prefix)) {
        return aliasMap.get(prefix);
    }

    return registry.has(DEFAULT_LANG) ? DEFAULT_LANG : (registry.keys().next().value || DEFAULT_LANG);
}

/* ============================================================================
 * Browser Fingerprint Language Detection (BCP-47 Subtag Parsing)
 * ============================================================================ */
const TRADITIONAL_SUBTAGS = new Set(['tw', 'hk', 'mo', 'hant', 'cht']);
const SIMPLIFIED_SUBTAGS = new Set(['cn', 'sg', 'hans', 'chs']);

export function detectBrowserLanguage() {
    if (typeof navigator === 'undefined') return DEFAULT_LANG;

    const navLanguages = (Array.isArray(navigator.languages) && navigator.languages.length > 0)
        ? navigator.languages
        : [
            navigator.language ||
            navigator.userLanguage ||
            navigator.browserLanguage ||
            ''
        ];

    for (const rawLang of navLanguages) {
        if (!rawLang || typeof rawLang !== 'string') continue;
        const parts = rawLang.trim().toLowerCase().split(/[-_]/).filter(Boolean);
        if (parts.length === 0) continue;

        if (parts.some((p) => TRADITIONAL_SUBTAGS.has(p))) {
            return 'tc';
        }

        if (parts.some((p) => SIMPLIFIED_SUBTAGS.has(p))) {
            return 'sc';
        }

        if (parts[0] === 'zh') {
            try {
                const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
                if (/Taipei|Hong_Kong|Macau/i.test(timeZone)) {
                    return 'tc';
                }
                if (/Shanghai|Chongqing|Urumqi|Harbin|Beijing/i.test(timeZone)) {
                    return 'sc';
                }
            } catch (e) {
                /* Ignore timezone resolution failure */
            }
            return DEFAULT_LANG;
        }
    }

    return DEFAULT_LANG;
}

/* ============================================================================
 * Language Preference Mode & Effective Language Getters (Memoized)
 * ============================================================================ */
function computeLanguageMode() {
    /* 1. URL parameter override takes immediate precedence */
    if (typeof window !== 'undefined' && window.location) {
        try {
            const params = new URLSearchParams(window.location.search);
            const urlLang = params.get('lang');
            if (urlLang === 'auto' || urlLang === 'tc' || urlLang === 'sc') {
                return urlLang;
            }
        } catch (e) {
            /* Ignore URL parsing error */
        }
    }

    /* 2. Stored user preference */
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'tc' || stored === 'sc' || stored === 'auto') {
            return stored;
        }
    } catch (e) {
        /* LocalStorage access may fail in restricted iframe environments */
    }

    return 'auto';
}

function syncDocumentLanguageAttributes(effectiveLang) {
    if (typeof document === 'undefined' || !document.documentElement) return;
    document.documentElement.lang = (effectiveLang === 'tc') ? 'zh-TW' : 'zh-CN';
    document.documentElement.dataset.lang = effectiveLang;
}

export function refreshLanguageCache() {
    cachedMode = computeLanguageMode();
    cachedEffectiveLang = (cachedMode === 'auto')
        ? detectBrowserLanguage()
        : resolveLocaleCode(cachedMode);
    syncDocumentLanguageAttributes(cachedEffectiveLang);
    return cachedEffectiveLang;
}

export function getLanguageMode() {
    if (cachedMode === null) {
        refreshLanguageCache();
    }
    return cachedMode;
}

export function getCurrentLang() {
    if (cachedEffectiveLang === null) {
        refreshLanguageCache();
    }
    return cachedEffectiveLang;
}

/* ============================================================================
 * Global Language Setter & Event Broadcaster
 * ============================================================================ */
function emitLanguageChange(effectiveLang, mode) {
    if (typeof window === 'undefined') return;
    try {
        window.dispatchEvent(new CustomEvent('sys-lang-change', {
            detail: {
                lang: effectiveLang,
                mode,
                isTraditional: effectiveLang === 'tc',
                locale: effectiveLang
            }
        }));
    } catch (e) {
        /* Ignore event dispatch errors */
    }
}

export function setGlobalLang(input) {
    let mode = 'auto';
    if (input === 'tc' || input === 'sc' || input === 'auto') {
        mode = input;
    } else if (typeof input === 'string') {
        const resolved = resolveLocaleCode(input);
        mode = (resolved === 'tc' || resolved === 'sc') ? resolved : 'auto';
    }

    try {
        localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {
        /* Silently catch storage write exceptions */
    }

    cachedMode = mode;
    cachedEffectiveLang = (mode === 'auto')
        ? detectBrowserLanguage()
        : resolveLocaleCode(mode);

    syncDocumentLanguageAttributes(cachedEffectiveLang);
    applyTranslations();
    syncTabBarLabels();
    emitLanguageChange(cachedEffectiveLang, mode);
}

/* ============================================================================
 * Translation Lookup with Parameter Interpolation {0}, {1}
 * ============================================================================ */
function hasTranslation(key) {
    if (!key) return false;
    const current = getCurrentLang();
    const activeDict = registry.get(current)?.translations;
    const fallbackDict = registry.get(DEFAULT_LANG)?.translations || registry.values().next().value?.translations;
    return (activeDict && typeof activeDict[key] === 'string') ||
           (fallbackDict && typeof fallbackDict[key] === 'string');
}

export function t(key, ...args) {
    if (!key) return '';

    const current = getCurrentLang();
    const activeDict = registry.get(current)?.translations;
    const fallbackDict = registry.get(DEFAULT_LANG)?.translations || registry.values().next().value?.translations;

    let str = (activeDict && typeof activeDict[key] === 'string')
        ? activeDict[key]
        : ((fallbackDict && typeof fallbackDict[key] === 'string') ? fallbackDict[key] : key);

    if (args.length > 0 && typeof str === 'string') {
        args.forEach((arg, i) => {
            str = str.replace(new RegExp(`\\{${i}\\}`, 'g'), String(arg !== undefined ? arg : ''));
        });
    }

    return str;
}

/* ============================================================================
 * Declarative DOM Localizer
 * ============================================================================ */
export function applyTranslations(root = (typeof document !== 'undefined' ? document : null)) {
    if (!root) return;

    const currentLang = getCurrentLang();
    syncDocumentLanguageAttributes(currentLang);

    /* 1. Text Content (including <title data-i18n="...">) */
    root.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (!hasTranslation(key)) return;
        const translated = t(key);
        if (el.tagName === 'TITLE') {
            document.title = translated;
        } else {
            el.textContent = translated;
        }
    });

    /* 2. Input Placeholders */
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (hasTranslation(key)) {
            el.setAttribute('placeholder', t(key));
        }
    });

    /* 3. Title Tooltips */
    root.querySelectorAll('[data-i18n-title]').forEach((el) => {
        const key = el.getAttribute('data-i18n-title');
        if (hasTranslation(key)) {
            el.setAttribute('title', t(key));
        }
    });

    /* 4. Accessibility aria-label */
    root.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
        const key = el.getAttribute('data-i18n-aria-label');
        if (hasTranslation(key)) {
            el.setAttribute('aria-label', t(key));
        }
    });

    /* 5. Image alt attributes */
    root.querySelectorAll('[data-i18n-alt]').forEach((el) => {
        const key = el.getAttribute('data-i18n-alt');
        if (hasTranslation(key)) {
            el.setAttribute('alt', t(key));
        }
    });

    /* 6. Explicit Page Title Key */
    const pageTitleEl = root.querySelector('[data-page-title-key]');
    if (pageTitleEl) {
        const key = pageTitleEl.getAttribute('data-page-title-key');
        if (hasTranslation(key)) {
            document.title = t(key);
        }
    }
}

/* ============================================================================
 * Tab Bar Bilingual Label Synchronizer
 * ============================================================================ */
const TAB_IDS = ['home', 'announcement', 'library', 'settings'];

export function syncTabBarLabels(rootEl = (typeof document !== 'undefined' ? document : null)) {
    if (!rootEl) return;

    const navEl = rootEl.matches?.('#apple-tab-bar') ? rootEl : rootEl.querySelector?.('#apple-tab-bar');
    if (navEl) {
        navEl.setAttribute('aria-label', t('tab.aria_nav'));
    }

    TAB_IDS.forEach((id) => {
        const label = t(`tab.${id}`);
        const itemEl = rootEl.querySelector?.(`[data-tab-id="${id}"]`);
        if (itemEl) {
            itemEl.setAttribute('aria-label', label);
            const labelEl = itemEl.querySelector('.tab-label');
            if (labelEl) {
                labelEl.textContent = label;
            }
        }
    });
}

/* ============================================================================
 * Engine Object & Global Lifecycle Listeners
 * ============================================================================ */
export function getAvailableLanguages() {
    return Array.from(registry.values()).map((l) => ({
        code: l.code,
        name: l.name || l.code
    }));
}

const i18nEngine = {
    t,
    register: registerLocale,
    setGlobalLang,
    getLanguageMode,
    getCurrentLang,
    refreshLanguageCache,
    detectBrowserLanguage,
    getAvailableLanguages,
    applyTranslations,
    resolveLocaleCode,
    syncTabBarLabels,
    STORAGE_KEY,
    DEFAULT_LANG
};

if (typeof window !== 'undefined') {
    window.addEventListener('languagechange', () => {
        if (getLanguageMode() === 'auto') {
            const effectiveLang = refreshLanguageCache();
            applyTranslations();
            syncTabBarLabels();
            emitLanguageChange(effectiveLang, 'auto');
        }
    });

    window.addEventListener('popstate', () => {
        const prevLang = cachedEffectiveLang;
        const effectiveLang = refreshLanguageCache();
        if (effectiveLang !== prevLang) {
            applyTranslations();
            syncTabBarLabels();
            emitLanguageChange(effectiveLang, getLanguageMode());
        }
    });

    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
            const effectiveLang = refreshLanguageCache();
            applyTranslations();
            syncTabBarLabels();
            emitLanguageChange(effectiveLang, getLanguageMode());
        }
    });

    globalThis.t = t;
    globalThis.setGlobalLang = setGlobalLang;
    globalThis.getCurrentLang = getCurrentLang;
    globalThis.getLanguageMode = getLanguageMode;
    globalThis.i18n = i18nEngine;
}

if (typeof document !== 'undefined') {
    refreshLanguageCache();
    initialized = true;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            applyTranslations();
            syncTabBarLabels();
        });
    } else {
        applyTranslations();
        syncTabBarLabels();
    }
}

export default i18nEngine;
