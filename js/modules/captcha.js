/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Captcha Bridge Module (captcha.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments (//) are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

let captchaSuccessCallback = null;

if (typeof window !== 'undefined') {
    /* Listen for completion signal from isolated PlayCaptcha iframe */
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CAPTCHA_SUCCESS') {
            const overlay = document.getElementById('captcha-modal-overlay');
            if (overlay) overlay.classList.remove('active');

            if (captchaSuccessCallback) {
                const cb = captchaSuccessCallback;
                captchaSuccessCallback = null;
                setTimeout(cb, 300);
            }
        }
    });

    /* Allow dismissing captcha by clicking outer backdrop */
    document.addEventListener('click', (e) => {
        const overlay = document.getElementById('captcha-modal-overlay');
        if (overlay && e.target === overlay) {
            overlay.classList.remove('active');
            captchaSuccessCallback = null;
        }
    });
}

/* ============================================================================
 * Public Trigger for Human Verification
 * ============================================================================ */
export function showCaptchaModal(onVerified) {
    const isDev = typeof localStorage !== 'undefined' && localStorage.getItem('developer_mode') === 'true';
    if (isDev) {
        if (typeof onVerified === 'function') {
            setTimeout(onVerified, 100);
        }
        return;
    }

    const overlay = document.getElementById('captcha-modal-overlay');
    const iframe = document.getElementById('captcha-iframe');

    if (!overlay || !iframe) {
        return;
    }

    captchaSuccessCallback = onVerified;

    /* Reload the iframe to ensure a fresh Captcha challenge */
    iframe.src = iframe.src;
    overlay.classList.add('active');
}
