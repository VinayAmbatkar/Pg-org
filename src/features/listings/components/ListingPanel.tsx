import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { QueryState } from '@/components/feedback/QueryState'
import { useToast } from '@/components/feedback/ToastProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import type { Property } from '@/types/api'
import { useListing, usePublishListing, useUnpublishListing, useUpdateListing } from '../hooks/useListing'
import { listingFormSchema, missingForPublish, toFormValues, toUpsertPayload, type ListingFormValues } from '../schemas/listing.schema'
import { LISTING_AMENITIES, type Listing, type ListingAmenity } from '../types'
import { ListingStatusBadge } from './ListingStatusBadge'

const AMENITY_LABELS: Record<ListingAmenity, string> = {
  WIFI: 'Wi-Fi',
  LAUNDRY: 'Laundry',
  PARKING: 'Parking',
  AC: 'Air conditioning',
  POWER_BACKUP: 'Power backup',
  HOUSEKEEPING: 'Housekeeping',
  SECURITY: 'Security',
  CCTV: 'CCTV',
  FOOD: 'Food',
  GYM: 'Gym',
  COMMON_AREA: 'Common area',
}

interface ListingPanelProps {
  property: Property
  canManage: boolean
}

/** The property's public listing on the Tenant Web: details + publish / unpublish. */
export function ListingPanel({ property, canManage }: ListingPanelProps) {
  const listing = useListing(property.id)
  return (
    <QueryState isLoading={listing.isLoading} error={listing.error} onRetry={() => void listing.refetch()}>
      {listing.data && <ListingEditor key={listing.data.id} property={property} listing={listing.data} canManage={canManage} />}
    </QueryState>
  )
}

