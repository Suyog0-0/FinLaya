import {
  Home, ShoppingBag, Car, Film, Heart,
  PiggyBank, Zap, MoreHorizontal, Tag,
  Utensils, Wifi, Plane, Music, Book,
  Dumbbell, Coffee, Gift, Briefcase,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface Category {
  category_id: number;
  category_name: string;
  allocation_percentage: number;
  budget_limit: number;
  current_balance: number;
  spent: number;
}

// ─── Icon map ──────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  housing: Home, home: Home, rent: Home,
  food: Utensils, groceries: ShoppingBag, shopping: ShoppingBag,
  transport: Car, transportation: Car, commute: Car,
  travel: Plane,
  entertainment: Film, movies: Film,
  music: Music,
  health: Heart, medical: Heart,
  fitness: Dumbbell, gym: Dumbbell,
  savings: PiggyBank, saving: PiggyBank,
  utilities: Zap, bills: Zap,
  internet: Wifi, wifi: Wifi,
  education: Book, books: Book,
  coffee: Coffee, cafe: Coffee,
  gift: Gift, gifts: Gift,
  work: Briefcase, business: Briefcase,
  other: MoreHorizontal, others: MoreHorizontal, misc: MoreHorizontal,
};

const ICON_COLOR_MAP: Record<string, string> = {
  housing: 'text-orange-500 bg-orange-50', home: 'text-orange-500 bg-orange-50', rent: 'text-orange-500 bg-orange-50',
  food: 'text-yellow-500 bg-yellow-50', groceries: 'text-yellow-500 bg-yellow-50', shopping: 'text-yellow-500 bg-yellow-50',
  transport: 'text-amber-500 bg-amber-50', transportation: 'text-amber-500 bg-amber-50',
  travel: 'text-sky-500 bg-sky-50',
  entertainment: 'text-orange-500 bg-orange-50',
  music: 'text-purple-500 bg-purple-50',
  health: 'text-green-500 bg-green-50', medical: 'text-green-500 bg-green-50',
  fitness: 'text-teal-500 bg-teal-50', gym: 'text-teal-500 bg-teal-50',
  savings: 'text-orange-500 bg-orange-50', saving: 'text-orange-500 bg-orange-50',
  utilities: 'text-yellow-500 bg-yellow-50', bills: 'text-yellow-500 bg-yellow-50',
  internet: 'text-blue-500 bg-blue-50',
  education: 'text-indigo-500 bg-indigo-50',
  coffee: 'text-amber-600 bg-amber-50',
  gift: 'text-pink-500 bg-pink-50', gifts: 'text-pink-500 bg-pink-50',
  work: 'text-gray-600 bg-gray-100', business: 'text-gray-600 bg-gray-100',
  other: 'text-gray-400 bg-gray-100', others: 'text-gray-400 bg-gray-100',
};

export function getCategoryIcon(name: string): { Icon: React.ElementType; colorClass: string } {
  const key = name.toLowerCase().trim();
  if (ICON_MAP[key]) {
    return { Icon: ICON_MAP[key], colorClass: ICON_COLOR_MAP[key] || 'text-orange-500 bg-orange-50' };
  }
  for (const k of Object.keys(ICON_MAP)) {
    if (key.includes(k) || k.includes(key)) {
      return { Icon: ICON_MAP[k], colorClass: ICON_COLOR_MAP[k] || 'text-orange-500 bg-orange-50' };
    }
  }
  return { Icon: Tag, colorClass: 'text-orange-500 bg-orange-50' };
}

export function getBarColor(spent: number, budget: number): string {
  if (budget === 0) return 'bg-gray-300';
  const pct = (spent / budget) * 100;
  if (pct >= 100) return 'bg-red-500';
  if (pct >= 80) return 'bg-amber-500';
  return 'bg-gradient-to-r from-amber-400 to-orange-500';
}

export function formatNRs(n: number): string {
  return `NRs ${Math.round(n).toLocaleString('en-IN')}`;
}