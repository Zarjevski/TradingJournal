"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";

interface AcceptInviteClientProps {
  token: string;
}

export default function AcceptInviteClient({ token }: AcceptInviteClientProps) {
  const router = useRouter();
  const [invite, setInvite] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvite();
  }, [token]);

  const fetchInvite = async () => {
    try {
      const response = await axios.get(`/api/team-invites/${token}`);
      setInvite(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load invite");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      const response = await axios.post(`/api/team-invites/${token}`);
      router.push(`/team/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to accept invite");
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto">
          <Alert variant="error">{error || "Invite not found"}</Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <Card>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Team Invitation</h1>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">You've been invited to join:</p>
              <p className="text-xl font-semibold mt-1">{invite.team.name}</p>
            </div>
            {invite.team.description && (
              <p className="text-gray-600">{invite.team.description}</p>
            )}
            <div>
              <p className="text-sm text-gray-600">Role:</p>
              <p className="font-medium">{invite.role}</p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleAccept} isLoading={isAccepting} className="flex-1">
                Accept Invitation
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/team")}
                className="flex-1"
              >
                Decline
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
