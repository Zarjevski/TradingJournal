import React from "react";
import { FaChartBar, FaRuler, FaUsers, FaVideo, FaCloudUploadAlt } from "react-icons/fa";

export default function LandingFeaturesPage() {
  const features = [
    {
      icon: <FaChartBar className="h-5 w-5" />,
      title: "Analytics that matter",
      description:
        "Track win rate, R:R, P&L and more. Filter by symbol, exchange, status, and time to understand your edge.",
    },
    {
      icon: <FaRuler className="h-5 w-5" />,
      title: "Rules & discipline",
      description:
        "Document your trading rules, see Rule of the Day on the dashboard, and get warned when you break discipline.",
    },
    {
      icon: <FaUsers className="h-5 w-5" />,
      title: "Teams & chat",
      description:
        "Create teams, share trades, and use TEAM chat rooms so you never trade alone or without accountability.",
    },
    {
      icon: <FaVideo className="h-5 w-5" />,
      title: "Video rooms",
      description:
        "Real WebRTC video rooms with screen sharing to review setups, entries, and exits together in real time.",
    },
    {
      icon: <FaCloudUploadAlt className="h-5 w-5" />,
      title: "Screenshots & uploads",
      description:
        "Attach screenshots directly to your trades, team images, and profile to keep context in one place.",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Features</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
          Everything you need to turn raw P&amp;L into a real trading process:
          from journaling and rules to collaboration and video.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-gray-200/70 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 backdrop-blur-xl p-4 flex gap-3"
          >
            <div className="mt-1 text-blue-500 dark:text-purple-400">
              {f.icon}
            </div>
            <div>
              <h2 className="font-semibold text-sm mb-1">{f.title}</h2>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {f.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

