import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { 
  handleListFiles, 
  handleReadFile, 
  handleWriteFile, 
  handleDeleteFile, 
  handleCreateDirectory,
  initFileWatcher
} from './src/api/fileSystem';
import type { IncomingMessage, ServerResponse } from 'http';
type NextFunction = () => void;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Initialize file watcher
  initFileWatcher();
  
  return {
    server: {
      host: "::",
      port: 8080,
      // Add the COOP and COEP headers here
      /*headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin'
      },*/
      middleware: [
        async (req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
          // Ensure CORS headers are set
         // res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          //res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          
          if (req.url === '/api/list-files') {
            const response = await handleListFiles(new Request(`http://localhost${req.url}`));
            res.statusCode = response.status;
            for (const [key, value] of response.headers.entries()) {
              res.setHeader(key, value);
            }
            res.end(await response.text());
            return;
          }
          
          if (req.url?.startsWith('/api/read-file')) {
            const response = await handleReadFile(new Request(`http://localhost${req.url}`));
            res.statusCode = response.status;
            for (const [key, value] of response.headers.entries()) {
              res.setHeader(key, value);
            }
            res.end(await response.text());
            return;
          }
          
          if (req.url?.startsWith('/api/write-file')) {
            const response = await handleWriteFile(new Request(`http://localhost${req.url}`));
            res.statusCode = response.status;
            for (const [key, value] of response.headers.entries()) {
              res.setHeader(key, value);
            }
            res.end(await response.text());
            return;
          }
          
          if (req.url?.startsWith('/api/delete-file')) {
            const response = await handleDeleteFile(new Request(`http://localhost${req.url}`));
            res.statusCode = response.status;
            for (const [key, value] of response.headers.entries()) {
              res.setHeader(key, value);
            }
            res.end(await response.text());
            return;
          }
          
          if (req.url?.startsWith('/api/create-directory')) {
            const response = await handleCreateDirectory(new Request(`http://localhost${req.url}`));
            res.statusCode = response.status;
            for (const [key, value] of response.headers.entries()) {
              res.setHeader(key, value);
            }
            res.end(await response.text());
            return;
          }
          
          next();
        }
      ]
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    }
  };
});
