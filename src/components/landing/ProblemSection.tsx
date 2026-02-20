import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer, scaleIn } from '@/lib/animations'
import AnimatedCounter from './AnimatedCounter'
import Lottie from 'lottie-react'
import creditCardAnimation from '@/assets/Credit Card.json'
import nfcPaymentAnimation from '@/assets/Ciphra Payment NFC.json'
import coinAnimation from '@/assets/Fake 3D vector coin.json'

const stats = [
  {
    animation: creditCardAnimation,
    value: '84%',
    label: 'of in-person payments in Australia are now cashless',
    source: 'RBA Consumer Payments Survey, 2022',
  },
  {
    animation: nfcPaymentAnimation,
    value: '25%',
    label: 'increase in average tip value year-on-year in 2024',
    source: 'Zeller 2024 Tipping Report',
  },
  {
    animation: coinAnimation,
    value: '57%',
    label: 'of diners are more likely to tip when prompted at payment',
    source: 'Restaurant Business Australia',
  },
]

export default function ProblemSection() {
  return (
    <section className="py-20 sm:py-24" aria-label="The problem">
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
          <span className="italic text-primary-500">Your staff feel it.</span>
        </motion.h2>

        <motion.p
          variants={fadeInUp}
          className="mx-auto mt-4 max-w-2xl text-center text-surface-600"
        >
          Australia is one of the most cashless economies in the world.
          Fewer people carry cash, so fewer people leave tips. But your
          team works just as hard. TipUs gives customers a way to tip
          from their phone in seconds.
        </motion.p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {stats.map((s) => (
            <motion.div
              key={s.value}
              variants={scaleIn}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-2xl border border-surface-100 bg-gradient-to-br from-white to-surface-50/50 p-6 text-center shadow-soft transition-all hover:shadow-medium"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center">
                <Lottie
                  animationData={s.animation}
                  loop
                  className="h-16 w-16"
                />
              </div>
              <p className="mt-3 text-3xl font-bold text-surface-900">
                <AnimatedCounter value={s.value} />
              </p>
              <p className="mt-2 text-sm text-surface-600">{s.label}</p>
              <p className="mt-3 text-[10px] text-surface-400">{s.source}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
