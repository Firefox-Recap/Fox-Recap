export function extractDomain(url) {
  if (!url || typeof url !== 'string') {
    console.error('Invalid URL:', url);
    return '';
  }
  try {
    if (!url.includes('://')) url = 'http://' + url;
    const { hostname } = new URL(url);
    const domain = hostname.startsWith('www.')
      ? hostname.slice(4)
      : hostname;
    return domain.toLowerCase();
  } catch (error) {
    console.error('Invalid URL:', url);
    return '';
  }
}

function isValidURL(urlString) {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}
