// Gedeelde functies voor de hooks (handlers draaien los van elkaar, dus alles via require)

const ROL_VELD = { beheerder: "beheerders", bewerker: "bewerkers", kijker: "kijkers" }

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
  const rolTekst = { beheerder: "beheerder", bewerker: "bewerker (mag score en wissels bijhouden)", kijker: "kijker (kijkt mee)" }[inv.getString("rol")]
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

module.exports = { ROL_VELD, TOEGESTAAN, vindUitnodiging, stuurUitnodiging }
