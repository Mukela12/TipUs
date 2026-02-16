import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 px-4">
      <p className="text-7xl font-bold text-primary-500">404</p>
      <h1 className="mt-4 text-2xl font-bold text-surface-900">Page not found</h1>
      <p className="mt-2 text-surface-500">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
    </div>
  )
}
