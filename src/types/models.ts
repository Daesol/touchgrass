// Define the types for our data models
export type Event = {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  location: string | null;
  company: string | null;
  date: string;
  color_index: string | null;
  completed?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Contact = {
  id: string;
  user_id: string;
  event_id: string | null;
  linkedin_url?: string | null;
  name: string;
  position?: string | null;
  company?: string | null;
  summary?: string | null;
  email?: string | null;
  phone?: string | null;
  voice_memo?: any;
  created_at?: string;
  updated_at?: string;
};

export type ActionItem = {
  id: string;
  user_id?: string;
  contact_id: string | null;
  title: string;
  description?: string | null;
  due_date: string | null;
  completed: boolean | null;
  event_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export interface Note {
  id: string
  content: string
  user_id: string
  contact_id: string
  created_at: string
  updated_at?: string
}

// Added Profile type
export interface Profile {
  id: string
  user_id: string
  full_name?: string
  avatar_url?: string
  email?: string
  phone?: string
  company?: string
  position?: string
  bio?: string
  linkedin_url?: string
  twitter_url?: string
  website_url?: string
  created_at?: string
  updated_at?: string
}

// Added Task type (based on ActionItem + context)
export type Task = ActionItem & {
  title: string;
  contactId: string
  contactName: string
  eventId: string
  eventTitle: string
  eventColorIndex: string | null;
} 