// Demo / public-showcase mode.
// When enabled, anonymizes profile names, lead last names, companies,
// hides links/emails, and provides helpers for blurring avatars and messages.
//
// Reads the auth role stored by AuthContext in localStorage.
// Admin role → full data. Guest or unauthenticated → demo mode.
function resolveDemo(): boolean {
    if (typeof window === 'undefined') return true; // SSR: safe default
    try {
        const role = localStorage.getItem('auth:role');
        return role !== 'admin';
    } catch {
        return true;
    }
}

export const DEMO_MODE = resolveDemo();

// Stable mapping: original profile name -> "Profile #N".
// Persists across renders within a single browser session.
const _profileMap = new Map<string, number>();
let _profileCounter = 0;

export function anonProfile(name?: string | null | undefined): string {
    if (!DEMO_MODE) return name || '';
    if (!name || name === 'Unknown') return 'Profile #?';
    if (!_profileMap.has(name)) {
        _profileCounter += 1;
        _profileMap.set(name, _profileCounter);
    }
    return `Profile #${_profileMap.get(name)}`;
}

export function anonLeadName(first?: string | null, last?: string | null): string {
    const f = (first || '').trim();
    const l = (last || '').trim();
    if (!DEMO_MODE) return `${f} ${l}`.trim();
    if (!f && !l) return 'Lead';
    return l ? `${f} ${l[0]}.` : f;
}

export function anonCompany(_company?: string | null): string {
    if (!DEMO_MODE) return _company || '';
    return '••• Confidential';
}

// Whether links / emails should be hidden completely
export const HIDE_PII = DEMO_MODE;

// CSS class to apply to <img> to blur the actual photo while preserving layout
export const BLUR_IMG_CLASS = DEMO_MODE ? 'blur-md saturate-50' : '';

// How many leading characters of a message to show in cleartext before blurring
export const MSG_PREVIEW_CHARS = 60;
