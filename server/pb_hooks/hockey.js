// Gedeelde functies voor de hooks (handlers draaien los van elkaar, dus alles via require)

const ROL_VELD = { beheerder: "beheerders", kijker: "kijkers" }

// Alleen links terug naar onze eigen app
const TOEGESTAAN = [
  "https://juliaan.eu/hockey/",
  "https://juliaan.eu/hockey/test/",
  "http://192.168.2.50:5173/",
  "http://localhost:5173/",
]

const GELDIG_DAGEN = 7

function vindUitnodiging(app, token) {
  if (!token || token.length < 30) throw new NotFoundError("Uitnodiging niet gevonden")
  let inv
  try {
    inv = app.findFirstRecordByData("uitnodigingen", "token", token)
  } catch (_) {
    throw new NotFoundError("Uitnodiging niet gevonden of al gebruikt")
  }
  const leeftijd = Date.now() - new Date(inv.getDateTime("created").string().replace(" ", "T")).getTime()
  if (leeftijd > GELDIG_DAGEN * 24 * 3600 * 1000) throw new BadRequestError("Deze uitnodiging is verlopen. Vraag een nieuwe aan.")
  return inv
}

function escape(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]))
}

function stuurUitnodiging(app, inv) {
  const team = app.findRecordById("teams", inv.getString("team"))
  const link = inv.getString("terug") + "#uitnodiging=" + inv.getString("token")
  const rolTekst = { beheerder: "beheerder (mag alles bijhouden en regelen)", kijker: "kijker (kijkt mee)" }[inv.getString("rol")]
  const meta = app.settings().meta
  const msg = new MailerMessage({
    from: { address: meta.senderAddress, name: meta.senderName },
    to: [{ address: inv.getString("email") }],
    subject: "Uitnodiging voor " + team.getString("naam") + " in de Hockey Wissel-app",
    html:
      "<p>Hallo,</p>" +
      "<p>Je bent uitgenodigd voor <strong>" + escape(team.getString("naam")) + "</strong> als " + escape(rolTekst) + ".</p>" +
      "<p><a href=\"" + escape(link) + "\">Uitnodiging openen</a></p>" +
      "<p>De link is " + GELDIG_DAGEN + " dagen geldig.</p>",
  })
  app.newMailClient().send(msg)
}

function mail(app, aan, onderwerp, html) {
  const meta = app.settings().meta
  app.newMailClient().send(new MailerMessage({
    from: { address: meta.senderAddress, name: meta.senderName },
    to: aan.map((a) => ({ address: a })),
    subject: onderwerp,
    html: html,
  }))
}

// Uitnodiging als beheerder aanmaken en mailen (zelfde als via de app, maar vanuit de server)
function nodigUit(app, teamId, email, rol, terug, makerId) {
  const inv = new Record(app.findCollectionByNameOrId("uitnodigingen"))
  inv.set("team", teamId)
  inv.set("email", email)
  inv.set("rol", rol)
  inv.set("terug", terug)
  inv.set("token", $security.randomString(40))
  inv.set("maker", makerId || "")
  app.save(inv)
  stuurUitnodiging(app, inv)
}

function vindAanmelding(app, token) {
  if (!token || token.length < 30) throw new NotFoundError("Aanmelding niet gevonden")
  try {
    return app.findFirstRecordByData("aanmeldingen", "token", token)
  } catch (_) {
    throw new NotFoundError("Aanmelding niet gevonden")
  }
}

module.exports = { ROL_VELD, TOEGESTAAN, vindUitnodiging, stuurUitnodiging, escape, mail, nodigUit, vindAanmelding }
