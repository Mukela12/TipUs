import { CreditCard, TrendingUp, Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer, scaleIn } from '@/lib/animations'
import AnimatedCounter from './AnimatedCounter'

const stats = [
  {
    icon: CreditCard,
    value: '75%',
    label: 'of Australian transactions are now cashless',
  },
  {
    icon: TrendingUp,
    value: '3x',
    label: 'growth in digital tipping since 2020',
  },
  {
    icon: Heart,
    value: '82%',
    label: 'of diners say they would tip if it were easier',
  },
]

export default function ProblemSection() {
  return (
    <section className="bg-surface-50 py-20 sm:py-24" aria-label="The problem">
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
          Cash tips are disappearing.{' '}
          <span className="text-primary-500">Your staff feel it.</span>
        </motion.h2>

        <motion.p
          variants={fadeInUp}
          className="mx-auto mt-4 max-w-2xl text-center text-surface-600"
        >
          Australia is one of the most cashless economies in the world. Fewer
          wallets mean fewer tips — but your team works just as hard. TipUs
          bridges the gap by letting customers tip digitally in seconds.
        </motion.p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {stats.map((s) => (
            <motion.div
              key={s.value}
              variants={scaleIn}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-xl border border-surface-200 bg-white p-6 text-center shadow-soft transition-shadow hover:shadow-medium"
            >
              <motion.div
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <s.icon className="h-6 w-6 text-primary-600" />
              </motion.div>
              <p className="mt-4 text-3xl font-bold text-surface-900">
                <AnimatedCounter value={s.value} />
              </p>
              <p className="mt-2 text-sm text-surface-600">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
