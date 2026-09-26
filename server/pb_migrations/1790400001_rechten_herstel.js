/// <reference path="../pb_data/types.d.ts" />

// Herstel: de eerste versie van 1790400000 draaide al op de server met regels die in PocketBase 0.40 niet werken
// ('relatie ?= x' i.p.v. 'relatie.id ?= x', en zonder 'ingelogd'-controle). Hier opnieuw de juiste regels.
migrate((app) => {
  const INGELOGD = '@request.auth.id != ""'
  const LID = "@request.auth.superadmin = true || beheerders.id ?= @request.auth.id || bewerkers.id ?= @request.auth.id || kijkers.id ?= @request.auth.id"

  const teams = app.findCollectionByNameOrId("teams")
  teams.listRule = `${INGELOGD} && (${LID})`
  teams.viewRule = `${INGELOGD} && (${LID})`
  teams.createRule = `${INGELOGD} && @request.auth.superadmin = true`
  teams.updateRule = `${INGELOGD} && (@request.auth.superadmin = true || (beheerders.id ?= @request.auth.id && @request.body.beheerders:isset = false))`
  teams.deleteRule = `${INGELOGD} && @request.auth.superadmin = true`
  app.save(teams)

  const uitnodigingen = app.findCollectionByNameOrId("uitnodigingen")
  const BEHEERDER = "@request.auth.superadmin = true || team.beheerders.id ?= @request.auth.id"
  uitnodigingen.listRule = `${INGELOGD} && (${BEHEERDER})`
  uitnodigingen.viewRule = `${INGELOGD} && (${BEHEERDER})`
  uitnodigingen.createRule = `${INGELOGD} && (@request.auth.superadmin = true || (team.beheerders.id ?= @request.auth.id && rol != 'beheerder'))`
  uitnodigingen.updateRule = null
  uitnodigingen.deleteRule = `${INGELOGD} && (${BEHEERDER})`
  app.save(uitnodigingen)

  const users = app.findCollectionByNameOrId("users")
  const zichtbaar = `${INGELOGD} && (id = @request.auth.id || @request.auth.superadmin = true || ` +
    "(@collection.teams:t.beheerders.id ?= @request.auth.id && (@collection.teams:t.beheerders.id ?= id || @collection.teams:t.bewerkers.id ?= id || @collection.teams:t.kijkers.id ?= id)))"
  users.listRule = zichtbaar
  users.viewRule = zichtbaar
  users.createRule = null
  users.updateRule = "id = @request.auth.id && @request.body.superadmin:isset = false"
  users.deleteRule = "id = @request.auth.id"
  app.save(users)
}, (app) => {})
