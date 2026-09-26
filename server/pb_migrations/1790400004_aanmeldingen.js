/// <reference path="../pb_data/types.d.ts" />

// Nieuwe teams kunnen zichzelf aanmelden; een superadmin keurt goed via een link in de mail.
// Plus: echte bezoekers-IP via Tailscale (X-Forwarded-For) zodat limieten per bezoeker gelden, en de
// wachtwoordlinks gaan naar de live-app.
migrate((app) => {
  app.save(new Collection({
    type: "base",
    name: "aanmeldingen",
    fields: [
      { type: "text", name: "teamnaam", required: true, max: 60 },
      { type: "text", name: "naam", max: 60 },
      { type: "email", name: "email", required: true },
      { type: "text", name: "bericht", max: 1000 },
      { type: "text", name: "terug", required: true, max: 200 },
      { type: "text", name: "token", hidden: true },
      { type: "select", name: "status", values: ["nieuw", "goedgekeurd", "afgewezen"], maxSelect: 1, required: true },
      { type: "relation", name: "team", collectionId: app.findCollectionByNameOrId("teams").id, maxSelect: 1 },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    // Aanmaken en behandelen gaat via /api/hockey/aanmelding; alleen superadmins mogen de lijst zien
    listRule: '@request.auth.id != "" && @request.auth.superadmin = true',
    viewRule: '@request.auth.id != "" && @request.auth.superadmin = true',
    createRule: null,
    updateRule: null,
    deleteRule: '@request.auth.id != "" && @request.auth.superadmin = true',
  }))

  const settings = app.settings()
  // De server is alleen via Tailscale (serve/funnel) bereikbaar; die zet het echte IP achteraan in X-Forwarded-For
  settings.trustedProxy.headers = ["X-Forwarded-For"]
  settings.trustedProxy.useLeftmostIP = false
  settings.rateLimits.enabled = true
  settings.rateLimits.rules = [
    ...settings.rateLimits.rules.filter((r) => r.label !== "POST /api/hockey/aanmelding"),
    { label: "POST /api/hockey/aanmelding", audience: "", duration: 3600, maxRequests: 5 },
  ]
  settings.meta.appURL = "https://juliaan.eu/hockey/"
  app.save(settings)
}, (app) => {
  app.delete(app.findCollectionByNameOrId("aanmeldingen"))
})
