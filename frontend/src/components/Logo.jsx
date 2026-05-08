export default function Logo({ size = 56 }) {
    return (
        <div className="flex items-center gap-4" aria-label="Ritchnygie Market Lab">
            <svg
                width={size}
                height={size}
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
            >
                <defs>
                    <linearGradient id="rml-grad-1" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="55%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                    <linearGradient id="rml-grad-2" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                </defs>
                {/* Outer hexagonal frame */}
                <path
                    d="M4 12 L32 4 L60 12 L60 52 L32 60 L4 52 Z"
                    stroke="url(#rml-grad-1)"
                    strokeWidth="2"
                    fill="rgba(59,130,246,0.06)"
                />
                {/* Inner hex frame */}
                <path
                    d="M14 18 L32 13 L50 18 L50 46 L32 51 L14 46 Z"
                    stroke="rgba(255,255,255,0.30)"
                    strokeWidth="1"
                    fill="none"
                />
                {/* Bull market tick line — blue (SPX path) */}
                <polyline
                    points="18,38 24,32 30,40 36,22 42,28 48,18"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />
                {/* Gold accent line — diverging path */}
                <polyline
                    points="18,44 26,42 34,44 44,38"
                    stroke="url(#rml-grad-2)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity="0.85"
                />
                {/* Pivot dot */}
                <circle cx="32" cy="32" r="2" fill="#ffffff" />
                <circle cx="48" cy="18" r="2" fill="#3b82f6" />
                <circle cx="44" cy="38" r="1.8" fill="#fbbf24" />
            </svg>

            <div className="leading-tight">
                <div className="font-headings font-bold text-[28px] md:text-[32px] tracking-[-0.02em] text-white">
                    RITCHNYGIE
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-headings font-semibold text-[14px] tracking-[0.32em] uppercase txt-up">
                        Market
                    </span>
                    <span className="w-1 h-1 rounded-full bg-amber-400" />
                    <span className="font-headings font-semibold text-[14px] tracking-[0.32em] uppercase txt-accent">
                        Lab
                    </span>
                </div>
            </div>
        </div>
    );
}
