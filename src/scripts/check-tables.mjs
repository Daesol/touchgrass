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

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Found (not showing for security)' : 'Not found')

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Function to check if a table exists
async function checkTableExists(tableName) {
  try {
    // Try to select a single row from the table
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
    
    // If there's no error, table exists
    if (!error) {
      console.log(`✅ Table '${tableName}' exists.`)
      return true
    }
    
    // If there's an error but not because table doesn't exist, log it
    if (!error.message.includes('does not exist')) {
      console.error(`Error checking table '${tableName}':`, error.message)
    } else {
      console.log(`❌ Table '${tableName}' does not exist.`)
    }
    
    return false
  } catch (err) {
    console.error(`Error checking table '${tableName}':`, err)
    return false
  }
}

// Function to create the tables from SQL file
async function createTables() {
  console.log('\nCreating tables from SQL file...')
  
  try {
    // Read the SQL file
    const sqlFile = resolve(__dirname, '../../supabase-setup.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')
    
    // Split the SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim() !== '')
    
    // Execute each statement
    for (const statement of statements) {
      const trimmedStmt = statement.trim()
      if (trimmedStmt) {
        try {
          // Execute the SQL statement using Supabase's REST API
          const { error } = await supabase.rpc('exec', { query: trimmedStmt + ';' })
            .catch(err => {
              // Special catch - without going into detail, this API isn't directly available
              // in all Supabase instances, so we expect it to fail silently.
              return { error: { message: 'Function unavailable, continuing with direct checks' } }
            })
          
          if (error && !error.message.includes('Function unavailable')) {
            console.error(`❌ Error executing statement: ${error.message}`)
          }
        } catch (stmtErr) {
          // Ignore individual statement errors and continue
          console.warn(`Warning executing statement: ${stmtErr.message}`)
        }
      }
    }
    
    console.log('SQL execution attempts complete.')
  } catch (err) {
    console.error('Error creating tables:', err)
  }
}

// Main function
async function main() {
  console.log('Checking database tables...')
  
  // Check for each required table
  const eventsExists = await checkTableExists('events')
  const contactsExists = await checkTableExists('contacts')
  const actionItemsExists = await checkTableExists('action_items')
  
  // If any table is missing, suggest manual creation
  if (!eventsExists || !contactsExists || !actionItemsExists) {
    console.log('\n⚠️ Some tables are missing. Please create them by:')
    console.log('1. Login to your Supabase dashboard')
    console.log('2. Go to the SQL Editor')
    console.log('3. Create a new query')
    console.log('4. Copy and paste the contents of supabase-setup.sql')
    console.log('5. Execute the query')
    
    // Try to open the SQL file to make it easier
    try {
      // Display a preview of the SQL for convenience
      const sqlFile = resolve(__dirname, '../../supabase-setup.sql')
      const sql = fs.readFileSync(sqlFile, 'utf8')
      console.log('\nSQL Preview (first few lines):')
      console.log(sql.split('\n').slice(0, 10).join('\n') + '\n...')
    } catch (err) {
      console.error('Error reading SQL file:', err)
    }
  } else {
    console.log('\n✅ All required tables exist!')
  }
}

// Run the main function
main() 