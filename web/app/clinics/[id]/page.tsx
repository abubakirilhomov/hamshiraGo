"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Star, Phone, Users, Stethoscope, ChevronRight, AlertCircle } from "lucide-react";

// Mock data — replace with real API when public clinic endpoints are available
const MOCK_CLINICS: Record<string, {
  id: string;
  name: string;
  address: string;
  phone: string;
  rating: number;
  reviewCount: number;
  description: string;
  logoUrl: string | null;
  doctors: Array<{ id: string; name: string; specialization: string; rating: number }>;
  services: Array<{ id: string; name: string; price: number; durationMinutes: number }>;
}> = {
  "clinic-1": {
    id: "clinic-1",
    name: "Медцентр «Здоровье»",
    address: "ул. Амира Темура 22, Ташкент",
    phone: "+998 71 234 56 78",
    rating: 4.8,
    reviewCount: 124,
    description: "Многопрофильный медицинский центр с современным оборудованием. Принимаем взрослых и детей. Работаем с 2010 года.",
    logoUrl: null,
    doctors: [
      { id: "d1", name: "Иванов Алексей Александрович", specialization: "Терапевт", rating: 4.9 },
      { id: "d2", name: "Петрова Мария Сергеевна", specialization: "Кардиолог", rating: 4.8 },
      { id: "d3", name: "Смирнов Виктор Павлович", specialization: "Невролог", rating: 4.7 },
    ],
    services: [
      { id: "s1", name: "Первичная консультация", price: 150000, durationMinutes: 30 },
      { id: "s2", name: "Повторная консультация", price: 100000, durationMinutes: 20 },
      { id: "s3", name: "ЭКГ", price: 80000, durationMinutes: 15 },
      { id: "s4", name: "Общий анализ крови", price: 60000, durationMinutes: 5 },
    ],
  },
  "clinic-2": {
    id: "clinic-2",
    name: "Клиника «Омина»",
    address: "ул. Навои 5, Ташкент",
    phone: "+998 71 345 67 89",
    rating: 4.6,
    reviewCount: 87,
    description: "Специализируемся на женском здоровье и педиатрии. Опытные врачи, современное оборудование для УЗИ.",
    logoUrl: null,
    doctors: [
      { id: "d4", name: "Каримова Нилуфар Рашидовна", specialization: "Гинеколог", rating: 4.9 },
      { id: "d5", name: "Юсупова Дилноза Акбаровна", specialization: "Педиатр", rating: 4.7 },
    ],
    services: [
      { id: "s5", name: "Консультация гинеколога", price: 180000, durationMinutes: 30 },
      { id: "s6", name: "УЗИ органов малого таза", price: 200000, durationMinutes: 20 },
      { id: "s7", name: "Консультация педиатра", price: 130000, durationMinutes: 25 },
    ],
  },
};

const DOCTOR_AVATAR_COLORS = [
  { bg: "#f0fdfa", color: "#0d9488" },
  { bg: "#eff6ff", color: "#2563eb" },
  { bg: "#faf5ff", color: "#9333ea" },
  { bg: "#fff7ed", color: "#ea580c" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <Star size={12} color="#f59e0b" fill="#f59e0b" />
      <span style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>{rating.toFixed(1)}</span>
    </div>
  );
}

export default function ClinicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const clinic = MOCK_CLINICS[id];

  const card: React.CSSProperties = {
    background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9",
    boxShadow: "0 1px 4px rgba(15,23,42,0.04)", padding: 20,
  };

  if (!clinic) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ textAlign: "center" }}>
          <AlertCircle size={40} color="#ef4444" style={{ marginBottom: 12 }} />
          <p style={{ color: "#ef4444", fontWeight: 700, fontSize: 16 }}>Клиника не найдена</p>
          <button
            onClick={() => router.back()}
            style={{ marginTop: 16, background: "#f1f5f9", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", color: "#64748b" }}
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 80 }}>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #0d9488, #0f766e)",
        padding: "20px 20px 40px",
      }}>
        <div style={{ maxWidth: 720, margin: "auto" }}>
          <button
            onClick={() => router.back()}
            style={{
              background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "8px 12px",
              cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", gap: 4, fontSize: 13, marginBottom: 20,
            }}
          >
            <ArrowLeft size={14} /> Все клиники
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {clinic.logoUrl ? (
              <img
                src={clinic.logoUrl}
                alt={clinic.name}
                style={{ width: 72, height: 72, borderRadius: 16, objectFit: "cover", flexShrink: 0, border: "3px solid rgba(255,255,255,0.3)" }}
              />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: 16, flexShrink: 0,
                background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 800, color: "#fff",
              }}>
                {clinic.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>{clinic.name}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                <MapPin size={13} color="rgba(255,255,255,0.7)" />
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{clinic.address}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Star size={13} color="#fbbf24" fill="#fbbf24" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{clinic.rating.toFixed(1)}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>({clinic.reviewCount} отзывов)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "auto", padding: "0 16px" }}>
        {/* Info card */}
        <div style={{ ...card, marginTop: -20, marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: "0 0 14px" }}>{clinic.description}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Phone size={14} color="#0d9488" />
            <a href={`tel:${clinic.phone.replace(/\s/g, "")}`} style={{ fontSize: 14, color: "#0d9488", fontWeight: 700, textDecoration: "none" }}>
              {clinic.phone}
            </a>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ ...card, padding: 16, textAlign: "center" }}>
            <Users size={20} color="#0d9488" style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{clinic.doctors.length}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Врачей</div>
          </div>
          <div style={{ ...card, padding: 16, textAlign: "center" }}>
            <Stethoscope size={20} color="#9333ea" style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{clinic.services.length}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Услуг</div>
          </div>
        </div>

        {/* Doctors */}
        <div style={{ ...card, marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Врачи</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {clinic.doctors.map((doc, idx) => {
              const c = DOCTOR_AVATAR_COLORS[idx % DOCTOR_AVATAR_COLORS.length];
              return (
                <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: c.bg, color: c.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 800,
                  }}>
                    {doc.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 2px" }}>{doc.name}</p>
                    <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{doc.specialization}</p>
                  </div>
                  <StarRating rating={doc.rating} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Services */}
        <div style={{ ...card, marginBottom: 80 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Услуги и цены</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {clinic.services.map((svc) => (
              <div key={svc.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0",
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: "0 0 3px" }}>{svc.name}</p>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{svc.durationMinutes} мин</p>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#0d9488" }}>
                  {svc.price.toLocaleString("ru-RU")} сум
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA button fixed at bottom */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", borderTop: "1px solid #f1f5f9",
        padding: "14px 20px", zIndex: 10,
      }}>
        <div style={{ maxWidth: 720, margin: "auto" }}>
          <button
            onClick={() => router.push("/clinic/auth")}
            style={{
              width: "100%", background: "linear-gradient(135deg, #0d9488, #0f766e)", color: "#fff",
              border: "none", borderRadius: 14, padding: "14px 0",
              fontSize: 16, fontWeight: 800, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}
          >
            Записаться <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
