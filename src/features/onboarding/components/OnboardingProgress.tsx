import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Step {
  label: string
  done: boolean
}

export function OnboardingProgress({ steps }: { steps: Step[] }) {
  return (
    <ol className="flex flex-col gap-2 text-sm">
      {steps.map((step) => (
        <li key={step.label} className="flex items-center gap-2">
          {step.done ? (
            <Check className="h-4 w-4 text-success" aria-hidden="true" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
          <span className={cn(step.done ? 'text-foreground' : 'text-muted-foreground')}>{step.label}</span>
        </li>
      ))}
    </ol>
  )
}
