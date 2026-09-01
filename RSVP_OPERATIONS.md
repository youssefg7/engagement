# RSVP operations guide

The invitation keeps its custom English and Arabic RSVP controls. FormSubmit delivers submissions to the couple's private inbox without displaying provider UI or requiring a backend in the GitHub Pages repository.

## Links

- Provider documentation: <https://formsubmit.co/documentation>
- Active public endpoint: <https://formsubmit.co/ajax/04935cacc23651fcc5774b9d37073cea>
- Temporary Google Form fallback: <https://forms.gle/daqf2ug4TypLtKwH8>

## Configured endpoint

The owner activated FormSubmit for the private notification inbox. The randomized route is stored in `assets/js/rsvp-config.js`; it is public routing data but does not reveal the destination email address.

Do not replace the randomized route with the destination email in committed code. Do not send an account password, recovery code, mailbox access, or messages containing private guest submissions.

## Verified integration

- The FormSubmit randomized AJAX endpoint is configured in `assets/js/rsvp-config.js`.
- The activated endpoint returned `success: true` from the deployed site's origin on 1 September 2026.
- Real English and Arabic browser submissions on the public pages showed the correct localized success state without provider UI or console errors.
- A blocked-network simulation verified the localized error state, preserved values, re-enabled submit button, and Google Form fallback.
- These FormSubmit test notifications can be deleted after receipt is confirmed: `Codex FormSubmit integration test - please delete`, `Codex live English test - please delete`, and `اختبار فورم سبمت العربي - يرجى الحذف`.
- Two older Formspree test responses may also be deleted: `Codex English integration test — please delete` and `اختبار كوديكس العربي — يرجى الحذف`.

## What the form sends

- Full name.
- Attendance: `Attending` or `Not attending`.
- Optional message.
- Route language (`en` or `ar`).
- Submission time, invitation page URL, and a generated submission ID.
- A hidden `_honey` field for basic bot filtering.
- FormSubmit formatting and invisible-CAPTCHA settings (`_template=table`, `_captcha=false`).

No guest response is written to GitHub, browser storage, a URL query string, or analytics.

## Do

- Keep the notification inbox private.
- Check the inbox and spam folder after the first deployed test.
- Keep a separate durable record of accepted RSVPs; FormSubmit's submission archive is retained for 30 days.
- Keep the Google Form fallback available until the deployed custom form is confirmed.

## Do not

- Do not embed Google Forms UI; the project owner explicitly rejected that design.
- Do not place the notification email, guest data, or mailbox credentials in the repository.
- Do not remove the honeypot, submission locking, or inline error fallback.
- Do not treat a browser success message as final verification until the notification or dashboard entry is observed.

FormSubmit documents unlimited forms and submissions. It supports cross-origin AJAX submission and sends each accepted response to the private inbox. The site checks both the HTTP status and FormSubmit's JSON `success` value before showing its localized success state.
