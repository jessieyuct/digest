import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useFeeds() {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: [api.feeds.list.path],
    queryFn: async () => {
      const res = await fetch(api.feeds.list.path);
      if (!res.ok) throw new Error("Failed to fetch feeds");
      return api.feeds.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateFeed() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch(api.feeds.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to add feed");
      }
      return api.feeds.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.feeds.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.articles.list.path] });
      toast({ title: "Success", description: "Feed added successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to add feed",
        variant: "destructive" 
      });
    },
  });
}

export function useDeleteFeed() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.feeds.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete feed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.feeds.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.articles.list.path] });
      toast({ title: "Success", description: "Feed removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not remove feed", variant: "destructive" });
    },
  });
}

export function useRefreshFeeds() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.feeds.refresh.path, { method: "POST" });
      if (!res.ok) throw new Error("Failed to refresh");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.feeds.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.articles.list.path] });
      toast({ title: "Updated", description: "Feeds refreshed successfully" });
    },
  });
}
