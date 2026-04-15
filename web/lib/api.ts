const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://hamshirago-production-0a65.up.railway.app";
export const WS_URL = BASE_URL;

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401 && !path.startsWith("/auth/")) {
    localStorage.removeItem("token");
    window.location.href = "/auth";
    throw new Error("Unauthorized");
  }
  if (res.status === 429) throw new Error("TOO_MANY_REQUESTS");
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Ошибка сервера" }));
    const msg = Array.isArray(error.message) ? error.message.join(", ") : (error.message || "Ошибка сервера");
    throw new Error(msg);
  }
  const text = await res.text();
  if (!text.trim()) return undefined as T;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Ошибка парсинга ответа сервера");
  }
}

const SERVICES_CACHE_KEY = "svc_cache";
const SERVICES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedServices(): Service[] | null {
  try {
    const raw = localStorage.getItem(SERVICES_CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: Service[]; ts: number };
    if (Date.now() - ts > SERVICES_CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function setCachedServices(data: Service[]) {
  try {
    localStorage.setItem(SERVICES_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* ignore quota errors */ }
}

export const api = {
  services: {
    list: () => {
      const cached = getCachedServices();
      if (cached) return Promise.resolve(cached);
      return request<Service[]>("/services").then((data) => {
        setCachedServices(data);
        return data;
      });
    },
    get: (id: string) => request<Service>(`/services/${id}`),
  },

  auth: {
    login: (phone: string, password: string) =>
      request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ phone, password }),
      }),
    register: (name: string, phone: string, password: string, referredByCode?: string) =>
      request<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, phone, password, ...(referredByCode ? { referredByCode } : {}) }),
      }),
    updateProfile: (name: string) =>
      request<{ id: string; phone: string; name: string }>("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }),
    deleteAccount: () =>
      request<void>("/auth/account", { method: "DELETE" }),
  },

  orders: {
    list: () => request<{ data: Order[] }>("/orders").then(r => r.data),
    get: (id: string) => request<Order>(`/orders/${id}`),
    create: (data: CreateOrderDto) =>
      request<Order>("/orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    cancel: (id: string) =>
      request<Order>(`/orders/${id}/cancel`, { method: "POST" }),
    confirmDone: (id: string) =>
      request<Order>(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "DONE" }),
      }),
    rate: (id: string, rating: number, review?: string) =>
      request<Order>(`/orders/${id}/rate`, {
        method: "POST",
        body: JSON.stringify({ rating, ...(review ? { review } : {}) }),
      }),
  },

  medics: {
    nearby: (lat: number, lng: number) =>
      request<Medic[]>(`/medics/nearby?latitude=${lat}&longitude=${lng}`),
  },

  settings: {
    get: () => request<AppSettings>("/settings"),
  },

  payments: {
    initiatePayment: (orderId: string, provider: PaymentProvider) =>
      request<PaymentInitResponse>(`/payments/${orderId}/initiate`, {
        method: "POST",
        body: JSON.stringify({ provider }),
      }),
    getPaymentStatus: (orderId: string) =>
      request<PaymentStatusResponse>(`/payments/${orderId}/status`),
  },

  chat: {
    getMessages: (orderId: string) =>
      request<ChatMessage[]>(`/orders/${orderId}/messages`),
    sendMessage: (orderId: string, content: string) =>
      request<ChatMessage>(`/orders/${orderId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
  },

  promo: {
    validate: (code: string) =>
      request<{ valid: boolean; discountAmount: number; promoId: string | null }>("/promo/validate", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),
  },
};

// ─── Types ───────────────────────────────────────────────

export interface Service {
  id: string;
  title: string;
  titleUz: string | null;
  descriptionUz: string | null;
  categoryUz: string | null;
  description: string;
  category: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: { id: string; phone: string; name: string | null };
}

export interface OrderLocation {
  id: string;
  latitude: number;
  longitude: number;
  house: string;
  floor: string | null;
  apartment: string | null;
  phone: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: "user" | "doctor" | "assistant";
  content: string;
  createdAt: string;
}

export interface Order {
  id: string;
  clientId: string;
  medicId: string | null;
  serviceId: string;
  serviceTitle: string;
  priceAmount: number;
  discountAmount: number;
  urgentFee?: number;
  isUrgent?: boolean;
  platformFee?: number;
  status: OrderStatus;
  cancelReason?: string | null;
  clientRating: number | null;
  clientReview?: string | null;
  created_at: string;
  updated_at: string;
  location: OrderLocation;
  medic: Medic | null;
}

export interface Medic {
  id: string;
  name: string;
  rating: number | null;
  reviewCount: number;
  experienceYears: number;
  isOnline: boolean;
  latitude: number | null;
  longitude: number | null;
  distanceKm?: number;
  profilePhotoUrl?: string | null;
}

export interface CreateOrderDto {
  serviceId: string;
  discountAmount?: number;
  isUrgent?: boolean;
  location: {
    latitude: number;
    longitude: number;
    house: string;
    floor?: string;
    apartment?: string;
    phone: string;
  };
}

export interface AppSettings {
  isPaidMode: boolean;
  commissionRate: number;
  urgentFeePercent: number;
  urgentStartHour: number;
  urgentEndHour: number;
}

export type OrderStatus =
  | "CREATED"
  | "ASSIGNED"
  | "ACCEPTED"
  | "ON_THE_WAY"
  | "ARRIVED"
  | "SERVICE_STARTED"
  | "DONE"
  | "CANCELED";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  CREATED: "Создан",
  ASSIGNED: "Назначен",
  ACCEPTED: "Принят",
  ON_THE_WAY: "В пути",
  ARRIVED: "Прибыл",
  SERVICE_STARTED: "Оказывается услуга",
  DONE: "Выполнен",
  CANCELED: "Отменён",
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, { text: string; bg: string }> = {
  CREATED:         { text: "#0d9488", bg: "#0d948818" },
  ASSIGNED:        { text: "#eab308", bg: "#eab30820" },
  ACCEPTED:        { text: "#eab308", bg: "#eab30820" },
  ON_THE_WAY:      { text: "#eab308", bg: "#eab30820" },
  ARRIVED:         { text: "#eab308", bg: "#eab30820" },
  SERVICE_STARTED: { text: "#14b8a6", bg: "#14b8a620" },
  DONE:            { text: "#22c55e", bg: "#22c55e20" },
  CANCELED:        { text: "#ef4444", bg: "#ef444418" },
};

// ─── Services ────────────────────────────────────────────

export const SERVICES_MAP: Record<string, { nameRu: string; priceMin: number; priceMax: number }> = {
  injection:      { nameRu: "Укол",                priceMin: 80000,  priceMax: 120000 },
  iv_drip:        { nameRu: "Капельница",          priceMin: 150000, priceMax: 250000 },
  blood_pressure: { nameRu: "Давление",            priceMin: 50000,  priceMax: 80000  },
  long_term_care: { nameRu: "Долговременный уход", priceMin: 200000, priceMax: 400000 },
};

export function formatPrice(n: number): string {
  return n.toLocaleString("ru-RU");
}

// ─── Payment Types ────────────────────────────────────────

// ─── Referral ─────────────────────────────────────────────────────────────────

export interface ReferralInfo {
  referralCode: string;
  referredCount: number;
  bonusPaidCount: number;
}

export const getReferralInfo = () => request<ReferralInfo>("/referrals/my");

// ─── Favorites ────────────────────────────────────────────────────────────────

export interface FavoriteMedic {
  medicId: string;
  name: string;
  phone: string;
  rating: number | null;
  experienceYears: number | null;
  profilePhotoUrl: string | null;
}

export const getFavorites = () => request<FavoriteMedic[]>("/favorites");

export const addFavorite = (medicId: string) =>
  request<void>(`/favorites/${medicId}`, { method: "POST" });

export const removeFavorite = (medicId: string) =>
  request<void>(`/favorites/${medicId}`, { method: "DELETE" });

// ─── Treatment Courses ────────────────────────────────────────────────────────

export interface TreatmentCourse {
  id: string;
  title: string;
  totalProcedures: number;
  completedProcedures: number;
  intervalDays: number;
  nextDate: string | null;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
}

export interface CreateTreatmentCourseDto {
  title: string;
  totalProcedures: number;
  intervalDays: number;
  nextDate?: string;
}

export const getTreatmentCourses = () =>
  request<TreatmentCourse[]>("/treatment-courses/my");

export const createTreatmentCourse = (data: CreateTreatmentCourseDto) =>
  request<TreatmentCourse>("/treatment-courses", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const deleteTreatmentCourse = (id: string) =>
  request<void>(`/treatment-courses/${id}`, { method: "DELETE" });

export const patchTreatmentCourse = (id: string, data: Record<string, unknown>) =>
  request<TreatmentCourse>(`/treatment-courses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  authorRole: "client" | "medic";
}

export interface ReviewsResponse {
  data: Review[];
  total: number;
  page: number;
  totalPages: number;
}

export const getMedicReviews = (medicId: string, page = 1) =>
  request<ReviewsResponse>(`/reviews/medic/${medicId}?page=${page}&limit=10`);

// ─── Medical Card ─────────────────────────────────────────────────────────────

export interface MedicalCard {
  bloodType: string | null;
  allergies: string | null;
  chronicDiseases: string | null;
  notes: string | null;
}

export const getMedicalCard = () => request<MedicalCard | null>("/medical-card");

export const saveMedicalCard = (data: MedicalCard) =>
  request<MedicalCard>("/medical-card", { method: "PUT", body: JSON.stringify(data) });

// ─── Doctors / Consultations ─────────────────────────────────────────────────

export interface Doctor {
  id: string;
  name: string;
  nameUz: string | null;
  specialization: string;
  specializationUz: string | null;
  bio: string | null;
  photoUrl: string | null;
  pricePerConsultation: number;
  rating: number;
  consultationCount: number;
  isActive: boolean;
}

export interface Consultation {
  id: string;
  doctorId: string;
  doctor: Doctor;
  symptoms: string | null;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELED";
  createdAt: string;
  doctorNotes: string | null;
}

export interface ConsultationListResponse {
  data: Consultation[];
  total: number;
  page: number;
  totalPages: number;
}

export const getDoctors = (specialization?: string) => {
  const q = specialization ? `?specialization=${encodeURIComponent(specialization)}` : "";
  return request<Doctor[]>(`/consultations/doctors${q}`);
};

export const getDoctorById = (id: string) =>
  request<Doctor>(`/consultations/doctors/${id}`);

export interface DoctorSlot {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export const getDoctorSlots = (doctorId: string, date: string) =>
  request<DoctorSlot[]>(`/doctors/${doctorId}/slots?date=${date}`);

export const createConsultation = (doctorId: string, symptoms?: string, slotId?: string) =>
  request<Consultation>("/consultations", {
    method: "POST",
    body: JSON.stringify({ doctorId, ...(symptoms ? { symptoms } : {}), ...(slotId ? { slotId } : {}) }),
  });

export const getMyConsultations = (page = 1, limit = 10) =>
  request<ConsultationListResponse>(`/consultations/my?page=${page}&limit=${limit}`);

export const getConsultationById = (id: string) =>
  request<Consultation>(`/consultations/${id}`);

export const initiateCall = (consultationId: string) =>
  request<{ token: string; serverUrl: string }>(`/consultations/${consultationId}/call`, {
    method: "POST",
  });

export const endCall = (consultationId: string) =>
  request<void>(`/consultations/${consultationId}/call/end`, { method: "POST" });

// ─── Prescriptions ────────────────────────────────────────────────────────────

export interface Prescription {
  id: string;
  consultationId: string;
  clientId: string;
  serviceId: string;
  serviceTitle: string;
  servicePrice: number;
  status: "PENDING" | "CONFIRMED" | "CANCELED" | "EXPIRED";
  orderId: string | null;
  doctorNotes: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface PrescriptionListResponse {
  data: Prescription[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ConfirmPrescriptionDto {
  location: {
    latitude: number;
    longitude: number;
    house: string;
    floor?: string;
    apartment?: string;
    phone: string;
  };
}

export const getMyPrescriptions = (page = 1, limit = 20) =>
  request<PrescriptionListResponse>(`/consultations/prescriptions/my?page=${page}&limit=${limit}`);

export const confirmPrescription = (id: string, data: ConfirmPrescriptionDto) =>
  request<Prescription>(`/consultations/prescriptions/${id}/confirm`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const cancelPrescription = (id: string) =>
  request<Prescription>(`/consultations/prescriptions/${id}/cancel`, { method: "POST" });

// ─── NPS ──────────────────────────────────────────────────────────────────────

export interface NpsCheckResponse {
  shouldShow: boolean;
}

export const checkNps = () => request<NpsCheckResponse>("/nps/check");

export const submitNps = (score: number, comment?: string) =>
  request<void>("/nps/submit", {
    method: "POST",
    body: JSON.stringify({ score, ...(comment ? { comment } : {}) }),
  });

// ─── Consultations / AI Chat ──────────────────────────────────────────────────

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiChatResponse {
  reply: string;
  recommendation?: { specialization: string; summary: string };
}

// Добавляем consultations в объект api ниже отдельно через расширение
export const consultationsApi = {
  aiChat: (messages: AiChatMessage[]) =>
    request<AiChatResponse>("/consultations/ai-chat", {
      method: "POST",
      body: JSON.stringify({ messages }),
    }),
};

// ─── Subscriptions ───────────────────────────────────────────────────────────

export interface SubscriptionTier {
  id: string;
  name: string;
  nameUz: string | null;
  description: string | null;
  descriptionUz: string | null;
  price: number;
  billingDays: number;
  maxOrders: number;
  discountPercent: number;
  isActive: boolean;
  sortOrder: number;
}

export interface Subscription {
  id: string;
  tierId: string;
  tier: SubscriptionTier;
  status: "ACTIVE" | "EXPIRED" | "CANCELED";
  ordersUsed: number;
  startDate: string;
  expiresAt: string;
}

export const getSubscriptionTiers = () =>
  request<SubscriptionTier[]>("/subscriptions/tiers");

export const getMySubscription = () =>
  request<Subscription | null>("/subscriptions/my");

export const purchaseSubscription = (tierId: string) =>
  request<Subscription>("/subscriptions/purchase", {
    method: "POST",
    body: JSON.stringify({ tierId }),
  });

export const cancelSubscription = () =>
  request<Subscription>("/subscriptions/cancel", { method: "POST" });

// ─── Loyalty ──────────────────────────────────────────────────────────────────

export interface LoyaltyBalance {
  points: number;
  tier: "BRONZE" | "SILVER" | "GOLD";
  nextTierAt: number | null;
  nextTierName: string | null;
}

export interface LoyaltyTransaction {
  id: string;
  type: "EARNED" | "SPENT" | "MILESTONE" | "BONUS";
  points: number;
  description: string;
  createdAt: string;
}

export interface LoyaltyHistoryResponse {
  data: LoyaltyTransaction[];
  total: number;
  page: number;
  totalPages: number;
}

export const getLoyaltyBalance = () => request<LoyaltyBalance>("/loyalty/my");

export const getLoyaltyHistory = (page = 1, limit = 20) =>
  request<LoyaltyHistoryResponse>(`/loyalty/history?page=${page}&limit=${limit}`);

export const redeemLoyaltyPoints = (points: number) =>
  request<{ discountAmount: number; remainingPoints: number }>("/loyalty/redeem", {
    method: "POST",
    body: JSON.stringify({ points }),
  });

// ─── Error Reporting ──────────────────────────────────────────────────────────

export function reportClientError(message: string, stack?: string): void {
  fetch(`${BASE_URL}/client-errors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appType: "web",
      message,
      stack,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent: typeof window !== "undefined" ? navigator.userAgent : undefined,
    }),
  }).catch(() => {}); // fire-and-forget, никогда не бросаем ошибку
}

export type PaymentProvider = "payme" | "click";

export interface PaymentInitResponse {
  paymentUrl: string;
  paymentId: string;
}

export interface PaymentStatusResponse {
  status: "PENDING" | "PAID" | "FAILED";
  paymentUrl?: string;
}

// ─── Voice Agent ──────────────────────────────────────────────────────────────

export interface VoiceChatResponse {
  sessionId: string;
  reply: string;
  recommendation?: "DOCTOR" | "NURSE" | "NONE";
  suggestedSpecialization?: string;
  sessionComplete?: boolean;
}

export const voiceAgentApi = {
  transcribe: async (audioBlob: Blob, lang: "ru" | "uz" = "ru"): Promise<{ text: string }> => {
    const token = getToken();
    const form = new FormData();
    form.append("audio", audioBlob, "recording.webm");
    const res = await fetch(`${BASE_URL}/voice-agent/transcribe?lang=${lang}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Ошибка распознавания" }));
      throw new Error(err.message || "Ошибка распознавания");
    }
    return res.json();
  },

  chat: (sessionId: string | null, message: string, lang: "ru" | "uz" = "ru") =>
    request<VoiceChatResponse>("/voice-agent/chat", {
      method: "POST",
      body: JSON.stringify({ sessionId, message, lang }),
    }),

  synthesize: async (text: string, lang: "ru" | "uz" = "ru"): Promise<Blob | null> => {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/voice-agent/synthesize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text, lang }),
    });
    if (!res.ok) return null; // TTS may be unavailable (503)
    return res.blob();
  },
};

