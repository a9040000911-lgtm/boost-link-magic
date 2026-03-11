import { analyzeLink } from '../src/lib/smm-data';

const testUrls = [
    // OK Topic Fix
    'https://ok.ru/group/123/topic/456',

    // Likee
    'https://likee.video/@official_user',
    'https://likee.video/v/ABC123XYZ',

    // Threads
    'https://www.threads.net/@zuck',
    'https://www.threads.net/@zuck/post/Cx_XYZ123'
];

console.log('--- Phase 10: Likee & Threads Analyzer Test Results ---');
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
