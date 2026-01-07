import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

type ArticleFilters = {
  feedId?: string;
  isSaved?: string;
  sort?: "date" | "feed";
};

export function useArticles(filters: ArticleFilters = {}) {
  const queryKey = [api.articles.list.path, filters];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.feedId) params.append("feedId", filters.feedId);
      if (filters.isSaved) params.append("isSaved", filters.isSaved);
      if (filters.sort) params.append("sort", filters.sort);
      
      const url = `${api.articles.list.path}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch articles");
      return api.articles.list.responses[200].parse(await res.json());
    },
  });
}

export function useArticle(id: number) {
  return useQuery({
    queryKey: [api.articles.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.articles.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch article");
      return api.articles.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useTranslateArticle() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.articles.translate.path, { id });
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Translation failed");
      return api.articles.translate.responses[200].parse(await res.json());
    },
    onError: () => {
      toast({ title: "Error", description: "Could not translate article", variant: "destructive" });
    },
  });
}

export function useSummarizeArticle() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.articles.summarize.path, { id });
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Summarization failed");
      return api.articles.summarize.responses[200].parse(await res.json());
    },
    onError: () => {
      toast({ title: "Error", description: "Could not generate script", variant: "destructive" });
    },
  });
}

export function useToggleSaved() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, isSaved }: { id: number; isSaved: boolean }) => {
      const res = await fetch(buildUrl(api.articles.toggleSaved.path, { id }), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSaved }),
      });
      if (!res.ok) throw new Error("Failed to save article");
      return api.articles.toggleSaved.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.articles.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.articles.get.path, data.id] });
      toast({ 
        title: data.isSaved ? "Saved" : "Removed", 
        description: data.isSaved ? "Article added to your collection" : "Article removed from your collection" 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not save article", variant: "destructive" });
    },
  });
}

import { queryClient } from "@/lib/queryClient";
