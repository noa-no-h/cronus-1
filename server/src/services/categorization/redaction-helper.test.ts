import { describe, expect, it } from 'bun:test';
import { redactSensitiveInfo, redactActivityDetails } from './redaction-helper';

describe('Redaction Helper', () => {
  describe('redactSensitiveInfo', () => {
    it('should redact credit card numbers', () => {
      const testText = 'My credit card is 4111-1111-1111-1111 and expiry is 12/24';
      const result = redactSensitiveInfo(testText);
      
      expect(result.wasRedacted).toBe(true);
      expect(result.text).not.toContain('4111-1111-1111-1111');
      expect(result.counts.CREDIT_CARD).toBe(1);
    });
    
    it('should redact SSN', () => {
      const testText = 'My SSN is 123-45-6789';
      const result = redactSensitiveInfo(testText);
      
      expect(result.wasRedacted).toBe(true);
      expect(result.text).not.toContain('123-45-6789');
      expect(result.counts.SSN).toBe(1);
    });
    
    it('should redact phone numbers', () => {
      const testText = 'Call me at (123) 456-7890';
      const result = redactSensitiveInfo(testText);
      
      expect(result.wasRedacted).toBe(true);
      expect(result.text).not.toContain('(123) 456-7890');
      expect(result.counts.PHONE).toBe(1);
    });
    
    it('should redact emails', () => {
      const testText = 'My email is john.doe@example.com';
      const result = redactSensitiveInfo(testText);
      
      expect(result.wasRedacted).toBe(true);
      expect(result.text).not.toContain('john.doe@example.com');
      expect(result.counts.EMAIL).toBe(1);
    });
    
    it('should respect custom redaction text', () => {
      const testText = 'My email is john.doe@example.com';
      const result = redactSensitiveInfo(testText, { redactionText: '[HIDDEN]' });
      
      expect(result.wasRedacted).toBe(true);
      expect(result.text).toContain('[HIDDEN]');
    });
    
    it('should skip specified patterns', () => {
      const testText = 'Email: test@example.com, Phone: 123-456-7890';
      const result = redactSensitiveInfo(testText, { skipPatterns: ['EMAIL'] });
      
      expect(result.wasRedacted).toBe(true);
      expect(result.text).toContain('test@example.com'); // Email should remain
      expect(result.text).not.toContain('123-456-7890'); // Phone should be redacted
    });
  });
  
  describe('redactActivityDetails', () => {
    it('should redact sensitive info in content field', () => {
      const activityDetails = {
        ownerName: 'Browser',
        title: 'Payment Page',
        content: 'Credit card: 4242-4242-4242-4242, Expiry: 01/25',
        url: 'https://example.com/checkout'
      };
      
      const result = redactActivityDetails(activityDetails);
      
      expect(result.content).not.toContain('4242-4242-4242-4242');
      expect(result.ownerName).toBe('Browser'); // Shouldn't be affected
    });
    
    it('should redact query parameters in URLs', () => {
      const activityDetails = {
        ownerName: 'Browser',
        title: 'Search Results',
        content: 'Some content',
        url: 'https://example.com/search?q=test&token=sk-1234567890abcdef'
      };
      
      const result = redactActivityDetails(activityDetails);
      
      expect(result.url).not.toContain('sk-1234567890abcdef');
      expect(result.url).toContain('example.com/search'); // Base URL should remain
    });
  });
});