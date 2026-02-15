"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useColorMode } from "@/context/ColorModeContext";
import { useUserContext } from "@/context/UserContext";
import {
  createPeerConnection,
  attachTracks,
  cleanupConnections,
  getUserMedia,
  checkMediaDevices,
  getDisplayMedia,
  replaceVideoTrackForAllPeers,
  stopScreenShare,
} from "@/lib/webrtc";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import TVChart from "@/components/charts/TVChart";
import { computeRange, normalizeSymbolForBinance } from "@/lib/market";
import type { TVCandle, TVVolumeBar } from "@/components/charts/TVChart";
import {
  FaVideo,
  FaVideoSlash,
  FaMicrophone,
  FaMicrophoneSlash,
  FaSignOutAlt,
  FaDesktop,
  FaStop,
} from "react-icons/fa";

interface RoomClientProps {
  roomId: string;
  teamId: string;
  roomName: string;
  sharedSymbol?: string;
  sharedMarket?: string;
  sharedTf?: string;
}

interface Signal {
  id: string;
  senderID: string;
  targetID: string | null;
  type: "offer" | "answer" | "ice" | "join" | "leave" | "share_start" | "share_stop";
  payload: any;
  createdAt: string;
}

interface RemotePeer {
  userId: string;
  stream: MediaStream;
  pc: RTCPeerConnection;
  isSharing?: boolean;
}

