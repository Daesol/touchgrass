"use client"

import { useState, useMemo } from "react"
import type { Task, Event, Contact } from "@/types/models"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckSquare, Filter, User, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, isAfter, isBefore, isToday, parseISO } from "date-fns"
import Link from 'next/link'

interface TaskListProps {
  tasks: Task[]
  events: Event[]
  contacts: Contact[]
  onUpdateStatus: (taskId: string, completed: boolean) => void
}

type FilterType = "all" | "today" | "upcoming" | "overdue" | "completed"

export function TaskList({ tasks, events, contacts, onUpdateStatus }: TaskListProps) {
  console.log("TaskList received tasks:", tasks); 

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<string>("all")
  const [selectedContact, setSelectedContact] = useState<string>("all")
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Text search
      const matchesSearch =
        searchQuery === "" ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.eventTitle.toLowerCase().includes(searchQuery.toLowerCase())

      // Event filter
      const matchesEvent = selectedEvent === "all" || task.eventId === selectedEvent

      // Contact filter
      const matchesContact = selectedContact === "all" || task.contactId === selectedContact

      // Date filter
      let matchesDateFilter = true
      const today = new Date()
      const dueDate = task.due_date ? parseISO(task.due_date) : null

      if (dueDate) {
        switch (filterType) {
          case "today":
            matchesDateFilter = isToday(dueDate)
            break
          case "upcoming":
            matchesDateFilter = isAfter(dueDate, today) && !isToday(dueDate)
            break
          case "overdue":
            matchesDateFilter = isBefore(dueDate, today) && !isToday(dueDate) && !task.completed
            break
          case "completed":
            break
        }
      } else if (filterType !== 'all' && filterType !== 'completed') {
        matchesDateFilter = false;
      }

      if (filterType === 'completed' && !task.completed) {
          return false;
      }
      if (filterType !== 'completed' && task.completed) {
          return false;
      }

      return matchesSearch && matchesEvent && matchesContact && matchesDateFilter
    })
  }, [tasks, searchQuery, selectedEvent, selectedContact, filterType])

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      return dateA - dateB;
    })
  }, [filteredTasks])

  const getDateStatus = (dateStr: string | null, completed: boolean) => {
    if (completed) return "completed"
    if (!dateStr) return "nodate";
    const today = new Date()
    const dueDate = parseISO(dateStr)
    if (isToday(dueDate)) return "today"
    if (isBefore(dueDate, today)) return "overdue"
    return "upcoming"
  }

  const taskCounts = useMemo(() => {
    const counts = { total: tasks.length, completed: 0, overdue: 0, today: 0, upcoming: 0, nodate: 0 };
    const today = new Date();
    tasks.forEach((task) => {
      if (task.completed) {
        counts.completed++;
      } else if (!task.due_date) {
        counts.nodate++;
      } else {
        const dueDate = parseISO(task.due_date);
        if (isToday(dueDate)) counts.today++;
        else if (isBefore(dueDate, today)) counts.overdue++;
        else counts.upcoming++;
      }
    });
    return counts;
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
        <CheckSquare className="h-12 w-12 text-zinc-300" />
        <h3 className="mt-2 text-lg font-medium">No tasks yet</h3>
        <p className="text-sm text-muted-foreground">Add action items to your contacts to see tasks here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showAdvancedFilters && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              title={showAdvancedFilters ? "Hide Filters" : "Show Filters"}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Task Summary - Compact Layout */}
          <Card className="mb-4">
            <CardContent className="p-3">
              <div className="flex flex-nowrap justify-between overflow-x-auto gap-4 pb-1">
                <div className="flex flex-col items-center">
                  <div className="text-xs text-zinc-500 mb-1">Total</div>
                  <div className="h-10 w-10 bg-zinc-100 flex items-center justify-center rounded-md">
                    <span className="font-bold">{taskCounts.total}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-xs text-zinc-500 mb-1">Today</div>
                  <div className="h-10 w-10 bg-blue-100 flex items-center justify-center rounded-md">
                    <span className="font-bold text-blue-600">{taskCounts.today}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-xs text-zinc-500 mb-1">Overdue</div>
                  <div className="h-10 w-10 bg-red-100 flex items-center justify-center rounded-md">
                    <span className="font-bold text-red-600">{taskCounts.overdue}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-xs text-zinc-500 mb-1">Done</div>
                  <div className="h-10 w-10 bg-green-100 flex items-center justify-center rounded-md">
                    <span className="font-bold text-green-600">{taskCounts.completed}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {showAdvancedFilters && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="event-filter">Event</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger id="event-filter">
                    <SelectValue placeholder="Filter by event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-filter">Contact</Label>
                <Select value={selectedContact} onValueChange={setSelectedContact}>
                  <SelectTrigger id="contact-filter">
                    <SelectValue placeholder="Filter by contact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contacts</SelectItem>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-filter">Due Date</Label>
                <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
                  <SelectTrigger id="date-filter">
                    <SelectValue placeholder="Filter by due date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tasks</SelectItem>
                    <SelectItem value="today">Due Today</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-muted-foreground">
          {sortedTasks.length} {sortedTasks.length === 1 ? "task" : "tasks"} found
        </div>
      </div>

      <div className="space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-zinc-500">No tasks match your filters</p>
          </div>
        ) : (
          sortedTasks.map((task) => {
            const dateStatus = getDateStatus(task.due_date, task.completed ?? false)
            let dateBadgeVariant: "default" | "destructive" | "secondary" | "outline" = "secondary";
            let dateBadgeText = "Upcoming";
            switch (dateStatus) {
                case "completed": dateBadgeVariant = "outline"; dateBadgeText = "Completed"; break;
                case "today": dateBadgeVariant = "default"; dateBadgeText = "Due Today"; break;
                case "overdue": dateBadgeVariant = "destructive"; dateBadgeText = "Overdue"; break;
                case "nodate": dateBadgeVariant = "secondary"; dateBadgeText = "No Due Date"; break;
            }

            return (
              <Card key={task.id} className={`${task.completed ? "bg-zinc-50" : "hover:bg-muted/50 transition-colors"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.completed ?? false}
                      onCheckedChange={(checked) => {
                        onUpdateStatus(task.id, checked === true)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />

                    <Link href={`/tasks/${task.id}`} className="flex-1 space-y-1 cursor-pointer">
                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          htmlFor={`task-${task.id}`}
                          className={`font-medium ${task.completed ? "line-through text-zinc-400" : "text-foreground"}`}
                        >
                          {task.title}
                        </label>

                        <Badge variant={dateBadgeVariant} className="ml-auto">
                          {dateBadgeText}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                        <div className="flex items-center">
                          <User className="mr-1 h-3 w-3" />
                          {task.contactName}
                        </div>

                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {task.due_date ? format(parseISO(task.due_date), "MMM d, yyyy") : "-"}
                        </div>

                        <div className="flex items-center">
                          <Badge variant="outline" className="h-5 px-1">
                            {task.eventTitle}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
