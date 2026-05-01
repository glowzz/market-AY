import PainPointCard from './PainPointCard'
import SolutionCard from './SolutionCard'
import type { PainPoint } from '../hooks/usePainPoints'
import type { Solution } from '../hooks/useSolutions'

type FeedItem =
  | { type: 'pain_point'; data: PainPoint }
  | { type: 'solution'; data: Solution }

interface CardFeedProps {
  painPoints: PainPoint[]
  solutions: Solution[]
}

export default function CardFeed({ painPoints, solutions }: CardFeedProps) {
  const items: FeedItem[] = [
    ...painPoints.map((p) => ({ type: 'pain_point' as const, data: p })),
    ...solutions.map((s) => ({ type: 'solution' as const, data: s })),
  ].sort(
    (a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
  )

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 px-4 sm:px-6">
      {items.map((item) =>
        item.type === 'pain_point' ? (
          <PainPointCard key={item.data.id} item={item.data} />
        ) : (
          <SolutionCard key={item.data.id} item={item.data} />
        )
      )}
    </div>
  )
}
