"use client";

import { useState, useEffect, useMemo } from "react";
import { TaskList } from "@/components/features/tasks/task-list";
import { Event, Contact, ActionItem, Task } from "@/types/models"; // Added Task type
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function TasksPage() {
  const [uiContacts, setUIContacts] = useState<Contact[]>([]);
  const [uiEvents, setUIEvents] = useState<Event[]>([]);
  const [uiActionItems, setUIActionItems] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simplified data fetching
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [contactsRes, eventsRes, actionsRes] = await Promise.all([
          fetch('/api/contacts'),
          fetch('/api/events'),
          fetch('/api/tasks') // Action items come from /api/tasks
        ]);

        if (!isMounted) return;
        if (!contactsRes.ok || !eventsRes.ok || !actionsRes.ok) throw new Error('Failed to fetch data for tasks');

        const contactsData = await contactsRes.json();
        const eventsData = await eventsRes.json();
        const actionsData = await actionsRes.json();

        setUIContacts(contactsData.data || []);
        setUIEvents(eventsData.data || []);
        setUIActionItems(actionsData.data || []);

      } catch (err) {
        console.error('Error fetching tasks page data:', err);
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load data.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  // --- Derive Tasks from ActionItems, Contacts, Events (Moved from dashboard.tsx) ---
  const tasks = useMemo(() => {
    return uiActionItems.map(item => {
      const contact = uiContacts.find(c => c.id === item.contact_id);
      const event = uiEvents.find(e => e.id === item.event_id);
      const eventColorIndex = event?.color_index !== undefined ? String(event.color_index) : null;

      // Ensure the returned object matches the Task type expected by TaskList
      // Provide default empty strings for potentially undefined fields if Task requires string
      const task: Task = {
        ...item,
        contactId: contact?.id ?? '', // Use empty string if undefined
        contactName: contact?.name ?? '', // Use empty string if undefined
        eventId: event?.id ?? '', // Use empty string if undefined
        eventTitle: event?.title ?? '', // Use empty string if undefined
        eventColorIndex: eventColorIndex,
       };
       return task;
    });
  }, [uiActionItems, uiContacts, uiEvents]);
  // --- End Task Derivation ---

  // --- Task Status Update Logic (Moved from dashboard.tsx) ---
  const handleUpdateTaskStatus = async (taskId: string, completed: boolean) => {
    const originalTask = uiActionItems.find(item => item.id === taskId);
    const originalStatus = originalTask?.completed ?? null; // Default to null if undefined

    // Optimistically update UI
    setUIActionItems(prev => prev.map(item => item.id === taskId ? { ...item, completed: completed } : item));

    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update task');
        }

        const updatedApiTask = await response.json();
        const updatedActionItem: ActionItem = updatedApiTask.data;

        // Update UI with confirmed data
        setUIActionItems(prev => prev.map(item => item.id === taskId ? updatedActionItem : item));

        toast({ title: `Task marked as ${completed ? 'complete' : 'incomplete'}` });

    } catch (err) {
        console.error("Error updating task status:", err);
        toast({ title: "Error updating task", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
        // Revert optimistic update on error
        setUIActionItems(prev => prev.map(item => item.id === taskId ? { ...item, completed: originalStatus } : item));
    }
  };
  // --- End Status Update Logic ---


  if (isLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-destructive">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p>Error loading tasks: {error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-sm underline">Try again</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        {/* TODO: Add "Create Task" button? Tasks are usually linked to contacts. */}
        <TaskList
            tasks={tasks} // Pass the derived tasks
            contacts={uiContacts}
            events={uiEvents}
            onUpdateStatus={handleUpdateTaskStatus} // Pass the update handler
        />
    </div>
  );
} 