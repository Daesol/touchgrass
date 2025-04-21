'use client'

import React from 'react'
import { useNotes } from '@/hooks/useNotes'
import { NoteForm } from './NoteForm'
import { NoteItem } from './NoteItem'

interface NotesListProps {
  contactId: string
}

export function NotesList({ contactId }: NotesListProps) {
  const { notes, isLoading, error, addNote, editNote, removeNote } = useNotes(contactId)
  
  const handleAddNote = async (data: { content: string, contact_id: string }) => {
    await addNote(data)
  }
  
  const handleEditNote = async (id: string, content: string) => {
    await editNote(id, { content })
  }
  
  const handleDeleteNote = async (id: string) => {
    await removeNote(id)
  }
  
  if (isLoading) {
    return <div className="text-center py-4">Loading notes...</div>
  }
  
  if (error) {
    return <div className="text-red-500 text-center py-4">Error: {error}</div>
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Notes</h3>
      
      {/* Add new note */}
      <NoteForm contactId={contactId} onAddNote={handleAddNote} />
      
      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="text-center text-muted-foreground py-4">
          No notes yet. Add your first note above.
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
            />
          ))}
        </div>
      )}
    </div>
  )
} 