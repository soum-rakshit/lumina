"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, LayoutDashboard, Target, Sparkles, X } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { MonthCalendar, MobileCalendarDrawer, TodayProgressSlider } from "@/components/CalendarView";
import { useDataStore } from "@/lib/dataStore";
import { ThemeToggle } from "@/components/ThemeToggle";

const MOTIVATIONAL_QUOTES = [
  "The secret of getting ahead is getting started. 🚀",
  "Small daily improvements over time lead to stunning results. ✨",
  "Discipline is choosing between what you want now and what you want most. 🎯",
  "You don't have to be extreme, just consistent. 💪",
  "Success is the sum of small efforts repeated day in and day out. 🔥",
  "The only way to do great work is to love what you do. ❤️",
  "Your future self will thank you for the work you do today. 🌟",
];

const NAV_ITEMS = [
  { href: "/dashboard", label: "📋 Today", icon: LayoutDashboard, id: "nav-today" },
  { href: "/planners", label: "🎯 Goals", icon: Target, id: "nav-goals" },
  { href: "/full-schedule", label: "📊 Timeline", icon: Calendar, id: "nav-timeline" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showMotivation, setShowMotivation] = useState(false);
  const [quote, setQuote] = useState("");
  const { planners: storePlanners, fetchGlobalData } = useDataStore();
  const planners = storePlanners || [];

  useEffect(() => {
    // Show motivation popup on first visit of the session
    const shown = sessionStorage.getItem("motivation-shown");
    if (!shown) {
      const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
      setQuote(randomQuote);
      setShowMotivation(true);
      sessionStorage.setItem("motivation-shown", "true");
    }

    // Seed global cache (no-op if already cached)
    fetchGlobalData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Motivational Popup */}
      <AnimatePresence>
        {showMotivation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMotivation(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative max-w-md mx-4 p-8 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white shadow-2xl shadow-indigo-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowMotivation(false)}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-amber-300" />
                <span className="text-sm font-semibold uppercase tracking-wider text-indigo-200">Daily Motivation</span>
              </div>
              <p className="text-xl font-medium leading-relaxed italic">&ldquo;{quote}&rdquo;</p>
              <button
                onClick={() => setShowMotivation(false)}
                className="mt-6 w-full py-2.5 rounded-xl bg-white/20 hover:bg-white/30 font-semibold text-sm transition-colors backdrop-blur-sm"
              >
                Let&apos;s Go! 💪
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Lumina
              </h1>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-muted/50 rounded-xl p-1" id="desktop-nav">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    id={item.id}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/20"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      {item.label.split(" ").slice(1).join(" ")}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* User & Theme Actions */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 ring-2 ring-indigo-500/20 ring-offset-2 ring-offset-background",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Area with sidebar */}
      <div className="flex flex-1 max-w-[1400px] mx-auto w-full">
        {/* Main Content */}
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pb-24 md:pb-8 pt-6">
          {children}
        </main>

        {/* Desktop Sidebar — Calendar */}
        <aside className="hidden lg:block w-80 shrink-0 border-l border-border/50 p-5 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <MonthCalendar planners={planners} compact />
            </div>
            <TodayProgressSlider planners={planners} />
          </div>
        </aside>
      </div>

      {/* Mobile: floating emoji + sliding calendar drawer */}
      <MobileCalendarDrawer planners={planners} />

      {/* Bottom Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-border/50 bg-background/80 backdrop-blur-xl" id="mobile-nav">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto safe-area-bottom">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${
                  isActive ? "text-indigo-600" : "text-muted-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className={`w-5 h-5 ${isActive ? "text-indigo-600" : ""}`} />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
