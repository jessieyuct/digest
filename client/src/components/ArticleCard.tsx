import { format } from "date-fns";
import { ArrowRight, BookOpen, Clock, Bookmark } from "lucide-react";
import { Link } from "wouter";
import { type Article, type Feed } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useToggleSaved } from "@/hooks/use-articles";

interface ArticleCardProps {
  article: Article & { feed: Feed };
}

export function ArticleCard({ article }: ArticleCardProps) {
  const toggleSaved = useToggleSaved();
  // Strip HTML for summary if needed
  const cleanSummary = article.summary || article.content?.replace(/<[^>]*>?/gm, '').slice(0, 150) + '...';

  return (
    <div className="group relative bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col h-full overflow-hidden">
      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="flex items-center justify-between mb-4 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {article.feed.iconUrl ? (
            <img src={article.feed.iconUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-primary">
              {article.feed.title[0]}
            </div>
          )}
          <span className="font-medium text-muted-foreground">{article.feed.title}</span>
          {article.feed.type && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-tighter text-[9px]">
              {article.feed.type}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.preventDefault();
              toggleSaved.mutate({ id: article.id, isSaved: !article.isSaved });
            }}
            disabled={toggleSaved.isPending}
            className={cn(
              "p-1.5 rounded-full transition-colors",
              article.isSaved ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"
            )}
            data-testid={`button-save-${article.id}`}
          >
            <Bookmark className={cn("w-4 h-4", article.isSaved && "fill-current")} />
          </button>
          <span className="text-muted-foreground/70">
            {article.publishedDate ? format(new Date(article.publishedDate), "MMM d") : ""}
          </span>
        </div>
      </div>

      <Link href={`/article/${article.id}`}>
        <h3 className="font-serif text-xl font-bold mb-3 group-hover:text-primary transition-colors cursor-pointer line-clamp-2">
          {article.title}
        </h3>
      </Link>

      <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
        {cleanSummary}
      </p>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-dashed border-border/60">
        <div className="flex gap-3 text-xs text-muted-foreground">
           <span className="flex items-center gap-1">
             <Clock className="w-3 h-3" /> 5 min read
           </span>
        </div>
        
        <Link href={`/article/${article.id}`}>
          <button className="flex items-center gap-1 text-sm font-medium text-primary hover:translate-x-1 transition-transform cursor-pointer">
            Read <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    </div>
  );
}
