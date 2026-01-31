import axios from "axios";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { UserContextData, Trade, Rule, Exchange } from "@/types";

const UserContext = createContext<UserContextData>({
  user: null,
  isLoading: true,
  refetch: async () => {},
});

const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserContextData["user"]>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();

  const getUser = useCallback(async () => {
    // Wait for session to be loaded
    if (status === "loading") {
      return;
    }

    // Only fetch user data if authenticated
    if (status !== "authenticated" || !session) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get<{
        firstName: string;
        lastName: string;
        id: string;
        photoURL?: string | null;
        status?: string | null;
        rules: Rule[];
        trades: Trade[];
        exchanges: Exchange[];
      }>("/api/user");
      
      const { firstName, lastName, id, photoURL, status, rules, trades, exchanges } = response.data;
      setUser({ firstName, lastName, id, photoURL, status, rules, trades, exchanges });
    } catch (error: any) {
      // Only log non-401 errors (401 is expected when not authenticated)
      if (error.response?.status !== 401) {
        console.error("Error fetching user data:", error);
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [session, status]);

  useEffect(() => {
    getUser();
  }, [getUser]);

  return (
    <UserContext.Provider value={{ user, isLoading, refetch: getUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  return useContext(UserContext);
};

export default UserProvider;
