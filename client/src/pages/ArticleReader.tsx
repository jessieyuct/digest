import { useParams, Link } from "wouter";
import { useArticle, useTranslateArticle, useSummarizeArticle, useToggleSaved } from "@/hooks/use-articles";
import { ArrowLeft, Languages, FileText, Loader2, Share2, Bookmark } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ArticleReader() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  
  const { data: article, isLoading } = useArticle(id);
  const translate = useTranslateArticle();
  const summarize = useSummarizeArticle();
  const toggleSaved = useToggleSaved();
  
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleTranslate = () => {
    translate.mutate(id, {
      onSuccess: (data) => setTranslatedContent(data.translation)
    });
  };

  const handleSummarize = () => {
    summarize.mutate(id, {
      onSuccess: (data) => setSummary(data.script)
    });
  };

  const handleToggleSaved = () => {
    if (article) {
      toggleSaved.mutate({ id: article.id, isSaved: !article.isSaved });
    }
  };

  const toggleTTS = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const textToSpeak = article?.content?.replace(/<[^>]*>/g, '') || article?.title || "";
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container-page text-center py-20">
        <h1 className="text-2xl font-serif">Article not found</h1>
        <Link href="/" className="text-primary hover:underline mt-4 inline-block">Return Home</Link>
      </div>
    );
  }

  const contentToDisplay = translatedContent || article.content || article.summary || "";

  return (
    <article className="max-w-3xl mx-auto px-4 py-8 md:py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Explore
      </Link>

      <header className="mb-10 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-primary mb-4 font-medium tracking-wide uppercase">
          <span>{article.feed.title}</span>
          <span>•</span>
          <span>{article.publishedDate && format(new Date(article.publishedDate), "MMMM d, yyyy")}</span>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-serif font-bold leading-tight mb-8 text-foreground">
          {article.title}
        </h1>

        {/* Action Toolbar */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button 
            onClick={handleTranslate}
            disabled={translate.isPending}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
              translatedContent 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-white border-border hover:border-primary text-muted-foreground hover:text-primary"
            )}
          >
            {translate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
            {translatedContent ? "Translated (TC)" : "Translate to TC"}
          </button>
          
          <button 
            onClick={handleSummarize}
            disabled={summarize.isPending}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
              summary 
                ? "bg-secondary text-primary border-secondary-foreground/10" 
                : "bg-white border-border hover:border-primary text-muted-foreground hover:text-primary"
            )}
          >
            {summarize.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {summary ? "Summary Generated" : "AI Summary"}
          </button>

          <button 
            onClick={toggleTTS}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
              isSpeaking 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-white border-border hover:border-primary text-muted-foreground hover:text-primary"
            )}
            data-testid="button-tts"
          >
            <Share2 className="w-4 h-4 rotate-180" />
            {isSpeaking ? "Stop Listening" : "Listen"}
          </button>

          <button 
            onClick={handleToggleSaved}
            disabled={toggleSaved.isPending}
            className={cn(
              "p-2 rounded-full border transition-all",
              article.isSaved 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-white border-border hover:border-primary text-muted-foreground hover:text-primary"
            )}
            data-testid="button-save-article"
          >
            <Bookmark className={cn("w-4 h-4", article.isSaved && "fill-current")} />
          </button>
        </div>
      </header>

      {/* AI Script/Summary Box */}
      {summary && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 p-6 bg-secondary/50 rounded-2xl border border-secondary-foreground/10"
        >
          <div className="flex items-center gap-2 mb-3 text-primary font-bold font-serif">
            <FileText className="w-5 h-5" />
            <h3>AI Summary</h3>
          </div>
          <div className="prose prose-sm max-w-none text-foreground/80 font-sans leading-relaxed whitespace-pre-line">
            {summary}
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div 
        className="typography-article prose prose-lg prose-stone max-w-none prose-headings:font-serif prose-a:text-primary prose-img:rounded-xl prose-img:shadow-md"
        dangerouslySetInnerHTML={{ __html: contentToDisplay }} 
      />
      
      <div className="mt-16 pt-8 border-t border-border flex justify-between items-center text-muted-foreground text-sm">
        <p>End of article</p>
        <button className="flex items-center gap-2 hover:text-primary transition-colors">
          <Share2 className="w-4 h-4" /> Share Article
        </button>
      </div>
    </article>
  );
}
