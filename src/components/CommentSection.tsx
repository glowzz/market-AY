import { useState, useContext } from 'react'
import { ProfileContext } from '../App'
import { useComments } from '../hooks/useComments'

interface CommentSectionProps {
  targetId: string
  targetType: 'pain_point' | 'solution'
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

export default function CommentSection({ targetId, targetType }: CommentSectionProps) {
  const profile = useContext(ProfileContext)
  const { comments, addComment } = useComments(targetId, targetType)
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    const trimmed = input.trim()
    if (!trimmed || !profile) return

    setSubmitting(true)
    await addComment(profile.id, trimmed)
    setInput('')
    setSubmitting(false)
  }

  return (
    <div className="mt-4">
      <h3 className="font-bold text-gray-800 mb-3">💬 评论 ({comments.length})</h3>

      {/* Comment list */}
      <div className="space-y-3 mb-4">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm shrink-0">
              {c.profiles?.avatar ?? '👤'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-purple-600">
                  {c.profiles?.nickname ?? '匿名'}
                </span>
                <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
              </div>
              <p className="text-sm text-gray-700 mt-0.5 break-words">{c.content}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">暂无评论，快来抢沙发</p>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="写下你的评论…"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !input.trim()}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white text-sm font-medium rounded-lg transition-colors"
        >
          发送
        </button>
      </div>
    </div>
  )
}
