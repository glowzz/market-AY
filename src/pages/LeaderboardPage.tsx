import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'
import { usePoints } from '../hooks/usePoints'
import { ProfileContext } from '../App'
import { useContext } from 'react'

type TabKey = 'pain_points' | 'solutions' | 'eagle_eye'

interface PainPointRow {
  id: string
  title: string
  votes: number
  bounty: number
  profiles: { nickname: string; avatar: string } | null
}

interface SolutionRow {
  id: string
  title: string
  votes: number
  purchases: number
  profiles: { nickname: string; avatar: string } | null
}

interface EagleEyeEntry {
  author_id: string
  nickname: string
  avatar: string
  resolvedCount: number
}

export default function LeaderboardPage() {
  const navigate = useNavigate()
  const profile = useContext(ProfileContext)
  const { checkIn } = usePoints(profile, () => window.location.reload())

  const [activeTab, setActiveTab] = useState<TabKey>('pain_points')
  const [toast, setToast] = useState('')

  const [painPoints, setPainPoints] = useState<PainPointRow[]>([])
  const [solutions, setSolutions] = useState<SolutionRow[]>([])
  const [eagleEye, setEagleEye] = useState<EagleEyeEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPainPoints() {
      const { data } = await supabase
        .from('pain_points')
        .select('id, title, votes, bounty, profiles!pain_points_author_id_fkey(nickname, avatar)')
        .order('votes', { ascending: false })
        .limit(10)
      setPainPoints((data as unknown as PainPointRow[]) ?? [])
    }

    async function fetchSolutions() {
      const { data } = await supabase
        .from('solutions')
        .select('id, title, votes, purchases, profiles(nickname, avatar)')
        .order('votes', { ascending: false })
        .limit(10)
      setSolutions((data as unknown as SolutionRow[]) ?? [])
    }

    async function fetchEagleEye() {
      const { data } = await supabase
        .from('pain_points')
        .select('author_id, profiles!pain_points_author_id_fkey(nickname, avatar)')
        .eq('status', 'resolved')
      if (!data) { setEagleEye([]); return }

      // Aggregate by author_id on the frontend
      const map = new Map<string, EagleEyeEntry>()
      for (const row of data) {
        const p = row.profiles as unknown as { nickname: string; avatar: string } | null
        const existing = map.get(row.author_id)
        if (existing) {
          existing.resolvedCount++
        } else {
          map.set(row.author_id, {
            author_id: row.author_id,
            nickname: p?.nickname ?? '匿名',
            avatar: p?.avatar ?? '👤',
            resolvedCount: 1,
          })
        }
      }
      const sorted = Array.from(map.values()).sort((a, b) => b.resolvedCount - a.resolvedCount)
      setEagleEye(sorted)
    }

    setLoading(true)
    Promise.all([fetchPainPoints(), fetchSolutions(), fetchEagleEye()]).finally(() => setLoading(false))
  }, [])

  async function handleCheckIn() {
    const result = await checkIn()
    if (result) {
      setToast(result.message)
      setTimeout(() => setToast(''), 3000)
    }
  }

  const medals = ['🥇', '🥈', '🥉']
  const rankBg = [
    'bg-gradient-to-r from-yellow-400 to-orange-300 text-white',
    'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800',
    'bg-gradient-to-r from-orange-200 to-orange-300 text-gray-800',
  ]

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'pain_points', label: '痛点榜' },
    { key: 'solutions', label: '方案榜' },
    { key: 'eagle_eye', label: '慧眼奖' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar profile={profile} onCheckIn={handleCheckIn} />

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-purple-600 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium animate-pulse">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white text-gray-800 px-4 py-2 flex items-center gap-3 border-b border-gray-100">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-2xl hover:opacity-80 text-gray-600"
        >
          ←
        </button>
        <h1 className="text-lg font-bold">📊 热度榜单</h1>
      </div>

      {/* Tab bar */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="flex max-w-lg mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-center text-sm font-medium transition-colors relative ${
                activeTab === tab.key ? 'text-purple-600' : 'text-gray-500'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-purple-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-24 max-w-lg mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            加载中...
          </div>
        ) : (
          <>
            {/* 痛点榜 */}
            {activeTab === 'pain_points' && (
              painPoints.length === 0 ? (
                <div className="text-center text-gray-400 py-20">暂无数据</div>
              ) : (
                <div className="space-y-3">
                  {painPoints.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/pain-point/${item.id}`)}
                      className={`w-full text-left rounded-xl p-4 shadow-sm transition-transform hover:scale-[1.01] ${
                        idx < 3 ? rankBg[idx] : 'bg-white text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {idx < 3 ? medals[idx] : `${idx + 1}`}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{item.title}</p>
                          <p className={`text-xs mt-0.5 ${idx < 3 ? 'opacity-80' : 'text-gray-400'}`}>
                            {item.profiles?.nickname ?? '匿名'} · 👍 {item.votes} · 💰 {item.bounty}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )
            )}

            {/* 方案榜 */}
            {activeTab === 'solutions' && (
              solutions.length === 0 ? (
                <div className="text-center text-gray-400 py-20">暂无数据</div>
              ) : (
                <div className="space-y-3">
                  {solutions.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/solution/${item.id}`)}
                      className={`w-full text-left rounded-xl p-4 shadow-sm transition-transform hover:scale-[1.01] ${
                        idx < 3 ? rankBg[idx] : 'bg-white text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {idx < 3 ? medals[idx] : `${idx + 1}`}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{item.title}</p>
                          <p className={`text-xs mt-0.5 ${idx < 3 ? 'opacity-80' : 'text-gray-400'}`}>
                            {item.profiles?.nickname ?? '匿名'} · 👍 {item.votes} · 🛒 {item.purchases ?? 0}次购买
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )
            )}

            {/* 慧眼奖 */}
            {activeTab === 'eagle_eye' && (
              eagleEye.length === 0 ? (
                <div className="text-center text-gray-400 py-20">暂无数据</div>
              ) : (
                <div className="space-y-3">
                  {eagleEye.map((entry, idx) => (
                    <div
                      key={entry.author_id}
                      className={`rounded-xl p-4 shadow-sm ${
                        idx < 3 ? rankBg[idx] : 'bg-white text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {idx < 3 ? medals[idx] : `${idx + 1}`}
                        </span>
                        <span className="text-2xl">{entry.avatar}</span>
                        <div className="flex-1">
                          <p className="font-bold">{entry.nickname}</p>
                          <p className={`text-xs mt-0.5 ${idx < 3 ? 'opacity-80' : 'text-gray-400'}`}>
                            已解决 {entry.resolvedCount} 个痛点
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
