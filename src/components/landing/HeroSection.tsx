import { Link } from 'react-router-dom'
import { ArrowRight, QrCode, Smartphone, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import HeroIllustration from './HeroIllustration'

const features = [
  { icon: QrCode, label: 'QR Tipping' },
  { icon: Smartphone, label: 'Apple Pay & Google Pay' },
  { icon: Wallet, label: 'Automatic Payouts' },
]

const trustItems = ['Free to set up', '5% platform fee only', 'No Stripe account needed']

function scrollToSection(href: string) {
  const el = document.querySelector(href)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

export default function HeroSection() {
  return (
    <section className="mx-auto max-w-6xl overflow-hidden px-5 pt-12 pb-20 sm:px-8 sm:pt-20 sm:pb-24" aria-label="Hero">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr,auto] lg:gap-12">
        {/* Text column */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="text-center lg:text-left"
        >
          <motion.h1
            variants={fadeInUp}
            className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl lg:text-5xl"
          >
            Your customers want to tip.{' '}
            <span className="text-primary-500">Make it effortless.</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="mx-auto mt-5 max-w-xl text-base text-surface-600 sm:text-lg lg:mx-0"
          >
            Customers scan a QR code, tip by card or Apple Pay, and your team gets
            paid automatically. No hardware. No merchant account. Set up in 5
            minutes.
          </motion.p>

          <motion.div variants={fadeInUp} className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-8 py-3.5 text-sm font-medium text-white shadow-medium transition-all hover:bg-primary-600 hover:shadow-elevated"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => scrollToSection('#how-it-works')}
              className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
            >
              See How It Works &darr;
            </button>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            variants={fadeInUp}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 lg:justify-start"
          >
            {trustItems.map((item, i) => (
              <span key={item} className="flex items-center gap-2 text-sm text-surface-500">
                {i > 0 && <span className="hidden text-surface-300 sm:inline">&bull;</span>}
                {item}
              </span>
            ))}
          </motion.div>

          {/* Feature badges */}
          <motion.div
            variants={fadeInUp}
            className="mt-8 flex flex-wrap items-center justify-center gap-6 lg:justify-start"
          >
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
                  <f.icon className="h-4 w-4 text-primary-600" />
                </div>
                <span className="text-sm font-medium text-surface-700">{f.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Illustration column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
          className="flex justify-center lg:justify-end"
        >
          <HeroIllustration />
        </motion.div>
      </div>
    </section>
  )
}
