"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Profile, UserRole } from "@/types/database";
import { initialProfiles } from "@/lib/services/mock-data";

interface RoleContextType {
  currentUser: Profile;
  setCurrentUser: (user: Profile) => void;
  availableUsers: Profile[];
  switchRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  // Default to Admin Ops Siti Rahma for immediate dispatch experience
  const [currentUser, setCurrentUser] = useState<Profile>(initialProfiles[1]);

  useEffect(() => {
    const savedUserId = localStorage.getItem("jasa_ac_current_user_id");
    if (savedUserId) {
      const found = initialProfiles.find((p) => p.id === savedUserId);
      if (found) setCurrentUser(found);
    }
  }, []);

  const handleSetCurrentUser = (user: Profile) => {
    setCurrentUser(user);
    localStorage.setItem("jasa_ac_current_user_id", user.id);
  };

  const switchRole = (role: UserRole) => {
    const user = initialProfiles.find((p) => p.role === role);
    if (user) {
      handleSetCurrentUser(user);
    }
  };

  return (
    <RoleContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        availableUsers: initialProfiles,
        switchRole,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
