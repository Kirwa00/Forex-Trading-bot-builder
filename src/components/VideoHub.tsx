import { useState } from 'react';
import { PlayCircle, Zap, ShieldCheck, Check, Search } from 'lucide-react';
import { VideoCard, StrategyBlueprint } from '../types';
import { INITIAL_VIDEOS } from '../data/initialData';

interface VideoHubProps {
  onLoadStrategy: (blueprint: StrategyBlueprint) => void;
  onNavigateToBuilder: () => void;
}

export const VideoHub = ({ onLoadStrategy, onNavigateToBuilder }: VideoHubProps) => {
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('All');

  const filteredVideos = INITIAL_VIDEOS.filter((vid) => {
    const matchesSearch = vid.title.toLowerCase().includes(searchTerm.toLowerCase()) || vid.concept.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === 'All' || vid.badge.toLowerCase().includes(selectedTag.toLowerCase());
    return matchesSearch && matchesTag;
  });

  const handleOneClickLoad = (video: VideoCard) => {
    onLoadStrategy(video.blueprint);
    setLoadedId(video.id);
    setTimeout(() => {
      onNavigateToBuilder();
    }, 400);
  };

  return (
    <div className="space-y-6 py-4">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full text-xs text-emerald-300 font-mono mb-2">
              <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Learn-Build Loop (Phase 2 Requirement)</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Forex & ICT Strategy Video Research Hub
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Curated short strategy breakdowns. Tap <strong className="text-emerald-400">"One-Click Load"</strong> on any video card to instantly populate the Lego Strategy Builder without typing prompts!
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-xs font-mono text-emerald-300 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Instant Blueprint Pre-Fill</span>
            </div>
            <p className="text-[11px] text-slate-400">Zero latency (&lt;50ms) state load</p>
          </div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search strategy tutorials, ICT, Gold..."
            className="w-full bg-slate-950 border border-slate-700 text-white pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-mono placeholder:text-slate-500"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex flex-wrap gap-1.5 text-xs font-mono">
          {['All', 'ICT', 'Silver Bullet', 'Gold'].map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedTag === tag
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Video Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((vid) => (
          <div
            key={vid.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-emerald-500/40 transition-all group flex flex-col justify-between"
          >
            <div>
              {/* Thumbnail Container */}
              <div className="relative aspect-video bg-slate-950 overflow-hidden">
                <img
                  src={vid.thumbnailUrl}
                  alt={vid.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                <span className="absolute top-3 left-3 bg-emerald-950/90 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono uppercase">
                  {vid.badge}
                </span>

                <span className="absolute bottom-3 right-3 bg-slate-950/90 text-white text-[10px] font-mono px-2 py-0.5 rounded border border-slate-800">
                  {vid.duration}
                </span>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-7 h-7" />
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="p-5 space-y-3">
                <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors leading-snug">
                  {vid.title}
                </h3>

                <p className="text-xs text-slate-400 font-mono flex items-center justify-between">
                  <span>By {vid.creator}</span>
                  <span className="text-emerald-400 font-bold">Est Win: {vid.winRateEst}</span>
                </p>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-300 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">Strategy Bricks Included:</span>
                  <p className="text-cyan-300 truncate">
                    {vid.blueprint.bricks.map((b) => b.brickId).join(' + ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Card Action Button */}
            <div className="p-5 pt-0">
              <button
                onClick={() => handleOneClickLoad(vid)}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md ${
                  loadedId === vid.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20'
                }`}
              >
                {loadedId === vid.id ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Loaded to Lego Builder!</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>One-Click Load Strategy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
