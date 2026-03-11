import { analyzeLink } from '../src/lib/smm-data';

const testUrls = [
    'https://ok.ru/profile/123456789',
    'https://ok.ru/group/54321',
    'https://ok.ru/group/123/topic/456',
    'https://ok.ru/video/12345',
    'ok.ru/profile/987654'
];

console.log('--- Phase 9: OK Analyzer Test Results ---');
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
