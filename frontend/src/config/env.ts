export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const WS_BASE = import.meta.env.VITE_WS_BASE || 'ws://localhost:8000';
export const METRICS_SOURCE = (import.meta.env.VITE_METRICS_SOURCE || 'synth') as 'static' | 'synth' | 'ws';
export const TICKER_UPDATE_INTERVAL = 3000; // ms
export const TICKER_HISTORY_LENGTH = 30; // points

// Dev mode: bypass Azure AD authentication if credentials not configured
export const DEV_MODE_NO_AUTH = !import.meta.env.VITE_AZURE_CLIENT_ID || import.meta.env.VITE_DEV_NO_AUTH === 'true';

