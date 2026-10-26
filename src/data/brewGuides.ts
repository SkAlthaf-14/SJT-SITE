import { BrewGuide } from '../types';

export const BREW_GUIDES: BrewGuide[] = [
  {
    id: 'south-indian-filter',
    name: 'South Indian Filter',
    shortDesc: 'The time-honoured method for thick, aromatic decoction and frothy morning kaapi.',
    time: '15 Mins',
    strength: 'Strong & Viscous',
    grind: 'Fine to Medium-Fine',
    coffeeRatio: '20g (approx. 2 tbsp)',
    waterRatio: '100ml boiling water',
    temp: '96°C – 100°C',
    image: '/images/sjt_hero_coffee.jpg',
    proTip: 'Pour hot water in a slow gentle circle over the pressing disc. Never press the umbrella disc down with force—let gravity slowly draw the richest first-drip decoction.',
    steps: [
      {
        title: 'Assemble the Brass Filter',
        description: 'Ensure the lower collection chamber and upper perforated cylinder of your SJT brass filter are clean and dry. Assemble them firmly together.',
        durationSeconds: 30
      },
      {
        title: 'Add Fresh SJT Coffee Powder',
        description: 'Add 20 grams (roughly 2 heaped tablespoons) of SJT Signature or Filter Coffee Powder into the upper compartment.',
        durationSeconds: 30
      },
      {
        title: 'Insert the Pressing Disc (Umbrella)',
        description: 'Place the perforated pressing disc gently on top of the grounds. Press down very lightly just to level the bed. Do not pack it tight.',
        durationSeconds: 20
      },
      {
        title: 'Pour Freshly Boiled Water',
        description: 'Bring fresh water to a rolling boil (96°C–100°C). Slowly pour 100ml in gentle spirals over the umbrella stem until filled to the brim.',
        durationSeconds: 40
      },
      {
        title: 'Cover & Let It Drip (12–15 Mins)',
        description: 'Place the brass lid on top and let patience work its magic. Over 12–15 minutes, thick, golden-brown first decoction will collect in the lower cup.',
        durationSeconds: 900
      },
      {
        title: 'Froth with Hot Milk in Davara',
        description: 'Pour 30–40ml of thick decoction into a brass tumbler. Add 120ml piping hot full-cream milk and sugar to taste. Pour back and forth from tumbler to davara at arm’s length to create dense froth.',
        durationSeconds: 60
      }
    ]
  },
  {
    id: 'french-press',
    name: 'French Press',
    shortDesc: 'Full immersion brewing highlighting rich mouthfeel, body, and natural chocolate notes.',
    time: '4 Mins',
    strength: 'Medium-Bold',
    grind: 'Coarse Sea-Salt',
    coffeeRatio: '25g Coffee',
    waterRatio: '350ml Water',
    temp: '92°C – 94°C',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=1000&auto=format&fit=crop',
    proTip: 'After 4 minutes, gently break the crust on top with a spoon and skim off white foam before plunging for a remarkably clean cup with no grit.',
    steps: [
      {
        title: 'Pre-warm the Carafe',
        description: 'Rinse your French press glass beaker with hot water for 30 seconds to retain brewing temperature, then discard the rinse water.',
        durationSeconds: 30
      },
      {
        title: 'Add Coarse Grounds',
        description: 'Add 25g of coarsely ground SJT coffee powder into the bottom of the beaker.',
        durationSeconds: 20
      },
      {
        title: 'Bloom & Saturate',
        description: 'Pour 75ml of hot water (93°C) over the coffee. Watch the fresh grounds expand and bloom with aromas for 30 seconds.',
        durationSeconds: 30
      },
      {
        title: 'Fill & Stir',
        description: 'Pour remaining water up to 350ml. Give a gentle 5-second stir with a wooden or silicone spoon.',
        durationSeconds: 30
      },
      {
        title: 'Brew 4 Minutes',
        description: 'Place the plunger lid on top with the filter resting just above the surface of the coffee. Wait 4 minutes.',
        durationSeconds: 240
      },
      {
        title: 'Gentle Press & Serve',
        description: 'Steadily push the plunger down with minimal pressure. Pour immediately into your favourite mug to prevent over-extraction.',
        durationSeconds: 30
      }
    ]
  },
  {
    id: 'moka-pot',
    name: 'Moka Pot',
    shortDesc: 'Stovetop steam extraction yielding intense, concentrated espresso-style coffee.',
    time: '5 Mins',
    strength: 'Very Strong',
    grind: 'Fine (Slightly coarser than espresso)',
    coffeeRatio: '18g – 20g (Fill basket)',
    waterRatio: '150ml (Up to safety valve)',
    temp: 'Pre-heated Water (90°C)',
    image: 'https://images.unsplash.com/photo-1524350876685-274059332603?q=80&w=1000&auto=format&fit=crop',
    proTip: 'Use pre-heated water in the lower boiler to prevent cooking the dry coffee grounds while the pot warms on the flame.',
    steps: [
      {
        title: 'Fill Bottom Chamber',
        description: 'Pour pre-heated hot water into the base chamber just below the brass safety release valve.',
        durationSeconds: 30
      },
      {
        title: 'Fill the Funnel Basket',
        description: 'Loosely fill the filter basket with SJT coffee powder level with the rim. Do not tamp down.',
        durationSeconds: 30
      },
      {
        title: 'Assemble with Care',
        description: 'Screw the upper chamber tightly onto the base using a tea towel to protect your hands from the hot lower pot.',
        durationSeconds: 20
      },
      {
        title: 'Brew on Low Heat',
        description: 'Place on low flame with lid open. In 2–3 minutes, rich honey-coloured coffee will stream smoothly from the central column.',
        durationSeconds: 180
      },
      {
        title: 'Remove at Sputter',
        description: 'As soon as the stream turns pale and begins to hiss or sputter, remove from heat and quench the bottom under cool running tap water.',
        durationSeconds: 15
      },
      {
        title: 'Stir & Enjoy',
        description: 'Stir the coffee in the pot with a small spoon to blend the heavy first extraction with the lighter tail before pouring.',
        durationSeconds: 15
      }
    ]
  },
  {
    id: 'pour-over',
    name: 'Pour Over',
    shortDesc: 'Delicate manual drip brewing capturing nuanced floral, fruity, and caramel clarity.',
    time: '3.5 Mins',
    strength: 'Clean & Bright',
    grind: 'Medium (Sand-like)',
    coffeeRatio: '15g Coffee',
    waterRatio: '250ml Water (1:16.6)',
    temp: '92°C – 94°C',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1000&auto=format&fit=crop',
    proTip: 'Pour in steady concentric circles from the centre outward, avoiding direct contact with the paper filter walls.',
    steps: [
      {
        title: 'Rinse Filter Paper',
        description: 'Fold and seat the cone paper filter into your dripper. Rinse thoroughly with hot water to remove paper taste and discard the rinse water.',
        durationSeconds: 30
      },
      {
        title: 'Add Fresh Grounds',
        description: 'Add 15g of freshly ground SJT Special Blend. Shake lightly to make a flat, even coffee bed.',
        durationSeconds: 20
      },
      {
        title: 'The Bloom (45s)',
        description: 'Pour 45g of water in spirals. Observe the grounds expand and release carbon dioxide bubbles. Wait 45 seconds.',
        durationSeconds: 45
      },
      {
        title: 'First Main Pour',
        description: 'Pour continuously until the scale reads 150g. Maintain a gentle, non-turbulent stream.',
        durationSeconds: 45
      },
      {
        title: 'Final Pour to 250g',
        description: 'Let the water level drop slightly, then pour up to 250g. Give the dripper one gentle swirl to ensure an even bed flat draw-down.',
        durationSeconds: 60
      }
    ]
  },
  {
    id: 'cold-coffee',
    name: 'Cold Coffee & Cold Brew',
    shortDesc: 'Slow 16-hour cold extraction resulting in silky, low-acid, refreshing nectar.',
    time: '12–16 Hours',
    strength: 'Smooth & Sweet',
    grind: 'Extra Coarse',
    coffeeRatio: '50g Coffee',
    waterRatio: '400ml Cold Filtered Water',
    temp: 'Room Temp or Refrigerator (4°C–18°C)',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=1000&auto=format&fit=crop',
    proTip: 'Store the concentrate sealed in the fridge for up to 10 days. Dilute 1:1 with chilled milk, oat milk, or tonic water and ice.',
    steps: [
      {
        title: 'Combine Grounds & Water',
        description: 'In a clean glass jar or French press, combine 50g of coarsely ground SJT Cold Brew Blend with 400ml chilled filtered water.',
        durationSeconds: 60
      },
      {
        title: 'Gentle Stir',
        description: 'Stir gently for 30 seconds ensuring all coffee particles are completely saturated.',
        durationSeconds: 30
      },
      {
        title: 'Steep 14–16 Hours',
        description: 'Cover tightly and place in your refrigerator door for 14–16 hours. The cold temperature extracts sweetness while leaving bitter acids behind.',
        durationSeconds: 50400
      },
      {
        title: 'Filter Twice',
        description: 'Slowly plunge or pour through a fine mesh strainer lined with unbleached paper filter into a clean glass bottle.',
        durationSeconds: 120
      },
      {
        title: 'Serve Over Ice',
        description: 'Fill a glass with clear ice cubes, pour 100ml cold brew concentrate, and top with 100ml cold milk or sparkling water.',
        durationSeconds: 30
      }
    ]
  }
];
