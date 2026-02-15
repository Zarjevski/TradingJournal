"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useColorMode } from "@/context/ColorModeContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import { FaCrown } from "react-icons/fa";

interface TeamLeaderboardEntry {
  id: string;
  name: string;
  description: string | null;
  imageURL?: string | null;
  membersCount: number;
  totalPnL: number;
  tradesShared: number;
}

interface PeopleLeaderboardEntry {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string | null;
  totalPnL: number;
  tradeCount: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { colorMode } = useColorMode();
  const [teams, setTeams] = useState<TeamLeaderboardEntry[]>([]);
  const [people, setPeople] = useState<PeopleLeaderboardEntry[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [peopleLoading, setPeopleLoading] = useState(true);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [peopleError, setPeopleError] = useState<string | null>(null);

  const isDark = colorMode === "dark";
  const bgColor = "app-bg";
  const textColor = isDark ? "text-gray-100" : "text-gray-900";
  const cardBg = "app-surface";
  const borderColor = isDark ? "border-gray-700" : "border-gray-200";
  const muted = isDark ? "text-gray-400" : "text-gray-600";

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setTeamsLoading(true);
        setTeamsError(null);
        const res = await axios.get<TeamLeaderboardEntry[]>("/api/teams/leaderboard");
        setTeams(res.data || []);
      } catch (err: any) {
        console.error("Error fetching teams leaderboard:", err);
        setTeamsError(err.response?.data?.error || "Failed to load teams leaderboard");
      } finally {
        setTeamsLoading(false);
      }
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        setPeopleLoading(true);
        setPeopleError(null);
        const res = await axios.get<PeopleLeaderboardEntry[]>("/api/leaderboard/people");
        setPeople(res.data || []);
      } catch (err: any) {
        console.error("Error fetching people leaderboard:", err);
        setPeopleError(err.response?.data?.error || "Failed to load people leaderboard");
      } finally {
        setPeopleLoading(false);
      }
    };
    fetchPeople();
  }, []);

  const teamsContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Button variant="secondary" onClick={() => router.push("/team")}>
          View My Teams
        </Button>
      </div>
      {teamsError && <Alert variant="error">{teamsError}</Alert>}
      {teamsLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !teams?.length ? (
        <Card className={`${cardBg} ${borderColor} border`}>
          <div className="p-6 text-center">
            <p className={muted}>
              No teams with shared trades yet. Start sharing trades in your team rooms to appear on the leaderboard.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {teams.map((team, index) => (
            <div
              key={team.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/team/${team.id}`)}
              onKeyDown={(e) => e.key === "Enter" && router.push(`/team/${team.id}`)}
              className="cursor-pointer"
            >
            <Card
              className={`${cardBg} ${borderColor} border hover:shadow-lg transition-shadow`}
            >
              <div className="p-4 flex items-center gap-4">
                <div className="flex flex-col items-center w-12">
                  <span className="text-xl font-bold">#{index + 1}</span>
                  {index === 0 && <Badge variant="info" size="sm">Top</Badge>}
                </div>
                <div className="flex-shrink-0">
                  {team.imageURL ? (
                    <img
                      src={team.imageURL}
                      alt={team.name}
                      className={`w-12 h-12 rounded-lg object-cover border ${borderColor}`}
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold ${isDark ? "bg-purple-600" : "bg-blue-600"}`}>
                      {team.name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold">{team.name}</h2>
                    <Badge variant="default" size="sm">{team.membersCount} members</Badge>
                    <Badge variant="info" size="sm">{team.tradesShared} shared trades</Badge>
                  </div>
                  {team.description && <p className={`text-sm ${muted}`}>{team.description}</p>}
                </div>
                <div className="text-right min-w-[120px]">
                  <p className="text-xs uppercase tracking-wide mb-1 text-gray-500">Total P&L</p>
                  {team.totalPnL >= 0 ? (
                    <p className="text-lg font-bold text-green-500">+${team.totalPnL.toLocaleString()}</p>
                  ) : (
                    <p className="text-lg font-bold text-red-500">-${Math.abs(team.totalPnL).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const peopleContent = (
    <div className="space-y-4">
      {peopleError && <Alert variant="error">{peopleError}</Alert>}
      {peopleLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !people?.length ? (
        <Card className={`${cardBg} ${borderColor} border`}>
          <div className="p-6 text-center">
            <p className={muted}>
              No traders with trades yet. Add trades to your journal to appear on the leaderboard.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {people.map((entry, index) => (
            <Card
              key={entry.userId}
              className={`${cardBg} ${borderColor} border`}
            >
              <div className="p-4 flex items-center gap-4">
                <div className="flex flex-col items-center w-12">
                  <span className="text-xl font-bold">#{index + 1}</span>
                  {index === 0 && <Badge variant="info" size="sm">Top</Badge>}
                </div>
                <div className="flex-shrink-0">
                  {entry.photoURL ? (
                    <img
                      src={entry.photoURL}
                      alt={`${entry.firstName} ${entry.lastName}`}
                      className={`w-12 h-12 rounded-full object-cover border-2 ${borderColor}`}
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm ${isDark ? "bg-purple-600" : "bg-blue-600"}`}>
                      {entry.firstName?.[0]}{entry.lastName?.[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">
                    {entry.firstName} {entry.lastName}
                  </h2>
                  <p className={`text-sm ${muted}`}>{entry.email}</p>
                  <Badge variant="default" size="sm" className="mt-1">
                    {entry.tradeCount} trade{entry.tradeCount !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <div className="text-right min-w-[120px]">
                  <p className="text-xs uppercase tracking-wide mb-1 text-gray-500">Total P&L</p>
                  {entry.totalPnL >= 0 ? (
                    <p className="text-lg font-bold text-green-500">+${entry.totalPnL.toLocaleString()}</p>
                  ) : (
                    <p className="text-lg font-bold text-red-500">-${Math.abs(entry.totalPnL).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: "teams", label: "Teams", content: teamsContent },
    { id: "people", label: "People", content: peopleContent },
  ];

  return (
    <div className={`min-h-screen w-full ${bgColor} ${textColor}`}>
      <div className="w-full h-full p-2 md:p-4 space-y-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Leaderboard</h1>
            <FaCrown className={isDark ? "text-yellow-400" : "text-yellow-500"} />
          </div>
        </div>

        <Tabs tabs={tabs} defaultTab="teams" />
      </div>
    </div>
  );
}
