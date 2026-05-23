import { PRODUCTS, Product, LifeStage, BreedSize } from './products';

export type Dog = {
  id: string;
  name: string;
  breed: string;
  ageYears: number;
  ageMonths: number;
  weightKg: number;
  activity: 'low' | 'medium' | 'high';
  allergies: string[];
};

export function getLifeStage(d: Dog): LifeStage {
  const totalMonths = d.ageYears * 12 + d.ageMonths;
  if (totalMonths < 12) return 'puppy';
  if (d.ageYears >= 7) return 'senior';
  return 'adult';
}

export function getBreedSize(d: Dog): BreedSize {
  if (d.weightKg < 10) return 'small';
  if (d.weightKg <= 25) return 'medium';
  return 'large';
}

export function recommendProducts(d: Dog): Product[] {
  const stage = getLifeStage(d);
  const size = getBreedSize(d);

  const scored = PRODUCTS.map(p => {
    let score = 0;
    if (p.lifeStage === stage) score += 3;
    if (p.breedSize === size) score += 2;
    if (d.activity === 'high' && p.highProtein) score += 1;
    if (d.activity === 'low' && p.weightControl) score += 1;
    if (d.allergies.some(a =>
      p.ingredients.map(i => i.toLowerCase()).includes(a.toLowerCase()) ||
      p.proteinSource.toLowerCase() === a.toLowerCase()
    )) score = -100;
    return { p, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.p);
}

// dailyGrams ≈ weight_kg × 25 (rough rule of thumb, not vet advice)
export function suggestFrequencyWeeks(d: Dog, bagSizeG: number): number {
  const dailyGrams = d.weightKg * 25;
  const days = bagSizeG / dailyGrams;
  const weeks = Math.floor(days / 7);
  const options = [2, 3, 4, 6, 8];
  let best = options[0];
  for (const opt of options) if (opt <= weeks) best = opt;
  return best;
}

export const BREEDS = [
  'Mixed Breed', 'Labrador Retriever', 'German Shepherd', 'Golden Retriever',
  'French Bulldog', 'Bulldog', 'Poodle', 'Beagle', 'Rottweiler', 'Dachshund',
  'Yorkshire Terrier', 'Boxer', 'Siberian Husky', 'Great Dane', 'Chihuahua',
  'Shih Tzu', 'Border Collie', 'Australian Shepherd', 'Cavalier King Charles',
  'Pug', 'Cocker Spaniel', 'Pomeranian', 'Boston Terrier', 'Mastiff',
  'Bernese Mountain Dog', 'Maltese', 'Shiba Inu', 'Jack Russell Terrier',
  'Doberman', 'Schnauzer',
];

export const ALLERGY_OPTIONS = [
  'chicken', 'beef', 'lamb', 'fish', 'salmon', 'turkey', 'duck',
  'grain', 'wheat', 'corn', 'soy', 'dairy',
];
