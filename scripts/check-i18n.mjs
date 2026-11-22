/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — i18n Parity & Coverage Checker
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tcLocale from '../js/modules/i18n/locales/tc.js';
import scLocale from '../js/modules/i18n/locales/sc.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ROOT = path.resolve(__dirname, '..');

const EXCLUDED_DIRS = new Set(['captcha', 'tools', 'scripts', 'dist', 'node_modules', '.git']);

/* Dynamic key prefixes constructed via template literals at runtime */
const DYNAMIC_KEY_PREFIXES = [
    'tab.',
    'calendar.day_',
    'nav.mobile_title_'
];

/* ============================================================================
 * Recursive Source File Discovery
 * ============================================================================ */
function collectSourceFiles(dir, results = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            if (EXCLUDED_DIRS.has(entry.name)) continue;
            collectSourceFiles(path.join(dir, entry.name), results);
        } else if (entry.isFile()) {
            const lower = entry.name.toLowerCase();
            if ((lower.endsWith('.html') || lower.endsWith('.js')) && !lower.endsWith('.min.js')) {
                results.push(path.join(dir, entry.name));
            }
        }
    }
    return results;
}

/* ============================================================================
 * Reference Extraction (HTML Attributes & JS t() Calls)
 * ============================================================================ */
function extractReferencedKeys(files) {
    const referenced = new Map();

    function record(key, relFile) {
        if (!key) return;
        if (!referenced.has(key)) {
            referenced.set(key, new Set());
        }
        referenced.get(key).add(relFile);
    }

    const attrPattern = /\b(?:data-i18n(?:-placeholder|-title|-aria-label|-alt)?|data-page-title-key)\s*=\s*["']([^"']+)["']/g;
    const tCallPattern = /\bt\(\s*['"]([a-zA-Z0-9_.-]+)['"]/g;
    const propKeyPattern = /\b(?:titleKey|categoryKey|labelKey|pageTitleKey|artistKey|mobileKey|desktopKey|descKey|dateKey)\s*:\s*['"]([a-zA-Z0-9_.-]+)['"]/g;

    for (const filePath of files) {
        const relFile = path.relative(FRONTEND_ROOT, filePath).replace(/\\/g, '/');
        if (relFile.startsWith('js/modules/i18n/locales/')) continue;

        const rawContent = fs.readFileSync(filePath, 'utf8');
        const content = lowerOrStripComments(filePath, rawContent);

        for (const match of content.matchAll(attrPattern)) {
            record(match[1], relFile);
        }
        for (const match of content.matchAll(tCallPattern)) {
            record(match[1], relFile);
        }
        for (const match of content.matchAll(propKeyPattern)) {
            record(match[1], relFile);
        }
    }

    return referenced;
}

function lowerOrStripComments(filePath, text) {
    if (filePath.toLowerCase().endsWith('.js')) {
        return text.replace(/\/\*[\s\S]*?\*\//g, '');
    }
    return text.replace(/<!--[\s\S]*?-->/g, '');
}

/* ============================================================================
 * Parity & Coverage Verification
 * ============================================================================ */
function runCheck() {
    const tcDict = tcLocale.translations || {};
    const scDict = scLocale.translations || {};

    const tcKeys = Object.keys(tcDict);
    const scKeys = Object.keys(scDict);
    const tcSet = new Set(tcKeys);
    const scSet = new Set(scKeys);

    let hasErrors = false;

    const missingInSc = tcKeys.filter((k) => !scSet.has(k));
    const missingInTc = scKeys.filter((k) => !tcSet.has(k));
    const emptyInTc = tcKeys.filter((k) => typeof tcDict[k] !== 'string' || tcDict[k].trim() === '');
    const emptyInSc = scKeys.filter((k) => typeof scDict[k] !== 'string' || scDict[k].trim() === '');

    if (missingInSc.length > 0) {
        hasErrors = true;
        console.error('[ERROR] Keys in tc.js missing from sc.js:', missingInSc);
    }
    if (missingInTc.length > 0) {
        hasErrors = true;
        console.error('[ERROR] Keys in sc.js missing from tc.js:', missingInTc);
    }
    if (emptyInTc.length > 0) {
        hasErrors = true;
        console.error('[ERROR] Empty or non-string values in tc.js:', emptyInTc);
    }
    if (emptyInSc.length > 0) {
        hasErrors = true;
        console.error('[ERROR] Empty or non-string values in sc.js:', emptyInSc);
    }

    const files = collectSourceFiles(FRONTEND_ROOT);
    const referenced = extractReferencedKeys(files);

    const missingDefinitions = [];
    for (const [key, usedIn] of referenced.entries()) {
        if (!tcSet.has(key) || !scSet.has(key)) {
            missingDefinitions.push({ key, usedIn: Array.from(usedIn) });
        }
    }

    if (missingDefinitions.length > 0) {
        hasErrors = true;
        console.error('[ERROR] Referenced keys missing from locale dictionaries:');
        missingDefinitions.forEach((item) => {
            console.error(`  - ${item.key} (used in: ${item.usedIn.join(', ')})`);
        });
    }

    const orphanKeys = tcKeys.filter((key) => {
        if (referenced.has(key)) return false;
        return !DYNAMIC_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
    });

    console.log(`Checked ${files.length} source files.`);
    console.log(`Locale parity: tc=${tcKeys.length} keys, sc=${scKeys.length} keys.`);
    console.log(`Static referenced keys: ${referenced.size}.`);

    if (orphanKeys.length > 0) {
        console.warn(`[WARN] ${orphanKeys.length} unused orphan key(s):`, orphanKeys);
    } else {
        console.log('Unused orphan keys: 0.');
    }

    if (hasErrors) {
        process.exit(1);
    }

    console.log('PASS: 100% locale parity and 0 missing i18n keys.');
}

runCheck();
