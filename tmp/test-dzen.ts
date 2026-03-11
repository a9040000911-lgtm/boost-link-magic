import { analyzeLink } from '../src/lib/smm-data';

const testUrls = [
    'https://dzen.ru/video/watch/61f1a2b3c4d5e6f7g8h9i0j1',
    'https://dzen.ru/shorts/6767d43fa04e5b5f5fbf7b8f',
    'https://dzen.ru/a/XYZ_123',
    'https://dzen.ru/my_channel_name',
    'dzen.ru/a/article-id-here'
];

console.log('--- Phase 8: Dzen Analyzer Test Results ---');
testUrls.forEach(url => {
    const result = analyzeLink(url);
    console.log(`URL: ${url}`);
    if (result) {
        console.log(`  Platform: ${result.platform}`);
        console.log(`  Type: ${result.linkType}`);
        console.log(`  Label: ${result.label}`);
        console.log(`  ID/Username: ${result.contentId || result.username || 'n/a'}`);
        console.log(`  Confidence: ${result.confidence}`);
    } else {
        console.log('  Result: FAILED (null)');
    }
    console.log('----------------------------');
});
