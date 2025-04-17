'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import type { Event, Contact, ActionItem } from '@/contexts/SupabaseProvider';

// Create context
export const ClientSupabaseContext = createContext<{
  events: Event[];
  contacts: Contact[];
  actionItems: ActionItem[];
  loading: boolean;
  addEvent: (event: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Event>;
  updateEvent: (event: Partial<Event> & { id: string }) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getContacts: (eventId?: string) => Promise<Contact[]>;
  addContact: (contact: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Contact>;
  updateContact: (contact: Partial<Contact> & { id: string }) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  addActionItem: (actionItem: Omit<ActionItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<ActionItem>;
  updateActionItem: (actionItem: Partial<ActionItem> & { id: string }) => Promise<void>;
  deleteActionItem: (id: string) => Promise<void>;
} | null>(null);

// Hook to use the context
export function useClientSupabase() {
  const context = useContext(ClientSupabaseContext);
  if (!context) {
    throw new Error('useClientSupabase must be used within a SupabaseProvider');
  }
  return context;
}

// Provider component
export function SupabaseProviderClient({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Initialize data and set up auth listener
  useEffect(() => {
    async function getInitialData() {
      try {
        setLoading(true);
        
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          
          // Fetch initial data
          await fetchEvents();
          await fetchContacts();
          await fetchActionItems();
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setLoading(false);
      }
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          // Don't trigger UI updates for certain events to avoid redirect loops
          if (event === 'INITIAL_SESSION') {
            // Just set the user state without triggering data refreshes
            setUser(session?.user || null);
            return;
          }
          
          console.log('Auth state change:', event);
          const currentUser = session?.user;
          setUser(currentUser || null);
          
          if (currentUser) {
            // Refresh data when user logs in
            await fetchEvents();
            await fetchContacts();
            await fetchActionItems();
          } else {
            // Clear data when user logs out
            setEvents([]);
            setContacts([]);
            setActionItems([]);
            
            // If the user was signed out and we're not already on the login page,
            // avoid router.refresh() which could cause a loop
            if (event === 'SIGNED_OUT' && typeof window !== 'undefined' && 
                !window.location.pathname.includes('/login')) {
              console.log('User signed out, redirecting to login');
              window.location.href = '/login?clear_session=true';
              return;
            }
          }
          
          // Only refresh if we're not in a sign out scenario
          if (event !== 'SIGNED_OUT') {
            // Use a timeout to avoid potential race conditions during refresh
            setTimeout(() => {
              try {
                router.refresh();
              } catch (refreshError) {
                console.error('Error during router refresh:', refreshError);
              }
            }, 0);
          }
        } catch (error) {
          console.error('Error in auth state change listener:', error);
        }
      }
    );

    getInitialData();

    return () => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from auth state change:', error);
      }
    };
  }, [supabase, router]);

  // Fetch events
  async function fetchEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }

  // Fetch contacts
  async function fetchContacts(eventId?: string) {
    try {
      let query = supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // If fetching all contacts, update the state
      if (!eventId) {
        setContacts(data || []);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  }

  // Fetch action items
  async function fetchActionItems(contactId?: string) {
    try {
      let query = supabase
        .from('action_items')
        .select('*')
        .order('due_date', { ascending: true });

      if (contactId) {
        query = query.eq('contact_id', contactId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // If fetching all action items, update the state
      if (!contactId) {
        setActionItems(data || []);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching action items:', error);
      return [];
    }
  }

  // Add event
  async function addEvent(event: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Event> {
    try {
      // We don't need to create an ID here, Supabase will generate one
      const { data, error } = await supabase
        .from('events')
        .insert([event])
        .select()
        .single();

      if (error) throw error;
      
      // Refresh events list
      await fetchEvents();
      
      return data;
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  }

  // Update event
  async function updateEvent(event: Partial<Event> & { id: string }): Promise<void> {
    try {
      const { id, ...updateData } = event;
      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      // Refresh events list
      await fetchEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  // Delete event
  async function deleteEvent(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh events list
      await fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  // Add contact
  async function addContact(contact: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Contact> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([contact])
        .select()
        .single();

      if (error) throw error;
      
      // Refresh contacts list
      await fetchContacts();
      
      return data;
    } catch (error) {
      console.error('Error adding contact:', error);
      throw error;
    }
  }

  // Update contact
  async function updateContact(contact: Partial<Contact> & { id: string }): Promise<void> {
    try {
      const { id, ...updateData } = contact;
      const { error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      // Refresh contacts list
      await fetchContacts();
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  // Delete contact
  async function deleteContact(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh contacts list
      await fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  // Add action item
  async function addActionItem(actionItem: Omit<ActionItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ActionItem> {
    try {
      const { data, error } = await supabase
        .from('action_items')
        .insert([actionItem])
        .select()
        .single();

      if (error) throw error;
      
      // Refresh action items list
      await fetchActionItems();
      
      return data;
    } catch (error) {
      console.error('Error adding action item:', error);
      throw error;
    }
  }

  // Update action item
  async function updateActionItem(actionItem: Partial<ActionItem> & { id: string }): Promise<void> {
    try {
      const { id, ...updateData } = actionItem;
      const { error } = await supabase
        .from('action_items')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      // Refresh action items list
      await fetchActionItems();
    } catch (error) {
      console.error('Error updating action item:', error);
      throw error;
    }
  }

  // Delete action item
  async function deleteActionItem(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('action_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh action items list
      await fetchActionItems();
    } catch (error) {
      console.error('Error deleting action item:', error);
      throw error;
    }
  }

  // Create the context value
  const value = {
    events,
    contacts,
    actionItems,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    getContacts: fetchContacts,
    addContact,
    updateContact,
    deleteContact,
    addActionItem,
    updateActionItem,
    deleteActionItem,
  };

  return (
    <ClientSupabaseContext.Provider value={value}>
      {children}
    </ClientSupabaseContext.Provider>
  );
}

// Safe error boundary for provider
function SafeSupabaseProvider({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Add global error handler
    const errorHandler = () => {
      setHasError(true);
    };
    
    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', errorHandler);
    
    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', errorHandler);
    };
  }, []);

  if (hasError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <div className="mb-6 text-red-500">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-20 w-20"
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        
        <h2 className="mb-2 text-2xl font-bold">Something went wrong!</h2>
        
        <p className="mb-6 max-w-md text-muted-foreground">
          An error occurred while loading data. Please try refreshing the page.
        </p>
        
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded shadow hover:bg-primary/90"
        >
          Refresh page
        </button>
      </div>
    );
  }

  try {
    return <SupabaseProviderClient>{children}</SupabaseProviderClient>;
  } catch (error) {
    console.error('Error in SupabaseProviderClient:', error);
    setHasError(true);
    return null;
  }
}

// Export safe provider for use in app
export { SafeSupabaseProvider }; 