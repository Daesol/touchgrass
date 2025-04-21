export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string | null
          date: string
          location: string | null
          user_id: string
          completed: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description?: string | null
          date: string
          location?: string | null
          user_id: string
          completed?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string | null
          date?: string
          location?: string | null
          user_id?: string
          completed?: boolean
        }
      }
      contacts: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string | null
          phone: string | null
          notes: string | null
          last_contacted: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email?: string | null
          phone?: string | null
          notes?: string | null
          last_contacted?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string | null
          phone?: string | null
          notes?: string | null
          last_contacted?: string | null
          user_id?: string
        }
      }
      action_items: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string | null
          due_date: string | null
          completed: boolean
          user_id: string
          contact_id: string | null
          event_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description?: string | null
          due_date?: string | null
          completed?: boolean
          user_id: string
          contact_id?: string | null
          event_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string | null
          due_date?: string | null
          completed?: boolean
          user_id?: string
          contact_id?: string | null
          event_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 