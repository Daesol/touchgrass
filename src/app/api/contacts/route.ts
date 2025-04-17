import { NextResponse } from 'next/server';
import { createSupabaseServerActionClient } from '@/lib/supabase/server-client';
import { v4 as uuidv4 } from 'uuid';

// DEVELOPMENT MOCK USER - In production, this would come from auth
// Use a static UUID so that contacts persist between page reloads
const DEV_USER_ID = 'b3f5d3e1-c7a9-4f1b-9c6e-2d5a86bc2e11';
const isDevelopment = process.env.NODE_ENV === 'development';

// Get contact data from client request
function getContactData(body: any) {
  console.log("Request body received:", body);
  
  // Format the voice memo correctly if it exists
  let voiceMemo = null;
  if (body.voiceMemo) {
    voiceMemo = {
      url: body.voiceMemo.url || "",
      transcript: body.voiceMemo.transcript || "",
      key_points: body.voiceMemo.keyPoints || [] // Note: Converting from camelCase to snake_case
    };
  } else {
    voiceMemo = { url: "", transcript: "", key_points: [] };
  }
  
  return {
    event_id: body.eventId || null,
    event_title: body.eventTitle || null,
    linkedin_url: body.linkedinUrl || null,
    name: body.name || 'Unnamed Contact',
    position: body.position || null,
    company: body.company || null,
    summary: body.summary || null,
    voice_memo: voiceMemo,
    rating: body.rating || 0,
    date: body.date ? new Date(body.date) : new Date(),
    // We'll handle action items separately since they go in a different table
    action_items: body.actionItems || []
  };
}

