import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const api = axios.create({ baseURL: API_BASE });

export const getUserId = () => {
  let id = localStorage.getItem("qc_user_id");
  if (!id) {
    id = `user_${Date.now()}`;
    localStorage.setItem("qc_user_id", id);
  }
  return id;
};

export const extractIntent = (userInput, weights = {}) => {
  const params = new URLSearchParams({
    w_intent: weights.intent ?? 0.5,
    w_budget: weights.budget ?? 0.3,
    w_avail: weights.availability ?? 0.1,
    w_rating: weights.rating ?? 0.1,
  });
  return api.post(`/intent/extract?${params}`, { user_input: userInput, user_id: getUserId() });
};

export const analyzeImage = (formData) =>
  api.post("/intent/analyze-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const panicMode = (context) => api.post("/intent/panic", context);

export const getAlternatives = ({ product_id, occasion, category, budget, exclude }) => {
  const params = new URLSearchParams({
    product_id,
    occasion: occasion || "general",
    category: category || "",
    exclude: exclude || "",
    ...(budget ? { budget } : {}),
  });
  return api.get(`/intent/alternatives?${params}`);
};

export const fuseIntent = (contexts) =>
  api.post("/intent/fuse", { contexts, user_id: getUserId() });

export const searchProducts = (q = "", limit = 8) =>
  api.get(`/intent/search?q=${encodeURIComponent(q)}&limit=${limit}`);

export const parseItems = (userInput) =>
  api.post("/intent/parse-items", { user_input: userInput });

export const saveProfile = ({ name, dietary }) =>
  api.post("/intent/profile", { user_id: getUserId(), name, dietary });

export const fetchProfile = () => api.get(`/intent/profile/${getUserId()}`);

export const getScenarios = () => api.get(`/intent/scenarios/${getUserId()}`);

export const savePreference = (category, product_id) =>
  api.post("/intent/preference", { user_id: getUserId(), category, product_id });

export const checkHealth = () => api.get("/health");

export default api;
