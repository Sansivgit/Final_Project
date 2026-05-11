import ClothType from '../models/ClothType.js';

/** Initial catalog when the collection is empty (matches admin fallback list). */
const DEFAULT_NAMES = [
  'Hoodies',
  'Pants',
  'Tees',
  'Blazers',
  'Suits',
  'Formal trousers',
  'Dress shirts',
  'Pencil skirts',
  'Formal dresses',
  'Crop tops',
  'Denim jackets',
  'Mini dresses',
  'Jumpsuits',
  'Skater skirts',
];

export async function ensureClothTypes() {
  try {
    const count = await ClothType.countDocuments();
    if (count > 0) return;

    await ClothType.insertMany(
      DEFAULT_NAMES.map((name, i) => ({ name, sortOrder: i })),
    );
    console.log(`Seeded ${DEFAULT_NAMES.length} cloth types`);
  } catch (e) {
    console.error('ensureClothTypes:', e.message);
  }
}
