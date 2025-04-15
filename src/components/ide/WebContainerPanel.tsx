"use client"

import { useEffect, useRef, useState } from "react"
import { useFileSystem } from "@/contexts/FileSystemContext"
import { Terminal as XTerm } from "xterm"
import { FitAddon } from "xterm-addon-fit"
import { WebglAddon } from "xterm-addon-webgl"
import { Power, RefreshCcw, Play, Maximize2, Minimize2 } from 'lucide-react'
import "xterm/css/xterm.css"
import { toast } from "sonner"

const WebContainerPanel = () => {
  // Core state
  const [webcontainer, setWebcontainer] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [webContainerSupported, setWebContainerSupported] = useState<boolean | null>(null)
  const [previewURL, setPreviewURL] = useState<string | null>(null)

  // Terminal state
  const [terminal, setTerminal] = useState<XTerm | null>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const shellProcessRef = useRef<any>(null)

  // UI state
  const [maximized, setMaximized] = useState(false)

  // File system context
  const { files, addLogMessage } = useFileSystem()

  // Check if WebContainer is supported
  useEffect(() => {
    const checkSupport = async () => {
      try {
        // Check if we're in a secure context (HTTPS or localhost)
        const isSecure =
          window.isSecureContext || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"

        if (!isSecure) {
          setWebContainerSupported(false)
          setError("WebContainer requires HTTPS or localhost environment")
          return
        }

        // Try importing the WebContainer module
        await import("@webcontainer/api")
        setWebContainerSupported(true)
      } catch (err: any) {
        setWebContainerSupported(false)
        setError(`WebContainer not supported: ${err.message}`)
      }
    }

    checkSupport()
  }, [])

  // Convert IDE file system to WebContainer format
  const convertFilesToWebContainerFormat = (fileItems: any[]) => {
    // This will hold our final WebContainer file structure
    const result: Record<string, any> = {}

    // Find the root project folder name to remove from paths
    let rootProjectName = ""
    if (fileItems.length > 0 && fileItems[0].id === "root" && fileItems[0].name) {
      rootProjectName = fileItems[0].name
    }

    // Process all file system items recursively
    const processItems = (items: any[]) => {
      for (const item of items) {
        // Skip the root itself
        if (item.id === "root") {
          if (item.children) {
            processItems(item.children)
          }
          continue
        }

        // Extract the correct path without the project name prefix
        let relativePath = item.path

        // Remove leading slash if present
        if (relativePath.startsWith("/")) {
          relativePath = relativePath.substring(1)
        }

        // Remove project name prefix if present
        if (rootProjectName && relativePath.startsWith(rootProjectName + "/")) {
          relativePath = relativePath.substring(rootProjectName.length + 1)
        }

        // Handle files
        if (item.type === "file") {
          result[relativePath] = {
            file: {
              contents: item.content || "",
            },
          }
        }
        // Handle directories
        else if (item.type === "folder") {
          // Create the directory entry
          result[relativePath] = {
            directory: {},
          }

          // Process children
          if (item.children && item.children.length > 0) {
            processItems(item.children)
          }
        }
      }
    }

    // Start processing from all items
    processItems(fileItems)

    // Add default index.html if not present
    if (!Object.keys(result).some((path) => path === "index.html" || path.endsWith("/index.html"))) {
      result["index.html"] = {
        file: {
          contents: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web Preview</title>
</head>
<body>
  <h1>Welcome to Web Preview</h1>
  <p>Start by editing files in the editor.</p>
</body>
</html>`,
        },
      }
    }

    return result
  }

  // Initialize WebContainer
  const initWebContainer = async () => {
    if (initialized) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Boot WebContainer
      const { WebContainer } = await import("@webcontainer/api")

      const wc = await WebContainer.boot()
      setWebcontainer(wc)

      // Set up file system from the FileSystemContext
      await setupFileSystem(wc)

      // Create terminal and connect to shell
      await createAndConnectTerminal(wc)

      setInitialized(true)
      setLoading(false)
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      setError(`Failed to initialize WebContainer: ${errorMsg}`)
      setLoading(false)
    }
  }

  // Setup file system using the FileSystemContext
  const setupFileSystem = async (wc: any) => {
    try {
      // Convert file system to WebContainer format
      const fileSystemEntries = convertFilesToWebContainerFormat(files)

      // Mount files to WebContainer
      await wc.mount(fileSystemEntries)
      
      // Create a package.json if it doesn't exist
      try {
        await wc.fs.readFile("package.json")
      } catch (err) {
        // Create a basic package.json
        const packageJson = {
          name: "web_project", // Use underscores instead of hyphens
          version: "1.0.0",
          description: "Web project",
          type: "module",
          scripts: {
            start: "npx http-server -p 3000"
          }
        }
        
        await wc.fs.writeFile("package.json", JSON.stringify(packageJson, null, 2))
      }
    } catch (err: any) {
      if (addLogMessage) {
        addLogMessage("error", `Error mounting files: ${err.message}`)
      }
      throw err
    }
  }

  // Create and connect terminal to WebContainer shell
  const createAndConnectTerminal = async (wc: any) => {
    if (!terminalRef.current) return

    try {
      // Create a new terminal
      const term = new XTerm({
        cursorBlink: true,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 14,
        theme: {
          background: "#1a1e26",
          foreground: "#ffffff",
          cursor: "#ffffff",
          selection: "rgba(255, 255, 255, 0.3)",
        },
        convertEol: true,
        scrollback: 800,
      })

      // Add the fit addon for terminal resizing
      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)
      fitAddonRef.current = fitAddon

      // Try to add WebGL addon for better performance
      try {
        const webglAddon = new WebglAddon()
        term.loadAddon(webglAddon)
      } catch (err) {
        console.warn("WebGL addon could not be loaded", err)
      }

      // Open terminal
      term.open(terminalRef.current)
      fitAddon.fit()

      // Store the terminal instance
      setTerminal(term)

      // Start a shell process
      let shellProcess
      try {
        shellProcess = await wc.spawn("bash")
      } catch (err) {
        // Fall back to sh if bash is not available
        shellProcess = await wc.spawn("sh")
      }
      
      shellProcessRef.current = shellProcess

      // Handle input from terminal to shell
      const input = shellProcess.input.getWriter()
      term.onData((data) => {
        input.write(data)
      })

      // Handle output from shell to terminal
      shellProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            term.write(data)
          },
        })
      )

      // Write welcome message
      term.writeln("\r\n\x1b[1;32mWebContainer Terminal Ready!\x1b[0m")
      term.writeln("Type commands to interact with the file system.")
      term.writeln("For example: ls, cat index.html, npm install, etc.\r\n")

      // Try to start a server in the background
      startServerInBackground(wc)
    } catch (err: any) {
      setError(`Failed to create terminal: ${err.message}`)
      if (addLogMessage) {
        addLogMessage("error", `Failed to create terminal: ${err.message}`)
      }
    }
  }

  // Start a server in the background
  const startServerInBackground = async (wc: any) => {
    try {
      // Check if package.json exists
      let hasPackageJson = false
      try {
        await wc.fs.readFile("package.json")
        hasPackageJson = true
      } catch (err) {
        // No package.json, will use http-server
      }

      if (hasPackageJson) {
        // Fix package name issues before installation
        await fixPackageNameIssues(wc)
        
        // Start a server based on package.json
        try {
          const serverProcess = await wc.spawn("npx", ["http-server", "-p", "3000", "--no-dotfiles"])
          
          // Find URL from server logs
          const urlPattern = /(https?:\/\/localhost:[0-9]+)/
          
          serverProcess.output.pipeTo(
            new WritableStream({
              write(data) {
                const match = data.match(urlPattern)
                if (match && match[1]) {
                  // Replace localhost with 0.0.0.0 for WebContainer
                  const serverUrl = match[1].replace("localhost", "0.0.0.0")
                  setPreviewURL(serverUrl)
                }
              },
            })
          )
          
          // If no URL found after 3 seconds, use default
          setTimeout(() => {
            setPreviewURL((prev) => prev || "http://0.0.0.0:3000")
          }, 3000)
        } catch (err) {
          console.warn("Failed to start server:", err)
          setPreviewURL("http://0.0.0.0:3000")
        }
      } else {
        // Start a simple http-server
        await wc.spawn("npx", ["http-server", "-p", "3000", "--no-dotfiles"])
        setPreviewURL("http://0.0.0.0:3000")
      }
    } catch (err) {
      console.warn("Failed to start server:", err)
      setPreviewURL("http://0.0.0.0:3000")
    }
  }

  // Fix for package installation issues with hyphenated folder names
  const fixPackageNameIssues = async (wc: any) => {
    try {
      // Read package.json
      const packageJsonContent = await wc.fs.readFile("package.json", "utf-8")
      let packageJson
      
      try {
        packageJson = JSON.parse(packageJsonContent)
      } catch (err) {
        // If JSON parsing fails, create a new package.json
        packageJson = {
          name: "web_project",
          version: "1.0.0",
          description: "Web project",
          type: "module",
          scripts: {
            start: "npx http-server -p 3000"
          }
        }
      }

      // Fix package name if it contains hyphens
      if (packageJson.name && packageJson.name.includes("-")) {
        // Replace hyphens with underscores
        const fixedName = packageJson.name.replace(/-/g, "_")
        packageJson.name = fixedName

        // Write back the fixed package.json
        await wc.fs.writeFile("package.json", JSON.stringify(packageJson, null, 2))
        return true
      }
      
      return false
    } catch (err) {
      console.warn("Error fixing package name:", err)
      return false
    }
  }

  // Handle window resize to fit terminal
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit()
        } catch (err) {
          // Terminal might be disposed
        }
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (terminal) {
        terminal.dispose()
      }
      
      // Close shell process if it exists
      if (shellProcessRef.current) {
        try {
          const writer = shellProcessRef.current.input.getWriter()
          writer.write("exit\n")
          writer.close()
        } catch (err) {
          console.warn("Error closing shell process:", err)
        }
      }
    }
  }, [terminal])

  // Toggle maximize
  const toggleMaximize = () => {
    setMaximized((prev) => !prev)

    // Ensure terminal fits after maximizing/minimizing
    setTimeout(() => {
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit()
        } catch (err) {
          // Terminal might be disposed
        }
      }
    }, 100)
  }

  // Refresh the preview
  const refreshPreview = () => {
    if (previewURL) {
      const iframe = document.querySelector("iframe")
      if (iframe) {
        iframe.src = iframe.src
      }
    }
  }

  // Restart the WebContainer
  const restartContainer = async () => {
    if (!webcontainer) return

    setLoading(true)

    // Clean up existing terminal
    if (terminal) {
      terminal.dispose()
      setTerminal(null)
    }
    
    // Close shell process if it exists
    if (shellProcessRef.current) {
      try {
        const writer = shellProcessRef.current.input.getWriter()
        writer.write("exit\n")
        writer.close()
      } catch (err) {
        console.warn("Error closing shell process:", err)
      }
      shellProcessRef.current = null
    }

    try {
      // Re-setup file system
      await setupFileSystem(webcontainer)

      // Create new terminal and connect to shell
      await createAndConnectTerminal(webcontainer)

      setLoading(false)
      toast.success("WebContainer restarted successfully")
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      setError(`Error restarting WebContainer: ${errorMsg}`)
      setLoading(false)
      toast.error("Failed to restart WebContainer")
    }
  }

  // Shutdown the WebContainer
  const shutdownContainer = () => {
    if (terminal) {
      terminal.dispose()
      setTerminal(null)
    }
    
    // Close shell process if it exists
    if (shellProcessRef.current) {
      try {
        const writer = shellProcessRef.current.input.getWriter()
        writer.write("exit\n")
        writer.close()
      } catch (err) {
        console.warn("Error closing shell process:", err)
      }
      shellProcessRef.current = null
    }

    setWebcontainer(null)
    setInitialized(false)
    setPreviewURL(null)
    toast.info("WebContainer shut down")
  }

  // Handle checking WebContainer support status
  if (webContainerSupported === null) {
    return (
      <div className="h-full flex flex-col bg-terminal text-terminal-foreground">
        <div className="border-b border-border p-2 flex justify-between items-center">
          <span className="font-medium">WebContainer Terminal</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="mt-4">Checking WebContainer support...</p>
          </div>
        </div>
      </div>
    )
  }

  // Handle unsupported environments
  if (webContainerSupported === false) {
    return (
      <div className="h-full flex flex-col bg-terminal text-terminal-foreground">
        <div className="border-b border-border p-2 flex justify-between items-center">
          <span className="font-medium">WebContainer Terminal</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-red-400">
          <div className="text-center">
            <p className="text-xl font-bold">WebContainer API Not Supported</p>
            <p className="mt-2">Your browser does not support the WebContainer API.</p>
            <p className="mt-1">Please use Chrome or Edge with HTTPS or localhost.</p>
            {error && <p className="mt-2 text-sm">{error}</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`h-full flex flex-col bg-terminal text-terminal-foreground ${maximized ? "fixed inset-0 z-50" : ""}`}
    >
      {/* Header with controls */}
      <div className="border-b border-border p-2 flex justify-between items-center">
        <span className="font-medium">WebContainer Terminal</span>
        <div className="flex space-x-2">
          {!initialized ? (
            <button
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-sm flex items-center"
              onClick={initWebContainer}
              disabled={loading}
              title="Start WebContainer"
            >
              <Power size={16} className="mr-1" /> Start
            </button>
          ) : (
            <>
              <button
                className="p-1 text-slate-400 hover:text-white rounded-sm"
                onClick={refreshPreview}
                title="Refresh Preview"
              >
                <RefreshCcw size={16} />
              </button>
              <button
                className="p-1 text-slate-400 hover:text-white rounded-sm"
                onClick={restartContainer}
                title="Restart WebContainer"
              >
                <Play size={16} />
              </button>
              <button
                className="p-1 text-slate-400 hover:text-white rounded-sm"
                onClick={toggleMaximize}
                title={maximized ? "Restore WebContainer" : "Maximize WebContainer"}
              >
                {maximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                className="p-1 text-red-400 hover:text-red-500 rounded-sm"
                onClick={shutdownContainer}
                title="Shutdown WebContainer"
              >
                <Power size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden relative">
        {!initialized ? (
          // Not initialized yet - show start screen
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl font-bold">WebContainer Terminal</p>
              <p className="mt-2">Click the Start button to initialize the WebContainer.</p>
              <p className="mt-1 text-sm text-slate-400">This will allow you to run and preview your web project.</p>
              {loading && (
                <div className="mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  <p className="mt-2">Starting WebContainer...</p>
                </div>
              )}
            </div>
          </div>
        ) : loading ? (
          // Loading state
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              <p className="mt-4">Initializing WebContainer...</p>
            </div>
          </div>
        ) : error ? (
          // Error state
          <div className="h-full flex items-center justify-center text-red-400">
            <div className="text-center">
              <p className="text-xl font-bold">Error</p>
              <p className="mt-2">{error}</p>
              <button
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={restartContainer}
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          // Terminal display
          <div ref={terminalRef} className="h-full w-full" />
        )}
      </div>
    </div>
  )
}

export default WebContainerPanel
