import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface PainPoint {
  id: string
  author_id: string
  title: string
  description: string
  tags: string[]
  bounty: number
  status: string
  votes: number
  created_at: string
  profiles?: { nickname: string; avatar: string }
}

export function usePainPoints() {
  const [items, setItems] = useState<PainPoint[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchAll() {
    setLoading(true)
    const { data } = await supabase
      .from('pain_points')
      .select('*, profiles!pain_points_author_id_fkey(nickname, avatar)')
      .order('created_at', { ascending: false })
    if (data) setItems(data as PainPoint[])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])
  return { items, loading, refresh: fetchAll }
}
