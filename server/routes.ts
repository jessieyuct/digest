import type { Express } from "express";
import type { Server } from "http";
import { db } from "./db";
import { feeds, articles } from "@shared/schema";
import { api } from "@shared/routes";
import { z } from "zod";
import { parseFeed } from "./lib/rss";
import { eq, desc, and, asc } from "drizzle-orm";
import OpenAI from "openai";
import { parseStringPromise } from "xml2js";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === Feeds ===

  app.get(api.feeds.list.path, async (req, res) => {
    const allFeeds = await db.select().from(feeds).orderBy(asc(feeds.title));
    res.json(allFeeds);
  });

  app.post(api.feeds.importOpml.path, async (req, res) => {
    try {
      const { opml } = api.feeds.importOpml.input.parse(req.body);
      const result = await parseStringPromise(opml);
      
      const findFeeds = (obj: any): { title: string; url: string }[] => {
        let results: { title: string; url: string }[] = [];
        if (Array.isArray(obj)) {
          for (const item of obj) {
            results = results.concat(findFeeds(item));
          }
        } else if (typeof obj === 'object' && obj !== null) {
          if (obj.$ && (obj.$.type === 'rss' || obj.$.xmlUrl)) {
            results.push({
              title: obj.$.title || obj.$.text || 'Unknown',
              url: obj.$.xmlUrl
            });
          }
          for (const key in obj) {
            if (key !== '$') {
              results = results.concat(findFeeds(obj[key]));
            }
          }
        }
        return results;
      };

      const feedsToImport = findFeeds(result.opml.body);

      let count = 0;
      for (const feedData of feedsToImport) {
        try {
          const [existing] = await db.select().from(feeds).where(eq(feeds.url, feedData.url)).limit(1);
          if (!existing) {
            await db.insert(feeds).values({
              url: feedData.url,
              title: feedData.title,
              type: "general",
              lastFetched: new Date(),
            });
            count++;
          }
        } catch (e) {
          console.error(`Failed to import feed ${feedData.url}`, e);
        }
      }
      res.json({ count });
    } catch (err) {
      console.error("OPML Import Error:", err);
      res.status(400).json({ message: "Invalid OPML" });
    }
  });

  app.post(api.feeds.create.path, async (req, res) => {
    try {
      const { url } = api.feeds.create.input.parse(req.body);

      // 1. Fetch RSS
      const parsed = await parseFeed(url);

      // 2. AI Categorize
      let type = "Business";
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-5.1",
          messages: [
            { role: "system", content: "You are a helpful assistant that categorizes RSS feeds. Categories: Business, Tech, Culture, Food, News, Finance, Lifestyle, Other. Return only the category name from this list. Do not use 'General'." },
            { role: "user", content: `Title: ${parsed.title}\nDescription: ${parsed.description}` }
          ],
          max_completion_tokens: 10,
        });
        const aiType = response.choices[0].message.content?.trim() || "Other";
        type = aiType === "General" ? "Other" : aiType;
      } catch (e) {
        console.error("AI Categorization failed", e);
      }

      // 3. Insert Feed
      const [feed] = await db.insert(feeds).values({
        url,
        title: parsed.title,
        description: parsed.description,
        type,
        lastFetched: new Date(),
      }).returning();

      // 4. Insert Articles
      if (parsed.items.length > 0) {
        await db.insert(articles).values(
          parsed.items.map(item => ({
            feedId: feed.id,
            title: item.title,
            link: item.link,
            content: item.content,
            publishedDate: new Date(item.pubDate),
          }))
        ).onConflictDoNothing(); // Skip duplicates
      }

      res.status(201).json(feed);
    } catch (err) {
      console.error(err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to add feed" });
    }
  });

  app.delete(api.feeds.delete.path, async (req, res) => {
    const id = parseInt(req.params.id);
    await db.delete(feeds).where(eq(feeds.id, id));
    res.status(204).send();
  });

  app.post(api.feeds.refresh.path, async (req, res) => {
    try {
      await refreshAllFeeds();
      res.json({ message: "Feeds refreshed" });
    } catch (e) {
      console.error("Manual refresh failed", e);
      res.status(500).json({ message: "Refresh failed" });
    }
  });

  // Export refresh logic for cron
  async function refreshAllFeeds() {
    console.log("Refreshing all feeds...");
    const allFeeds = await db.select().from(feeds);
    for (const feed of allFeeds) {
      try {
        const parsed = await parseFeed(feed.url);
        await db.update(feeds).set({ lastFetched: new Date() }).where(eq(feeds.id, feed.id));
        if (parsed.items.length > 0) {
           await db.insert(articles).values(
            parsed.items.map(item => ({
              feedId: feed.id,
              title: item.title,
              link: item.link,
              content: item.content,
              publishedDate: new Date(item.pubDate),
            }))
          ).onConflictDoNothing();
        }
      } catch (e) {
        console.error(`Failed to refresh feed ${feed.url}`, e);
      }
    }
    console.log("Refresh complete.");
  }

  // Schedule cron: 12:00 PM and 12:00 AM (UTC)
  // Replit handles server persistence, so we can use a simple interval or a cron library
  // For standard Replit usage, we'll implement a simple check every hour to see if it's 12:00
  setInterval(() => {
    const now = new Date();
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    
    // Check if it's around 12:00 (0 or 12 hours) and first check of that hour
    if ((hours === 0 || hours === 12) && minutes < 5) {
      refreshAllFeeds().catch(console.error);
    }
  }, 1000 * 60 * 5); // Check every 5 minutes

  // === Articles ===

  app.get(api.articles.list.path, async (req, res) => {
    const feedId = req.query.feedId ? parseInt(req.query.feedId as string) : undefined;
    const isSaved = req.query.isSaved === 'true';
    const isRead = req.query.isRead === 'true' ? true : (req.query.isRead === 'false' ? false : undefined);

    let query = db.select({
      id: articles.id,
      feedId: articles.feedId,
      title: articles.title,
      link: articles.link,
      content: articles.content,
      summary: articles.summary,
      publishedDate: articles.publishedDate,
      isRead: articles.isRead,
      isSaved: articles.isSaved,
      createdAt: articles.createdAt,
      feed: feeds
    })
    .from(articles)
    .innerJoin(feeds, eq(articles.feedId, feeds.id));

    if (feedId) {
      query = query.where(eq(articles.feedId, feedId));
    }

    if (isRead !== undefined) {
      query = query.where(eq(articles.isRead, isRead));
    }

    if (isSaved) {
      query = query.where(eq(articles.isSaved, true));
    }

    if (req.query.sort === 'feed') {
      // @ts-ignore
      query = query.orderBy(feeds.title, articles.isRead, desc(articles.publishedDate));
    } else {
      // @ts-ignore
      query = query.orderBy(articles.isRead, desc(articles.publishedDate));
    }

    const results = await query;
    res.json(results);
  });

  app.patch(api.articles.markRead.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const { isRead } = api.articles.markRead.input.parse(req.body);
    const [updated] = await db.update(articles).set({ isRead }).where(eq(articles.id, id)).returning();
    if (!updated) return res.status(404).json({ message: "Article not found" });
    res.json(updated);
  });

  app.patch(api.articles.toggleSaved.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const { isSaved } = api.articles.toggleSaved.input.parse(req.body);
    const [updated] = await db.update(articles).set({ isSaved }).where(eq(articles.id, id)).returning();
    if (!updated) return res.status(404).json({ message: "Article not found" });
    res.json(updated);
  });

  app.get(api.articles.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const result = await db.select({
      id: articles.id,
      feedId: articles.feedId,
      title: articles.title,
      link: articles.link,
      content: articles.content,
      summary: articles.summary,
      publishedDate: articles.publishedDate,
      isRead: articles.isRead,
      isSaved: articles.isSaved,
      createdAt: articles.createdAt,
      feed: feeds
    })
    .from(articles)
    .innerJoin(feeds, eq(articles.feedId, feeds.id))
    .where(eq(articles.id, id))
    .limit(1);

    if (result.length === 0) return res.status(404).json({ message: "Article not found" });
    res.json(result[0]);
  });

  app.post(api.articles.translate.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    if (!article) return res.status(404).json({ message: "Article not found" });

    try {
      // Translate using OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: "Translate the following text to Traditional Chinese (Taiwan). Maintain the original tone and personality." },
          { role: "user", content: article.content || article.title }
        ],
      });
      res.json({ translation: response.choices[0].message.content });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Translation failed" });
    }
  });

  app.post(api.articles.summarize.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    if (!article) return res.status(404).json({ message: "Article not found" });

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: "Provide a clean, neat summary of this article. Keep the personality." },
          { role: "user", content: article.content || article.title }
        ],
      });
      res.json({ script: response.choices[0].message.content });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Summarization failed" });
    }
  });

  // Seed default feeds
  const existingFeeds = await db.select().from(feeds).limit(1);
  if (existingFeeds.length === 0) {
    const seeds = [
      "https://techcrunch.com/feed/",
      "https://www.theverge.com/rss/index.xml",
      "https://lifehacker.com/rss"
    ];
    for (const url of seeds) {
      try {
        const parsed = await parseFeed(url);
        const [feed] = await db.insert(feeds).values({
          url,
          title: parsed.title,
          description: parsed.description,
          type: "tech", // Default for seed
          lastFetched: new Date(),
        }).returning();
        
        if (parsed.items.length > 0) {
          await db.insert(articles).values(
            parsed.items.slice(0, 10).map(item => ({
              feedId: feed.id,
              title: item.title,
              link: item.link,
              content: item.content,
              publishedDate: new Date(item.pubDate),
            }))
          ).onConflictDoNothing();
        }
        console.log(`Seeded feed: ${parsed.title}`);
      } catch (e) {
        console.error(`Failed to seed ${url}`, e);
      }
    }
  }

  return httpServer;
}
