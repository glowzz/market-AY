import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { label: '集市', icon: '🏠', path: '/' },
  { label: '发痛点', icon: '📢', path: '/publish' },
  { label: '分享方案', icon: '💡', path: '/share' },
  { label: '榜单', icon: '📊', path: '/leaderboard' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around py-2">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                active ? 'text-purple-600' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
