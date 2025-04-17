import { Event } from '@/types/models';
import { useLocalStorage } from '@/hooks/storage/use-local-storage';

// Mock implementation using localStorage
// In a real application, this would be replaced with API calls

const STORAGE_KEY = 'touchgrass_events';

export const useEventsService = () => {
  const [events, setEvents] = useLocalStorage<Event[]>(STORAGE_KEY, []);

  const getAll = (): Event[] => {
    return events;
  };

  const getById = (id: string): Event | undefined => {
    return events.find(event => event.id === id);
  };

  const create = (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Event => {
    const newEvent: Event = {
      ...event,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setEvents([...events, newEvent]);
    return newEvent;
  };

  const update = (id: string, updates: Partial<Omit<Event, 'id' | 'createdAt' | 'updatedAt'>>): Event | undefined => {
    const index = events.findIndex(event => event.id === id);
    if (index === -1) return undefined;
    
    const updatedEvent: Event = {
      ...events[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    const updatedEvents = [...events];
    updatedEvents[index] = updatedEvent;
    setEvents(updatedEvents);
    
    return updatedEvent;
  };

  const remove = (id: string): boolean => {
    const index = events.findIndex(event => event.id === id);
    if (index === -1) return false;
    
    const updatedEvents = [...events];
    updatedEvents.splice(index, 1);
    setEvents(updatedEvents);
    
    return true;
  };

  return {
    getAll,
    getById,
    create,
    update,
    remove,
  };
}; 