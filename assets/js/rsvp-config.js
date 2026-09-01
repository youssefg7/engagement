/* Public routing only. Google credentials are stored as a Cloudflare Worker secret. */
window.ENGAGEMENT_RSVP = Object.freeze({
  provider: "google-sheets-worker",
  endpoint: "https://engagement-rsvp.engagement-website.workers.dev/rsvp",
});
