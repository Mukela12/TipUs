import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/lib/animations'

const benefits = [
  {
    title: 'No hardware. No setup headaches.',
    description:
      'No POS integration, no card readers, no merchant account. We send you the QR codes. You just place them and your team starts earning tips.',
    gradient: 'from-primary-100/80 to-primary-50/40',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Your team gets paid directly.',
    description:
      'Employees add their own bank details. Tips go from customers to their accounts on a schedule you pick: weekly, fortnightly, or monthly.',
    gradient: 'from-emerald-100/80 to-emerald-50/40',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Complete transparency.',
    description:
      'Your dashboard shows every tip as it happens. Who tipped, when, and how much. No guessing, no end-of-night surprises.',
    gradient: 'from-sky-100/80 to-sky-50/40',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: 'Staff stay longer.',
    description:
      'People don\'t leave jobs where they feel valued. When tips actually reach your staff, they notice. And they stick around.',
    gradient: 'from-rose-100/80 to-rose-50/40',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
]

export default function BenefitsSection() {
  return (
    <section className="py-20 sm:py-24" aria-label="Benefits">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="mx-auto max-w-5xl px-5 sm:px-8"
      >
        <motion.p
          variants={fadeInUp}
          className="text-center text-sm font-medium uppercase tracking-widest text-primary-500"
        >
          Why TipUs
        </motion.p>
        <motion.h2
          variants={fadeInUp}
          className="font-heading mt-3 text-center text-2xl font-bold text-surface-900 sm:text-3xl lg:text-4xl"
        >
          Everything your venue needs.{' '}
          <span className="italic text-primary-500">Nothing it doesn't.</span>
        </motion.h2>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {benefits.map((b) => (
            <motion.div
              key={b.title}
              variants={fadeInUp}
              className="group relative overflow-hidden rounded-2xl p-6 sm:p-8"
            >
              {/* Glass background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${b.gradient} opacity-60 transition-opacity duration-300 group-hover:opacity-100`} />
              <div className="absolute inset-0 backdrop-blur-[2px]" />
              <div className="absolute inset-[0.5px] rounded-2xl border border-white/60" />

              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-surface-700 shadow-soft">
                  {b.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-surface-900">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-600">
                  {b.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
