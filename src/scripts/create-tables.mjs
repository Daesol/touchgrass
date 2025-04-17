import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

// Load environment variables from .env.local
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Found (not showing for security)' : 'Not found')

// Create a readline interface for prompting the user
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Main function
async function createTables() {
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Authenticate the user to ensure proper permissions
    console.log('\nAuthentication required to create tables:')
    const email = await new Promise(resolve => rl.question('Email: ', resolve))
    const password = await new Promise(resolve => rl.question('Password: ', resolve))
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email, password
    })
    
    if (authError) {
      console.error('Authentication error:', authError.message)
      rl.close()
      return
    }
    
    console.log('Successfully authenticated as', authData.user.email)
    
    // Create events table
    console.log('\nCreating events table...')
    const { error: eventsError } = await supabase.rpc('create_events_table', {}).catch(err => {
      console.log('Using direct query instead of RPC...')
      return supabase.from('events').insert(null).select().limit(0)
    })
    
    if (eventsError && eventsError.message.includes('does not exist')) {
      console.log('Creating events table directly...')
      
      // Create the events table
      const createEventsTable = `
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
      `
      
      // Execute the query directly through the SQL endpoint
      const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createEventsTable }).catch(err => {
        console.error('SQL execution not supported via RPC. Please create tables manually.')
        return { error: { message: 'SQL execution not supported' } }
      })
      
      if (sqlError) {
        console.error('Error creating events table:', sqlError.message)
        console.log('Please create the tables manually using the Supabase SQL Editor.')
        console.log('Copy the SQL from supabase-setup.sql and execute it in the SQL Editor.')
      } else {
        console.log('Events table created successfully!')
      }
    } else if (!eventsError) {
      console.log('Events table already exists or was created successfully!')
    }
    
    // Check if events table exists
    const { data: eventsData, error: eventsCheckError } = await supabase
      .from('events')
      .select('*')
      .limit(1)
    
    if (!eventsCheckError) {
      console.log('✅ Events table confirmed to exist')
    } else {
      console.error('❌ Events table does not exist:', eventsCheckError.message)
      console.log('\nPlease create the tables manually using the Supabase SQL Editor.')
      console.log('Copy the SQL from supabase-setup.sql and execute it there.')
      rl.close()
      return
    }
    
    // Create contacts table if events table exists
    console.log('\nCreating contacts table...')
    const { error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .limit(1)
      .catch(() => ({ error: { message: 'does not exist' } }))
    
    if (contactsError && contactsError.message.includes('does not exist')) {
      console.log('Contacts table does not exist yet. Please create it manually.')
    } else {
      console.log('✅ Contacts table already exists')
    }
    
    // Create action_items table if events table exists
    console.log('\nChecking action_items table...')
    const { error: actionItemsError } = await supabase
      .from('action_items')
      .select('*')
      .limit(1)
      .catch(() => ({ error: { message: 'does not exist' } }))
    
    if (actionItemsError && actionItemsError.message.includes('does not exist')) {
      console.log('Action items table does not exist yet. Please create it manually.')
    } else {
      console.log('✅ Action items table already exists')
    }
    
    console.log('\nSummary:')
    console.log('- Events table:', !eventsCheckError ? 'Exists' : 'Missing')
    console.log('- Contacts table:', !contactsError ? 'Exists' : 'Missing')
    console.log('- Action items table:', !actionItemsError ? 'Exists' : 'Missing')
    
    if (eventsCheckError || contactsError || actionItemsError) {
      console.log('\n⚠️ Some tables are missing. Please create them manually:')
      console.log('1. Login to your Supabase dashboard')
      console.log('2. Go to the SQL Editor')
      console.log('3. Create a new query')
      console.log('4. Copy and paste the contents of supabase-setup.sql')
      console.log('5. Execute the query')
    }
    
    rl.close()
  } catch (error) {
    console.error('Unexpected error:', error)
    rl.close()
  }
}

// Run the main function
createTables() 