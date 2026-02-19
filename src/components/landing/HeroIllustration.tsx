import { motion } from 'framer-motion'

/** Animated phone + QR code illustration, themed to coral palette. */
export default function HeroIllustration() {
  return (
    <div className="relative mx-auto w-64 sm:w-72 lg:w-80">
      {/* Glow backdrop */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary-200/40 blur-3xl"
        animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <svg viewBox="0 0 280 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 w-full">
        {/* Phone body */}
        <motion.rect
          x="50" y="20" width="180" height="360" rx="28"
          fill="#0f172a"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        {/* Screen */}
        <motion.rect
          x="58" y="36" width="164" height="328" rx="20"
          fill="white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        />

        {/* Screen content — header bar */}
        <motion.rect
          x="58" y="36" width="164" height="52" rx="20"
          fill="#fdf5f2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        />
        <motion.text
          x="140" y="67" textAnchor="middle"
          className="text-[11px] font-semibold" fill="#d4856a"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          TipUs
        </motion.text>

        {/* QR Code (simplified grid) */}
        <motion.g
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.4, ease: 'easeOut' }}
        >
          {/* QR border */}
          <rect x="95" y="100" width="90" height="90" rx="8" fill="#fdf5f2" stroke="#e2e8f0" strokeWidth="1" />
          {/* QR pattern — top-left finder */}
          <rect x="104" y="109" width="20" height="20" rx="3" fill="#0f172a" />
          <rect x="108" y="113" width="12" height="12" rx="2" fill="white" />
          <rect x="111" y="116" width="6" height="6" rx="1" fill="#0f172a" />
          {/* QR pattern — top-right finder */}
          <rect x="156" y="109" width="20" height="20" rx="3" fill="#0f172a" />
          <rect x="160" y="113" width="12" height="12" rx="2" fill="white" />
          <rect x="163" y="116" width="6" height="6" rx="1" fill="#0f172a" />
          {/* QR pattern — bottom-left finder */}
          <rect x="104" y="161" width="20" height="20" rx="3" fill="#0f172a" />
          <rect x="108" y="165" width="12" height="12" rx="2" fill="white" />
          <rect x="111" y="168" width="6" height="6" rx="1" fill="#0f172a" />
          {/* QR data dots */}
          {[
            [132, 112], [140, 112], [148, 112],
            [132, 120], [148, 120],
            [132, 128], [140, 128], [148, 128],
            [108, 137], [116, 137], [124, 137], [132, 137], [140, 137], [148, 137], [156, 137], [164, 137],
            [132, 145], [148, 145],
            [132, 153], [140, 153],
            [148, 161], [156, 161], [164, 161],
            [132, 169], [140, 169], [148, 169],
            [156, 169], [164, 169],
          ].map(([cx, cy], i) => (
            <motion.rect
              key={i}
              x={cx} y={cy} width="5" height="5" rx="1"
              fill="#0f172a"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.015 }}
            />
          ))}
        </motion.g>

        {/* Scan line animation */}
        <motion.rect
          x="97" y="102" width="86" height="2" rx="1"
          fill="#d4856a"
          opacity={0.6}
          animate={{ y: [102, 186, 102] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />

        {/* "Scan to tip" label */}
        <motion.text
          x="140" y="210" textAnchor="middle"
          className="text-[10px]" fill="#475569"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Scan to tip
        </motion.text>

        {/* Tip amount buttons */}
        {[
          { x: 68, label: '$5', delay: 1.1 },
          { x: 118, label: '$10', delay: 1.2 },
          { x: 168, label: '$20', delay: 1.3 },
        ].map((btn) => (
          <motion.g
            key={btn.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: btn.delay, duration: 0.3 }}
          >
            <rect x={btn.x} y="224" width="44" height="32" rx="8" fill="#fdf5f2" stroke="#fce8de" strokeWidth="1" />
            <text x={btn.x + 22} y="244" textAnchor="middle" className="text-[11px] font-semibold" fill="#d4856a">
              {btn.label}
            </text>
          </motion.g>
        ))}

        {/* Selected state on $10 */}
        <motion.rect
          x="118" y="224" width="44" height="32" rx="8"
          fill="#d4856a"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1] }}
          transition={{ delay: 2, duration: 0.4 }}
        />
        <motion.text
          x="140" y="244" textAnchor="middle"
          className="text-[11px] font-semibold" fill="white"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1] }}
          transition={{ delay: 2, duration: 0.4 }}
        >
          $10
        </motion.text>

        {/* Pay button */}
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.3 }}
        >
          <rect x="78" y="272" width="124" height="40" rx="12" fill="#d4856a" />
          <text x="140" y="296" textAnchor="middle" className="text-[12px] font-semibold" fill="white">
            Pay with  Pay
          </text>
        </motion.g>

        {/* Success checkmark (appears after delay) */}
        <motion.g
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0, 0, 1], scale: [0.5, 0.5, 0.5, 1] }}
          transition={{ delay: 3, duration: 0.5, ease: 'easeOut' }}
        >
          <circle cx="140" cy="340" r="14" fill="#16a34a" opacity={0.15} />
          <circle cx="140" cy="340" r="9" fill="#16a34a" />
          <path d="M135 340l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </motion.g>
        <motion.text
          x="140" y="362" textAnchor="middle"
          className="text-[9px]" fill="#16a34a"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 0, 1] }}
          transition={{ delay: 3.2, duration: 0.3 }}
        >
          Tip sent!
        </motion.text>
      </svg>

      {/* Floating notification bubble */}
      <motion.div
        className="absolute -right-4 top-16 rounded-xl bg-white px-3 py-2 shadow-elevated sm:-right-8"
        initial={{ opacity: 0, x: 20, scale: 0.8 }}
        animate={{ opacity: [0, 0, 0, 0, 1], x: [20, 20, 20, 20, 0], scale: [0.8, 0.8, 0.8, 0.8, 1] }}
        transition={{ delay: 3.5, duration: 0.4, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success-light">
            <span className="text-xs">💰</span>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-surface-900">New tip!</p>
            <p className="text-[9px] text-surface-500">$10.00 received</p>
          </div>
        </div>
      </motion.div>

      {/* Floating Apple Pay badge */}
      <motion.div
        className="absolute -left-2 bottom-24 rounded-lg bg-white px-2.5 py-1.5 shadow-medium sm:-left-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: [0, 0, 1], x: [-20, -20, 0] }}
        transition={{ delay: 2.2, duration: 0.3, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="#0f172a"/>
          </svg>
          <span className="text-[10px] font-medium text-surface-900">Pay</span>
        </div>
      </motion.div>
    </div>
  )
}
