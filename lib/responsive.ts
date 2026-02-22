import { Dimensions } from 'react-native';

// Baseline: iPhone 14 (l'appareil sur lequel l'app a été designée)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Scale proportionnel à la largeur d'écran.
 * iPhone 14 (393px) → retourne la valeur exacte
 * iPhone SE (375px) → retourne ~95%
 * iPhone 15 Pro Max (430px) → retourne ~109%
 */
export function scale(size: number): number {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
}

/**
 * Scale proportionnel à la hauteur d'écran.
 */
export function verticalScale(size: number): number {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
}

/**
 * Scaling modéré — entre fixe et proportionnel.
 * factor=0 → pas de scaling, factor=1 → scaling complet.
 * Default 0.5 → bon compromis pour les font sizes.
 */
export function moderateScale(size: number, factor: number = 0.5): number {
  return size + (scale(size) - size) * factor;
}

export { SCREEN_WIDTH, SCREEN_HEIGHT };
