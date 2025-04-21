import { Contact } from '@/types/models';
import { useLocalStorage } from '@/hooks/storage/use-local-storage';
import { v4 as uuidv4 } from 'uuid';

// Mock implementation using localStorage
// In a real application, this would be replaced with API calls

const STORAGE_KEY = 'touchgrass_contacts';

export const useContactsService = () => {
  const [contacts, setContacts] = useLocalStorage<Contact[]>('touchgrass_contacts', []);

  const getAll = async (eventId?: string): Promise<Contact[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    if (eventId) {
      return contacts.filter(contact => contact.event_id === eventId); // Use event_id
    }
    return contacts;
  };

  const getById = (id: string): Contact | undefined => {
    return contacts.find(contact => contact.id === id);
  };

  const create = async (contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Contact> => {
    const newContact: Contact = {
      id: uuidv4(),
      user_id: 'mock_user_id', // Replace with actual user ID later
      ...contactData,
      created_at: new Date().toISOString(), // Use created_at
      // updated_at is optional, don't set on create
    };
    setContacts(prev => [...prev, newContact]);
    return newContact;
  };

  const update = async (id: string, updates: Partial<Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Contact | undefined> => {
    let updatedContact: Contact | undefined = undefined;
    setContacts(prev => {
        const index = prev.findIndex(contact => contact.id === id);
        if (index === -1) return prev;
        
        updatedContact = {
          ...prev[index],
          ...updates,
          updated_at: new Date().toISOString(), // Use updated_at
        };
        
        const updatedContacts = [...prev];
        updatedContacts[index] = updatedContact;
        return updatedContacts;
    });
    return updatedContact; 
  };

  const remove = async (id: string): Promise<boolean> => {
    const initialLength = contacts.length;
    setContacts(prev => prev.filter(contact => contact.id !== id));
    return contacts.length < initialLength;
  };

  return {
    getAll,
    getById,
    create,
    update,
    remove,
  };
}; 