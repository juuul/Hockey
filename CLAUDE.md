# Hockey Substitutie App - Technische Documentatie

## Project Overzicht
Een web-app voor het beheren van hockey-spelers en hun substitutie-historiek. Track wie er op het veld staat, wie beschikbaar is om in te wisselen, en hoe vaak elke speler gewisseld is.

## Kern Functioneel Vereisten
- **Speelerstelling weergeven**: Live weergave van spelers op veld met hun positie
- **Spelersbeheer**: Spelers activeren/deactiveren (in/uit beschikbaarheid)
- **Wisselronde**: Click "Wissel" → selecteer spelers om in te brengen → automatisch bij 1 optie
- **Wisselhistoriek**: Track hoeveel keer elke speler gewisseld is (de teller gaat +1 bij de speler die **uit** het veld gaat; de invaller neemt diens positie over)
- **Sortering**: Spelers die nog niet gewisseld zijn → bovenaan

## Opstelling: 2-3-3 Formatie
| Positie | Code | Substitutie-eligible |
|---------|------|----------------------|
| Links Wing | LW | Ja |
| Rechts Wing | RW | Ja |
| Links Midden | LM | Ja |
| Centraal Midden | CM | Ja |
| Rechts Midden | RM | Ja |
| Links Back Midden | LBM | Ja |
| Centraal Back Midden | CBM | Ja |
| Rechts Back Midden | RBM | Ja |
| Keeper | K | Nee |

## Speelsters
**Team "Wedstrijd"** (12 speelsters totaal)

| # | Naam | Positie |
|----|------|---------|
| 1 | Julia Arnold | Keeper |
| 2 | Lizzy Best | Veld |
| 3 | Fee Daan | Veld |
| 4 | Sarah Eerdmans | Veld |
| 5 | Isa Flierman | Veld |
| 6 | Evi Kruft | Veld |
| 7 | Aster Meijboom | Veld |
| 8 | Floor Oreel | Veld |
| 9 | Carice Plantinga | Veld |
| 10 | Sara van Tetering | Veld |
| 11 | Benthe van der Wijk | Veld |

*Rosalie de Kroon = Trainings slid (niet in team)*

## Technische Keuzes

### Frontend
- **Framework**: React (TypeScript)
- **Styling**: gewone CSS per scherm/component (geen Tailwind)
- **State Management**: React Context API + localStorage
- **Build**: Vite (dev server op poort 5173, `host: true`; te openen via http://192.168.2.50:5173/ — poort 8765 is bezet)

**Waarom?** Snel te prototypen, goed voor real-time UI updates, makkelijk lokaal te testen zonder backend.

## Mobiel ontwerp (verplicht)
De app wordt langs het veld bediend op een **telefoon van ~10 cm diagonaal (~360px breed)**. Elke UI-wijziging moet hieraan voldoen:

- **Minimale lettergrootte 22px** voor alle tekst — even groot als de namen in de spelerbollen. Kleiner is onleesbaar.
- **Aanraakdoelen minimaal 60px hoog** (knoppen, lijstitems, opties).
- **Schermvullend**: geen vaste breedtes/hoogtes; de app vult het scherm (`100dvh`), zonder witte ruimte eronder of opzij.
- **Eén lettergrootte-variabele**: `--base-readable-size` in `src/index.css` is de minimale lettergrootte voor alle tekst; aanpassen op die ene plek.
- **Veld schaalt mee**: het veld vult de resterende hoogte; bolgrootte volgt uit het veld via container units (`cqw`/`cqh`). Bollen mogen ovaal worden: de naam moet er altijd in passen.
- **Wissels-sectie**: maximaal 25% van de schermhoogte (scrollt als er meer wisselspelers zijn).
- **Pop-ups**: gecentreerd, minimaal de helft van de schermhoogte, grote tekst (≥ 24px) en grote knoppen.
- Op desktop blijft de inhoud gecentreerd met een max-breedte, zodat het niet uitwaaiert.
- Test altijd eerst op een smal, laag scherm (360×640) voordat een wijziging klaar is.

### Data Model
```typescript
interface Speler {
  id: string;
  naam: string;
  positie: Positie;
  inVeld: boolean;
  wisselCount: number;
  isKeeper: boolean;
}

interface Wedstrijd {
  spelers: Speler[];
  wissel: Wissel[];
}

interface Wissel {
  tijdstip: Date;
  inSpeler: Speler['id'];
  uitSpeler: Speler['id'];
}
```

### Opslag
- **localStorage** voor demo/training (geen backend nodig)
- Makkelijk uit te breiden naar database later

## Ontwikkelings Stappen

### Fase 1: Setup & Data Model ✓ (Planning)
- [ ] React + TypeScript project initialiseren
- [ ] Tailwind CSS opzetten
- [ ] Data context + hooks definiëren
- [ ] Mock data laden (5-10 spelers)

### Fase 2: Speelerstelling View
- [ ] "Veld" layout met posities
- [ ] Huidige speler per positie weergeven
- [ ] Beschikbare wisselspelers tonen
- [ ] Speler enable/disable toggle

### Fase 3: Wisselronde
- [ ] "Wissel" button per positie (niet voor keeper)
- [ ] Wisselspelers selectie modal/dropdown
- [ ] Swap uitvoeren + historiek updaten
- [ ] Wissel verving + animations

### Fase 4: Historiek & Analytics
- [ ] Wisselcount per speler
- [ ] Sortering (niet gewisseld eerst)
- [ ] Statiteken weergave
- [ ] Export wisselhistorie (CSV)

## Schermstructuur

### Scherm 1: Hoofd Dashboard
- Veld met huidige opstelling (7 posities + keeper)
- Beschikbare wisselspelers lijst (links)
- Werktuigen (undo, reset, export)

### Scherm 2: Spelers Beheer
- Volledige speelerslijst
- Enable/disable toggle per speler
- Wisselhistorie per speler

## Volgende Stap
Review UI mockup → wijzigingen aanpassen → code starten!

## Deploy
- `test` → https://juliaan.eu/hockey/test/ — elke wijziging wordt hier direct naartoe gepusht.
- `main` → https://juliaan.eu/hockey/ (live) — alleen mergen/pushen als de gebruiker dat expliciet zegt.
- De workflow bouwt altijd beide branches samen tot één Pages-site. Test gebruikt eigen localStorage-sleutels (`hockey_test_*`).
- Asset-paden zijn relatief (`base: './'`), zodat de build op elk pad/domein werkt.
