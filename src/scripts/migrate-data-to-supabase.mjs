import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function promptForCredentials() {
  return new Promise((resolve) => {
    rl.question('Enter your email: ', (email) => {
      rl.question('Enter your password: ', async (password) => {
        resolve({ email, password })
      })
    })
  })
}

async function promptForLocalStorageData() {
  return new Promise((resolve) => {
    console.log('\nYou need to provide the data from your localStorage to migrate:')
    console.log('1. Open your browser\'s developer tools (F12)')
    console.log('2. Go to Application tab > Storage > Local Storage')
    console.log('3. Find and copy the values for "networkProEvents" and "networkProContacts"')
    
    rl.question('Paste networkProEvents JSON data (or enter "skip" to skip): ', (eventsData) => {
      rl.question('Paste networkProContacts JSON data (or enter "skip" to skip): ', (contactsData) => {
        resolve({
          events: eventsData === 'skip' ? [] : JSON.parse(eventsData || '[]'),
          contacts: contactsData === 'skip' ? [] : JSON.parse(contactsData || '[]')
        })
      })
    })
  })
}

async function migrateData() {
  console.log('Starting data migration to Supabase...')
  
  try {
    // Sign in to get a user id
    const credentials = await promptForCredentials()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    })
    
    if (authError) {
      console.error('Authentication error:', authError.message)
      console.log('Make sure you have signed up first and verified your email.')
      rl.close()
      return
    }
    
    const user = authData.user
    console.log(`Signed in as ${user.email} (User ID: ${user.id})`)
    
    // Get local storage data
    const { events, contacts } = await promptForLocalStorageData()
    
    if (events.length === 0 && contacts.length === 0) {
      console.log('No data to migrate. Exiting.')
      rl.close()
      return
    }
    
    // Migrate events
    if (events.length > 0) {
      console.log(`\nMigrating ${events.length} events...`)
      
      // Add user_id to each event
      const eventsWithUserId = events.map(event => ({
        ...event,
        user_id: user.id,
        // Convert string date to proper format if needed
        date: new Date(event.date).toISOString().split('T')[0]
      }))
      
      // Insert events
      const { data: insertedEvents, error: eventsError } = await supabase
        .from('events')
        .insert(eventsWithUserId)
        .select()
      
      if (eventsError) {
        console.error('Error inserting events:', eventsError.message)
      } else {
        console.log(`✅ Successfully migrated ${eventsWithUserId.length} events`)
        
        // Save ID mapping for reference with contacts
        const eventIdMapping = {}
        eventsWithUserId.forEach((oldEvent, index) => {
          if (insertedEvents && insertedEvents[index]) {
            eventIdMapping[oldEvent.id] = insertedEvents[index].id
          }
        })
        
        // Migrate contacts if there are any
        if (contacts.length > 0) {
          console.log(`\nMigrating ${contacts.length} contacts...`)
          
          // Process action items separately
          const actionItems = []
          
          // Add user_id to each contact and update event_id references
          const contactsWithUserId = contacts.map(contact => {
            // Extract action items to insert separately
            if (contact.actionItems && contact.actionItems.length > 0) {
              contact.actionItems.forEach(item => {
                actionItems.push({
                  ...item,
                  user_id: user.id,
                  contact_id: null, // Will update after contact insert
                  due_date: new Date(item.dueDate).toISOString().split('T')[0]
                })
              })
            }
            
            // Prepare contact object
            return {
              ...contact,
              user_id: user.id,
              // Update event_id reference if needed
              event_id: eventIdMapping[contact.eventId] || contact.eventId,
              // Convert string date to proper format if needed
              date: new Date(contact.date).toISOString().split('T')[0],
              // Convert action items and voice memo to proper format
              voice_memo: typeof contact.voiceMemo === 'string' 
                ? JSON.parse(contact.voiceMemo) 
                : contact.voiceMemo
            }
          })
          
          // Remove action items property as it's now in a separate table
          contactsWithUserId.forEach(contact => {
            delete contact.actionItems
          })
          
          // Insert contacts
          const { data: insertedContacts, error: contactsError } = await supabase
            .from('contacts')
            .insert(contactsWithUserId)
            .select()
          
          if (contactsError) {
            console.error('Error inserting contacts:', contactsError.message)
          } else {
            console.log(`✅ Successfully migrated ${contactsWithUserId.length} contacts`)
            
            // Update action items with contact_id
            if (actionItems.length > 0) {
              console.log(`\nMigrating ${actionItems.length} action items...`)
              
              // Create contact ID mapping
              const contactIdMapping = {}
              contactsWithUserId.forEach((oldContact, index) => {
                if (insertedContacts && insertedContacts[index]) {
                  contactIdMapping[oldContact.id] = insertedContacts[index].id
                }
              })
              
              // Update contact_id in action items
              for (let i = 0; i < actionItems.length; i++) {
                const item = actionItems[i]
                const originalContact = contacts.find(c => 
                  c.actionItems && c.actionItems.some(a => a.id === item.id)
                )
                if (originalContact && contactIdMapping[originalContact.id]) {
                  item.contact_id = contactIdMapping[originalContact.id]
                }
              }
              
              // Insert action items
              const { data: insertedItems, error: itemsError } = await supabase
                .from('action_items')
                .insert(actionItems)
              
              if (itemsError) {
                console.error('Error inserting action items:', itemsError.message)
              } else {
                console.log(`✅ Successfully migrated ${actionItems.length} action items`)
              }
            }
          }
        }
      }
    }
    
    console.log('\nData migration completed!')
  } catch (error) {
    console.error('Unexpected error during migration:', error)
  } finally {
    rl.close()
  }
}

migrateData() 