/// <reference path="../pb_data/types.d.ts" />

// Uitnodiging aanmaken: token en maker bepaalt de server, daarna gaat de mail eruit
onRecordCreateRequest((e) => {
  const h = require(`${__hooks}/hockey.js`)
  if (!h.TOEGESTAAN.includes(e.record.getString("terug"))) throw new BadRequestError("Onbekend terugadres")
  e.record.set("email", e.record.getString("email").trim().toLowerCase())
  e.record.set("token", $security.randomString(40))
  e.record.set("maker", e.auth ? e.auth.id : "")
  e.next()
  try {
    h.stuurUitnodiging(e.app, e.record)
  } catch (err) {
    e.app.delete(e.record)
    throw new BadRequestError("De uitnodiging kon niet worden gemaild: " + err)
  }
}, "uitnodigingen")

// Wat staat er in de uitnodiging (voor het welkomstscherm in de app)
routerAdd("GET", "/api/hockey/uitnodiging/{token}", (e) => {
  const h = require(`${__hooks}/hockey.js`)
  const inv = h.vindUitnodiging(e.app, e.request.pathValue("token"))
  const team = e.app.findRecordById("teams", inv.getString("team"))
  let bestaat = true
  try {
    e.app.findAuthRecordByEmail("users", inv.getString("email"))
  } catch (_) {
    bestaat = false
  }
  return e.json(200, { team: team.getString("naam"), email: inv.getString("email"), rol: inv.getString("rol"), bestaat })
})

// Uitnodiging aannemen: nieuw account (met wachtwoord) of bestaand account aan het team toevoegen.
// Wie de link heeft, heeft de mail ontvangen: daarmee is het e-mailadres bevestigd
routerAdd("POST", "/api/hockey/uitnodiging/{token}", (e) => {
  const h = require(`${__hooks}/hockey.js`)
  const body = e.requestInfo().body
  const inv = h.vindUitnodiging(e.app, e.request.pathValue("token"))
  const email = inv.getString("email")
  let bestaat = true

  e.app.runInTransaction((tx) => {
    let user
    try {
      user = tx.findAuthRecordByEmail("users", email)
    } catch (_) {
      bestaat = false
      const wachtwoord = String(body.wachtwoord || "")
      if (wachtwoord.length < 8) throw new BadRequestError("Kies een wachtwoord van minstens 8 tekens")
      user = new Record(tx.findCollectionByNameOrId("users"))
      user.setEmail(email)
      user.setPassword(wachtwoord)
      user.setVerified(true)
      // Beheerders van hetzelfde team moeten het adres zien; wie het verder ziet bepaalt de listRule
      user.set("emailVisibility", true)
      user.set("name", String(body.naam || "").trim().slice(0, 60))
      tx.save(user)
    }
    const team = tx.findRecordById("teams", inv.getString("team"))
    for (const veld of Object.values(h.ROL_VELD)) {
      team.set(veld, team.getStringSlice(veld).filter((id) => id !== user.id))
    }
    const veld = h.ROL_VELD[inv.getString("rol")]
    team.set(veld, [...team.getStringSlice(veld), user.id])
    tx.save(team)
    tx.delete(inv)
  })

  return e.json(200, { email, bestaat })
})
