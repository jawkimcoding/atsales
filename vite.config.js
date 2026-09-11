import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 상대 경로로 빌드하여 로컬 파일이나 GitHub Pages 어디서든 작동
})
