-- SQL script to update contacts table if needed

-- Check if the contacts table exists, if not create it
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  event_id UUID REFERENCES public.events(id),
  event_title TEXT,
  linkedin_url TEXT,
  name TEXT NOT NULL,
  position TEXT,
  company TEXT,
  summary TEXT,
  voice_memo JSONB DEFAULT '{"url": "", "transcript": "", "key_points": []}',
  rating INTEGER,
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check if the action_items table exists, if not create it
CREATE TABLE IF NOT EXISTS public.action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  due_date DATE,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist
DO $$
BEGIN
    -- For contacts table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_url') THEN
        ALTER TABLE public.contacts ADD COLUMN linkedin_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'voice_memo') THEN
        ALTER TABLE public.contacts ADD COLUMN voice_memo JSONB DEFAULT '{"url": "", "transcript": "", "key_points": []}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'event_title') THEN
        ALTER TABLE public.contacts ADD COLUMN event_title TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'summary') THEN
        ALTER TABLE public.contacts ADD COLUMN summary TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'rating') THEN
        ALTER TABLE public.contacts ADD COLUMN rating INTEGER;
    END IF;
    
    -- For action_items table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'action_items' AND column_name = 'due_date') THEN
        ALTER TABLE public.action_items ADD COLUMN due_date DATE;
    END IF;
END
$$;

-- Enable Row Level Security if not already enabled
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contacts if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'contacts' AND policyname = 'Users can view their own contacts'
    ) THEN
        CREATE POLICY "Users can view their own contacts" 
        ON public.contacts FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'contacts' AND policyname = 'Users can insert their own contacts'
    ) THEN
        CREATE POLICY "Users can insert their own contacts" 
        ON public.contacts FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'contacts' AND policyname = 'Users can update their own contacts'
    ) THEN
        CREATE POLICY "Users can update their own contacts" 
        ON public.contacts FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'contacts' AND policyname = 'Users can delete their own contacts'
    ) THEN
        CREATE POLICY "Users can delete their own contacts" 
        ON public.contacts FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
    
    -- Create RLS policies for action_items if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'action_items' AND policyname = 'Users can view their own action items'
    ) THEN
        CREATE POLICY "Users can view their own action items" 
        ON public.action_items FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'action_items' AND policyname = 'Users can insert their own action items'
    ) THEN
        CREATE POLICY "Users can insert their own action items" 
        ON public.action_items FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'action_items' AND policyname = 'Users can update their own action items'
    ) THEN
        CREATE POLICY "Users can update their own action items" 
        ON public.action_items FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'action_items' AND policyname = 'Users can delete their own action items'
    ) THEN
        CREATE POLICY "Users can delete their own action items" 
        ON public.action_items FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END
$$; 