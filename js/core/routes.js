/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Canonical Route Registry (routes.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

/* ============================================================================
 * Site Root Base Resolution
 * ============================================================================ */
function computeSiteBaseUrl() {
    if (typeof window === 'undefined') return '';
    const loc = window.location;
    const path = loc.pathname;
    const markerRegex = new RegExp('^(.*\\/)(?:pages|events|captcha|main|css|js)\\/', 'i');
    const match = path.match(markerRegex);
    if (match) {
        return new URL(match[1], loc.origin).href;
    }
    const dir = path.substring(0, path.lastIndexOf('/') + 1);
    return new URL(dir || '/', loc.origin).href;
}

const SITE_BASE_URL = computeSiteBaseUrl();

export function getSiteBaseUrl() {
    return SITE_BASE_URL;
}

/* Resolve a site-root-relative path to an absolute URL */
export function resolveSiteUrl(relPath) {
    if (!SITE_BASE_URL) return relPath;
    return new URL(relPath, SITE_BASE_URL).href;
}

/* ============================================================================
 * Canonical Route & Tab Definitions
 * ============================================================================ */
export const ROUTES = {
    home: 'index.html',
    announcement: 'pages/announcement/announcement.html',
    announcementDetail: 'pages/announcement/detail.html',
    library: 'pages/library/library.html',
    settings: 'pages/settings/settings.html',
    language: 'pages/library/language.html',
    about: 'pages/about/about.html',
    aboutDetail: 'pages/about/detail.html',
    thanks: 'pages/thanks/thanks.html',
    biography: 'pages/biography/biography.html',
    biographyDetail: 'pages/biography/detail.html',
    xinhai: 'events/xinhai/xinhai.html',
    whampoa: 'events/whampoa/whampoa.html',
    mayfourth: 'events/mayfourth/mayfourth.html',
    militaries: 'events/militaries/militaries.html',
    yatsenBirth: 'events/yatsen/yatsen-birth.html',
    yatsenPassing: 'events/yatsen/yatsen-passing.html'
};

export const CANONICAL_TAB_ROUTES = {
    home: ROUTES.home,
    announcement: ROUTES.announcement,
    library: ROUTES.library,
    settings: ROUTES.settings
};

/* ============================================================================
 * Desktop Global Search Index
 * ============================================================================ */
export const SEARCH_INDEX = [
    {
        id: 'home',
        titleKey: 'search.home_title',
        categoryKey: 'search.cat_home',
        url: ROUTES.home,
        icon: '🏛️',
        keywords: ['主頁', '主页', '行禮', '行礼', '遺像', '遗像', '遺囑', '遗嘱', '三鞠躬', '首頁', '首页']
    },
    {
        id: 'announcement',
        titleKey: 'search.announcement_title',
        categoryKey: 'search.cat_announcement',
        url: ROUTES.announcement,
        icon: '📢',
        keywords: ['公告', '動態', '动态', '最新', '通知', '開放', '开放', '系統', '系统']
    },
    {
        id: 'library',
        titleKey: 'search.library_title',
        categoryKey: 'search.cat_library',
        url: ROUTES.library,
        icon: '📚',
        keywords: ['資料庫', '数据库', '文獻', '文献', '檔案', '档案', '史料']
    },
    {
        id: 'biography',
        titleKey: 'search.biography_title',
        categoryKey: 'search.cat_biography',
        url: ROUTES.biography,
        icon: '📜',
        keywords: ['生平', '傳記', '传记', '年譜', '年谱', '孫中山', '孙中山', '孫文', '孙文', '總理', '总理', '三民主義', '三民主义']
    },
    {
        id: 'xinhai',
        titleKey: 'search.xinhai_title',
        categoryKey: 'search.cat_exhibit',
        url: ROUTES.xinhai,
        icon: '⚔️',
        keywords: ['辛亥', '革命', '武昌', '起義', '起义', '共和', '中華民國', '中华民国', '推翻帝制']
    },
    {
        id: 'whampoa',
        titleKey: 'search.whampoa_title',
        categoryKey: 'search.cat_exhibit',
        url: ROUTES.whampoa,
        icon: '🎖️',
        keywords: ['黃埔', '黄埔', '軍校', '军校', '建軍', '建军', '校歌', '東征', '东征', '北伐', '陸軍', '陆军']
    },
    {
        id: 'mayfourth',
        titleKey: 'search.mayfourth_title',
        categoryKey: 'search.cat_exhibit',
        url: ROUTES.mayfourth,
        icon: '🕊️',
        keywords: ['五四', '運動', '运动', '新文化', '德先生', '賽先生', '赛先生', '青年', '學生', '学生']
    },
    {
        id: 'militaries',
        titleKey: 'search.militaries_title',
        categoryKey: 'search.cat_exhibit',
        url: ROUTES.militaries,
        icon: '🛡️',
        keywords: ['軍事', '军事', '抗戰', '抗战', '三軍', '三军', '勝利', '胜利', '國軍', '国军']
    },
    {
        id: 'yatsen-birth',
        titleKey: 'search.yatsen_birth_title',
        categoryKey: 'search.cat_memorial',
        url: ROUTES.yatsenBirth,
        icon: '🎂',
        keywords: ['誕辰', '诞辰', '生日', '11月12日', '十一月十二日']
    },
    {
        id: 'yatsen-passing',
        titleKey: 'search.yatsen_passing_title',
        categoryKey: 'search.cat_memorial',
        url: ROUTES.yatsenPassing,
        icon: '🌲',
        keywords: ['逝世', '3月12日', '三月十二日', '植樹節', '植树节']
    },
    {
        id: 'language',
        titleKey: 'search.language_title',
        categoryKey: 'search.cat_settings',
        url: ROUTES.language,
        icon: '🌐',
        keywords: ['語言', '语言', '繁體', '繁体', '簡體', '简体', '正體', '正体', '字體', '字体']
    },
    {
        id: 'settings',
        titleKey: 'search.settings_title',
        categoryKey: 'search.cat_settings',
        url: ROUTES.settings,
        icon: '⚙️',
        keywords: ['設定', '设置', '偏好', '系統', '系统']
    },
    {
        id: 'about',
        titleKey: 'search.about_title',
        categoryKey: 'search.cat_about',
        url: ROUTES.about,
        icon: 'ℹ️',
        keywords: ['關於', '关于', '聲明', '声明', '本館', '本馆', '宗旨', '更新日誌', '更新日志']
    },
    {
        id: 'thanks',
        titleKey: 'search.thanks_title',
        categoryKey: 'search.cat_thanks',
        url: ROUTES.thanks,
        icon: '🙏',
        keywords: ['鳴謝', '鸣谢', '感謝', '感谢', '貢獻', '贡献', '志工', '名錄', '名录']
    }
];

/* ============================================================================
 * Path Normalization & Classification Helpers
 * ============================================================================ */
function extractPathname(urlOrPath) {
    if (!urlOrPath) {
        return typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
    }
    if (typeof window === 'undefined') {
        return String(urlOrPath).split(/[?#]/)[0].toLowerCase();
    }
    try {
        return new URL(urlOrPath, window.location.href).pathname.toLowerCase();
    } catch (e) {
        return String(urlOrPath).toLowerCase();
    }
}

/* Map URL to canonical sidebar tab ID */
export function getTabFromUrl(urlOrPath) {
    const path = extractPathname(urlOrPath);
    if (path.includes('/biography/')) return 'biography';
    if (path.includes('/events/xinhai/')) return 'xinhai';
    if (path.includes('/events/whampoa/')) return 'whampoa';
    if (path.includes('/events/mayfourth/')) return 'mayfourth';
    if (path.includes('/events/militaries/')) return 'militaries';
    if (path.includes('/events/yatsen/yatsen-birth.html')) return 'yatsen-birth';
    if (path.includes('/events/yatsen/yatsen-passing.html')) return 'yatsen-passing';
    if (path.includes('/pages/library/language.html')) return 'settings';
    if (path.includes('/pages/library/')) return 'library';
    if (path.includes('/pages/settings/')) return 'settings';
    if (path.includes('/pages/about/') || path.includes('/pages/thanks/')) return 'settings';
    if (path.includes('/pages/announcement/')) return 'announcement';
    if (path.includes('index.html') || path.endsWith('/') || path.endsWith('/sys-memorial/')) return 'home';
    return null;
}

/* Determine whether the current or provided path is a pushed subpage */
export function isSubpageRoute(pathname) {
    const p = extractPathname(pathname);
    if (p.includes('/detail.html') ||
        p.includes('/biography/') ||
        p.includes('/events/') ||
        p.includes('/about/') ||
        p.includes('/thanks/') ||
        p.includes('/language.html')) {
        return true;
    }
    if (!pathname && typeof document !== 'undefined') {
        if (document.body && (document.body.classList.contains('is-subpage') || document.body.classList.contains('page-subpage'))) {
            return true;
        }
        if (document.querySelector('.nav-back-link')) {
            return true;
        }
    }
    return false;
}

/* Determine whether URL points to a second-level detail subpage */
export function isDetailSubpage(urlOrPath) {
    const path = extractPathname(urlOrPath);
    return path.includes('/pages/announcement/detail.html') ||
           path.includes('/pages/about/detail.html') ||
           path.includes('/pages/biography/detail.html');
}

/* Resolve i18n keys for mobile and desktop back buttons */
export function getBackNavMeta(urlOrPath) {
    const path = extractPathname(urlOrPath);
    if (path.includes('/pages/about/detail.html')) {
        return { mobileKey: 'nav.back_about', desktopKey: 'nav.back_about' };
    }
    if (path.includes('/pages/biography/detail.html')) {
        return { mobileKey: 'nav.back_biography', desktopKey: 'nav.back_biography' };
    }
    if (path.includes('/pages/announcement/detail.html')) {
        return { mobileKey: 'nav.back_announcement', desktopKey: 'nav.back_announcement_desktop' };
    }
    if (path.includes('/events/') || path.includes('/pages/biography/')) {
        return { mobileKey: 'nav.back_library', desktopKey: 'nav.back_library_desktop' };
    }
    if (path.includes('/pages/about/') || path.includes('/pages/thanks/') || path.includes('/pages/library/language.html')) {
        return { mobileKey: 'nav.back_settings', desktopKey: 'nav.back_settings_desktop' };
    }
    return { mobileKey: 'nav.back_default', desktopKey: 'nav.back_default' };
}

/* Resolve fallback i18n top navigation bar title key by URL */
export function getPageTopTitleKey(urlOrPath) {
    const path = extractPathname(urlOrPath);
    if (path.includes('/about/')) return 'about.top_title';
    if (path.includes('/thanks/')) return 'thanks.top_title';
    if (path.includes('/biography/')) return 'biography.top_title';
    if (path.includes('/announcement/')) return 'announcement.top_title';
    if (path.includes('/library/language.html')) return 'language.top_title';
    if (path.includes('/library/')) return 'library.top_title';
    return null;
}
