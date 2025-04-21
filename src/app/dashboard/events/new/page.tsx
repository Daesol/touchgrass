"use client";

import { ClientEventForm } from "@/components/features/events/client-event-form";
import { toast } from "@/components/ui/use-toast";
import { Event } from "@/types/models";
import { useRouter } from 'next/navigation';

export default function NewEventPage() {
  const router = useRouter();

  // Handler for submitting the new event form
  const handleCreateEvent = async (eventData: Partial<Event>) => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create event');
      }

      const newEvent = await response.json();
      toast({ title: "Event created successfully!" });
      router.push('/dashboard/events'); // Redirect to events list on success
      router.refresh(); // Refresh server components
    } catch (err) {
      console.error("Error creating event:", err);
      toast({ 
        title: "Error creating event", 
        description: err instanceof Error ? err.message : "Unknown error", 
        variant: "destructive" 
      });
    }
  };

  // Handler for cancelling the form
  const handleCancel = () => {
    router.back(); // Go back to the previous page
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Create New Event</h1>
      <ClientEventForm 
        onSubmit={handleCreateEvent}
        onCancel={handleCancel} 
        existingEvent={undefined} // Pass undefined for new event
      />
    </div>
  );
} 