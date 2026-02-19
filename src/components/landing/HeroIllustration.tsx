import { motion } from 'framer-motion'

/**
 * Animated phone mockup showing the TipUs tipping flow.
 * Everything is contained within the SVG viewBox — no overflow.
 */
export default function HeroIllustration() {
  return (
    <div className="relative">
      {/* Subtle glow */}
      <motion.div
        className="absolute inset-6 rounded-full bg-primary-200/30 blur-3xl"
        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.45, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <svg
        viewBox="0 0 220 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 mx-auto w-full drop-shadow-xl"
      >
        {/* Phone shell */}
        <motion.rect
          x="10" y="5" width="200" height="370" rx="30"
          fill="#1e293b"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        />
        {/* Dynamic Island */}
        <motion.rect
          x="80" y="12" width="60" height="8" rx="4"
          fill="#334155"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        />
        {/* Screen */}
        <motion.rect
          x="18" y="24" width="184" height="340" rx="22"
          fill="white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        />

        {/* ─── SCREEN CONTENT ─── */}

        {/* Header bar */}
        <rect x="18" y="24" width="184" height="40" rx="22" fill="#fdf5f2" />
        <rect x="18" y="50" width="184" height="14" fill="#fdf5f2" />
        <circle cx="46" cy="46" r="6" fill="#d4856a" />
        <text x="60" y="50" fill="#d4856a" fontSize="12" fontWeight="600" fontFamily="system-ui, sans-serif">
          TipUs
        </text>

        {/* QR Code block */}
        <motion.g
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.35 }}
          style={{ transformOrigin: '110px 122px' }}
        >
          <rect x="65" y="78" width="90" height="90" rx="10" fill="#fdf5f2" stroke="#e2e8f0" strokeWidth="0.5" />

          {/* Finder patterns (3 corners) */}
          <rect x="74" y="87" width="18" height="18" rx="3" fill="#1e293b" />
          <rect x="77" y="90" width="12" height="12" rx="2" fill="white" />
          <rect x="80" y="93" width="6" height="6" rx="1" fill="#1e293b" />

          <rect x="128" y="87" width="18" height="18" rx="3" fill="#1e293b" />
          <rect x="131" y="90" width="12" height="12" rx="2" fill="white" />
          <rect x="134" y="93" width="6" height="6" rx="1" fill="#1e293b" />

          <rect x="74" y="141" width="18" height="18" rx="3" fill="#1e293b" />
          <rect x="77" y="144" width="12" height="12" rx="2" fill="white" />
          <rect x="80" y="147" width="6" height="6" rx="1" fill="#1e293b" />

          {/* Data dots */}
          {[
            [102, 89], [110, 89], [118, 89],
            [102, 97], [118, 97],
            [102, 105], [110, 105], [118, 105],
            [74, 113], [82, 113], [90, 113], [102, 113], [110, 113], [118, 113], [128, 113], [136, 113],
            [102, 121], [118, 121],
            [110, 129], [118, 129],
            [128, 141], [136, 141],
            [102, 149], [110, 149], [118, 149], [128, 149],
          ].map(([x, y], i) => (
            <motion.rect
              key={i}
              x={x} y={y} width="5" height="5" rx="1"
              fill="#1e293b"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.01 }}
            />
          ))}
        </motion.g>

        {/* Scan line */}
        <motion.rect
          x="67" y="80" width="86" height="2" rx="1"
          fill="#d4856a" opacity="0.5"
          animate={{ y: [80, 164, 80] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        {/* "Scan to tip" label */}
        <motion.text
          x="110" y="186" textAnchor="middle"
          fill="#94a3b8" fontSize="9" fontFamily="system-ui, sans-serif"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Scan to tip your server
        </motion.text>

        {/* Tip amount buttons */}
        {[
          { x: 28, label: '$5', delay: 0.9 },
          { x: 85, label: '$10', delay: 1.0 },
          { x: 142, label: '$20', delay: 1.1 },
        ].map((btn) => (
          <motion.g
            key={btn.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: btn.delay, duration: 0.2 }}
          >
            <rect x={btn.x} y="198" width="50" height="32" rx="10" fill="#fdf5f2" stroke="#fce8de" strokeWidth="0.5" />
            <text
              x={btn.x + 25} y="219" textAnchor="middle"
              fill="#d4856a" fontSize="12" fontWeight="600" fontFamily="system-ui, sans-serif"
            >
              {btn.label}
            </text>
          </motion.g>
        ))}

        {/* $10 selected overlay */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 0, 1] }}
          transition={{ delay: 1.7, duration: 0.25 }}
        >
          <rect x="85" y="198" width="50" height="32" rx="10" fill="#d4856a" />
          <text
            x="110" y="219" textAnchor="middle"
            fill="white" fontSize="12" fontWeight="600" fontFamily="system-ui, sans-serif"
          >
            $10
          </text>
        </motion.g>

        {/* Pay button */}
        <motion.g
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.2 }}
        >
          <rect x="38" y="248" width="144" height="42" rx="12" fill="#1e293b" />
          {/* Apple icon */}
          <path
            d="M88 262.6c-.8-1-.5-2.2-.2-2.7.5.1 1.1.5 1.4.9.3.4.5 1 .3 1.8zm-.6.6c-.8 0-1.1.5-1.7.5s-1-.5-1.6-.5c-.8 0-1.7.7-2.1 1.8-.7 1.6-.2 4 .7 5.3.4.6.9 1.2 1.5 1.2s.8-.4 1.5-.4.9.4 1.5.4 1-.5 1.4-1.1c.3-.4.5-.8.6-1-1.2-.5-1.4-2.3-.2-3.1-.4-.5-1-.9-1.6-1.1z"
            fill="white"
          />
          <text
            x="100" y="274" fill="white" fontSize="13" fontWeight="500" fontFamily="system-ui, sans-serif"
          >
            Pay
          </text>
        </motion.g>

        {/* Success state */}
        <motion.g
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 0, 0, 0, 1], scale: [0.6, 0.6, 0.6, 0.6, 1] }}
          transition={{ delay: 2.5, duration: 0.35, ease: 'easeOut' }}
          style={{ transformOrigin: '110px 318px' }}
        >
          <circle cx="110" cy="316" r="14" fill="#16a34a" opacity="0.12" />
          <circle cx="110" cy="316" r="10" fill="#16a34a" />
          <path d="M105 316l3 3 6-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </motion.g>
        <motion.text
          x="110" y="342" textAnchor="middle"
          fill="#16a34a" fontSize="9" fontWeight="500" fontFamily="system-ui, sans-serif"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 0, 0, 1] }}
          transition={{ delay: 2.7, duration: 0.25 }}
        >
          Tip sent!
        </motion.text>
      </svg>
    </div>
  )
}
