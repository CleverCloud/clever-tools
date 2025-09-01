/**
 * Fetch data from a URL with progress reporting.
 * @param {string} url - The URL to fetch data from
 * @param {(progress: string) => void} onProgress - Callback function called with the download progress
 * @return {Promise<Buffer>}
 */
export async function fetchWithProgress(url, onProgress) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  if (!response.body) {
    throw new Error('Response body is null');
  }

  const contentLength = response.headers.get('content-length');
  const totalBytes = contentLength ? parseInt(contentLength) : null;

  let downloadedBytes = 0;
  const chunks = [];

  const reader = response.body.getReader();

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    downloadedBytes += value.length;

    // Display progress
    if (totalBytes) {
      const percentage = Math.round((downloadedBytes / totalBytes) * 100)
        .toString()
        .padStart(3, ' ');
      onProgress(`Downloading… ${percentage}%`);
    } else {
      onProgress(`Downloading…`);
    }
  }

  // Combine chunks into final buffer
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return Buffer.from(result);
}
