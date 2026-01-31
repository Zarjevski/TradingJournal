/**
 * WebRTC helper utilities
 */

export interface PeerConnection {
  pc: RTCPeerConnection;
  userId: string;
}

/**
 * Create a new RTCPeerConnection with STUN configuration
 */
export function createPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  });
}

/**
 * Attach local media tracks to peer connection
 */
export function attachTracks(
  pc: RTCPeerConnection,
  stream: MediaStream
): void {
  stream.getTracks().forEach((track) => {
    pc.addTrack(track, stream);
  });
}

/**
 * Clean up peer connections and media tracks
 */
export function cleanupConnections(
  connections: Map<string, RTCPeerConnection>,
  localStream: MediaStream | null
): void {
  // Close all peer connections
  connections.forEach((pc) => {
    pc.close();
  });
  connections.clear();

  // Stop all local media tracks
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      track.stop();
    });
  }
}

/**
 * Get user media (camera + microphone)
 * Falls back to audio-only if video fails, then audio-only if both fail
 */
export async function getUserMedia(): Promise<MediaStream> {
  try {
    // First try: video + audio
    return await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user",
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
  } catch (videoError: any) {
    console.warn("Video + audio failed, trying audio only:", videoError);
    
    // Second try: audio only
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    } catch (audioError: any) {
      console.warn("Audio only failed, trying video only:", audioError);
      
      // Third try: video only
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: false,
        });
      } catch (videoOnlyError: any) {
        // All attempts failed
        console.error("All getUserMedia attempts failed:", {
          videoError,
          audioError,
          videoOnlyError,
        });
        throw videoOnlyError;
      }
    }
  }
}

/**
 * Check if media devices are available
 */
export async function checkMediaDevices(): Promise<{
  hasVideo: boolean;
  hasAudio: boolean;
}> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasVideo = devices.some((d) => d.kind === "videoinput");
    const hasAudio = devices.some((d) => d.kind === "audioinput");
    return { hasVideo, hasAudio };
  } catch (error) {
    console.error("Error checking media devices:", error);
    return { hasVideo: false, hasAudio: false };
  }
}

/**
 * Get display media (screen share)
 */
export async function getDisplayMedia(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false, // Audio sharing optional for now
    });
  } catch (error) {
    console.error("Error getting display media:", error);
    throw error;
  }
}

/**
 * Replace video track on all peer connections
 */
export function replaceVideoTrackForAllPeers(
  connections: Map<string, RTCPeerConnection>,
  newVideoTrack: MediaStreamTrack | null
): void {
  connections.forEach((pc) => {
    const senders = pc.getSenders();
    const videoSender = senders.find(
      (sender) => sender.track && sender.track.kind === "video"
    );

    if (videoSender) {
      videoSender.replaceTrack(newVideoTrack).catch((err) => {
        console.error("Error replacing video track:", err);
      });
    } else if (newVideoTrack) {
      // If no video sender exists, add the track
      pc.addTrack(newVideoTrack);
    }
  });
}

/**
 * Stop screen share and cleanup
 */
export function stopScreenShare(
  screenStream: MediaStream | null,
  screenTrack: MediaStreamTrack | null
): void {
  if (screenTrack) {
    screenTrack.stop();
  }
  if (screenStream) {
    screenStream.getTracks().forEach((track) => track.stop());
  }
}
