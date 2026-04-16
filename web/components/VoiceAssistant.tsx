"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { voiceAgentApi, VoiceChatResponse } from "@/lib/api";

type State = "idle" | "recording" | "processing" | "speaking" | "result";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface VoiceAssistantProps {
  lang?: "ru" | "uz";
  onClose?: () => void;
}

export default function VoiceAssistant({ lang = "ru", onClose }: VoiceAssistantProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [state, setState] = useState<State>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<VoiceChatResponse | null>(null);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processAudio(blob);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setState("recording");
    } catch {
      setError(t("voiceAssistant.noMic"));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setState("processing");
    }
  }, []);

  const processAudio = useCallback(async (blob: Blob) => {
    setState("processing");
    try {
      const { text } = await voiceAgentApi.transcribe(blob, lang);
      setMessages((prev) => [...prev, { role: "user", text }]);

      const res = await voiceAgentApi.chat(sessionId, text, lang);
      setSessionId(res.sessionId);
      setLastResponse(res);
      setMessages((prev) => [...prev, { role: "assistant", text: res.reply }]);

      // TTS
      setState("speaking");
      try {
        const audioBlob = await voiceAgentApi.synthesize(res.reply, lang);
        if (audioBlob) {
          const url = URL.createObjectURL(audioBlob);
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => {
            URL.revokeObjectURL(url);
            setState(res.recommendation && res.recommendation !== "NONE" ? "result" : "idle");
          };
          audio.play().catch(() => setState(res.recommendation && res.recommendation !== "NONE" ? "result" : "idle"));
        } else {
          setState(res.recommendation && res.recommendation !== "NONE" ? "result" : "idle");
        }
      } catch {
        setState(res.recommendation && res.recommendation !== "NONE" ? "result" : "idle");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
      setState("idle");
    }
  }, [sessionId, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleMicPress() {
    if (state === "idle" || state === "result") startRecording();
    else if (state === "recording") stopRecording();
  }

  const isRecording = state === "recording";
  const isProcessing = state === "processing";
  const isSpeaking = state === "speaking";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "24px 0" }}>

      {/* Chat history */}
      {messages.length > 0 && (
        <div style={{
          width: "100%", maxWidth: 480,
          maxHeight: 280, overflowY: "auto",
          display: "flex", flexDirection: "column", gap: 8,
          paddingBottom: 4,
        }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div style={{
                maxWidth: "80%", padding: "10px 14px",
                borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                fontSize: 14, lineHeight: 1.5,
                background: m.role === "user" ? "#0d9488" : "#fff",
                color: m.role === "user" ? "#fff" : "#0f172a",
                border: m.role === "assistant" ? "1px solid #e2e8f0" : "none",
              }}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mic button */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Pulse rings when recording */}
        {isRecording && (
          <>
            <div style={{
              position: "absolute", width: 100, height: 100, borderRadius: "50%",
              background: "rgba(239,68,68,0.15)", animation: "pulse 1.2s ease-out infinite",
            }} />
            <div style={{
              position: "absolute", width: 120, height: 120, borderRadius: "50%",
              background: "rgba(239,68,68,0.08)", animation: "pulse 1.2s ease-out 0.4s infinite",
            }} />
          </>
        )}
        {/* Wave rings when speaking */}
        {isSpeaking && (
          <>
            <div style={{
              position: "absolute", width: 100, height: 100, borderRadius: "50%",
              background: "rgba(13,148,136,0.15)", animation: "wave 1s ease-in-out infinite",
            }} />
            <div style={{
              position: "absolute", width: 124, height: 124, borderRadius: "50%",
              background: "rgba(13,148,136,0.08)", animation: "wave 1s ease-in-out 0.3s infinite",
            }} />
          </>
        )}
        <button
          onClick={handleMicPress}
          disabled={isProcessing || isSpeaking}
          style={{
            width: 80, height: 80, borderRadius: "50%", border: "none",
            cursor: isProcessing || isSpeaking ? "not-allowed" : "pointer",
            background: isRecording
              ? "linear-gradient(135deg, #ef4444, #dc2626)"
              : "linear-gradient(135deg, #0d9488, #0f766e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: isRecording
              ? "0 8px 24px rgba(239,68,68,0.35)"
              : "0 8px 24px rgba(13,148,136,0.35)",
            transition: "all 0.2s",
            opacity: isProcessing || isSpeaking ? 0.6 : 1,
            position: "relative", zIndex: 1,
          }}
        >
          {isProcessing ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.8s linear infinite" }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          ) : isSpeaking ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>
      </div>

      {/* State label */}
      <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500, margin: 0 }}>
        {state === "idle" && (messages.length === 0 ? t("voiceAssistant.tapToSpeak") : t("voiceAssistant.speakAgain"))}
        {state === "recording" && t("voiceAssistant.recording")}
        {state === "processing" && t("voiceAssistant.processing")}
        {state === "speaking" && t("voiceAssistant.speaking")}
        {state === "result" && t("voiceAssistant.done")}
      </p>

      {error && (
        <p style={{ fontSize: 13, color: "#ef4444", margin: 0 }}>{error}</p>
      )}

      {/* Recommendation card */}
      {(state === "result" || state === "idle") && lastResponse?.recommendation && lastResponse.recommendation !== "NONE" && (
        <div style={{
          width: "100%", maxWidth: 480,
          background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
          padding: "18px 20px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            {t("voiceAssistant.recommend")}
          </p>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
            {lastResponse.recommendation === "DOCTOR"
              ? `${t("voiceAssistant.seeDoctor")}${lastResponse.suggestedSpecialization ? ` (${lastResponse.suggestedSpecialization})` : ""}`
              : t("voiceAssistant.callNurseHome")}
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {lastResponse.recommendation === "DOCTOR" ? (
              <button
                onClick={() => router.push("/doctors")}
                style={{
                  flex: 1, background: "linear-gradient(135deg, #0d9488, #0f766e)",
                  color: "#fff", border: "none", borderRadius: 10,
                  padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}
              >
                {t("voiceAssistant.pickDoctor")}
              </button>
            ) : (
              <button
                onClick={() => router.push("/order/location")}
                style={{
                  flex: 1, background: "linear-gradient(135deg, #0d9488, #0f766e)",
                  color: "#fff", border: "none", borderRadius: 10,
                  padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}
              >
                {t("voiceAssistant.callNurse")}
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: "#f1f5f9", color: "#64748b", border: "none",
                  borderRadius: 10, padding: "12px 16px", fontSize: 14, cursor: "pointer",
                }}
              >
                {t("voiceAssistant.close")}
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes wave {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
