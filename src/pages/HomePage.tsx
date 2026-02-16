import { Link } from 'react-router-dom'
import { ArrowRight, QrCode, DollarSign, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/lib/animations'

const features = [
  { icon: QrCode, label: 'QR Tipping' },
  { icon: DollarSign, label: 'Auto Payouts' },
  { icon: Shield, label: 'Secure' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-surface-200/40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 sm:px-8">
          <Link to="/" className="flex items-center gap-2">
            <img src="/savings.png" alt="TipUs" className="h-9 w-9 rounded-lg" />
            <span className="text-xl font-semibold text-surface-900">TipUs</span>
          </Link>
          <Link
            to="/login"
            className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-600 hover:shadow-medium"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-3xl px-5 pt-16 pb-12 text-center sm:px-8 sm:pt-24 sm:pb-16 flex-1 flex flex-col items-center justify-center"
      >
        <motion.h1
          variants={fadeInUp}
          className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl lg:text-5xl"
        >
          Digital tipping,{' '}
          <span className="text-primary-500">made simple.</span>
        </motion.h1>
        <motion.p
          variants={fadeInUp}
          className="mx-auto mt-4 max-w-lg text-base text-surface-600 sm:text-lg"
        >
          QR-code powered tips for your venue. Customers scan, tip, and your team gets paid.
        </motion.p>
        <motion.div variants={fadeInUp} className="mt-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-8 py-3.5 text-sm font-medium text-white shadow-medium transition-all hover:bg-primary-600 hover:shadow-elevated"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        {/* Inline feature badges */}
        <motion.div
          variants={fadeInUp}
          className="mt-10 flex items-center justify-center gap-6 sm:gap-8"
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
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-surface-200/60 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-2">
            <img src="/savings.png" alt="TipUs" className="h-6 w-6 rounded-md" />
            <span className="text-sm font-semibold text-surface-700">TipUs</span>
          </div>
          <p className="text-xs text-surface-400">
            &copy; {new Date().getFullYear()} TipUs
          </p>
        </div>
      </footer>
    </div>
  )
}
