import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import app from "../feathers/feathers-client";

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  isInitialized: boolean;
  setAuthenticated: (user?: any) => void;
  setUnauthenticated: () => void;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      isInitialized: false,

      setAuthenticated: (user?: any) => {
        set({
          isAuthenticated: true,
          user: user || null,
        });
      },

      setUnauthenticated: () => {
        set({
          isAuthenticated: false,
          user: null,
        });
      },

      init: async () => {
        try {
          // Check if there's a stored access token
          const accessToken = await app.authentication.getAccessToken();

          if (accessToken) {
            // Try to re-authenticate to verify the token is still valid
            try {
              const authResult = await app.reAuthenticate();
              set({
                isAuthenticated: true,
                user: authResult?.user || null,
                isInitialized: true,
              });
            } catch (error) {
              // Token is invalid or expired
              console.log("[Auth Store] Token invalid, clearing auth state");
              await app.logout();
              set({
                isAuthenticated: false,
                user: null,
                isInitialized: true,
              });
            }
          } else {
            // No token found
            set({
              isAuthenticated: false,
              user: null,
              isInitialized: true,
            });
          }
        } catch (error) {
          console.error("[Auth Store] Error initializing auth:", error);
          set({
            isAuthenticated: false,
            user: null,
            isInitialized: true,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist authentication state, not initialization status
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);
