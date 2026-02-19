import { Lock, ShieldCheck, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/lib/animations'

/* ── Inline SVG payment logos ── */

function StripeLogo() {
  return (
    <svg width="48" height="20" viewBox="0 0 48 20" fill="none">
      <path
        d="M17.4 8.26c0-1.56 1.28-2.16 3.4-2.16 1.82 0 4.12.56 5.94 1.54V2.98c-1.98-.78-3.94-1.1-5.94-1.1C16.36 1.88 13 4.2 13 8.48c0 6.62 9.12 5.56 9.12 8.42 0 1.84-1.6 2.44-3.84 2.44-2.32 0-4.72-.78-6.82-2.02v4.82A17.34 17.34 0 0018.28 24c4.58 0 7.74-2.26 7.74-6.6C26.02 10.18 17.4 11.46 17.4 8.26z"
        fill="currentColor"
        transform="scale(0.76) translate(2, -2)"
      />
    </svg>
  )
}

function VisaLogo() {
  return (
    <svg width="48" height="16" viewBox="0 0 48 16" fill="none">
      <path d="M19.2 0.8L12.6 15.2H8.4L5.16 3.68C4.92 2.72 4.72 2.4 3.96 1.96 2.76 1.32 0.84 0.72 0 0.36L0.12 0H6.72C7.56 0 8.32 0.56 8.52 1.52L10.2 10.4L14.28 0H18.48L19.2 0.8ZM34.2 10.32C34.22 6.44 28.74 6.24 28.78 4.52C28.8 3.96 29.34 3.36 30.5 3.2 31.08 3.12 32.68 3.08 34.5 3.92L35.24 0.68C34.26 0.32 33 0 31.44 0 27.48 0 24.66 2.04 24.64 4.96 24.6 7.12 26.56 8.32 28.04 9.04C29.56 9.8 30.08 10.28 30.08 10.92 30.06 11.92 28.86 12.36 27.76 12.38 25.68 12.4 24.48 11.84 23.52 11.4L22.76 14.76C23.72 15.2 25.44 15.56 27.24 15.58 31.44 15.58 34.18 13.56 34.2 10.32ZM44.04 15.2H47.76L44.52 0H41.16C40.44 0 39.84 0.4 39.56 1.04L33.6 15.2H37.8L38.62 12.92H43.72L44.04 15.2ZM39.72 9.88L41.84 4.08L43.04 9.88H39.72ZM23.7 0L20.4 15.2H16.38L19.68 0H23.7Z" fill="currentColor" />
    </svg>
  )
}

function MastercardLogo() {
  return (
    <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
      <circle cx="13" cy="11" r="11" fill="#EB001B" opacity="0.3" />
      <circle cx="23" cy="11" r="11" fill="#F79E1B" opacity="0.3" />
      <path
        d="M18 3.2a10.96 10.96 0 00-5 7.8 10.96 10.96 0 005 7.8 10.96 10.96 0 005-7.8 10.96 10.96 0 00-5-7.8z"
        fill="#FF5F00" opacity="0.4"
      />
    </svg>
  )
}

function AmexLogo() {
  return (
    <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
      <rect x="0.5" y="0.5" width="35" height="21" rx="3.5" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <text x="18" y="14" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">
        AMEX
      </text>
    </svg>
  )
}

function ApplePayLogo() {
  return (
    <svg width="48" height="20" viewBox="0 0 48 20" fill="none">
      <path
        d="M8.4 2.6c.5-.7.9-1.6.8-2.6-.8 0-1.7.5-2.3 1.2-.5.6-.9 1.5-.8 2.5.9.1 1.7-.4 2.3-1.1zM9.2 3.8c-1.3-.1-2.3.7-2.9.7-.6 0-1.5-.7-2.5-.7C2.5 3.9 1.3 4.7.6 6 -.8 8.5.3 12.2 1.7 14.2c.7 1 1.5 2.1 2.5 2 1-.1 1.4-.6 2.6-.6 1.2 0 1.5.6 2.6.6 1.1 0 1.8-.9 2.5-2 .5-.7.8-1.2 1.1-1.9-2.7-1.1-3.2-5.2-.5-6.8-.8-1-2-1.6-3.3-1.7z"
        fill="currentColor"
      />
      <text x="18" y="13" fill="currentColor" fontSize="10" fontWeight="500" fontFamily="Inter, system-ui, sans-serif">
        Pay
      </text>
    </svg>
  )
}

function GooglePayLogo() {
  return (
    <svg width="48" height="20" viewBox="0 0 48 20" fill="none">
      {/* G circle */}
      <circle cx="8" cy="10" r="7.5" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <text x="8" y="14" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">
        G
      </text>
      <text x="20" y="14" fill="currentColor" fontSize="10" fontWeight="500" fontFamily="Inter, system-ui, sans-serif">
        Pay
      </text>
    </svg>
  )
}

const paymentLogos = [
  { name: 'Stripe', Logo: StripeLogo },
  { name: 'Visa', Logo: VisaLogo },
  { name: 'Mastercard', Logo: MastercardLogo },
  { name: 'Amex', Logo: AmexLogo },
  { name: 'Apple Pay', Logo: ApplePayLogo },
  { name: 'Google Pay', Logo: GooglePayLogo },
]

const badges = [
  { icon: Lock, label: 'Bank-grade encryption' },
  { icon: ShieldCheck, label: 'PCI compliant' },
  { icon: MapPin, label: 'Australian data' },
]

export default function TrustSection() {
  return (
    <section className="border-y border-surface-200/60 py-12" aria-label="Trust and security">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="mx-auto max-w-5xl px-5 sm:px-8"
      >
        {/* Payment logos */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-wrap items-center justify-center gap-8 text-surface-400 sm:gap-10"
        >
          {paymentLogos.map(({ name, Logo }) => (
            <div key={name} className="flex items-center" title={name}>
              <Logo />
            </div>
          ))}
        </motion.div>

        {/* Security badges */}
        <motion.div
          variants={fadeInUp}
          className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10"
        >
          {badges.map((b) => (
            <div key={b.label} className="flex items-center gap-2">
              <b.icon className="h-4 w-4 text-surface-400" />
              <span className="text-sm text-surface-500">{b.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
