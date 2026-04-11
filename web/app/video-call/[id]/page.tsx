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
    <>
      <style>{`.mat-icon { font-family:'Material Symbols Outlined'; font-style:normal; font-weight:400; line-height:1; letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap; -webkit-font-smoothing:antialiased; }`}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />

      <div style={{ position: "fixed", inset: 0, background: "#0a0f14", display: "flex", flexDirection: "column" }}>
        {/* Video area */}
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {remoteTracks.length > 0 ? (
            <VideoTrack trackRef={remoteTracks[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#1a2332", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(0,104,95,0.3)" }}>
                <span className="mat-icon" style={{ fontSize: 48, color: "#3d5a6e", fontVariationSettings: "'FILL' 1" }}>person</span>
              </div>
              <p style={{ color: "#6d7a77", fontSize: 15 }}>Ожидание врача...</p>
            </div>
          )}

          {/* Local PiP */}
          {localTrack && (
            <div style={{ position: "absolute", top: 20, right: 16, width: 120, height: 160, borderRadius: 16, overflow: "hidden", border: "2px solid rgba(255,255,255,0.2)", boxShadow: "0 4px 20px rgba(0,0,0,0.6)" }}>
              <VideoTrack trackRef={localTrack} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}

          {/* Participants badge */}
          <div style={{ position: "absolute", top: 20, left: 16, display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.5)", padding: "5px 12px", borderRadius: 999, backdropFilter: "blur(8px)" }}>
            <span className="mat-icon" style={{ fontSize: 14, color: "#fff" }}>group</span>
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{participants.length}</span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", padding: "24px 0 44px", display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <button onClick={toggleMic} style={{
            width: 56, height: 56, borderRadius: "50%",
            background: micOn ? "rgba(255,255,255,0.15)" : "rgba(239,68,68,0.8)",
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 200ms",
          }}>
            <span className="mat-icon" style={{ fontSize: 22, color: "#fff", fontVariationSettings: "'FILL' 1" }}>
              {micOn ? "mic" : "mic_off"}
            </span>
          </button>

          <button onClick={handleEnd} style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg,#ef4444,#dc2626)",
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(239,68,68,0.5)", transform: "rotate(135deg)",
          }}>
            <span className="mat-icon" style={{ fontSize: 28, color: "#fff", fontVariationSettings: "'FILL' 1" }}>call</span>
          </button>

          <button onClick={toggleCam} style={{
            width: 56, height: 56, borderRadius: "50%",
            background: camOn ? "rgba(255,255,255,0.15)" : "rgba(239,68,68,0.8)",
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 200ms",
          }}>
            <span className="mat-icon" style={{ fontSize: 22, color: "#fff", fontVariationSettings: "'FILL' 1" }}>
              {camOn ? "videocam" : "videocam_off"}
            </span>
          </button>
        </div>
      </div>
    </>
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
      <div style={{ position: "fixed", inset: 0, background: "#0a0f14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #1a2332", borderTopColor: "#00685f", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#6d7a77", fontSize: 15 }}>Подключение...</p>
      </div>
    );
  }

  if (error || !livekitToken || !serverUrl) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#0a0f14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ color: "#ef4444", fontSize: 15 }}>{error || "Ошибка подключения"}</p>
        <button onClick={() => router.back()} style={{ background: "linear-gradient(135deg,#00685f,#008378)", color: "#fff", border: "none", borderRadius: 14, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
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
