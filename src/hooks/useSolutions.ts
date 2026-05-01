import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface Solution {
  id: string
  author_id: string
  pain_point_id: string
  title: string
  description: string
  price: number
  is_free: boolean
  votes: number
  purchases: number
  created_at: string
  profiles?: { nickname: string; avatar: string }
}

export function useSolutions() {
  const [items, setItems] = useState<Solution[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchAll() {
    setLoading(true)
    const { data } = await supabase
      .from('solutions')
      .select('*, profiles(nickname, avatar)')
      .order('created_at', { ascending: false })
    if (data) setItems(data as Solution[])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])
  return { items, loading, refresh: fetchAll }
}
