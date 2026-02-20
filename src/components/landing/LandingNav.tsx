import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const navLinks = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

function scrollToSection(href: string) {
  const el = document.querySelector(href)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-30 transition-all duration-200 ${
        scrolled
          ? 'bg-primary-50/70 backdrop-blur-xl saturate-[180%] border-b border-primary-100/30 shadow-soft'
          : 'bg-primary-50/40'
      }`}
    >
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 sm:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src="/savings.png" alt="TipUs" className="h-9 w-9 rounded-lg" />
          <span className="text-xl font-semibold text-surface-900">TipUs</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollToSection(link.href)}
              className="relative text-sm font-medium text-surface-600 transition-colors hover:text-primary-600 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary-500 after:transition-all after:duration-200 hover:after:w-full"
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden text-sm font-medium text-surface-600 transition-colors hover:text-surface-900 sm:inline-block"
          >
            Sign In
          </Link>
          <Link
            to="/login"
            className="rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white shadow-[0_2px_10px_rgba(212,133,106,0.25)] transition-all hover:bg-primary-600 hover:shadow-[0_4px_16px_rgba(212,133,106,0.35)]"
          >
            Get Started Free
          </Link>
        </div>
      </nav>
    </header>
  )
}
