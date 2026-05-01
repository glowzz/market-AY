import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { seedData } from '../data/seed'

export default function SeedPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSeed() {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const result = await seedData()
      setMessage(`填充完成！共插入 ${result.painPoints} 个痛点 + ${result.solutions} 个方案。跳转首页...`)
      setTimeout(() => navigate('/'), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '填充失败')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">🌱 填充模拟数据</h1>
        <p className="text-gray-500 mb-6">点击按钮填充演示数据（5个痛点 + 4个方案）</p>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm mb-4">{error}</div>
        )}
        {message && (
          <div className="bg-green-50 text-green-600 px-4 py-2 rounded-lg text-sm mb-4">{message}</div>
        )}

        <button
          onClick={handleSeed}
          disabled={loading}
          className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold rounded-lg transition-colors text-lg"
        >
          {loading ? '填充中...' : '开始填充'}
        </button>
      </div>
    </div>
  )
}
