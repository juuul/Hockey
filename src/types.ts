export type Position = 'LW' | 'RW' | 'LM' | 'CM' | 'RM' | 'LBM' | 'CBM' | 'RBM' | 'K';

export interface Player {
  id: string;
  naam: string;
  positie: Position;
  inVeld: boolean;
  meedoen: boolean;
  inSinds?: number; // speeltijd (ms op de wedstrijdtimer) waarop de speler het veld in kwam
  wisselCount: number;
  isKeeper: boolean;
}

export interface Wissel {
  id: string;
  tijdstip: Date;
  inSpeler: string;
  uitSpeler: string;
  positie: Position;
}

export const POSITIE_LABEL: Record<Position, string> = {
  LW: 'links voor',
  RW: 'rechts voor',
  LM: 'links midden',
  CM: 'midden',
  RM: 'rechts midden',
  LBM: 'links achter',
  CBM: 'centraal achter',
  RBM: 'rechts achter',
  K: 'keeper',
};

export const VELD_VOLGORDE: Position[] = ['LW', 'RW', 'LM', 'CM', 'RM', 'LBM', 'CBM', 'RBM'];
