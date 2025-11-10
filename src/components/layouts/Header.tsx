"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Upload, User, LogOut, Heart, FileText } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Header() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const user = session?.user

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
              <span className="text-3xl" role="img" aria-label="Robot">🤖</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-black text-xl">Agent Library</div>
              <div className="text-xs text-gray-500">PayPal Internal Audit</div>
            </div>
          </Link>

          {/* Action Buttons - Only show when authenticated */}
          <div className="flex items-center space-x-3">
            {status === 'loading' ? (
              <div className="w-10 h-10 rounded-full bg-blue-500 animate-pulse" role="status" aria-label="Loading user information" />
            ) : user ? (
              <>
                {/* Upload button - icon only on mobile, full button on desktop */}
                <Link href="/add" className="md:hidden">
                  <Button variant="ghost" size="icon" aria-label="Add new agent">
                    <Upload className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </Link>

                <Link href="/add" className="hidden md:block">
                  <Button variant="outline" className="font-semibold border-2 hover:bg-gray-50">
                    <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                    Add Agent
                  </Button>
                </Link>

                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
                      aria-label="User menu"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold border-2 border-gray-200 hover:border-blue-500 transition-all cursor-pointer">
                        {(() => {
                          const name = user.name || user.email || 'User';
                          const parts = name.split(' ');
                          if (parts.length >= 2) {
                            return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
                          }
                          return name.charAt(0).toUpperCase();
                        })()}
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm">
                      <div className="font-semibold">{user.name || user.email}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    <DropdownMenuSeparator />
                    {user.username && (
                      <DropdownMenuItem asChild>
                        <Link href={`/profile/${user.username}`} className="flex items-center cursor-pointer">
                          <User className="mr-2 h-4 w-4" aria-hidden="true" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/browse?filter=my-agents" className="flex items-center cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                        <span>My Agents</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/browse?filter=favorites" className="flex items-center cursor-pointer">
                        <Heart className="mr-2 h-4 w-4" aria-hidden="true" />
                        <span>Favorites</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
