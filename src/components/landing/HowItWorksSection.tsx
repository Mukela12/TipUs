import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import Lottie from 'lottie-react'
import registerAnimation from '@/assets/Register.json'
import qrScanAnimation from '@/assets/QR Scan.json'
import bankTransferAnimation from '@/assets/bank to bank transfer.json'

const steps = [
  {
    number: '1',
    title: 'Register & add your team',
    description:
      'Create your venue and add your employees. Each team member sets up their own bank details for direct payouts.',
    animation: registerAnimation,
    lottieSize: 'h-11 w-11',
  },
  {
    number: '2',
    title: 'We send your QR codes',
    description:
      'We create QR codes for your venue and send them to you. They can be for the whole team or for specific employees. Place them on tables, counters, or at the till.',
    animation: qrScanAnimation,
    lottieSize: 'h-14 w-14',
  },
  {
    number: '3',
    title: 'Tips flow automatically',
    description:
      'Customers scan and tip from their phone. We collect the money, split it fairly, and send it to each team member\'s bank account.',
    animation: bankTransferAnimation,
    lottieSize: 'h-14 w-14',
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
          className="font-heading text-center text-2xl font-bold text-surface-900 sm:text-3xl"
        >
          Three steps. Five minutes.{' '}
          <span className="italic text-primary-500">Tips flowing.</span>
        </motion.h2>

        <motion.div
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.3 } } }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="relative mt-14 grid gap-10 sm:grid-cols-3 sm:gap-6"
        >
          {/* Animated connecting line (desktop only) */}
          <motion.div
            className="absolute top-10 left-[16.7%] right-[16.7%] hidden h-px origin-left sm:block"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
          >
            <div className="h-px border-t-2 border-dashed border-surface-200/60" />
          </motion.div>

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
              }}
              className="relative flex flex-col items-center text-center"
            >
              {/* Pulse ring */}
              <motion.div
                className="absolute top-0 h-20 w-20 rounded-full bg-primary-200/40"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: [0.8, 1.4, 0], opacity: [0, 0.6, 0] }}
                viewport={{ once: true }}
                transition={{ delay: 1.4 + i * 0.6, duration: 1.2 }}
              />

              <motion.div
                variants={iconPulse}
                className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white/80 shadow-medium backdrop-blur-sm border border-white/60"
              >
                <Lottie
                  animationData={step.animation}
                  loop
                  className={step.lottieSize}
                />
              </motion.div>

              <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary-500">
                Step {step.number}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-surface-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-surface-600">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
