import { NextResponse } from 'next/server';
import { createSupabaseServerActionClient } from '@/lib/supabase/server-client';
import { v4 as uuidv4 } from 'uuid';

// DEVELOPMENT MOCK USER - In production, this would come from auth
// Use a static UUID so that events persist between page reloads
const DEV_USER_ID = 'b3f5d3e1-c7a9-4f1b-9c6e-2d5a86bc2e11';
const isDevelopment = process.env.NODE_ENV === 'development';

// Get event data from client request
function getEventData(body: any) {
  return {
    title: body.title || 'Untitled Event',
    location: body.location || null,
    // Store company directly if we have a company field in the DB
    company: body.company || null,
    date: new Date(body.date || new Date()),
    color_index: body.colorIndex || '0',
  };
}

// POST - Create a new event
export async function POST(request: Request) {
  console.log('--- API: /api/events POST handler started ---');
  try {
    // Use our enhanced server client with cookie handling
    const supabase = createSupabaseServerActionClient();
    let userId = null;
    
    if (isDevelopment) {
      // Use mock user in development
      userId = DEV_USER_ID;
      console.log('Using development user ID:', userId);
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
    
    // Parse request body
    const body = await request.json();
    const eventData = getEventData(body);
    
    // Check the table structure to see what columns are available
    const { data: tableInfo, error: tableError } = await supabase
      .from('events')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error checking table structure:', tableError);
    } else {
      // If we got data back, log the first row to see the schema
      if (tableInfo && tableInfo.length > 0) {
        console.log('Available columns in events table:', Object.keys(tableInfo[0]));
      } else {
        console.log('No existing events found to determine schema');
      }
    }
    
    // Create a base insert object with required fields
    const insertData: Record<string, any> = {
      user_id: userId,
      title: eventData.title,
      date: eventData.date,
      color_index: eventData.color_index,
    };
    
    // Only add optional fields if they exist
    if (eventData.location) {
      insertData.location = eventData.location;
    }
    
    // Add created_at and updated_at if the table has those columns
    // (Most Supabase tables have these by default)
    if (!tableError && tableInfo && tableInfo.length > 0) {
      const sampleRow = tableInfo[0];
      if ('created_at' in sampleRow) {
        insertData.created_at = new Date();
      }
      if ('updated_at' in sampleRow) {
        insertData.updated_at = new Date();
      }
      // Add company field only if it exists in the schema
      if ('company' in sampleRow && eventData.company) {
        insertData.company = eventData.company;
      }
      // Add description field if it exists (often used for notes)
      if ('description' in sampleRow) {
        insertData.description = eventData.company ? 
          `Company: ${eventData.company}` : null;
      }
    } else {
      // Fallback if we couldn't check the schema
      insertData.created_at = new Date();
      insertData.updated_at = new Date();
    }
    
    console.log('Inserting event data:', insertData);
    
    const { data, error } = await supabase
      .from('events')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in event creation:', error);
    return NextResponse.json({ 
      error: 'Failed to create event',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// GET - Fetch all events for current user
export async function GET(request: Request) {
  console.log('--- API: /api/events GET handler started ---');
  try {
    // Use our enhanced server client with cookie handling
    const supabase = createSupabaseServerActionClient();
    let userId = null;
    
    if (isDevelopment) {
      // Use mock user in development
      userId = DEV_USER_ID;
      console.log('Using development user ID for fetching events:', userId);
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
    
    // Get events
    console.log('Fetching events for user:', userId);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log(`Successfully fetched ${data?.length || 0} events`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Exception in events fetch:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch events',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 