"use client";

import { useState, useEffect } from "react";
import { ContactList } from "@/components/features/contacts/contact-list";
import { Event, Contact } from "@/types/models";
import { Loader2, AlertTriangle, Trash2, X } from "lucide-react";
import { useRouter } from 'next/navigation';
import { deleteMultipleContacts } from "@/actions/contactActions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ContactsPage() {
  const router = useRouter();
  const [uiContacts, setUIContacts] = useState<Contact[]>([]);
  const [uiEvents, setUIEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  
  // --- Batch Delete State ---
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  // --- End Batch Delete State ---

  // Simplified data fetching
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [contactsRes, eventsRes] = await Promise.all([
          fetch('/api/contacts'),
          fetch('/api/events')
        ]);

        if (!isMounted) return;
        if (!contactsRes.ok || !eventsRes.ok) throw new Error('Failed to fetch contacts or events');

        const contactsData = await contactsRes.json();
        const eventsData = await eventsRes.json();

        setUIContacts(contactsData.data || []);
        setUIEvents(eventsData.data || []);

      } catch (err) {
        console.error('Error fetching contacts page data:', err);
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load data.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  // --- Contact Selection/Edit Logic ---
  const handleSelectContact = (contact: Contact) => {
    // Only navigate if not in selection mode
    if (!isSelectionMode) {
        router.push(`/dashboard/contacts/${contact.id}`);
    }
  };

  const handleEditContact = (contact: Contact) => {
    // Navigate to a dynamic route for editing the contact
    router.push(`/dashboard/contacts/${contact.id}/edit`);
  };
  // --- End Selection/Edit Logic ---

  // --- Batch Delete Logic ---
  const handleToggleSelectionMode = () => {
      setIsSelectionMode(!isSelectionMode);
      // Clear selection when exiting selection mode
      if (isSelectionMode) {
          setSelectedContactIds([]);
      }
  };

  const handleToggleSelection = (contactId: string) => {
    setSelectedContactIds((prevSelected) =>
      prevSelected.includes(contactId)
        ? prevSelected.filter((id) => id !== contactId)
        : [...prevSelected, contactId]
    );
  };

  const handleInitiateBatchDelete = () => {
      if (selectedContactIds.length === 0) return; // Should not happen if button is disabled, but good practice
      setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedContactIds.length === 0) return;

    setIsDeleting(true);
    try {
      // Call the new batch delete server action
      const result = await deleteMultipleContacts(selectedContactIds);

      if (!result.success) {
        throw new Error(result.error || "An unknown error occurred during batch deletion.");
      }

      // Update UI state 
      setUIContacts((prevContacts) => 
        prevContacts.filter((c) => !selectedContactIds.includes(c.id))
      );
      
      toast.success(`${selectedContactIds.length} contact(s) deleted successfully.`);
      
      // Reset selection state after successful deletion
      setSelectedContactIds([]);
      setIsSelectionMode(false); 

    } catch (err) {
      console.error("Failed to delete contacts:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete selected contacts.");
    } finally {
      setIsDeleting(false);
      setIsConfirmModalOpen(false);
      // No need to clear selection here if modal closing handles it, 
      // but doing it defensively after try/catch is okay.
      // setSelectedContactIds([]); 
      // setIsSelectionMode(false);
    }
  };

  // Close modal handler also resets selection mode
  const handleModalOpenChange = (open: boolean) => {
      setIsConfirmModalOpen(open);
      if (!open) {
          // Optionally reset selection when modal is closed by Cancel/X
          // setSelectedContactIds([]); 
          // setIsSelectionMode(false); 
      }
  }
  // --- End Batch Delete Logic ---

  if (isLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-destructive">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p>Error loading contacts: {error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-sm underline">Try again</button>
      </div>
    );
  }

  // Calculate count for display
  const selectedCount = selectedContactIds.length;

  return (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold">Contacts</h1>
            {/* Add Toggle Delete Mode button here */}
            <Button 
                variant={isSelectionMode ? "destructive" : "outline"} 
                size="icon"
                onClick={handleToggleSelectionMode}
                title={isSelectionMode ? "Cancel Selection" : "Select Contacts to Delete"}
            >
                {isSelectionMode ? <X className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
            </Button>
        </div>
        
        {/* TODO: Add "Create Contact" button here? */}

        {/* Conditionally render Delete Selected button */}
        {isSelectionMode && (
            <div className="flex justify-end items-center p-2 border-b border-t bg-muted/40">
                 <span className="text-sm text-muted-foreground mr-4">
                    {selectedCount} selected
                </span>
                <Button
                    variant="destructive"
                    onClick={handleInitiateBatchDelete}
                    disabled={selectedCount === 0 || isDeleting}
                    size="sm"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected ({selectedCount})
                </Button>
            </div>
        )}

        <ContactList
            contacts={uiContacts}
            events={uiEvents}
            onSelectContact={handleSelectContact} 
            onEditContact={handleEditContact}   
            // Pass selection state and handlers
            isSelectionMode={isSelectionMode}
            selectedContactIds={selectedContactIds}
            onToggleSelection={handleToggleSelection}
            // compact={false} 
        />
        
        {/* Confirmation Dialog - Updated for Batch Delete */}
        <AlertDialog open={isConfirmModalOpen} onOpenChange={handleModalOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the 
                        <strong> {selectedContactIds.length} selected contact(s)</strong> and all their associated action items (tasks, notes, etc.).
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirmDelete}
                        disabled={isDeleting || selectedContactIds.length === 0}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} 
                        Delete {selectedContactIds.length} Contact(s)
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
} 