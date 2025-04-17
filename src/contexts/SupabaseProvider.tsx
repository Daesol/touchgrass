'use client';

import { Session, SupabaseClient, createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Define the types for our data models
export type Event = {
  id: string;
  user_id: string;
  title: string;
  location: string;
  company: string;
  date: string;
  color_index: number;
  created_at?: string;
  updated_at?: string;
};

export type Contact = {
  id: string;
  user_id: string;
  event_id: string;
  linkedin_url?: string;
  name: string;
  position?: string;
  company?: string;
  summary?: string;
  voice_memo?: {
    url: string;
    duration: number;
  };
  created_at?: string;
  updated_at?: string;
};

export type ActionItem = {
  id: string;
  user_id: string;
  contact_id: string;
  text: string;
  due_date: string;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
};

// Define the Supabase context type
type SupabaseContextType = {
  supabase: SupabaseClient;
  user: Session['user'] | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getEvents: () => Promise<Event[]>;
  addEvent: (event: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Event>;
  updateEvent: (event: Partial<Event> & { id: string }) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getContacts: (eventId?: string) => Promise<Contact[]>;
  addContact: (contact: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Contact>;
  updateContact: (contact: Partial<Contact> & { id: string }) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  getActionItems: (contactId?: string) => Promise<ActionItem[]>;
  addActionItem: (actionItem: Omit<ActionItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<ActionItem>;
  updateActionItem: (actionItem: Partial<ActionItem> & { id: string }) => Promise<void>;
  deleteActionItem: (id: string) => Promise<void>;
};

// Create the Supabase context
const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const [user, setUser] = useState<Session['user'] | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session
    async function getInitialSession() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setUser(session.user);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    }

    getInitialSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        if (session) {
          router.refresh();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  // Authentication functions
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Instead of using router.push which can cause redirect loops,
      // use window.location with a clear session parameter
      window.location.href = '/login?clear_session=true';
    } catch (error) {
      console.error('Error signing out:', error);
      // Even on error, try to redirect to login with error parameter
      window.location.href = '/login?clear_session=true&error=signout_error';
    }
  };

  // Events CRUD operations
  const getEvents = async (): Promise<Event[]> => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      return data as Event[];
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  };

  const addEvent = async (event: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Event> => {
    try {
      if (!user) throw new Error('User not authenticated');

      const newEvent = {
        id: uuidv4(),
        user_id: user.id,
        ...event,
      };

      const { data, error } = await supabase
        .from('events')
        .insert([newEvent])
        .select()
        .single();

      if (error) throw error;
      return data as Event;
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  };

  const updateEvent = async (event: Partial<Event> & { id: string }): Promise<void> => {
    try {
      const { id, ...updateData } = event;
      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  const deleteEvent = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };

  // Contacts CRUD operations
  const getContacts = async (eventId?: string): Promise<Contact[]> => {
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
      return data as Contact[];
    } catch (error) {
      console.error('Error getting contacts:', error);
      return [];
    }
  };

  const addContact = async (contact: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Contact> => {
    try {
      if (!user) throw new Error('User not authenticated');

      const newContact = {
        id: uuidv4(),
        user_id: user.id,
        ...contact,
      };

      const { data, error } = await supabase
        .from('contacts')
        .insert([newContact])
        .select()
        .single();

      if (error) throw error;
      return data as Contact;
    } catch (error) {
      console.error('Error adding contact:', error);
      throw error;
    }
  };

  const updateContact = async (contact: Partial<Contact> & { id: string }): Promise<void> => {
    try {
      const { id, ...updateData } = contact;
      const { error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  };

  const deleteContact = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  };

  // Action Items CRUD operations
  const getActionItems = async (contactId?: string): Promise<ActionItem[]> => {
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
      return data as ActionItem[];
    } catch (error) {
      console.error('Error getting action items:', error);
      return [];
    }
  };

  const addActionItem = async (actionItem: Omit<ActionItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ActionItem> => {
    try {
      if (!user) throw new Error('User not authenticated');

      const newActionItem = {
        id: uuidv4(),
        user_id: user.id,
        ...actionItem,
      };

      const { data, error } = await supabase
        .from('action_items')
        .insert([newActionItem])
        .select()
        .single();

      if (error) throw error;
      return data as ActionItem;
    } catch (error) {
      console.error('Error adding action item:', error);
      throw error;
    }
  };

  const updateActionItem = async (actionItem: Partial<ActionItem> & { id: string }): Promise<void> => {
    try {
      const { id, ...updateData } = actionItem;
      const { error } = await supabase
        .from('action_items')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating action item:', error);
      throw error;
    }
  };

  const deleteActionItem = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('action_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting action item:', error);
      throw error;
    }
  };

  const value = {
    supabase,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    getEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    getContacts,
    addContact,
    updateContact,
    deleteContact,
    getActionItems,
    addActionItem,
    updateActionItem,
    deleteActionItem,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

// Hook to use the Supabase context
export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
} 