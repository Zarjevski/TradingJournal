"use client";

import React, { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { FaArrowLeft, FaLock, FaCheckCircle } from "react-icons/fa";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useColorMode } from "@/context/ColorModeContext";

interface LessonClientProps {
  lesson: {
    id: string;
    title: string;
    body: string | null;
    videoUrl: string | null;
    courseTitle: string;
  };
  isSubscribed: boolean;
  isCompleted: boolean;
}

const LessonClient: React.FC<LessonClientProps> = ({
  lesson,
  isSubscribed,
  isCompleted: initialIsCompleted,
}) => {
  const { colorMode } = useColorMode();
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted);
  const [isMarking, setIsMarking] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleMarkComplete = async () => {
    setIsMarking(true);
    try {
      await axios.post(`/api/learn/lessons/${lesson.id}/complete`);
      setIsCompleted(true);
    } catch (error) {
      // no-op — button just stays clickable so the user can retry
    } finally {
      setIsMarking(false);
    }
  };

  const handleSubscribe = async () => {
    setIsRedirecting(true);
    try {
      const response = await axios.post("/api/checkout");
      window.location.href = response.data.url;
    } catch (error) {
      setIsRedirecting(false);
    }
  };

  const cardBg = "app-surface";
  const borderColor = colorMode === "light" ? "border-gray-200" : "border-gray-700";
  const mutedText = colorMode === "light" ? "text-gray-600" : "text-gray-400";

  return (
    <div className="min-h-screen w-full app-bg">
      <div className="w-full h-full p-4 sm:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-3xl mx-auto">
        <Link
          href="/learn"
          className={`inline-flex items-center gap-2 text-sm ${mutedText} hover:underline`}
        >
          <FaArrowLeft /> Back to all courses
        </Link>

        <Card className={`${cardBg} ${borderColor} border`}>
          <p className={`text-xs uppercase tracking-wide mb-1 ${mutedText}`}>
            {lesson.courseTitle}
          </p>
          <h1 className="text-2xl font-bold mb-4">{lesson.title}</h1>

          {isSubscribed && lesson.body !== null ? (
            <>
              {lesson.videoUrl && (
                <div className="mb-4 aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={lesson.videoUrl}
                    className="w-full h-full"
                    allowFullScreen
                    title={lesson.title}
                  />
                </div>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{lesson.body}</p>

              <div className="mt-6">
                <Button
                  variant={isCompleted ? "secondary" : "primary"}
                  leftIcon={<FaCheckCircle />}
                  disabled={isMarking || isCompleted}
                  onClick={handleMarkComplete}
                >
                  {isCompleted
                    ? "Completed"
                    : isMarking
                    ? "Saving..."
                    : "Mark as Complete"}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <FaLock className={`mx-auto text-3xl mb-3 ${mutedText}`} />
              <p className={`mb-4 ${mutedText}`}>
                Subscribe to unlock this lesson.
              </p>
              <Button disabled={isRedirecting} onClick={handleSubscribe}>
                {isRedirecting ? "Loading..." : "Subscribe to Unlock"}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default LessonClient;
