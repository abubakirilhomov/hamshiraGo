-- 007_video_consultations.sql
-- Add video call fields to consultations table

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultations' AND column_name = 'videoRoomName'
  ) THEN
    ALTER TABLE consultations ADD COLUMN "videoRoomName" VARCHAR(255);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultations' AND column_name = 'videoStatus'
  ) THEN
    ALTER TABLE consultations ADD COLUMN "videoStatus" VARCHAR(20);
  END IF;
END $$;
