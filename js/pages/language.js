/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Language Preferences Page Controller
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import { initSubpage } from '../subpage.js';
import { getCurrentLang, getLanguageMode, setGlobalLang, t } from '../modules/i18n.js';
import { getPageSignal } from '../core/lifecycle.js';

function syncLanguageRows() {
    const mode = getLanguageMode();
    const effectiveLang = getCurrentLang();
    const isTc = effectiveLang === 'tc';

    const rowAuto = document.getElementById('lang-row-auto');
    const rowTc = document.getElementById('lang-row-tc');
    const rowSc = document.getElementById('lang-row-sc');
    const autoDesc = document.getElementById('lang-auto-desc');

    if (rowAuto) rowAuto.classList.toggle('selected', mode === 'auto');
    if (rowTc) rowTc.classList.toggle('selected', mode === 'tc');
    if (rowSc) rowSc.classList.toggle('selected', mode === 'sc');

    if (autoDesc) {
        const effectiveName = isTc ? t('language.opt_tc_title') : t('language.opt_sc_title');
        autoDesc.textContent = t('language.opt_auto_current', effectiveName);
    }
}

export function init() {
    const pageSignal = getPageSignal();

    initSubpage({
        activeBottomTab: 'settings',
        basePath: '../../'
    });

    syncLanguageRows();

    const rowMap = [
        { id: 'lang-row-auto', mode: 'auto' },
        { id: 'lang-row-tc', mode: 'tc' },
        { id: 'lang-row-sc', mode: 'sc' }
    ];

    rowMap.forEach(({ id, mode }) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', () => {
                setGlobalLang(mode);
                syncLanguageRows();
            }, { signal: pageSignal });
        }
    });

    window.addEventListener('sys-lang-change', () => {
        syncLanguageRows();
    }, { signal: pageSignal });
}
