export interface Event {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  attendees?: string[]; // Contact IDs
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
} 