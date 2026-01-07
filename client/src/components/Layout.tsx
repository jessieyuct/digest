import { Link, useLocation } from "wouter";
import { Compass, BookOpen, Rss, Menu, X, Coffee } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Explore", path: "/", icon: Compass },
    { label: "Feeds", path: "/feeds", icon: BookOpen },
    { label: "Manage", path: "/manage", icon: Rss },
    { label: "Saved", path: "/saved", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <Link href="/" className="flex items-center gap-2 font-serif text-xl font-bold text-primary">
          <Coffee className="w-6 h-6" />
          <span>Digest</span>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-muted-foreground hover:text-primary transition-colors"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-16 left-0 right-0 bg-card border-b z-50 p-4 shadow-lg"
          >
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <div 
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer",
                      location === item.path 
                        ? "bg-secondary text-primary font-medium" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card p-6 h-screen sticky top-0">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Coffee className="w-6 h-6 text-primary" />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight text-primary">Digest</span>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div 
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer group",
                  location === item.path 
                    ? "bg-secondary text-primary font-medium shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-300", 
                  location === item.path ? "scale-110" : "group-hover:scale-110"
                )} />
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="mt-auto px-4 py-4 rounded-xl bg-muted/50 text-xs text-muted-foreground">
          <p>Read thoughtfully.</p>
          <p className="mt-1">© 2024 Digest App</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
