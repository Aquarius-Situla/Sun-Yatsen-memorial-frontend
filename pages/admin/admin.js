/* ============================================================================
 * Admin Dashboard Logic
 * ============================================================================ */

import { t, applyTranslations, getCurrentLang } from '../../js/modules/i18n.js';

const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('admin-password');

let captchaSuccessCallback = null;

/* Listen for iframe success message. */
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CAPTCHA_SUCCESS') {
        const overlay = document.getElementById('captcha-modal-overlay');
        if (overlay) overlay.style.display = 'none';
        
        if (captchaSuccessCallback) {
            const cb = captchaSuccessCallback;
            captchaSuccessCallback = null;
            setTimeout(cb, 300);
        }
    }
});

function showCaptcha(onSuccessCallback) {
    const isDev = localStorage.getItem('developer_mode') === 'true';
    
    if (isDev) {
        if (onSuccessCallback) {
            setTimeout(onSuccessCallback, 100);
        }
        return;
    }

    const overlay = document.getElementById('captcha-modal-overlay');
    const iframe = document.getElementById('captcha-iframe');
    
    if (!overlay || !iframe) {
        return;
    }
    
    captchaSuccessCallback = onSuccessCallback;
    
    /* Reload iframe to obtain a fresh Captcha challenge. */
    iframe.src = iframe.src;
    overlay.style.display = 'flex';
}

/* ============================================================================
 * Login Logic
 * ============================================================================ */
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        /* Trigger Captcha before actual login attempt. */
        const submitBtn = loginForm.querySelector('button');
        const oldText = submitBtn.textContent;
        submitBtn.textContent = t('admin.verifying');
        submitBtn.disabled = true;

        showCaptcha(async () => {
            const pwd = passwordInput.value.trim();
            if (!pwd) {
                showToast(t('admin.enter_password'));
                submitBtn.textContent = oldText;
                submitBtn.disabled = false;
                return;
            }
            
            /* Hash password and attempt login. */
            try {
                submitBtn.textContent = t('admin.logging_in');
                const tempKey = await hashSHA256(pwd);
                
                const res = await fetch(WORKER_API + '/admin/config', {
                    headers: { 'X-Admin-Key': tempKey },
                    cache: 'no-store'
                });
                
                if (res.ok) {
                    adminKey = tempKey;
                    localStorage.setItem('danmaku_admin_key', adminKey);
                    showDashboard();
                } else {
                    showToast(t('admin.wrong_password'));
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            } catch (err) {
                if (err.message === "INSECURE_CONTEXT") {
                    showToast(t('admin.insecure_context'));
                } else {
                    showToast(t('admin.network_retry'));
                }
            } finally {
                submitBtn.textContent = t('admin.login_btn');
                submitBtn.disabled = false;
            }
        });
        
        /*
         * Reset submit button if the user closes captcha without solving
         * by monitoring modal overlay display attribute changes.
         */
        const overlay = document.getElementById('captcha-modal-overlay');
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'style') {
                    if (overlay.style.display === 'none') {
                        submitBtn.textContent = t('admin.login_btn');
                        submitBtn.disabled = false;
                    }
                }
            });
        });
        if (overlay) observer.observe(overlay, { attributes: true });
    });
}

/* ============================================================================
 * Cryptographic Utilities
 * ============================================================================ */

/* SHA-256 helper function for secure credential transport. */
async function hashSHA256(message) {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error("INSECURE_CONTEXT");
    }
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const danmakuList = document.getElementById('danmaku-list');
const totalCount = document.getElementById('total-count');
const refreshBtn = document.getElementById('refresh-btn');
const logoutBtn = document.getElementById('logout-btn');
const whitelistToggle = document.getElementById('whitelist-toggle');
const autoWhitelistToggle = document.getElementById('auto-whitelist-toggle');
const autoWhitelistDatesContainer = document.getElementById('auto-whitelist-dates-container');
const autoWhitelistDates = document.getElementById('auto-whitelist-dates');

const baseCountDisplay = document.getElementById('base-count-display');
const privateCountDisplay = document.getElementById('private-count-display');
const baseUploadInput = document.getElementById('base-upload-input');
const privateUploadInput = document.getElementById('private-upload-input');

