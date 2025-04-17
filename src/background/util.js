export function extractDomain(url) {
  if (!url || typeof url !== 'string') {
    console.error('Invalid URL:', url);
    return '';
  }

  try {
    // Add http:// prefix if no scheme is present
    if (!url.includes('://')) {
      url = 'http://' + url;
    }
    
    // Basic URL format validation before parsing
    const urlRegex = /^(https?|ftp|custom-scheme):\/\/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
    if (!urlRegex.test(url)) {
      console.error('Invalid URL:', url);
      return '';
    }

    const urlObj = new URL(url);
    let domain = urlObj.hostname;
    
    // Remove www. prefix if it's at the beginning of the domain
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }
    
    // Convert to lowercase
    return domain.toLowerCase();
  } catch (error) {
    console.error('Invalid URL:', url);
    return '';
  }
}
