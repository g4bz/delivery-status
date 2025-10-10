import { supabase } from './config';

// ============================================================================
// USER PRESENCE SERVICE
// ============================================================================

/**
 * Update user presence when they log in or are active
 */
export const updatePresence = async (userId, userData) => {
  try {
    const { error } = await supabase
      .from('user_presence')
      .upsert({
        user_id: userId,
        username: userData.username,
        full_name: userData.fullName,
        email: userData.email,
        profile_picture: userData.profilePicture || null,
        initials: userData.initials || generateInitials(userData.fullName || userData.username),
        last_seen: new Date().toISOString(),
        is_online: true
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating presence:', error);
    throw error;
  }
};

/**
 * Mark user as offline when they log out
 */
export const removePresence = async (userId) => {
  try {
    const { error } = await supabase
      .from('user_presence')
      .update({
        is_online: false,
        last_seen: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing presence:', error);
    throw error;
  }
};

/**
 * Get all currently active users
 */
export const getActiveUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('user_presence')
      .select('*')
      .eq('is_online', true)
      .order('full_name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting active users:', error);
    return [];
  }
};

/**
 * Subscribe to presence changes in real-time
 */
export const subscribeToPresence = (callback) => {
  const subscription = supabase
    .channel('user_presence_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_presence'
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
};

/**
 * Unsubscribe from presence changes
 */
export const unsubscribeFromPresence = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
};

/**
 * Heartbeat to keep user presence alive
 */
export const sendHeartbeat = async (userId) => {
  try {
    const { error } = await supabase
      .from('user_presence')
      .update({
        last_seen: new Date().toISOString(),
        is_online: true
      })
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error sending heartbeat:', error);
  }
};

/**
 * Generate initials from full name
 */
const generateInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Clean up stale presence records (optional - can be called periodically)
 */
export const cleanupStalePresence = async () => {
  try {
    const { error } = await supabase.rpc('cleanup_stale_presence');
    if (error) throw error;
  } catch (error) {
    console.error('Error cleaning up stale presence:', error);
  }
};
