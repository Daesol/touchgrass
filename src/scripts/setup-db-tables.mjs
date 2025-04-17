import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

// Load environment variables from .env.local
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Service Role Key:', supabaseServiceKey ? 'Found (not showing for security)' : 'Not found')

// Function to write SQL to a file for manual execution if needed
function writeSqlToFile(sql) {
  const filePath = resolve(__dirname, '../../supabase-setup.sql')
  fs.writeFileSync(filePath, sql)
  console.log(`SQL written to file: ${filePath}`)
}

// Create Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

// SQL to create all necessary tables for the application
const setupSQL = `
-- Events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  location TEXT,
  company TEXT,
  date DATE NOT NULL,
  color_index TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts table
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

-- Action Items table
CREATE TABLE IF NOT EXISTS public.action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  contact_id UUID REFERENCES public.contacts(id),
  text TEXT NOT NULL,
  due_date DATE,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for events
CREATE POLICY "Users can view their own events" 
  ON public.events FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events" 
  ON public.events FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" 
  ON public.events FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" 
  ON public.events FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for contacts
CREATE POLICY "Users can view their own contacts" 
  ON public.contacts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts" 
  ON public.contacts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" 
  ON public.contacts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" 
  ON public.contacts FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for action items
CREATE POLICY "Users can view their own action items" 
  ON public.action_items FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own action items" 
  ON public.action_items FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own action items" 
  ON public.action_items FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own action items" 
  ON public.action_items FOR DELETE 
  USING (auth.uid() = user_id);

-- Create functions for maintaining updated_at
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for maintaining updated_at
CREATE TRIGGER events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER action_items_updated_at
BEFORE UPDATE ON public.action_items
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
`;

// Function to execute Supabase SQL query
async function executeSQL() {
  console.log('Setting up database tables...')
  
  try {
    // Save SQL to file for reference
    writeSqlToFile(setupSQL)
    
    if (supabaseServiceKey) {
      // Execute SQL if we have service role key
      const { error } = await supabase.rpc('exec_sql', { sql: setupSQL })
      
      if (error) {
        console.error('Error executing SQL:', error.message)
        console.log('\nPlease execute the SQL manually using the Supabase dashboard SQL editor.')
      } else {
        console.log('✅ Successfully set up database tables!')
        
        // Verify tables were created
        await verifyTables()
      }
    } else {
      console.log('⚠️ No service role key provided. Unable to execute SQL directly.')
      console.log('Please execute the SQL in supabase-setup.sql manually using the Supabase dashboard SQL editor.')
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    console.log('\nPlease execute the SQL manually using the Supabase dashboard SQL editor.')
  }
}

async function verifyTables() {
  try {
    console.log('\nVerifying database tables...')
    
    // Check events table
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(1)
    
    if (eventsError) {
      console.error('Error verifying events table:', eventsError.message)
    } else {
      console.log('✅ Events table exists')
    }
    
    // Check contacts table
    const { data: contactsData, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .limit(1)
    
    if (contactsError) {
      console.error('Error verifying contacts table:', contactsError.message)
    } else {
      console.log('✅ Contacts table exists')
    }
    
    // Check action_items table
    const { data: actionItemsData, error: actionItemsError } = await supabase
      .from('action_items')
      .select('*')
      .limit(1)
    
    if (actionItemsError) {
      console.error('Error verifying action_items table:', actionItemsError.message)
    } else {
      console.log('✅ Action Items table exists')
    }
  } catch (error) {
    console.error('Error verifying tables:', error)
  }
}

executeSQL() 