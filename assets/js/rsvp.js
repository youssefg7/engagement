(() => {
  const form = document.querySelector("[data-rsvp-form]");

  if (!form) {
    return;
  }

  const language = document.body.dataset.language === "ar" ? "ar" : "en";
  const copy = {
    en: {
      ready: "Your reply will be delivered privately.",
      unavailable: "Online replies are being connected. Please use the RSVP form link below.",
      invalidName: "Please enter your full name.",
      sending: "Sending your reply…",
      success: "Your RSVP has been received. Thank you!",
      failure: "We couldn’t send your reply. Please try again or use the RSVP form link.",
      submit: "Submit RSVP",
    },
    ar: {
      ready: "سيتم إرسال ردكم بشكل خاص.",
      unavailable: "جارٍ ربط استقبال الردود. يرجى استخدام رابط نموذج تأكيد الحضور أدناه.",
      invalidName: "يرجى كتابة الاسم بالكامل.",
      sending: "جارٍ إرسال ردكم…",
      success: "تم استلام تأكيد حضوركم. شكرًا لكم!",
      failure: "تعذر إرسال ردكم. يرجى المحاولة مرة أخرى أو استخدام رابط نموذج تأكيد الحضور.",
      submit: "تأكيد الحضور",
    },
  }[language];

  const endpoint = String(window.ENGAGEMENT_RSVP?.endpoint || "").trim();
  const endpointIsReady = window.ENGAGEMENT_RSVP?.provider === "formspree"
    && /^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/.test(endpoint);
  const fields = form.querySelector("[data-rsvp-fields]");
  const button = form.querySelector("[data-rsvp-submit]");
  const status = form.querySelector("[data-rsvp-status]");
  const backup = form.querySelector("[data-rsvp-backup]");
  const name = form.elements.namedItem("name");
  const honeypot = form.elements.namedItem("_gotcha");
  const submittedAt = form.elements.namedItem("submitted_at");
  const pageUrl = form.elements.namedItem("page_url");
  const submissionId = form.elements.namedItem("submission_id");

  const setStatus = (message, tone = "neutral") => {
    status.textContent = message;
    status.dataset.tone = tone;
  };

  const setSubmitting = (submitting) => {
    form.setAttribute("aria-busy", String(submitting));
    form.classList.toggle("is-submitting", submitting);
    button.disabled = submitting;
    button.textContent = submitting ? copy.sending : copy.submit;
  };

  const createSubmissionId = () => {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
  };

  const showSuccess = () => {
    fields.disabled = true;
    form.classList.remove("is-submitting");
    form.classList.add("is-complete");
    form.setAttribute("aria-busy", "false");
    backup.hidden = true;
    setStatus(copy.success, "success");
  };

  if (!endpointIsReady) {
    fields.disabled = true;
    button.disabled = true;
    backup.hidden = false;
    setStatus(copy.unavailable, "error");
    return;
  }

  form.action = endpoint;
  fields.disabled = false;
  button.disabled = false;
  backup.hidden = true;
  setStatus(copy.ready);

  name.addEventListener("input", () => name.setCustomValidity(""));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (form.classList.contains("is-submitting")) {
      return;
    }

    name.value = name.value.trim();

    if (name.value.length < 2) {
      name.setCustomValidity(copy.invalidName);
      name.reportValidity();
      return;
    }

    if (honeypot.value) {
      showSuccess();
      return;
    }

    submittedAt.value = new Date().toISOString();
    pageUrl.value = window.location.href.split("#")[0];
    submissionId.value = createSubmissionId();
    backup.hidden = true;
    setSubmitting(true);
    setStatus(copy.sending);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`RSVP request failed with status ${response.status}`);
      }

      showSuccess();
    } catch (error) {
      console.error(error);
      setSubmitting(false);
      backup.hidden = false;
      setStatus(copy.failure, "error");
    }
  });
})();