const aiToggle = document.getElementById('ai-toggle');
const aiChinaToggle = document.getElementById('ai-china-toggle');
const addAiBtn = document.getElementById('add-ai-btn');
const aiListContainer = document.getElementById('ai-list-container');
const addAiForm = document.getElementById('add-ai-form');

const aiEndpoint = document.getElementById('ai-endpoint');
const aiModel = document.getElementById('ai-model');
const aiKeys = document.getElementById('ai-keys');
const saveAiBtn = document.getElementById('save-ai-btn');
const cancelAiBtn = document.getElementById('cancel-ai-btn');

const llmCountDisplay = document.getElementById('llm-count-display');
const downloadLlmBtn = document.getElementById('download-llm-btn');
const clearLlmBtn = document.getElementById('clear-llm-btn');

const downloadJsonBtn = document.getElementById('download-json-btn');

const WORKER_API = (window.ENV && window.ENV.WORKER_API) ? window.ENV.WORKER_API : '';

let adminKey = localStorage.getItem('danmaku_admin_key');
let currentAiModels = [];
let currentLlmBlacklist = [];

/* ============================================================================
 * Toast Notification System
 * ============================================================================ */
let currentToast = null;
let toastTimeout = null;

function showToast(msg) {
    if (currentToast) {
        currentToast.innerText = msg;
        currentToast.classList.add('show');
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => { currentToast.classList.remove('show'); }, 3000);
        return;
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    document.body.appendChild(toast);
    currentToast = toast;

    /* Force DOM reflow to trigger CSS transition. */
    void toast.offsetWidth;
    toast.classList.add('show');
    toastTimeout = setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

/* ============================================================================
 * Export Utilities
 * ============================================================================ */

/* Export danmaku samples as JSON file. */
if (downloadJsonBtn) {
    downloadJsonBtn.addEventListener('click', () => {
        const list = window.currentDanmakuList || [];
        if (list.length === 0) {
            showToast(t('admin.no_danmaku_download'));
            return;
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(list, null, 2));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", `danmaku_samples_${new Date().getTime()}.json`);
        dlAnchorElem.click();
        dlAnchorElem.remove();
        showToast(t('admin.download_success'));
    });
}

/* Format timestamp into localized Chinese time string. */
function formatTime(timestamp) {
    const d = new Date(timestamp);
    const localeCode = getCurrentLang() === 'sc' ? 'zh-CN' : 'zh-TW';
    return d.toLocaleString(localeCode, {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

/* ============================================================================
 * Screen Navigation & Configuration Management
 * ============================================================================ */
function showDashboard() {
    loginScreen.classList.remove('active');
    dashboardScreen.classList.add('active');
    loadConfig();
    loadDanmaku();
}

async function loadConfig() {
    try {
        const res = await fetch(WORKER_API + '/admin/config', {
            headers: { 'X-Admin-Key': adminKey },
            cache: 'no-store'
        });
        if (res.ok) {
            const data = await res.json();
            whitelistToggle.checked = data.whitelistMode;
            
            if (autoWhitelistToggle) {
                autoWhitelistToggle.checked = !!data.autoWhitelistEnabled;
                autoWhitelistDatesContainer.style.display = data.autoWhitelistEnabled ? 'flex' : 'none';
                if (data.autoWhitelistDatesStr) {
                    autoWhitelistDates.value = data.autoWhitelistDatesStr;
                }
            }
            
            if (baseCountDisplay) baseCountDisplay.textContent = data.baseWordsCount || 0;
            if (privateCountDisplay) privateCountDisplay.textContent = data.privateWordsCount || 0;
            
            if (data.aiConfig) {
                if (aiToggle) aiToggle.checked = !!data.aiConfig.enabled;
                if (aiChinaToggle) aiChinaToggle.checked = !!data.aiConfig.chinaMode;
                currentAiModels = data.aiConfig.models || [];
                renderAiModels();
        
                if (data.aiLastLog) {
                    const logTimeEl = document.getElementById('ai-log-time');
                    document.getElementById('ai-debug-card').style.display = 'block';
                    if (logTimeEl) {
                        logTimeEl.removeAttribute('data-i18n');
                        logTimeEl.textContent = t('admin.ai_log_time_prefix') + new Date(data.aiLastLog.time).toLocaleString(getCurrentLang() === 'sc' ? 'zh-CN' : 'zh-TW');
                    }
                    document.getElementById('ai-log-text').textContent = data.aiLastLog.text;
                    document.getElementById('ai-log-reply').textContent = data.aiLastLog.reply;
                } else {
                    document.getElementById('ai-debug-card').style.display = 'none';
                }
            }
            
            currentLlmBlacklist = data.llmBannedWordsList || [];
            if (llmCountDisplay) llmCountDisplay.textContent = currentLlmBlacklist.length;
        }
    } catch (e) {
        console.error("Failed to load config:", e);
    }
}

whitelistToggle.addEventListener('change', async (e) => {
    const isEnabled = e.target.checked;
    /* Lock control while updating remote state. */
    e.target.disabled = true;
    try {
        const res = await fetch(WORKER_API + '/admin/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_key: adminKey,
                whitelistMode: isEnabled,
                autoWhitelistEnabled: autoWhitelistToggle ? autoWhitelistToggle.checked : false,
                autoWhitelistDatesStr: autoWhitelistDates ? autoWhitelistDates.value : ""
            })
        });
        const data = await res.json();
        if (data.success) {
            showToast(isEnabled ? t('admin.whitelist_on') : t('admin.whitelist_off'));

        } else {
            showToast(t('admin.setting_failed') + (data.error || t('admin.permission_denied')));
            /* Revert checkbox state upon failure. */
            e.target.checked = !isEnabled;
        }
    } catch (err) {
        showToast(t('admin.setting_network_failed'));
        /* Revert checkbox state upon network error. */
        e.target.checked = !isEnabled;
    } finally {
        e.target.disabled = false;
    }
});

/* ============================================================================
 * AI Model Configuration
 * ============================================================================ */
let editingAiIndex = -1;

if (addAiBtn) {
    addAiBtn.addEventListener('click', () => {
        if (addAiForm.style.display === 'none') {
            addAiForm.style.display = 'flex';
            editingAiIndex = -1;
            if (aiEndpoint) aiEndpoint.value = '';
            if (aiModel) aiModel.value = '';
            if (aiKeys) aiKeys.value = '';
            if (saveAiBtn) saveAiBtn.textContent = t('admin.ai_save_btn');
        } else {
            addAiForm.style.display = 'none';
        }
    });
}

/* Render configured AI models into container list. */
function renderAiModels() {
    if (!aiListContainer) return;
    aiListContainer.innerHTML = '';
    currentAiModels.forEach((model, index) => {
        const div = document.createElement('div');
        div.className = 'list-item';
        const keyCount = model.keys ? model.keys.split('\n').length : 0;
        div.innerHTML = `
            <div class="item-content" style="min-width: 0; overflow: hidden; padding-right: 8px;">
                <div class="item-text" style="font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${model.model || t('admin.ai_unknown_model')}</div>
                <div class="item-meta" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">
                    <span>${model.endpoint}</span>
                </div>
                <div class="item-meta"><span>${t('admin.ai_keys_bound', keyCount)}</span></div>
            </div>
            <div style="display: flex; gap: 8px; align-items: center; flex-shrink: 0;">
                <button style="background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 4px; display: flex; align-items: center; justify-content: center;" onclick="editAiModel(${index})" title="${t('admin.ai_edit_title')}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                </button>
                <button class="ios-btn destructive" onclick="deleteAiModel(${index})">${t('common.delete')}</button>
            </div>
        `;
        aiListContainer.appendChild(div);
    });
}

window.editAiModel = function(index) {
    editingAiIndex = index;
    const model = currentAiModels[index];
    if (aiEndpoint) aiEndpoint.value = model.endpoint || '';
    if (aiModel) aiModel.value = model.model || '';
    if (aiKeys) aiKeys.value = model.keys || '';
    if (addAiForm) addAiForm.style.display = 'flex';
    if (saveAiBtn) saveAiBtn.textContent = t('admin.ai_update_btn');
    /* Scroll smoothly to editor form. */
    if (addAiForm) addAiForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.deleteAiModel = function(index) {
    currentAiModels.splice(index, 1);
    if (editingAiIndex === index) {
        editingAiIndex = -1;
        if (addAiForm) addAiForm.style.display = 'none';
    }
    renderAiModels();
    saveConfig(true);
};

/* Persist updated configuration to Cloudflare Worker. */
async function saveConfig(silent = false) {
    const payload = {
        admin_key: adminKey,
        aiConfig: {
            enabled: aiToggle ? aiToggle.checked : false,
            chinaMode: aiChinaToggle ? aiChinaToggle.checked : false,
            models: currentAiModels
        }
    };
    try {
        const res = await fetch(WORKER_API + '/admin/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            if (!silent) showToast(t('admin.ai_save_success'));
        } else {
            if (!silent) showToast(t('admin.save_failed') + (data.error || t('admin.permission_denied')));
        }
    } catch (e) {
        if (!silent) showToast(t('admin.network_check'));
    }
}

/* Auto whitelist toggle listener. */
if (autoWhitelistToggle) {
    autoWhitelistToggle.addEventListener('change', (e) => {
        autoWhitelistDatesContainer.style.display = e.target.checked ? 'flex' : 'none';
        saveWhitelistConfig();
    });
}
if (autoWhitelistDates) {
    autoWhitelistDates.addEventListener('change', () => {
        saveWhitelistConfig();
    });
}

/* Developer mode toggle handler. */
const devModeToggle = document.getElementById('dev-mode-toggle');
if (devModeToggle) {
    devModeToggle.checked = localStorage.getItem('developer_mode') === 'true';
    devModeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            localStorage.setItem('developer_mode', 'true');
            showToast(t('admin.dev_mode_on'));
        } else {
            localStorage.removeItem('developer_mode');
            showToast(t('admin.dev_mode_off'));
        }
    });
}

