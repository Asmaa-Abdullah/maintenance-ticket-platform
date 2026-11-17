import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  setAccessToken: (token: string) => void;
  clearAccessToken: () => void;
}

const storedToken = localStorage.getItem("accessToken");

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: storedToken,

  setAccessToken: (token) => {
    localStorage.setItem("accessToken", token);
    set({ accessToken: token });
  },

  clearAccessToken: () => {
    localStorage.removeItem("accessToken");
    set({ accessToken: null });
  },
}));
