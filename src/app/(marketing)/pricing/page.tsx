import React from "react";
import Link from "next/link";

export default function LandingPricingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Pricing</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
          Simple pricing while you build your process. You can start alone, and
          grow into teams and rooms later.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Solo plan */}
        <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Solo Trader</h2>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            For traders who want a serious journal and analytics without the noise.
          </p>
          <p className="text-3xl font-bold">$0</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            while in development
          </p>
          <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-300">
            <li>• Unlimited trades &amp; screenshots</li>
            <li>• Rules &amp; discipline tracking</li>
            <li>• Full analytics dashboard</li>
          </ul>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-lg px-4 py-2 mt-3 text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-md hover:shadow-lg transition-all"
          >
            Start journaling
          </Link>
        </div>

        {/* Teams plan */}
        <div className="rounded-2xl border border-zinc-300/80 dark:border-zinc-500/70 bg-gradient-to-br from-zinc-400/40 via-zinc-500/40 to-zinc-700/50 dark:from-black dark:via-zinc-800/50 dark:to-black backdrop-blur-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Teams &amp; Rooms
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-600/10 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-300">
              Coming to production
            </span>
          </h2>
          <p className="text-xs text-gray-700 dark:text-gray-200">
            Everything in Solo, plus collaboration features when you trade with a crew.
          </p>
          <p className="text-3xl font-bold">TBD</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            during private beta
          </p>
          <ul className="mt-2 space-y-1 text-xs text-gray-700 dark:text-gray-200">
            <li>• Team hubs &amp; shared trades</li>
            <li>• Team chat and notifications</li>
            <li>• Video rooms with screen sharing</li>
            <li>• Team &amp; global leaderboards</li>
          </ul>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Already using the app with a team? You&apos;re on the early-access
            plan automatically.
          </p>
        </div>
      </div>
    </div>
  );
}

