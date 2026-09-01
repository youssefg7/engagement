# RSVP operations guide

The invitation keeps its custom English and Arabic RSVP controls. Formspree will deliver submissions privately without displaying provider UI or requiring a backend in the GitHub Pages repository.

## Links

- Create/manage the private form: <https://formspree.io/forms>
- Active public endpoint: <https://formspree.io/f/xzebeoza>
- Temporary Google Form fallback: <https://forms.gle/daqf2ug4TypLtKwH8>

## Configured endpoint

The owner created the Formspree form `xzebeoza`. Its public endpoint is stored in `assets/js/rsvp-config.js`. The form ID is public by design and is safe to place in the static website.

Do not send an account password, API key, recovery code, mailbox access, or dashboard screenshot containing private submissions.

## Verified integration

- The endpoint is configured in `assets/js/rsvp-config.js`.
- Real English and Arabic submissions returned HTTP 200 on 1 September 2026.
- A blocked-network simulation verified the localized error state, preserved values, re-enabled submit button, and Google Form fallback.
- Two labeled test responses can be deleted after the owner confirms them in Formspree: `Codex English integration test — please delete` and `اختبار كوديكس العربي — يرجى الحذف`.

## What the form sends

- Full name.
- Attendance: `Attending` or `Not attending`.
- Optional message.
- Route language (`en` or `ar`).
- Submission time, invitation page URL, and a generated submission ID.
- A hidden `_gotcha` field for basic bot filtering.

No guest response is written to GitHub, browser storage, a URL query string, or analytics.

## Do

- Keep the Formspree account and notification inbox private.
- Check the Formspree dashboard and spam folder after the first test.
- Monitor the monthly allowance. The current free plan starts at 50 submissions per month and keeps 30 days of dashboard history.
- Keep the Google Form fallback available until the deployed custom form is confirmed.

## Do not

- Do not embed Google Forms UI; the project owner explicitly rejected that design.
- Do not place Formspree dashboard/API management keys or guest data in the repository.
- Do not remove the honeypot, submission locking, or inline error fallback.
- Do not treat a browser success message as final verification until the notification or dashboard entry is observed.

Formspree supports AJAX submission and inline states on all plans. The free plan is appropriate only if the expected response count stays within its current allowance.
