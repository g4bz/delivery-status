import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import * as presenceService from '../supabase/presenceService';

/**
 * ActiveUsers Component
 * Displays a list of currently logged-in users with their profile pictures/initials
 */
const ActiveUsers = ({ currentUserId }) => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Load active users initially
    loadActiveUsers();

    // Subscribe to real-time presence changes
    const subscription = presenceService.subscribeToPresence((payload) => {
      // Reload active users when presence changes
      loadActiveUsers();
    });

    // Cleanup subscription on unmount
    return () => {
      presenceService.unsubscribeFromPresence(subscription);
    };
  }, []);

  const loadActiveUsers = async () => {
    const users = await presenceService.getActiveUsers();
    setActiveUsers(users);
  };

  // Get background color for avatar based on username
  const getAvatarColor = (username) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500'
    ];
    const index = username?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  return (
    <div className="relative">
      {/* Collapsed View - Show count and avatars */}
      <div
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Users className="w-5 h-5 text-blue-600" />
        <span className="text-sm font-medium text-gray-900">
          {activeUsers.length} Online
        </span>

        {/* Avatar Stack (show first 3 users) */}
        {!isExpanded && activeUsers.length > 0 && (
          <div className="flex -space-x-2">
            {activeUsers.slice(0, 3).map((user) => (
              <div
                key={user.user_id}
                className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-semibold ${getAvatarColor(user.username)}`}
                title={user.full_name || user.username}
              >
                {user.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.full_name || user.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.initials
                )}
              </div>
            ))}
            {activeUsers.length > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center bg-gray-400 text-white text-xs font-semibold">
                +{activeUsers.length - 3}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expanded View - Show all users */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Active Users ({activeUsers.length})
            </h3>
          </div>

          <div className="p-2">
            {activeUsers.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                No users currently online
              </div>
            ) : (
              <div className="space-y-1">
                {activeUsers.map((user) => (
                  <div
                    key={user.user_id}
                    className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors ${
                      user.user_id === currentUserId ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${getAvatarColor(user.username)}`}
                      >
                        {user.profile_picture ? (
                          <img
                            src={user.profile_picture}
                            alt={user.full_name || user.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          user.initials
                        )}
                      </div>
                      {/* Online indicator */}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.full_name || user.username}
                        </p>
                        {user.user_id === currentUserId && (
                          <span className="text-xs text-blue-600 font-semibold">(You)</span>
                        )}
                      </div>
                      {user.email && (
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Active now
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveUsers;
