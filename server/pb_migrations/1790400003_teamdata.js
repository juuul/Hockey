/// <reference path="../pb_data/types.d.ts" />

// Gegevens per team: spelers (naam + voorkeuren), clubs (tegenstanders) en afgesloten wedstrijden.
// Leden lezen, beheerders (en de superadmin) schrijven. De app maakt de id's zelf (15 tekens a-z0-9) zodat hij offline kan werken.
migrate((app) => {
  const teams = app.findCollectionByNameOrId("teams")
  const INGELOGD = '@request.auth.id != ""'
  const LID = `${INGELOGD} && (@request.auth.superadmin = true || team.beheerders.id ?= @request.auth.id || team.kijkers.id ?= @request.auth.id)`
  const BEHEER = `${INGELOGD} && (@request.auth.superadmin = true || team.beheerders.id ?= @request.auth.id)`
  const regels = {
    listRule: LID,
    viewRule: LID,
    createRule: BEHEER,
    // Een record kan niet naar een ander team verhuizen
    updateRule: `${BEHEER} && @request.body.team:isset = false`,
    deleteRule: BEHEER,
  }
  const basis = [
    { type: "relation", name: "team", collectionId: teams.id, maxSelect: 1, required: true, cascadeDelete: true },
  ]
  const tijden = [
    { type: "autodate", name: "created", onCreate: true },
    { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
  ]

  app.save(new Collection({
    type: "base",
    name: "spelers",
    fields: [
      ...basis,
      { type: "text", name: "naam", required: true, max: 40 },
      { type: "text", name: "voorkeur1", max: 5 },
      { type: "text", name: "voorkeur2", max: 5 },
      ...tijden,
    ],
    indexes: ["CREATE INDEX idx_spelers_team ON spelers (team)"],
    ...regels,
  }))

  app.save(new Collection({
    type: "base",
    name: "clubs",
    fields: [
      ...basis,
      { type: "text", name: "naam", required: true, max: 60 },
      { type: "number", name: "laatstGebruikt" },
      ...tijden,
    ],
    indexes: ["CREATE INDEX idx_clubs_team ON clubs (team)"],
    ...regels,
  }))

  app.save(new Collection({
    type: "base",
    name: "wedstrijden",
    fields: [
      ...basis,
      { type: "text", name: "datum", required: true, pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      { type: "text", name: "clubId", max: 40 },
      { type: "text", name: "tegenstander", max: 60 },
      { type: "bool", name: "thuis" },
      { type: "number", name: "wij", min: 0, onlyInt: true },
      { type: "number", name: "zij", min: 0, onlyInt: true },
      { type: "json", name: "doelpunten", maxSize: 20000 },
      { type: "json", name: "spelers", maxSize: 20000 },
      { type: "text", name: "opstelling", max: 10 },
      { type: "number", name: "opgeslagenOp" },
      ...tijden,
    ],
    indexes: ["CREATE INDEX idx_wedstrijden_team ON wedstrijden (team)"],
    ...regels,
  }))
}, (app) => {
  for (const naam of ["wedstrijden", "clubs", "spelers"]) app.delete(app.findCollectionByNameOrId(naam))
})
