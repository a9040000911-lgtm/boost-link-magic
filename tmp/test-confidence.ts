import { analyzeLink } from '../src/lib/smm-data';

const testUrls = [
    'https://vk.com/id1', // medium or high depending on regex
    'https://vk.com/wall-1_1', // high if it has ^
    'https://www.youtube.com/watch?v=123', // medium
    'https://vkplay.live/username', // high
];

console.log('--- Confidence System Test Results ---');
testUrls.forEach(url => {
    const result = analyzeLink(url);
    console.log(`URL: ${url}`);
    if (result) {
        console.log(`  Platform: ${result.platform}`);
        console.log(`  Type: ${result.linkType}`);
        console.log(`  Confidence: ${result.confidence}`);
        console.log(`  Label: ${result.label}`);
    } else {
        console.log('  Result: NULL');
    }
    console.log('----------------------------');
});
