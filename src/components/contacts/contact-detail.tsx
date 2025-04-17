"use client"
import type { Contact } from "@/components/dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Edit, Briefcase, Calendar, User, Linkedin, Mic, CheckSquare, ExternalLink } from "lucide-react"
import { format, parseISO } from "date-fns"
import { gradients } from "@/components/events/event-list"

interface ContactDetailProps {
  contact: Contact
  event?: { id: string; colorIndex: string } // Add event prop to get color info
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
  const colorIndex = event ? Number.parseInt(event.colorIndex || "0") : 0
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

      <Card className={`${getRatingBorderColor(contact.rating)}`}>
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
                  {contact.eventTitle}
                </Badge>
                <div
                  className={`ml-2 px-2 py-0.5 rounded-md text-white font-medium text-sm ${
                    contact.rating === 1
                      ? "bg-rose-500"
                      : contact.rating === 2
                        ? "bg-orange-500"
                        : contact.rating === 3
                          ? "bg-amber-500"
                          : contact.rating === 4
                            ? "bg-blue-500"
                            : "bg-emerald-500"
                  }`}
                >
                  {contact.rating}/5
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center text-sm text-zinc-600">
              <Briefcase className="mr-2 h-4 w-4 text-zinc-500" />
              <span>
                {contact.position} at {contact.company}
              </span>
            </div>
            <div className="flex items-center text-sm text-zinc-600">
              <Calendar className="mr-2 h-4 w-4 text-zinc-500" />
              <span>Added on {contact.date}</span>
            </div>
            <div className="flex items-center text-sm text-zinc-600">
              <Linkedin className="mr-2 h-4 w-4 text-zinc-500" />
              <a
                href={contact.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center"
              >
                LinkedIn Profile
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-2">Profile Summary</h3>
            <p className="text-zinc-700">{contact.summary}</p>
          </div>

          <Separator />

          {contact.voiceMemo && contact.voiceMemo.keyPoints.length > 0 && (
            <>
              <div>
                <h3 className="font-medium mb-2 flex items-center">
                  <Mic className="mr-2 h-4 w-4" />
                  Voice Memo Notes
                </h3>

                {contact.voiceMemo.url && <audio src={contact.voiceMemo.url} controls className="w-full mb-2" />}

                <div className="bg-muted rounded-md p-3">
                  <h4 className="text-sm font-medium mb-2">Key Points</h4>
                  <ul className="space-y-1">
                    {contact.voiceMemo.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <span className="text-green-500 mr-2">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <Separator />
            </>
          )}

          <div>
            <h3 className="font-medium mb-2 flex items-center">
              <CheckSquare className="mr-2 h-4 w-4" />
              Action Items
            </h3>

            {contact.actionItems.length > 0 ? (
              <div className="space-y-2">
                {contact.actionItems.map((item) => (
                  <div key={item.id} className="flex items-start p-3 bg-muted rounded-md">
                    <Checkbox
                      id={`task-${item.id}`}
                      checked={item.completed}
                      onCheckedChange={(checked) => {
                        onUpdateTask(item.id, checked === true)
                      }}
                      className="mt-0.5 mr-3"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`task-${item.id}`}
                        className={`font-medium ${item.completed ? "line-through text-zinc-400" : ""}`}
                      >
                        {item.text}
                      </label>
                      <div className="text-xs text-zinc-500 mt-1 flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        Due: {format(parseISO(item.dueDate), "MMMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">No action items</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
