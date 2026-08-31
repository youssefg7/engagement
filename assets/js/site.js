(() => {
  document.documentElement.dataset.js = "enabled";

  const countdown = document.querySelector("[data-countdown]");

  if (!countdown) {
    return;
  }

  const target = new Date(countdown.dataset.target).getTime();
  const units = Object.fromEntries(
    [...countdown.querySelectorAll("[data-countdown-unit]")].map((node) => [
      node.dataset.countdownUnit,
      node,
    ]),
  );

  const format = (value) => String(value).padStart(2, "0");

  const updateCountdown = () => {
    const distance = Math.max(0, target - Date.now());
    const days = Math.floor(distance / 86_400_000);
    const hours = Math.floor((distance % 86_400_000) / 3_600_000);
    const minutes = Math.floor((distance % 3_600_000) / 60_000);
    const seconds = Math.floor((distance % 60_000) / 1_000);

    units.days.textContent = format(days);
    units.hours.textContent = format(hours);
    units.minutes.textContent = format(minutes);
    units.seconds.textContent = format(seconds);
    countdown.setAttribute(
      "aria-label",
      `${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds until the engagement`,
    );
  };

  updateCountdown();
  window.setInterval(updateCountdown, 1_000);
})();
