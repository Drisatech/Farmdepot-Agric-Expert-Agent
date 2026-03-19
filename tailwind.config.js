{
  "name": "farmdepot-mama-brain",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node cloud-function.js",
    "dev": "node cloud-function.js",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --report-unused-disable-directives --max-warnings 0"
  },
  "main": "cloud-function.js",
  "dependencies": {
    "@google/genai": "^1.1.0",
    "autoprefixer": "^10.4.18",
    "express": "^5.2.1",
    "firebase-admin": "^13.0.1",
    "lucide-react": "^0.344.0",
    "motion": "^11.0.8",
    "nodemailer": "^8.0.1",
    "postcss": "^8.4.35",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.4.1",
    "vite": "^5.1.4",
    "ws": "^8.19.0"
  },
  "devDependencies": {
    "@eslint/js": "^8.56.0",
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@typescript-eslint/eslint-plugin": "^7.0.2",
    "@typescript-eslint/parser": "^7.0.2",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "globals": "^14.0.0",
    "typescript": "^5.2.2",
    "typescript-eslint": "^7.0.2",
    "vite": "^5.1.4"
  }
}
