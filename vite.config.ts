import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [react(), TanStackRouterVite()],
  resolve: {
    alias: [
      { find: '@', replacement: '/src' },
      { find: '@family', replacement: '/src/Family' },
      { find: '@global', replacement: '/src/Global' },
      { find: '@user', replacement: '/src/User' },

      { find: '@chores', replacement: '/src/Chores' },
      { find: '@meals', replacement: '/src/Meals' },
      { find: '@storage', replacement: '/src/Storage' },
      { find: '@services', replacement: '/src/Services' },
    ],
  },
})