async function saveWhitelistConfig() {
    try {
        await fetch(WORKER_API + '/admin/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_key: adminKey,
                whitelistMode: whitelistToggle.checked,
                autoWhitelistEnabled: autoWhitelistToggle.checked,
                autoWhitelistDatesStr: autoWhitelistDates.value
            })
        });
        showToast(t('admin.auto_whitelist_saved'));
    } catch(e) {
        showToast(t('admin.setting_network_failed'));
    }
}

/* AI switch toggle listeners. */
if (aiToggle) {
    aiToggle.addEventListener('change', (e) => {

        saveConfig(false);
    });
}
if (aiChinaToggle) {
    aiChinaToggle.addEventListener('change', () => saveConfig(false));
}

/* Save or update AI model configuration. */
if (saveAiBtn) {
    saveAiBtn.addEventListener('click', async () => {
        const ep = aiEndpoint.value.trim();
        const mod = aiModel.value.trim();
        const ks = aiKeys.value.trim();
        if (!ep || !mod || !ks) {
            showToast(t('admin.ai_fill_required'));
            return;
        }
        
        if (editingAiIndex >= 0 && editingAiIndex < currentAiModels.length) {
            /* Update existing model entry. */
            currentAiModels[editingAiIndex].endpoint = ep;
            currentAiModels[editingAiIndex].model = mod;
            currentAiModels[editingAiIndex].keys = ks;
        } else {
            /* Append new model entry. */
            currentAiModels.push({
                id: Date.now().toString(),
                endpoint: ep,
                model: mod,
                keys: ks
            });
        }
        
        aiEndpoint.value = '';
        aiModel.value = '';
        aiKeys.value = '';
        addAiForm.style.display = 'none';
        editingAiIndex = -1;
        if (saveAiBtn) saveAiBtn.textContent = t('admin.ai_save_btn');
        
        renderAiModels();
        saveConfig(false);
    });
}

