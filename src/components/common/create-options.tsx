"use client"

import { Calendar, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface CreateOptionsProps {
  onCreateEvent: () => void
  onCreateContact: () => void
  onClose: () => void
  showContactOption: boolean
}

export function CreateOptions({ onCreateEvent, onCreateContact, onClose, showContactOption }: CreateOptionsProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center pb-20 px-4">
      <Card className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-10 duration-300">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Create New</h3>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-2">
            <Button onClick={onCreateEvent} variant="outline" className="justify-start h-14">
              <Calendar className="mr-2 h-5 w-5 text-blue-500" />
              <div className="text-left">
                <div className="font-medium">New Event</div>
                <div className="text-xs text-muted-foreground">Add a networking event</div>
              </div>
            </Button>

            {showContactOption && (
              <Button onClick={onCreateContact} variant="outline" className="justify-start h-14">
                <Users className="mr-2 h-5 w-5 text-green-500" />
                <div className="text-left">
                  <div className="font-medium">New Contact</div>
                  <div className="text-xs text-muted-foreground">Add a person you met</div>
                </div>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
