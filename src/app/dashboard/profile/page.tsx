"use client";

import { ProfileSection } from "@/components/features/profile/profile-section";

// This page likely needs access to user profile data.
// For now, it just renders the ProfileSection component.
// Data fetching/passing logic will be added if ProfileSection needs it.

export default function ProfilePage() {
  return (
    <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <ProfileSection />
    </div>
  );
} 