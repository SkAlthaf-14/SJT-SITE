import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCO30dNxp6Ax0kn5vMCwnMw2Jsfr0LmiCE',
  authDomain: 'sjtfarms-5eaeb.firebaseapp.com',
  projectId: 'sjtfarms-5eaeb',
  storageBucket: 'sjtfarms-5eaeb.firebasestorage.app',
  messagingSenderId: '732402317142',
  appId: '1:732402317142:web:c115fe066a50c73e8d08f7',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  console.log('Fetching products from Firestore...');
  const snap = await getDocs(collection(db, 'products'));
  console.log(`Found ${snap.size} products in Firestore.`);
  snap.forEach((doc) => {
    const data = doc.data();
    console.log(`\nDoc ID: ${doc.id}`);
    console.log(`  Name: ${data.name}`);
    console.log(`  Slug: ${data.slug}`);
    console.log(`  Weights:`, data.weights);
    console.log(`  WeightPrices:`, data.weightPrices);
    console.log(`  JarImages:`, data.jarImages);
    console.log(`  Images:`, data.images);
    console.log(`  ImageUrl:`, data.imageUrl);
  });
  process.exit(0);
}

main().catch((err) => {
  console.error('Error fetching products:', err);
  process.exit(1);
});
