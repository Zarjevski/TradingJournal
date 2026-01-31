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
import { FaPlus, FaUsers, FaComments } from "react-icons/fa";

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

export default function TeamsClient() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const { colorMode } = useColorMode();
  const bgColor = colorMode === "light" ? "bg-gray-50" : "bg-gray-900";
  const textColor = colorMode === "light" ? "text-gray-900" : "text-gray-100";
  const cardBg = colorMode === "light" ? "bg-white" : "bg-gray-800";
  const borderColor = colorMode === "light" ? "border-gray-200" : "border-gray-700";

  return (
    <div className={`min-h-screen w-full ${bgColor} ${textColor}`}>
      <div className="w-full h-full p-2 md:p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Teams</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
