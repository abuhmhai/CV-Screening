"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../lib/auth-context";

export function BrowserHeader() {
  const { user, logout } = useAuth();
  const [time, setTime] = useState<Date | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-12 bg-[#1e293b]/80 backdrop-blur-md border-b border-slate-700/50 flex items-center px-4 justify-between shrink-0 z-50">
      {/* Window Controls & Tabs */}
      <div className="flex items-center gap-6">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-[#0f172a] rounded-t-lg border-t border-x border-slate-700/50 mt-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-400 to-blue-500"></div>
          <span className="text-xs font-medium text-slate-300">TalentFlow - AI Recruitment</span>
        </div>
      </div>

      {/* Address Bar */}
      <div className="flex-1 max-w-xl mx-8 hidden md:block">
        <div className="w-full h-7 bg-[#0f172a] rounded-md border border-slate-700/50 flex items-center px-3 justify-center">
          <span className="text-xs text-slate-400 font-mono">localhost:3000</span>
        </div>
      </div>

      {/* User & Time Info */}
      <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
        <div className="hidden lg:flex items-center gap-2">
          <span>{time ? time.toLocaleDateString() : "..."}</span>
          <span className="w-[80px]">{time ? time.toLocaleTimeString() : "..."}</span>
        </div>
        <div className="flex items-center gap-2 pl-4 border-l border-slate-700/50 relative">
          {user ? (
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold uppercase">
                {user.email.charAt(0)}
              </div>
              <span className="hidden sm:inline">{user.email.split("@")[0]}</span>

              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-32 bg-[#1e293b] border border-slate-700/50 rounded-md shadow-lg py-1 z-50">
                  <Link href="/profile" className="block px-4 py-2 text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                    Hồ sơ
                  </Link>
                  <button 
                    onClick={() => logout()}
                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/sign-in" className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500 hover:text-white transition-colors">
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
