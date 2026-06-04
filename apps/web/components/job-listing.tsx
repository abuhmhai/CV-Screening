"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api-client";

export function JobListing() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await apiFetch<any>("/jobs");
        if (res.ok && res.data) {
          // the api returns { data: [], total: ... } or just array
          const items = Array.isArray(res.data) ? res.data : res.data.data || [];
          setJobs(items.slice(0, 3)); // show top 3
        }
      } catch (e) {
        console.error("Failed to fetch jobs", e);
      } finally {
        setLoading(false);
      }
    }
    
    fetchJobs();
  }, []);

  return (
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
        ) : jobs.length === 0 ? (
          <div className="text-slate-400 text-sm py-4">Chưa có việc làm nổi bật nào.</div>
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
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center shadow-inner shrink-0 overflow-hidden">
                      {job.company?.logoUrl ? (
                        <img src={job.company.logoUrl} alt={job.companyName || job.company?.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-black text-white/50">{(job.companyName || job.company?.name || "C")[0]}</span>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">{job.title}</h4>
                        {job.status === "ACTIVE" && (
                          <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,1)]"></span>
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-slate-300 mt-0.5 line-clamp-1">{job.companyName || job.company?.name} • {job.location || job.workLocation}</p>
                    </div>
                  </div>
                  
                  <button className="shrink-0 h-8 px-4 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-xs font-bold text-emerald-300 hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    Đăng ký
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
