import { supabase } from '../lib/supabase'

export async function voteForTarget(
  userId: string,
  targetId: string,
  targetType: 'pain_point' | 'solution'
) {
  const { data, error } = await supabase.rpc('vote', {
    p_user_id: userId,
    p_target_id: targetId,
    p_target_type: targetType,
  })
  return { data, error }
}
