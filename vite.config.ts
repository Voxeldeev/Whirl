// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  // THIS MUST MATCH YOUR GITHUB REPOSITORY NAME EXACTLY
  base: 'https://voxeldeev.github.io/whirl/', 
  build: {
    target: 'esnext'
  }
});