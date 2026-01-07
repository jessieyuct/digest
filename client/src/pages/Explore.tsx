import { useArticles } from "@/hooks/use-articles";
import { useFeeds } from "@/hooks/use-feeds";
import { ArticleCard } from "@/components/ArticleCard";
import { Loader2, Filter, LayoutGrid, List } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Explore() {
  const [filter, setFilter] = useState<string>('all');
  const [selectedFeedId, setSelectedFeedId] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { data: articles, isLoading, error } = useArticles({ sort: 'date' });
  const { data: feeds } = useFeeds();

  const categories = Array.from(new Set(articles?.map(a => a.feed.type) || [])).filter(Boolean) as string[];

  const filteredArticles = articles?.filter(a => {
    const categoryMatch = filter === 'all' || a.feed.type === filter;
    const feedMatch = selectedFeedId === 'all' || a.feedId.toString() === selectedFeedId;
    return categoryMatch && feedMatch;
  }).sort((a, b) => {
    const dateA = new Date(a.publishedDate || 0).getTime();
    const dateB = new Date(b.publishedDate || 0).getTime();
    return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="container-page pb-20">
      <header className="mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif text-primary mb-4">Explore</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Catch up on the latest stories from your curated sources. 
              Freshly brewed for you.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedFeedId}
              onChange={(e) => setSelectedFeedId(e.target.value)}
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[150px]"
              data-testid="select-filter-feed"
            >
              <option value="all">All Sources</option>
              {feeds?.map(f => (
                <option key={f.id} value={f.id}>{f.title}</option>
              ))}
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'latest' | 'oldest')}
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              data-testid="select-sort-order"
            >
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
            </select>

            <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === 'grid' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === 'list' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mt-8 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
              filter === 'all'
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            )}
          >
            All Feeds
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                filter === cat
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
          <p>Curating your feed...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20 text-destructive">
          <p>Something went wrong loading your articles.</p>
        </div>
      ) : filteredArticles?.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-block p-4 rounded-full bg-secondary/50 mb-4">
            <Filter className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-medium mb-2">No articles found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or add more feeds.</p>
        </div>
      ) : (
        <motion.div 
          className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
              : "flex flex-col gap-4"
          )}
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {filteredArticles?.map((article) => (
            <motion.div
              key={article.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              className={cn(viewMode === 'list' && "w-full")}
            >
              <ArticleCard article={article} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
