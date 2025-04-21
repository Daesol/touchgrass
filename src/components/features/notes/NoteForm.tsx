'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'

interface NoteFormProps {
  contactId: string
  onAddNote: (data: { content: string, contact_id: string }) => Promise<void>
}

export function NoteForm({ contactId, onAddNote }: NoteFormProps) {
  const [content, setContent] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) return
    
    try {
      setIsSubmitting(true)
      await onAddNote({
        content,
        contact_id: contactId
      })
      setContent('')
    } catch (err) {
      console.error('Failed to add note:', err)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a new note..."
        className="min-h-[100px]"
        disabled={isSubmitting}
      />
      <div className="flex justify-end">
        <Button 
          type="submit" 
          size="sm"
          disabled={!content.trim() || isSubmitting}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Note
        </Button>
      </div>
    </form>
  )
} 