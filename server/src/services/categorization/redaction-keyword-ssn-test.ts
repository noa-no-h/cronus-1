import { redactSensitiveInfo } from './redaction-helper';

const testCases = [
  'This page contains Card number: 4111 1111 1111 1111',
  'My SSN is 123-45-6789',
  'No card number or SSN here',
  'Sensitive: SSN',
  'Completely safe text.'
];

testCases.forEach((input, i) => {
  const { text, wasRedacted, counts } = redactSensitiveInfo(input);
  console.log(`Test #${i + 1}`);
  console.log('Input:   ', input);
  console.log('Redacted:', text);
  console.log('Was redacted:', wasRedacted);
  console.log('Keyword redactions:', counts.KEYWORD_CARD_NUMBER, counts.KEYWORD_SSN);
  console.log('---');
});
