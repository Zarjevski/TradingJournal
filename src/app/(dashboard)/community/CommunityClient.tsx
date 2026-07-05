"use client";

import React from "react";
import { FaUsers } from "react-icons/fa";
import PageHeader from "@/components/ui/PageHeader";
import Tabs from "@/components/ui/Tabs";
import PeopleTab from "./PeopleTab";
import TeamsTab from "./TeamsTab";

export default function CommunityClient() {
  const tabs = [
    { id: "people", label: "People", content: <PeopleTab /> },
    { id: "teams", label: "Teams", content: <TeamsTab /> },
  ];

  return (
    <div className="min-h-screen w-full app-bg">
      <div className="w-full h-full p-4 sm:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-[1600px] mx-auto">
        <PageHeader
          title="Community"
          subtitle="Friends, teams, and leaderboards — all in one place"
          leading={<FaUsers className="h-6 w-6 text-zinc-400" />}
        />

        <Tabs tabs={tabs} defaultTab="people" />
      </div>
    </div>
  );
}
