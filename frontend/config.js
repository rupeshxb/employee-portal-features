// Vite automatically picks the right .env file based on 'npm run dev' or 'npm run build'
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';