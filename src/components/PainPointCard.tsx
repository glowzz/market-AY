import { useNavigate } from 'react-router-dom'
import type { PainPoint } from '../hooks/usePainPoints'

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return '刚刚'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  const months = Math.floor(days / 30)
  return `${months}个月前`
}

export default function PainPointCard({ item }: { item: PainPoint }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/pain-point/${item.id}`)}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer break-inside-avoid mb-4 overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
            痛点悬赏
          </span>
          <span className="text-xs text-gray-400">{timeAgo(item.created_at)}</span>
        </div>

        <h3 className="font-bold text-gray-800 mb-1 line-clamp-2">{item.title}</h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.description}</p>

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.map((tag) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-red-500 font-medium">💰 {item.bounty}</span>
          <span className="text-gray-400">👍 {item.votes}</span>
        </div>
      </div>
    </div>
  )
}
