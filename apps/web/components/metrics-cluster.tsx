export function MetricsCluster() {
  return (
    <div className="absolute right-[10%] top-[20%] w-[400px] h-[400px] pointer-events-none hidden md:block">
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
  );
}
