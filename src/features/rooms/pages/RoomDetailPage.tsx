import {
  BedDouble,
  Building,
  Camera,
  ChevronRight,
  DoorOpen,
  IndianRupee,
  Layers,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
  UserRound,
  Users,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { APP_PATHS } from '@/app/router/paths'
import { MetricCard } from '@/components/data-display/MetricCard'
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { SectionBoundary } from '@/components/feedback/ErrorBoundary'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageSpinner } from '@/components/feedback/PageSpinner'
import { QueryState } from '@/components/feedback/QueryState'
import { useToast } from '@/components/feedback/ToastProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TabPanel, Tabs } from '@/components/ui/tabs'
import { BedForm } from '@/features/beds/components/BedForm'
import { useBeds } from '@/features/beds/hooks/useBeds'
import { useArchiveBed, useCreateBed, useUpdateBed } from '@/features/beds/hooks/useBedMutations'
import type { BedEditFormValues, BedFormValues } from '@/features/beds/schemas/bed.schema'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { useSyncCurrentProperty } from '@/features/properties/hooks/useSyncCurrentProperty'
import { useUrlState } from '@/hooks/useUrlState'
import { ApiError } from '@/infrastructure/api/errors'
import { hasPermission } from '@/infrastructure/permissions/permissions'
import { formatCurrency } from '@/lib/formatters/currency'
import { formatDate } from '@/lib/formatters/date'
import { ROOM_TYPE_LABELS } from '@/lib/formatters/enumLabels'
import { isSafeHttpUrl } from '@/lib/validators/url'
import type { Bed, BedOccupant, RoomHistoryEntry } from '@/types/api'
import { AmenityTiles } from '../components/amenities'
import { AssignBedDialog } from '../components/AssignBedDialog'
import { BedLegend, RoomBedLayout } from '../components/RoomBedLayout'
import { RoomPhoto } from '../components/RoomCard'
import { RoomForm } from '../components/RoomForm'
import { RoomStatusBadge } from '../components/RoomStatusBadge'
import { useRoom } from '../hooks/useRoom'
import { useRoomHistory } from '../hooks/useRoomHistory'
import { useArchiveRoom, useUpdateRoom } from '../hooks/useRoomMutations'
import { floorLabel } from '../lib/roomFilters'
import { roomPrice, roomSubtitle, roomTypeLine } from '../lib/roomDisplay'
import { toUpdateRoomPayload, type RoomFormValues } from '../schemas/room.schema'

const TAB_ID = 'room-detail'

type OccupiedBed = Bed & { occupant: BedOccupant }

