import { analyzeLink } from '../src/lib/smm-data';

const testUrls = [
    // Facebook
    'https://www.facebook.com/zuck',
    'https://www.facebook.com/profile.php?id=100000000000001',
    'https://www.facebook.com/zuck/posts/1015923456789',
    'https://www.facebook.com/reel/1234567890',
    'https://www.facebook.com/watch/?v=987654321',

    // X / Twitter
    'https://x.com/elonmusk',
    'https://twitter.com/jack',
    'https://x.com/nasa/status/1765432109876543210',
    'twitter.com/support/status/123'
];

console.log('--- Phase 11: Facebook & X Analyzer Test Results ---');
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
