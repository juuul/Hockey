# Hockey Wissel-app

Web-app om langs het veld (op een telefoon) de opstelling, wissels, score en tijd bij te houden voor een meidenteam. De wedstrijddata staat (nog) per toestel in localStorage; accounts, teams en rollen staan op een eigen PocketBase-server (zie **Server**).

- Live: https://juliaan.eu/hockey/ (branch `main`)
- Test: https://juliaan.eu/hockey/test/ (branch `test`)
- Repo: github.com/juuul/hockey

## Werkwijze (belangrijk)
- Werk op branch `test`. Elke wijziging: typecheck (`npx tsc --noEmit -p .`), commit, push naar `test`, wacht op de deploy en controleer de test-URL.
- Naar `main` (live) alleen als de gebruiker dat expliciet zegt ("zet live", "zet maar door", "naar main"). Dan `git merge --ff-only test` op `main` en pushen.
- De gebruiker is Nederlandstalig en test op de telefoon; antwoord in het Nederlands, kort.
- Browser/touch kan hier niet getest worden: zeg dat eerlijk en laat de gebruiker het op de telefoon checken.
- Logica testen op de echte code: schrijf een klein script in de scratchpad dat `src/opstelling.ts` importeert, bundel met `node_modules/.bin/esbuild <script> --bundle --platform=node` en draai het met node.

## Functionaliteit

### Tabbladen
1. **Dashboard**
   - Bovenaan de scoreregel: `[−] [Wij n] [Zij n] [−]`. Tik op **Wij** opent "Wie scoorde?" (veld van voor naar achter, dan keeper, dan wissels, of "Weet ik niet"). **Zij** telt direct +1. `−` haalt het laatste doelpunt (en bij Wij de scorer) weg.
   - Veld met de opstelling en de keeper eronder. Tik op een speler: **Wissel** (met wisselspeler) of **Verplaatsen** (ruilen met veldspeler of wisselspeler). Keeper: alleen verplaatsen. Lege plek (gestippeld, "+"): tik om iemand erin te zetten.
   - Eén regel wisselspelers in beeld (2 naast elkaar), zonder kopje. Meer wissels staan onder de vouw.
   - **Onder de vouw** (alleen bereikbaar door te scrollen, bewust uit het zicht): extra wissels, wedstrijdkaart (tegenstander, thuis/uit, datum; tik om te wijzigen), **Wedstrijd afsluiten**, overzicht doelpunten, knoppen **Alles resetten**, Undo, Nieuwe opstelling, Reset wissels, Score 0 – 0, en de **Timer** (Start/Pauze/Stop).
2. **Spelers**: bovenaan de knop 👤 Inloggen/account (opent het accountscherm); spelvorm (9 of 6 spelers) en opstelling kiezen; lijst van alle spelers met schakelaar "Doet mee / Doet niet mee", doelpunten per speler (⚽ n), speler toevoegen/verwijderen. Geen veld/bank-info hier.
3. **Voorkeur**: per speler een 1e en 2e voorkeurspositie (alleen posities van de huidige opstelling). Dubbele voorkeuren mogen.
4. **Historie**: balans (gespeeld/gewonnen/gelijk/verloren, doelpunten), topscorers over alle wedstrijden, lijst wedstrijden (tik: details, wijzigen, verwijderen), tegenstanders met resultaat (tik: hernoemen/verwijderen).

Tabbladen tonen een icoon; alleen het actieve tabblad toont ook zijn naam (vier namen passen niet op 360px).

