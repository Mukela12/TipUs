import { useRive } from '@rive-app/react-canvas'

/**
 * Rive-powered phone animation for the hero section.
 *
 * To switch to Rive:
 * 1. Design the animation at rive.app
 * 2. Export to public/animations/tipus-phone.riv
 * 3. Set RIVE_READY = true
 */
const RIVE_READY = false

function RivePhone() {
  const { RiveComponent } = useRive({
    src: '/animations/tipus-phone.riv',
    stateMachines: 'TipFlow',
    autoplay: true,
  })

  return (
    <div className="relative">
      <div className="absolute inset-6 rounded-full bg-primary-200/30 blur-3xl" />
      <RiveComponent className="relative z-10 h-[420px] w-full sm:h-[480px]" />
    </div>
  )
}

function StaticPhone() {
  // Timing constants (seconds) for the staged animation
  const T = {
    phone: 0.3,      // phone body fades in
    screen: 0.5,     // screen appears
    header: 0.7,     // header bar
    qr: 1.0,         // QR code block
    label: 1.4,      // "Scan to tip"
    buttons: 1.6,    // tip amount buttons
    select: 2.8,     // $10 gets selected
    pay: 1.8,        // pay button
    success: 3.8,    // checkmark + "Tip sent!"
  }

  return (
    <div className="relative">
      {/* Glow behind phone */}
      <div className="absolute inset-4 rounded-full bg-primary-200/25 blur-3xl" />

      <svg
        viewBox="0 0 220 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 mx-auto w-full"
        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.12))' }}
      >
        {/* ═══════ PHONE SHELL ═══════ */}
        <g opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin={`${T.phone}s`} fill="freeze" />
          <rect x="10" y="5" width="200" height="370" rx="30" fill="#1e293b" />
          {/* Side buttons */}
          <rect x="0" y="90" width="3" height="24" rx="1.5" fill="#334155" />
          <rect x="0" y="130" width="3" height="40" rx="1.5" fill="#334155" />
          <rect x="217" y="120" width="3" height="36" rx="1.5" fill="#334155" />
          {/* Dynamic Island */}
          <rect x="82" y="11" width="56" height="8" rx="4" fill="#0f172a" />
          <circle cx="120" cy="15" r="2.5" fill="#1a2332" />
        </g>

        {/* ═══════ SCREEN ═══════ */}
        <rect x="18" y="24" width="184" height="340" rx="22" fill="white" opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin={`${T.screen}s`} fill="freeze" />
        </rect>

        {/* ═══════ HEADER BAR ═══════ */}
        <g opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin={`${T.header}s`} fill="freeze" />
          <rect x="18" y="24" width="184" height="40" rx="22" fill="#fdf5f2" />
          <rect x="18" y="50" width="184" height="14" fill="#fdf5f2" />
          {/* TipUs logo */}
          <circle cx="46" cy="46" r="8" fill="#d4856a" opacity="0.12" />
          <circle cx="46" cy="46" r="5.5" fill="#d4856a" />
          {/* T inside the circle */}
          <text x="46" y="49.5" textAnchor="middle" fill="white" fontSize="7" fontWeight="700" fontFamily="system-ui, sans-serif">T</text>
          <text x="62" y="50" fill="#d4856a" fontSize="12" fontWeight="700" fontFamily="system-ui, sans-serif">TipUs</text>
          {/* Menu dots */}
          <circle cx="185" cy="44" r="1.5" fill="#cbd5e1" />
          <circle cx="185" cy="49" r="1.5" fill="#cbd5e1" />
        </g>

        {/* ═══════ QR CODE ═══════ */}
        <g opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.35s" begin={`${T.qr}s`} fill="freeze" />

          {/* QR background card */}
          <rect x="55" y="74" width="110" height="100" rx="12" fill="#fdf5f2" stroke="#e2e8f0" strokeWidth="0.5" />

          {/* QR code centered inside (area: 80x80, offset by 15px from card edges) */}
          {/* Top-left finder */}
          <rect x="70" y="84" width="20" height="20" rx="3" fill="#1e293b" />
          <rect x="73" y="87" width="14" height="14" rx="2" fill="white" />
          <rect x="76.5" y="90.5" width="7" height="7" rx="1.5" fill="#1e293b" />

          {/* Top-right finder */}
          <rect x="130" y="84" width="20" height="20" rx="3" fill="#1e293b" />
          <rect x="133" y="87" width="14" height="14" rx="2" fill="white" />
          <rect x="136.5" y="90.5" width="7" height="7" rx="1.5" fill="#1e293b" />

          {/* Bottom-left finder */}
          <rect x="70" y="144" width="20" height="20" rx="3" fill="#1e293b" />
          <rect x="73" y="147" width="14" height="14" rx="2" fill="white" />
          <rect x="76.5" y="150.5" width="7" height="7" rx="1.5" fill="#1e293b" />

          {/* Data modules */}
          {[
            [100,86],[108,86],[116,86],
            [100,94],[116,94],
            [100,102],[108,102],[116,102],
            [70,110],[78,110],[86,110],[100,110],[108,110],[116,110],[130,110],[138,110],
            [100,118],[116,118],
            [108,126],[116,126],
            [130,144],[138,144],
            [100,152],[108,152],[116,152],[130,152],
          ].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="6" height="6" rx="1" fill="#1e293b" />
          ))}

          {/* Scan line — sweeps within QR area */}
          <rect x="68" y="84" width="84" height="2" rx="1" fill="#d4856a" opacity="0.6">
            <animate attributeName="y" values="84;162;84" dur="2.5s" begin={`${T.qr + 0.3}s`} repeatCount="indefinite" />
          </rect>
        </g>

        {/* ═══════ "SCAN TO TIP" LABEL ═══════ */}
        <text x="110" y="190" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="system-ui, sans-serif" opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin={`${T.label}s`} fill="freeze" />
          Scan to tip your server
        </text>

        {/* ═══════ TIP AMOUNT BUTTONS ═══════ */}
        <g opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.25s" begin={`${T.buttons}s`} fill="freeze" />

          {/* $5 */}
          <rect x="28" y="200" width="50" height="34" rx="10" fill="#fdf5f2" stroke="#fce8de" strokeWidth="0.5" />
          <text x="53" y="222" textAnchor="middle" fill="#d4856a" fontSize="13" fontWeight="600" fontFamily="system-ui, sans-serif">$5</text>

          {/* $10 — starts unselected */}
          <rect x="85" y="200" width="50" height="34" rx="10" fill="#fdf5f2" stroke="#fce8de" strokeWidth="0.5" />
          <text x="110" y="222" textAnchor="middle" fill="#d4856a" fontSize="13" fontWeight="600" fontFamily="system-ui, sans-serif">$10</text>

          {/* $20 */}
          <rect x="142" y="200" width="50" height="34" rx="10" fill="#fdf5f2" stroke="#fce8de" strokeWidth="0.5" />
          <text x="167" y="222" textAnchor="middle" fill="#d4856a" fontSize="13" fontWeight="600" fontFamily="system-ui, sans-serif">$20</text>
        </g>

        {/* $10 selected overlay — appears after delay */}
        <g opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.2s" begin={`${T.select}s`} fill="freeze" />
          <rect x="85" y="200" width="50" height="34" rx="10" fill="#d4856a" />
          <text x="110" y="222" textAnchor="middle" fill="white" fontSize="13" fontWeight="600" fontFamily="system-ui, sans-serif">$10</text>
        </g>

        {/* ═══════ PAY BUTTON ═══════ */}
        <g opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.25s" begin={`${T.pay}s`} fill="freeze" />

          <rect x="35" y="250" width="150" height="44" rx="12" fill="#1e293b" />

          {/* Apple logo — official Simple Icons path, scaled to fit */}
          <g transform="translate(70, 262) scale(0.65)">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="white" />
          </g>
          <text x="102" y="277" fill="white" fontSize="14" fontWeight="500" fontFamily="system-ui, sans-serif">Pay</text>
        </g>

        {/* ═══════ SUCCESS STATE ═══════ */}
        <g opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.35s" begin={`${T.success}s`} fill="freeze" />

          {/* Green glow ring */}
          <circle cx="110" cy="318" r="16" fill="#16a34a" opacity="0.1" />
          <circle cx="110" cy="318" r="11" fill="#16a34a" />
          {/* Checkmark */}
          <path d="M104.5 318l3.5 3.5 7-8" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

          <text x="110" y="346" textAnchor="middle" fill="#16a34a" fontSize="10" fontWeight="600" fontFamily="system-ui, sans-serif">
            Tip sent!
          </text>
          <text x="110" y="357" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="system-ui, sans-serif">
            Thank you
          </text>
        </g>
      </svg>
    </div>
  )
}

export default function HeroIllustration() {
  return RIVE_READY ? <RivePhone /> : <StaticPhone />
}
