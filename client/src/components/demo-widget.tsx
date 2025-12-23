import { useState } from "react";
import { useOmdb } from "@/hooks/use-omdb";
import { Search, Star, Loader2, Film, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function DemoWidget() {
  const [title, setTitle] = useState("Inception");
  const [searchTrigger, setSearchTrigger] = useState(false);
  
  const { data, isLoading, error, refetch } = useOmdb(
    { title },
    true // Enabled by default for the demo initial state
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header / Search Bar */}
        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Search movie title..."
              className="w-full bg-background border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/5 hover:bg-white/10 text-xs font-medium px-2 py-1 rounded-md transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Content Area */}
        <div className="p-6 min-h-[200px] flex flex-col items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">Fetching ratings...</p>
            </div>
          ) : error ? (
            <div className="text-center text-destructive">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-medium">{(error as Error).message}</p>
            </div>
          ) : data ? (
            <AnimatePresence mode="wait">
              <motion.div 
                key={data.query.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full text-left"
              >
                {data.found ? (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white line-clamp-1">{data.title}</h3>
                        <p className="text-sm text-muted-foreground">{data.year}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 text-accent">
                          <Star className="w-5 h-5 fill-current" />
                          <span className="text-lg font-bold">{data.imdbRating}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{data.imdbVotes} votes</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="bg-white/5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 border border-white/5">
                        IMDb ID: <span className="text-white font-mono ml-1">{data.imdbID}</span>
                      </div>
                      <div className="bg-primary/10 rounded-lg px-3 py-1.5 text-xs font-medium text-primary border border-primary/20">
                        {data.source.toUpperCase()}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Film className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Movie not found</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : null}
        </div>
        
        {/* Footer */}
        <div className="bg-white/[0.02] border-t border-white/5 p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Live API Response Preview
          </p>
        </div>
      </div>
    </div>
  );
}