function ListingEditor({ property, listing, canManage }: { property: Property; listing: Listing; canManage: boolean }) {
  const { toast } = useToast()
  const update = useUpdateListing(property.id)
  const publish = usePublishListing(property.id)
  const unpublish = useUnpublishListing(property.id)
  const [confirmUnpublish, setConfirmUnpublish] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ListingFormValues>({ resolver: zodResolver(listingFormSchema), defaultValues: toFormValues(listing) })
  const unsavedChangesDialog = useUnsavedChangesGuard(isDirty && !isSubmitting)

  const published = listing.status === 'PUBLISHED'
  const missing = missingForPublish(listing)
  const propertyInactive = property.status !== 'ACTIVE'

  async function onSave(values: ListingFormValues) {
    setFormError(null)
    // UpsertListingDto can't clear a number once set (omitted = keep, null = rejected).
    let blocked = false
    for (const field of ['startingFromPrice', 'latitude', 'longitude'] as const) {
      const wasSet = field === 'startingFromPrice' ? listing.startingFromPrice !== null : listing[field] !== null
      if (wasSet && values[field] === '') {
        setError(field, { message: "This can't be removed once set - enter a new value instead." })
        blocked = true
      }
    }
    if (blocked) return
    try {
      const saved = await update.mutateAsync(toUpsertPayload(values))
      reset(toFormValues(saved))
      toast({ title: published ? 'Listing updated - changes are live' : 'Listing saved', variant: 'success' })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save the listing.')
    }
  }

  async function onPublish() {
    try {
      await publish.mutateAsync(undefined)
      toast({ title: 'Listing published', description: 'Tenants can now find this property on PGMet.', variant: 'success' })
    } catch (err) {
      toast({ title: 'Unable to publish', description: err instanceof Error ? err.message : undefined, variant: 'error' })
    }
  }

  async function onUnpublish() {
    try {
      await unpublish.mutateAsync(undefined)
      setConfirmUnpublish(false)
      toast({ title: 'Listing unpublished', variant: 'success' })
    } catch (err) {
      toast({ title: 'Unable to unpublish', description: err instanceof Error ? err.message : undefined, variant: 'error' })
    }
  }

  const selectedAmenities = useWatch({ control, name: 'amenities' })
  const fieldError = (message?: string) =>
    message ? (
      <p className="text-sm text-destructive" role="alert">
        {message}
      </p>
    ) : null

  return (
    <div className="space-y-6">
      {unsavedChangesDialog}

      <section aria-labelledby="listing-status-heading" className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 id="listing-status-heading" className="font-semibold">
              Public listing
            </h2>
            <ListingStatusBadge status={listing.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {published
              ? `Visible to tenants on PGMet${listing.publishedAt ? ` since ${new Date(listing.publishedAt).toLocaleDateString()}` : ''}.`
              : 'Not visible to tenants. Publish it so tenants can find, apply to and visit this property.'}
          </p>
          {propertyInactive && published && (
            <p className="flex items-center gap-1.5 text-sm text-warning">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              This property is {property.status.toLowerCase()}, so tenants can't see the listing even though it is published.
            </p>
          )}
          {!published && missing.length > 0 && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Needed before publishing:</span> {missing.join(', ')}.
            </p>
          )}
          {!published && missing.length === 0 && (
            <p className="flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Ready to publish.
            </p>
          )}
        </div>
        {canManage && (
          <div className="flex flex-col items-end gap-1">
            {published ? (
              <Button variant="outline" className="gap-2" onClick={() => setConfirmUnpublish(true)}>
                <EyeOff className="h-4 w-4" aria-hidden="true" /> Unpublish
              </Button>
            ) : (
              <Button className="gap-2" onClick={onPublish} isLoading={publish.isPending} disabled={missing.length > 0 || isDirty || propertyInactive}>
                <Eye className="h-4 w-4" aria-hidden="true" /> Publish
              </Button>
            )}
            {!published && isDirty && <p className="text-xs text-muted-foreground">Save your changes first.</p>}
            {!published && propertyInactive && <p className="text-xs text-muted-foreground">Only active properties can be listed.</p>}
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit(onSave)} noValidate className="space-y-5" aria-label="Listing details">
        <fieldset disabled={!canManage} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="listing-title">Title</Label>
            <Input id="listing-title" maxLength={200} placeholder={property.name} invalid={Boolean(errors.title)} {...register('title')} />
            {fieldError(errors.title?.message)}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="listing-description">Description</Label>
            <textarea
              id="listing-description"
              maxLength={4000}
              rows={5}
              aria-invalid={Boolean(errors.description) || undefined}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Rooms, food, nearby places, house rules…"
              {...register('description')}
            />
            {fieldError(errors.description?.message)}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="listing-city">City</Label>
              <Input id="listing-city" value={property.city} readOnly disabled aria-describedby="listing-city-hint" />
              <p id="listing-city-hint" className="text-xs text-muted-foreground">
                Taken from the property address. Edit the property to change it.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="listing-locality">Locality / area</Label>
              <Input id="listing-locality" maxLength={200} placeholder="e.g. Madhapur" invalid={Boolean(errors.locality)} {...register('locality')} />
              {fieldError(errors.locality?.message)}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="listing-price">Starting from price (₹ / month)</Label>
              <Input id="listing-price" inputMode="decimal" invalid={Boolean(errors.startingFromPrice)} {...register('startingFromPrice')} />
              {fieldError(errors.startingFromPrice?.message)}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="listing-image">Cover image URL</Label>
              <Input id="listing-image" type="url" placeholder="https://…" invalid={Boolean(errors.coverImageUrl)} {...register('coverImageUrl')} />
              {fieldError(errors.coverImageUrl?.message)}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="listing-lat">Latitude (optional)</Label>
              <Input id="listing-lat" inputMode="decimal" invalid={Boolean(errors.latitude)} {...register('latitude')} />
              {fieldError(errors.latitude?.message)}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="listing-lng">Longitude (optional)</Label>
              <Input id="listing-lng" inputMode="decimal" invalid={Boolean(errors.longitude)} {...register('longitude')} />
              {fieldError(errors.longitude?.message)}
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Amenities</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {LISTING_AMENITIES.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2 text-sm">
                  <input id={`amenity-${amenity}`} type="checkbox" value={amenity} className="h-4 w-4 accent-primary" {...register('amenities')} />
                  <label htmlFor={`amenity-${amenity}`}>{AMENITY_LABELS[amenity]}</label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{selectedAmenities.length} selected</p>
          </fieldset>
        </fieldset>

        {formError && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        )}

        {canManage ? (
          <div className="flex gap-3">
            <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
              Save listing
            </Button>
            {isDirty && (
              <Button type="button" variant="ghost" onClick={() => reset(toFormValues(listing))}>
                Discard changes
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Only owners and managers can edit or publish the listing.</p>
        )}
      </form>

      <ConfirmDialog
        open={confirmUnpublish}
        onClose={() => setConfirmUnpublish(false)}
        onConfirm={onUnpublish}
        title="Unpublish this listing?"
        description="Tenants will no longer find this property or be able to apply. Existing applications and visits are not affected. You can publish it again any time."
        confirmLabel="Unpublish"
        isLoading={unpublish.isPending}
      />
    </div>
  )
}
