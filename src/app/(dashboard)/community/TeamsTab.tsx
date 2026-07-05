"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import Alert from "@/components/ui/Alert";
import { useColorMode } from "@/context/ColorModeContext";
import { FaPlus, FaUsers, FaComments, FaEnvelope } from "react-icons/fa";

type SubTab = "myTeams" | "leaderboard";

interface Team {
  id: string;
  name: string;
  description: string | null;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  _count: {
    members: number;
    messages: number;
  };
  createdAt: string;
}

interface PendingInvite {
  token: string;
  role: string;
  team: { id: string; name: string; description: string | null };
}

interface TeamLeaderboardEntry {
  id: string;
  name: string;
  description: string | null;
  imageURL?: string | null;
  membersCount: number;
  totalPnL: number;
  tradesShared: number;
}

export default function TeamsTab() {
  const router = useRouter();
  const { colorMode } = useColorMode();
  const [subTab, setSubTab] = useState<SubTab>("myTeams");

  const [teams, setTeams] = useState<Team[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [pendingInvitesLoaded, setPendingInvitesLoaded] = useState(false);
  const [pendingInvitesError, setPendingInvitesError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<TeamLeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  const fetchPendingInvites = useCallback(async () => {
    setPendingInvitesError(null);
    try {
      const response = await axios.get("/api/team-invites/mine");
      setPendingInvites(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      const msg = err.response?.status === 401 ? null : (err.response?.data?.error || "Couldn't load invitations");
      setPendingInvitesError(msg || null);
      setPendingInvites([]);
    } finally {
      setPendingInvitesLoaded(true);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/teams");
      setTeams(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load teams");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    setLeaderboardError(null);
    try {
      const res = await axios.get<TeamLeaderboardEntry[]>("/api/teams/leaderboard");
      setLeaderboard(res.data || []);
    } catch (err: any) {
      setLeaderboardError(err.response?.data?.error || "Failed to load teams leaderboard");
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
    fetchPendingInvites();
    fetchLeaderboard();
  }, [fetchTeams, fetchPendingInvites, fetchLeaderboard]);

  const cardBg = "app-surface";
  const borderColor = colorMode === "light" ? "border-zinc-200" : "border-zinc-800";
  const muted = colorMode === "light" ? "text-gray-600" : "text-gray-400";
  const tabActive = colorMode === "light" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-900";
  const tabInactive = colorMode === "light" ? "text-gray-600 hover:bg-zinc-100" : "text-gray-400 hover:bg-zinc-800";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className={`inline-flex rounded-lg border p-1 ${borderColor} ${colorMode === "light" ? "bg-white" : "bg-zinc-900"}`}>
          <button
            type="button"
            onClick={() => setSubTab("myTeams")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${subTab === "myTeams" ? tabActive : tabInactive}`}
          >
            My Teams
          </button>
          <button
            type="button"
            onClick={() => setSubTab("leaderboard")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${subTab === "leaderboard" ? tabActive : tabInactive}`}
          >
            Leaderboard
          </button>
        </div>
        <Button leftIcon={<FaPlus />} onClick={() => router.push("/community/teams/new")}>
          Create Team
        </Button>
      </div>

      {subTab === "myTeams" ? (
        <>
          {error && <Alert variant="error">{error}</Alert>}

          {pendingInvitesLoaded && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FaEnvelope className="text-amber-500" />
                Pending invitations
              </h2>
              {pendingInvitesError ? (
                <div className={`p-3 rounded-lg text-sm ${colorMode === "light" ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-amber-900/20 text-amber-200 border border-amber-700"}`}>
                  {pendingInvitesError}
                  <Button variant="outline" size="sm" className="mt-2" onClick={fetchPendingInvites}>
                    Retry
                  </Button>
                </div>
              ) : pendingInvites.length > 0 ? (
                <div className="space-y-3">
                  {pendingInvites.map((inv) => (
                    <Card key={inv.token} className={`flex flex-wrap items-center justify-between gap-3 ${cardBg} ${borderColor} border`}>
                      <div className="min-w-0">
                        <h3 className="font-semibold">{inv.team.name}</h3>
                        {inv.team.description && <p className={`text-sm mt-0.5 ${muted}`}>{inv.team.description}</p>}
                        <p className={`text-xs mt-1 ${muted}`}>Role: {inv.role}</p>
                      </div>
                      <Button onClick={() => router.push(`/community/teams/invite/${inv.token}`)} variant="outline">
                        View invitation
                      </Button>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className={`text-sm ${muted}`}>No pending invitations.</p>
              )}
            </section>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : teams.length === 0 ? (
            <EmptyState
              title="No teams yet"
              message="Create your first team to start collaborating with other traders."
              action={<Button onClick={() => router.push("/community/teams/new")}>Create Team</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <div key={team.id} onClick={() => router.push(`/community/teams/${team.id}`)}>
                  <Card className={`cursor-pointer hover:shadow-lg transition-shadow ${cardBg} ${borderColor} border`}>
                    <h3 className="text-lg font-semibold mb-2">{team.name}</h3>
                    {team.description && <p className={`mb-4 text-sm ${muted}`}>{team.description}</p>}
                    <div className={`flex items-center gap-4 text-sm ${muted}`}>
                      <div className="flex items-center gap-1">
                        <FaUsers />
                        <span>{team._count.members} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaComments />
                        <span>{team._count.messages} messages</span>
                      </div>
                    </div>
                    <div className={`mt-4 pt-4 border-t ${borderColor}`}>
                      <p className={`text-xs ${muted}`}>Owner: {team.owner.firstName} {team.owner.lastName}</p>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </>
      ) : leaderboardError ? (
        <Alert variant="error">{leaderboardError}</Alert>
      ) : leaderboardLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : leaderboard.length === 0 ? (
        <Card className={`${cardBg} ${borderColor} border`}>
          <div className="p-6 text-center">
            <p className={muted}>
              No teams with shared trades yet. Start sharing trades in your team rooms to appear on the leaderboard.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((team, index) => (
            <div
              key={team.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/community/teams/${team.id}`)}
              onKeyDown={(e) => e.key === "Enter" && router.push(`/community/teams/${team.id}`)}
              className="cursor-pointer"
            >
              <Card className={`${cardBg} ${borderColor} border hover:shadow-lg transition-shadow`}>
                <div className="p-4 sm:p-5 grid grid-cols-[auto,1fr] sm:grid-cols-[auto,1fr,auto] gap-3 sm:gap-4 items-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
                    {index === 0 && <Badge variant="info" size="sm">Top</Badge>}
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="flex-shrink-0">
                      {team.imageURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={team.imageURL} alt={team.name} className={`w-12 h-12 rounded-lg object-cover border ${borderColor}`} />
                      ) : (
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-semibold ${colorMode === "light" ? "bg-zinc-800" : "bg-zinc-600"}`}>
                          {team.name[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base sm:text-lg font-semibold truncate">{team.name}</h2>
                      {team.description && <p className={`mt-1 text-xs sm:text-sm ${muted}`}>{team.description}</p>}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs sm:text-sm">
                        <Badge variant="default" size="sm">{team.membersCount} members</Badge>
                        <Badge variant="info" size="sm">{team.tradesShared} shared trades</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1 sm:justify-self-end text-left sm:text-right">
                    <p className="text-[11px] sm:text-xs uppercase tracking-wide mb-1 text-gray-500">Total P&L</p>
                    <p className={`text-base sm:text-lg font-bold ${team.totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {team.totalPnL >= 0 ? "+" : "-"}${Math.abs(team.totalPnL).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
