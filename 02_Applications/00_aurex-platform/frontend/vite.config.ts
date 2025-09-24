/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/', // Platform application runs on root path
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: mode === 'development',
    minify: 'esbuild',
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', '@headlessui/react', '@heroicons/react'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          utils: ['clsx', 'tailwind-merge'],
        },
        // Optimize asset naming for production
        chunkFileNames: mode === 'production' ? 'assets/js/[name]-[hash].js' : 'assets/js/[name].js',
        entryFileNames: mode === 'production' ? 'assets/js/[name]-[hash].js' : 'assets/js/[name].js',
        assetFileNames: mode === 'production' ? 'assets/[ext]/[name]-[hash].[ext]' : 'assets/[ext]/[name].[ext]',
      },
    },
  },
  server: {
    port: 3000,
    host: true,
    strictPort: true,
  },
  preview: {
    port: 3000,
    host: true,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
}))
