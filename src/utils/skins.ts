import { CardSkin, Suit } from '../types';

export interface SkinConfig {
  displayName: string;
  faceBackground: string;
  backGradient: string[];
  labelColor: string;
  borderColor: string;
  accentColor: string;
  textShadow: string;
  suitColor: (suit: Suit) => string;
}

const skinConfigs: Record<CardSkin, SkinConfig> = {
  [CardSkin.Classic]: {
    displayName: 'Classic',
    faceBackground: '#ffffff',
    backGradient: ['#2b86de', '#74c0fc'],
    labelColor: '#000000',
    borderColor: 'rgba(128, 128, 128, 0.4)',
    accentColor: '#0066cc',
    textShadow: 'rgba(0, 0, 0, 0.15)',
    suitColor: (suit: Suit) => (suit === Suit.Hearts || suit === Suit.Diamonds ? '#ff0000' : '#000000'),
  },
  [CardSkin.Neon]: {
    displayName: 'Neon',
    faceBackground: '#0d0a14',
    backGradient: ['#260059', '#00cc88'],
    labelColor: '#ffffff',
    borderColor: '#4dffcc',
    accentColor: '#00ff99',
    textShadow: 'rgba(255, 255, 255, 0.35)',
    suitColor: (suit: Suit) =>
      suit === Suit.Hearts || suit === Suit.Diamonds ? '#ff73d0' : '#ffffff',
  },
  [CardSkin.Midnight]: {
    displayName: 'Midnight',
    faceBackground: '#0f1429',
    backGradient: ['#0d1640', '#1564b8'],
    labelColor: '#ffffff',
    borderColor: '#5a95ff',
    accentColor: '#00d9ff',
    textShadow: 'rgba(255, 255, 255, 0.35)',
    suitColor: (suit: Suit) =>
      suit === Suit.Hearts || suit === Suit.Diamonds ? '#ff8eb3' : '#ffffff',
  },
  [CardSkin.Pastel]: {
    displayName: 'Pastel',
    faceBackground: '#fdf0d1',
    backGradient: ['#ffd8ea', '#cafcff'],
    labelColor: '#000000',
    borderColor: 'rgba(201, 178, 210, 0.82)',
    accentColor: '#ff69b4',
    textShadow: 'rgba(0, 0, 0, 0.15)',
    suitColor: (suit: Suit) => (suit === Suit.Hearts || suit === Suit.Diamonds ? '#ff0000' : '#000000'),
  },
};

export function getSkinConfig(skin: CardSkin): SkinConfig {
  return skinConfigs[skin];
}