// POST - Create a new contact
export async function POST(request: Request) {
  console.log("POST /api/contacts received");
  
  try {
    // Get request body first to provide better errors
    let body;
    try {
      body = await request.json();
      console.log("Request body:", JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json({ 
        error: "Invalid request body - could not parse JSON",
        details: parseError instanceof Error ? parseError.message : "Unknown error"
      }, { status: 400 });
    }
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ 
        error: "Missing required field: name" 
      }, { status: 400 });
    }
    
    // Use our enhanced server client with cookie handling
    const supabase = createSupabaseServerActionClient();
    let userId = null;
    
    if (isDevelopment) {
      // Use mock user in development
      userId = DEV_USER_ID;
      console.log('Using development user ID:', userId);
    } else {
      // In production, use real auth
      try {
        console.log('Attempting to get user from auth...');
        const authResponse = await supabase.auth.getUser();
        console.log('Auth response received:', JSON.stringify({
          hasUser: !!authResponse.data?.user,
          error: authResponse.error ? authResponse.error.message : null
        }));
        
        const { data: { user }, error: authError } = authResponse;
        
        if (authError) {
          console.error('Authentication error:', authError);
          return NextResponse.json({ error: 'Authentication error', details: authError.message }, { status: 401 });
        }
        
        if (!user) {
          console.error('No user found in session');
          return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
        }
        
        userId = user.id;
        console.log('Authenticated user ID:', userId);
      } catch (authError) {
        console.error('Error checking authentication:', authError);
        return NextResponse.json({ 
          error: 'Error checking authentication',
          details: authError instanceof Error ? authError.message : "Unknown error"
        }, { status: 500 });
      }
    }
    
    const contactData = getContactData(body);
    
    // Create a base insert object with required fields
    const insertData: Record<string, any> = {
      user_id: userId,
      name: contactData.name,
    };
    
    // Add all other fields
    if (contactData.event_id) insertData.event_id = contactData.event_id;
    if (contactData.event_title) insertData.event_title = contactData.event_title;
    if (contactData.linkedin_url) insertData.linkedin_url = contactData.linkedin_url;
    if (contactData.position) insertData.position = contactData.position;
    if (contactData.company) insertData.company = contactData.company;
    if (contactData.summary) insertData.summary = contactData.summary;
    if (contactData.voice_memo) insertData.voice_memo = contactData.voice_memo;
    if (contactData.rating !== undefined) insertData.rating = contactData.rating;
    if (contactData.date) insertData.date = contactData.date;
    
    // Add created_at and updated_at
    insertData.created_at = new Date();
    insertData.updated_at = new Date();
    
    console.log('Inserting contact data:', JSON.stringify(insertData, null, 2));
    
    // First, insert the contact
    try {
      const { data: contactResult, error: contactError } = await supabase
        .from('contacts')
        .insert(insertData)
        .select()
        .single();
      
      if (contactError) {
        console.error('Error creating contact:', contactError);
        return NextResponse.json({ 
          error: contactError.message, 
          details: contactError,
          attemptedData: insertData 
        }, { status: 500 });
      }
      
      // Process action items only if contact was created successfully
      let actionItemsSuccess = true;
      let actionItemsError = null;
      
      // Handle action items in a separate try-catch
      if (contactData.action_items && contactData.action_items.length > 0) {
        console.log('Processing action items:', contactData.action_items);
        
        try {
          // Process in batches of 10 for stability
          for (let i = 0; i < contactData.action_items.length; i += 10) {
            const batch = contactData.action_items.slice(i, i + 10);
            
            const actionItemsToInsert = batch.map((item: any) => {
              console.log('Processing action item:', item);
              return {
                user_id: userId,
                contact_id: contactResult.id,
                text: item.text || 'Untitled task',
                due_date: item.dueDate ? new Date(item.dueDate) : null,
                completed: item.completed || false,
                created_at: new Date(),
                updated_at: new Date()
              };
            });
            
            console.log('Action items batch to insert:', actionItemsToInsert);
            
            const { data: actionItemsData, error } = await supabase
              .from('action_items')
              .insert(actionItemsToInsert)
              .select();
            
            if (error) {
              console.error('Error creating action items:', error);
              actionItemsSuccess = false;
              actionItemsError = error;
              break;
            } else {
              console.log('Successfully inserted action items batch:', actionItemsData);
            }
          }
        } catch (actionError) {
          console.error('Exception processing action items:', actionError);
          actionItemsSuccess = false;
          actionItemsError = actionError;
        }
      }
      
      console.log('Successfully created contact:', contactResult);
      
      // Return the contact with action item status
      return NextResponse.json({
        ...contactResult,
        actionItemsStatus: actionItemsSuccess ? 'success' : 'error',
        actionItemsError: actionItemsError ? 
          (actionItemsError instanceof Error ? actionItemsError.message : JSON.stringify(actionItemsError)) 
          : null
      }, { 
        status: 201,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } catch (dbError) {
      console.error('Database error creating contact:', dbError);
      return NextResponse.json({ 
        error: 'Database error creating contact',
        details: dbError instanceof Error ? dbError.message : JSON.stringify(dbError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error in contact creation:', error);
    return NextResponse.json({ 
      error: 'Failed to create contact',
      details: error instanceof Error ? error.message : JSON.stringify(error),
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  }
}

// GET - Fetch all contacts for current user
export async function GET(request: Request) {
  console.log('--- API: /api/contacts GET handler started ---');
  try {
    const supabase = createSupabaseServerActionClient();
    let userId = null;
    
    if (isDevelopment) {
      // Use mock user in development
      userId = DEV_USER_ID;
      console.log('Using development user ID for fetching contacts:', userId);
    } else {
      // In production, use real auth
      console.log('Attempting to get user from auth...');
      const authResponse = await supabase.auth.getUser();
      console.log('Auth response received:', JSON.stringify({
        hasUser: !!authResponse.data?.user,
        error: authResponse.error ? authResponse.error.message : null
      }));
      
      const { data: { user }, error: authError } = authResponse;
      
      if (authError) {
        console.error('Auth error details:', authError);
        return NextResponse.json({ 
          error: 'Authentication error', 
          details: authError.message 
        }, { status: 401 });
      }
      
      if (!user) {
        console.error('No user found in session');
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
      }
      
      userId = user.id;
      console.log('Authenticated user ID:', userId);
    }
    
    // Get the URL parameters
    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');
    
    // Start building the query
    console.log('Fetching contacts for user:', userId);
    let query = supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId);
    
    // Filter by event if provided
    if (eventId) {
      console.log('Filtering by event ID:', eventId);
      query = query.eq('event_id', eventId);
    }
    
    // Execute the query
    const { data: contacts, error: contactsError } = await query
      .order('created_at', { ascending: false });
    
    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      return NextResponse.json({ error: contactsError.message }, { status: 500 });
    }
    
    console.log(`Successfully fetched ${contacts?.length || 0} contacts`);
    
    // For each contact, get its action items
    const contactsWithActions = await Promise.all(contacts.map(async (contact: any) => {
      try {
        const { data: actionItems, error: actionItemsError } = await supabase
          .from('action_items')
          .select('*')
          .eq('contact_id', contact.id)
          .order('due_date', { ascending: true });
        
        if (actionItemsError) {
          console.error(`Error fetching action items for contact ${contact.id}:`, actionItemsError);
          return contact;
        }
        
        // Transform database fields to client-side format
        const transformedContact = {
          id: contact.id,
          eventId: contact.event_id || "",
          eventTitle: contact.event_title || "",
          linkedinUrl: contact.linkedin_url || "",
          name: contact.name || "",
          position: contact.position || "",
          company: contact.company || "",
          summary: contact.summary || "",
          voiceMemo: {
            url: contact.voice_memo?.url || "",
            transcript: contact.voice_memo?.transcript || "",
            keyPoints: contact.voice_memo?.key_points || []
          },
          actionItems: (actionItems || []).map((item: any) => ({
            id: item.id,
            text: item.text,
            dueDate: item.due_date ? new Date(item.due_date).toISOString().split('T')[0] : "",
            completed: item.completed || false
          })),
          rating: contact.rating || 0,
          date: contact.date ? new Date(contact.date).toLocaleDateString() : new Date().toLocaleDateString()
        };
        
        return transformedContact;
      } catch (error) {
        console.error(`Error processing contact ${contact.id}:`, error);
        return contact;
      }
    }));
    
    return NextResponse.json(contactsWithActions);
  } catch (error) {
    console.error('Exception in contacts fetch:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch contacts',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 