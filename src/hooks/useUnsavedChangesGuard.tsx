import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'

/** Protects a dirty form from accidental loss: in-app navigation asks for confirmation, and closing
 * or reloading the tab triggers the browser's own prompt. Pass `when = isDirty && !isSubmitting`
 * so the redirect after a successful save is never blocked. Render the returned element. */
export function useUnsavedChangesGuard(when: boolean) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => when && currentLocation.pathname !== nextLocation.pathname)

  useEffect(() => {
    if (!when) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [when])

  return (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      onClose={() => blocker.reset?.()}
      onConfirm={() => blocker.proceed?.()}
      title="Discard unsaved changes?"
      description="You have changes on this page that haven't been saved. Leaving now will lose them."
      confirmLabel="Discard changes"
    />
  )
}
