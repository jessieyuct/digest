import { useFeeds } from "@/hooks/use-feeds";
import { Link } from "wouter";
import { Loader2, Rss, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Feeds() {
  const { data: feeds, isLoading } = useFeeds();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container-page pb-20">
      <header className="mb-10">
        <h1 className="text-4xl font-serif text-primary mb-4 flex items-center gap-3">
          <Rss className="w-8 h-8" />
          My Subscriptions
        </h1>
        <p className="text-muted-foreground text-lg">
          Browse through your individual news sources and their history.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {feeds?.map((feed) => (
          <Card key={feed.id} className="flex flex-col hover-elevate transition-all border-border shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
              <div className="flex items-center gap-3">
                {feed.iconUrl ? (
                  <img src={feed.iconUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {feed.title[0]}
                  </div>
                )}
                <div>
                  <CardTitle className="font-serif text-lg leading-tight line-clamp-1">{feed.title}</CardTitle>
                  <CardDescription className="line-clamp-1">{feed.type}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardFooter className="mt-auto pt-0">
              <Link href={`/feed/${feed.id}`} className="w-full">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 text-primary font-medium hover:bg-secondary transition-colors">
                  View Latest Articles <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
