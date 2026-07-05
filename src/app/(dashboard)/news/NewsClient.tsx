"use client";

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { FaExternalLinkAlt, FaNewspaper } from "react-icons/fa";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useColorMode } from "@/context/ColorModeContext";

type NewsCategory = "crypto" | "forex" | "stocks";
type CategoryFilter = "all" | NewsCategory;

interface NewsItem {
  title: string;
  link: string;
  source: string;
  category: NewsCategory;
  publishedAt: string | null;
  imageUrl: string | null;
}

const FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "crypto", label: "Crypto" },
  { value: "forex", label: "Forex" },
  { value: "stocks", label: "Stocks" },
];

const CATEGORY_BADGE_VARIANT: Record<NewsCategory, "info" | "success" | "warning"> = {
  crypto: "warning",
  forex: "info",
  stocks: "success",
};

function timeAgo(dateString: string | null): string {
  if (!dateString) return "";
  const ms = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const NewsClient = () => {
  const { colorMode } = useColorMode();
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [items, setItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const borderColor = colorMode === "light" ? "border-zinc-200" : "border-zinc-800";
  const mutedText = colorMode === "light" ? "text-gray-500" : "text-gray-400";

  const fetchNews = useCallback(async (category: CategoryFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = category !== "all" ? `?category=${category}` : "";
      const response = await axios.get<{ items: NewsItem[] }>(`/api/news${params}`);
      setItems(response.data.items);
    } catch (err) {
      console.error("Error fetching news:", err);
      setError("Failed to load news. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(filter);
  }, [filter, fetchNews]);

  return (
    <div className="min-h-screen w-full app-bg">
      <div className="w-full h-full p-4 sm:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-[1600px] mx-auto">
        <PageHeader
          title="News"
          subtitle="Latest headlines across crypto, forex, and stocks"
        />

        <div
          className={`inline-flex rounded-lg border p-1 ${borderColor} ${
            colorMode === "light" ? "bg-white" : "bg-zinc-900"
          }`}
        >
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f.value
                  ? colorMode === "light"
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-900"
                  : colorMode === "light"
                  ? "text-gray-600 hover:bg-zinc-100"
                  : "text-gray-400 hover:bg-zinc-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <Alert variant="error" title="Error">
            {error}
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <Spinner size="lg" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No news available"
            message="Couldn't load headlines right now. Try again in a bit."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((item, index) => (
              <a
                key={`${item.link}-${index}`}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Card className={`app-surface ${borderColor} border h-full hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant={CATEGORY_BADGE_VARIANT[item.category]} size="sm">
                      {item.category.toUpperCase()}
                    </Badge>
                    <FaExternalLinkAlt className={`h-3 w-3 shrink-0 mt-1 ${mutedText}`} />
                  </div>
                  <h3 className="font-semibold text-sm leading-snug mb-3 line-clamp-3">
                    {item.title}
                  </h3>
                  <div className={`flex items-center gap-2 text-xs ${mutedText}`}>
                    <FaNewspaper className="h-3 w-3" />
                    <span>{item.source}</span>
                    {item.publishedAt && (
                      <>
                        <span>&middot;</span>
                        <span>{timeAgo(item.publishedAt)}</span>
                      </>
                    )}
                  </div>
                </Card>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsClient;