### Regels
- **Wisselteller** gaat +1 bij de speler die **uit** het veld gaat (alleen bij Wissel, niet bij Verplaatsen). De invaller neemt de positie over.
- **Wisselspelers sorteren**: minste wissels eerst; bij gelijke stand komt wie het laatst uit het veld ging onderaan. Zelfde volgorde in de wissel-pop-up.
- **Kleuren in het veld** (alleen informatief, blokkeert niets), op volgorde van invallen (`inVolgorde`), niet op tijd: bij 9 spelers de laatste 2 invallers rood, 2 daarvoor oranje, de rest (ook de basis) groen; bij 6 spelers 1 rood, 1 oranje. Keeper geen kleur.
- **Nieuwe opstelling**: eerst eerlijk loten wie begint (iedereen gelijke kans op de bank), dan per basisspeler de 1e voorkeur, daarna de 2e (beide in gelote volgorde, bij dubbele keuze wint een willekeurige), rest willekeurig. Tellers blijven staan; `inVolgorde` terug naar 0.
- **Reset wissels**: alleen tellers — veldspelers 0, wisselspelers 1 (die staan al één keer "uit"). Opstelling en score blijven.
- **Alles resetten**: nieuwe opstelling + reset wissels + score 0-0 en scorers weg + timer 0:00 gestopt. Spelers, aanwezigheid, voorkeuren en gekozen opstelling blijven.
- **Afmelden** van een veldspeler: wisselspeler met de minste wissels neemt de plek over (teller ongewijzigd). Keeper afmelden laat het doel leeg. Aanmelden: naar een lege veldplek als die er is, anders de bank. Afgemelden doen niet mee in opstelling, wissels of loting.
- **Andere opstelling kiezen**: wie op een positie staat die ook in de nieuwe opstelling zit blijft staan; spelers van weggevallen posities schuiven naar vrije plekken; te veel → bank, te weinig → aanvullen met minste wissels. Tellers blijven.
- **Wedstrijd afsluiten**: tegenstander verplicht. Bewaart datum, club, thuis/uit, score, scorers (id + naam), wie meedeed (met wissels) en opstelling in `wedstrijden`; daarna hetzelfde als Alles resetten en de undo-geschiedenis wordt gewist (afsluiten is niet terug te draaien). Datum `null` = vandaag.
- **Clubs** worden automatisch onthouden zodra je er een kiest/typt en opslaat (pas bij Opslaan, niet bij Annuleren); keuzelijst laatst gebruikt bovenaan, dubbele namen (hoofdletterongevoelig) worden hergebruikt. Club verwijderen haalt hem alleen uit de keuzelijst; oude wedstrijden houden hun opgeslagen naam.
- **Undo** draait spelers, wissels, score en scorers terug (niet de timer).
- **Timer** bewaart starttijdstip + opgebouwde tijd, zodat hij klopt na verversen of een vergrendeld scherm. Stop vraagt bevestiging.
- **Trek omlaag om te verversen** (eigen implementatie, `Verversen.tsx`): nodig omdat html/body niet scrollen (alleen `.content`). Rond draaiend icoon, niet in pop-ups.
- Geen meldingen (toasts) na een bevestiging. Bevestigingsvragen alleen bij resets en timer-stop.

### Opstellingen
Posities (van voor naar achter): `LW` links voor, `CV` centraal voor, `RW` rechts voor, `LM` links midden, `CM` midden, `RM` rechts midden, `LBM` links achter, `CBM` centraal achter, `RBM` rechts achter, `K` keeper. Codes nooit in de UI tonen, alleen de Nederlandse labels (`POSITIE_LABEL`).

| Spelvorm | Opstellingen (eerste = standaard) |
|---|---|
| 9 spelers (8 + keeper) | 2-3-3, 3-3-2, 3-2-3 |
| 6 spelers (5 + keeper) | 2-1-2, 2-2-1, 1-2-2 |

Gedefinieerd in `OPSTELLINGEN` / `OPSTELLINGEN_PER_SPELVORM` in `src/types.ts`.

### Team
Keeper: Julia Arnold. Veld: Lizzy Best, Fee Daan, Sarah Eerdmans, Isa Flierman, Evi Kruft, Aster Meijboom, Floor Oreel, Carice Plantinga, Sara van Tetering, Benthe van der Wijk. (Rosalie de Kroon traint mee, niet in het team.) De app gebruikt voornamen; de startlijst staat in `INITIAL_PLAYERS` in de context.

### Accounts (accountscherm, `src/screens/Account.tsx`)
- Inloggen met e-mail + wachtwoord; **Wachtwoord vergeten** mailt een link `#wachtwoord=<token>` naar de app. Vrij aanmelden kan niet: alleen via een uitnodiging (`#uitnodiging=<token>`, 7 dagen geldig, eenmalig).
- Rollen per team: **beheerder** (alles in het team, behalve beheerders aanwijzen), **bewerker**, **kijker**. **Superadmin** (alleen de eigenaar; vlag `superadmin` op de gebruiker, alleen via het PocketBase-beheerscherm) maakt teams en wijst beheerders aan.
- De app leest links uit de mail uit `location.hash` en haalt het `#` daarna weg.

## Mobiel ontwerp (verplicht)
Bediend op een telefoon van ~10 cm diagonaal (~360px breed):
- **Minimale lettergrootte 22px** via `--base-readable-size` in `src/index.css` (nu 24px); nergens kleiner.
- **Aanraakdoelen minimaal 60px hoog.**
- **Schermvullend** (`100dvh`), geen vaste breedtes/hoogtes. Het dashboard vult precies het scherm; alles wat niet vaak nodig is staat onder de vouw.
- **Veld schaalt mee** via container units (`cqw`/`cqh`). Spelers zijn **rondjes** (gebruiker koos tegen ovalen); ze worden alleen breder als een naam niet past.
- **Pop-ups**: gecentreerd, grote tekst en knoppen.
- Test op een smal, laag scherm (360×640).

