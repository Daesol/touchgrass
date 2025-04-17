-- Script to update the contacts table schema for proper key_points handling in voice_memo

-- Check and update the voice_memo column to use consistent key naming
UPDATE public.contacts
SET voice_memo = jsonb_build_object(
  'url', COALESCE(voice_memo->>'url', ''),
  'transcript', COALESCE(voice_memo->>'transcript', ''),
  'key_points', COALESCE(
    CASE 
      WHEN voice_memo->>'keyPoints' IS NOT NULL THEN 
        -- Convert existing keyPoints array to key_points 
        voice_memo->'keyPoints'
      WHEN voice_memo->'key_points' IS NULL THEN
        -- Create empty array if none exists
        '[]'::jsonb
      ELSE
        -- Use existing key_points if present
        voice_memo->'key_points'
    END,
    '[]'::jsonb
  )
)
WHERE voice_memo IS NOT NULL;

-- Check for action items with null fields and fix them
UPDATE public.action_items
SET text = 'Unnamed task' 
WHERE text IS NULL;

UPDATE public.action_items
SET completed = false
WHERE completed IS NULL;

-- Add index to improve query performance
CREATE INDEX IF NOT EXISTS contacts_event_id_idx ON public.contacts(event_id);
CREATE INDEX IF NOT EXISTS action_items_contact_id_idx ON public.action_items(contact_id);

-- Verify the schema is correct
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('contacts', 'action_items')
ORDER BY table_name, ordinal_position; 