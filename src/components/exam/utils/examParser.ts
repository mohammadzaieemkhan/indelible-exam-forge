
/**
 * Convert markdown content to HTML with basic formatting
 */
export const markdownToHtml = (markdown: string | any): string => {
  // If input is not a string, convert to JSON string
  if (typeof markdown !== 'string') {
    try {
      return `<pre>${JSON.stringify(markdown, null, 2)}</pre>`;
    } catch (e) {
      return '<p>Unable to display content</p>';
    }
  }
  
  // Basic markdown processing
  return markdown
    // Convert headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Convert lists
    .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
    .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
    .replace(/^\d+\. (.*$)/gim, '<ol><li>$1</li></ol>')
    // Convert bold and italics
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\_(.*)\_/gim, '<em>$1</em>')
    // Convert code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Convert links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    // Convert line breaks
    .replace(/\n/g, '<br>');
};
