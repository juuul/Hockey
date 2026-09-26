/// <reference path="../pb_data/types.d.ts" />

// De lopende wedstrijd per team (opstelling, wissels, score, timer…), live gedeeld.
// Eén record per team met dezelfde id als het team. Laatste schrijver wint; 'versie' en 'bron' (toestel) helpen de app
// om eigen wijzigingen te herkennen en oude over te slaan.
migrate((app) => {
  const teams = app.findCollectionByNameOrId("teams")
  const INGELOGD = '@request.auth.id != ""'
  const LID = `${INGELOGD} && (@request.auth.superadmin = true || team.beheerders.id ?= @request.auth.id || team.kijkers.id ?= @request.auth.id)`
  const BEHEER = `${INGELOGD} && (@request.auth.superadmin = true || team.beheerders.id ?= @request.auth.id)`
  app.save(new Collection({
    type: "base",
    name: "standen",
    fields: [
      { type: "relation", name: "team", collectionId: teams.id, maxSelect: 1, required: true, cascadeDelete: true },
      { type: "json", name: "stand", maxSize: 200000 },
      { type: "number", name: "versie", onlyInt: true },
      { type: "text", name: "bron", max: 40 },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_standen_team ON standen (team)"],
    listRule: LID,
    viewRule: LID,
    // Alleen de stand van je eigen team, met de team-id als record-id
    createRule: `${BEHEER} && id = team`,
    updateRule: `${BEHEER} && @request.body.team:isset = false`,
    deleteRule: BEHEER,
  }))
}, (app) => {
  app.delete(app.findCollectionByNameOrId("standen"))
})
