import { Task } from '@/types/models';
import { useLocalStorage } from '@/hooks/storage/use-local-storage';
import { v4 as uuidv4 } from 'uuid';

// Mock implementation using localStorage
// In a real application, this would be replaced with API calls

const STORAGE_KEY = 'touchgrass_tasks';

export const useTasksService = () => {
  const [tasks, setTasks] = useLocalStorage<Task[]>('touchgrass_tasks', []);

  const getAll = async (contactId?: string, eventId?: string): Promise<Task[]> => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
    let filteredTasks = tasks;
    if (contactId) {
      filteredTasks = filteredTasks.filter(task => task.contact_id === contactId); // Use contact_id
    }
    if (eventId) {
      filteredTasks = filteredTasks.filter(task => task.event_id === eventId); // Use event_id
    }
    return filteredTasks;
  };

  const getById = (id: string): Task | undefined => {
    return tasks.find(task => task.id === id);
  };

  const create = async (taskData: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'contactName' | 'eventTitle' | 'eventId'>): Promise<Task> => {
    const newTask: Task = {
      ...taskData,
      id: uuidv4(),
      user_id: 'mock_user_id',
      created_at: new Date().toISOString(), // Use created_at
      // These need to be populated based on context, likely contact/event data
      contactName: 'Mock Contact', 
      eventTitle: 'Mock Event', 
      eventId: taskData.event_id || 'mock_event_id'
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const update = async (id: string, updates: Partial<Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'contactName' | 'eventTitle' | 'eventId'>>): Promise<Task | undefined> => {
    let updatedTask: Task | undefined = undefined;
    setTasks(prev => {
      const index = prev.findIndex(task => task.id === id);
      if (index === -1) return prev;
      
      updatedTask = {
        ...prev[index],
        ...updates,
        updated_at: new Date().toISOString(), // Use updated_at
      };
      
      const updatedTasks = [...prev];
      updatedTasks[index] = updatedTask;
      return updatedTasks;
    });
    return updatedTask;
  };

  const updateStatus = async (id: string, completed: boolean): Promise<Task | undefined> => {
    let updatedTask: Task | undefined = undefined;
    setTasks(prev => {
      const index = prev.findIndex(task => task.id === id);
      if (index === -1) return prev;
      
      updatedTask = {
        ...prev[index],
        completed,
        updated_at: new Date().toISOString(), // Use updated_at
      };
      
      const updatedTasks = [...prev];
      updatedTasks[index] = updatedTask;
      return updatedTasks;
    });
    return updatedTask;
  };

  const remove = async (id: string): Promise<boolean> => {
    const initialLength = tasks.length;
    setTasks(prev => prev.filter(task => task.id !== id));
    return tasks.length < initialLength;
  };

  return {
    getAll,
    getById,
    create,
    update,
    updateStatus,
    remove,
  };
}; 