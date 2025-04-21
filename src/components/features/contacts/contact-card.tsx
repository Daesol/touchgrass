"use client"

import React, { useState } from "react"
import type { Contact } from "@/components/features/contacts/contact-saver"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Star, Plus, Trash2, Save, Briefcase, Calendar, Check } from "lucide-react"

interface ContactCardProps {
  contact: Contact
  editable?: boolean
  onSave?: (contact: Contact) => void
}

export function ContactCard({ contact, editable = false, onSave }: ContactCardProps) {
  const [editedContact, setEditedContact] = useState<Contact>({ ...contact })
  const [newActionItem, setNewActionItem] = useState("")

  const handleInputChange = (field: keyof Contact, value: string) => {
    setEditedContact({ ...editedContact, [field]: value })
  }

  const handleRatingChange = (rating: number) => {
    setEditedContact({ ...editedContact, rating: rating })
  }

  const handleAddActionItem = () => {
    if (!newActionItem.trim()) return

    const updatedActionItems = [...editedContact.actionItems, newActionItem.trim()]
    setEditedContact({ ...editedContact, actionItems: updatedActionItems })
    setNewActionItem("")
  }

  const handleRemoveActionItem = (index: number) => {
    const updatedActionItems = [...editedContact.actionItems]
    updatedActionItems.splice(index, 1)
    setEditedContact({ ...editedContact, actionItems: updatedActionItems })
  }

  const handleSave = () => {
    if (onSave) {
      onSave(editedContact)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {editable ? (
            <Input
              value={editedContact.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="text-xl font-bold"
            />
          ) : (
            editedContact.name
          )}
        </CardTitle>
        <div className="flex items-center text-sm text-zinc-500">
          <Briefcase className="mr-1 h-4 w-4" />
          {editable ? (
            <div className="flex w-full gap-2">
              <Input
                value={editedContact.position}
                onChange={(e) => handleInputChange("position", e.target.value)}
                className="text-sm"
                placeholder="Position"
              />
              <Input
                value={editedContact.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                className="text-sm"
                placeholder="Company"
              />
            </div>
          ) : (
            <span>
              {editedContact.position} at {editedContact.company}
            </span>
          )}
        </div>
        <div className="flex items-center text-sm text-zinc-500">
          <Calendar className="mr-1 h-4 w-4" />
          <span>Added on {editedContact.date}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h3 className="mb-2 font-medium">LinkedIn Profile</h3>
          <a
            href={editedContact.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 underline"
          >
            {editedContact.linkedinUrl}
          </a>
        </div>

        <Separator />

        <div>
          <h3 className="mb-2 font-medium">Profile Summary</h3>
          {editable ? (
            <Textarea
              value={editedContact.summary}
              onChange={(e) => handleInputChange("summary", e.target.value)}
              className="min-h-[80px]"
            />
          ) : (
            <p className="text-sm text-zinc-700">{editedContact.summary}</p>
          )}
        </div>

        <Separator />

        <div>
          <h3 className="mb-2 font-medium">Voice Memo</h3>
          {editedContact.voiceMemo && (
            <div className="space-y-3">
              <audio src={editedContact.voiceMemo.url} controls className="w-full" />

              <div>
                <h4 className="mb-1 text-sm font-medium">Key Points</h4>
                <ul className="space-y-1">
                  {editedContact.voiceMemo.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="mr-1 h-4 w-4 shrink-0 text-green-500" />
                      <span className="text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium">Action Items</h3>
            {editable && (
              <div className="flex items-center gap-2">
                <Input
                  value={newActionItem}
                  onChange={(e) => setNewActionItem(e.target.value)}
                  placeholder="Add action item"
                  className="text-sm"
                />
                <Button size="sm" variant="outline" onClick={handleAddActionItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {editedContact.actionItems.length > 0 ? (
            <ul className="space-y-2">
              {editedContact.actionItems.map((item, index) => (
                <li key={index} className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2">
                  <span className="text-sm">{item}</span>
                  {editable && (
                    <Button size="sm" variant="ghost" onClick={() => handleRemoveActionItem(index)}>
                      <Trash2 className="h-4 w-4 text-zinc-400" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">No action items</p>
          )}
        </div>

        <Separator />

        <div>
          <h3 className="mb-2 font-medium">Contact Quality</h3>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => editable && handleRatingChange(rating)}
                disabled={!editable}
                className={`h-8 w-8 ${!editable && "cursor-default"}`}
              >
                <Star
                  className={`h-6 w-6 ${
                    rating <= editedContact.rating ? "fill-amber-400 text-amber-400" : "text-zinc-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </CardContent>

      {editable && (
        <CardFooter>
          <Button onClick={handleSave} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Save Contact
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