if (cancelAiBtn) {
    cancelAiBtn.addEventListener('click', () => {
        aiEndpoint.value = '';
        aiModel.value = '';
        aiKeys.value = '';
        addAiForm.style.display = 'none';
        editingAiIndex = -1;
        if (saveAiBtn) saveAiBtn.textContent = t('admin.ai_save_btn');
    });
}

/* ============================================================================
 * LLM Learned Blacklist Management
 * ============================================================================ */
if (downloadLlmBtn) {
    downloadLlmBtn.addEventListener('click', () => {
        if (currentLlmBlacklist.length === 0) {
            showToast(t('admin.llm_empty'));
            return;
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentLlmBlacklist, null, 2));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", `llm_blacklist_${new Date().getTime()}.json`);
        dlAnchorElem.click();
        dlAnchorElem.remove();
        showToast(t('admin.llm_download_success'));
    });
}

if (clearLlmBtn) {
    clearLlmBtn.addEventListener('click', async () => {
        if (!confirm(t('admin.llm_clear_confirm'))) return;
        try {
            const res = await fetch(WORKER_API + '/admin/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_key: adminKey, clearLlmBlacklist: true })
            });
            const data = await res.json();
            if (data.success) {
                currentLlmBlacklist = [];
                if (llmCountDisplay) llmCountDisplay.textContent = "0";
                showToast(t('admin.llm_cleared'));
            }
        } catch (e) {
            showToast(t('admin.connect_failed'));
        }
    });
}

