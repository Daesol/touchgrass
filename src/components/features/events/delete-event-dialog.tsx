"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Event, Contact } from '@/types/models';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogCancel, 
  AlertDialogAction 
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';

interface DeleteEventDialogProps {
  event: Event | null;
  contacts: Contact[]; // All contacts, will be filtered internally
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (eventToDelete: Event, contactIdsToDelete: string[]) => void;
}

export function DeleteEventDialog({ 
  event, 
  contacts, 
  isOpen, 
  onClose, 
  onConfirmDelete 
}: DeleteEventDialogProps) {
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());

  // Filter contacts associated with the event being deleted
  const associatedContacts = useMemo(() => {
    if (!event) return [];
    return contacts.filter(c => c.event_id === event.id);
  }, [contacts, event]);

  // Reset selection when dialog opens or event changes
  useEffect(() => {
    if (isOpen) {
      setSelectedContactIds(new Set());
    }
  }, [isOpen, event]);

  const handleSelectAll = (checked: boolean | string) => {
    if (checked === true) {
      const allIds = new Set(associatedContacts.map(c => c.id));
      setSelectedContactIds(allIds);
    } else {
      setSelectedContactIds(new Set());
    }
  };

  const handleContactSelect = (contactId: string, checked: boolean | string) => {
    setSelectedContactIds(prev => {
      const newSet = new Set(prev);
      if (checked === true) {
        newSet.add(contactId);
      } else {
        newSet.delete(contactId);
      }
      return newSet;
    });
  };

  const isAllSelected = associatedContacts.length > 0 && selectedContactIds.size === associatedContacts.length;

  if (!event) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Event: "{event.title}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Select any associated contacts you also wish to delete.
            Contacts not selected will remain but will no longer be linked to this event.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {associatedContacts.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between pr-2">
              <Label className="font-medium">Associated Contacts ({associatedContacts.length})</Label>
               <div className="flex items-center space-x-2">
                 <Checkbox 
                    id="select-all-contacts"
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll} 
                  />
                 <Label htmlFor="select-all-contacts" className="text-sm font-normal text-muted-foreground cursor-pointer">
                   Select All
                 </Label>
              </div>
            </div>
            <ScrollArea className="h-40 w-full rounded-md border p-3">
              <div className="space-y-2">
                {associatedContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between">
                    <Label htmlFor={`contact-${contact.id}`} className="flex items-center space-x-2 font-normal cursor-pointer">
                      <span>{contact.name}</span>
                      {contact.company && <span className="text-xs text-muted-foreground">({contact.company})</span>}
                    </Label>
                    <Checkbox 
                      id={`contact-${contact.id}`}
                      checked={selectedContactIds.has(contact.id)}
                      onCheckedChange={(checked) => handleContactSelect(contact.id, checked)}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
            <p className="text-xs text-muted-foreground px-1">
               Selected contacts ({selectedContactIds.size}) will be permanently deleted along with the event.
            </p>
          </div>
        )}
        {associatedContacts.length === 0 && (
             <p className="text-sm text-muted-foreground mt-4 border p-3 rounded-md bg-secondary/30">
                This event has no associated contacts.
             </p>
        )}

        <AlertDialogFooter className="mt-5">
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirmDelete(event, Array.from(selectedContactIds))}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Event {selectedContactIds.size > 0 ? `& ${selectedContactIds.size} Contact(s)` : ''}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 