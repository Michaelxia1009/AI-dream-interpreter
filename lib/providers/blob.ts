import { put } from '@vercel/blob';

/**
 * Converts a private blob URL to a proxy URL that can be accessed from the browser.
 * Private blob URLs like `https://xxx.private.blob.vercel-storage.com/path/file.jpg`
 * become `/api/blob?path=path/file.jpg`.
 */
export function toProxyUrl(privateBlobUrl: string): string {
  const url = new URL(privateBlobUrl);
  // pathname starts with / — strip leading slash for the query param
  const path = url.pathname.slice(1);
  return `/api/blob?path=${encodeURIComponent(path)}`;
}

export async function uploadArtifact(
  pathname: string,
  data: Buffer,
  contentType: string,
): Promise<string> {
  const { url } = await put(pathname, data, {
    access: 'private',
    contentType,
    addRandomSuffix: false,
    cacheControlMaxAge: 24 * 60 * 60,
  });
  // Return a proxy URL that the browser can access
  return toProxyUrl(url);
}
