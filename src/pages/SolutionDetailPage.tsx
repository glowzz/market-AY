import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ProfileContext } from '../App'
import { supabase } from '../lib/supabase'
import VoteButton from '../components/VoteButton'
import CommentSection from '../components/CommentSection'

interface SolutionDetail {
  id: string
  author_id: string
  pain_point_id: string
  title: string
  description: string
  content: string
  price: number
  is_free: boolean
  tags: string[]
  votes: number
  purchases: number
  created_at: string
  profiles?: { nickname: string; avatar: string }
}

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

export default function SolutionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const profile = useContext(ProfileContext)

  const [item, setItem] = useState<SolutionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchased, setPurchased] = useState(false)
  const [actionMessage, setActionMessage] = useState('')

  useEffect(() => {
    if (!id) return
    async function fetch() {
      setLoading(true)
      const { data } = await supabase
        .from('solutions')
        .select('*, profiles(nickname, avatar)')
        .eq('id', id)
        .single()
      if (data) setItem(data as SolutionDetail)
      setLoading(false)
    }
    fetch()
  }, [id])

  // Check purchase status when item and profile are ready
  useEffect(() => {
    if (!id || !profile || !item) return
    // If own solution, no need to check
    if (item.author_id === profile.id) return
    // If free, no need to check
    if (item.price === 0) return

    async function checkPurchase() {
      const { data } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', profile!.id)
        .eq('solution_id', id!)
        .maybeSingle()
      if (data) setPurchased(true)
    }
    checkPurchase()
  }, [id, profile, item])

  async function handlePurchase() {
    if (!profile || !id) return
    setActionMessage('')
    const { error } = await supabase.rpc('purchase_solution', {
      p_user_id: profile.id,
      p_solution_id: id,
    })
    if (error) {
      setActionMessage(error.message)
    } else {
      setPurchased(true)
      setActionMessage('购买成功！')
      // Refresh to update purchase count
      const { data } = await supabase
        .from('solutions')
        .select('*, profiles(nickname, avatar)')
        .eq('id', id)
        .single()
      if (data) setItem(data as SolutionDetail)
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
        <p className="text-gray-500">未找到该方案</p>
        <button onClick={() => navigate('/')} className="text-green-500 font-medium">
          返回首页
        </button>
      </div>
    )
  }

  const isOwner = profile?.id === item.author_id
  const canViewContent = isOwner || item.price === 0 || purchased

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-700 text-white px-4 pt-12 pb-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-2xl mb-3 hover:opacity-80"
        >
          ←
        </button>
        <h1 className="text-xl font-bold">💡 方案详情</h1>
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

        {/* Content area */}
        <div className="relative bg-white rounded-xl shadow p-4">
          {canViewContent ? (
            <div className="whitespace-pre-wrap text-gray-700">{item.content}</div>
          ) : (
            <div className="relative">
              <div className="blur select-none whitespace-pre-wrap text-gray-700">
                {item.content}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60">
                <span className="text-4xl mb-2">🔒</span>
                <span className="text-gray-500 font-medium">购买后查看完整内容</span>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <VoteButton
            targetId={item.id}
            targetType="solution"
            currentVotes={item.votes}
          />

          {!isOwner && (
            item.price === 0 ? (
              <button
                onClick={handlePurchase}
                className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                🆓 免费获取
              </button>
            ) : purchased ? (
              <span className="bg-green-100 text-green-700 rounded-lg px-4 py-2 text-sm font-medium">
                已购买 ✓
              </span>
            ) : (
              <button
                onClick={handlePurchase}
                className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                🔓 购买查看 (💰{item.price})
              </button>
            )
          )}
        </div>

        {actionMessage && (
          <p className="text-sm text-red-500">{actionMessage}</p>
        )}

        {/* Comments */}
        <div className="bg-white rounded-xl shadow p-4">
          <CommentSection targetId={item.id} targetType="solution" />
        </div>
      </div>
    </div>
  )
}
