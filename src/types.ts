export type Position = 'LW' | 'CV' | 'RW' | 'LM' | 'CM' | 'RM' | 'LBM' | 'CBM' | 'RBM' | 'K';

export interface Player {
  id: string;
  naam: string;
  positie: Position;
  inVeld: boolean;
  meedoen: boolean;
  inVolgorde?: number; // oplopend volgnummer van het moment waarop de speler het veld in kwam
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
  CV: 'centraal voor',
  RW: 'rechts voor',
  LM: 'links midden',
  CM: 'midden',
  RM: 'rechts midden',
  LBM: 'links achter',
  CBM: 'centraal achter',
  RBM: 'rechts achter',
  K: 'keeper',
};

// Van voor naar achter; ook de sorteervolgorde voor elke opstelling
export const VELD_VOLGORDE: Position[] = ['LW', 'CV', 'RW', 'LM', 'CM', 'RM', 'LBM', 'CBM', 'RBM'];

// Totaal aantal spelers incl. keeper
export type Spelvorm = 9 | 6;

export type OpstellingNaam = '2-3-3' | '3-3-2' | '3-2-3' | '2-1-2' | '2-2-1' | '1-2-2';

// Rijen van voor naar achter (keeper staat er altijd los onder)
export const OPSTELLINGEN: Record<OpstellingNaam, Position[][]> = {
  '2-3-3': [['LW', 'RW'], ['LM', 'CM', 'RM'], ['LBM', 'CBM', 'RBM']],
  '3-3-2': [['LW', 'CV', 'RW'], ['LM', 'CM', 'RM'], ['LBM', 'RBM']],
  '3-2-3': [['LW', 'CV', 'RW'], ['LM', 'RM'], ['LBM', 'CBM', 'RBM']],
  '2-1-2': [['LW', 'RW'], ['CM'], ['LBM', 'RBM']],
  '2-2-1': [['LW', 'RW'], ['LM', 'RM'], ['CBM']],
  '1-2-2': [['CV'], ['LM', 'RM'], ['LBM', 'RBM']],
};

// De eerste is de standaard bij die spelvorm
export const OPSTELLINGEN_PER_SPELVORM: Record<Spelvorm, OpstellingNaam[]> = {
  9: ['2-3-3', '3-3-2', '3-2-3'],
  6: ['2-1-2', '2-2-1', '1-2-2'],
};

export const spelvormVan = (opstelling: OpstellingNaam): Spelvorm =>
  OPSTELLINGEN_PER_SPELVORM[6].includes(opstelling) ? 6 : 9;

export const veldPosities = (opstelling: OpstellingNaam): Position[] => OPSTELLINGEN[opstelling].flat();
