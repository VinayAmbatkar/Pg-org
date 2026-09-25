import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/infrastructure/api/errors'
import { useAuth } from '@/infrastructure/auth/AuthProvider'
import { loginSchema, type LoginFormValues } from '../schemas/login.schema'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginFormValues) {
    setFormError(null)
    try {
      await login(values)
      navigate(safeReturnPath((location.state as { from?: Partial<Location> } | null)?.from), { replace: true })
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Unable to log in. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <p className="text-xl font-semibold">PGMet</p>
          <h1 className="text-lg font-medium text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Log in to manage your properties</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="identifier">Email or phone</Label>
            <Input
              id="identifier"
              autoComplete="username"
              invalid={Boolean(errors.identifier)}
              {...register('identifier')}
            />
            {errors.identifier && (
              <p className="text-sm text-destructive" role="alert">
                {errors.identifier.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              invalid={Boolean(errors.password)}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {formError && (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          )}

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Log in
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Get started
          </Link>
        </p>
      </div>
    </div>
  )
}

/** Where to go after login: the page that bounced the user to /login (path + query, so filters
 * survive), but only if it's an in-app path. `//evil.com` or an absolute URL is protocol-relative /
 * cross-origin and falls back to the dashboard — no open redirect even if history state is tampered. */
function safeReturnPath(from: Partial<Location> | undefined): string {
  const path = `${from?.pathname ?? ''}${from?.search ?? ''}`
  return path.startsWith('/app/') && !path.startsWith('//') ? path : '/app/dashboard'
}