## Techniek
- React + TypeScript, Vite, gewone CSS per scherm/component (geen Tailwind), state in React Context (`src/context/HockeyContext.tsx`) + localStorage.
- Dev server: `npm run dev` op poort 5173 (`host: true`), bereikbaar via http://192.168.2.50:5173/ (poort 8765 is bezet).
- `src/opstelling.ts`: pure functies (loting, tellers, afmelden, plaatsen, opstelling aanpassen, kleuren, sorteren) — hier logica toevoegen en testen.
- `src/historie.ts`: pure functies voor wedstrijden/clubs (balans, topscorers, per tegenstander, zoeken, datum).
- `src/statistiek.ts`: GoatCounter (`juuul.goatcounter.com`); `tel('knop')` telt klikken, alleen in de gepubliceerde build, op test met voorvoegsel `test/`.

### Datamodel (`src/types.ts`)
```typescript
interface Player {
  id: string; naam: string; positie: Position;
  inVeld: boolean;      // staat in het veld (anders bank)
  meedoen: boolean;     // aanwezig vandaag
  inVolgorde?: number;  // volgnummer van invallen (voor de kleuren)
  wisselCount: number; isKeeper: boolean;
}
interface Wissel { id: string; tijdstip: Date; inSpeler: string; uitSpeler: string; positie: Position }
```

### Opslag (localStorage)
Sleutels `hockey_<naam>` op live en `hockey_test_<naam>` op test (zelfde domein, dus gescheiden): `spelers`, `wisselingen`, `vaste_posities` (per speler `[1e, 2e]`), `score`, `doelpunten` (scorer-id's of null), `opstelling`, `timer`, `clubs`, `wedstrijd` (lopende: datum/clubId/thuis), `wedstrijden` (afgesloten, zie `GespeeldeWedstrijd`). Bij nieuwe velden altijd migreren vanuit oude opgeslagen data (zie bestaande voorbeelden in de context). Opslag is per toestel/browser: andere telefoons zien andere data.

## Server (PocketBase)
- Map `server/`: `Dockerfile` + `docker-compose.yml` (container `hockey-pocketbase`, alleen `127.0.0.1:8090`), `pb_migrations/` (collecties + rechten), `pb_hooks/` (uitnodigingen mailen/aannemen). Data in `server/pb_data/` (niet in git).
- Openbaar alleen `/api` via **Tailscale Funnel** (adres in `src/server.ts`, overschrijfbaar met `VITE_SERVER`). Beheerscherm `/_/` alleen via tailnet (poort 8443) of een SSH-tunnel naar `127.0.0.1:8090`.
- Mail via Gmail SMTP met een app-wachtwoord; ingesteld in het beheerscherm, niet in git.
- **De repo is openbaar**: geen e-mailadressen, wachtwoorden, tokens of andere persoonlijke gegevens committen.
- **Rechten worden op de server afgedwongen** (collection rules). In PocketBase 0.40: relaties vergelijken met `veld.id ?= …` (niet `veld ?= …`), en elke regel begint met `@request.auth.id != ""` (anders telt een lege relatie als match voor bezoekers).
- Wijzigingen aan migraties/hooks eerst testen op een losse container met eigen datamap in de scratchpad (poort 8099, nep-SMTP), nooit op de echte data. De echte container herstarten (`docker restart hockey-pocketbase`) doet de gebruiker.
- Test en live gebruiken voorlopig dezelfde server; `appURL` staat op de test-URL.

## Deploy
- GitHub Actions (`.github/workflows/deploy.yml`) bouwt bij elke push naar `main` of `test` **beide** branches en publiceert ze samen als één Pages-site: `main` in de root, `test` in `/test/` (test met `vite build --mode test`).
- Asset-paden zijn relatief (`base: './'`), dus de build werkt op elk pad/domein.
- Domein `juliaan.eu` hoort bij de repo `juuul/juuul.github.io` (startpagina met knoppen naar /hockey/ en financeplannerapp.com, lokaal in `/home/metime/projects/juuul.github.io`); deze repo verschijnt daardoor op `/hockey/`. Paden zijn hoofdlettergevoelig: repo heet `hockey`.
- DNS bij zxcs/Vimexx (A + AAAA naar GitHub Pages). De lokale resolver op deze machine cachet soms nog een oud parkeeradres; controleer live dan met `curl --resolve juliaan.eu:443:185.199.108.153 ...`.
- GitHub Pages cachet pagina's tot 10 minuten; de gebruiker ververst door de pagina omlaag te trekken.
