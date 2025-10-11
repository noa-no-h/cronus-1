import { redactSensitiveInfo } from './redaction-helper';

const testCases = [
  'This page contains Card number: 4111 1111 1111 1111',
  'No card number here, just a Visa: 4111 1111 1111 1111',
  'CARD NUMBER is present in all caps',
  'card number',
  'Random text',
  'My card number is: 1234 5678 9012 3456',
  'Sensitive: Card Number',
  'Completely safe text.'
];

testCases.forEach((input, i) => {
  const { text, wasRedacted, counts } = redactSensitiveInfo(input);
  console.log(`Test #${i + 1}`);
  console.log('Input:   ', input);
  console.log('Redacted:', text);
  console.log('Was redacted:', wasRedacted);
  console.log('Keyword redactions:', counts.KEYWORD_CARD_NUMBER);
  console.log('---');
});
