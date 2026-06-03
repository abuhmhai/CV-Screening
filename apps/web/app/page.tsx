"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { apiFetch } from "../lib/api-client";
import { Job } from "../lib/types";

// Mock data for the specific job cards requested in the prompt
const mockJobs = [
  { id: "1", title: "Backend Engineer", companyName: "TechCorp", location: "Hanoi", minSalary: 1500, maxSalary: 2500, status: "ACTIVE" },
  { id: "2", title: "Frontend Engineer", companyName: "WebSolutions", location: "HCMC", minSalary: 1200, maxSalary: 2000, status: "ACTIVE" },
  { id: "3", title: "Product Analyst", companyName: "DataInc", location: "Da Nang", minSalary: 1000, maxSalary: 1800, status: "ACTIVE" },
];

export default function HomePage() {
  const [jobs, setJobs] = useState<any[]>(mockJobs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading to show animations
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#050b14] p-4 sm:p-8 flex items-center justify-center font-body selection:bg-emerald-500/30">
      
      {/* Custom High-Tech Browser Window Wrapper */}
      <div className="relative w-full max-w-[1600px] h-[85vh] min-h-[800px] rounded-2xl overflow-hidden border border-slate-700/50 shadow-[0_0_100px_rgba(16,185,129,0.15)] flex flex-col bg-[#0f172a]">
        
        {/* Browser Header */}
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
          <div className="flex-1 max-w-xl mx-8">
            <div className="w-full h-7 bg-[#0f172a] rounded-md border border-slate-700/50 flex items-center px-3 justify-center">
              <span className="text-xs text-slate-400 font-mono">localhost:3000</span>
            </div>
          </div>

          {/* User & Time Info */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
            <div className="hidden md:flex items-center gap-2">
              <span>6/3/2026</span>
              <span>11:19:28 AM</span>
            </div>
            <div className="flex items-center gap-2 pl-4 border-l border-slate-700/50">
              <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold">LN</div>
              <span className="hidden sm:inline">linh.nguyen</span>
            </div>
          </div>
        </div>

        {/* Browser Content Area */}
        <div className="relative flex-1 w-full overflow-hidden">
          
          {/* 2D Background & Metrics */}
          <div className="absolute inset-0 z-0 bg-[#0f172a] overflow-hidden">
            {/* Intricate light caustics overlay */}
            <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30" style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.4) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(16, 185, 129, 0.4) 0%, transparent 40%)'
            }}></div>

            {/* Metrics Cluster (Right) - 2D Glassmorphism replacement */}
            <div className="absolute right-[10%] top-[20%] w-[400px] h-[400px] pointer-events-none">
              {/* Applications */}
              <div className="absolute left-[10%] top-[10%] w-28 h-28 rounded-2xl border border-blue-400/30 bg-blue-500/10 backdrop-blur-md shadow-[0_8px_32px_rgba(59,130,246,0.2)] flex flex-col items-center justify-center transform -rotate-6">
                <div className="text-white font-black text-3xl drop-shadow-md">16</div>
                <div className="text-blue-200 font-bold text-[10px] uppercase tracking-wider mt-1">Applications</div>
              </div>
              
              {/* Open Jobs */}
              <div className="absolute right-[15%] top-[25%] w-24 h-24 rounded-full border border-emerald-400/30 bg-emerald-500/10 backdrop-blur-md shadow-[0_8px_32px_rgba(16,185,129,0.2)] flex flex-col items-center justify-center transform rotate-12">
                <div className="text-white font-black text-3xl drop-shadow-md">8</div>
                <div className="text-emerald-200 font-bold text-[10px] uppercase tracking-wider mt-1">Open Jobs</div>
              </div>

              {/* Applicants */}
              <div className="absolute left-[20%] bottom-[25%] w-24 h-24 rounded-full border border-blue-400/30 bg-blue-500/10 backdrop-blur-md shadow-[0_8px_32px_rgba(59,130,246,0.2)] flex flex-col items-center justify-center">
                <div className="text-white font-black text-3xl drop-shadow-md">16</div>
                <div className="text-blue-200 font-bold text-[10px] uppercase tracking-wider mt-1">Applicants</div>
              </div>

              {/* AI Engine */}
              <div className="absolute right-[30%] bottom-[10%] w-28 h-28 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 backdrop-blur-md shadow-[0_8px_32px_rgba(16,185,129,0.2)] flex flex-col items-center justify-center transform rotate-6">
                <div className="text-white font-black text-2xl drop-shadow-md">v1.0</div>
                <div className="text-emerald-200 font-bold text-[10px] uppercase tracking-wider mt-1">AI Engine</div>
              </div>

              {/* Match Avg */}
              <div className="absolute right-[-5%] top-[45%] w-32 h-32 rotate-45 border border-emerald-400/30 bg-emerald-500/10 backdrop-blur-md shadow-[0_8px_32px_rgba(16,185,129,0.2)] flex flex-col items-center justify-center">
                <div className="transform -rotate-45 flex flex-col items-center">
                  <div className="text-white font-black text-3xl drop-shadow-md">78.4%</div>
                  <div className="text-emerald-200 font-bold text-[10px] uppercase tracking-wider mt-1">Match Avg</div>
                </div>
              </div>
            </div>
          </div>

          {/* UI Overlay */}
          <div className="absolute inset-0 z-10 pointer-events-none p-8 flex flex-col justify-between">
            
            {/* Top Area: Main Title Panels */}
            <div className="flex flex-col items-center pt-8">
              {/* Stacked transparent panels */}
              <div className="relative w-full max-w-4xl h-40 flex items-center justify-center perspective-1000">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, rotateX: 60, y: 50 }}
                    animate={{ opacity: 1 - i * 0.3, rotateX: 15 - i * 5, y: i * -20, scale: 1 - i * 0.05 }}
                    transition={{ duration: 1, delay: i * 0.2, ease: "easeOut" }}
                    className="absolute inset-0 flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                    style={{ zIndex: 10 - i }}
                  >
                    <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 text-center px-8 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                      Tuyển dụng thông minh.<br />Kết nối chuyên nghiệp.
                    </h1>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Bottom Area: Controls & Job Listings */}
            <div className="flex justify-between items-end w-full pointer-events-auto">
              
              {/* Controls (Bottom-Left) */}
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-col gap-8 pb-8 pl-4"
              >
                {/* Control Dial with glowing green marble */}
                <div className="flex items-center gap-6 group cursor-pointer">
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 shadow-[10px_10px_30px_rgba(0,0,0,0.5),-10px_-10px_30px_rgba(255,255,255,0.05)] flex items-center justify-center transition-transform group-hover:scale-105">
                    {/* Glowing marble */}
                    <div className="absolute w-10 h-10 rounded-full bg-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.8),inset_0_0_10px_rgba(255,255,255,0.8)] animate-pulse"></div>
                    {/* Dial markings */}
                    <div className="absolute inset-2 rounded-full border border-slate-600/50 border-dashed"></div>
                  </div>
                  <span className="text-2xl font-bold text-white tracking-wide drop-shadow-md group-hover:text-emerald-400 transition-colors">Khám phá việc làm</span>
                </div>

                {/* Metallic Knob */}
                <div className="flex items-center gap-6 group cursor-pointer">
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 shadow-[5px_5px_15px_rgba(0,0,0,0.5),inset_0_2px_5px_rgba(255,255,255,0.8)] flex items-center justify-center transition-transform group-hover:rotate-45">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tl from-slate-400 to-slate-200 shadow-[inset_0_2px_5px_rgba(0,0,0,0.3)] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-slate-700 absolute top-3"></div>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-slate-300 tracking-wide group-hover:text-white transition-colors">Đăng nhập demo</span>
                </div>
              </motion.div>

              {/* Job Listings (Bottom-Right) */}
              <div className="w-full max-w-md pb-4 pr-4">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="mb-4 flex items-center justify-between"
                >
                  <h3 className="font-display text-2xl font-bold text-white drop-shadow-md">Việc làm nổi bật</h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/50 to-transparent ml-4"></div>
                </motion.div>
                
                <div className="relative flex flex-col perspective-1000">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 w-full animate-pulse rounded-xl bg-white/5 border border-white/10" />
                      ))}
                    </div>
                  ) : (
                    jobs.map((job, i) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, x: 50, rotateY: -20 }}
                        animate={{ opacity: 1, x: 0, rotateY: 0 }}
                        transition={{ duration: 0.6, delay: 0.8 + i * 0.15 }}
                        className="group relative -mt-3 first:mt-0 cursor-pointer"
                        style={{ zIndex: 10 - i }}
                      >
                        <div className="relative overflow-hidden rounded-xl border border-white/20 bg-white/10 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:bg-white/20 hover:border-emerald-500/50">
                          {/* Glass reflection */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-30"></div>
                          
                          <div className="relative z-10 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              {/* Logo placeholder */}
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center shadow-inner">
                                <span className="text-lg font-black text-white/50">{job.companyName[0]}</span>
                              </div>
                              
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-white group-hover:text-emerald-300 transition-colors">{job.title}</h4>
                                  {job.status === "ACTIVE" && (
                                    <span className="flex items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,1)]"></span>
                                      ACTIVE
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-medium text-slate-300 mt-0.5">{job.companyName} • {job.location}</p>
                              </div>
                            </div>
                            
                            <button className="h-8 px-4 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-xs font-bold text-emerald-300 hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                              Đăng ký
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
