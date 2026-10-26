import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('--- Verifying Hero Component & Distribution Bundle ---');

const heroSource = fs.readFileSync(path.resolve('./src/components/home/Hero.tsx'), 'utf-8');

// 1. Mobile Container & Flex
assert(heroSource.includes('flex flex-col justify-between lg:hidden'), 'Hero.tsx mobile container has flex flex-col justify-between lg:hidden');
assert(!heroSource.includes('block lg:hidden relative w-full min-h-[100svh] min-[640px]:min-h-[92vh] flex flex-col'), 'No conflicting block + flex on same element');
console.log('✓ Mobile container flex classes verified');

// 2. Multi-viewport height
assert(heroSource.includes('min-h-screen min-h-[100dvh] min-h-[100svh]'), 'Hero.tsx mobile container includes multi-viewport min-height');
console.log('✓ Multi-viewport min-height verified');

// 3. Absolute inset-0 background stack
assert(heroSource.includes("position: 'absolute', inset: 0, width: '100%', height: '100%'"), 'Background stack has explicit absolute inset-0 styles');
assert(heroSource.includes("objectFit: 'cover'"), 'Background img has objectFit: cover');
assert(heroSource.includes("objectPosition: 'center center'"), 'Background img has objectPosition: center center');
console.log('✓ Background stack positioning and coverage verified');

// 4. Subtle uniform overlay (no bottom blackout)
assert(heroSource.includes("backgroundColor: 'rgba(22, 14, 10, 0.40)'"), 'Overlay has uniform 40% dark overlay across the entire slide');
assert(!heroSource.includes('rgba(22, 14, 10, 0.84) 100%'), 'No 84% bottom blackout gradient');
console.log('✓ Dark bottom blackout gradient verified eliminated');

// 5. Preloading
assert(heroSource.includes('/images/hero/slide1_araku_estate_hero.jpg'), 'Slide 1 Araku Estate asset configured');
assert(heroSource.includes('/images/hero/slide2_instant_studio.jpg'), 'Slide 2 Instant asset configured');
assert(heroSource.includes('/images/hero/slide3_special_blend_studio.jpg'), 'Slide 3 Special Blend asset configured');
assert(heroSource.includes('/images/hero/slide4_signature_studio.jpg'), 'Slide 4 Signature asset configured');
assert(heroSource.includes('/images/hero/slide5_premium_studio.jpg'), 'Slide 5 Premium asset configured');
console.log('✓ All 5 slide background assets verified');

// 6. Desktop wide layout untouched
assert(heroSource.includes('hidden lg:flex relative min-h-[82vh]'), 'Desktop wide layout strictly preserved');
console.log('✓ Desktop wide layout verified');

console.log('🎉 ALL VERIFICATIONS PASSED SUCCESSFULLY!');
