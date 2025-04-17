import { Contact } from '@/types/models';
import { useLocalStorage } from '@/hooks/storage/use-local-storage';

// Mock implementation using localStorage
// In a real application, this would be replaced with API calls

const STORAGE_KEY = 'touchgrass_contacts';

export const useContactsService = () => {
  const [contacts, setContacts] = useLocalStorage<Contact[]>(STORAGE_KEY, []);

  const getAll = (): Contact[] => {
    return contacts;
  };

  const getById = (id: string): Contact | undefined => {
    return contacts.find(contact => contact.id === id);
  };

  const create = (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Contact => {
    const newContact: Contact = {
      ...contact,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setContacts([...contacts, newContact]);
    return newContact;
  };

  const update = (id: string, updates: Partial<Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>>): Contact | undefined => {
    const index = contacts.findIndex(contact => contact.id === id);
    if (index === -1) return undefined;
    
    const updatedContact: Contact = {
      ...contacts[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    const updatedContacts = [...contacts];
    updatedContacts[index] = updatedContact;
    setContacts(updatedContacts);
    
    return updatedContact;
  };

  const remove = (id: string): boolean => {
    const index = contacts.findIndex(contact => contact.id === id);
    if (index === -1) return false;
    
    const updatedContacts = [...contacts];
    updatedContacts.splice(index, 1);
    setContacts(updatedContacts);
    
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