import { redactSensitiveInfo } from './redaction-helper';

// Test credit card numbers (Visa, MasterCard, Amex, Discover, JCB, Diners Club)
const testCases = [
  'My Visa is 4111 1111 1111 1111',
  'MasterCard: 5500-0000-0000-0004',
  'Amex: 3400 000000 00009',
  'Discover: 6011 0000 0000 0004',
  'JCB: 3530 1113 3330 0000',
  'Diners: 3000 0000 0000 04',
  'Not a card: 1234 5678 9012 3456', // Should match as generic 16-digit
  'Random text with 4111111111111111 inside',
  'No card here!'
];

testCases.forEach((input, i) => {
  const { text, wasRedacted, counts } = redactSensitiveInfo(input);
  console.log(`Test #${i + 1}`);
  console.log('Input:   ', input);
  console.log('Redacted:', text);
  console.log('Was redacted:', wasRedacted);
  console.log('Credit card redactions:', counts.CREDIT_CARD);
  console.log('---');
});
