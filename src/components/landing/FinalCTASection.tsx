import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/lib/animations'

export default function FinalCTASection() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32" aria-label="Get started">
      {/* Subtle ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-200/20 blur-[100px]" />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="relative mx-auto max-w-2xl px-5 text-center sm:px-8"
      >
        <motion.h2
          variants={fadeInUp}
          className="font-heading text-3xl font-bold text-surface-900 sm:text-4xl"
        >
          Ready to bring tipping into the{' '}
          <span className="italic text-primary-500">digital age?</span>
        </motion.h2>

        <motion.p variants={fadeInUp} className="mt-5 text-lg text-surface-600">
          Set up takes five minutes. Your team could be earning more tips by tonight.
        </motion.p>

        <motion.div variants={fadeInUp} className="mt-10">
          <Link
            to="/login"
            className="inline-flex items-center gap-2.5 rounded-2xl bg-primary-500 px-10 py-4 text-base font-medium text-white shadow-elevated transition-all hover:bg-primary-600 hover:shadow-[0_12px_40px_rgba(212,133,106,0.35)]"
          >
            Get Started Free
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>
        </motion.div>

        <motion.p variants={fadeInUp} className="mt-5 text-sm text-surface-400">
          Free to set up. No credit card required.
        </motion.p>
      </motion.div>
    </section>
  )
}
