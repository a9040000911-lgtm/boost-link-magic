import { analyzeLink } from '../src/lib/smm-data';

const testUrls = [
    // YouTube Post
    'https://www.youtube.com/post/Ugkx-1_vXP_234',
    'youtube.com/post/Ugkxabc123',

    // Telegram Post (for UI test confirmation)
    'https://t.me/durov/123'
];

console.log('--- Phase 15: YouTube Post & TG Album Test Results ---');
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
