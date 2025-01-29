import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [react(), TanStackRouterVite()],
  resolve: {
    alias: [
      { find: '@', replacement: '/src' },
      { find: '@collection', replacement: '/src/Collection' },
      { find: '@container', replacement: '/src/Container' },
      { find: '@global', replacement: '/src/Global' },
      { find: '@item', replacement: '/src/Item' },
      { find: '@tag', replacement: '/src/Tag' },
      { find: '@workspace', replacement: '/src/Workspace' },
    ],
  },
})
