import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProfileContext } from '../App'
import { supabase } from '../lib/supabase'
import TagSelector from '../components/TagSelector'

const PRICE_OPTIONS = [
  { label: '免费', value: 0 },
  { label: '10积分', value: 10 },
  { label: '20积分', value: 20 },
]

export default function ShareSolutionPage() {
  const navigate = useNavigate()
  const profile = useContext(ProfileContext)

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [price, setPrice] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return

    setError('')
    setSubmitting(true)

    const { error: insertError } = await supabase.from('solutions').insert({
      author_id: profile.id,
      title,
      summary,
      content,
      tags,
      price,
    })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-700 text-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-2xl hover:opacity-80"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold">💡 分享 AI 方案</h1>
            <p className="text-green-100 text-xs">分享你用 AI 解决问题的好办法</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-5 max-w-lg mx-auto">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">方案标题 *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给你的 AI 方案起个名字"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">方案简介 *</label>
          <textarea
            required
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="简短介绍你的方案能解决什么问题…"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">详细步骤/内容 *</label>
          <textarea
            required
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="详细描述你的 AI 方案步骤…（付费后可见）"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
          <TagSelector selectedTags={tags} onChange={setTags} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">查看价格</label>
          <div className="flex gap-2">
            {PRICE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPrice(opt.value)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  price === opt.value
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold rounded-lg transition-colors"
        >
          {submitting ? '发布中…' : '发布方案'}
        </button>
      </form>
    </div>
  )
}
