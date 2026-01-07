import { useParams, Link } from "wouter";
import { useArticles } from "@/hooks/use-articles";
import { useFeeds } from "@/hooks/use-feeds";
import { ArticleCard } from "@/components/ArticleCard";
import { Loader2, ArrowLeft, Rss } from "lucide-react";

export default function FeedView() {
  const { id } = useParams<{ id: string }>();
  const feedId = Number(id);
  
  const { data: feeds } = useFeeds();
  const currentFeed = feeds?.find(f => f.id === feedId);
  
  const { data: articles, isLoading } = useArticles({ feedId: id });

  const latestArticles = articles?.slice(0, 20);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentFeed) {
    return (
      <div className="container-page text-center py-20">
        <h2 className="text-2xl font-serif">Feed not found</h2>
        <Link href="/feeds" className="text-primary hover:underline mt-4 inline-block">Back to Subscriptions</Link>
      </div>
    );
  }

  return (
    <div className="container-page pb-20">
      <Link href="/feeds" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Subscriptions
      </Link>

      <header className="mb-10 flex items-center gap-6">
        {currentFeed.iconUrl ? (
          <img src={currentFeed.iconUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border border-border" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold border border-border">
            {currentFeed.title[0]}
          </div>
        )}
        <div>
          <h1 className="text-4xl font-serif font-bold text-primary mb-2">{currentFeed.title}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Rss className="w-4 h-4" /> {currentFeed.type} • Latest 20 articles
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {latestArticles?.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
