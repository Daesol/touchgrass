"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { EventList } from "@/components/events/event-list"
import { ContactList } from "@/components/contacts/contact-list"
import { ContactDetail } from "@/components/contacts/contact-detail"
import { TaskList } from "@/components/tasks/task-list"
import { Button } from "@/components/ui/button"
import { Plus, Calendar, Users, CheckSquare, User } from "lucide-react"
import { EventForm } from "@/components/events/event-form"
import { ContactForm } from "@/components/contacts/contact-form"
import { useLocalStorage } from "@/hooks/storage/use-local-storage"
import { ProfileSection } from "@/components/profile/profile-section"
import { CreateOptions } from "@/components/common/create-options"
import { EventSelector } from "@/components/events/event-selector"

export type Event = {
  id: string
  title: string
  location?: string
  company?: string
  date: string
  colorIndex: string // Add this property to store the color index
}

export type ActionItem = {
  id: string
  text: string
  dueDate: string
  completed: boolean
}

export type Contact = {
  id: string
  eventId: string
  eventTitle: string
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
  actionItems: ActionItem[]
  rating: number
  date: string
}

export type Task = ActionItem & {
  contactId: string
  contactName: string
  eventId: string
  eventTitle: string
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("events")
  const [showEventForm, setShowEventForm] = useState(false)
  const [events, setEvents] = useLocalStorage<Event[]>("networkProEvents", [])
  const [contacts, setContacts] = useLocalStorage<Contact[]>("networkProContacts", [])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showContactForm, setShowContactForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null)
  const [showCreateOptions, setShowCreateOptions] = useState(false)
  const [showEventSelector, setShowEventSelector] = useState(false)

  // Load mock data if no data exists
  useEffect(() => {
    const loadMockData = async () => {
      // Only load mock data if both events and contacts are empty
      if (events.length === 0 && contacts.length === 0) {
        try {
          // Instead of fetching from a file, use inline mock data
          const mockData = {
            events: [
              {
                id: "evt-001",
                title: "Tech Innovators Conference",
                location: "San Francisco, CA",
                company: "TechCorp Inc.",
                date: "April 10, 2025",
                colorIndex: "0", // Add color indices to mock data
              },
              {
                id: "evt-002",
                title: "Startup Networking Mixer",
                location: "New York, NY",
                company: "Venture Capital Partners",
                date: "April 5, 2025",
                colorIndex: "1",
              },
              {
                id: "evt-003",
                title: "Women in Tech Summit",
                location: "Chicago, IL",
                company: "WIT Foundation",
                date: "March 28, 2025",
                colorIndex: "2",
              },
              {
                id: "evt-004",
                title: "AI & Machine Learning Expo",
                location: "Austin, TX",
                company: "Future AI Labs",
                date: "March 15, 2025",
                colorIndex: "3",
              },
            ],
            contacts: [
              {
                id: "cnt-001",
                eventId: "evt-001",
                eventTitle: "Tech Innovators Conference",
                linkedinUrl: "https://linkedin.com/in/sarahjohnson",
                name: "Sarah Johnson",
                position: "CTO",
                company: "InnovateTech",
                summary:
                  "Experienced CTO with a focus on AI and machine learning. Looking for partnerships in the healthcare tech space.",
                voiceMemo: {
                  url: "",
                  transcript:
                    "Sarah mentioned her company is expanding into healthcare AI. They're looking for data partners and have a new product launching in Q3. She previously worked at Google Health.",
                  keyPoints: [
                    "Expanding into healthcare AI",
                    "Looking for data partnerships",
                    "New product launch in Q3",
                  ],
                },
                actionItems: [
                  {
                    id: "act-001",
                    text: "Send healthcare AI whitepaper",
                    dueDate: "2025-04-15",
                    completed: false,
                  },
                  {
                    id: "act-002",
                    text: "Introduce to Dr. Michael from MedTech",
                    dueDate: "2025-04-20",
                    completed: false,
                  },
                  {
                    id: "act-003",
                    text: "Follow up about partnership opportunity",
                    dueDate: "2025-05-01",
                    completed: false,
                  },
                ],
                rating: 5,
                date: "April 10, 2025",
              },
              {
                id: "cnt-002",
                eventId: "evt-001",
                eventTitle: "Tech Innovators Conference",
                linkedinUrl: "https://linkedin.com/in/davidchen",
                name: "David Chen",
                position: "Product Manager",
                company: "CloudScale",
                summary:
                  "Product manager specializing in cloud infrastructure products. Interested in our API integration capabilities.",
                voiceMemo: {
                  url: "",
                  transcript:
                    "David's team is building a new developer platform. They're interested in our API documentation approach and might want to collaborate on standards.",
                  keyPoints: [
                    "Building new developer platform",
                    "Interested in API documentation",
                    "Potential collaboration on standards",
                  ],
                },
                actionItems: [
                  {
                    id: "act-004",
                    text: "Share API documentation templates",
                    dueDate: "2025-04-12",
                    completed: true,
                  },
                  {
                    id: "act-005",
                    text: "Schedule technical demo",
                    dueDate: "2025-04-18",
                    completed: false,
                  },
                ],
                rating: 4,
                date: "April 10, 2025",
              },
              {
                id: "cnt-003",
                eventId: "evt-002",
                eventTitle: "Startup Networking Mixer",
                linkedinUrl: "https://linkedin.com/in/emilywong",
                name: "Emily Wong",
                position: "Founder & CEO",
                company: "GreenTech Solutions",
                summary:
                  "Founder of a sustainability-focused startup. Looking for technical advisors and potential investors.",
                voiceMemo: {
                  url: "",
                  transcript:
                    "Emily's startup is focused on reducing carbon footprints for businesses. They have an innovative approach to measuring and offsetting emissions. Currently raising a seed round.",
                  keyPoints: [
                    "Sustainability-focused startup",
                    "Innovative carbon measurement",
                    "Raising seed funding",
                  ],
                },
                actionItems: [
                  {
                    id: "act-006",
                    text: "Connect with angel investor network",
                    dueDate: "2025-04-08",
                    completed: false,
                  },
                  {
                    id: "act-007",
                    text: "Send technical advisor application",
                    dueDate: "2025-04-14",
                    completed: false,
                  },
                ],
                rating: 5,
                date: "April 5, 2025",
              },
              {
                id: "cnt-004",
                eventId: "evt-002",
                eventTitle: "Startup Networking Mixer",
                linkedinUrl: "https://linkedin.com/in/marcusrodriguez",
                name: "Marcus Rodriguez",
                position: "VP of Sales",
                company: "SaaS Growth Partners",
                summary:
                  "Sales executive specializing in B2B SaaS. Has connections with several enterprise clients we've been targeting.",
                voiceMemo: {
                  url: "",
                  transcript:
                    "Marcus works with enterprise clients in finance and healthcare. He mentioned Acme Corp is looking for our type of solution and he could make an introduction.",
                  keyPoints: [
                    "Works with finance and healthcare clients",
                    "Can introduce to Acme Corp",
                    "Experienced in enterprise sales cycles",
                  ],
                },
                actionItems: [
                  {
                    id: "act-008",
                    text: "Send company overview for Acme intro",
                    dueDate: "2025-04-07",
                    completed: true,
                  },
                  {
                    id: "act-009",
                    text: "Schedule coffee meeting",
                    dueDate: "2025-04-13",
                    completed: false,
                  },
                ],
                rating: 4,
                date: "April 5, 2025",
              },
              {
                id: "cnt-005",
                eventId: "evt-003",
                eventTitle: "Women in Tech Summit",
                linkedinUrl: "https://linkedin.com/in/priyapatel",
                name: "Priya Patel",
                position: "Engineering Director",
                company: "TechDiversity Inc.",
                summary:
                  "Engineering leader focused on building diverse tech teams. Interested in our internship program and hiring practices.",
                voiceMemo: {
                  url: "",
                  transcript:
                    "Priya runs a mentorship program for underrepresented groups in tech. She's interested in partnering on workshops and potentially setting up a talent pipeline.",
                  keyPoints: [
                    "Runs mentorship program",
                    "Interested in workshop partnership",
                    "Potential talent pipeline",
                  ],
                },
                actionItems: [
                  {
                    id: "act-010",
                    text: "Share internship program details",
                    dueDate: "2025-04-01",
                    completed: true,
                  },
                  {
                    id: "act-011",
                    text: "Propose workshop collaboration",
                    dueDate: "2025-04-10",
                    completed: false,
                  },
                  {
                    id: "act-012",
                    text: "Introduce to HR director",
                    dueDate: "2025-04-15",
                    completed: false,
                  },
                ],
                rating: 5,
                date: "March 28, 2025",
              },
              {
                id: "cnt-006",
                eventId: "evt-004",
                eventTitle: "AI & Machine Learning Expo",
                linkedinUrl: "https://linkedin.com/in/jameslee",
                name: "James Lee",
                position: "AI Research Scientist",
                company: "DeepMind Technologies",
                summary:
                  "AI researcher specializing in natural language processing. Interested in our dataset and annotation methods.",
                voiceMemo: {
                  url: "",
                  transcript:
                    "James is working on a new NLP model and is looking for high-quality training data. He's also interested in our annotation platform and might want to collaborate on research.",
                  keyPoints: ["Working on new NLP model", "Needs training data", "Interested in annotation platform"],
                },
                actionItems: [
                  {
                    id: "act-013",
                    text: "Send dataset documentation",
                    dueDate: "2025-03-20",
                    completed: true,
                  },
                  {
                    id: "act-014",
                    text: "Schedule demo of annotation platform",
                    dueDate: "2025-03-25",
                    completed: true,
                  },
                  {
                    id: "act-015",
                    text: "Discuss research collaboration",
                    dueDate: "2025-04-05",
                    completed: false,
                  },
                ],
                rating: 4,
                date: "March 15, 2025",
              },
              {
                id: "cnt-007",
                eventId: "evt-004",
                eventTitle: "AI & Machine Learning Expo",
                linkedinUrl: "https://linkedin.com/in/sophiawilliams",
                name: "Sophia Williams",
                position: "Head of Innovation",
                company: "Enterprise Solutions",
                summary:
                  "Innovation leader at a large enterprise. Looking for AI solutions to improve customer service operations.",
                voiceMemo: {
                  url: "",
                  transcript:
                    "Sophia's team is evaluating AI chatbot solutions for customer service. They have a large support team and want to automate routine inquiries. Budget approval expected in Q2.",
                  keyPoints: ["Evaluating AI chatbots", "Large customer support team", "Budget approval in Q2"],
                },
                actionItems: [
                  {
                    id: "act-016",
                    text: "Send case studies on customer service AI",
                    dueDate: "2025-03-18",
                    completed: true,
                  },
                  {
                    id: "act-017",
                    text: "Prepare ROI analysis",
                    dueDate: "2025-04-01",
                    completed: false,
                  },
                  {
                    id: "act-018",
                    text: "Follow up on budget approval",
                    dueDate: "2025-04-15",
                    completed: false,
                  },
                ],
                rating: 5,
                date: "March 15, 2025",
              },
            ],
          }

          if (mockData.events && mockData.events.length > 0) {
            setEvents(mockData.events)
          }

          if (mockData.contacts && mockData.contacts.length > 0) {
            setContacts(mockData.contacts)
          }
        } catch (error) {
          console.error("Failed to load mock data:", error)
        }
      }
      setIsLoading(false)
    }

    loadMockData()
  }, [events.length, contacts.length, setEvents, setContacts])

  // Derive tasks from contacts and their action items
  const tasks: Task[] = contacts.flatMap((contact) =>
    contact.actionItems.map((item) => ({
      ...item,
      contactId: contact.id,
      contactName: contact.name,
      eventId: contact.eventId,
      eventTitle: contact.eventTitle,
    })),
  )

  const handleCreateEvent = (event: Event) => {
    setEvents([...events, event])
    setShowEventForm(false)

    // If we were in the event selector flow, continue to contact form with the new event
    if (showEventSelector) {
      setShowEventSelector(false)
      setSelectedEvent(event)
      setShowContactForm(true)
    }
  }

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event)
    setSelectedContact(null)

    // If we're in the event selector flow, continue to contact form
    if (showEventSelector) {
      setShowEventSelector(false)
      setShowContactForm(true)
    }
  }

  const handleBackToEvents = () => {
    setSelectedEvent(null)
    setSelectedContact(null)
    setShowContactForm(false)
  }

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact)
    setContactToEdit(null)
  }

  const handleBackToContacts = () => {
    setSelectedContact(null)
  }

  const handleAddContact = (contact: Contact) => {
    setContacts([...contacts, contact])
    setShowContactForm(false)
  }

  const handleEditContact = (contact: Contact) => {
    setContactToEdit(contact)

    // If we're in event view or contact detail view, we need to make sure we're showing the contact form
    if (selectedEvent || selectedContact) {
      setShowContactForm(true)
    } else {
      // If we're in the main tabs view, switch to contacts tab
      setActiveTab("contacts")
    }
  }

  const handleSaveContact = (updatedContact: Contact) => {
    // Check if this is an update or a new contact
    if (contactToEdit) {
      // Update existing contact
      const updatedContacts = contacts.map((c) => (c.id === updatedContact.id ? updatedContact : c))
      setContacts(updatedContacts)

      // If we were viewing this contact's details, update the selected contact
      if (selectedContact && selectedContact.id === updatedContact.id) {
        setSelectedContact(updatedContact)
      }

      setContactToEdit(null)
    } else {
      // Add new contact
      setContacts([...contacts, updatedContact])
    }

    setShowContactForm(false)
  }

  const handleCancelEdit = () => {
    setContactToEdit(null)
    setShowContactForm(false)
  }

  const handleUpdateTaskStatus = (taskId: string, completed: boolean) => {
    const updatedContacts = contacts.map((contact) => {
      const updatedItems = contact.actionItems.map((item) => (item.id === taskId ? { ...item, completed } : item))

      if (JSON.stringify(updatedItems) !== JSON.stringify(contact.actionItems)) {
        return { ...contact, actionItems: updatedItems }
      }
      return contact
    })

    setContacts(updatedContacts)

    // If we're viewing a contact's details, update the selected contact
    if (selectedContact) {
      const updatedContact = updatedContacts.find((c) => c.id === selectedContact.id)
      if (updatedContact) {
        setSelectedContact(updatedContact)
      }
    }
  }

  const handleCreateOptionSelect = (option: "event" | "contact") => {
    setShowCreateOptions(false)

    if (option === "event") {
      setShowEventForm(true)
    } else {
      // For creating a contact, show the event selector first
      if (events.length > 0) {
        setShowEventSelector(true)
      } else {
        // If no events exist, show event form first
        setShowEventForm(true)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl p-4 flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 bg-background text-foreground">
      <header className="mb-4">
        <h1 className="text-xl font-bold">NetworkPro</h1>
        <p className="text-xs text-muted-foreground">Manage your networking events and contacts</p>
      </header>

      {selectedEvent ? (
        <div className="space-y-4 pb-16">
          {selectedContact ? (
            showContactForm ? (
              <ContactForm
                event={selectedEvent}
                onSave={handleSaveContact}
                onCancel={handleCancelEdit}
                existingContact={contactToEdit || selectedContact}
              />
            ) : (
              <ContactDetail
                contact={selectedContact}
                event={selectedEvent}
                onBack={handleBackToContacts}
                onEdit={handleEditContact}
                onUpdateTask={handleUpdateTaskStatus}
              />
            )
          ) : (
            <>
              <div className="flex items-center">
                <Button variant="ghost" onClick={handleBackToEvents} className="mr-2">
                  ← Back to Events
                </Button>
                <h2 className="text-xl font-semibold">{selectedEvent.title}</h2>
              </div>

              {showContactForm ? (
                <ContactForm
                  event={selectedEvent}
                  onSave={handleSaveContact}
                  onCancel={handleCancelEdit}
                  existingContact={contactToEdit}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Contacts from this event</h3>
                    <Button onClick={() => setShowContactForm(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Contact
                    </Button>
                  </div>

                  <ContactList
                    contacts={contacts.filter((c) => c.eventId === selectedEvent.id)}
                    events={[selectedEvent]}
                    compact={false}
                    onEditContact={handleEditContact}
                    onSelectContact={handleSelectContact}
                  />
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          <div className="pb-16 mb-2">
            <Tabs defaultValue="events" value={activeTab} onValueChange={setActiveTab}>
              {/* Tab content remains at the top */}
              <TabsContent value="events" className="mt-4">
                {showEventForm ? (
                  <EventForm onSubmit={handleCreateEvent} onCancel={() => setShowEventForm(false)} />
                ) : showEventSelector ? (
                  <EventSelector
                    events={events}
                    onSelectEvent={handleSelectEvent}
                    onCancel={() => setShowEventSelector(false)}
                    onCreateNewEvent={() => {
                      setShowEventSelector(false)
                      setShowEventForm(true)
                    }}
                  />
                ) : (
                  <EventList events={events} onSelectEvent={handleSelectEvent} contacts={contacts} />
                )}
              </TabsContent>

              <TabsContent value="contacts" className="mt-4">
                {contactToEdit ? (
                  <ContactForm
                    event={events.find((e) => e.id === contactToEdit.eventId) || events[0]}
                    onSave={handleSaveContact}
                    onCancel={handleCancelEdit}
                    existingContact={contactToEdit}
                  />
                ) : selectedContact ? (
                  <ContactDetail
                    contact={selectedContact}
                    onBack={handleBackToContacts}
                    onEdit={handleEditContact}
                    onUpdateTask={handleUpdateTaskStatus}
                  />
                ) : showEventSelector ? (
                  <EventSelector
                    events={events}
                    onSelectEvent={handleSelectEvent}
                    onCancel={() => setShowEventSelector(false)}
                    onCreateNewEvent={() => {
                      setShowEventSelector(false)
                      setShowEventForm(true)
                    }}
                  />
                ) : (
                  <ContactList
                    contacts={contacts}
                    events={events}
                    onEditContact={handleEditContact}
                    onSelectContact={handleSelectContact}
                  />
                )}
              </TabsContent>

              <TabsContent value="tasks" className="mt-4">
                <TaskList tasks={tasks} events={events} contacts={contacts} onUpdateStatus={handleUpdateTaskStatus} />
              </TabsContent>

              <TabsContent value="profile" className="mt-4">
                <ProfileSection />
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}

      {/* Create Options Modal */}
      {showCreateOptions && (
        <CreateOptions
          onCreateEvent={() => handleCreateOptionSelect("event")}
          onCreateContact={() => handleCreateOptionSelect("contact")}
          onClose={() => setShowCreateOptions(false)}
          showContactOption={events.length > 0 || selectedEvent !== null}
        />
      )}

      {/* Bottom navigation - now outside of conditional rendering so it's always visible */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40">
        <div className="flex items-center justify-around h-16">
          <button
            onClick={() => {
              setActiveTab("events")
              setSelectedEvent(null)
              setSelectedContact(null)
              setShowEventSelector(false)
            }}
            className={`flex flex-col items-center justify-center w-1/5 h-full ${
              activeTab === "events" && !selectedEvent ? "text-primary" : "text-zinc-500"
            }`}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-xs mt-1">Events</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("contacts")
              setSelectedEvent(null)
              setSelectedContact(null)
              setShowEventSelector(false)
            }}
            className={`flex flex-col items-center justify-center w-1/5 h-full ${
              activeTab === "contacts" && !selectedEvent ? "text-primary" : "text-zinc-500"
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">Contacts</span>
          </button>

          <button
            onClick={() => setShowCreateOptions(true)}
            className="flex flex-col items-center justify-center w-1/5 h-full"
          >
            <div className="bg-primary text-primary-foreground rounded-full p-3 -mt-6 shadow-md">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-xs mt-1">New</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("tasks")
              setSelectedEvent(null)
              setSelectedContact(null)
              setShowEventSelector(false)
            }}
            className={`flex flex-col items-center justify-center w-1/5 h-full ${
              activeTab === "tasks" && !selectedEvent ? "text-primary" : "text-zinc-500"
            }`}
          >
            <CheckSquare className="h-5 w-5" />
            <span className="text-xs mt-1">Tasks</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("profile")
              setSelectedEvent(null)
              setSelectedContact(null)
              setShowEventSelector(false)
            }}
            className={`flex flex-col items-center justify-center w-1/5 h-full ${
              activeTab === "profile" && !selectedEvent ? "text-primary" : "text-zinc-500"
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>
    </div>
  )
}