/* ============================================================================
 * Dictionary File Upload Handling
 * ============================================================================ */

/* Parse and upload sensitive word lists from uploaded JSON files. */
function handleFileUpload(inputElement, configKey) {
    inputElement.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const arr = JSON.parse(event.target.result);
                if (!Array.isArray(arr) || !arr.every(item => typeof item === 'string')) {
                    showToast(t('admin.upload_format_error'));
                    return;
                }

                showToast(t('admin.uploading'));
                
                const payload = { admin_key: adminKey };
                payload[configKey] = arr;

                const res = await fetch(WORKER_API + '/admin/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await res.json();
                if (data.success) {
                    showToast(t('admin.upload_success'));
                    /* Optimistically update UI to bypass KV propagation delay. */
                    if (configKey === 'baseBannedWords' && baseCountDisplay) {
                        baseCountDisplay.textContent = arr.length;
                    }
                    if (configKey === 'privateBannedWords' && privateCountDisplay) {
                        privateCountDisplay.textContent = arr.length;
                    }
                } else {
                    showToast(t('admin.upload_failed') + (data.error || t('admin.permission_denied')));
                }
            } catch (err) {
                showToast(t('admin.json_parse_error'));
            } finally {
                /* Reset file input to allow selecting the same file again. */
                inputElement.value = '';
            }
        };
        reader.readAsText(file);
    });
}

if (baseUploadInput) handleFileUpload(baseUploadInput, 'baseBannedWords');
if (privateUploadInput) handleFileUpload(privateUploadInput, 'privateBannedWords');

function showLogin() {
    dashboardScreen.classList.remove('active');
    loginScreen.classList.add('active');
    localStorage.removeItem('danmaku_admin_key');
    adminKey = null;
    passwordInput.value = '';
}

function renderList(list) {
    danmakuList.innerHTML = '';
    /* Render newest items first. */
    list.slice().reverse().forEach(item => {
        const div = document.createElement('div');
        div.className = 'list-item';
        
        const content = document.createElement('div');
        content.className = 'item-content';
        
        const text = document.createElement('div');
        text.className = 'item-text';
        text.textContent = item.text;
        
        const meta = document.createElement('div');
        meta.className = 'item-meta';
        
        const timeSpan = document.createElement('span');
        timeSpan.textContent = formatTime(item.time);
        
        const idSpan = document.createElement('span');
        idSpan.textContent = `ID: ${item.id.split('-')[0]}`;
        idSpan.style.fontFamily = 'monospace';
        
        meta.appendChild(timeSpan);
        meta.appendChild(idSpan);
        content.appendChild(text);
        content.appendChild(meta);
        
        const delBtn = document.createElement('button');
        delBtn.className = 'ios-btn destructive';
        delBtn.textContent = t('common.delete');
        delBtn.onclick = () => deleteDanmaku(item.id, div);
        const blacklistBtn = document.createElement('button');
        blacklistBtn.className = 'ios-btn';
        blacklistBtn.title = t('admin.ai_learn_btn_title');
        blacklistBtn.style.padding = '0';
        blacklistBtn.style.width = '32px';
        blacklistBtn.style.height = '32px';
        blacklistBtn.style.display = 'flex';
        blacklistBtn.style.alignItems = 'center';
        blacklistBtn.style.justifyContent = 'center';
        blacklistBtn.style.background = 'transparent';
        blacklistBtn.style.color = 'var(--text-secondary)';
        blacklistBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>';
        blacklistBtn.onclick = () => openAiLearnModal(item.id, item.text);
        
        const actionsDiv = document.createElement('div');
        actionsDiv.style.display = 'flex';
        actionsDiv.style.gap = '8px';
        actionsDiv.appendChild(blacklistBtn);
        actionsDiv.appendChild(delBtn);
        
        div.appendChild(content);
        div.appendChild(actionsDiv);
        
        danmakuList.appendChild(div);
    });
}

