"use client";

import Link from 'next/link';
import { ArrowLeft, Calendar, User, Briefcase, Tag, CheckSquare, Square } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { ActionItem, Contact, Event } from '@/types/models';

interface TaskDetailViewProps {
  actionItem: ActionItem;
  contact: Contact | null;
  event: Event | null;
}

export function TaskDetailView({ actionItem, contact, event }: TaskDetailViewProps) {

  // TODO: Add state and handler for updating completion status if needed
  // const [isCompleted, setIsCompleted] = useState(actionItem.completed);
  // const handleToggleComplete = async () => { ... };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Link href="/dashboard?tab=tasks" passHref>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tasks
            </Button>
          </Link>
          {/* Add Edit button later if needed */}
        </div>
        <Separator className="my-3" />
        <div className="flex items-start gap-3">
          {/* Visually represent completion status */}
          <div className="mt-1">
            {actionItem.completed ? 
              <CheckSquare className="h-5 w-5 text-green-500" /> : 
              <Square className="h-5 w-5 text-muted-foreground" />
            }
          </div>
          <CardTitle className={`text-2xl font-semibold ${actionItem.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {actionItem.title} 
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-2">
        {/* Due Date Section */}
        <div className="flex items-center text-sm">
          <Calendar className="mr-3 h-5 w-5 text-muted-foreground" />
          <span className="font-medium mr-2">Due:</span>
          {actionItem.due_date ? 
            <span>{format(parseISO(actionItem.due_date), 'MMM d, yyyy')}</span> :
            <span className="text-muted-foreground italic">No due date</span>
          }
        </div>
        
        <Separator />

        {/* Related Info Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium mb-2">Related Info</h3>
          {contact && (
            <div className="flex items-center text-sm">
              <User className="mr-3 h-5 w-5 text-muted-foreground" />
              <span className="font-medium mr-2">Contact:</span>
              <Link href={`/contacts/${contact.id}`} passHref> {/* Assuming contact detail page exists */} 
                <Button variant="link" className="p-0 h-auto">{contact.name}</Button>
              </Link>
              {contact.company && <span className="ml-2 text-xs text-muted-foreground">({contact.company})</span>}
            </div>
          )}
          {event && (
            <div className="flex items-center text-sm">
              <Tag className="mr-3 h-5 w-5 text-muted-foreground" /> 
              <span className="font-medium mr-2">Event:</span>
              <Link href={`/events/${event.id}`} passHref> {/* Assuming event detail page exists */} 
                <Button variant="link" className="p-0 h-auto">{event.title}</Button>
              </Link>
            </div>
          )}
          {!contact && !event && (
             <p className="text-sm text-muted-foreground italic">Not linked to any contact or event.</p>
          )}
        </div>

        {/* Description Section (if exists) */}
        {actionItem.description && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {actionItem.description}
              </p>
            </div>
          </>
        )}

        {/* Timestamps */}
        <Separator />
        <div className="text-xs text-muted-foreground space-y-1">
           {actionItem.created_at && 
             <p>Created: {format(parseISO(actionItem.created_at), 'MMM d, yyyy p')}</p>}
           {actionItem.updated_at && actionItem.created_at !== actionItem.updated_at && 
             <p>Updated: {format(parseISO(actionItem.updated_at), 'MMM d, yyyy p')}</p>}
        </div>

      </CardContent>
    </Card>
  );
} 