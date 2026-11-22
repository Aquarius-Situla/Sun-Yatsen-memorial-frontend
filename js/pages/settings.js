/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Settings Hub Page Controller
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import { initSubpage } from '../subpage.js';
import { getCurrentLang, getLanguageMode, t } from '../modules/i18n.js';
import { getPageSignal } from '../core/lifecycle.js';

function updateCurrentLangLabel(lang) {
    const currentLangText = document.getElementById('current-lang-text');
    if (!currentLangText) return;

    const mode = getLanguageMode();
    if (mode === 'auto') {
        currentLangText.textContent = (lang === 'tc')
            ? t('settings.val_lang_auto_tc')
            : t('settings.val_lang_auto_sc');
    } else {
        currentLangText.textContent = (lang === 'tc')
            ? t('settings.val_lang_tc')
            : t('settings.val_lang_sc');
    }
}

export function init() {
    initSubpage({
        activeBottomTab: 'settings',
        basePath: '../../'
    });

    updateCurrentLangLabel(getCurrentLang());

    window.addEventListener('sys-lang-change', (e) => {
        const lang = (e.detail && e.detail.lang) ? e.detail.lang : getCurrentLang();
        updateCurrentLangLabel(lang);
    }, { signal: getPageSignal() });
}
