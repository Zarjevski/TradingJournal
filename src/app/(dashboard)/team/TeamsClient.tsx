"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import { useColorMode } from "@/context/ColorModeContext";
import { FaPlus, FaUsers, FaComments, FaEnvelope } from "react-icons/fa";

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

export default function TeamsClient() {
  const router = useRouter();
  const { colorMode } = useColorMode();
  const [teams, setTeams] = useState<Team[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [pendingInvitesLoaded, setPendingInvitesLoaded] = useState(false);
  const [pendingInvitesError, setPendingInvitesError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingInvites = React.useCallback(async () => {
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

  useEffect(() => {
    fetchTeams();
    fetchPendingInvites();
  }, [fetchPendingInvites]);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/teams");
      setTeams(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load teams");
    } finally {
      setIsLoading(false);
    }
  };

  const bgColor = "app-bg";
  const textColor = colorMode === "light" ? "text-gray-900" : "text-gray-100";
  const cardBg = "app-surface";
  const borderColor = colorMode === "light" ? "border-gray-200" : "border-gray-700";

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgColor} ${textColor}`}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full ${bgColor} ${textColor}`}>
      <div className="w-full h-full p-2 md:p-4 space-y-4">
        <div className="flex justify-between items-center mb-2 md:mb-4 gap-3 flex-wrap">
          <h1 className="text-2xl xs:text-3xl font-bold">My Teams</h1>
          <Button onClick={() => router.push("/team/new")}>
            <FaPlus className="mr-2" />
            Create Team
          </Button>
        </div>

        {error && (
          <div className={`mb-4 p-4 border rounded-lg ${
            colorMode === "light" 
              ? "bg-red-50 border-red-200 text-red-800" 
              : "bg-red-900/30 border-red-700 text-red-200"
          }`}>
            {error}
          </div>
        )}

        {pendingInvitesLoaded && (
          <section className="mb-8">
            <h2 className={`text-xl font-semibold mb-3 flex items-center gap-2 ${textColor}`}>
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
              <>
                <p className={`text-sm mb-4 ${colorMode === "light" ? "text-gray-600" : "text-gray-400"}`}>
                  You have been invited to join these teams. Open an invitation to accept or decline.
                </p>
                <div className="space-y-3">
                  {pendingInvites.map((inv) => (
                    <Card
                      key={inv.token}
                      className={`flex flex-wrap items-center justify-between gap-3 ${cardBg} ${borderColor} border`}
                    >
                      <div className="min-w-0">
                        <h3 className={`font-semibold ${textColor}`}>{inv.team.name}</h3>
                        {inv.team.description && (
                          <p className={`text-sm mt-0.5 ${colorMode === "light" ? "text-gray-600" : "text-gray-400"}`}>
                            {inv.team.description}
                          </p>
                        )}
                        <p className={`text-xs mt-1 ${colorMode === "light" ? "text-gray-500" : "text-gray-500"}`}>
                          Role: {inv.role}
                        </p>
                      </div>
                      <Button
                        onClick={() => router.push(`/team/invite/${inv.token}`)}
                        variant="outline"
                      >
                        View invitation
                      </Button>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <p className={`text-sm ${colorMode === "light" ? "text-gray-500" : "text-gray-400"}`}>
                  No pending invitations.
                </p>
                <p className={`text-xs ${colorMode === "light" ? "text-gray-500" : "text-gray-400"}`}>
                  If someone invited you, ask them for the invite link and open it while logged in with this account. Or{" "}
                  <a
                    href="/api/team-invites/mine?debug=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    open diagnostic
                  </a>{" "}
                  to see why invites might not match.
                </p>
              </div>
            )}
          </section>
        )}

        {teams.length === 0 ? (
          <EmptyState
            title="No teams yet"
            message="Create your first team to start collaborating with other traders."
            action={
              <Button onClick={() => router.push("/team/new")}>
                Create Team
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <div
                key={team.id}
                onClick={() => router.push(`/team/${team.id}`)}
              >
                <Card className={`cursor-pointer hover:shadow-lg transition-shadow ${cardBg} ${borderColor} border`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`text-xl font-semibold ${textColor}`}>{team.name}</h3>
                </div>
                {team.description && (
                  <p className={`mb-4 ${colorMode === "light" ? "text-gray-600" : "text-gray-400"}`}>{team.description}</p>
                )}
                <div className={`flex items-center gap-4 text-sm ${colorMode === "light" ? "text-gray-500" : "text-gray-400"}`}>
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
                  <p className={`text-xs ${colorMode === "light" ? "text-gray-500" : "text-gray-400"}`}>
                    Owner: {team.owner.firstName} {team.owner.lastName}
                  </p>
                </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
