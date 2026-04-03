"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  LiveKitRoom,
  useTracks,
  useParticipants,
  VideoTrack,
  useLocalParticipant,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhone, FaUserMd } from "react-icons/fa";
import { initiateCall, endCall } from "@/lib/api";

function VideoCallUI({ consultationId, onEnd }: { consultationId: string; onEnd: () => void }) {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const remoteTracks = tracks.filter((t) => !t.participant.isLocal && t.source === Track.Source.Camera);
  const localTrack = tracks.find((t) => t.participant.isLocal && t.source === Track.Source.Camera);

  const toggleMic = useCallback(async () => {
    if (!localParticipant) return;
    const next = !micOn;
    await localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
  }, [localParticipant, micOn]);

  const toggleCam = useCallback(async () => {
    if (!localParticipant) return;
    const next = !camOn;
    await localParticipant.setCameraEnabled(next);
    setCamOn(next);
  }, [localParticipant, camOn]);

  const handleEnd = useCallback(async () => {
    try { await endCall(consultationId); } catch {}
    onEnd();
  }, [consultationId, onEnd]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0f0f0f", display: "flex", flexDirection: "column" }}>
      {/* Video area */}
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Remote video */}
        {remoteTracks.length > 0 ? (
          <VideoTrack trackRef={remoteTracks[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FaUserMd size={40} color="#64748b" />
            </div>
            <p style={{ color: "#94a3b8", fontSize: 15 }}>Ожидание врача...</p>
          </div>
        )}

        {/* Local PiP */}
        {localTrack && (
          <div style={{ position: "absolute", top: 20, right: 16, width: 120, height: 160, borderRadius: 12, overflow: "hidden", border: "2px solid #fff", boxShadow: "0 4px 16px rgba(0,0,0,0.5)" }}>
            <VideoTrack trackRef={localTrack} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        {/* Participants badge */}
        <div style={{ position: "absolute", top: 20, left: 16, display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.6)", padding: "4px 12px", borderRadius: 999 }}>
          <span style={{ color: "#fff", fontSize: 12 }}>👥 {participants.length}</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ background: "rgba(0,0,0,0.85)", padding: "24px 0 40px", display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
        <button
          onClick={toggleMic}
          style={{ width: 56, height: 56, borderRadius: "50%", background: micOn ? "#334155" : "#64748b", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {micOn ? <FaMicrophone size={20} color="#fff" /> : <FaMicrophoneSlash size={20} color="#fff" />}
        </button>

        <button
          onClick={handleEnd}
          style={{ width: 64, height: 64, borderRadius: "50%", background: "#ef4444", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(135deg)" }}
        >
          <FaPhone size={24} color="#fff" />
        </button>

        <button
          onClick={toggleCam}
          style={{ width: 56, height: 56, borderRadius: "50%", background: camOn ? "#334155" : "#64748b", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {camOn ? <FaVideo size={18} color="#fff" /> : <FaVideoSlash size={18} color="#fff" />}
        </button>
      </div>
    </div>
  );
}

export default function VideoCallPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const consultationId = params.id;

  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const calledRef = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); return; }
    if (calledRef.current) return;
    calledRef.current = true;

    initiateCall(consultationId)
      .then((data) => {
        setLivekitToken(data.token);
        setServerUrl(data.serverUrl);
      })
      .catch((e: Error) => setError(e.message || "Не удалось подключиться"))
      .finally(() => setLoading(false));
  }, [consultationId, router]);

  const handleEnd = useCallback(() => {
    router.back();
  }, [router]);

  if (loading) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#0f0f0f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #334155", borderTopColor: "#0d9488", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#94a3b8", fontSize: 15 }}>Подключение...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !livekitToken || !serverUrl) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#0f0f0f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ color: "#ef4444", fontSize: 15 }}>{error || "Ошибка подключения"}</p>
        <button onClick={() => router.back()} style={{ background: "#0d9488", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Назад
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={livekitToken}
      connect
      audio
      video
      options={{ adaptiveStream: true, dynacast: true }}
      onDisconnected={handleEnd}
    >
      <VideoCallUI consultationId={consultationId} onEnd={handleEnd} />
    </LiveKitRoom>
  );
}
