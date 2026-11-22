/* ============================================================================
 * Environment Configuration Template (env.example.js)
 * ============================================================================
 * Convert your Cloudflare Worker URL to Base64 for basic obfuscation:
 * Example: atob("aHR0cHM6Ly95b3VyLXdvcmtlci1hcGkud29ya2Vycy5kZXY=")
 * ============================================================================ */

window.ENV = {
    WORKER_API: atob("aHR0cHM6Ly95b3VyLXdvcmtlci1hcGkud29ya2Vycy5kZXY=")
};
