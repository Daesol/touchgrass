import { Event } from '@/types/models';
import { UIEvent } from '@/utils/event-converters';
import { createEvent, getEvents as fetchEvents, updateEvent as updateServerEvent, deleteEvent as deleteServerEvent } from '@/actions/events';

// Mock implementation using localStorage
// In a real application, this would be replaced with API calls

const STORAGE_KEY = 'touchgrass_events';

export const useEventsService = () => {
  // Fetch events from the server
  const getAll = async (): Promise<UIEvent[]> => {
    try {
      return await fetchEvents();
    } catch (error) {
      console.error("Error fetching events:", error);
      // Return empty array on error
      return [];
    }
  };

  const getById = async (id: string): Promise<UIEvent | undefined> => {
    try {
      const events = await fetchEvents();
      return events.find(event => event.id === id);
    } catch (error) {
      console.error("Error fetching event by ID:", error);
      return undefined;
    }
  };

  const create = async (event: Omit<UIEvent, 'id'>): Promise<UIEvent> => {
    try {
      return await createEvent(event);
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  };

  const update = async (id: string, updates: Partial<Omit<UIEvent, 'id'>>): Promise<UIEvent | undefined> => {
    try {
      return await updateServerEvent(id, updates);
    } catch (error) {
      console.error("Error updating event:", error);
      return undefined;
    }
  };

  const remove = async (id: string): Promise<boolean> => {
    try {
      return await deleteServerEvent(id);
    } catch (error) {
      console.error("Error deleting event:", error);
      return false;
    }
  };

  return {
    getAll,
    getById,
    create,
    update,
    remove,
  };
}; 