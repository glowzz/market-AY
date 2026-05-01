import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProfileContext } from '../App'
import { supabase } from '../lib/supabase'
import TagSelector from '../components/TagSelector'
import PointsSlider from '../components/PointsSlider'

export default function PublishPainPointPage() {
  const navigate = useNavigate()
  const profile = useContext(ProfileContext)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [bounty, setBounty] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return

    setError('')
    setSubmitting(true)

    const { error: rpcError } = await supabase.rpc('create_pain_point', {
      author_id: profile.id,
      title,
      description,
      tags,
      bounty,
    })

    if (rpcError) {
      setError(rpcError.message.includes('积分') ? '积分不足' : rpcError.message)
      setSubmitting(false)
      return
    }

    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-700 text-white px-4 pt-12 pb-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-2xl mb-3 hover:opacity-80"
        >
          ←
        </button>
        <h1 className="text-xl font-bold">📢 发布痛点悬赏</h1>
        <p className="text-red-100 text-sm mt-1">说出你的痛苦，让 AI 来解放你</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-5 max-w-lg mx-auto">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">痛点标题 *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="一句话描述你的痛点"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">详细描述 *</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="详细描述你的工作痛点，越具体越好…"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
          <TagSelector selectedTags={tags} onChange={setTags} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">悬赏积分</label>
          <PointsSlider value={bounty} onChange={setBounty} max={profile?.points ?? 0} />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-bold rounded-lg transition-colors"
        >
          {submitting ? '发布中…' : '发布悬赏'}
        </button>
      </form>
    </div>
  )
}
