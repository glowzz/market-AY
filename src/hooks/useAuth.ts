import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

const ADJECTIVES = ['勇敢的', '机智的', '快乐的', '聪明的', '可爱的', '优雅的', '敏捷的', '温柔的']
const ANIMALS = ['猫头鹰', '海豚', '狐狸', '熊', '兔子', '鹿', '企鹅', '猫', '狮子', '鹰']
const AVATARS = ['🦉', '🐬', '🦊', '🐻', '🐰', '🦌', '🐧', '🐱', '🦁', '🦅']

function generateIdentity() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  const avatarIdx = Math.floor(Math.random() * AVATARS.length)
  return { nickname: `${adj}${animal}`, avatar: AVATARS[avatarIdx] }
}

export interface Profile {
  id: string
  nickname: string
  avatar: string
  points: number
  last_check_in: string | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        await signInAnonymously()
      }
      initialized.current = true
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!initialized.current) return
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInAnonymously() {
    setLoading(true)
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) { console.error(error); setLoading(false); return }
    if (data.user) {
      setUser(data.user)
      const identity = generateIdentity()
      await supabase.from('profiles').insert({
        id: data.user.id,
        nickname: identity.nickname,
        avatar: identity.avatar,
        points: 100,
      })
      await fetchProfile(data.user.id)
    }
  }

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) setProfile(data)
    setLoading(false)
  }

  return { user, profile, loading, refreshProfile: () => user && fetchProfile(user.id) }
}
