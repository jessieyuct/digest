import { useFeeds, useDeleteFeed } from "@/hooks/use-feeds";
import { Trash2, Globe, Calendar, RefreshCcw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export function FeedList() {
  const { data: feeds, isLoading } = useFeeds();
  const deleteFeed = useDeleteFeed();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!feeds || feeds.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Globe className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No feeds yet</h3>
        <p className="text-muted-foreground">Add your first RSS URL above to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AnimatePresence>
        {feeds.map((feed) => (
          <motion.div
            key={feed.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:border-primary/40 transition-colors shadow-sm group"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                {feed.iconUrl ? (
                  <img src={feed.iconUrl} alt="" className="w-6 h-6 object-contain" />
                ) : (
                  <Globe className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-medium truncate pr-4">{feed.title || feed.url}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="uppercase tracking-wider text-[10px] px-1.5 py-0.5 bg-muted rounded">
                    {feed.type || "General"}
                  </span>
                  {feed.lastFetched && (
                    <span className="flex items-center gap-1">
                      <RefreshCcw className="w-3 h-3" />
                      {formatDistanceToNow(new Date(feed.lastFetched))} ago
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => deleteFeed.mutate(feed.id)}
              disabled={deleteFeed.isPending}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Remove feed"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
