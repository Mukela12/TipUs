import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer, scaleIn } from '@/lib/animations'

const features = [
  'Unlimited QR codes',
  'Unlimited employees',
  'Real-time dashboard',
  'Automatic tip splitting',
  'Custom QR code branding',
  'Email support',
]

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 sm:py-24" aria-label="Pricing">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto max-w-5xl px-5 sm:px-8"
      >
        <motion.h2
          variants={fadeInUp}
          className="font-heading text-center text-2xl font-bold text-surface-900 sm:text-3xl"
        >
          Simple pricing. <span className="text-primary-500">No surprises.</span>
        </motion.h2>

        <motion.div
          variants={scaleIn}
          className="mx-auto mt-12 max-w-md rounded-xl border border-surface-200 bg-white p-8 shadow-medium"
        >
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-primary-500">
              One plan. Everything included.
            </p>
            <div className="mt-4 flex items-baseline justify-center gap-1">
              <span className="font-heading text-4xl font-bold text-surface-900">$0</span>
              <span className="text-surface-500">/month</span>
            </div>
            <p className="mt-2 text-sm text-surface-600">
              5% platform fee on tips received
            </p>
          </div>

          <ul className="mt-8 space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-surface-700">
                <Check className="h-4 w-4 shrink-0 text-primary-500" />
                {f}
              </li>
            ))}
          </ul>

          <Link
            to="/login"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 text-sm font-medium text-white shadow-medium transition-all hover:bg-primary-600 hover:shadow-elevated"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>

          <p className="mt-4 text-center text-xs text-surface-400">
            No credit card required. No lock-in contracts.
          </p>
        </motion.div>
      </motion.div>
    </section>
  )
}
