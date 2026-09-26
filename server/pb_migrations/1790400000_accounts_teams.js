/// <reference path="../pb_data/types.d.ts" />

// Accounts, teams en rollen. Rechten worden hier op de server afgedwongen, niet in de app.
// Rollen staan als lijsten op het team (beheerders/bewerkers/kijkers); superadmin is een vlag op de gebruiker
// die alleen via het beheerscherm aan te zetten is.
// Elke regel begint met 'ingelogd': een lege relatie telt anders als gelijk aan de lege id van een bezoeker.
// Relaties vergelijken via '.id ?=' (een directe 'relatie ?= x' werkte niet in PocketBase 0.40).
migrate((app) => {
  const users = app.findCollectionByNameOrId("users")

  const teams = new Collection({
    type: "base",
    name: "teams",
    fields: [
      { type: "text", name: "naam", required: true, max: 60 },
      { type: "relation", name: "beheerders", collectionId: users.id, maxSelect: 999 },
      { type: "relation", name: "bewerkers", collectionId: users.id, maxSelect: 999 },
      { type: "relation", name: "kijkers", collectionId: users.id, maxSelect: 999 },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    listRule: "@request.auth.id != \"\" && (@request.auth.superadmin = true || beheerders.id ?= @request.auth.id || bewerkers.id ?= @request.auth.id || kijkers.id ?= @request.auth.id)",
    viewRule: "@request.auth.id != \"\" && (@request.auth.superadmin = true || beheerders.id ?= @request.auth.id || bewerkers.id ?= @request.auth.id || kijkers.id ?= @request.auth.id)",
    createRule: "@request.auth.id != \"\" && (@request.auth.superadmin = true)",
    // Een beheerder regelt alles in zijn team, behalve wie er beheerder is
    updateRule: "@request.auth.id != \"\" && (@request.auth.superadmin = true || (beheerders.id ?= @request.auth.id && @request.body.beheerders:isset = false))",
    deleteRule: "@request.auth.id != \"\" && (@request.auth.superadmin = true)",
  })
  app.save(teams)

  const uitnodigingen = new Collection({
    type: "base",
    name: "uitnodigingen",
    fields: [
      { type: "relation", name: "team", collectionId: teams.id, maxSelect: 1, required: true, cascadeDelete: true },
      { type: "email", name: "email", required: true },
      { type: "select", name: "rol", values: ["beheerder", "bewerker", "kijker"], maxSelect: 1, required: true },
      { type: "text", name: "token", hidden: true },
      { type: "relation", name: "maker", collectionId: users.id, maxSelect: 1 },
      { type: "text", name: "terug", required: true, max: 200 },
      { type: "autodate", name: "created", onCreate: true },
    ],
    listRule: "@request.auth.id != \"\" && (@request.auth.superadmin = true || team.beheerders.id ?= @request.auth.id)",
    viewRule: "@request.auth.id != \"\" && (@request.auth.superadmin = true || team.beheerders.id ?= @request.auth.id)",
    // Beheerders nodigen bewerkers en kijkers uit; alleen de superadmin maakt beheerders
    createRule: "@request.auth.id != \"\" && (@request.auth.superadmin = true || (team.beheerders.id ?= @request.auth.id && rol != 'beheerder'))",
    updateRule: null,
    deleteRule: "@request.auth.id != \"\" && (@request.auth.superadmin = true || team.beheerders.id ?= @request.auth.id)",
  })
  app.save(uitnodigingen)

  users.fields.add(new BoolField({ name: "superadmin" }))
  const zichtbaar = "@request.auth.id != \"\" && (id = @request.auth.id || @request.auth.superadmin = true || " +
    "(@collection.teams:t.beheerders.id ?= @request.auth.id && (@collection.teams:t.beheerders.id ?= id || @collection.teams:t.bewerkers.id ?= id || @collection.teams:t.kijkers.id ?= id)))"
  users.listRule = zichtbaar
  users.viewRule = zichtbaar
  users.createRule = null // alleen via een uitnodiging
  users.updateRule = "id = @request.auth.id && @request.body.superadmin:isset = false"
  users.deleteRule = "id = @request.auth.id"
  users.resetPasswordTemplate.subject = "Nieuw wachtwoord voor de Hockey Wissel-app"
  users.resetPasswordTemplate.body =
    "<p>Hallo,</p><p>Klik op de link om een nieuw wachtwoord te kiezen:</p>" +
    "<p><a href=\"{APP_URL}#wachtwoord={TOKEN}\">Nieuw wachtwoord kiezen</a></p>" +
    "<p>Heb je dit niet aangevraagd? Dan kun je deze mail negeren.</p>"
  app.save(users)

  const settings = app.settings()
  settings.meta.appName = "Hockey Wissel-app"
  settings.meta.appURL = "https://juliaan.eu/hockey/test/"
  app.save(settings)
}, (app) => {
  const users = app.findCollectionByNameOrId("users")
  users.fields.removeByName("superadmin")
  users.listRule = "id = @request.auth.id"
  users.viewRule = "id = @request.auth.id"
  users.createRule = ""
  users.updateRule = "id = @request.auth.id"
  users.deleteRule = "id = @request.auth.id"
  app.save(users)
  app.delete(app.findCollectionByNameOrId("uitnodigingen"))
  app.delete(app.findCollectionByNameOrId("teams"))
})
