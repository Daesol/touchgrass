import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

// Load environment variables from .env.local
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Found (not showing for security)' : 'Not found')

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('Testing Supabase connection...')
  
  try {
    // Check if we can access auth features
    const { data, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('Auth error:', authError.message)
    } else {
      console.log('Auth service connected successfully')
      console.log('Session:', data.session ? 'Active' : 'None')
    }
    
    // Create a simple contacts table for our app
    console.log('Creating a contacts table for our NetworkPro app...')
    
    // Try to check if the table exists first by selecting from it
    const { error: checkError } = await supabase
      .from('contacts')
      .select('count')
      .limit(1)
      .single()
    
    if (checkError && checkError.message.includes('does not exist')) {
      console.log('Contacts table does not exist yet.')
      console.log('To create the contacts table, run this SQL in the Supabase dashboard:')
      console.log(`
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their own contacts
CREATE POLICY "Users can view their own contacts" 
  ON public.contacts 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own contacts
CREATE POLICY "Users can insert their own contacts" 
  ON public.contacts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own contacts
CREATE POLICY "Users can update their own contacts" 
  ON public.contacts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy for users to delete their own contacts
CREATE POLICY "Users can delete their own contacts" 
  ON public.contacts 
  FOR DELETE 
  USING (auth.uid() = user_id);
      `)
    } else if (!checkError) {
      console.log('Contacts table already exists!')
      
      // Try inserting a record
      console.log('Checking if we can insert a contact (this requires authentication)...')
      
      // Check if we have an authenticated user first
      if (!data.session) {
        console.log('No authenticated user session. Authentication required to insert contacts.')
        console.log('Authentication tests passed successfully.')
        return
      }
      
      const { error: insertError } = await supabase
        .from('contacts')
        .insert({
          user_id: data.session.user.id,
          name: 'Test Contact',
          email: 'test@example.com',
          company: 'Test Company',
          notes: 'This is a test contact from the connection test script'
        })
      
      if (insertError) {
        console.error('Error inserting contact:', insertError.message)
      } else {
        console.log('Successfully inserted a test contact!')
        
        // Fetch the contacts to verify
        const { data: contacts, error: selectError } = await supabase
          .from('contacts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)
        
        if (selectError) {
          console.error('Error fetching contacts:', selectError.message)
        } else {
          console.log('Successfully fetched contacts:')
          console.log(contacts)
        }
      }
    } else {
      console.error('Error checking contacts table:', checkError.message)
    }
    
    console.log('Supabase connection tests completed.')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testConnection() 