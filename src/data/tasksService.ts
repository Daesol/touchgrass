import { Task } from '@/types/models';
import { useLocalStorage } from '@/hooks/storage/use-local-storage';

// Mock implementation using localStorage
// In a real application, this would be replaced with API calls

const STORAGE_KEY = 'touchgrass_tasks';

export const useTasksService = () => {
  const [tasks, setTasks] = useLocalStorage<Task[]>(STORAGE_KEY, []);

  const getAll = (): Task[] => {
    return tasks;
  };

  const getById = (id: string): Task | undefined => {
    return tasks.find(task => task.id === id);
  };

  const create = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setTasks([...tasks, newTask]);
    return newTask;
  };

  const update = (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Task | undefined => {
    const index = tasks.findIndex(task => task.id === id);
    if (index === -1) return undefined;
    
    const updatedTask: Task = {
      ...tasks[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    const updatedTasks = [...tasks];
    updatedTasks[index] = updatedTask;
    setTasks(updatedTasks);
    
    return updatedTask;
  };

  const remove = (id: string): boolean => {
    const index = tasks.findIndex(task => task.id === id);
    if (index === -1) return false;
    
    const updatedTasks = [...tasks];
    updatedTasks.splice(index, 1);
    setTasks(updatedTasks);
    
    return true;
  };

  const toggleComplete = (id: string): Task | undefined => {
    const index = tasks.findIndex(task => task.id === id);
    if (index === -1) return undefined;
    
    const updatedTask: Task = {
      ...tasks[index],
      completed: !tasks[index].completed,
      updatedAt: new Date(),
    };
    
    const updatedTasks = [...tasks];
    updatedTasks[index] = updatedTask;
    setTasks(updatedTasks);
    
    return updatedTask;
  };

  return {
    getAll,
    getById,
    create,
    update,
    remove,
    toggleComplete,
  };
}; 