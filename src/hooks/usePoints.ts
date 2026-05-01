import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from './useAuth'

export function usePoints(profile: Profile | null, refreshProfile: () => void) {
  const checkIn = useCallback(async () => {
    if (!profile) return { success: false, message: '请先登录' }
    const { data, error } = await supabase.rpc('check_in', { p_user_id: profile.id })
    if (error) {
      return { success: false, message: '打卡失败' }
    }
    if (data) {
      refreshProfile()
      return { success: data.success, message: data.success ? '签到成功！+10积分' : data.message }
    }
    return { success: false, message: '未知错误' }
  }, [profile, refreshProfile])

  return { checkIn }
}
