import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API, timeout: 25000 });

export const fetchHero = () => api.get("/dashboard/hero").then((r) => r.data);
export const fetchTickerBar = () => api.get("/dashboard/ticker-bar").then((r) => r.data);
export const fetchMag7 = () => api.get("/dashboard/mag7").then((r) => r.data);
export const fetchWatchlist = () => api.get("/dashboard/watchlist").then((r) => r.data);
export const fetchIndicators = (symbol) => api.get(`/indicators/${symbol}`).then((r) => r.data);
export const fetchRegime = () => api.get("/regime").then((r) => r.data);
export const fetchCalendar = () => api.get("/calendar").then((r) => r.data);
export const fetchNews = (category = "all", limit = 30) =>
    api.get(`/news`, { params: { category, limit } }).then((r) => r.data);
export const fetchLondonSession = () => api.get("/london-session").then((r) => r.data);
export const fetchMacro = () => api.get("/macro").then((r) => r.data);

export default api;
