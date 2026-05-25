'use client';
import { Lock } from 'lucide-react';
import { DEMO_MODE, MSG_PREVIEW_CHARS } from './demo';

/**
 * Renders a message with the first N chars in cleartext and the rest
 * replaced by a blurred placeholder (visual scramble).
 */
export function DemoMessage({
    text,
    className = '',
    previewChars = MSG_PREVIEW_CHARS,
}: {
    text?: string | null;
    className?: string;
    previewChars?: number;
}) {
    if (!text) return null;
    if (!DEMO_MODE) {
        return <span className={className}>{text}</span>;
    }
    const preview = text.slice(0, previewChars);
    const hasMore = text.length > previewChars;

    // Build a fake blurred body of similar length to remaining text
    const remainingLen = Math.min(text.length - previewChars, 220);
    const filler = remainingLen > 0
        ? Array.from({ length: Math.max(8, Math.ceil(remainingLen / 6)) }, () => 'lorem ipsum').join(' ').slice(0, remainingLen)
        : '';

    return (
        <span className={className}>
            <span>{preview}</span>
            {hasMore && (
                <>
                    <span
                        className="select-none align-baseline"
                        style={{ filter: 'blur(4px)', opacity: 0.55 }}
                        aria-hidden="true"
                    >
                        {filler}
                    </span>
                    <span className="inline-flex items-center gap-1 ml-1 text-[10px] font-bold text-indigo-400/80 align-baseline">
                        <Lock size={9} />
                        hidden
                    </span>
                </>
            )}
        </span>
    );
}
