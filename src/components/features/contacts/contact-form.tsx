"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import type { Event, Contact, ActionItem } from "@/types/models"
import { QrScanner } from "@/components/common/qr-scanner"
import { VoiceMemo, type Recording } from "@/components/common/voice-memo"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Star, Trash2, LinkIcon, QrCode, Check, Calendar } from "lucide-react"
import { format } from "date-fns"

interface ContactFormProps {
  event: Event
  onSave: (contact: Contact, actionItems: ActionItem[]) => void
  onCancel: () => void
  existingContact?: Contact
}

export function ContactForm({ event, onSave, onCancel, existingContact }: ContactFormProps) {
  const [linkedin_url, setLinkedinUrl] = useState(existingContact?.linkedin_url || "")
  const [manualUrl, setManualUrl] = useState("")
  const [scanMethod, setScanMethod] = useState<"qr" | "url">("url")
  const [recordings, setRecordings] = useState<Recording[]>(
    existingContact?.voice_memo?.url
      ? [
          {
            id: "existing",
            url: existingContact.voice_memo.url,
            transcript: "",
            keyPoints: [],
            timestamp: existingContact.updated_at || existingContact.created_at || "",
          },
        ]
      : []
  )
  const [name, setName] = useState(existingContact?.name || "")
  const [position, setPosition] = useState(existingContact?.position || "")
  const [company, setCompany] = useState(existingContact?.company || "")
  const [summary, setSummary] = useState(existingContact?.summary || "")
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [newActionItem, setNewActionItem] = useState("")
  const [newActionDueDate, setNewActionDueDate] = useState(format(new Date(), "yyyy-MM-dd"))

  const isEditMode = !!existingContact

  const handleQrCodeScanned = (url: string) => {
    setLinkedinUrl(url)
    // Only simulate fetching profile data if we're not in edit mode
    if (!isEditMode) {
      simulateFetchLinkedInProfile(url)
    }
  }

  const handleManualUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualUrl) return
    setLinkedinUrl(manualUrl)
    // Only simulate fetching profile data if we're not in edit mode
    if (!isEditMode) {
      simulateFetchLinkedInProfile(manualUrl)
    }
  }

  const simulateFetchLinkedInProfile = (url: string) => {
    // This would be replaced with actual API call to get LinkedIn data
    setName("Alex Johnson")
    setPosition("Product Manager")
    setCompany("TechCorp Inc.")
    setSummary("Experienced product manager with 5+ years in SaaS products.")
  }

  const handleAddRecording = (recording: Recording) => {
    setRecordings([...recordings, recording])
  }

  const handleDeleteRecording = (id: string) => {
    setRecordings(recordings.filter((r) => r.id !== id))
  }

  const handleAddActionItem = () => {
    if (!newActionItem.trim()) return

    const newItem: ActionItem = {
      id: Date.now().toString(),
      user_id: existingContact?.user_id || 'mock_user_id',
      contact_id: existingContact?.id || null,
      text: newActionItem.trim(),
      due_date: newActionDueDate || null,
      completed: false,
      description: null,
      event_id: existingContact?.event_id || event?.id || null,
    }

    setActionItems([...actionItems, newItem])
    setNewActionItem("")
  }

  const handleRemoveActionItem = (id: string) => {
    setActionItems(actionItems.filter((item) => item.id !== id))
  }

  const handleSave = () => {
    // Only require name as mandatory field, make linkedin_url optional
    if (!name) {
      alert("Please enter a contact name");
      return;
    }

    // Get key points from all recordings
    const allKeyPoints = recordings.flatMap((r) => r.keyPoints)

    const contact: Contact = {
      id: existingContact?.id || Date.now().toString(),
      user_id: existingContact?.user_id || 'mock_user_id',
      event_id: event.id,
      linkedin_url: linkedin_url || undefined,
      name,
      position,
      company,
      summary,
      email: existingContact?.email,
      phone: existingContact?.phone,
      voice_memo: recordings.length > 0 
        ? { url: recordings[0].url, duration: 0 /* TODO: Get actual duration */ } 
        : undefined,
      created_at: existingContact?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("Saving contact:", contact, "with action items:", actionItems);
    onSave(contact, actionItems)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit Contact" : "Add New Contact"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* LinkedIn Profile Section */}
          <div className="space-y-4">
            <h3 className="font-medium">LinkedIn Profile</h3>

            <div className="flex space-x-2">
              <Button
                variant={scanMethod === "qr" ? "default" : "outline"}
                onClick={() => setScanMethod("qr")}
                className="flex-1"
              >
                <QrCode className="mr-2 h-4 w-4" />
                QR
              </Button>
              <Button
                variant={scanMethod === "url" ? "default" : "outline"}
                onClick={() => setScanMethod("url")}
                className="flex-1"
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                URL
              </Button>
            </div>

            {scanMethod === "qr" ? (
              <QrScanner onScan={handleQrCodeScanned} />
            ) : (
              <form onSubmit={handleManualUrlSubmit} className="space-y-2">
                <Input
                  placeholder="https://linkedin.com/in/username"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                />
                <Button type="submit" className="w-full">
                  Apply
                </Button>
              </form>
            )}

            {linkedin_url && (
              <div className="rounded-md bg-zinc-50 p-3">
                <p className="text-sm text-zinc-700 break-all">{linkedin_url}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contact name" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Job title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief profile summary"
                rows={3}
              />
            </div>
          </div>

          {/* Voice Memo & Action Items Section */}
          <div className="space-y-4">
            <h3 className="font-medium">Voice Memo</h3>
            <VoiceMemo
              onComplete={handleAddRecording}
              recordings={recordings}
              onDeleteRecording={handleDeleteRecording}
            />

            {recordings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Key Points</h4>
                <ul className="space-y-1 rounded-md bg-zinc-50 p-3">
                  {recordings
                    .flatMap((r) => r.keyPoints)
                    .map((point, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="mr-1 h-4 w-4 shrink-0 text-green-500" />
                        <span className="text-sm">{point}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <h3 className="font-medium">Action Items</h3>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex space-x-2">
                  <Input
                    value={newActionItem}
                    onChange={(e) => setNewActionItem(e.target.value)}
                    placeholder="Add action item"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddActionItem()
                      }
                    }}
                  />
                </div>

                <div className="flex space-x-2">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="due-date" className="text-xs">
                      Due Date
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-zinc-500" />
                      <Input
                        id="due-date"
                        type="date"
                        value={newActionDueDate}
                        onChange={(e) => setNewActionDueDate(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <Button onClick={handleAddActionItem} className="self-end">
                    Add
                  </Button>
                </div>
              </div>

              {actionItems.length > 0 ? (
                <ul className="space-y-2 mt-2">
                  {actionItems.map((item) => (
                    <li key={item.id} className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2">
                      <div className="space-y-1">
                        <span className="text-sm">{item.text}</span>
                        <div className="flex items-center text-xs text-zinc-500">
                          <Calendar className="mr-1 h-3 w-3" />
                          {item.due_date ? format(new Date(item.due_date), "MMM d, yyyy") : "No due date"}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleRemoveActionItem(item.id)}>
                        <Trash2 className="h-4 w-4 text-zinc-400" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">No action items</p>
              )}
            </div>

            <Separator />

            <div className="flex space-x-2 pt-4">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1">
                {isEditMode ? "Update Contact" : "Save Contact"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
