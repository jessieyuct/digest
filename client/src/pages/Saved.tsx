import { useArticles } from "@/hooks/use-articles";
import { ArticleCard } from "@/components/ArticleCard";
import { Loader2, Bookmark, Search } from "lucide-react";
import { useState } from "react";

export default function Saved() {
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  const { data: articles, isLoading } = useArticles({ isSaved: "true" });

  const filteredArticles = articles
    ?.filter(article => 
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.content?.toLowerCase().includes(search.toLowerCase()) ||
      article.feed.title.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.publishedDate || 0).getTime();
      const dateB = new Date(b.publishedDate || 0).getTime();
      return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="container-page pb-20">
      <header className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-serif text-primary mb-2 flex items-center gap-3">
              <Bookmark className="w-8 h-8" />
              Saved Articles
            </h1>
            <p className="text-muted-foreground text-lg">
              Your personal collection of must-reads.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search saved..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                data-testid="input-search-saved"
              />
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'latest' | 'oldest')}
              className="bg-card border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              data-testid="select-sort-saved"
            >
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !filteredArticles || filteredArticles.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border">
          <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-medium mb-2">
            {search ? "No matches found" : "No saved articles"}
          </h3>
          <p className="text-muted-foreground">
            {search ? "Try a different search term." : "Bookmark interesting stories to read them later."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
