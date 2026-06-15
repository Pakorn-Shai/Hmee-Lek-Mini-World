import { Color, Enum } from 'cc';

export enum PearlColor {
  Blue = 0,
  Pink = 1,
  Green = 2,
  Purple = 3,
  Gold = 4,
  Black = 5,
  Milk = 6,
}

Enum(PearlColor);

export const DEFAULT_ALLOWED_PEARL_COLORS = [
  PearlColor.Blue,
  PearlColor.Pink,
  PearlColor.Green,
  PearlColor.Purple,
  PearlColor.Gold,
];

const PEARL_COLOR_NAMES: Record<PearlColor, string> = {
  [PearlColor.Blue]: 'Blue',
  [PearlColor.Pink]: 'Pink',
  [PearlColor.Green]: 'Green',
  [PearlColor.Purple]: 'Purple',
  [PearlColor.Gold]: 'Gold',
  [PearlColor.Black]: 'Black',
  [PearlColor.Milk]: 'Milk',
};

const PEARL_COLOR_ASSET_NAMES: Record<PearlColor, string> = {
  [PearlColor.Blue]: 'pearl_blue',
  [PearlColor.Pink]: 'pearl_pink',
  [PearlColor.Green]: 'pearl_green',
  [PearlColor.Purple]: 'pearl_purple',
  [PearlColor.Gold]: 'pearl_gold',
  [PearlColor.Black]: 'pearl_black',
  [PearlColor.Milk]: 'pearl_milk',
};

const PEARL_FALLBACK_COLORS: Record<PearlColor, Color> = {
  [PearlColor.Blue]: new Color(83, 194, 255, 255),
  [PearlColor.Pink]: new Color(255, 139, 199, 255),
  [PearlColor.Green]: new Color(105, 221, 143, 255),
  [PearlColor.Purple]: new Color(168, 99, 255, 255),
  [PearlColor.Gold]: new Color(255, 206, 75, 255),
  [PearlColor.Black]: new Color(54, 45, 58, 255),
  [PearlColor.Milk]: new Color(255, 239, 204, 255),
};

export function getPearlColorName(color: PearlColor): string {
  return PEARL_COLOR_NAMES[color] ?? 'Unknown';
}

export function getPearlSpriteAssetName(color: PearlColor): string {
  return PEARL_COLOR_ASSET_NAMES[color] ?? PEARL_COLOR_ASSET_NAMES[PearlColor.Blue];
}

export function getPearlFallbackColor(color: PearlColor): Color {
  return PEARL_FALLBACK_COLORS[color] ?? PEARL_FALLBACK_COLORS[PearlColor.Blue];
}

export function normalizePearlColors(colors: PearlColor[] | null | undefined): PearlColor[] {
  const uniqueColors = [...new Set((colors ?? []).filter((color) => PEARL_COLOR_NAMES[color] !== undefined))];
  return uniqueColors.length > 0 ? uniqueColors : [...DEFAULT_ALLOWED_PEARL_COLORS];
}

export function pickRandomPearlColor(colors: PearlColor[]): PearlColor {
  const normalizedColors = normalizePearlColors(colors);
  return normalizedColors[Math.floor(Math.random() * normalizedColors.length)];
}
