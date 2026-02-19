import { UserPlus, QrCode, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/lib/animations'

const steps = [
  {
    icon: UserPlus,
    number: '1',
    title: 'Sign up & add your team',
    description:
      'Create your venue in minutes. Invite your staff by name — they don\'t even need an account to start receiving tips.',
  },
  {
    icon: QrCode,
    number: '2',
    title: 'Place your QR codes',
    description:
      'Generate and print QR codes for tables, counters, or anywhere customers can see them. That\'s your only hardware.',
  },
  {
    icon: BarChart3,
    number: '3',
    title: 'Watch tips come in',
    description:
      'Track tips in real time from your dashboard. Tips are automatically split and distributed to your team.',
  },
]

const iconPulse = {
  hidden: { scale: 0.6, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 200, damping: 15 },
  },
}

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-24" aria-label="How it works">
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
          Three steps. Five minutes.{' '}
          <span className="text-primary-500">Tips flowing.</span>
        </motion.h2>

        <div className="relative mt-14 grid gap-10 sm:grid-cols-3 sm:gap-6">
          {/* Animated connecting line (desktop only) */}
          <motion.div
            className="absolute top-10 left-[16.7%] right-[16.7%] hidden h-px origin-left sm:block"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
          >
            <div className="h-px border-t-2 border-dashed border-surface-200" />
          </motion.div>

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              variants={fadeInUp}
              className="relative flex flex-col items-center text-center"
            >
              {/* Pulse ring */}
              <motion.div
                className="absolute top-0 h-16 w-16 rounded-full bg-primary-200/40"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: [0.8, 1.4, 0], opacity: [0, 0.6, 0] }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 + i * 0.3, duration: 1.2 }}
              />

              <motion.div
                variants={iconPulse}
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500 text-white shadow-medium"
              >
                <step.icon className="h-7 w-7" />
              </motion.div>
              <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary-500">
                Step {step.number}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-surface-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-surface-600">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
