import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/lib/animations'

const faqs = [
  {
    q: 'How does TipUs work?',
    a: 'You register your venue and add your employees. We create QR codes for your venue and send them to you. When a customer scans a code, they pick a tip amount and pay by card, Apple Pay, or Google Pay. The money comes to TipUs, and we automatically distribute it to your team\'s bank accounts.',
  },
  {
    q: 'Do I need a Stripe account or merchant account?',
    a: 'No. TipUs handles all payment processing. You don\'t need to set up Stripe, a merchant account, or any payment gateway. We take care of everything from collection to distribution.',
  },
  {
    q: 'How much does TipUs cost?',
    a: 'TipUs is free to set up with no monthly fees. We charge a 5% platform fee on tips received. Standard payment processing fees also apply. No hidden costs, no lock-in contracts.',
  },
  {
    q: 'How do employees get paid?',
    a: 'Each employee adds their own bank details to their TipUs profile. Tips go directly to their bank accounts on a schedule you choose: weekly, fortnightly, or monthly.',
  },
  {
    q: 'How are tips divided among staff?',
    a: 'QR codes can be assigned to individual team members, so tips go directly to the right person. For venue-wide QR codes, tips are pooled and distributed proportionally across your active team. No spreadsheets or end-of-night counting.',
  },
  {
    q: 'Who creates the QR codes?',
    a: 'We do. Once you register your venue and add your team, we create QR codes and send them to you. Each code can be for the whole venue or assigned to a specific team member. Just place them where customers can see them.',
  },
  {
    q: 'Is digital tipping legal in Australia?',
    a: 'Yes. Digital tipping is completely legal in Australia. Tips are considered a gift from the customer to the staff member. We recommend checking with your accountant regarding tax implications for your specific situation.',
  },
  {
    q: 'What payment methods do customers use?',
    a: 'Customers can tip using any credit or debit card (Visa, Mastercard, Amex), Apple Pay, or Google Pay. No app download needed. The tipping page works in any mobile browser.',
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20 sm:py-24" aria-label="Frequently asked questions">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto max-w-2xl px-5 sm:px-8"
      >
        <motion.h2
          variants={fadeInUp}
          className="font-heading text-center text-2xl font-bold text-surface-900 sm:text-3xl"
        >
          Frequently asked questions
        </motion.h2>

        <motion.div variants={fadeInUp} className="mt-12 space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-surface-100 bg-gradient-to-br from-white to-surface-50/30 px-5">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between py-4 text-left"
              >
                <span className="text-sm font-medium text-surface-900 sm:text-base">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`ml-4 h-5 w-5 shrink-0 text-surface-400 transition-transform duration-200 ${
                    openIndex === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <p className="pb-5 text-sm text-surface-600">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
