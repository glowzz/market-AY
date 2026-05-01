import { useState, useContext } from 'react'
import { ProfileContext } from '../App'
import { voteForTarget } from '../hooks/useVotes'

interface VoteButtonProps {
  targetId: string
  targetType: 'pain_point' | 'solution'
  currentVotes: number
}

export default function VoteButton({ targetId, targetType, currentVotes }: VoteButtonProps) {
  const profile = useContext(ProfileContext)
  const [votes, setVotes] = useState(currentVotes)
  const [message, setMessage] = useState('')

  async function handleVote() {
    if (!profile) return

    // Optimistic update
    setVotes((v) => v + 1)
    setMessage('')

    const { error } = await voteForTarget(profile.id, targetId, targetType)

    if (error) {
      // Revert
      setVotes((v) => v - 1)
      if (error.message.includes('already') || error.message.includes('已')) {
        setMessage('已经投过票了')
      } else {
        setMessage(error.message)
      }
      // Clear message after 2s
      setTimeout(() => setMessage(''), 2000)
    }
  }

  return (
    <div className="inline-flex flex-col items-start">
      <button
        onClick={handleVote}
        className="bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm font-medium"
      >
        👍 投票 ({votes})
      </button>
      {message && (
        <span className="text-xs text-red-500 mt-1">{message}</span>
      )}
    </div>
  )
}
