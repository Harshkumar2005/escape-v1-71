
// Only updating the part where we need to use updateFileContent
const processGithubContents = async (
  contents: GithubFile[],
  parentPath: string
) => {
  for (const item of contents) {
    if (item.type === 'dir') {
      // Create folder
      const folderId = createFile(parentPath, item.name, 'folder');
      
      // Fetch and process subdirectory contents
      const response = await fetch(item.url);
      if (response.ok) {
        const subContents = await response.json();
        await processGithubContents(subContents, `${parentPath}/${item.name}`);
      }
    } else if (item.type === 'file') {
      // Skip large files (>500KB) to prevent performance issues
      if (item.size && item.size > 500000) {
        toast.warning(`Skipped large file: ${item.name}`);
        continue;
      }
      
      // Fetch file content
      if (item.download_url) {
        try {
          const fileResponse = await fetch(item.download_url);
          if (fileResponse.ok) {
            const content = await fileResponse.text();
            
            // Create file with content
            const fileId = createFile(parentPath, item.name, 'file');
            if (fileId) {
              updateFileContent(fileId, content);
              toast.info(`Loaded file: ${item.name}`);
            }
          }
        } catch (error) {
          console.error(`Failed to load file content for ${item.name}`, error);
        }
      }
    }
  }
};
