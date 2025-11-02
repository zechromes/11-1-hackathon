'use client'

import { availableUsers, currentUser } from '@/lib/mockData'
import { cn } from '@/lib/utils'
import { Search, User, UserPlus, X, Users, Sparkles } from 'lucide-react'
import { useState, useMemo } from 'react'

interface AddFriendModalProps {
  isOpen: boolean
  onClose: () => void
  onAddFriend: (userId: string) => void
  existingFriendIds: string[]
}

export default function AddFriendModal({
  isOpen,
  onClose,
  onAddFriend,
  existingFriendIds
}: AddFriendModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'recommended' | 'search'>('recommended')

  // Filter out users who are already friends
  const filteredAvailableUsers = availableUsers.filter(
    user => !existingFriendIds.includes(user.id)
  )

  // Get user's category for recommendations
  const userCategory = currentUser.injuryType.split(' ')[0] // Extract category like "Knee" from "Knee Rehabilitation"

  // Recommendations based on category match
  const recommendedUsers = useMemo(() => {
    return filteredAvailableUsers
      .filter(user => {
        const userCategoryMatch = user.injuryType.split(' ')[0] === userCategory
        return userCategoryMatch
      })
      .sort((a, b) => {
        // Sort by online status first, then by join date
        if (a.isOnline && !b.isOnline) return -1
        if (!a.isOnline && b.isOnline) return 1
        return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
      })
      .slice(0, 6) // Show top 6 recommendations
  }, [userCategory, filteredAvailableUsers])

  // Search filtered users
  const searchedUsers = useMemo(() => {
    if (!searchTerm.trim()) return []
    const searchLower = searchTerm.toLowerCase()
    return filteredAvailableUsers.filter(
      user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.injuryType.toLowerCase().includes(searchLower)
    )
  }, [searchTerm, filteredAvailableUsers])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Add Friends</h2>
            <p className="text-sm text-gray-500 mt-1">Connect with recovery companions</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('recommended')}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors relative",
              activeTab === 'recommended'
                ? "border-[#8573bd] text-[#8573bd]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <div className="flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              Recommended
            </div>
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'search'
                ? "border-[#8573bd] text-[#8573bd]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <div className="flex items-center">
              <Search className="w-4 h-4 mr-2" />
              Search Users
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'recommended' ? (
            <div className="space-y-4">
              <div className="bg-[#EAE6F5] rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <Sparkles className="w-5 h-5 text-[#8573bd] mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Recommended for You
                    </h3>
                    <p className="text-sm text-gray-600">
                      People with similar recovery goals: <strong>{userCategory} Rehabilitation</strong>
                    </p>
                  </div>
                </div>
              </div>

              {recommendedUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recommendations available at this time</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#8573bd] hover:bg-[#EAE6F5]/30 transition-all"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#8573bd] to-[#E8B98A] rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          {user.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{user.name}</h3>
                          <p className="text-sm text-gray-500">{user.injuryType}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Joined {new Date(user.joinDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onAddFriend(user.id)}
                        className="flex items-center px-4 py-2 bg-[#8573bd] text-white rounded-lg hover:bg-[#E8B98A] transition-colors"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Send Request
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or injury type..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8573bd] focus:border-transparent outline-none"
                />
              </div>

              {/* Search Results */}
              {!searchTerm.trim() ? (
                <div className="text-center py-12 text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Enter a name or injury type to search for users</p>
                </div>
              ) : searchedUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No users found matching &quot;{searchTerm}&quot;</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#8573bd] hover:bg-[#EAE6F5]/30 transition-all"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#8573bd] to-[#E8B98A] rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          {user.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{user.name}</h3>
                          <p className="text-sm text-gray-500">{user.injuryType}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Joined {new Date(user.joinDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onAddFriend(user.id)}
                        className="flex items-center px-4 py-2 bg-[#8573bd] text-white rounded-lg hover:bg-[#E8B98A] transition-colors"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Send Request
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

