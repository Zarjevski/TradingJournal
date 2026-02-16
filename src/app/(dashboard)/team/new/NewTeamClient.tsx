"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";

export default function NewTeamClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.length < 2 || name.length > 40) {
      setError("Team name must be between 2 and 40 characters");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post("/api/teams", {
        name: name.trim(),
        description: description.trim() || null,
      });
      router.push(`/team/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create team");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen app-bg p-3 md:p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl xs:text-3xl font-bold mb-4 md:mb-6">Create New Team</h1>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="error">{error}</Alert>}
            
            <Input
              label="Team Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name"
              required
              maxLength={40}
            />

            <Textarea
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter team description"
              rows={4}
              maxLength={500}
            />

            <div className="flex gap-4">
              <Button type="submit" isLoading={isLoading}>
                Create Team
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
