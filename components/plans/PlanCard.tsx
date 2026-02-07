import Link from 'next/link'
import { TrainingPlan } from '@/types/database'
import { formatDate } from '@/lib/utils'

interface PlanCardProps {
  plan: TrainingPlan
  exerciseCount?: number
}

export default function PlanCard({ plan, exerciseCount = 0 }: PlanCardProps) {
  return (
    <Link
      href={`/plans/${plan.id}`}
      className="card hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
          {plan.name}
        </h3>
        {plan.is_template && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            Šablona
          </span>
        )}
      </div>

      {plan.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {plan.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{exerciseCount} cviků</span>
        <span>{formatDate(plan.created_at)}</span>
      </div>
    </Link>
  )
}
