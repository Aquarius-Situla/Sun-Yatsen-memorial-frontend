/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — About & Legal Detail Controller
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import { initSubpage } from '../subpage.js';
import { resolveSiteUrl } from '../core/routes.js';

const DOC_CONFIGS = {
    about: {
        titleKey: 'about.tab_about',
        pageTitleKey: 'about.doc_about_page_title',
        tcPath: 'pages/about/about_tc.md',
        scPath: 'pages/about/about_sc.md'
    },
    changelog: {
        titleKey: 'about.tab_changelog',
        pageTitleKey: 'about.doc_changelog_page_title',
        tcPath: 'pages/about/changelog_tc.md',
        scPath: 'pages/about/changelog_sc.md'
    },
    etiquette: {
        titleKey: 'about.row_etiquette',
        pageTitleKey: 'about.doc_etiquette_page_title',
        tcPath: 'pages/about/etiquette_tc.md',
        scPath: 'pages/about/etiquette_sc.md'
    },
    disclaimer: {
        titleKey: 'about.row_disclaimer',
        pageTitleKey: 'about.doc_disclaimer_page_title',
        tcPath: 'pages/about/disclaimer_tc.md',
        scPath: 'pages/about/disclaimer_sc.md'
    },
    license: {
        titleKey: 'about.row_license',
        pageTitleKey: 'about.doc_license_page_title',
        tcPath: 'pages/about/license_tc.md',
        scPath: 'pages/about/license_sc.md'
    }
};

export function init() {
    const params = new URLSearchParams(window.location.search);
    const rawDoc = params.get('doc') || (params.get('tab') === 'changelog' ? 'changelog' : 'about');
    const docKey = rawDoc.toLowerCase();
    const config = DOC_CONFIGS[docKey] || DOC_CONFIGS.about;

    const pageTitleEl = document.getElementById('page-title');
    const topNavTitleEl = document.getElementById('top-nav-title');
    if (pageTitleEl) pageTitleEl.setAttribute('data-i18n', config.pageTitleKey);
    if (topNavTitleEl) topNavTitleEl.setAttribute('data-i18n', config.titleKey);

    initSubpage({
        activeBottomTab: 'settings',
        basePath: '../../',
        texts: {
            tc: {
                titleKey: config.titleKey,
                pageTitleKey: config.pageTitleKey,
                src: resolveSiteUrl(config.tcPath)
            },
            sc: {
                titleKey: config.titleKey,
                pageTitleKey: config.pageTitleKey,
                src: resolveSiteUrl(config.scPath)
            }
        }
    });
}
