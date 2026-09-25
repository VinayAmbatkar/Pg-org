import { Building2, ClipboardList, UtensilsCrossed, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

const FEATURES = [
  { icon: Building2, label: 'Properties, rooms & beds' },
  { icon: ClipboardList, label: 'Tenants & residency' },
  { icon: Wallet, label: 'Rent & billing' },
  { icon: UtensilsCrossed, label: 'Food & operations' },
]

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold">PGMet</span>
          <div className="flex items-center gap-3">
            <Link to="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
              Login
            </Link>
            <Link to="/register" className={cn(buttonVariants({ size: 'sm' }))}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Manage your PG with PGMet
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Properties, tenants, rent, complaints, food, and day-to-day operations — all in one
          place for owners and managers.
        </p>
        <div className="mt-8 flex gap-3">
          <Link to="/register" className={cn(buttonVariants({ size: 'lg' }))}>
            Get Started
          </Link>
          <Link to="/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
            Login
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
              {label}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
