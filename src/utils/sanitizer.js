/**
 * Input Sanitization Utilities for Brighton Gigs
 * 
 * Provides XSS protection and content sanitization for scraped event data
 * Focuses on preserving legitimate content while blocking malicious scripts
 */

/**
 * HTML entities for encoding special characters
 */
const HTML_ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
};

/**
 * Regex patterns for detecting potentially malicious content
 */
const SECURITY_PATTERNS = {
    // Script tags and JavaScript protocols
    script: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    javascript: /javascript:/gi,
    
    // Event handlers and inline scripts
    onEvents: /\bon\w+\s*=/gi,
    
    // Data URIs that could contain scripts
    dataUri: /data:(?:text\/html|application\/javascript)/gi,
    
    // Style tags and expressions
    style: /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    expression: /expression\s*\(/gi,
    
    // Object and embed tags
    object: /<(object|embed|applet|iframe)[^>]*>/gi,
    
    // Meta refresh redirects
    metaRefresh: /<meta[^>]*http-equiv\s*=\s*["']refresh["'][^>]*>/gi
};

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
export const escapeHtml = (str) => {
    if (typeof str !== 'string') {
        return String(str);
    }
    
    return str.replace(/[&<>"'/]/g, (match) => HTML_ENTITIES[match] || match);
};

/**
 * Removes potentially dangerous HTML tags and attributes
 * @param {string} html - The HTML string to sanitize
 * @returns {string} The sanitized HTML
 */
export const stripDangerousHtml = (html) => {
    if (typeof html !== 'string') {
        return '';
    }
    
    let sanitized = html;
    
    // Remove dangerous patterns
    Object.entries(SECURITY_PATTERNS).forEach(([, pattern]) => {
        sanitized = sanitized.replace(pattern, '');
    });
    
    return sanitized.trim();
};

/**
 * Sanitizes event title - preserves formatting but removes scripts
 * @param {string} title - The event title to sanitize
 * @returns {string} The sanitized title
 */
export const sanitizeEventTitle = (title) => {
    if (!title || typeof title !== 'string') {
        return 'Untitled Event';
    }
    
    // Remove dangerous HTML but preserve basic formatting
    let sanitized = stripDangerousHtml(title);
    
    // Allow only safe HTML tags for formatting
    const allowedTags = ['b', 'i', 'em', 'strong', 'u'];
    const tagPattern = new RegExp(`</?(?!(?:${allowedTags.join('|')})\\b)[^>]+>`, 'gi');
    sanitized = sanitized.replace(tagPattern, '');
    
    // Escape remaining content while preserving allowed tags
    sanitized = sanitized.replace(/&(?!(amp|lt|gt|quot|#x27|#x2F);)/g, '&amp;');
    
    // Limit length to prevent layout issues
    if (sanitized.length > 200) {
        sanitized = sanitized.substring(0, 197) + '...';
    }
    
    return sanitized.trim() || 'Untitled Event';
};

/**
 * Sanitizes venue name - strict sanitization as venue names should be plain text
 * @param {string} venue - The venue name to sanitize
 * @returns {string} The sanitized venue name
 */
export const sanitizeVenueName = (venue) => {
    if (!venue || typeof venue !== 'string') {
        return 'Unknown Venue';
    }
    
    // Strip all HTML and escape special characters
    let sanitized = venue.replace(/<[^>]*>/g, '');
    sanitized = escapeHtml(sanitized);
    
    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    // Limit length
    if (sanitized.length > 100) {
        sanitized = sanitized.substring(0, 97) + '...';
    }
    
    return sanitized.trim() || 'Unknown Venue';
};

/**
 * Validates and sanitizes URLs to prevent malicious redirects
 * @param {string} url - The URL to validate
 * @returns {string|null} The sanitized URL or null if invalid
 */
export const sanitizeUrl = (url) => {
    if (!url || typeof url !== 'string') {
        return null;
    }
    
    // Remove dangerous protocols
    if (SECURITY_PATTERNS.javascript.test(url)) {
        return null;
    }
    
    // Remove data URIs that could contain scripts
    if (SECURITY_PATTERNS.dataUri.test(url)) {
        return null;
    }
    
    try {
        const urlObj = new URL(url);
        
        // Allow only safe protocols
        const allowedProtocols = ['http:', 'https:'];
        if (!allowedProtocols.includes(urlObj.protocol)) {
            return null;
        }
        
        // Validate domain to prevent homograph attacks
        const domain = urlObj.hostname.toLowerCase();
        if (domain.includes('xn--') && !/^[a-z0-9.-]+$/.test(domain)) {
            console.warn('Suspicious domain detected:', domain);
            return null;
        }
        
        return urlObj.href;
    } catch {
        console.warn('Invalid URL detected:', url);
        return null;
    }
};

/**
 * Sanitizes an entire event object
 * @param {Object} event - The event object to sanitize
 * @returns {Object} The sanitized event object
 */
export const sanitizeEvent = (event) => {
    if (!event || typeof event !== 'object') {
        return {
            title: 'Invalid Event',
            venue: 'Unknown Venue',
            link: null,
            dateUnix: Date.now()
        };
    }
    
    return {
        title: sanitizeEventTitle(event.title),
        venue: sanitizeVenueName(event.venue),
        link: sanitizeUrl(event.link),
        dateUnix: typeof event.dateUnix === 'number' ? event.dateUnix : Date.now(),
        // Preserve any other safe properties
        ...Object.fromEntries(
            Object.entries(event)
                .filter(([key]) => !['title', 'venue', 'link', 'dateUnix'].includes(key))
                .filter(([, value]) => typeof value === 'string' || typeof value === 'number')
                .map(([key, value]) => [key, typeof value === 'string' ? escapeHtml(value) : value])
        )
    };
};

/**
 * Sanitizes an array of events with performance monitoring
 * @param {Array} events - Array of event objects to sanitize
 * @returns {Array} Array of sanitized event objects
 */
export const sanitizeEvents = (events) => {
    if (!Array.isArray(events)) {
        console.warn('sanitizeEvents: Expected array, got:', typeof events);
        return [];
    }
    
    const startTime = performance.now();
    const sanitizedEvents = events
        .map(sanitizeEvent)
        .filter(event => event.title !== 'Invalid Event'); // Remove completely invalid events
    
    const endTime = performance.now();
    console.log(`✓ Sanitized ${sanitizedEvents.length} events in ${(endTime - startTime).toFixed(2)}ms`);
    
    return sanitizedEvents;
};

/**
 * Content Security Policy helper - generates safe inline styles
 * @param {Object} styles - Style properties object
 * @returns {string} Safe CSS string
 */
export const createSafeStyles = (styles) => {
    if (!styles || typeof styles !== 'object') {
        return '';
    }
    
    return Object.entries(styles)
        .filter(([property, value]) => {
            // Only allow safe CSS properties
            const safeProperties = [
                'color', 'background-color', 'font-size', 'font-weight',
                'margin', 'padding', 'border', 'width', 'height',
                'display', 'flex', 'justify-content', 'align-items'
            ];
            return safeProperties.includes(property) && typeof value === 'string';
        })
        .map(([property, value]) => {
            // Sanitize the value
            const sanitizedValue = value.replace(/[<>]/g, '');
            return `${property}: ${sanitizedValue}`;
        })
        .join('; ');
};