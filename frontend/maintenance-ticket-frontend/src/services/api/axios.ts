import axios from "axios";
import { useAuthStore } from "../../features/auth/store/authStore";

const addAuthInterceptor = (api: ReturnType<typeof axios.create>) => {
  api.interceptors.request.use((config) => {
    if (config.url?.includes("/auth/login")) {
      return config;
    }
    const accessToken = useAuthStore.getState().accessToken;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  });
};

export const identityApi = axios.create({
  baseURL: import.meta.env.VITE_IDENTITY_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const ticketApi = axios.create({
  baseURL: import.meta.env.VITE_TICKET_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const assignmentApi = axios.create({
  baseURL: import.meta.env.VITE_ASSIGNMENT_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

addAuthInterceptor(identityApi);
addAuthInterceptor(ticketApi);
addAuthInterceptor(assignmentApi);
