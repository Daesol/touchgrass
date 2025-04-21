"use client";

import React, { useState } from 'react'; // Added useState for local active state
import { Calendar, Users, Plus, CheckSquare, User } from 'lucide-react';
import Link from 'next/link'; // Use Link for navigation
import { usePathname, useRouter } from 'next/navigation'; // To highlight active link and use router
import { CreateOptions } from '@/components/common/create-options'; // Import CreateOptions

// Define navigation items
const navItems = [
  { href: '/dashboard/events', label: 'Events', icon: Calendar },
  { href: '/dashboard/contacts', label: 'Contacts', icon: Users },
  { href: 'create', label: 'New', icon: Plus, isAction: true }, // Special item for action
  { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

export function BottomNavigationBar() {
  const pathname = usePathname();
  const router = useRouter(); // Initialize router
  const [showCreateOptions, setShowCreateOptions] = useState(false);

  // Basic logic to determine active tab based on path prefix
  const getActiveTab = (href: string) => {
    if (href === 'create') return false; // 'New' button is never active
    // Check if the current path starts with the item's href
    // Handle the base '/dashboard' case for 'Events' as default
    if (href === '/dashboard/events' && (pathname === '/dashboard' || pathname.startsWith('/dashboard/events'))) {
        return true;
    }
    return pathname.startsWith(href);
  };

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation for the '+' button
    setShowCreateOptions(true);
  };

  // Updated handlers to use router for navigation
   const handleCreateEvent = () => {
    setShowCreateOptions(false);
    router.push('/dashboard/events/new'); // Navigate to create event page
   };

   const handleCreateContact = () => {
    setShowCreateOptions(false);
    router.push('/dashboard/contacts/new'); // Navigate to create contact page
   };

  return (
    <>
      {/* Add padding to the bottom of the page content to prevent overlap */}
      <div className="pb-16"></div> {/* Placeholder for content */}

      <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 w-full justify-around border-t border-gray-200 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:bg-gray-800 dark:border-gray-700">
        {navItems.map((item) => {
          const isActive = getActiveTab(item.href);
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <button
                key={item.label}
                onClick={handleCreateClick}
                className="flex w-1/5 flex-col items-center justify-center focus:outline-none"
                aria-label="Create new item"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white transition-transform duration-200 ease-in-out hover:scale-110">
                   <Icon className="h-6 w-6" />
                </div>
                 {/* Removed label text for centered plus icon */}
              </button>
            );
          }

          return (
            <Link
              href={item.href}
              key={item.label}
              className={`flex w-1/5 flex-col items-center justify-center focus:outline-none ${
                isActive
                  ? "text-primary"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Render CreateOptions Modal */}
      {showCreateOptions && (
        <CreateOptions
          onCreateEvent={handleCreateEvent}
          onCreateContact={handleCreateContact}
          onClose={() => setShowCreateOptions(false)}
          // Determine if contact option should be shown (e.g., based on whether any events exist)
          // This might require fetching data or using global state
          showContactOption={true} // Placeholder - assuming contact can always be created
        />
      )}
    </>
  );
} 