import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/lib/animations'

const faqs = [
  {
    q: 'How does TipUs work?',
    a: 'Customers scan a QR code at your venue using their phone camera. They choose a tip amount and pay instantly by card, Apple Pay, or Google Pay. Tips are tracked in your real-time dashboard and automatically distributed to your team.',
  },
  {
    q: 'Do I need a Stripe account?',
    a: 'No. TipUs handles all payment processing for you. You don\'t need to set up a Stripe account, a merchant account, or any payment gateway. We take care of everything.',
  },
  {
    q: 'How much does TipUs cost?',
    a: 'TipUs is completely free to set up with no monthly fees. We charge a simple 5% platform fee on tips received. Standard payment processing fees (Stripe\'s rate) also apply. There are no hidden costs or lock-in contracts.',
  },
  {
    q: 'How do employees get paid?',
    a: 'Tips are automatically distributed to your team members based on your chosen split method — either equal splits or prorated by hours worked. Funds are transferred to their linked bank accounts on your chosen payout schedule.',
  },
  {
    q: 'How does tip splitting work?',
    a: 'You choose how tips are divided: equally among all staff on shift, or prorated based on hours worked. TipUs handles the maths automatically — no more spreadsheets or end-of-night counting.',
  },
  {
    q: 'Can I have QR codes for individual staff members?',
    a: 'Yes! You can create QR codes linked to individual team members or to the venue as a whole. Venue-level QR codes pool tips for splitting, while individual codes go directly to that staff member.',
  },
  {
    q: 'Is digital tipping legal in Australia?',
    a: 'Yes. Digital tipping is completely legal in Australia. Tips are considered a gift from the customer to the staff member. We recommend checking with your accountant regarding tax implications for your specific situation.',
  },
  {
    q: 'What payment methods do customers use?',
    a: 'Customers can tip using any credit or debit card (Visa, Mastercard, Amex), Apple Pay, or Google Pay. No app download is required — the tipping page works in any mobile browser.',
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="bg-surface-50 py-20 sm:py-24" aria-label="Frequently asked questions">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto max-w-2xl px-5 sm:px-8"
      >
        <motion.h2
          variants={fadeInUp}
          className="text-center text-2xl font-bold text-surface-900 sm:text-3xl"
        >
          Frequently asked questions
        </motion.h2>

        <motion.div variants={fadeInUp} className="mt-12 divide-y divide-surface-200">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between py-5 text-left"
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
