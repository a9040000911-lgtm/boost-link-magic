import { analyzeLink, getRecommendedCategoryIds } from '../src/lib/smm-data';

const categories = [
    { id: 'yt-likes', name: 'Лайки' },
    { id: 'yt-comments', name: 'Комментарии' },
    { id: 'yt-votes', name: 'Голоса' },
    { id: 'tg-views', name: 'Просмотры' }
];

const testUrls = [
    { url: 'https://www.youtube.com/post/Ugkx-1_vXP_234', expectedKw: 'votes' },
    { url: 'https://t.me/durov/123', expectedKw: 'views' }
];

console.log('--- Phase 15: Recommendations Test Results ---');
testUrls.forEach(({ url, expectedKw }) => {
    const result = analyzeLink(url);
    console.log(`URL: ${url}`);
    if (result) {
        const recommended = getRecommendedCategoryIds(result, categories as any);
        console.log(`  Platform: ${result.platform}`);
        console.log(`  Type: ${result.linkType}`);
        console.log(`  Recommended IDs: ${recommended.join(', ')}`);
        const hasExpected = recommended.some(id => id.includes(expectedKw));
        console.log(`  Match ${expectedKw}: ${hasExpected ? 'PASS' : 'FAIL'}`);
    } else {
        console.log('  Result: FAILED');
    }
    console.log('----------------------------');
});
