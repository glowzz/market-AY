import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'
import FloatingActionButton from '../components/FloatingActionButton'
import CardFeed from '../components/CardFeed'
import { usePainPoints } from '../hooks/usePainPoints'
import { useSolutions } from '../hooks/useSolutions'
import type { Profile } from '../hooks/useAuth'

interface HomePageProps {
  profile: Profile | null
  onCheckIn: () => void
}

export default function HomePage({ profile, onCheckIn }: HomePageProps) {
  const { items: painPoints, loading: loadingPainPoints } = usePainPoints()
  const { items: solutions, loading: loadingSolutions } = useSolutions()

  const loading = loadingPainPoints || loadingSolutions

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar profile={profile} onCheckIn={onCheckIn} />

      <main className="py-4 pb-20 sm:pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            加载中...
          </div>
        ) : painPoints.length === 0 && solutions.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            暂无内容，快来发布第一个痛点吧！
          </div>
        ) : (
          <CardFeed painPoints={painPoints} solutions={solutions} />
        )}
      </main>

      <FloatingActionButton />
      <BottomNav />
    </div>
  )
}
