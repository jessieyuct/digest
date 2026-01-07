import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Explore from "@/pages/Explore";
import ManageFeeds from "@/pages/ManageFeeds";
import Saved from "@/pages/Saved";
import Feeds from "@/pages/Feeds";
import FeedView from "@/pages/FeedView";
import ArticleReader from "@/pages/ArticleReader";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Explore} />
        <Route path="/feeds" component={Feeds} />
        <Route path="/feed/:id" component={FeedView} />
        <Route path="/manage" component={ManageFeeds} />
        <Route path="/saved" component={Saved} />
        <Route path="/article/:id" component={ArticleReader} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
