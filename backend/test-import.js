// Quick test script to verify generateUniqueShortId import works
import { generateUniqueShortId } from './utils/shortUrlGenerator.js';

console.log('Testing generateUniqueShortId import...');
console.log('Type:', typeof generateUniqueShortId);
console.log('Is function:', typeof generateUniqueShortId === 'function');

if (typeof generateUniqueShortId === 'function') {
  try {
    const result = await generateUniqueShortId();
    console.log('✓ Success! Generated ID:', result);
    process.exit(0);
  } catch (error) {
    console.error('✗ Error calling function:', error.message);
    process.exit(1);
  }
} else {
  console.error('✗ generateUniqueShortId is not a function!');
  process.exit(1);
}

