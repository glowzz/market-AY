import { useNavigate } from 'react-router-dom'

export default function FloatingActionButton() {
  const navigate = useNavigate()

  return (
    <div className="hidden sm:flex fixed bottom-6 right-6 flex-col gap-3 z-50">
      <button
        onClick={() => navigate('/publish')}
        className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white text-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
        title="发布痛点"
      >
        📢
      </button>
      <button
        onClick={() => navigate('/share')}
        className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white text-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
        title="分享方案"
      >
        💡
      </button>
    </div>
  )
}
