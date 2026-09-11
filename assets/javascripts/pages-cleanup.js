document.addEventListener("DOMContentLoaded", () => {
  const technicalId = /^(?:SCOPE|CORE|[A-Z][A-Z0-9-]*)-(?:REQ|CASE)-\d{3}\.\s*/;

  const cleanTocLabels = () => {
    document.querySelectorAll(".md-nav--secondary .md-nav__link").forEach((link) => {
      const text = link.textContent.trim();
      const cleaned = text.replace(technicalId, "");
      if (cleaned !== text) {
        link.textContent = cleaned;
      }
    });
  };

  cleanTocLabels();

  const observer = new MutationObserver(cleanTocLabels);
  observer.observe(document.body, { childList: true, subtree: true });
});
