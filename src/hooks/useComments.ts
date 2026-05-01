import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface Comment {
  id: string
  author_id: string
  content: string
  created_at: string
  profiles?: { nickname: string; avatar: string }
}

export function useComments(targetId: string, targetType: 'pain_point' | 'solution') {
  const [comments, setComments] = useState<Comment[]>([])

  async function fetchComments() {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(nickname, avatar)')
      .eq('target_id', targetId)
      .eq('target_type', targetType)
      .order('created_at', { ascending: true })
    if (data) setComments(data as Comment[])
  }

  async function addComment(authorId: string, content: string) {
    await supabase.from('comments').insert({
      author_id: authorId,
      target_id: targetId,
      target_type: targetType,
      content,
    })
    await fetchComments()
  }

  useEffect(() => {
    if (targetId) fetchComments()
  }, [targetId])

  return { comments, addComment }
}
