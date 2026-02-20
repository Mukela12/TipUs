import { motion } from 'framer-motion'
import Lottie from 'lottie-react'
import qrScanAnimation from '@/assets/QR Scan.json'

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35, ease: 'easeOut' as const },
})

/* ── iOS Status Bar Icons (accurate SVG) ── */

function SignalBars() {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" fill="#1a202c">
      <rect x="0" y="9" width="3" height="3" rx="0.5" />
      <rect x="4.5" y="6" width="3" height="6" rx="0.5" />
      <rect x="9" y="3" width="3" height="9" rx="0.5" />
      <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
    </svg>
  )
}

function WifiIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="#1a202c" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="8" cy="11" r="0.8" fill="#1a202c" stroke="none" />
      <path d="M5.5 9C6.2 8.2 7.1 7.5 8 7.5s1.8 0.7 2.5 1.5" />
      <path d="M3 6.5C4.3 5 6.1 4 8 4s3.7 1 5 2.5" />
      <path d="M0.5 4C2.5 1.5 5.1 0.5 8 0.5s5.5 1 7.5 3.5" />
    </svg>
  )
}

function BatteryIcon() {
  return (
    <svg width="27" height="13" viewBox="0 0 27 13">
      <rect x="0.5" y="0.5" width="22" height="12" rx="2.5" ry="2.5" fill="none" stroke="#1a202c" strokeWidth="1" opacity="0.35" />
      <rect x="2" y="2" width="19" height="9" rx="1.5" fill="#34C759" />
      <rect x="23.5" y="4" width="2" height="5" rx="1" fill="#1a202c" opacity="0.4" />
    </svg>
  )
}

