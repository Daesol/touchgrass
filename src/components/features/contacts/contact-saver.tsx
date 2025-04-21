"use client"

import React, { useState } from "react"
import { useLocalStorage } from "@/hooks/storage/use-local-storage"
import { QrScanner } from "@/components/common/qr-scanner"
import { VoiceMemo } from "@/components/common/voice-memo"
import { ContactCard } from "@/components/features/contacts/contact-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { QrCode, LinkIcon, Plus, User } from "lucide-react"

export type Contact = {
  id: string
  linkedinUrl: string
  name: string
  position: string
  company: string
  summary: string
  voiceMemo: {
    url: string
    transcript: string
    keyPoints: string[]
  }
  actionItems: string[]
  rating: number
  date: string
}

export default function ContactSaver() {
  const [step, setStep] = useState<"scan" | "voice" | "details" | "preview">("scan")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [manualUrl, setManualUrl] = useState("")
  const [contact, setContact] = useState<Contact | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [showSavedContacts, setShowSavedContacts] = useState(false)

  const handleQrCodeScanned = (url: string) => {
    setLinkedinUrl(url)
    setStep("voice")
    // In a real app, we would fetch LinkedIn profile data here
    // For demo purposes, we'll simulate this with mock data
    simulateFetchLinkedInProfile(url)
  }

  const handleManualUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualUrl) return
    setLinkedinUrl(manualUrl)
    setStep("voice")
    simulateFetchLinkedInProfile(manualUrl)
  }

  const simulateFetchLinkedInProfile = (url: string) => {
    // This would be replaced with actual API call to get LinkedIn data
    const mockContact: Partial<Contact> = {
      id: Date.now().toString(),
      linkedinUrl: url,
      name: "Alex Johnson",
      position: "Product Manager",
      company: "TechCorp Inc.",
      summary: "Experienced product manager with 5+ years in SaaS products.",
      date: new Date().toLocaleDateString(),
    }
    setContact(mockContact as Contact)
  }

  const handleVoiceMemoComplete = (audioUrl: string, transcript: string) => {
    if (!contact) return

    // In a real app, we would process the transcript to extract key points
    // For demo purposes, we'll use mock data
    const keyPoints = [
      "Interested in AI applications",
      "Looking for partnerships in fintech",
      "Previously worked at Google",
    ]

    setContact({
      ...contact,
      voiceMemo: {
        url: audioUrl,
        transcript,
        keyPoints,
      },
      actionItems: ["Follow up in 2 weeks", "Share whitepaper"],
      rating: 4,
    })

    setStep("details")
  }

  const handleSaveContact = (updatedContact: Contact) => {
    const newContacts = [...contacts, updatedContact]
    setContacts(newContacts)
    // In a real app, we would save to a database or localStorage
    localStorage.setItem("networkProContacts", JSON.stringify(newContacts))
    setStep("preview")
  }

  const handleAddNew = () => {
    setContact(null)
    setLinkedinUrl("")
    setManualUrl("")
    setStep("scan")
    setShowSavedContacts(false)
  }

  return (
    <div className="space-y-4">
      {!showSavedContacts ? (
        <>
          {step === "scan" && (
            <Card>
              <CardHeader>
                <CardTitle>Scan LinkedIn Profile</CardTitle>
                <CardDescription>Scan a QR code or enter a LinkedIn URL</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="qr" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="qr">
                      <QrCode className="mr-2 h-4 w-4" />
                      Scan QR
                    </TabsTrigger>
                    <TabsTrigger value="url">
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Enter URL
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="qr" className="mt-4">
                    <QrScanner onScan={handleQrCodeScanned} />
                  </TabsContent>
                  <TabsContent value="url" className="mt-4">
                    <form onSubmit={handleManualUrlSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="linkedin-url">LinkedIn URL</Label>
                        <Input
                          id="linkedin-url"
                          placeholder="https://linkedin.com/in/username"
                          value={manualUrl}
                          onChange={(e) => setManualUrl(e.target.value)}
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Continue
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {step === "voice" && (
            <Card>
              <CardHeader>
                <CardTitle>Record Voice Memo</CardTitle>
                <CardDescription>Record a quick note about this contact</CardDescription>
              </CardHeader>
              <CardContent>
                <VoiceMemo onComplete={handleVoiceMemoComplete} />
              </CardContent>
            </Card>
          )}

          {step === "details" && contact && (
            <ContactCard contact={contact} editable={true} onSave={handleSaveContact} />
          )}

          {step === "preview" && contact && (
            <div className="space-y-4">
              <ContactCard contact={contact} editable={false} />
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setShowSavedContacts(true)}>
                  View All Contacts
                </Button>
                <Button onClick={handleAddNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Contact
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Saved Contacts</h2>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </div>

          {contacts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <User className="h-12 w-12 text-zinc-300" />
                <p className="mt-2 text-center text-zinc-500">No contacts saved yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {contacts.map((c) => (
                <Card key={c.id} className="cursor-pointer hover:bg-zinc-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{c.name}</h3>
                        <p className="text-sm text-zinc-500">
                          {c.position} at {c.company}
                        </p>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100">
                        <span className="text-sm font-medium">{c.rating}/5</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
