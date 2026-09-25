import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

interface OccupancyDonutProps {
  occupied: number
  vacant: number
  occupancyRate: number | null
}

// Keep in sync with OccupancyCard's legend colours.
const OCCUPIED_COLOR = '#4775ed'
const VACANT_COLOR = '#dfe5f0'

/** Decorative: the same numbers are always rendered as text next to it (the legend), so the chart
 * is aria-hidden and never the only carrier of the data. */
export function OccupancyDonut({ occupied, vacant, occupancyRate }: OccupancyDonutProps) {
  const total = occupied + vacant
  const data =
    total === 0
      ? [{ name: 'Empty', value: 1, color: VACANT_COLOR }]
      : [
          { name: 'Occupied', value: occupied, color: OCCUPIED_COLOR },
          { name: 'Vacant', value: vacant, color: VACANT_COLOR },
        ]

  return (
    <div className="relative h-32 w-32 shrink-0" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={58}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-[#182345]">{occupancyRate === null ? '—' : `${occupancyRate}%`}</span>
      </div>
    </div>
  )
}
