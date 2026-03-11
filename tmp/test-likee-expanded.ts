import { analyzeLink } from '../src/lib/smm-data';

const testUrls = [
    // Likee Desktop
    'https://likee.video/@official_user',
    'https://likee.video/v/ABC123XYZ',

    // Likee Mobile Share
    'https://l.likee.video/v/12345abc',
    'https://l.likee.video/p/98765xyz',
    'l.likee.video/p/share-id'
];

console.log('--- Phase 12: Expanded Likee Analyzer Test Results ---');
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