/* ============================================================================
 * Danmaku Data Fetching & Deletion
 * ============================================================================ */

/* Fetch active danmaku list from worker. */
async function loadDanmaku() {
    if (!adminKey) return;
    
    danmakuList.innerHTML = `<div class="empty-state">${t('common.loading')}</div>`;
    
    try {
        const res = await fetch(WORKER_API + '/danmaku');
        if (!res.ok) throw new Error('Failed to fetch data');
        
        const data = await res.json();
        window.currentDanmakuList = data.list || [];
        const list = data.list || [];
        
        totalCount.textContent = list.length;
        
        if (list.length === 0) {
            danmakuList.innerHTML = `<div class="empty-state">${t('admin.no_danmaku')}</div>`;
            return;
        }

        renderList(list);
        
    } catch (e) {
        console.error(e);
        showToast(t('admin.load_failed'));
        danmakuList.innerHTML = `<div class="empty-state">${t('admin.load_failed_detail')}</div>`;
    }
}

/* Delete specific danmaku item by ID. */
async function deleteDanmaku(id, element) {
    if (!confirm(t('admin.delete_confirm'))) return;
    
    const delBtn = element.querySelector('.ios-btn.destructive');
    const originalText = delBtn ? delBtn.textContent : t('common.delete');
    if (delBtn) {
        delBtn.textContent = t('admin.deleting');
        delBtn.disabled = true;
    }

    try {
        const res = await fetch(WORKER_API + '/danmaku', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, admin_key: adminKey })
        });
        
        if (res.ok) {
            showToast(t('admin.deleted'));
            element.style.opacity = '0';
            setTimeout(() => {
                element.remove();
                totalCount.textContent = Math.max(0, parseInt(totalCount.textContent) - 1);
                if (danmakuList.children.length === 0) {
                    danmakuList.innerHTML = `<div class="empty-state">${t('admin.no_danmaku')}</div>`;
                }
            }, 300);
        } else {
            const err = await res.json();
            if (res.status === 400 || res.status === 403) {
                showToast(t('admin.auth_error'));
                setTimeout(showLogin, 1500);
            } else {
                showToast(err.error || t('admin.delete_failed'));
                if (delBtn) {
                    delBtn.textContent = originalText;
                    delBtn.disabled = false;
                }
            }
        }
    } catch (e) {
        showToast(t('admin.network_error'));
        if (delBtn) {
            delBtn.textContent = originalText;
            delBtn.disabled = false;
        }
    }
}

/* ============================================================================
 * Global Action Listeners & Session Lifecycle
 * ============================================================================ */

refreshBtn.addEventListener('click', () => {
    loadDanmaku();
    loadConfig();
});
logoutBtn.addEventListener('click', showLogin);

/* Initial check: verify existing token or attempt SSO handshake. */
if (adminKey) {
    fetch(WORKER_API + '/admin/config', {
        headers: { 'X-Admin-Key': adminKey },
        cache: 'no-store'
    })
        .then(res => {
            if (res.ok) {
                showDashboard();
            } else {
                localStorage.removeItem('danmaku_admin_key');
                adminKey = '';
                showLogin();
            }
        })
        .catch(() => {
            /* If network fails on initialization, display login screen. */
            showLogin();
        });
} else {
    /*
     * Situla Auth SSO Integration:
     * Attempt to fetch the SSO key injected by Nginx Proxy Manager (Domain A).
     * Mirror sites (Domain B) will return 404 and gracefully fallback to standard login.
     */
    fetch('/api/sso_key')
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(async data => {
            if (data && data.key) {
                /* If key is already a 64-char hex string (SHA-256), use directly; otherwise hash it. */
                const tempKey = data.key.length === 64 ? data.key : await hashSHA256(data.key);
                const res = await fetch(WORKER_API + '/admin/config', {
                    headers: { 'X-Admin-Key': tempKey },
                    cache: 'no-store'
                });
                if (res.ok) {
                    adminKey = tempKey;
                    localStorage.setItem('danmaku_admin_key', adminKey);
                    showDashboard();
                } else {
                    showLogin();
                }
            } else {
                showLogin();
            }
        })
        .catch(() => {
            /* No SSO key found (Mirror site); show standard login. */
            showLogin();
        });
}

