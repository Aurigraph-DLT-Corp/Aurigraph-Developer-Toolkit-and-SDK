// vite.config.ts
import { defineConfig } from "file:///Users/yogesh/00_MyCode/04_Aurigraph/04_aurex-trace-platform/aurex-trace-platform/aurex-platform-restructured/aurex-main/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///Users/yogesh/00_MyCode/04_Aurigraph/04_aurex-trace-platform/aurex-trace-platform/aurex-platform-restructured/aurex-main/frontend/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///Users/yogesh/00_MyCode/04_Aurigraph/04_aurex-trace-platform/aurex-trace-platform/aurex-platform-restructured/aurex-main/frontend/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/Users/yogesh/00_MyCode/04_Aurigraph/04_aurex-trace-platform/aurex-trace-platform/aurex-platform-restructured/aurex-main/frontend";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3e3,
    proxy: {
      "/keycloak-api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path2) => path2.replace(/^\/keycloak-api/, ""),
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("Sending Request to the Target:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log("Received Response from the Target:", proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, ".")
    }
  },
  build: {
    // Optimize build for better performance
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip"
          ],
          "form-vendor": [
            "react-hook-form",
            "@hookform/resolvers",
            "zod"
          ],
          "icons-vendor": ["lucide-react"],
          "utils-vendor": [
            "clsx",
            "tailwind-merge",
            "class-variance-authority"
          ],
          // Page chunks
          "pages-main": [
            "./pages/Index",
            "./pages/Launchpad",
            "./pages/Hydropulse"
          ],
          "pages-secondary": [
            "./pages/CarbonTrace",
            "./pages/Sylvagraph",
            "./pages/Contact"
          ],
          "pages-admin": [
            "./pages/Dashboard",
            "./components/admin/DatabaseAdmin",
            "./components/admin/AdminNavigation"
          ]
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1e3,
    // Enable source maps only in development
    sourcemap: mode === "development"
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
    exclude: [
      // Exclude large dependencies that are not immediately needed
      "@prisma/client",
      "recharts"
    ]
  },
  // Enable esbuild for faster builds
  esbuild: {
    target: "esnext",
    minifyIdentifiers: mode === "production",
    minifySyntax: mode === "production",
    minifyWhitespace: mode === "production"
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMveW9nZXNoLzAwX015Q29kZS8wNF9BdXJpZ3JhcGgvMDRfYXVyZXgtdHJhY2UtcGxhdGZvcm0vYXVyZXgtdHJhY2UtcGxhdGZvcm0vYXVyZXgtcGxhdGZvcm0tcmVzdHJ1Y3R1cmVkL2F1cmV4LW1haW4vZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy95b2dlc2gvMDBfTXlDb2RlLzA0X0F1cmlncmFwaC8wNF9hdXJleC10cmFjZS1wbGF0Zm9ybS9hdXJleC10cmFjZS1wbGF0Zm9ybS9hdXJleC1wbGF0Zm9ybS1yZXN0cnVjdHVyZWQvYXVyZXgtbWFpbi9mcm9udGVuZC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMveW9nZXNoLzAwX015Q29kZS8wNF9BdXJpZ3JhcGgvMDRfYXVyZXgtdHJhY2UtcGxhdGZvcm0vYXVyZXgtdHJhY2UtcGxhdGZvcm0vYXVyZXgtcGxhdGZvcm0tcmVzdHJ1Y3R1cmVkL2F1cmV4LW1haW4vZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiOjpcIixcbiAgICBwb3J0OiAzMDAwLFxuICAgIHByb3h5OiB7XG4gICAgICAnL2tleWNsb2FrLWFwaSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo4MDgwJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwva2V5Y2xvYWstYXBpLywgJycpLFxuICAgICAgICBjb25maWd1cmU6IChwcm94eSwgX29wdGlvbnMpID0+IHtcbiAgICAgICAgICBwcm94eS5vbignZXJyb3InLCAoZXJyLCBfcmVxLCBfcmVzKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygncHJveHkgZXJyb3InLCBlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHByb3h5Lm9uKCdwcm94eVJlcScsIChwcm94eVJlcSwgcmVxLCBfcmVzKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnU2VuZGluZyBSZXF1ZXN0IHRvIHRoZSBUYXJnZXQ6JywgcmVxLm1ldGhvZCwgcmVxLnVybCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcHJveHkub24oJ3Byb3h5UmVzJywgKHByb3h5UmVzLCByZXEsIF9yZXMpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdSZWNlaXZlZCBSZXNwb25zZSBmcm9tIHRoZSBUYXJnZXQ6JywgcHJveHlSZXMuc3RhdHVzQ29kZSwgcmVxLnVybCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgfSxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgbW9kZSA9PT0gJ2RldmVsb3BtZW50JyAmJlxuICAgIGNvbXBvbmVudFRhZ2dlcigpLFxuICBdLmZpbHRlcihCb29sZWFuKSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuXCIpLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgLy8gT3B0aW1pemUgYnVpbGQgZm9yIGJldHRlciBwZXJmb3JtYW5jZVxuICAgIHRhcmdldDogJ2VzbmV4dCcsXG4gICAgbWluaWZ5OiAnZXNidWlsZCcsXG4gICAgY3NzTWluaWZ5OiB0cnVlLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICAvLyBNYW51YWwgY2h1bmsgc3BsaXR0aW5nIGZvciBiZXR0ZXIgY2FjaGluZ1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAvLyBWZW5kb3IgY2h1bmtzXG4gICAgICAgICAgJ3JlYWN0LXZlbmRvcic6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICAndWktdmVuZG9yJzogW1xuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1kaWFsb2cnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1kcm9wZG93bi1tZW51JyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3Qtc2VsZWN0JyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtdGFicycsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXRvYXN0JyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtdG9vbHRpcCdcbiAgICAgICAgICBdLFxuICAgICAgICAgICdmb3JtLXZlbmRvcic6IFtcbiAgICAgICAgICAgICdyZWFjdC1ob29rLWZvcm0nLFxuICAgICAgICAgICAgJ0Bob29rZm9ybS9yZXNvbHZlcnMnLFxuICAgICAgICAgICAgJ3pvZCdcbiAgICAgICAgICBdLFxuICAgICAgICAgICdpY29ucy12ZW5kb3InOiBbJ2x1Y2lkZS1yZWFjdCddLFxuICAgICAgICAgICd1dGlscy12ZW5kb3InOiBbXG4gICAgICAgICAgICAnY2xzeCcsXG4gICAgICAgICAgICAndGFpbHdpbmQtbWVyZ2UnLFxuICAgICAgICAgICAgJ2NsYXNzLXZhcmlhbmNlLWF1dGhvcml0eSdcbiAgICAgICAgICBdLFxuICAgICAgICAgIC8vIFBhZ2UgY2h1bmtzXG4gICAgICAgICAgJ3BhZ2VzLW1haW4nOiBbXG4gICAgICAgICAgICAnLi9wYWdlcy9JbmRleCcsXG4gICAgICAgICAgICAnLi9wYWdlcy9MYXVuY2hwYWQnLFxuICAgICAgICAgICAgJy4vcGFnZXMvSHlkcm9wdWxzZSdcbiAgICAgICAgICBdLFxuICAgICAgICAgICdwYWdlcy1zZWNvbmRhcnknOiBbXG4gICAgICAgICAgICAnLi9wYWdlcy9DYXJib25UcmFjZScsXG4gICAgICAgICAgICAnLi9wYWdlcy9TeWx2YWdyYXBoJyxcbiAgICAgICAgICAgICcuL3BhZ2VzL0NvbnRhY3QnXG4gICAgICAgICAgXSxcbiAgICAgICAgICAncGFnZXMtYWRtaW4nOiBbXG4gICAgICAgICAgICAnLi9wYWdlcy9EYXNoYm9hcmQnLFxuICAgICAgICAgICAgJy4vY29tcG9uZW50cy9hZG1pbi9EYXRhYmFzZUFkbWluJyxcbiAgICAgICAgICAgICcuL2NvbXBvbmVudHMvYWRtaW4vQWRtaW5OYXZpZ2F0aW9uJ1xuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgLy8gT3B0aW1pemUgY2h1bmsgc2l6ZVxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcbiAgICAvLyBFbmFibGUgc291cmNlIG1hcHMgb25seSBpbiBkZXZlbG9wbWVudFxuICAgIHNvdXJjZW1hcDogbW9kZSA9PT0gJ2RldmVsb3BtZW50J1xuICB9LFxuICAvLyBPcHRpbWl6ZSBkZXBlbmRlbmNpZXNcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogW1xuICAgICAgJ3JlYWN0JyxcbiAgICAgICdyZWFjdC1kb20nLFxuICAgICAgJ3JlYWN0LXJvdXRlci1kb20nLFxuICAgICAgJ2x1Y2lkZS1yZWFjdCcsXG4gICAgICAnY2xzeCcsXG4gICAgICAndGFpbHdpbmQtbWVyZ2UnXG4gICAgXSxcbiAgICBleGNsdWRlOiBbXG4gICAgICAvLyBFeGNsdWRlIGxhcmdlIGRlcGVuZGVuY2llcyB0aGF0IGFyZSBub3QgaW1tZWRpYXRlbHkgbmVlZGVkXG4gICAgICAnQHByaXNtYS9jbGllbnQnLFxuICAgICAgJ3JlY2hhcnRzJ1xuICAgIF1cbiAgfSxcbiAgLy8gRW5hYmxlIGVzYnVpbGQgZm9yIGZhc3RlciBidWlsZHNcbiAgZXNidWlsZDoge1xuICAgIHRhcmdldDogJ2VzbmV4dCcsXG4gICAgbWluaWZ5SWRlbnRpZmllcnM6IG1vZGUgPT09ICdwcm9kdWN0aW9uJyxcbiAgICBtaW5pZnlTeW50YXg6IG1vZGUgPT09ICdwcm9kdWN0aW9uJyxcbiAgICBtaW5pZnlXaGl0ZXNwYWNlOiBtb2RlID09PSAncHJvZHVjdGlvbidcbiAgfVxufSkpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFxakIsU0FBUyxvQkFBb0I7QUFDbGxCLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxpQkFBaUI7QUFBQSxRQUNmLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsQ0FBQ0EsVUFBU0EsTUFBSyxRQUFRLG1CQUFtQixFQUFFO0FBQUEsUUFDckQsV0FBVyxDQUFDLE9BQU8sYUFBYTtBQUM5QixnQkFBTSxHQUFHLFNBQVMsQ0FBQyxLQUFLLE1BQU0sU0FBUztBQUNyQyxvQkFBUSxJQUFJLGVBQWUsR0FBRztBQUFBLFVBQ2hDLENBQUM7QUFDRCxnQkFBTSxHQUFHLFlBQVksQ0FBQyxVQUFVLEtBQUssU0FBUztBQUM1QyxvQkFBUSxJQUFJLGtDQUFrQyxJQUFJLFFBQVEsSUFBSSxHQUFHO0FBQUEsVUFDbkUsQ0FBQztBQUNELGdCQUFNLEdBQUcsWUFBWSxDQUFDLFVBQVUsS0FBSyxTQUFTO0FBQzVDLG9CQUFRLElBQUksc0NBQXNDLFNBQVMsWUFBWSxJQUFJLEdBQUc7QUFBQSxVQUNoRixDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sU0FBUyxpQkFDVCxnQkFBZ0I7QUFBQSxFQUNsQixFQUFFLE9BQU8sT0FBTztBQUFBLEVBQ2hCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLEdBQUc7QUFBQSxJQUNsQztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQTtBQUFBLElBRUwsUUFBUTtBQUFBLElBQ1IsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBO0FBQUEsUUFFTixjQUFjO0FBQUE7QUFBQSxVQUVaLGdCQUFnQixDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQSxVQUN6RCxhQUFhO0FBQUEsWUFDWDtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFVBQ0EsZUFBZTtBQUFBLFlBQ2I7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUNBLGdCQUFnQixDQUFDLGNBQWM7QUFBQSxVQUMvQixnQkFBZ0I7QUFBQSxZQUNkO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUE7QUFBQSxVQUVBLGNBQWM7QUFBQSxZQUNaO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSxtQkFBbUI7QUFBQSxZQUNqQjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFVBQ0EsZUFBZTtBQUFBLFlBQ2I7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEsdUJBQXVCO0FBQUE7QUFBQSxJQUV2QixXQUFXLFNBQVM7QUFBQSxFQUN0QjtBQUFBO0FBQUEsRUFFQSxjQUFjO0FBQUEsSUFDWixTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUztBQUFBO0FBQUEsTUFFUDtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBO0FBQUEsRUFFQSxTQUFTO0FBQUEsSUFDUCxRQUFRO0FBQUEsSUFDUixtQkFBbUIsU0FBUztBQUFBLElBQzVCLGNBQWMsU0FBUztBQUFBLElBQ3ZCLGtCQUFrQixTQUFTO0FBQUEsRUFDN0I7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogWyJwYXRoIl0KfQo=
