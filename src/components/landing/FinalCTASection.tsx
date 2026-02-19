import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/lib/animations'

export default function FinalCTASection() {
  return (
    <section className="bg-primary-50 py-20 sm:py-24" aria-label="Get started">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="mx-auto max-w-2xl px-5 text-center sm:px-8"
      >
        <motion.h2
          variants={fadeInUp}
          className="text-2xl font-bold text-surface-900 sm:text-3xl"
        >
          Ready to bring tipping into the{' '}
          <span className="text-primary-500">digital age?</span>
        </motion.h2>

        <motion.p variants={fadeInUp} className="mt-4 text-surface-600">
          Join Australian venues making it easy for customers to show
          appreciation.
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
      </motion.div>
    </section>
  )
}
