import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { scrapbookEditor } from './plugins/scrapbookEditor.ts'

export default defineConfig({
  plugins: [react(), scrapbookEditor()],
  server: {
    // Edit mode writes into these folders; don't let Vite reload the page on every save.
    watch: { ignored: ['**/.local-toys/**', '**/public/content/**', '**/public/uploads/**', '**/public/moments/*/stickers/**'] },
  },
})
