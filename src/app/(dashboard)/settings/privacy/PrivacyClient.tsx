"use client";

import React, { useState, useEffect } from "react";
import { useColorMode } from "@/context/ColorModeContext";
import Button from "@/components/common/Button";

interface PrivacyState {
  shareWinRate: boolean;
  shareTradeCount: boolean;
  shareTopSymbols: boolean;
  shareActivity: boolean;
}

export default function PrivacyClient() {
  const { colorMode } = useColorMode();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<PrivacyState>({
    shareWinRate: false,
    shareTradeCount: true,
    shareTopSymbols: true,
    shareActivity: false,
  });

  useEffect(() => {
    fetch("/api/privacy")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        setSettings({
          shareWinRate: !!data.shareWinRate,
          shareTradeCount: !!data.shareTradeCount,
          shareTopSymbols: !!data.shareTopSymbols,
          shareActivity: !!data.shareActivity,
        });
      })
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (key: keyof PrivacyState) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const bg = colorMode === "light" ? "bg-white" : "bg-gray-800";
  const border = colorMode === "light" ? "border-gray-200" : "border-gray-700";
  const text = colorMode === "light" ? "text-gray-900" : "text-gray-100";
  const textMuted = colorMode === "light" ? "text-gray-500" : "text-gray-400";

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <p className={textMuted}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto w-full">
      <h1 className={`text-xl sm:text-2xl font-bold mb-2 ${text}`}>Privacy</h1>
      <p className={`text-sm ${textMuted} mb-6`}>
        Control what friends can see on your profile.
      </p>

      {error && (
        <p className="text-red-500 text-sm mb-4">{error}</p>
      )}

      <div className={`${bg} border ${border} rounded-lg p-4 sm:p-6 space-y-6`}>
        <ToggleRow
          label="Share trade count"
          description="Show number of trades (last 90 days) to friends"
          checked={settings.shareTradeCount}
          onToggle={() => handleToggle("shareTradeCount")}
          colorMode={colorMode}
        />
        <ToggleRow
          label="Share win rate"
          description="Show win rate (last 90 days) to friends"
          checked={settings.shareWinRate}
          onToggle={() => handleToggle("shareWinRate")}
          colorMode={colorMode}
        />
        <ToggleRow
          label="Share top symbols"
          description="Show top 5 symbols by trade count to friends"
          checked={settings.shareTopSymbols}
          onToggle={() => handleToggle("shareTopSymbols")}
          colorMode={colorMode}
        />
        <ToggleRow
          label="Share activity feed"
          description="Show last 10 trades (Opened/Closed) to friends"
          checked={settings.shareActivity}
          onToggle={() => handleToggle("shareActivity")}
          colorMode={colorMode}
        />

        <div className="pt-4">
          <Button
            text={saving ? "Saving..." : "Save"}
            onClick={handleSave}
            disabled={saving}
          />
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onToggle,
  colorMode,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  colorMode: string;
}) {
  const text = colorMode === "light" ? "text-gray-900" : "text-gray-100";
  const textMuted = colorMode === "light" ? "text-gray-500" : "text-gray-400";

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${text}`}>{label}</p>
        <p className={`text-sm mt-0.5 ${textMuted}`}>{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={`
          relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full touch-manipulation
          transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
          min-w-[48px] min-h-[44px] items-center
          ${checked ? (colorMode === "light" ? "bg-blue-600" : "bg-purple-600") : "bg-gray-300 dark:bg-gray-600"}
          ${colorMode === "light" ? "focus:ring-blue-500" : "focus:ring-purple-500"}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
            transition duration-200
            ${checked ? "translate-x-6" : "translate-x-1.5"}
          `}
        />
      </button>
    </div>
  );
}
