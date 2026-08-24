(function () {
  const script = document.currentScript;
  const endpoint = script?.getAttribute("data-api");
  const domain = script?.getAttribute("data-domain");

  if (!endpoint || !domain) return;

  function send(eventName, options) {
    if (eventName !== "pageview") return;

    const url = options?.u || options?.url;
    if (typeof url !== "string") return;

    const payload = {
      n: "pageview",
      v: 36,
      u: url,
      d: domain,
      r: null,
    };

    window
      .fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        keepalive: true,
        credentials: "omit",
        referrerPolicy: "no-referrer",
        body: JSON.stringify(payload),
      })
      .catch(() => {
        // Analytics must never affect the app when the provider is unavailable.
      });
  }

  const queued = window.plausible?.q ?? [];
  window.plausible = send;

  for (const event of queued) {
    send(...event);
  }
})();
