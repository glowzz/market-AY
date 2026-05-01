import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ProfileContext } from '../App'
import { supabase } from '../lib/supabase'
import VoteButton from '../components/VoteButton'
import CommentSection from '../components/CommentSection'
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

export default function PainPointDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const profile = useContext(ProfileContext)

  const [item, setItem] = useState<PainPoint | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionMessage, setActionMessage] = useState('')

  useEffect(() => {
    if (!id) return
    async function fetch() {
      setLoading(true)
      const { data } = await supabase
        .from('pain_points')
        .select('*, profiles(nickname, avatar)')
        .eq('id', id)
        .single()
      if (data) setItem(data as PainPoint)
      setLoading(false)
    }
    fetch()
  }, [id])

  async function handleClaim() {
    if (!profile || !id) return
    setActionMessage('')
    const { error } = await supabase.rpc('claim_pain_point', {
      p_user_id: profile.id,
      p_pain_point_id: id,
    })
    if (error) {
      setActionMessage(error.message)
    } else {
      setActionMessage('认领成功！')
      // Refresh item
      const { data } = await supabase
        .from('pain_points')
        .select('*, profiles(nickname, avatar)')
        .eq('id', id)
        .single()
      if (data) setItem(data as PainPoint)
    }
    setTimeout(() => setActionMessage(''), 3000)
  }

  async function handleResolve() {
    if (!id) return
    setActionMessage('')
    const { error } = await supabase.rpc('resolve_pain_point', {
      p_pain_point_id: id,
    })
    if (error) {
      setActionMessage(error.message)
    } else {
      setActionMessage('已标记解决！')
      const { data } = await supabase
        .from('pain_points')
        .select('*, profiles(nickname, avatar)')
        .eq('id', id)
        .single()
      if (data) setItem(data as PainPoint)
    }
    setTimeout(() => setActionMessage(''), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">加载中...</div>
    )
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-gray-500">未找到该痛点</p>
        <button onClick={() => navigate('/')} className="text-red-500 font-medium">
          返回首页
        </button>
      </div>
    )
  }

  const statusLabel: Record<string, string> = {
    open: '🟢 悬赏中',
    claimed: '🟡 已认领',
    resolved: '✅ 已解决',
  }

  const isClaimer = item.status === 'claimed' && profile?.id === item.author_id

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-700 text-white px-4 pt-12 pb-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-2xl mb-3 hover:opacity-80"
        >
          ←
        </button>
        <h1 className="text-xl font-bold">📢 痛点详情</h1>
      </div>

      <div className="px-4 -mt-4 max-w-lg mx-auto space-y-4">
        {/* Author info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-lg">
            {item.profiles?.avatar ?? '👤'}
          </div>
          <div>
            <span className="font-bold text-gray-800">{item.profiles?.nickname ?? '匿名'}</span>
            <span className="text-xs text-gray-400 ml-2">{timeAgo(item.created_at)}</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-gray-900">{item.title}</h2>

        {/* Description card */}
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>
        </div>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Bounty card */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-yellow-800">
              悬赏积分 💰 {item.bounty}
            </span>
            <span className="text-sm text-yellow-600">
              {statusLabel[item.status] ?? item.status}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <VoteButton
            targetId={item.id}
            targetType="pain_point"
            currentVotes={item.votes}
          />

          {item.status === 'open' && (
            <button
              onClick={handleClaim}
              className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              🎯 认领悬赏
            </button>
          )}

          {item.status === 'claimed' && isClaimer && (
            <button
              onClick={handleResolve}
              className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              ✅ 标记解决
            </button>
          )}

          {item.status === 'resolved' && (
            <span className="bg-green-100 text-green-700 rounded-lg px-4 py-2 text-sm font-medium">
              已解决 ✓
            </span>
          )}
        </div>

        {actionMessage && (
          <p className="text-sm text-red-500">{actionMessage}</p>
        )}

        {/* Comments */}
        <div className="bg-white rounded-xl shadow p-4">
          <CommentSection targetId={item.id} targetType="pain_point" />
        </div>
      </div>
    </div>
  )
}
