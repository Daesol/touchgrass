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
  event_id: string;
  linkedin_url?: string;
  name: string;
  position?: string;
  company?: string;
  summary?: string;
  email?: string | null;
  phone?: string | null;
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
  contact_id: string | null;
  title: string;
  description?: string | null;
  due_date: string | null;
  completed: boolean;
  event_id?: string | null;
  created_at?: string;
  updated_at?: string;
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
  contactId: string
  contactName: string
  eventId: string
  eventTitle: string
  eventColorIndex: string | null;
} 