export function RoomDetailPage() {
  const { propertyId = '', roomId = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const organization = useCurrentOrganization()
  const role = organization?.yourRole
  useSyncCurrentProperty(propertyId)

  const canManageRooms = hasPermission(role, 'rooms.manage')
  const canArchiveRoom = hasPermission(role, 'rooms.archive')
  const canManageBeds = hasPermission(role, 'beds.manage')
  const canArchiveBed = hasPermission(role, 'beds.archive')
  const canAssign = hasPermission(role, 'residency.manage')

  const { data: room, isLoading, error, refetch } = useRoom(propertyId, roomId)
  const bedsQuery = useBeds(propertyId, roomId)
  const [tab, setTab] = useUrlState('tab', 'beds')

  const updateRoom = useUpdateRoom(propertyId, roomId)
  const archiveRoom = useArchiveRoom(propertyId)
  const createBed = useCreateBed(propertyId, roomId)
  const archiveBed = useArchiveBed(propertyId, roomId)

  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false)
  const [roomFormError, setRoomFormError] = useState<string | null>(null)
  const [confirmArchiveRoom, setConfirmArchiveRoom] = useState(false)
  const [isPhotoOpen, setIsPhotoOpen] = useState(false)
  const [isAddBedOpen, setIsAddBedOpen] = useState(false)
  const [bedFormError, setBedFormError] = useState<string | null>(null)
  const [editingBed, setEditingBed] = useState<Bed | null>(null)
  const [bedEditFormError, setBedEditFormError] = useState<string | null>(null)
  const [archivingBed, setArchivingBed] = useState<Bed | null>(null)
  const [assigningBed, setAssigningBed] = useState<Bed | null>(null)
  const updateBed = useUpdateBed(propertyId, roomId, editingBed?.id ?? '')

  if (isLoading) return <PageSpinner />
  if (error || !room) return <ErrorState error={error} onRetry={() => refetch()} />

  const beds = (bedsQuery.data ?? []).filter((b) => b.status !== 'ARCHIVED')
  const occupants = beds.filter((b): b is OccupiedBed => Boolean(b.occupant))
  const price = roomPrice(room)
  const { totalBeds, occupiedBeds, vacantBeds, blockedBeds } = room.occupancy
  const pct = (n: number) => (totalBeds > 0 ? `${Math.round((n / totalBeds) * 100)}% of beds` : undefined)

  const tabs = [
    { value: 'beds', label: 'Bed Layout' },
    { value: 'tenants', label: `Tenants (${occupants.length})` },
    { value: 'details', label: 'Details' },
    { value: 'amenities', label: 'Amenities' },
    { value: 'history', label: 'History' },
  ]
  const activeTab = tabs.some((t) => t.value === tab) ? tab : 'beds'

  async function handleUpdateRoom(values: RoomFormValues) {
    setRoomFormError(null)
    try {
      await updateRoom.mutateAsync(toUpdateRoomPayload(values))
      toast({ title: 'Room updated', variant: 'success' })
      setIsEditRoomOpen(false)
    } catch (err) {
      setRoomFormError(err instanceof ApiError ? err.message : 'Unable to update room.')
    }
  }

  async function handleArchiveRoom() {
    try {
      await archiveRoom.mutateAsync(roomId)
      toast({ title: 'Room archived', variant: 'success' })
      setConfirmArchiveRoom(false)
      navigate(APP_PATHS.rooms)
    } catch (err) {
      toast({ title: 'Unable to archive room', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  async function handleCreateBed(values: BedFormValues) {
    setBedFormError(null)
    try {
      await createBed.mutateAsync({ bedNumber: values.bedNumber, berth: values.berth || undefined })
      toast({ title: 'Bed added', variant: 'success' })
      setIsAddBedOpen(false)
    } catch (err) {
      setBedFormError(err instanceof ApiError ? err.message : 'Unable to add bed.')
    }
  }

  async function handleUpdateBed(values: BedEditFormValues) {
    if (!editingBed) return
    setBedEditFormError(null)
    try {
      await updateBed.mutateAsync({ bedNumber: values.bedNumber, status: values.status, berth: values.berth || null })
      toast({ title: 'Bed updated', variant: 'success' })
      setEditingBed(null)
    } catch (err) {
      setBedEditFormError(err instanceof ApiError ? err.message : 'Unable to update bed.')
    }
  }

  async function handleArchiveBed() {
    if (!archivingBed) return
    try {
      await archiveBed.mutateAsync(archivingBed.id)
      toast({ title: 'Bed archived', variant: 'success' })
      setArchivingBed(null)
      setEditingBed(null)
    } catch (err) {
      toast({ title: 'Unable to archive bed', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  const tenantColumns: DataTableColumn<OccupiedBed>[] = [
    {
      key: 'name',
      header: 'Tenant',
      render: (b) => (
        <Link
          to={`/app/residencies/${b.occupant.residencyId}`}
          onClick={(e) => e.stopPropagation()}
          className="font-medium underline underline-offset-2"
        >
          {b.occupant.name}
        </Link>
      ),
    },
    { key: 'phone', header: 'Phone', render: (b) => b.occupant.phone ?? '—' },
    {
      key: 'bed',
      header: 'Bed',
      render: (b) => `${b.bedNumber}${b.berth ? ` · ${b.berth === 'LOWER' ? 'Lower' : 'Upper'}` : ''}`,
    },
    { key: 'since', header: 'Checked in', render: (b) => formatDate(b.occupant.since) },
    {
      key: 'rent',
      header: 'Monthly rent',
      render: (b) =>
        b.occupant.monthlyRent ? formatCurrency(b.occupant.monthlyRent, b.occupant.currency ?? 'INR') : 'No rent plan',
    },
  ]

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-5">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-xs text-muted-foreground">
            <li>
              <Link to={APP_PATHS.rooms} className="hover:text-foreground hover:underline">
                Rooms &amp; Beds
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="h-3 w-3" />
            </li>
            <li aria-current="page" className="font-medium text-[#182345]">
              Room {room.roomNumber}
            </li>
          </ol>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-[#182345]">Room {room.roomNumber}</h1>
              <RoomStatusBadge status={room.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{roomSubtitle(room)}</p>
          </div>
          <div className="flex gap-2">
            {canManageRooms && (
              <Button variant="outline" className="gap-2" onClick={() => setIsEditRoomOpen(true)}>
                <Pencil className="h-4 w-4" aria-hidden="true" /> Edit room
              </Button>
            )}
            {canArchiveRoom && room.status !== 'ARCHIVED' && (
              <Button
                variant="outline"
                size="icon"
                className="text-destructive"
                aria-label="Archive room"
                onClick={() => setConfirmArchiveRoom(true)}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>

        <section aria-label="Room summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            label="Total beds"
            value={totalBeds}
            hint={blockedBeds > 0 ? `${blockedBeds} blocked` : `Capacity ${room.capacity}`}
            icon={BedDouble}
            tone="violet"
          />
          <MetricCard label="Occupied" value={occupiedBeds} hint={pct(occupiedBeds)} icon={UserCheck} tone="green" />
          <MetricCard label="Vacant" value={vacantBeds} hint={pct(vacantBeds)} icon={UserRound} tone="orange" />
          <MetricCard
            label="Rent per bed"
            value={price ?? 'Not set'}
            hint={price ? 'per month' : undefined}
            icon={IndianRupee}
            tone="blue"
          />
        </section>

        <Tabs items={tabs} value={activeTab} onChange={setTab} label="Room sections" idBase={TAB_ID} />

        <TabPanel idBase={TAB_ID} value={activeTab}>
          <SectionBoundary resetKeys={[roomId, activeTab]}>
            {activeTab === 'beds' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <BedLegend />
                  {canManageBeds && (
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => setIsAddBedOpen(true)}
                      disabled={totalBeds >= room.capacity}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" /> Add bed
                    </Button>
                  )}
                </div>
                {canManageBeds && totalBeds >= room.capacity && (
                  <p className="text-xs text-muted-foreground">
                    This room is at capacity ({room.capacity}). Increase capacity to add beds.
                  </p>
                )}
                <QueryState isLoading={bedsQuery.isLoading} error={bedsQuery.error} onRetry={() => void bedsQuery.refetch()}>
                  <RoomBedLayout
                    beds={beds}
                    canAssign={canAssign && room.status === 'ACTIVE'}
                    canManageBeds={canManageBeds}
                    onAssign={setAssigningBed}
                    onEdit={setEditingBed}
                    onAddBed={() => setIsAddBedOpen(true)}
                  />
                </QueryState>
              </div>
            )}

            {activeTab === 'tenants' && (
              <DataTable
                caption={`Tenants in room ${room.roomNumber}`}
                columns={tenantColumns}
                data={occupants}
                rowKey={(b) => b.id}
                isLoading={bedsQuery.isLoading}
                error={bedsQuery.error}
                onRetry={() => void bedsQuery.refetch()}
                onRowClick={(b) => navigate(`/app/residencies/${b.occupant.residencyId}`)}
                emptyState={<EmptyState icon={Users} title="Nobody is staying in this room right now" />}
              />
            )}

            {activeTab === 'details' && (
              <dl className="grid gap-4 rounded-xl border border-[#edf0f6] bg-white p-5 text-sm sm:grid-cols-2">
                <DetailRow label="Room number" value={room.roomNumber} />
                <DetailRow label="Room type" value={`${roomTypeLine(room)} sharing`} />
                <DetailRow label="Floor" value={floorLabel(room.floor ?? 'none')} />
                <DetailRow label="Capacity" value={`${room.capacity} bed${room.capacity === 1 ? '' : 's'}`} />
                <DetailRow
                  label="Beds set up"
                  value={`${totalBeds} (${occupiedBeds} occupied, ${vacantBeds} vacant, ${blockedBeds} blocked)`}
                />
                <DetailRow label="Rent per bed" value={price ? `${price} / month` : 'Not set'} />
                <DetailRow label="Status" value={<RoomStatusBadge status={room.status} />} />
                <DetailRow label="Added" value={formatDate(room.createdAt)} />
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Description</dt>
                  <dd className="mt-0.5 whitespace-pre-line">{room.description ?? '—'}</dd>
                </div>
              </dl>
            )}

            {activeTab === 'amenities' && (
              <div className="space-y-3 rounded-xl border border-[#edf0f6] bg-white p-5">
                <AmenityTiles amenities={room.amenities} showAbsent />
                {canManageRooms && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditRoomOpen(true)}>
                    Edit amenities
                  </Button>
                )}
              </div>
            )}

            {activeTab === 'history' && <RoomHistory propertyId={propertyId} roomId={roomId} />}
          </SectionBoundary>
        </TabPanel>
      </div>

      <aside
        aria-label="Room information"
        className="h-fit space-y-5 rounded-xl border border-[#edf0f6] bg-white p-4 shadow-[0_4px_16px_rgba(32,52,95,0.04)] xl:sticky xl:top-4"
      >
        <div className="relative h-48 overflow-hidden rounded-lg">
          <RoomPhoto room={room} iconClassName="h-14 w-14" />
          {canManageRooms && (
            <Button
              size="sm"
              variant="outline"
              className="absolute bottom-2 right-2 gap-1.5 bg-white/95"
              onClick={() => setIsPhotoOpen(true)}
            >
              <Camera className="h-3.5 w-3.5" aria-hidden="true" /> {room.imageUrl ? 'Change photo' : 'Add photo'}
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#182345]">Room {room.roomNumber}</h2>
          <RoomStatusBadge status={room.status} />
        </div>

        <dl className="space-y-2.5 text-xs">
          <InfoRow icon={DoorOpen} label="Room number" value={room.roomNumber} />
          <InfoRow icon={Layers} label="Room type" value={`${roomTypeLine(room)} sharing`} />
          <InfoRow icon={Users} label="Sharing type" value={`${ROOM_TYPE_LABELS[room.roomType]} sharing`} />
          <InfoRow icon={Building} label="Floor" value={floorLabel(room.floor ?? 'none')} />
          <InfoRow icon={BedDouble} label="Total beds" value={totalBeds} />
          <InfoRow icon={UserCheck} label="Occupied beds" value={occupiedBeds} />
          <InfoRow icon={UserRound} label="Vacant beds" value={vacantBeds} />
          <InfoRow icon={IndianRupee} label="Rent per bed" value={price ? `${price} / month` : 'Not set'} />
        </dl>

        <div className="border-t border-[#edf0f6] pt-4">
          <h3 className="mb-2 text-xs font-bold text-[#182345]">Amenities</h3>
          <AmenityTiles amenities={room.amenities} />
        </div>

        {room.description && (
          <div className="border-t border-[#edf0f6] pt-4">
            <h3 className="mb-1 text-xs font-bold text-[#182345]">Description</h3>
            <p className="whitespace-pre-line text-xs text-[#4b5675]">{room.description}</p>
          </div>
        )}
      </aside>

      <Dialog
        open={isEditRoomOpen}
        onClose={() => {
          setIsEditRoomOpen(false)
          setRoomFormError(null)
        }}
        preventClose={updateRoom.isPending}
        title="Edit room"
        className="max-w-2xl"
      >
        <RoomForm
          defaultValues={{
            roomNumber: room.roomNumber,
            floor: room.floor ?? undefined,
            roomType: room.roomType,
            capacity: room.capacity,
            pricePerBed: room.pricePerBed ? room.pricePerBed.replace(/\.00$/, '') : '',
            amenities: room.amenities,
            imageUrl: room.imageUrl ?? '',
            description: room.description ?? '',
          }}
          submitLabel="Save changes"
          formError={roomFormError}
          onCancel={() => {
            setIsEditRoomOpen(false)
            setRoomFormError(null)
          }}
          onSubmit={handleUpdateRoom}
        />
      </Dialog>

      {isPhotoOpen && (
        <PhotoDialog
          currentUrl={room.imageUrl}
          isSaving={updateRoom.isPending}
          onClose={() => setIsPhotoOpen(false)}
          onSave={async (imageUrl) => {
            try {
              await updateRoom.mutateAsync({ imageUrl })
              toast({ title: imageUrl ? 'Photo updated' : 'Photo removed', variant: 'success' })
              setIsPhotoOpen(false)
            } catch (err) {
              toast({
                title: 'Unable to update photo',
                description: err instanceof ApiError ? err.message : undefined,
                variant: 'error',
              })
            }
          }}
        />
      )}

      <ConfirmDialog
        open={confirmArchiveRoom}
        onClose={() => setConfirmArchiveRoom(false)}
        onConfirm={handleArchiveRoom}
        title={`Archive Room ${room.roomNumber}?`}
        description={
          occupiedBeds > 0
            ? `${occupiedBeds} tenant(s) are still checked in here. Archiving hides the room from active operations; check them out first if they're leaving.`
            : 'Archiving hides the room from active operations. Its beds and history stay linked to it.'
        }
        confirmLabel="Archive room"
        isLoading={archiveRoom.isPending}
      />

      <Dialog
        open={isAddBedOpen}
        onClose={() => {
          setIsAddBedOpen(false)
          setBedFormError(null)
        }}
        preventClose={createBed.isPending}
        title="Add bed"
      >
        <BedForm
          submitLabel="Add bed"
          formError={bedFormError}
          onCancel={() => {
            setIsAddBedOpen(false)
            setBedFormError(null)
          }}
          onSubmit={handleCreateBed}
        />
      </Dialog>

      <Dialog
        open={Boolean(editingBed)}
        onClose={() => {
          setEditingBed(null)
          setBedEditFormError(null)
        }}
        preventClose={updateBed.isPending}
        title={`Edit bed ${editingBed?.bedNumber ?? ''}`}
      >
        {editingBed && (
          <div className="space-y-4">
            <BedForm
              mode="edit"
              defaultValues={{
                bedNumber: editingBed.bedNumber,
                status: editingBed.status === 'ARCHIVED' ? 'INACTIVE' : editingBed.status,
                berth: editingBed.berth ?? '',
              }}
              submitLabel="Save changes"
              formError={bedEditFormError}
              onCancel={() => {
                setEditingBed(null)
                setBedEditFormError(null)
              }}
              onSubmit={handleUpdateBed}
            />
            {canArchiveBed && (
              <div className="border-t border-border pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-destructive"
                  onClick={() => setArchivingBed(editingBed)}
                  disabled={Boolean(editingBed.occupant)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Archive this bed
                </Button>
                {editingBed.occupant && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Check {editingBed.occupant.name} out before archiving this bed.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={Boolean(archivingBed)}
        onClose={() => setArchivingBed(null)}
        onConfirm={handleArchiveBed}
        title={`Archive bed ${archivingBed?.bedNumber ?? ''}?`}
        description="The bed is removed from the room's layout and can't take new tenants. Its history stays viewable."
        confirmLabel="Archive bed"
        isLoading={archiveBed.isPending}
      />

      {assigningBed && (
        <AssignBedDialog
          propertyId={propertyId}
          bed={assigningBed}
          roomNumber={room.roomNumber}
          onClose={() => setAssigningBed(null)}
        />
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-[#182345]">{value}</dd>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof BedDouble; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="text-right font-medium text-[#182345]">{value}</dd>
    </div>
  )
}

function RoomHistory({ propertyId, roomId }: { propertyId: string; roomId: string }) {
  const { data, isLoading, error, refetch } = useRoomHistory(propertyId, roomId)
  const columns: DataTableColumn<RoomHistoryEntry>[] = [
    {
      key: 'tenant',
      header: 'Tenant',
      render: (h) => (
        <Link
          to={`/app/residencies/${h.residencyId}`}
          onClick={(e) => e.stopPropagation()}
          className="font-medium underline underline-offset-2"
        >
          {h.tenantName}
        </Link>
      ),
    },
    { key: 'bed', header: 'Bed', render: (h) => h.bedNumber },
    { key: 'in', header: 'Checked in', render: (h) => formatDate(h.startDate) },
    { key: 'out', header: 'Checked out', render: (h) => (h.endDate ? formatDate(h.endDate) : '—') },
    {
      key: 'status',
      header: 'Status',
      render: (h) => (
        <Badge variant={h.status === 'ACTIVE' ? 'success' : 'secondary'}>
          {h.status === 'ACTIVE' ? 'Staying' : h.status === 'ENDED' ? 'Checked out' : 'Cancelled'}
        </Badge>
      ),
    },
  ]
  return (
    <DataTable
      caption="Room history"
      columns={columns}
      data={data}
      rowKey={(h) => h.allocationId}
      isLoading={isLoading}
      error={error}
      onRetry={() => void refetch()}
      emptyState={
        <EmptyState title="No check-ins yet" description="Check-ins and check-outs for this room's beds will appear here." />
      }
    />
  )
}

/** Sets the room photo from an http(s) link. pg-backend has no file upload service yet, so the image
 * must be hosted elsewhere; the backend validates the URL too. */
function PhotoDialog({
  currentUrl,
  isSaving,
  onClose,
  onSave,
}: {
  currentUrl: string | null
  isSaving: boolean
  onClose: () => void
  onSave: (url: string | null) => Promise<void>
}) {
  const [url, setUrl] = useState(currentUrl ?? '')
  const [error, setError] = useState<string | null>(null)
  const trimmed = url.trim()

  return (
    <Dialog
      open
      onClose={onClose}
      preventClose={isSaving}
      title={currentUrl ? 'Change photo' : 'Add photo'}
      description="Paste a link to an image of this room (https://…)."
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!trimmed || !isSafeHttpUrl(trimmed)) {
            setError('Enter a full http(s) image link.')
            return
          }
          setError(null)
          void onSave(trimmed)
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="photo-url">Image link</Label>
          <Input
            id="photo-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            invalid={Boolean(error)}
            aria-describedby={error ? 'photo-url-error' : undefined}
          />
          {error && (
            <p id="photo-url-error" className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
        {trimmed && isSafeHttpUrl(trimmed) && (
          <img src={trimmed} alt="Preview" referrerPolicy="no-referrer" className="h-40 w-full rounded-lg object-cover" />
        )}
        <div className="flex flex-wrap justify-between gap-3">
          {currentUrl ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive"
              onClick={() => void onSave(null)}
              disabled={isSaving}
            >
              Remove photo
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Save photo
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
