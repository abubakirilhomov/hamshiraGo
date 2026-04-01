-- Migration: 004_consultations
-- AI Agent + Online Consultations module
-- Run manually on Railway PostgreSQL

-- ============================================================
-- 1. doctors table
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  "nameUz" VARCHAR(100),
  specialization VARCHAR(100) NOT NULL,
  "specializationUz" VARCHAR(100),
  bio TEXT,
  "photoUrl" VARCHAR(500),
  "pricePerConsultation" INT NOT NULL,
  phone VARCHAR(20),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  rating DECIMAL(2, 1) NOT NULL DEFAULT 0,
  "consultationCount" INT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. consultations table
-- ============================================================
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clientId" UUID NOT NULL,
  "doctorId" UUID NOT NULL REFERENCES doctors(id),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  symptoms TEXT,
  "suggestedSpecialization" VARCHAR(100),
  "doctorNotes" TEXT,
  "createdOrderId" UUID,
  price INT NOT NULL,
  "platformFee" INT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consultations_client_id ON consultations ("clientId");
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON consultations ("doctorId");
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations (status);

-- ============================================================
-- 3. chat_messages table
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "consultationId" UUID,
  "userId" UUID NOT NULL,
  role VARCHAR(10) NOT NULL,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_consultation_id ON chat_messages ("consultationId");

-- ============================================================
-- 4. Seed sample doctors
-- ============================================================
INSERT INTO doctors (name, "nameUz", specialization, "specializationUz", bio, "pricePerConsultation", "isActive", rating)
VALUES
  ('Каримов Алишер Бахтиёрович', 'Karimov Alisher Baxtiyor o''g''li', 'Терапевт', 'Terapevt', 'Врач-терапевт высшей категории с 15-летним опытом работы.', 80000, true, 4.8),
  ('Рахимова Нилуфар Абдуллаевна', 'Rahimova Nilufar Abdullayevna', 'Кардиолог', 'Kardiolog', 'Кардиолог, специалист по диагностике и лечению сердечно-сосудистых заболеваний.', 120000, true, 4.9),
  ('Хасанов Жавохир Тимурович', 'Xasanov Javohir Timurovich', 'Невролог', 'Nevrolog', 'Невролог с опытом работы в области нейрореабилитации.', 100000, true, 4.7),
  ('Исмоилова Дилноза Шухратовна', 'Ismoilova Dilnoza Shuhratovna', 'Педиатр', 'Pediatr', 'Детский врач, опыт работы более 10 лет. Внимательное отношение к маленьким пациентам.', 70000, true, 4.9),
  ('Назаров Фаррух Олимжонович', 'Nazarov Farrux Olimjonovich', 'Гастроэнтеролог', 'Gastroenterolog', 'Специалист по заболеваниям ЖКТ и печени.', 90000, true, 4.6),
  ('Турсунова Мадина Бахромовна', 'Tursunova Madina Baxromovna', 'ЛОР', 'LOR', 'ЛОР-врач, диагностика и лечение заболеваний уха, горла и носа.', 85000, true, 4.7);
