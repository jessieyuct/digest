import { useState, useRef } from "react";
import { useCreateFeed, useRefreshFeeds } from "@/hooks/use-feeds";
import { FeedList } from "@/components/FeedList";
import { Plus, Loader2, RefreshCw, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

export default function ManageFeeds() {
  const [url, setUrl] = useState("");
  const createFeed = useCreateFeed();
  const refreshFeeds = useRefreshFeeds();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useMutation({
    mutationFn: async (opml: string) => {
      const res = await apiRequest("POST", "/api/feeds/import", { opml });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/feeds"] });
      toast({ 
        title: "Import Success", 
        description: `Successfully imported ${data.count} new feeds from OPML.` 
      });
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "Could not parse or import the OPML file.",
        variant: "destructive"
      });
    }
  });

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      importMutation.mutate(text);
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    try {
      new URL(url); // Basic validation
      createFeed.mutate(url, {
        onSuccess: () => setUrl("")
      });
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid RSS feed URL starting with http:// or https://",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container-page max-w-4xl">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif text-primary mb-2">Manage Feeds</h1>
          <p className="text-muted-foreground">Curate your sources. Add RSS links or import from OPML.</p>
        </div>
        
        <div className="flex gap-2">
          <input
            type="file"
            accept=".opml,.xml"
            onChange={handleImport}
            className="hidden"
            ref={fileInputRef}
            data-testid="input-import-opml"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-primary hover:bg-secondary/80 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {importMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Import OPML
          </button>
          
          <button
            onClick={() => refreshFeeds.mutate()}
            disabled={refreshFeeds.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-primary hover:bg-secondary/80 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {refreshFeeds.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh All
          </button>
        </div>
      </header>

      <section className="mb-12">
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <h2 className="text-lg font-bold mb-4">Add New Source</h2>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/rss.xml"
                className="w-full px-4 py-3 rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                disabled={createFeed.isPending}
                data-testid="input-feed-url"
              />
            </div>
            <button
              type="submit"
              disabled={createFeed.isPending}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
              data-testid="button-add-feed"
            >
              {createFeed.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Add Feed</span>
                </>
              )}
            </button>
          </form>
          <p className="mt-3 text-sm text-muted-foreground flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 inline-block" />
            We'll automatically fetch the title, icon, and latest articles.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-serif font-bold mb-6 text-foreground/80">Your Subscriptions</h2>
        <FeedList />
      </section>
    </div>
  );
}
