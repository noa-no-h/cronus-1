/**
 * Redaction Helper for Cronus
 * 
 * This module provides utilities to redact sensitive content from text
 * before it is sent to external LLM services like Hugging Face or OpenAI.
 * 
 * It aims to enhance privacy by preventing sensitive data from being
 * included in API requests to external services.
 */

/**
 * Patterns for common sensitive data types to redact
 */
const PATTERNS = {
  // Credit Card (major card types, now matches with optional spaces/dashes between all groups)
  CREDIT_CARD: /(?:4[0-9]{3}([- ]?)[0-9]{4}\1[0-9]{4}\1[0-9]{4}|5[1-5][0-9]{2}([- ]?)[0-9]{4}\2[0-9]{4}\2[0-9]{4}|3[47][0-9]{2}([- ]?)[0-9]{6}\3[0-9]{5}|3(?:0[0-5]|[68][0-9])[0-9]{1}([- ]?)[0-9]{6}\4[0-9]{4}|6(?:011|5[0-9]{2})([- ]?)[0-9]{4}\5[0-9]{4}\5[0-9]{4}|(?:2131|1800|35\d{3})([- ]?)[0-9]{6}\6[0-9]{5})/g,
  
  // Social Security Number (US)
  SSN: /\b(?!000|666|9)(?:[0-8][0-9]{2}|7([0-6][0-9]|7[0-2]))[-]?(?!00)([0-9]{2})[-]?(?!0000)([0-9]{4})\b/g,
  
  // Phone numbers (various formats)
  PHONE: /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
  
  // Email addresses
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  
  // Physical addresses (simplified)
  ADDRESS: /\d{1,5}\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)*(?:\s[A-Z]{2})?,\s[A-Z]{2}\s\d{5}(?:-\d{4})?/g,
  
  // API keys and access tokens - common formats
  API_KEY: /(?:key-|sk-|pk-|api[_-]?key\s*[=:]\s*['"]?)[a-zA-Z0-9_\-]{20,}/gi,
  
  // Password fields or similar
  PASSWORD: /(?:password|passwd|pwd)(?:\s*[=:]\s*)['"]?[^\s'"]{8,}['"]?/gi,
  
  // Bank account number (simplified)
  BANK_ACCOUNT: /\b(?:\d{8,17})\b/g
};

/**
 * Options for redacting content
 */
export interface RedactionOptions {
  /** Replace patterns with this text */
  redactionText?: string;
  
  /** Additional regex patterns to include */
  additionalPatterns?: RegExp[];
  
  /** Whether to log redaction counts (no sensitive content is logged) */
  logCounts?: boolean;
  
  /** Skip certain built-in patterns (use pattern keys from the PATTERNS object) */
  skipPatterns?: Array<keyof typeof PATTERNS>;
}

/**
 * Result of redacting content
 */
export interface RedactionResult {
  /** The redacted text */
  text: string;
  
  /** Number of redactions applied by type */
  counts: Record<string, number>;
  
  /** Whether any redactions were applied */
  wasRedacted: boolean;
}

/**
 * Redact sensitive information from text
 * 
 * @param text - The input text to redact
 * @param options - Redaction options
 * @returns The redacted text and metadata about the redaction process
 */
export function redactSensitiveInfo(
  text: string | null | undefined,
  options: RedactionOptions = {}
): RedactionResult {
  if (!text) return { text: '', counts: {}, wasRedacted: false };

  const redactionText = options.redactionText || '[REDACTED]';
  const logCounts = options.logCounts ?? false;
  const skipPatterns = options.skipPatterns || [];


  // If the text contains the keyword 'Card number' or 'SSN' (case-insensitive), redact the whole text
  if (/card number/i.test(text) || /ssn/i.test(text)) {
    const keywordCounts: Record<string, number> = {};
    if (/card number/i.test(text)) keywordCounts.KEYWORD_CARD_NUMBER = 1;
    if (/ssn/i.test(text)) keywordCounts.KEYWORD_SSN = 1;
    return {
      text: redactionText,
      counts: keywordCounts,
      wasRedacted: true
    };
  }

  const counts: Record<string, number> = {};
  let wasRedacted = false;
  let redactedText = text;

  // Apply all patterns except skipped ones
  Object.keys(PATTERNS).forEach((key) => {
    const patternKey = key as keyof typeof PATTERNS;

    // Skip this pattern if in skipPatterns
    if (skipPatterns.includes(patternKey)) return;

    const pattern = PATTERNS[patternKey];
    const matches = redactedText.match(pattern);

    if (matches) {
      counts[patternKey] = matches.length;
      wasRedacted = true;
      redactedText = redactedText.replace(pattern, redactionText);
    } else {
      counts[patternKey] = 0;
    }
  });

  // Apply any additional custom patterns
  if (options.additionalPatterns) {
    options.additionalPatterns.forEach((pattern, index) => {
      const patternKey = `CUSTOM_${index}`;
      const matches = redactedText.match(pattern);

      if (matches) {
        counts[patternKey] = matches.length;
        wasRedacted = true;
        redactedText = redactedText.replace(pattern, redactionText);
      } else {
        counts[patternKey] = 0;
      }
    });
  }

  // Log redaction counts if requested
  if (logCounts && wasRedacted) {
    const totalRedactions = Object.values(counts).reduce((sum, count) => sum + count, 0);
    console.log(`[Redaction] Applied ${totalRedactions} redactions to text.`);

    Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .forEach(([type, count]) => {
        console.log(`[Redaction] - ${type}: ${count}`);
      });
  }

  return {
    text: redactedText,
    counts,
    wasRedacted
  };
}

/**
 * Redact sensitive information from an object (recursively for nested objects)
 * 
 * @param obj - Object to redact values in 
 * @param options - Redaction options
 * @returns Copy of object with sensitive data redacted
 */
export function redactObjectValues<T extends Record<string, any>>(
  obj: T,
  options: RedactionOptions = {}
): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result: Record<string, any> = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (value === null || value === undefined) {
        result[key] = value;
      } else if (typeof value === 'string') {
        // Apply redaction to string values
        result[key] = redactSensitiveInfo(value, options).text;
      } else if (typeof value === 'object') {
        // Recursively redact nested objects
        result[key] = redactObjectValues(value, options);
      } else {
        // Keep non-string, non-object values as they are
        result[key] = value;
      }
    }
  }
  
  return result as T;
}

/**
 * Redact sensitive information from window activity details
 * 
 * @param activityDetails - Window details to redact
 * @param options - Redaction options
 * @returns Copy of activity details with sensitive data redacted
 */
export function redactActivityDetails<T extends { content?: string | null, url?: string | null, title?: string | null }>(
  activityDetails: T,
  options: RedactionOptions = {}
): T {
  const result = { ...activityDetails };
  
  // Redact content field if present
  if (result.content) {
    result.content = redactSensitiveInfo(result.content, options).text;
  }
  
  // URLs can contain sensitive info too (query params)
  if (result.url) {
    result.url = redactSensitiveInfo(result.url, options).text;
  }
  
  // Window titles might contain sensitive info in some cases
  if (result.title) {
    result.title = redactSensitiveInfo(result.title, options).text;
  }
  
  return result;
}