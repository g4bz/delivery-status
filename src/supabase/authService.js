import { supabase } from './config';

// ============================================================================
// AUTHENTICATION SERVICE
// ============================================================================

/**
 * Login user with username and password
 * Note: For simplicity, we're doing basic password comparison
 * In production, use proper password hashing (bcrypt, argon2, etc.)
 */
export const login = async (username, password) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password_hash', password) // Simple comparison for testing
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Invalid username or password');
      }
      throw error;
    }

    if (!data) {
      throw new Error('Invalid username or password');
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.id);

    // Store user session in localStorage
    const userSession = {
      id: data.id,
      username: data.username,
      fullName: data.full_name,
      email: data.email,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem('user_session', JSON.stringify(userSession));

    return userSession;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Logout user
 */
export const logout = () => {
  localStorage.removeItem('user_session');
};

/**
 * Get current user session
 */
export const getCurrentUser = () => {
  const sessionStr = localStorage.getItem('user_session');
  if (!sessionStr) return null;

  try {
    return JSON.parse(sessionStr);
  } catch (error) {
    console.error('Error parsing user session:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};
