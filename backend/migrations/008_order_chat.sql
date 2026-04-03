-- 008_order_chat.sql
-- Add orderId column to chat_messages for client ↔ medic chat within orders

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'orderId'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN "orderId" UUID;
    CREATE INDEX IF NOT EXISTS idx_chat_messages_order ON chat_messages ("orderId");
  END IF;
END $$;
