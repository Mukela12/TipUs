import { Zap, Heart, Eye, Scale } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/lib/animations'

const benefits = [
  {
    icon: Zap,
    title: 'Zero tech headaches',
    description:
      'No POS integration, no Stripe account, no hardware to buy. Just print a QR code and you\'re live.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: Heart,
    title: 'Keep your best staff',
    description:
      'Staff who feel appreciated stay longer. Digital tips show your team their work is valued — every shift.',
    color: 'bg-rose-100 text-rose-600',
  },
  {
    icon: Eye,
    title: 'Full visibility',
    description:
      'Real-time dashboard shows who tipped, when, and how much. No more guessing about cash in a jar.',
    color: 'bg-sky-100 text-sky-600',
  },
  {
    icon: Scale,
    title: 'Fair distribution',
    description:
      'Prorated tip splits based on hours worked. No spreadsheets, no arguments — just fair, automatic payouts.',
    color: 'bg-emerald-100 text-emerald-600',
  },
]

export default function BenefitsSection() {
  return (
    <section className="bg-surface-50 py-20 sm:py-24" aria-label="Benefits">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto max-w-5xl px-5 sm:px-8"
      >
        <motion.h2
          variants={fadeInUp}
          className="text-center text-2xl font-bold text-surface-900 sm:text-3xl"
        >
          Built for <span className="text-primary-500">busy venue owners</span>
        </motion.h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {benefits.map((b) => (
            <motion.div
              key={b.title}
              variants={fadeInUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group rounded-xl border border-surface-200 bg-white p-6 shadow-soft transition-shadow hover:shadow-medium"
            >
              <motion.div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${b.color.split(' ')[0]}`}
                whileHover={{ scale: 1.15, rotate: -8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                <b.icon className={`h-5 w-5 ${b.color.split(' ')[1]}`} />
              </motion.div>
              <h3 className="mt-4 text-lg font-semibold text-surface-900">
                {b.title}
              </h3>
              <p className="mt-2 text-sm text-surface-600">{b.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
