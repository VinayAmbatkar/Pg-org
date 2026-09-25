import type { ReactNode } from 'react'
import { OnboardingProgress } from './OnboardingProgress'

interface OnboardingShellProps {
  title: string
  description: string
  currentStep: 'organization' | 'property' | 'ready'
  children: ReactNode
}

export function OnboardingShell({ title, description, currentStep, children }: OnboardingShellProps) {
  const steps = [
    { label: 'Organization', done: currentStep !== 'organization' },
    { label: 'Property', done: currentStep === 'ready' },
    { label: 'Ready', done: false },
  ]

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card p-8 lg:block">
        <p className="mb-8 text-lg font-semibold">PGMet</p>
        <OnboardingProgress steps={steps} />
      </aside>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
