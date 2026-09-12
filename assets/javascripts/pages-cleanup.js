document.addEventListener("DOMContentLoaded", () => {
  const technicalId = /^(?:SCOPE|CORE|[A-Z][A-Z0-9-]*)-(?:REQ|CASE)-\d{3}\.\s*/;
  const technicalHeading = /^((?:SCOPE|CORE|[A-Z][A-Z0-9-]*)-(?:REQ|CASE)-\d{3})\.\s*/;

  const cleanTocLabels = () => {
    document.querySelectorAll(".md-nav--secondary .md-nav__link").forEach((link) => {
      const text = link.textContent.trim();
      const cleaned = text.replace(technicalId, "");
      if (cleaned !== text) {
        link.textContent = cleaned;
      }
    });
  };

  const makeTechnicalHeadingsReadable = () => {
    document.querySelectorAll(".md-content h1, .md-content h2, .md-content h3, .md-content h4, .md-content h5, .md-content h6").forEach((heading) => {
      if (heading.dataset.technicalIdMoved === "true") {
        return;
      }

      let identifier = null;
      for (const node of heading.childNodes) {
        if (node.nodeType !== Node.TEXT_NODE) {
          continue;
        }

        const match = node.textContent.match(technicalHeading);
        if (!match) {
          continue;
        }

        identifier = match[1];
        node.textContent = node.textContent.replace(technicalHeading, "");
        break;
      }

      if (!identifier) {
        return;
      }

      const idLine = document.createElement("div");
      idLine.className = "technical-id";
      idLine.textContent = identifier;
      heading.insertAdjacentElement("afterend", idLine);
      heading.dataset.technicalIdMoved = "true";
    });
  };

  const refresh = () => {
    makeTechnicalHeadingsReadable();
    cleanTocLabels();
  };

  refresh();

  const observer = new MutationObserver(refresh);
  observer.observe(document.body, { childList: true, subtree: true });
});
