import Parser from 'rss-parser';

const parser = new Parser();

export interface ParsedFeed {
  title: string;
  description: string | undefined;
  items: Array<{
    title: string;
    link: string;
    content: string;
    pubDate: string;
    contentSnippet?: string;
  }>;
}

export async function parseFeed(url: string): Promise<ParsedFeed> {
  try {
    const feed = await parser.parseURL(url);
    return {
      title: feed.title || 'Unknown Feed',
      description: feed.description,
      items: feed.items.map(item => ({
        title: item.title || 'Untitled',
        link: item.link || '',
        content: item.content || item.contentSnippet || '',
        pubDate: item.pubDate || new Date().toISOString(),
        contentSnippet: item.contentSnippet
      }))
    };
  } catch (error) {
    throw new Error(`Failed to parse RSS feed: ${error}`);
  }
}
