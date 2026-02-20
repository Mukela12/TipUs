import { Link } from 'react-router-dom'

function scrollToSection(href: string) {
  const el = document.querySelector(href)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

const sectionLinks = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export default function LandingFooter() {
  return (
    <footer className="py-10">
      {/* Gradient divider */}
      <div className="mx-auto mb-10 h-px max-w-xs bg-gradient-to-r from-transparent via-surface-200 to-transparent" />
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Logo and tagline */}
          <div className="flex items-center gap-2">
            <img src="/savings.png" alt="TipUs" className="h-7 w-7 rounded-md" />
            <span className="text-sm font-semibold text-surface-700">TipUs</span>
            <span className="text-xs text-surface-400">&middot; Made in Australia</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {sectionLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-sm text-surface-500 transition-colors hover:text-surface-700"
              >
                {link.label}
              </button>
            ))}
            <Link
              to="/privacy"
              className="text-sm text-surface-500 transition-colors hover:text-surface-700"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-sm text-surface-500 transition-colors hover:text-surface-700"
            >
              Terms of Service
            </Link>
          </nav>
        </div>

        <p className="mt-8 text-center text-xs text-surface-400">
          &copy; {new Date().getFullYear()} TipUs. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