export default function RoomClient({
  roomId,
  teamId,
  roomName,
  sharedSymbol: initialSharedSymbol,
  sharedMarket: initialSharedMarket,
  sharedTf: initialSharedTf,
}: RoomClientProps) {
  const router = useRouter();
  const { colorMode } = useColorMode();
  const { user } = useUserContext();
  const userId = user?.id;

  const [sharedSymbol, setSharedSymbol] = useState(initialSharedSymbol ?? "BTC");
  const [sharedTf, setSharedTf] = useState(initialSharedTf ?? "15m");
  const [chartCandles, setChartCandles] = useState<TVCandle[]>([]);
  const [chartVolume, setChartVolume] = useState<TVVolumeBar[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [chartSymbolInput, setChartSymbolInput] = useState(initialSharedSymbol ?? "BTC");
  const [isSavingChart, setIsSavingChart] = useState(false);

  // Media state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraVideoTrack, setCameraVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [screenTrack, setScreenTrack] = useState<MediaStreamTrack | null>(null);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [remotePeers, setRemotePeers] = useState<Map<string, RemotePeer>>(
    new Map()
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(true);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSignalTimeRef = useRef<Date>(new Date(0));
  const joinedUsersRef = useRef<Set<string>>(new Set());
  const remoteSharingStatusRef = useRef<Map<string, boolean>>(new Map());

  // Compute active video track (screen > camera > null)
  const activeVideoTrack = screenTrack || cameraVideoTrack || null;

  const fetchChart = () => {
    const symbol = normalizeSymbolForBinance(sharedSymbol);
    const { from, to } = computeRange("1W");
    setChartLoading(true);
    setChartError(null);
    fetch(
      `/api/market/candles?market=crypto&symbol=${encodeURIComponent(symbol)}&tf=${sharedTf}&from=${from}&to=${to}`
    )
      .then((res) => {
        if (!res.ok) return res.json().then((b) => Promise.reject(new Error(b.error ?? "Failed to fetch")));
        return res.json();
      })
      .then((data: Array<{ time: number; open: number; high: number; low: number; close: number; volume?: number }>) => {
        setChartCandles(data.map((c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })));
        setChartVolume(
          data.filter((c) => c.volume != null).map((c) => ({ time: c.time, value: c.volume! }))
        );
      })
      .catch((err) => {
        setChartError(err.message ?? "Failed to load chart");
        setChartCandles([]);
        setChartVolume([]);
      })
      .finally(() => setChartLoading(false));
  };

  useEffect(() => {
    if (!sharedSymbol?.trim()) return;
    fetchChart();
  }, [sharedSymbol, sharedTf]);

  const handleApplyChart = async () => {
    const sym = chartSymbolInput.trim() || "BTC";
    setSharedSymbol(sym);
    setIsSavingChart(true);
    try {
      await axios.patch(`/api/teams/${teamId}/rooms/${roomId}`, {
        sharedSymbol: normalizeSymbolForBinance(sym),
        sharedMarket: "crypto",
        sharedTf: sharedTf,
      });
      setSharedSymbol(sym);
      fetchChart();
    } catch {
      setChartError("Failed to save chart settings");
    } finally {
      setIsSavingChart(false);
    }
  };

  // Initialize media and join room
  useEffect(() => {
    if (!userId) return;

    const initialize = async () => {
      try {
        // Check if media devices are available
        const deviceCheck = await checkMediaDevices();
        
        // Allow joining even without camera/mic (for screen sharing only)
        if (!deviceCheck.hasVideo && !deviceCheck.hasAudio) {
          // Still allow joining, just won't have camera/mic
          console.warn("No camera or microphone found, but allowing join for screen sharing");
        }

        // Get user media (with fallbacks)
        let stream: MediaStream | null = null;
        try {
          stream = await getUserMedia();
        } catch (mediaError: any) {
          console.error("Error getting user media:", mediaError);
          
          // If no camera/mic, allow joining anyway (for screen sharing)
          if (
            mediaError.name === "NotFoundError" ||
            mediaError.name === "DevicesNotFoundError"
          ) {
            // No devices, but allow screen sharing
            console.log("No camera/mic devices, but screen sharing still available");
          } else if (mediaError.name === "NotAllowedError" || mediaError.name === "PermissionDeniedError") {
            setError("Camera/microphone access denied. You can still join and share your screen.");
          } else if (mediaError.name === "NotReadableError" || mediaError.name === "TrackStartError") {
            setError("Camera/microphone is already in use. You can still join and share your screen.");
          } else {
            // For other errors, still allow joining for screen sharing
            console.warn("Media error, but allowing join for screen sharing:", mediaError);
          }
        }

        if (stream) {
          setLocalStream(stream);
          
          // Extract camera video track
          const videoTracks = stream.getVideoTracks();
          if (videoTracks.length > 0) {
            setCameraVideoTrack(videoTracks[0]);
          }

          // Attach to local video element
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } else {
          // No camera/mic, but create empty stream for audio-only or screen sharing
          setLocalStream(new MediaStream());
        }

        // Send join signal
        await axios.post(`/api/rooms/${roomId}/signal`, {
          type: "join",
          payload: { userId },
        });

        // Start polling for signals
        startPolling();

        setIsJoining(false);
      } catch (err: any) {
        console.error("Error initializing room:", err);
        setError(
          err.response?.data?.error || 
          err.message || 
          "Failed to join room. Please try again."
        );
        setIsJoining(false);
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      handleLeave();
    };
  }, [userId, roomId]);

  // Handle screen share end (browser UI or track ended)
  useEffect(() => {
    if (screenTrack) {
      const handleEnded = () => {
        console.log("Screen share ended");
        stopScreenSharing();
      };

      screenTrack.addEventListener("ended", handleEnded);
      return () => {
        screenTrack.removeEventListener("ended", handleEnded);
      };
    }
  }, [screenTrack]);

  // Start polling for signals
  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const since = lastSignalTimeRef.current.toISOString();
        const response = await axios.get(
          `/api/rooms/${roomId}/signal?since=${since}`
        );
        const signals: Signal[] = response.data;

        for (const signal of signals) {
          await handleSignal(signal);
          const signalTime = new Date(signal.createdAt);
          if (signalTime > lastSignalTimeRef.current) {
            lastSignalTimeRef.current = signalTime;
          }
        }
      } catch (err) {
        console.error("Error polling signals:", err);
      }
    }, 1500);
  };

  // Handle incoming signal
  const handleSignal = async (signal: Signal) => {
    if (!userId) return;

    const { type, senderID, targetID, payload } = signal;

    // Ignore signals not meant for us (unless broadcast)
    if (targetID && targetID !== userId) return;

    switch (type) {
      case "join":
        if (senderID !== userId && !joinedUsersRef.current.has(senderID)) {
          joinedUsersRef.current.add(senderID);
          await createOffer(senderID);
        }
        break;

      case "leave":
        joinedUsersRef.current.delete(senderID);
        removePeer(senderID);
        break;

      case "offer":
        if (senderID !== userId) {
          await handleOffer(senderID, payload);
        }
        break;

      case "answer":
        if (senderID !== userId) {
          await handleAnswer(senderID, payload);
        }
        break;

      case "ice":
        if (senderID !== userId) {
          await handleICE(senderID, payload);
        }
        break;

      case "share_start":
        if (senderID !== userId) {
          remoteSharingStatusRef.current.set(senderID, true);
          updateRemoteSharingStatus(senderID, true);
        }
        break;

      case "share_stop":
        if (senderID !== userId) {
          remoteSharingStatusRef.current.set(senderID, false);
          updateRemoteSharingStatus(senderID, false);
        }
        break;
    }
  };

  // Update remote peer sharing status
  const updateRemoteSharingStatus = (remoteUserId: string, isSharing: boolean) => {
    setRemotePeers((prev) => {
      const newMap = new Map(prev);
      const peer = newMap.get(remoteUserId);
      if (peer) {
        newMap.set(remoteUserId, { ...peer, isSharing });
      }
      return newMap;
    });
  };

  // Create offer for a new peer
  const createOffer = async (remoteUserId: string) => {
    if (!userId) return;

    try {
      const pc = createPeerConnection();
      peerConnectionsRef.current.set(remoteUserId, pc);

      // Add local tracks (use active video track)
      if (localStream) {
        // Add audio tracks
        localStream.getAudioTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });

        // Add active video track (screen or camera)
        if (activeVideoTrack) {
          pc.addTrack(activeVideoTrack, localStream);
        }
      }

      // Handle remote stream
      pc.ontrack = (event) => {
        const stream = event.streams[0];
        setRemotePeers((prev) => {
          const newMap = new Map(prev);
          const existingPeer = prev.get(remoteUserId);
          newMap.set(remoteUserId, {
            userId: remoteUserId,
            stream,
            pc,
            isSharing: existingPeer?.isSharing || remoteSharingStatusRef.current.get(remoteUserId) || false,
          });
          return newMap;
        });
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          axios.post(`/api/rooms/${roomId}/signal`, {
            type: "ice",
            targetID: remoteUserId,
            payload: event.candidate,
          });
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected" ||
          pc.connectionState === "closed"
        ) {
          removePeer(remoteUserId);
        }
      };

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer
      await axios.post(`/api/rooms/${roomId}/signal`, {
        type: "offer",
        targetID: remoteUserId,
        payload: offer,
      });
    } catch (err) {
      console.error("Error creating offer:", err);
    }
  };

  // Handle incoming offer
  const handleOffer = async (remoteUserId: string, offer: RTCSessionDescriptionInit) => {
    if (!userId) return;

    try {
      let pc = peerConnectionsRef.current.get(remoteUserId);

      if (!pc) {
        pc = createPeerConnection();
        peerConnectionsRef.current.set(remoteUserId, pc);
        const connection = pc;

        // Add local tracks (use active video track)
        if (localStream) {
          // Add audio tracks
          localStream.getAudioTracks().forEach((track) => {
            connection.addTrack(track, localStream);
          });

          // Add active video track (screen or camera)
          if (activeVideoTrack) {
            connection.addTrack(activeVideoTrack, localStream);
          }
        }

        // Handle remote stream
        connection.ontrack = (event) => {
          const stream = event.streams[0];
          setRemotePeers((prev) => {
            const newMap = new Map(prev);
            const existingPeer = prev.get(remoteUserId);
            newMap.set(remoteUserId, {
              userId: remoteUserId,
              stream,
              pc: connection,
              isSharing: existingPeer?.isSharing || remoteSharingStatusRef.current.get(remoteUserId) || false,
            });
            return newMap;
          });
        };

        // Handle ICE candidates
        connection.onicecandidate = (event) => {
          if (event.candidate) {
            axios.post(`/api/rooms/${roomId}/signal`, {
              type: "ice",
              targetID: remoteUserId,
              payload: event.candidate,
            });
          }
        };

        // Handle connection state changes
        connection.onconnectionstatechange = () => {
          if (
            connection.connectionState === "failed" ||
            connection.connectionState === "disconnected" ||
            connection.connectionState === "closed"
          ) {
            removePeer(remoteUserId);
          }
        };
      }

      const conn = peerConnectionsRef.current.get(remoteUserId);
      if (!conn) return;

      // Only set remote offer when in "stable" (avoid duplicate/stale offers).
      if (conn.signalingState !== "stable") {
        return;
      }
      await conn.setRemoteDescription(new RTCSessionDescription(offer));

      // Create answer
      const answer = await conn.createAnswer();
      await conn.setLocalDescription(answer);

      // Send answer
      await axios.post(`/api/rooms/${roomId}/signal`, {
        type: "answer",
        targetID: remoteUserId,
        payload: answer,
      });
    } catch (err) {
      console.error("Error handling offer:", err);
    }
  };

  // Handle incoming answer (only set when we're the offerer waiting for an answer)
  const handleAnswer = async (remoteUserId: string, answer: RTCSessionDescriptionInit) => {
    const pc = peerConnectionsRef.current.get(remoteUserId);
    if (!pc) return;

    // Only set remote answer when in "have-local-offer". Ignore if already stable (duplicate/stale answer).
    if (pc.signalingState !== "have-local-offer") {
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (err) {
      console.error("Error handling answer:", err);
    }
  };

  // Handle ICE candidate
  const handleICE = async (remoteUserId: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionsRef.current.get(remoteUserId);
    if (!pc || pc.signalingState === "closed") return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("Error handling ICE candidate:", err);
    }
  };

  // Remove peer
  const removePeer = (remoteUserId: string) => {
    const pc = peerConnectionsRef.current.get(remoteUserId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(remoteUserId);
    }

    remoteSharingStatusRef.current.delete(remoteUserId);
    setRemotePeers((prev) => {
      const newMap = new Map(prev);
      newMap.delete(remoteUserId);
      return newMap;
    });
  };

  // Start screen sharing
  const startScreenSharing = async () => {
    try {
      // Get display media
      const displayStream = await getDisplayMedia();
      const displayVideoTrack = displayStream.getVideoTracks()[0];

      if (!displayVideoTrack) {
        throw new Error("No video track in display stream");
      }

      setScreenStream(displayStream);
      setScreenTrack(displayVideoTrack);
      setIsSharingScreen(true);

      // Replace video track on all peer connections
      replaceVideoTrackForAllPeers(peerConnectionsRef.current, displayVideoTrack);

      // Update local video preview
      if (localVideoRef.current) {
        const newStream = new MediaStream();
        // Keep audio from original stream
        if (localStream) {
          localStream.getAudioTracks().forEach((track) => {
            newStream.addTrack(track);
          });
        }
        // Add screen video track
        newStream.addTrack(displayVideoTrack);
        localVideoRef.current.srcObject = newStream;
      }

      // Send share_start signal
      await axios.post(`/api/rooms/${roomId}/signal`, {
        type: "share_start",
        payload: { userId },
      });
    } catch (err: any) {
      console.error("Error starting screen share:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Screen sharing permission denied. Please allow screen sharing and try again.");
      } else if (err.name === "AbortError" || err.name === "NotAllowedError") {
        // User canceled, no error needed
        console.log("Screen sharing canceled by user");
      } else {
        setError(`Failed to start screen sharing: ${err.message || "Unknown error"}`);
      }
    }
  };

  // Stop screen sharing
  const stopScreenSharing = async () => {
    try {
      // Stop screen share tracks
      stopScreenShare(screenStream, screenTrack);

      // Revert to camera video track (or null if no camera)
      replaceVideoTrackForAllPeers(peerConnectionsRef.current, cameraVideoTrack);

      // Update local video preview
      if (localVideoRef.current) {
        if (localStream && localStream.getVideoTracks().length > 0) {
          localVideoRef.current.srcObject = localStream;
        } else {
          // No camera, show black or placeholder
          localVideoRef.current.srcObject = null;
        }
      }

      setScreenStream(null);
      setScreenTrack(null);
      setIsSharingScreen(false);

      // Send share_stop signal
      await axios.post(`/api/rooms/${roomId}/signal`, {
        type: "share_stop",
        payload: { userId },
      });
    } catch (err) {
      console.error("Error stopping screen share:", err);
    }
  };

  // Toggle microphone
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoDisabled;
      });
      setIsVideoDisabled(!isVideoDisabled);
    }
  };

  // Leave room
  const handleLeave = async () => {
    // Stop polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Stop screen sharing if active
    if (isSharingScreen) {
      stopScreenShare(screenStream, screenTrack);
    }

    // Send leave signal
    if (userId) {
      try {
        await axios.post(`/api/rooms/${roomId}/signal`, {
          type: "leave",
          payload: { userId },
        });
      } catch (err) {
        console.error("Error sending leave signal:", err);
      }
    }

    // Cleanup connections
    cleanupConnections(peerConnectionsRef.current, localStream);

    // Navigate back
    router.push(`/team/${teamId}`);
  };

  const bgColor = "app-bg";
  const textColor = colorMode === "light" ? "text-gray-900" : "text-gray-100";
  const cardBg = "app-surface";
  const borderColor = colorMode === "light" ? "border-gray-200" : "border-gray-700";

  if (isJoining) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgColor} ${textColor}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Joining room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgColor} ${textColor}`}>
        <div className={`${cardBg} ${borderColor} border rounded-lg p-6 max-w-md`}>
          <h2 className="text-xl font-semibold mb-4">Error</h2>
          <p className="mb-4 text-sm">{error}</p>
          <div className="flex gap-2">
            <Button 
              onClick={async () => {
                setError(null);
                setIsJoining(true);
                // Retry initialization
                try {
                  const stream = await getUserMedia();
                  setLocalStream(stream);
                  const videoTracks = stream.getVideoTracks();
                  if (videoTracks.length > 0) {
                    setCameraVideoTrack(videoTracks[0]);
                  }
                  if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                  }
                  await axios.post(`/api/rooms/${roomId}/signal`, {
                    type: "join",
                    payload: { userId },
                  });
                  startPolling();
                  setIsJoining(false);
                } catch (err: any) {
                  setError(err.message || "Failed to join room");
                  setIsJoining(false);
                }
              }}
            >
              Retry
            </Button>
            <Button variant="outline" onClick={() => router.push(`/team/${teamId}`)}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const allPeers = Array.from(remotePeers.values());
  const totalParticipants = 1 + allPeers.length; // Local + remotes

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} p-4`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Videos + Controls */}
        <div className="lg:col-span-2 space-y-4">
        {/* Header */}
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{roomName}</h1>
            <p className="text-sm opacity-75">
              {totalParticipants} participant{totalParticipants !== 1 ? "s" : ""}
            </p>
          </div>
          <Button variant="danger" onClick={handleLeave} leftIcon={<FaSignOutAlt />}>
            Leave Room
          </Button>
        </div>

        {/* Video Grid */}
        <div
          className={`grid gap-4 mb-4 ${
            totalParticipants === 1
              ? "grid-cols-1"
              : totalParticipants === 2
              ? "grid-cols-1 md:grid-cols-2"
              : totalParticipants <= 4
              ? "grid-cols-1 md:grid-cols-2"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {/* Local Video */}
          <div className={`${cardBg} ${borderColor} border rounded-lg overflow-hidden relative`}>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover aspect-video"
            />
            <div className="absolute bottom-2 left-2 flex items-center gap-2">
              <div className={`px-2 py-1 rounded text-sm ${
                colorMode === "light" 
                  ? "bg-black/50 text-white" 
                  : "bg-black/70 text-white"
              }`}>
                You {isMuted && "🔇"} {isVideoDisabled && !isSharingScreen && "📷❌"}
              </div>
              {isSharingScreen && (
                <Badge variant="info" size="sm" className={
                  colorMode === "light" ? "bg-blue-600 text-white" : "bg-purple-600 text-white"
                }>
                  Sharing
                </Badge>
              )}
            </div>
          </div>

          {/* Remote Videos */}
          {allPeers.map((peer) => (
            <RemoteVideo
              key={peer.userId}
              stream={peer.stream}
              userId={peer.userId}
              isSharing={peer.isSharing || false}
              cardBg={cardBg}
              borderColor={borderColor}
            />
          ))}
        </div>

        {/* Controls */}
        <div className={`${cardBg} ${borderColor} border rounded-lg p-4 flex justify-center gap-4 flex-wrap`}>
          <Button
            variant={isMuted ? "danger" : "secondary"}
            onClick={toggleMute}
            leftIcon={isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
          >
            {isMuted ? "Unmute" : "Mute"}
          </Button>
          <Button
            variant={isVideoDisabled ? "danger" : "secondary"}
            onClick={toggleVideo}
            leftIcon={isVideoDisabled ? <FaVideoSlash /> : <FaVideo />}
            disabled={isSharingScreen}
          >
            {isVideoDisabled ? "Enable Camera" : "Disable Camera"}
          </Button>
          {!isSharingScreen ? (
            <Button
              variant="secondary"
              onClick={startScreenSharing}
              leftIcon={<FaDesktop />}
            >
              Share Screen
            </Button>
          ) : (
            <Button
              variant="danger"
              onClick={stopScreenSharing}
              leftIcon={<FaStop />}
            >
              Stop Sharing
            </Button>
          )}
        </div>
        </div>

        {/* Right: Shared Chart */}
        <div className={`${cardBg} ${borderColor} border rounded-lg p-4 h-fit`}>
          <h2 className="text-lg font-semibold mb-3">Shared Chart</h2>
          <div className="space-y-3 mb-3">
            <div>
              <label className={`block text-sm font-medium mb-1 ${colorMode === "light" ? "text-gray-700" : "text-gray-300"}`}>
                Symbol
              </label>
              <input
                type="text"
                value={chartSymbolInput}
                onChange={(e) => setChartSymbolInput(e.target.value)}
                placeholder="e.g. BTC or BTCUSDT"
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  colorMode === "light"
                    ? "bg-white border-gray-300 text-gray-900"
                    : "bg-gray-800 border-gray-600 text-gray-100"
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${colorMode === "light" ? "text-gray-700" : "text-gray-300"}`}>
                Timeframe
              </label>
              <select
                value={sharedTf}
                onChange={(e) => setSharedTf(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  colorMode === "light"
                    ? "bg-white border-gray-300 text-gray-900"
                    : "bg-gray-800 border-gray-600 text-gray-100"
                }`}
              >
                <option value="1m">1m</option>
                <option value="5m">5m</option>
                <option value="15m">15m</option>
                <option value="1h">1h</option>
                <option value="4h">4h</option>
                <option value="1d">1d</option>
              </select>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApplyChart}
              disabled={isSavingChart}
              className="w-full"
            >
              {isSavingChart ? "Saving…" : "Apply"}
            </Button>
          </div>
          {chartError && <p className="text-sm text-red-500 mb-2">{chartError}</p>}
          <TVChart
            candles={chartCandles}
            volume={chartVolume}
            height={360}
            loading={chartLoading}
          />
        </div>
      </div>
    </div>
  );
}

// Remote video component
function RemoteVideo({
  stream,
  userId,
  isSharing,
  cardBg,
  borderColor,
}: {
  stream: MediaStream;
  userId: string;
  isSharing: boolean;
  cardBg: string;
  borderColor: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { colorMode } = useColorMode();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`${cardBg} ${borderColor} border rounded-lg overflow-hidden relative`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover aspect-video"
      />
      <div className="absolute bottom-2 left-2 flex items-center gap-2">
        <div className={`px-2 py-1 rounded text-sm ${
          colorMode === "light" 
            ? "bg-black/50 text-white" 
            : "bg-black/70 text-white"
        }`}>
          User {userId.slice(0, 8)}
        </div>
        {isSharing && (
          <Badge variant="info" size="sm" className={
            colorMode === "light" ? "bg-blue-600 text-white" : "bg-purple-600 text-white"
          }>
            Sharing
          </Badge>
        )}
      </div>
    </div>
  );
}