/* ============================================================================
 * AI Supervised Learning Modal Logic
 * ============================================================================ */
const aiLearnModal = document.getElementById('ai-learn-modal');
const learnHelpBtn = document.getElementById('learn-help-btn');
const learnCancelBtn = document.getElementById('learn-cancel-btn');
const learnCloseBtn = document.getElementById('learn-close-btn');
const learnSubmitBtn = document.getElementById('learn-submit-btn');
const learnReasonInput = document.getElementById('learn-reason-input');

let currentLearnId = null;
let currentLearnText = null;

function openAiLearnModal(id, text) {
    currentLearnId = id;
    currentLearnText = text;
    learnReasonInput.value = '';
    aiLearnModal.classList.add('active');
    setTimeout(() => learnReasonInput.focus(), 100);
}

function closeAiLearnModal() {
    aiLearnModal.classList.remove('active');
    currentLearnId = null;
    currentLearnText = null;
}

const learnHelpPopover = document.getElementById('learn-help-popover');

if (learnHelpBtn) {
    learnHelpBtn.addEventListener('click', (e) => {
        /* Prevent document click from immediately closing popover. */
        e.stopPropagation();
        if (learnHelpPopover) {
            learnHelpPopover.classList.toggle('show');
        }
    });
}
if (learnCloseBtn) {
    learnCloseBtn.addEventListener('click', closeAiLearnModal);
}

/* Close help popover when clicking anywhere outside. */
document.addEventListener('click', (e) => {
    if (learnHelpPopover && learnHelpPopover.classList.contains('show')) {
        if (!learnHelpPopover.contains(e.target) && e.target !== learnHelpBtn) {
            learnHelpPopover.classList.remove('show');
        }
    }
});

if (learnCancelBtn) {
    learnCancelBtn.addEventListener('click', closeAiLearnModal);
}

if (aiLearnModal) {
    aiLearnModal.addEventListener('click', (e) => {
        if (e.target === aiLearnModal) {
            closeAiLearnModal();
        }
    });
}

if (learnSubmitBtn) {
    learnSubmitBtn.addEventListener('click', async () => {
        const reason = learnReasonInput.value.trim();
        if (!reason) {
            showToast(t('admin.ai_learn_reason_required'));
            return;
        }

        learnSubmitBtn.disabled = true;
        learnSubmitBtn.textContent = t('admin.ai_learning');

        try {
            const res = await fetch(WORKER_API + '/admin/learn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_key: adminKey,
                    id: currentLearnId,
                    text: currentLearnText,
                    reason: reason
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(t('admin.ai_learn_success', data.learned.join(', ')));
                closeAiLearnModal();
                await loadConfig();
                await loadDanmaku();
            } else {
                showToast(t('admin.ai_learn_failed') + (data.error || t('admin.unknown_error')));
            }
        } catch (e) {
            showToast(t('admin.connect_failed'));
        } finally {
            learnSubmitBtn.disabled = false;
            learnSubmitBtn.textContent = t('common.submit');
        }
    });
}

/* Apply initial translations and listen for global language changes */
applyTranslations();
window.addEventListener('sys-lang-change', () => {
    applyTranslations();
    renderAiModels();
    if (Array.isArray(window.currentDanmakuList)) {
        if (window.currentDanmakuList.length === 0) {
            danmakuList.innerHTML = `<div class="empty-state">${t('admin.no_danmaku')}</div>`;
        } else {
            renderList(window.currentDanmakuList);
        }
    }
});
