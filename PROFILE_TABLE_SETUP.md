# Profile Table Setup Instructions

Follow these steps to create the profiles table in your Supabase project:

1. Log in to your Supabase Dashboard at: https://app.supabase.com/
2. Select your project (TouchGrass)
3. Navigate to the SQL Editor (in the left sidebar)
4. Create a new query or open an empty query
5. Copy and paste the SQL below
6. Run the query

```sql
-- Profile table for storing user profile information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  job_title TEXT,
  company TEXT,
  location TEXT,
  phone TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{"linkedin": "", "twitter": "", "github": ""}',
  preferences JSONB DEFAULT '{"theme": "system", "notifications": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Create a trigger to maintain the updated_at column
CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Create a function to automatically create a profile entry when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create a profile when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## About the Profiles Table

This table extends the Supabase Auth user information to store additional profile details:

- **Basic Information**: Name, display name, avatar URL, bio
- **Professional Details**: Job title, company, location
- **Contact Information**: Phone, website
- **Social Media**: Links to LinkedIn, Twitter, GitHub, etc.
- **Preferences**: User preferences like theme settings and notification preferences

The table has Row Level Security (RLS) policies that ensure users can only view and modify their own profile information.

A database trigger automatically creates an empty profile entry when a new user signs up, linking it to their auth account.

## After Setup

After creating the profiles table, you'll need to add functionality to your application to:

1. Fetch profile information when a user logs in
2. Update profile information when users edit their profiles
3. Display profile information in the profile section of your application

You can use the following Supabase queries as a starting point:

### Fetch a user's profile
```javascript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
```

### Update a user's profile
```javascript
const { data, error } = await supabase
  .from('profiles')
  .update({
    first_name: 'John',
    last_name: 'Doe',
    avatar_url: 'https://example.com/avatar.jpg',
    // other fields...
  })
  .eq('id', user.id);
``` 