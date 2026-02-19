import { motion } from 'framer-motion'

/**
 * Animated phone illustration showing the full tipping flow.
 * All elements stay within bounds — no overflow issues.
 * Themed to coral palette using design tokens.
 */
export default function HeroIllustration() {
  // Phone dimensions (centered in viewBox)
  const phone = { x: 60, y: 10, w: 180, h: 360, rx: 28 }
  // Screen inset
  const screen = { x: 68, y: 26, w: 164, h: 328, rx: 20 }
  // Center X of phone
  const cx = phone.x + phone.w / 2 // 150

  return (
    <div className="relative mx-auto w-56 sm:w-64 lg:w-72">
      {/* Soft glow behind phone */}
      <motion.div
        className="absolute inset-4 rounded-full bg-primary-200/30 blur-3xl"
        animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <svg
        viewBox="0 0 300 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full drop-shadow-xl"
      >
        {/* ===== PHONE BODY ===== */}
        <motion.rect
          x={phone.x} y={phone.y} width={phone.w} height={phone.h} rx={phone.rx}
          fill="#1e293b"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        {/* Camera notch */}
        <motion.rect
          x={cx - 20} y={phone.y + 6} width={40} height={6} rx={3}
          fill="#334155"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        />

        {/* ===== SCREEN ===== */}
        <motion.rect
          x={screen.x} y={screen.y} width={screen.w} height={screen.h} rx={screen.rx}
          fill="white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        />

        {/* --- Header bar --- */}
        <motion.rect
          x={screen.x} y={screen.y} width={screen.w} height={44} rx={screen.rx}
          fill="#fdf5f2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        />
        {/* TipUs logo circle */}
        <circle cx={cx - 26} cy={screen.y + 24} r={8} fill="#d4856a" opacity={0.15} />
        <circle cx={cx - 26} cy={screen.y + 24} r={5} fill="#d4856a" />
        <motion.text
          x={cx + 2} y={screen.y + 28} textAnchor="middle"
          fill="#d4856a" fontSize="11" fontWeight="600" fontFamily="Inter, system-ui, sans-serif"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          TipUs
        </motion.text>

        {/* --- QR Code --- */}
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4, ease: 'easeOut' }}
          style={{ transformOrigin: `${cx}px 130px` }}
        >
          {/* QR background */}
          <rect x={cx - 42} y={84} width={84} height={84} rx={8} fill="#fdf5f2" stroke="#e2e8f0" strokeWidth="0.5" />

          {/* Top-left finder */}
          <rect x={cx - 36} y={90} width={18} height={18} rx={3} fill="#1e293b" />
          <rect x={cx - 33} y={93} width={12} height={12} rx={2} fill="white" />
          <rect x={cx - 30} y={96} width={6} height={6} rx={1} fill="#1e293b" />

          {/* Top-right finder */}
          <rect x={cx + 18} y={90} width={18} height={18} rx={3} fill="#1e293b" />
          <rect x={cx + 21} y={93} width={12} height={12} rx={2} fill="white" />
          <rect x={cx + 24} y={96} width={6} height={6} rx={1} fill="#1e293b" />

          {/* Bottom-left finder */}
          <rect x={cx - 36} y={148} width={18} height={18} rx={3} fill="#1e293b" />
          <rect x={cx - 33} y={151} width={12} height={12} rx={2} fill="white" />
          <rect x={cx - 30} y={154} width={6} height={6} rx={1} fill="#1e293b" />

          {/* Data modules (small dots) */}
          {[
            [-8, 92], [0, 92], [8, 92],
            [-8, 100], [8, 100],
            [-8, 108], [0, 108], [8, 108],
            [-36, 116], [-28, 116], [-20, 116], [-8, 116], [0, 116], [8, 116], [18, 116], [28, 116],
            [-8, 124], [8, 124],
            [0, 132], [8, 132],
            [18, 148], [28, 148],
            [-8, 156], [0, 156], [8, 156], [18, 156],
          ].map(([dx, dy], i) => (
            <motion.rect
              key={i}
              x={cx + dx} y={dy} width={5} height={5} rx={1}
              fill="#1e293b"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 + i * 0.012 }}
            />
          ))}
        </motion.g>

        {/* Scan line */}
        <motion.rect
          x={cx - 40} y={86} width={80} height={2} rx={1}
          fill="#d4856a" opacity={0.5}
          animate={{ y: [86, 164, 86] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        />

        {/* "Scan to tip" label */}
        <motion.text
          x={cx} y={186} textAnchor="middle"
          fill="#94a3b8" fontSize="9" fontFamily="Inter, system-ui, sans-serif"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Scan to tip your server
        </motion.text>

        {/* --- Tip amount buttons --- */}
        {[
          { dx: -58, label: '$5', delay: 1.0 },
          { dx: -10, label: '$10', delay: 1.1 },
          { dx: 38, label: '$20', delay: 1.2 },
        ].map((btn) => (
          <motion.g
            key={btn.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: btn.delay, duration: 0.25 }}
          >
            <rect
              x={cx + btn.dx - 10} y={198} width={40} height={30} rx={8}
              fill="#fdf5f2" stroke="#fce8de" strokeWidth="0.5"
            />
            <text
              x={cx + btn.dx + 10} y={217} textAnchor="middle"
              fill="#d4856a" fontSize="11" fontWeight="600" fontFamily="Inter, system-ui, sans-serif"
            >
              {btn.label}
            </text>
          </motion.g>
        ))}

        {/* Selected highlight on $10 (overlays the middle button) */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 0, 1] }}
          transition={{ delay: 1.8, duration: 0.3 }}
        >
          <rect x={cx - 20} y={198} width={40} height={30} rx={8} fill="#d4856a" />
          <text
            x={cx} y={217} textAnchor="middle"
            fill="white" fontSize="11" fontWeight="600" fontFamily="Inter, system-ui, sans-serif"
          >
            $10
          </text>
        </motion.g>

        {/* --- Pay button --- */}
        <motion.g
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.25 }}
        >
          <rect x={cx - 56} y={244} width={112} height={38} rx={10} fill="#1e293b" />
          {/* Apple logo (small) */}
          <g transform={`translate(${cx - 34}, 256)`}>
            <path
              d="M8.5 1.2C7.8 0 6.6-.1 6.1.1c.6.4.9 1 .9 1.7-1 0-1.8.7-1.8 1.7C5.2 5 6.4 6.8 7 7.3c.3.2.6.2.9 0 .6-.5 1.8-2.3 1.8-3.8 0-.7-.4-1.3-1-1.6.2-.3.2-.5 0-.7z"
              fill="white" transform="scale(1.1)"
            />
          </g>
          <text
            x={cx + 4} y={267} textAnchor="middle"
            fill="white" fontSize="11" fontWeight="500" fontFamily="Inter, system-ui, sans-serif"
          >
            Pay
          </text>
        </motion.g>

        {/* --- Success state --- */}
        <motion.g
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0, 0, 0, 1], scale: [0.5, 0.5, 0.5, 0.5, 1] }}
          transition={{ delay: 2.8, duration: 0.4, ease: 'easeOut' }}
          style={{ transformOrigin: `${cx}px 310px` }}
        >
          <circle cx={cx} cy={306} r={14} fill="#16a34a" opacity={0.12} />
          <circle cx={cx} cy={306} r={9} fill="#16a34a" />
          <path
            d={`M${cx - 4} 306l3 3 5-6`}
            stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"
          />
        </motion.g>
        <motion.text
          x={cx} y={330} textAnchor="middle"
          fill="#16a34a" fontSize="9" fontWeight="500" fontFamily="Inter, system-ui, sans-serif"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 0, 0, 1] }}
          transition={{ delay: 3, duration: 0.3 }}
        >
          Tip sent! Thank you
        </motion.text>

        {/* ===== FLOATING ELEMENTS (inside viewBox, no overflow) ===== */}

        {/* Notification bubble — top right */}
        <motion.g
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: [0, 0, 0, 0, 0, 1], x: [12, 12, 12, 12, 12, 0] }}
          transition={{ delay: 3.2, duration: 0.3, ease: 'easeOut' }}
        >
          <rect x={214} y={60} width={82} height={36} rx={10} fill="white" filter="url(#shadow)" />
          <circle cx={228} cy={78} r={8} fill="#dcfce7" />
          <text x={228} y={82} textAnchor="middle" fontSize="8">💰</text>
          <text x={240} y={74} fill="#0f172a" fontSize="7.5" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">
            New tip!
          </text>
          <text x={240} y={84} fill="#94a3b8" fontSize="6.5" fontFamily="Inter, system-ui, sans-serif">
            $10.00 received
          </text>
        </motion.g>

        {/* Secure badge — bottom left */}
        <motion.g
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: [0, 0, 1], x: [-10, -10, 0] }}
          transition={{ delay: 2, duration: 0.3, ease: 'easeOut' }}
        >
          <rect x={4} y={280} width={62} height={28} rx={8} fill="white" filter="url(#shadow)" />
          {/* Lock icon */}
          <g transform="translate(14, 288)">
            <rect x="2" y="5" width="8" height="7" rx="1.5" fill="#d4856a" />
            <path d="M3.5 5V3.5a2.5 2.5 0 015 0V5" stroke="#d4856a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          </g>
          <text x={30} y={298} fill="#475569" fontSize="6.5" fontWeight="500" fontFamily="Inter, system-ui, sans-serif">
            Secure
          </text>
        </motion.g>

        {/* Drop shadow filter */}
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.08" />
          </filter>
        </defs>
      </svg>
    </div>
  )
}
