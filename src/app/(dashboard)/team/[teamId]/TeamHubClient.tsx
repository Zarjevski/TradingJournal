"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Tabs from "@/components/ui/Tabs";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Table from "@/components/ui/Table";
import { useColorMode } from "@/context/ColorModeContext";
import { FaShare, FaTrash, FaCrown, FaShieldAlt, FaUser, FaCamera, FaTimes, FaEdit } from "react-icons/fa";

interface TeamHubClientProps {
  teamId: string;
}

export default function TeamHubClient({ teamId }: TeamHubClientProps) {
  const router = useRouter();
  const { colorMode } = useColorMode();
  const [team, setTeam] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const bgColor = "app-bg";
  const textColor = colorMode === "light" ? "text-gray-900" : "text-gray-100";

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  const fetchTeam = async () => {
    try {
      setIsLoading(true);
      const [teamResponse, membersResponse, userResponse] = await Promise.all([
        axios.get(`/api/teams/${teamId}`),
        axios.get(`/api/teams/${teamId}/members`),
        axios.get("/api/user"),
      ]);
      
      setTeam(teamResponse.data);
      
      // Find current user's role
      const currentMember = membersResponse.data.find(
        (m: any) => m.user.id === userResponse.data.id
      );
      if (currentMember) {
        setCurrentUserRole(currentMember.role);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load team");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = () => {
    setIsImageModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      alert("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "team");

      const response = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.url) {
        await axios.patch(`/api/teams/${teamId}`, { imageURL: response.data.url });
        await fetchTeam();
        setIsImageModalOpen(false);
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      alert(error.response?.data?.error || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      await axios.patch(`/api/teams/${teamId}`, { imageURL: null });
      await fetchTeam();
      setIsImageModalOpen(false);
    } catch (error) {
      console.error("Error removing image:", error);
      alert("Failed to remove image");
    }
  };

  const handleEditClick = () => {
    if (team) {
      setEditName(team.name);
      setEditDescription(team.description || "");
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || editName.trim().length < 2 || editName.trim().length > 40) {
      alert("Team name must be between 2 and 40 characters");
      return;
    }

    try {
      setIsSaving(true);
      await axios.patch(`/api/teams/${teamId}`, {
        name: editName.trim(),
        description: editDescription.trim() || null,
      });
      await fetchTeam();
      setIsEditModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update team details");
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgColor} ${textColor}`}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className={`min-h-screen p-3 md:p-6 lg:p-8 ${bgColor} ${textColor}`}>
        <Alert variant="error">{error || "Team not found"}</Alert>
      </div>
    );
  }

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      content: <OverviewTab teamId={teamId} />,
    },
    {
      id: "chat",
      label: "Chat",
      content: <ChatTab teamId={teamId} />,
    },
    {
      id: "trades",
      label: "Trades",
      content: <TradesTab teamId={teamId} />,
    },
    {
      id: "leaderboard",
      label: "Leaderboard",
      content: <LeaderboardTab teamId={teamId} />,
    },
    {
      id: "rooms",
      label: "Rooms",
      content: <RoomsTab teamId={teamId} />,
    },
    {
      id: "members",
      label: "Members",
      content: <MembersTab teamId={teamId} onUpdate={fetchTeam} />,
    },
  ];

  const borderColor = colorMode === "light" ? "border-gray-300" : "border-gray-600";

  return (
    <div className={`min-h-screen w-full ${bgColor} ${textColor}`}>
      <div className="w-full h-full p-2 md:p-4 space-y-4">
        <div className="mb-2 md:mb-4 flex items-start gap-4 flex-wrap">
          <div className="relative group cursor-pointer" onClick={handleImageClick} title="Click to change team image">
            {team.imageURL ? (
              <div className="relative">
                <img
                  src={team.imageURL}
                  alt={team.name}
                  className={`w-16 h-16 rounded-lg object-cover border-2 ${borderColor}`}
                />
                <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <FaCamera className="text-white text-sm" />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className={`w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-2 ${borderColor}`}>
                  {team.name[0]?.toUpperCase()}
                </div>
                <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <FaCamera className="text-white text-sm" />
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl xs:text-3xl font-bold">{team.name}</h1>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditClick}
                  className="p-2"
                  title="Edit team details"
                >
                  <FaEdit className="h-4 w-4" />
                </Button>
              )}
            </div>
            {team.description ? (
              <p className={`mt-2 ${colorMode === "light" ? "text-gray-600" : "text-gray-400"}`}>{team.description}</p>
            ) : isAdmin ? (
              <p className={`mt-2 italic ${colorMode === "light" ? "text-gray-400" : "text-gray-500"}`}>
                No description. <button onClick={handleEditClick} className="underline">Add one</button>
              </p>
            ) : null}
          </div>
        </div>
        <Tabs tabs={tabs} />
      </div>

      {/* Team Image Upload Modal */}
      <Modal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        title="Change Team Image"
      >
        <div className="space-y-4">
          {team?.imageURL ? (
            <div className="flex flex-col items-center space-y-4">
              <div className={`relative w-32 h-32 rounded-lg overflow-hidden border-2 ${borderColor}`}>
                <img
                  src={team.imageURL}
                  alt={team.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                >
                  <FaCamera className="mr-2" />
                  Change Image
                </Button>
                <Button
                  variant="danger"
                  onClick={handleRemoveImage}
                  disabled={isUploadingImage}
                >
                  <FaTimes className="mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                {team?.name[0]?.toUpperCase()}
              </div>
              <Button
                variant="primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
              >
                <FaCamera className="mr-2" />
                Upload Image
              </Button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {isUploadingImage && (
            <div className="text-center text-sm text-gray-500">
              Uploading...
            </div>
          )}
        </div>
      </Modal>

      {/* Edit Team Details Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Team Details"
      >
        <div className="space-y-4">
          <Input
            label="Team Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Enter team name"
            maxLength={40}
          />
          <Textarea
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Enter team description (optional)"
            rows={4}
            maxLength={500}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveEdit}
              isLoading={isSaving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Overview Tab
function OverviewTab({ teamId }: { teamId: string }) {
  const [activity, setActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const [messagesRes, tradesRes] = await Promise.all([
          axios.get(`/api/teams/${teamId}/messages?limit=5`),
          axios.get(`/api/teams/${teamId}/trade-shares`),
        ]);

        const activities = [
          ...messagesRes.data.slice(0, 3).map((m: any) => ({ type: "message", data: m })),
          ...tradesRes.data.slice(0, 3).map((t: any) => ({ type: "trade", data: t })),
        ].sort((a, b) => {
          const aDate = a.type === "message" ? a.data.createdAt : a.data.createdAt;
          const bDate = b.type === "message" ? b.data.createdAt : b.data.createdAt;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        });

        setActivity(activities.slice(0, 10));
      } catch (err) {
        console.error("Error fetching activity:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
  }, [teamId]);

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Recent Activity</h2>
      {activity.length === 0 ? (
        <p className="text-gray-500">No recent activity</p>
      ) : (
        activity.map((item, idx) => (
          <Card key={idx}>
            {item.type === "message" ? (
              <div>
                <p className="text-sm text-gray-600">
                  <strong>{item.data.sender.firstName} {item.data.sender.lastName}</strong> sent a message
                </p>
                <p className="mt-1">{item.data.content}</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600">
                  <strong>{item.data.sharer.firstName} {item.data.sharer.lastName}</strong> shared a trade
                </p>
                <p className="mt-1">{item.data.trade.symbol} - {item.data.trade.status}</p>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}

// Chat Tab
function ChatTab({ teamId }: { teamId: string }) {
  const { colorMode } = useColorMode();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const bgColor = colorMode === "light" ? "bg-white" : "bg-gray-800";
  const borderColor = colorMode === "light" ? "border-gray-200" : "border-gray-700";
  const textColor = colorMode === "light" ? "text-gray-900" : "text-gray-100";
  const subTextColor = colorMode === "light" ? "text-gray-500" : "text-gray-400";
  const inputBg = colorMode === "light" ? "bg-white" : "bg-gray-700";
  const inputBorder = colorMode === "light" ? "border-gray-300" : "border-gray-600";

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/api/teams/${teamId}/messages`);
      setMessages(response.data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [teamId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setIsSending(true);
      await axios.post(`/api/teams/${teamId}/messages`, {
        content: newMessage.trim(),
      });
      setNewMessage("");
      fetchMessages();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <Card className={`${bgColor} ${borderColor} border`}>
        <div className={`p-4 h-96 overflow-y-auto ${bgColor}`}>
          {messages.length === 0 ? (
            <p className={`${subTextColor} text-center py-8`}>No messages yet</p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <div className="flex-shrink-0">
                    {msg.sender?.photoURL ? (
                      <img
                        src={msg.sender.photoURL}
                        alt={`${msg.sender.firstName} ${msg.sender.lastName}`}
                        className={`w-10 h-10 rounded-full object-cover border-2 ${
                          colorMode === "light" ? "border-gray-300" : "border-purple-500"
                        }`}
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                        colorMode === "light" ? "bg-blue-500" : "bg-purple-500"
                      }`}>
                        {msg.sender?.firstName?.[0] || "U"}{msg.sender?.lastName?.[0] || ""}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <strong className={`text-sm ${textColor}`}>{msg.sender?.firstName || "Unknown"} {msg.sender?.lastName || ""}</strong>
                      <span className={`text-xs ${subTextColor}`}>
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className={textColor}>{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
      <form onSubmit={handleSend} className="flex gap-2">
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
          maxLength={1000}
        />
        <Button type="submit" variant="primary" isLoading={isSending}>Send</Button>
      </form>
    </div>
  );
}

// Trades Tab
function TradesTab({ teamId }: { teamId: string }) {
  const { colorMode } = useColorMode();
  const [shares, setShares] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState("");
  const [note, setNote] = useState("");
  const [userTrades, setUserTrades] = useState<any[]>([]);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    fetchShares();
    fetchUserTrades();
  }, [teamId]);

  const fetchShares = async () => {
    try {
      const response = await axios.get(`/api/teams/${teamId}/trade-shares`);
      if (response.data && Array.isArray(response.data)) {
        setShares(response.data);
      } else {
        console.error("Invalid response format:", response.data);
        setShares([]);
      }
    } catch (err: any) {
      console.error("Error fetching shares:", err);
      setShares([]);
      if (err.response?.status !== 403) {
        alert(err.response?.data?.error || "Failed to fetch shared trades");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserTrades = async () => {
    try {
      const response = await axios.get("/api/trades?pageSize=50");
      setUserTrades(response.data.items);
    } catch (err) {
      console.error("Error fetching user trades:", err);
    }
  };

  const handleShare = async () => {
    console.log("handleShare called", { selectedTradeId, teamId });
    
    if (!selectedTradeId) {
      alert("Please select a trade to share");
      return;
    }

    try {
      setIsSharing(true);
      console.log("Sending share request...");
      
      const response = await axios.post(`/api/teams/${teamId}/trade-shares`, {
        tradeId: selectedTradeId,
        note: note.trim() || null,
      });
      
      console.log("Share successful:", response.data);
      
      // Close modal and reset form
      setShowShareModal(false);
      setSelectedTradeId("");
      setNote("");
      
      // Refresh shares list
      await fetchShares();
    } catch (err: any) {
      console.error("Error sharing trade:", err);
      const errorMessage = err.response?.data?.error || "Failed to share trade";
      alert(errorMessage);
    } finally {
      setIsSharing(false);
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Shared Trades</h2>
        <Button onClick={() => setShowShareModal(true)}>Share Trade</Button>
      </div>

      {shares.length === 0 ? (
        <p className="text-gray-500">No shared trades yet</p>
      ) : (
        <div className="space-y-2">
          {shares.map((share) => (
            <Card key={share.id}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{share.trade.symbol}</p>
                  <p className={`text-sm ${
                    colorMode === "light" ? "text-gray-600" : "text-gray-400"
                  }`}>
                    Shared by {share.sharer.firstName} {share.sharer.lastName}
                  </p>
                  {share.note && <p className="mt-1 text-sm">{share.note}</p>}
                </div>
                <a
                  href={`/trades/${share.trade.id}`}
                  className={`${colorMode === "light" ? "text-blue-600" : "text-purple-400"} hover:underline text-sm`}
                >
                  View Trade
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Trade"
      >
        <div className="space-y-4">
          <Select
            label="Select Trade"
            options={[
              { value: "", label: "Choose a trade..." },
              ...userTrades.map((t) => ({
                value: t.id,
                label: `${t.symbol} - ${t.status} (${new Date(t.date).toLocaleDateString()})`,
              }))
            ]}
            value={selectedTradeId}
            onChange={(e) => {
              console.log("Trade selected:", e.target.value);
              setSelectedTradeId(e.target.value);
            }}
          />
          <Textarea
            label="Note (Optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={300}
          />
          <div className="flex gap-2">
            <Button 
              onClick={handleShare} 
              isLoading={isSharing}
              disabled={!selectedTradeId || isSharing}
            >
              Share
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowShareModal(false);
                setSelectedTradeId("");
                setNote("");
              }}
              disabled={isSharing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Rooms Tab
function RoomsTab({ teamId }: { teamId: string }) {
  const { colorMode } = useColorMode();
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, [teamId]);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`/api/teams/${teamId}/rooms`);
      setRooms(response.data);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!roomName.trim() || roomName.length < 2 || roomName.length > 40) {
      alert("Room name must be between 2 and 40 characters");
      return;
    }

    try {
      setIsCreating(true);
      await axios.post(`/api/teams/${teamId}/rooms`, { name: roomName.trim() });
      setShowCreateModal(false);
      setRoomName("");
      fetchRooms();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Rooms</h2>
        <Button onClick={() => setShowCreateModal(true)}>Create Room</Button>
      </div>

      {rooms.length === 0 ? (
        <p className="text-gray-500">No rooms yet</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Card key={room.id}>
              <h3 className="font-semibold mb-2">{room.name}</h3>
              <a
                href={`/team/${teamId}/rooms/${room.id}`}
                className={`${colorMode === "light" ? "text-blue-600" : "text-purple-400"} hover:underline text-sm`}
              >
                Join Room
              </a>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Room"
      >
        <div className="space-y-4">
          <Input
            label="Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter room name"
            maxLength={40}
          />
          <div className="flex gap-2">
            <Button onClick={handleCreate} isLoading={isCreating}>Create</Button>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Members Tab
function MembersTab({ teamId, onUpdate }: { teamId: string; onUpdate: () => void }) {
  const { colorMode } = useColorMode();
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");

  useEffect(() => {
    fetchMembers();
  }, [teamId]);

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`/api/teams/${teamId}/members`);
      setMembers(response.data);
      // Find current user's role
      const userResponse = await axios.get("/api/user");
      const currentMember = response.data.find((m: any) => m.user.id === userResponse.data.id);
      if (currentMember) setCurrentUserRole(currentMember.role);
    } catch (err) {
      console.error("Error fetching members:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      alert("Valid email is required");
      return;
    }

    try {
      setIsInviting(true);
      const { data } = await axios.post(`/api/teams/${teamId}/invites`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      const token = data?.token;
      if (token) {
        const url = typeof window !== "undefined" ? `${window.location.origin}/team/invite/${token}` : "";
        setLastInviteLink(url);
      }
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRole("MEMBER");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to send invite");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await axios.patch(`/api/teams/${teamId}/members`, {
        userId,
        role: newRole,
      });
      fetchMembers();
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update role");
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      await axios.delete(`/api/teams/${teamId}/members?userId=${userId}`);
      fetchMembers();
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to remove member");
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === "OWNER") return <FaCrown className="text-yellow-500" />;
    if (role === "ADMIN") return <FaShieldAlt className={colorMode === "light" ? "text-blue-500" : "text-purple-500"} />;
    return <FaUser className="text-gray-500" />;
  };

  if (isLoading) return <Spinner />;

  const isAdmin = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  const copyInviteLink = () => {
    if (lastInviteLink) {
      navigator.clipboard.writeText(lastInviteLink);
      alert("Invite link copied. Send it to the person you invited so they can accept.");
    }
  };

  return (
    <div className="space-y-4">
      {lastInviteLink && (
        <div className={`p-4 rounded-lg border flex flex-wrap items-center justify-between gap-2 ${colorMode === "light" ? "bg-green-50 border-green-200" : "bg-green-900/20 border-green-700"}`}>
          <span className={colorMode === "light" ? "text-green-800" : "text-green-200"}>
            Invitation sent. Share this link with them so they can accept (they must be logged in with that email):
          </span>
          <div className="flex items-center gap-2">
            <code className={`text-xs truncate max-w-[200px] ${colorMode === "light" ? "text-green-700" : "text-green-300"}`}>{lastInviteLink}</code>
            <Button size="sm" onClick={copyInviteLink}>Copy link</Button>
            <Button variant="ghost" size="sm" onClick={() => setLastInviteLink(null)}>Dismiss</Button>
          </div>
        </div>
      )}
      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={() => setShowInviteModal(true)}>Invite Member</Button>
        </div>
      )}

      <Table headers={["Member", "Role", "Actions"]}>
        {members.map((member) => (
          <tr key={member.id}>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full ${colorMode === "light" ? "bg-blue-500" : "bg-purple-500"} flex items-center justify-center text-white mr-3`}>
                  {member.user.firstName[0]}{member.user.lastName[0]}
                </div>
                <div>
                  <div className="font-medium">{member.user.firstName} {member.user.lastName}</div>
                  <div className="text-sm text-gray-500">{member.user.email}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-2">
                {getRoleIcon(member.role)}
                <Badge variant={member.role === "OWNER" ? "warning" : member.role === "ADMIN" ? "info" : "default"}>
                  {member.role}
                </Badge>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {isAdmin && member.role !== "OWNER" && (
                <div className="flex gap-2">
                  <Select
                    options={[
                      { value: "MEMBER", label: "Member" },
                      { value: "ADMIN", label: "Admin" },
                    ]}
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.user.id, e.target.value)}
                    className="w-32"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemove(member.user.id)}
                  >
                    <FaTrash />
                  </Button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </Table>

      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Member"
      >
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="user@example.com"
            required
          />
          <Select
            label="Role"
            options={[
              { value: "MEMBER", label: "Member" },
              { value: "ADMIN", label: "Admin" },
            ]}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={handleInvite} isLoading={isInviting}>Send Invite</Button>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Leaderboard Tab
function LeaderboardTab({ teamId }: { teamId: string }) {
  const { colorMode } = useColorMode();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDark = colorMode === "dark";
  const cardBg = isDark ? "bg-gray-800" : "bg-white";
  const borderColor = isDark ? "border-gray-700" : "border-gray-200";
  const textMuted = isDark ? "text-gray-400" : "text-gray-600";

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await axios.get(`/api/teams/${teamId}/leaderboard`);
        setLeaders(res.data || []);
      } catch (err: any) {
        console.error("Error fetching leaderboard:", err);
        setError(
          err.response?.data?.error || "Failed to load leaderboard"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [teamId]);

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Team Leaderboard</h2>
        <FaCrown className={isDark ? "text-yellow-400" : "text-yellow-500"} />
      </div>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {(!leaders || leaders.length === 0) ? (
        <p className={textMuted}>No shared trades yet. Share trades to build the leaderboard.</p>
      ) : (
        <Card className={`${cardBg} ${borderColor} border`}>
          <div className="p-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className={isDark ? "bg-gray-800" : "bg-gray-50"}>
                <tr>
                  <th className="px-3 py-2 text-left">Rank</th>
                  <th className="px-3 py-2 text-left">Trader</th>
                  <th className="px-3 py-2 text-right">Total P&L</th>
                  <th className="px-3 py-2 text-right">Trades Shared</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((entry, index) => (
                  <tr
                    key={entry.userId}
                    className={
                      index === 0
                        ? isDark
                          ? "bg-yellow-900/20"
                          : "bg-yellow-50"
                        : index % 2 === 0
                        ? isDark
                          ? "bg-gray-900"
                          : "bg-white"
                        : isDark
                        ? "bg-gray-800"
                        : "bg-gray-50"
                    }
                  >
                    <td className="px-3 py-2 font-semibold">
                      #{index + 1}
                    </td>
                    <td className="px-3 py-2 flex items-center gap-3">
                      {entry.photoURL ? (
                        <img
                          src={entry.photoURL}
                          alt={`${entry.firstName} ${entry.lastName}`}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white ${
                          isDark ? "bg-purple-600" : "bg-blue-600"
                        }`}>
                          {entry.firstName?.[0] ?? "U"}
                          {entry.lastName?.[0] ?? ""}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {entry.firstName} {entry.lastName}
                        </div>
                        <div className={`text-xs ${textMuted}`}>
                          {entry.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {entry.totalPnL >= 0 ? (
                        <span className="text-green-500">
                          +${entry.totalPnL.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-red-500">
                          -${Math.abs(entry.totalPnL).toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {entry.tradesShared}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
