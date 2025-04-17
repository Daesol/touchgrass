"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { User, Settings, LogOut, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ProfileSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="https://api.dicebear.com/7.x/initials/svg?seed=User" alt="User" />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Manage your account settings and preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Separator />
            <div className="grid gap-4">
              <Button variant="outline" className="justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </Button>
              <Button variant="outline" className="justify-start">
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </Button>
              <Button variant="outline" className="justify-start text-destructive hover:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About NetworkPro</CardTitle>
          <CardDescription>Version 1.0.0</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            NetworkPro helps you manage your professional networking contacts and events. Keep track of people you meet,
            important conversations, and follow-up tasks.
          </p>
          <div className="mt-4 text-xs text-muted-foreground">
            <p>© 2025 NetworkPro. All rights reserved.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
