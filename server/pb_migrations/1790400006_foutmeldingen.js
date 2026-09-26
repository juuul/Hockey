/// <reference path="../pb_data/types.d.ts" />

// Fouten uit de app (van alle telefoons) om problemen te kunnen vinden die hier niet na te bootsen zijn.
// Alleen via /api/hockey/fout in te sturen (met limiet per bezoeker); alleen superadmins kunnen ze lezen.
migrate((app) => {
  app.save(new Collection({
    type: "base",
    name: "foutmeldingen",
    fields: [
      { type: "text", name: "soort", max: 30 },
      { type: "text", name: "bericht", max: 1000 },
      { type: "text", name: "stack", max: 4000 },
      { type: "text", name: "adres", max: 300 },
      { type: "text", name: "versie", max: 100 },
      { type: "text", name: "agent", max: 300 },
      { type: "text", name: "gebruiker", max: 40 },
      { type: "autodate", name: "created", onCreate: true },
    ],
    indexes: ["CREATE INDEX idx_foutmeldingen_created ON foutmeldingen (created)"],
    listRule: '@request.auth.id != "" && @request.auth.superadmin = true',
    viewRule: '@request.auth.id != "" && @request.auth.superadmin = true',
    createRule: null,
    updateRule: null,
    deleteRule: '@request.auth.id != "" && @request.auth.superadmin = true',
  }))

  const settings = app.settings()
  settings.rateLimits.rules = [
    ...settings.rateLimits.rules.filter((r) => r.label !== "POST /api/hockey/fout"),
    { label: "POST /api/hockey/fout", audience: "", duration: 3600, maxRequests: 30 },
  ]
  app.save(settings)
}, (app) => {
  app.delete(app.findCollectionByNameOrId("foutmeldingen"))
})
