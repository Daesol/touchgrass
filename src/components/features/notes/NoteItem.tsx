'use client'

import React from 'react'
import { Note } from '@/types/models'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Edit, Save, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface NoteItemProps {
  note: Note
  onEdit: (id: string, content: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function NoteItem({ note, onEdit, onDelete }: NoteItemProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [content, setContent] = React.useState(note.content)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  const handleStartEdit = () => {
    setContent(note.content)
    setIsEditing(true)
  }
  
  const handleCancelEdit = () => {
    setIsEditing(false)
    setContent(note.content)
  }
  
  const handleSaveEdit = async () => {
    if (!content.trim()) return
    
    try {
      setIsSubmitting(true)
      await onEdit(note.id, content)
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to update note:', err)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return
    
    try {
      setIsSubmitting(true)
      await onDelete(note.id)
    } catch (err) {
      console.error('Failed to delete note:', err)
      setIsSubmitting(false)
    }
  }
  
  return (
    <Card>
      <CardContent className="p-4">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px]"
              disabled={isSubmitting}
            />
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancelEdit}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-1" /> 
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSaveEdit}
                disabled={!content.trim() || isSubmitting}
              >
                <Save className="h-4 w-4 mr-1" /> 
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="whitespace-pre-wrap">{note.content}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                {note.updated_at && note.updated_at !== note.created_at && ' (edited)'}
              </span>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleStartEdit}
                  disabled={isSubmitting}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 