export default function HeroIllustration() {
  return (
    <div className="relative">
      {/* Ambient glow */}
      <div className="absolute -inset-8 rounded-[60px] bg-primary-200/15 blur-[40px]" />

      {/* Phone body */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
        className="phone-body relative"
        style={{
          padding: '10px',
          borderRadius: '44px',
          background: 'linear-gradient(135deg, #2c2c2e 0%, #3a3a3c 20%, #1c1c1e 40%, #3a3a3c 60%, #2c2c2e 80%, #1c1c1e 100%)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: `
            0 1px 1px hsl(0deg 0% 0% / 0.08),
            0 2px 2px hsl(0deg 0% 0% / 0.08),
            0 4px 4px hsl(0deg 0% 0% / 0.08),
            0 8px 8px hsl(0deg 0% 0% / 0.08),
            0 16px 16px hsl(0deg 0% 0% / 0.06),
            0 32px 40px hsl(0deg 0% 0% / 0.05)
          `,
        }}
      >
        {/* Side buttons */}
        <div
          className="absolute"
          style={{ left: '-2px', top: '80px', width: '3px', height: '24px', borderRadius: '0 1px 1px 0', background: '#3a3a3c' }}
        />
        <div
          className="absolute"
          style={{ left: '-2px', top: '115px', width: '3px', height: '38px', borderRadius: '0 1px 1px 0', background: '#3a3a3c' }}
        />
        <div
          className="absolute"
          style={{ right: '-2px', top: '105px', width: '3px', height: '32px', borderRadius: '1px 0 0 1px', background: '#3a3a3c' }}
        />

        {/* Screen */}
        <div
          className="phone-screen relative overflow-hidden bg-white"
          style={{
            borderRadius: '34px',
            boxShadow: 'inset 0 0 2px rgba(0,0,0,0.15)',
          }}
        >
          {/* Glass reflection overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-50"
            style={{
              background: 'linear-gradient(-135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 25%, transparent 50%)',
              borderRadius: '34px',
            }}
          />

          {/* Dynamic Island */}
          <div className="flex justify-center pt-2">
            <div
              style={{
                width: '80px',
                height: '22px',
                borderRadius: '11px',
                background: '#000',
              }}
            />
          </div>

          {/* Status bar */}
          <motion.div {...fadeIn(0.3)} className="flex items-center justify-between px-5 pt-1 pb-2">
            <span
              className="font-semibold text-[#1a202c]"
              style={{ fontSize: '14px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
            >
              9:41
            </span>
            <div className="flex items-center gap-1.5">
              <SignalBars />
              <WifiIcon />
              <BatteryIcon />
            </div>
          </motion.div>

          {/* Screen content */}
          <div className="px-4 pb-5">
            {/* Header bar */}
            <motion.div {...fadeIn(0.5)} className="flex items-center justify-between rounded-2xl bg-primary-50 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500">
                  <span className="text-[11px] font-bold text-white">T</span>
                </div>
                <span className="text-[15px] font-bold text-primary-500">TipUs</span>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-100">
                <svg viewBox="0 0 12 12" className="h-3 w-3 text-surface-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M2 2l8 8M10 2l-8 8" />
                </svg>
              </div>
            </motion.div>

            {/* QR Code area */}
            <motion.div {...fadeIn(0.7)} className="mt-4 flex justify-center">
              <div className="rounded-2xl border border-surface-100 overflow-hidden">
                <Lottie
                  animationData={qrScanAnimation}
                  loop
                  className="h-47 w-47"
                />
              </div>
            </motion.div>

            {/* Label */}
            <motion.p {...fadeIn(0.9)} className="mt-2 text-center text-[11px] text-surface-400">
              Scan to tip your server
            </motion.p>

            {/* Tip amounts */}
            <motion.div {...fadeIn(1.1)} className="mt-3 flex justify-center gap-2.5">
              {['$5', '$10', '$20'].map((amount) => (
                <motion.div
                  key={amount}
                  animate={amount === '$10' ? {
                    backgroundColor: '#d4856a',
                    color: '#ffffff',
                  } : {}}
                  transition={{ delay: 2.2, duration: 0.25 }}
                  className="flex h-11 w-[60px] items-center justify-center rounded-xl bg-primary-50 text-[15px] font-semibold text-primary-500"
                >
                  {amount}
                </motion.div>
              ))}
            </motion.div>

            {/* Payment methods */}
            <motion.div {...fadeIn(1.3)} className="mt-3 flex justify-center gap-2">
              {/* Apple Pay */}
              <div className="flex h-9 items-center gap-1.5 rounded-lg bg-[#0f172a] px-3.5">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="white">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                <span className="text-[10px] font-medium text-white">Pay</span>
              </div>

              {/* Google Pay */}
              <div className="flex h-9 items-center gap-1 rounded-lg border border-surface-200 bg-white px-3.5">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                  <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="#4285F4" />
                </svg>
                <span className="text-[10px] font-medium text-surface-600">Pay</span>
              </div>

              {/* Card */}
              <div className="flex h-9 items-center gap-2 rounded-lg border border-surface-200 bg-white px-3">
                <span className="text-[9px] font-extrabold tracking-tight text-[#1A1F71]">VISA</span>
                <div className="flex -space-x-1.5">
                  <div className="h-3.5 w-3.5 rounded-full bg-[#EB001B]" />
                  <div className="h-3.5 w-3.5 rounded-full bg-[#F79E1B] opacity-90" />
                </div>
              </div>
            </motion.div>

            {/* Pay button */}
            <motion.div {...fadeIn(1.5)} className="mt-4">
              <div className="flex h-12 items-center justify-center rounded-2xl bg-primary-500 text-[15px] font-semibold text-white"
                style={{ boxShadow: '0 2px 8px rgba(212,133,106,0.35)' }}
              >
                Tip $10.00
              </div>
            </motion.div>

            {/* Success state */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 3.0, duration: 0.4, ease: 'easeOut' }}
              className="mt-4 flex flex-col items-center pb-2"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 shadow-sm">
                <svg viewBox="0 0 16 16" className="h-4.5 w-4.5" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3.5 8.5l3 3 6-7" />
                </svg>
              </div>
              <span className="mt-1.5 text-[11px] font-semibold text-green-600">Tip sent!</span>
            </motion.div>
          </div>

          {/* Home indicator */}
          <div className="flex justify-center pb-2">
            <div className="h-[4px] w-[100px] rounded-full bg-surface-900/20" />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
