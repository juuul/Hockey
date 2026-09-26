/// <reference path="../pb_data/types.d.ts" />

// Bewerker en beheerder samengevoegd: er zijn nu alleen beheerders (alles in hun team, ook beheerders aanwijzen) en kijkers.
migrate((app) => {
  for (const team of app.findAllRecords("teams")) {
    const beheerders = team.getStringSlice("beheerders")
    const erbij = team.getStringSlice("bewerkers").filter((id) => !beheerders.includes(id))
    if (erbij.length) {
      team.set("beheerders", [...beheerders, ...erbij])
      app.save(team)
    }
  }
  for (const inv of app.findRecordsByFilter("uitnodigingen", "rol = 'bewerker'")) {
    inv.set("rol", "beheerder")
    app.save(inv)
  }

  const INGELOGD = '@request.auth.id != ""'
  const teams = app.findCollectionByNameOrId("teams")
  teams.fields.removeByName("bewerkers")
  teams.listRule = `${INGELOGD} && (@request.auth.superadmin = true || beheerders.id ?= @request.auth.id || kijkers.id ?= @request.auth.id)`
  teams.viewRule = teams.listRule
  teams.createRule = `${INGELOGD} && @request.auth.superadmin = true`
  teams.updateRule = `${INGELOGD} && (@request.auth.superadmin = true || beheerders.id ?= @request.auth.id)`
  teams.deleteRule = `${INGELOGD} && @request.auth.superadmin = true`
  app.save(teams)

  const uitnodigingen = app.findCollectionByNameOrId("uitnodigingen")
  const rol = uitnodigingen.fields.getByName("rol")
  rol.values = ["beheerder", "kijker"]
  const BEHEERDER = `${INGELOGD} && (@request.auth.superadmin = true || team.beheerders.id ?= @request.auth.id)`
  uitnodigingen.listRule = BEHEERDER
  uitnodigingen.viewRule = BEHEERDER
  uitnodigingen.createRule = BEHEERDER
  uitnodigingen.deleteRule = BEHEERDER
  app.save(uitnodigingen)

  const users = app.findCollectionByNameOrId("users")
  // Via de teams van de bekeken gebruiker: zit ik als beheerder in een team waar hij beheerder of kijker is?
  // (Twee keer '@collection.teams:t.beheerders' vergelijkt binnen dezelfde rij, en dan zie je andere beheerders niet.)
  users.listRule = `${INGELOGD} && (id = @request.auth.id || @request.auth.superadmin = true || ` +
    "teams_via_beheerders.beheerders.id ?= @request.auth.id || teams_via_kijkers.beheerders.id ?= @request.auth.id)"
  users.viewRule = users.listRule
  app.save(users)
}, (app) => {})
