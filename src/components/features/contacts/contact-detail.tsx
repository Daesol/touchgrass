"use client"
import type { Contact } from "@/types/models"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Edit, Briefcase, Calendar, User, Linkedin, Mic, CheckSquare, ExternalLink } from "lucide-react"
import { format, parseISO } from "date-fns"
import { gradients } from "@/components/features/events/event-list"

interface ContactDetailProps {
  contact: Contact
  event?: { 
    id: string; 
    title: string;
    color_index: string;
  }
  onBack: () => void
  onEdit: (contact: Contact) => void
  onUpdateTask: (taskId: string, completed: boolean) => void
}

export function ContactDetail({ contact, event, onBack, onEdit, onUpdateTask }: ContactDetailProps) {
  // Function to get border color based on rating
  const getRatingBorderColor = (rating: number) => {
    switch (rating) {
      case 5:
        return "border-t-4 border-t-emerald-500" // Excellent - Green
      case 4:
        return "border-t-4 border-t-blue-500" // Good - Blue
      case 3:
        return "border-t-4 border-t-amber-500" // Average - Amber
      case 2:
        return "border-t-4 border-t-orange-500" // Below average - Orange
      case 1:
        return "border-t-4 border-t-rose-500" // Poor - Red
      default:
        return "" // No rating
    }
  }

  // Determine the color for the event badge
  const colorIndex = event ? parseInt(event.color_index || "0") : 0
  const [gradientClass, bgClass] = gradients[colorIndex % gradients.length]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button variant="outline" onClick={() => onEdit(contact)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Contact
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <Avatar className="h-16 w-16 mr-4">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contact.name)}`}
                alt={contact.name}
              />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{contact.name}</CardTitle>
              <div className="flex items-center mt-1">
                <Badge
                  variant="outline"
                  className={`mr-2 border-0 ${bgClass} bg-opacity-50`}
                  style={{
                    background: `linear-gradient(to right, var(--${gradientClass.split("-")[1]}), var(--${gradientClass.split("-")[3]}))`,
                  }}
                >
                  {event?.title || contact.event_id} 
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center text-sm text-zinc-600">
              <Briefcase className="mr-2 h-4 w-4 text-zinc-500" />
              <span>
                {contact.position || 'N/A'} at {contact.company || 'N/A'}
              </span>
            </div>
            <div className="flex items-center text-sm text-zinc-600">
              <Calendar className="mr-2 h-4 w-4 text-zinc-500" />
              <span>Added on {contact.created_at ? format(parseISO(contact.created_at), "MMMM d, yyyy") : 'Unknown Date'}</span> 
            </div>
            {contact.linkedin_url && ( // Use linkedin_url
              <div className="flex items-center text-sm text-zinc-600">
                <Linkedin className="mr-2 h-4 w-4 text-zinc-500" />
                <a
                  href={contact.linkedin_url} // Use linkedin_url
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center"
                >
                  LinkedIn Profile
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-2">Profile Summary</h3>
            <p className="text-zinc-700">{contact.summary || 'No summary available'}</p>
          </div>

          <Separator />

          {contact.voice_memo && contact.voice_memo.url && (
            <>
              <div>
                <h3 className="font-medium mb-2 flex items-center">
                  <Mic className="mr-2 h-4 w-4" />
                  Voice Memo Notes
                </h3>

                <audio src={contact.voice_memo.url} controls className="w-full mb-2" /> 
              </div>
              <Separator />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
