"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { useSession } from "next-auth/react"

export default function Header() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const user = session?.user

  const handleProfileClick = () => {
    if (user) {
      router.push('/profile')
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/50 group-hover:shadow-xl group-hover:shadow-blue-500/60 transition-all overflow-hidden">
              <Image
                src="/logo.png"
                alt="Agent Library Logo"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <div className="font-black text-xl">Agent Library</div>
              <div className="text-xs text-gray-500">PayPal Internal Audit</div>
            </div>
          </Link>

          {/* Action Buttons - Only show when authenticated */}
          <div className="flex items-center space-x-3">
            {status === 'loading' ? (
              <div className="w-10 h-10 rounded-full bg-blue-500 animate-pulse" />
            ) : user ? (
              <>
                {/* Upload button - icon only on mobile, full button on desktop */}
                <Link href="/add" className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Upload className="h-5 w-5" />
                  </Button>
                </Link>

                <Link href="/add" className="hidden md:block">
                  <Button variant="outline" className="font-semibold border-2 hover:bg-gray-50">
                    <Upload className="h-4 w-4 mr-2" />
                    Add Agent
                  </Button>
                </Link>

                {/* User Profile */}
                <button
                  onClick={handleProfileClick}
                  className="flex items-center space-x-2 focus:outline-none"
                  aria-label="Go to profile"
                >
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || "User"}
                      width={40}
                      height={40}
                      className="rounded-full border-2 border-gray-200 hover:border-blue-500 transition-all object-cover cursor-pointer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-500 flex items-center justify-center text-white font-semibold border-2 border-gray-200 hover:border-blue-500 transition-all cursor-pointer">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
