"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"

// API functions
const getUserProfile = async (username: string) => {
  const res = await fetch(`/api/profiles/${username}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
};

const getUserAgents = async (username: string) => {
  const res = await fetch(`/api/profiles/${username}/agents`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
};

const getUserFavorites = async (username: string) => {
  const res = await fetch(`/api/profiles/${username}/favorites`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
};
import { AgentCard } from "@/components/agents/AgentCard"
import { LogOut, Upload as UploadIcon, Heart, Edit } from "lucide-react"
import { useState } from "react"

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const router = useRouter()
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<"created" | "favorites">("created")

  // Fetch profile data
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => getUserProfile(username),
    enabled: !!username,
  })

  // Check if this is the user's own profile
  const isOwnProfile = session?.user?.id === profile?.id

  // Fetch user's created agents
  const { data: createdAgents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ['user-agents', username],
    queryFn: () => getUserAgents(username),
    enabled: !!username && !!profile,
  })

  // Fetch user's favorites (only for own profile)
  const { data: favoritedAgents = [], isLoading: loadingFavorites } = useQuery({
    queryKey: ['user-favorites', username],
    queryFn: () => getUserFavorites(username),
    enabled: !!username && !!profile && isOwnProfile,
  })

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  // Loading state
  if (status === 'loading' || loadingProfile) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  // Profile not found
  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile not found</h1>
            <p className="text-gray-600 mb-4">The user you're looking for doesn't exist.</p>
            <Link href="/browse">
              <Button>Browse Agents</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const agents = activeTab === "created" ? createdAgents : favoritedAgents
  const totalFavorites = favoritedAgents.length

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-30 h-30 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-blue-200">
              {(() => {
                const name = profile.full_name || profile.username || 'User';
                const parts = name.split(' ');
                if (parts.length >= 2) {
                  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
                }
                return name.charAt(0).toUpperCase();
              })()}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.full_name || profile.username || 'Anonymous User'}
                </h1>
                {profile.username && (
                  <p className="text-gray-500">@{profile.username}</p>
                )}
              </div>

              {/* Action Buttons */}
              {isOwnProfile && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link href="/profile/edit">
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="w-full sm:w-auto"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-gray-700 mt-4 max-w-2xl">{profile.bio}</p>
            )}

            {/* Social Links */}
            {(profile.website || profile.github_url || profile.linkedin_url) && (
              <div className="flex gap-3 mt-3">
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Website
                  </a>
                )}
                {profile.github_url && (
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    GitHub
                  </a>
                )}
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    LinkedIn
                  </a>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Tabs - Only show for own profile */}
      {isOwnProfile && (
        <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("created")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === "created"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <UploadIcon className="h-4 w-4" />
                Created Agents ({createdAgents.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === "favorites"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Heart className="h-4 w-4" />
                Favorites ({totalFavorites})
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Agents Grid */}
      {loadingAgents || (isOwnProfile && loadingFavorites && activeTab === "favorites") ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="col-span-full text-center py-16 bg-white rounded-lg shadow border border-gray-200">
          <p className="text-gray-500 text-lg mb-4">
            {activeTab === "created"
              ? "No agents created yet"
              : "No favorite agents yet"}
          </p>
          {isOwnProfile && activeTab === "created" && (
            <Link href="/add">
              <Button>
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload Your First Agent
              </Button>
            </Link>
          )}
          {isOwnProfile && activeTab === "favorites" && (
            <Link href="/browse">
              <Button variant="outline">
                Browse Agents
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent: any) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}

      {/* Member Since */}
      <div className="text-center mt-8 text-sm text-gray-500">
        Member since {new Date(profile.created_at).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        })}
      </div>
    </div>
  )
}
