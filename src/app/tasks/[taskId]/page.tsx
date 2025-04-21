import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TaskDetailView } from '@/components/features/tasks/task-detail-view'; // We will create this component
import type { ActionItem, Contact, Event } from '@/types/models';

// Helper function to fetch data (can be moved to actions/services later)
async function getTaskDetails(taskId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    // Handle unauthorized access appropriately, maybe redirect or throw error
    console.error("Auth error fetching task details:", authError);
    return null; 
  }

  // 1. Fetch the Action Item
  const { data: actionItem, error: itemError } = await supabase
    .from('action_items')
    .select('*')
    .eq('id', taskId)
    .eq('user_id', user.id) // Ensure user owns the item
    .single();

  if (itemError || !actionItem) {
    console.error(`Error fetching action item ${taskId}:`, itemError);
    return null; // Or throw specific error
  }

  // 2. Fetch related Contact (if contact_id exists)
  let contact: Contact | null = null;
  if (actionItem.contact_id) {
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', actionItem.contact_id)
      .eq('user_id', user.id) // Ensure user owns contact
      .single();
    if (contactError) {
      console.warn(`Error fetching contact ${actionItem.contact_id} for task ${taskId}:`, contactError);
      // Continue without contact data if fetch fails
    } else {
      contact = contactData;
    }
  }

  // 3. Fetch related Event (if event_id exists)
  let event: Event | null = null;
  if (actionItem.event_id) {
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', actionItem.event_id)
      .eq('user_id', user.id) // Ensure user owns event
      .single();
    if (eventError) {
      console.warn(`Error fetching event ${actionItem.event_id} for task ${taskId}:`, eventError);
      // Continue without event data if fetch fails
    } else {
      event = eventData;
    }
  }

  return { actionItem, contact, event };
}


export default async function TaskDetailPage({ params }: { params: { taskId: string } }) {
  const taskId = params.taskId;
  
  if (!taskId) {
     console.error("Task ID missing from params");
     notFound(); // Or handle appropriately
  }

  const taskDetails = await getTaskDetails(taskId);

  if (!taskDetails || !taskDetails.actionItem) {
    notFound(); // Renders the not-found page if task doesn't exist or fetch failed
  }

  // Pass fetched data to the client component for rendering
  return (
    <div className="container mx-auto max-w-2xl p-4"> 
      <TaskDetailView 
        actionItem={taskDetails.actionItem}
        contact={taskDetails.contact}
        event={taskDetails.event}
      />
    </div>
  );
}

// Optional: Add metadata generation
export async function generateMetadata({ params }: { params: { taskId: string } }) {
  const taskDetails = await getTaskDetails(params.taskId);
  const title = taskDetails?.actionItem?.text ? `Task: ${taskDetails.actionItem.text}` : 'Task Detail';
  return { title };
} 