import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        drops: 'drops.html',
        terminos: 'terminos.html',
        privacidad: 'privacidad.html',
        notfound: '404.html',
        admin: 'admin.html',
      },
    },
  },
})
