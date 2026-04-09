"use client";

import { useState, useEffect, useCallback } from "react";
import { getDoctorSlots, DoctorSlot } from "@/lib/api";
import { Calendar, Clock } from "lucide-react";

interface SlotPickerProps {
  doctorId: string;
  onSelect: (slotId: string | null) => void;
  selectedSlotId: string | null;
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

const DAY_NAMES = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTH_NAMES = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

export default function SlotPicker({ doctorId, onSelect, selectedSlotId }: SlotPickerProps) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  const [selectedDate, setSelectedDate] = useState<string>(toDateStr(today));
  const [slots, setSlots] = useState<DoctorSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSlots = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const res = await getDoctorSlots(doctorId, date);
      setSlots(res.filter((s) => !s.isBooked));
    } catch {
      setSlots([]);
    }
    setLoading(false);
  }, [doctorId]);

  useEffect(() => { loadSlots(selectedDate); }, [selectedDate, loadSlots]);

  function handleDateChange(date: string) {
    setSelectedDate(date);
    onSelect(null); // reset slot when date changes
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Calendar size={16} color="#0d9488" />
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Выберите дату и время</span>
        {selectedSlotId && (
          <button
            onClick={() => onSelect(null)}
            style={{
              marginLeft: "auto", background: "none", border: "none",
              cursor: "pointer", fontSize: 12, color: "#94a3b8",
            }}
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Day strip */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 14, scrollbarWidth: "none" }}>
        {days.map((d) => {
          const ds = toDateStr(d);
          const isSelected = ds === selectedDate;
          const isToday = ds === toDateStr(today);
          return (
            <button
              key={ds}
              onClick={() => handleDateChange(ds)}
              style={{
                flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center",
                padding: "8px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                background: isSelected ? "#0d9488" : isToday ? "#f0fdfa" : "#f8fafc",
                color: isSelected ? "#fff" : isToday ? "#0d9488" : "#475569",
                boxShadow: isSelected ? "0 2px 8px rgba(13,148,136,0.2)" : "none",
                transition: "all 0.15s", minWidth: 50,
                border: isSelected ? "none" : `1px solid ${isToday ? "#ccfbf1" : "#e2e8f0"}`,
              } as React.CSSProperties}
            >
              <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.8 }}>{DAY_NAMES[d.getDay()]}</span>
              <span style={{ fontSize: 17, fontWeight: 800 }}>{d.getDate()}</span>
              <span style={{ fontSize: 10, opacity: 0.65 }}>{MONTH_NAMES[d.getMonth()]}</span>
            </button>
          );
        })}
      </div>

      {/* Slots */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "16px 0", color: "#94a3b8", fontSize: 13 }}>
          Загрузка слотов...
        </div>
      ) : slots.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "16px 0",
          color: "#94a3b8", fontSize: 13,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <Clock size={14} />
          Нет доступных слотов на этот день
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {slots.map((slot) => {
            const isSelected = slot.id === selectedSlotId;
            return (
              <button
                key={slot.id}
                onClick={() => onSelect(isSelected ? null : slot.id)}
                style={{
                  padding: "9px 6px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: isSelected ? "#0d9488" : "#f8fafc",
                  color: isSelected ? "#fff" : "#0f172a",
                  fontSize: 13, fontWeight: isSelected ? 700 : 500,
                  border: isSelected ? "none" : "1px solid #e2e8f0",
                  boxShadow: isSelected ? "0 2px 6px rgba(13,148,136,0.2)" : "none",
                  transition: "all 0.12s",
                } as React.CSSProperties}
              >
                {slot.startTime}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
