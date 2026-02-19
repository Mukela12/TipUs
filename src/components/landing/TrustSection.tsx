import { Lock, ShieldCheck, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/lib/animations'

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
          className="flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale"
        >
          {['Stripe', 'Visa', 'Mastercard', 'Amex', 'Apple Pay', 'Google Pay'].map(
            (name) => (
              <span
                key={name}
                className="text-sm font-semibold tracking-wide text-surface-500"
              >
                {name}
              </span>
            ),
          )}
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
