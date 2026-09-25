import { CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { OnboardingShell } from '../components/OnboardingShell'

export function ReadyPage() {
  const navigate = useNavigate()

  return (
    <OnboardingShell
      title="You're all set"
      description="Add rooms and beds anytime from your property page."
      currentStep="ready"
    >
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-success" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          Your organization and first property are ready. Head to your dashboard to configure
          rooms, beds, and start managing tenants.
        </p>
        <Button className="w-full" onClick={() => navigate('/app/dashboard', { replace: true })}>
          Go to dashboard
        </Button>
      </div>
    </OnboardingShell>
  )
}
