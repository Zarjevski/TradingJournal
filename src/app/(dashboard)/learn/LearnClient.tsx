"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/ui/EmptyState";
import { useColorMode } from "@/context/ColorModeContext";

interface LessonSummary {
  id: string;
  title: string;
  order: number;
}

interface CourseSummary {
  id: string;
  title: string;
  description: string | null;
  order: number;
  createdAt: string;
  lessons: LessonSummary[];
}

interface LearnClientProps {
  courses: CourseSummary[];
  isSubscribed: boolean;
}

const LearnClient: React.FC<LearnClientProps> = ({ courses, isSubscribed }) => {
  const { colorMode } = useColorMode();
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get("checkout");
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSubscribe = async () => {
    setIsRedirecting(true);
    try {
      const response = await axios.post("/api/checkout");
      window.location.href = response.data.url;
    } catch (error) {
      setIsRedirecting(false);
    }
  };

  const handleManageBilling = async () => {
    setIsRedirecting(true);
    try {
      const response = await axios.post("/api/billing");
      window.location.href = response.data.url;
    } catch (error) {
      setIsRedirecting(false);
    }
  };

  const bgColor = "app-bg";
  const cardBg = "app-surface";
  const borderColor = colorMode === "light" ? "border-gray-200" : "border-gray-700";

  return (
    <div className={`min-h-screen w-full ${bgColor}`}>
      <div className="w-full h-full p-4 sm:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <h1 className="text-2xl xs:text-3xl md:text-4xl font-bold">Learn</h1>
          {isSubscribed ? (
            <Button variant="secondary" disabled={isRedirecting} onClick={handleManageBilling}>
              {isRedirecting ? "Loading..." : "Manage Subscription"}
            </Button>
          ) : (
            <Button disabled={isRedirecting} onClick={handleSubscribe}>
              {isRedirecting ? "Loading..." : "Subscribe to Unlock All Lessons"}
            </Button>
          )}
        </div>

        {checkoutStatus === "success" && (
          <Alert variant="success" title="Subscription active">
            You&apos;re all set — every lesson below is now unlocked.
          </Alert>
        )}
        {checkoutStatus === "canceled" && (
          <Alert variant="info" title="Checkout canceled">
            No charge was made. You can subscribe any time.
          </Alert>
        )}

        {!isSubscribed && (
          <Card className={`${cardBg} ${borderColor} border`}>
            <p className={colorMode === "light" ? "text-gray-700" : "text-gray-300"}>
              Course and lesson titles are free to browse. Subscribe to unlock full lesson
              content.
            </p>
          </Card>
        )}

        {courses.length === 0 ? (
          <Card className={`${cardBg} ${borderColor} border`}>
            <EmptyState
              title="No courses yet"
              message="Check back soon — lessons are on the way."
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <Card key={course.id} className={`${cardBg} ${borderColor} border`}>
                <h2 className="text-xl font-semibold mb-1">{course.title}</h2>
                {course.description && (
                  <p
                    className={`text-sm mb-4 ${
                      colorMode === "light" ? "text-gray-600" : "text-gray-400"
                    }`}
                  >
                    {course.description}
                  </p>
                )}
                {course.lessons.length === 0 ? (
                  <p className={`text-sm ${colorMode === "light" ? "text-gray-500" : "text-gray-400"}`}>
                    No lessons in this course yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {course.lessons.map((lesson, index) => (
                      <li key={lesson.id}>
                        <Link
                          href={`/learn/${lesson.id}`}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            colorMode === "light"
                              ? "border-gray-200 hover:bg-zinc-50"
                              : "border-gray-700 hover:bg-zinc-700/50"
                          }`}
                        >
                          <span
                            className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                              colorMode === "light"
                                ? "bg-zinc-200 text-zinc-800"
                                : "bg-zinc-700 text-zinc-200"
                            }`}
                          >
                            {index + 1}
                          </span>
                          <span>{lesson.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnClient;
