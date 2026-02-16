import Link from 'next/link'
import { TrainingPlan } from '@/types/database'
import { formatDate } from '@/lib/utils'

interface PlanCardProps {
  plan: TrainingPlan
  exerciseCount?: number
}

export default function PlanCard({ plan, exerciseCount = 0 }: PlanCardProps) {
  return (
    <div className="card hover:shadow-md transition-shadow group relative">
      <Link href={`/plans/${plan.id}`} className="block">
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

      {/* Print button */}
      <Link
        href={`/plans/${plan.id}/print`}
        target="_blank"
        onClick={(e) => e.stopPropagation()}
        className="absolute top-3 right-3 p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        title="Vytisknout plán"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
      </Link>
    </div>
  )
}
