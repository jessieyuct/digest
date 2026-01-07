import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const feeds = pgTable("feeds", {
  id: serial("id").primaryKey(),
  url: text("url").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  type: text("type").default("general"), // news, blog, tech, etc. (AI categorized)
  lastFetched: timestamp("last_fetched"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  feedId: integer("feed_id").notNull().references(() => feeds.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  link: text("link").notNull().unique(),
  content: text("content"),
  summary: text("summary"), // AI generated script/summary
  publishedDate: timestamp("published_date"),
  isRead: boolean("is_read").default(false),
  isSaved: boolean("is_saved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const feedsRelations = relations(feeds, ({ many }) => ({
  articles: many(articles),
}));

export const articlesRelations = relations(articles, ({ one }) => ({
  feed: one(feeds, {
    fields: [articles.feedId],
    references: [feeds.id],
  }),
}));

export const insertFeedSchema = createInsertSchema(feeds).omit({ 
  id: true, 
  lastFetched: true, 
  createdAt: true,
  type: true, // AI determined
  title: true, // Fetched from RSS
  description: true, // Fetched from RSS
  iconUrl: true // Fetched from RSS
}).extend({
  url: z.string().url()
});

export const insertArticleSchema = createInsertSchema(articles).omit({ 
  id: true, 
  createdAt: true 
});

export type Feed = typeof feeds.$inferSelect;
export type InsertFeed = z.infer<typeof insertFeedSchema>;
export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;

export type CreateFeedRequest = { url: string };
export type TranslateRequest = { language?: string }; // Default to Traditional Chinese
