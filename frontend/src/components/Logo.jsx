export default function Logo({ size = 30 }) {
    return (
        <div className="flex items-center gap-2.5" aria-label="Ritchnygie Trading Lab">
            <svg
                width={size}
                height={size}
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
            >
                <defs>
                    <linearGradient id="rtl-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                </defs>
                {/* Outer angular frame */}
                <path d="M2 6 L20 2 L38 6 L38 34 L20 38 L2 34 Z"
                      stroke="url(#rtl-grad)" strokeWidth="1.5" fill="rgba(59,130,246,0.04)" />
                {/* Inner angular accent */}
                <path d="M9 12 L20 9 L31 12 L31 28 L20 31 L9 28 Z"
                      stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" fill="none" />
                {/* Tick marks - asymmetric */}
                <line x1="12" y1="22" x2="16" y2="18" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="square" />
                <line x1="16" y1="18" x2="20" y2="24" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="square" />
                <line x1="20" y1="24" x2="24" y2="14" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="square" />
                <line x1="24" y1="14" x2="28" y2="20" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="square" />
                {/* Center dot */}
                <circle cx="20" cy="20" r="1.4" fill="#ffffff" />
            </svg>
            <div className="leading-none">
                <div className="font-headings font-bold text-[20px] tracking-[-0.02em] text-white">RTL</div>
                <div className="text-[8px] tracking-[0.32em] uppercase font-headings txt-mute mt-0.5">
                    Ritchnygie · Lab
                </div>
            </div>
        </div>
    );
}
