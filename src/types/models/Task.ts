export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  relatedContacts?: string[]; // Contact IDs
  relatedEvents?: string[]; // Event IDs
  createdAt: Date;
  updatedAt: Date;
} 