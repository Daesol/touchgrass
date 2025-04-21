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

// Function to read SQL from file
function readSqlFromFile() {
  const filePath = resolve(__dirname, '../../create-profile-table.sql')
  return fs.readFileSync(filePath, 'utf8')
}

// Create Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

// Function to execute Supabase SQL query
async function executeSQL() {
  console.log('Setting up profiles table...')
  
  try {
    // Read SQL from file
    const profileSQL = readSqlFromFile()
    
    if (supabaseServiceKey) {
      // Execute SQL if we have service role key
      const { error } = await supabase.rpc('exec_sql', { sql: profileSQL })
      
      if (error) {
        console.error('Error executing SQL:', error.message)
        console.log('\nPlease execute the SQL manually using the Supabase dashboard SQL editor.')
      } else {
        console.log('✅ Successfully set up profiles table!')
        
        // Verify table was created
        await verifyProfileTable()
      }
    } else {
      console.log('⚠️ No service role key provided. Unable to execute SQL directly.')
      console.log('Please execute the SQL in create-profile-table.sql manually using the Supabase dashboard SQL editor.')
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    console.log('\nPlease execute the SQL manually using the Supabase dashboard SQL editor.')
  }
}

async function verifyProfileTable() {
  try {
    console.log('\nVerifying profiles table...')
    
    // Check profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Error verifying profiles table:', error.message)
    } else {
      console.log('✅ Profiles table exists')
    }
  } catch (error) {
    console.error('Error during verification:', error)
  }
}

// Execute the SQL setup
executeSQL() 