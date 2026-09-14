const renderImplementationStatus = () => {
  const data = window.GEOLOG_IMPLEMENTATION_STATUS;
  if (!data) return;

  const labels = {
    not_implemented: "Не реализовано",
    partial: "Частично",
    implemented: "Реализовано",
  };
  const specLabels = {
    draft: "Черновик",
    needs_clarification: "Требует уточнения",
    ready: "Проработан",
  };

  const makeBadge = (item) => {
    const badge = document.createElement("span");
    badge.className = `implementation-status implementation-status--${item.status}`;
    badge.textContent = labels[item.status] || item.status;
    const details = [];
    if (item.task) details.push(`Задача: ${item.task}`);
    if (item.pr) details.push(`PR: #${item.pr}`);
    if (item.note) details.push(item.note);
    if (details.length) badge.title = details.join(" · ");
    return badge;
  };

  const makeSpecBadge = (item) => {
    const badge = document.createElement("span");
    badge.className = `spec-status spec-status--${item.spec_status}`;
    badge.textContent = specLabels[item.spec_status] || item.spec_status;
    if (item.spec_note) badge.title = item.spec_note;
    return badge;
  };

  const makeStatusPair = (item) => {
    const pair = document.createElement("span");
    pair.className = "status-pair";
    if (item.spec_status) pair.append(makeSpecBadge(item));
    pair.append(makeBadge(item));
    return pair;
  };

  const appendOnce = (element, item) => {
    if (!element || !item) return;
    if (element.querySelector(":scope > .status-pair")) return;

    element.querySelectorAll(":scope > .spec-status, :scope > .implementation-status").forEach((badge) => badge.remove());
    element.append(" ", makeStatusPair(item));
  };

  const caseByHref = (href) => {
    try {
      const url = new URL(href, window.location.href);
      let id = url.hash.replace(/^#/, "").toUpperCase();
      if (!id) {
        const file = url.pathname.split("/").filter(Boolean).pop() || "";
        id = file.replace(/\.md$/i, "").replace(/\/$/, "").toUpperCase();
      }
      return data.cases[id] || null;
    } catch {
      return null;
    }
  };

  const interfaceByHref = (href) => {
    try {
      const url = new URL(href, window.location.href);
      const path = url.pathname.replace(/^.*\/geolog-docs\//, "").replace(/^\//, "");
      return Object.values(data.interfaces).find((item) => path === item.href || path === item.href.replace(/\/$/, "")) || null;
    } catch {
      return null;
    }
  };

  // Statuses belong to page content and the page TOC, not to the primary/mobile navigation.
  document.querySelectorAll(".md-sidebar--primary .status-pair, .md-sidebar--primary .spec-status, .md-sidebar--primary .implementation-status").forEach((badge) => badge.remove());

  document.querySelectorAll(".md-content a[href], .md-sidebar--secondary a[href]").forEach((link) => {
    const caseItem = caseByHref(link.getAttribute("href"));
    const interfaceItem = interfaceByHref(link.getAttribute("href"));
    const item = caseItem || interfaceItem;
    if (!item) return;

    const listItem = link.closest("li");
    if (caseItem && listItem) {
      // Case category pages already contain a generated status pair as a sibling of the link.
      // Keep that single source of presentation and remove a stale JS-injected copy if SPA
      // navigation left one inside the link from an older version.
      const generatedPair = listItem.querySelector(":scope > .status-pair");
      if (generatedPair) {
        link.querySelectorAll(":scope > .status-pair, :scope > .spec-status, :scope > .implementation-status").forEach((badge) => badge.remove());
        return;
      }

      // Compatibility with pages generated before status pairs were emitted as HTML.
      const fallback = listItem.querySelector(":scope > strong");
      if (fallback) {
        fallback.replaceWith(makeStatusPair(caseItem));
        return;
      }
    }

    appendOnce(link, item);
  });

  document.querySelectorAll('a[id*="-case-"]').forEach((anchor) => {
    const id = anchor.id.toUpperCase();
    const heading = anchor.nextElementSibling;
    if (heading && /^H[1-6]$/.test(heading.tagName)) appendOnce(heading, data.cases[id]);
  });

  document.querySelectorAll(".md-content .technical-id").forEach((idLine) => {
    const id = idLine.textContent.trim().toUpperCase();
    const item = data.cases[id];
    if (!item) return;
    const heading = idLine.previousElementSibling;
    if (heading && /^H[1-6]$/.test(heading.tagName)) appendOnce(heading, item);
  });

  const currentPath = window.location.pathname.replace(/^.*\/geolog-docs\//, "").replace(/^\//, "");
  const currentInterface = Object.values(data.interfaces).find(
    (item) => currentPath === item.href || currentPath === item.href.replace(/\/$/, "")
  );
  if (currentInterface) appendOnce(document.querySelector(".md-content h1"), currentInterface);
};

let statusObserver = null;
let statusRenderQueued = false;

const queueStatusRender = () => {
  if (statusRenderQueued) return;
  statusRenderQueued = true;
  queueMicrotask(() => {
    statusRenderQueued = false;
    renderImplementationStatus();
  });
};

const observeStatusTargets = () => {
  if (statusObserver) statusObserver.disconnect();
  const target = document.querySelector(".md-content") || document.body;
  if (!target) return;
  statusObserver = new MutationObserver(queueStatusRender);
  statusObserver.observe(target, { childList: true, subtree: true });
};

const refreshImplementationStatus = () => {
  renderImplementationStatus();
  observeStatusTargets();
  queueStatusRender();
};

if (typeof document$ !== "undefined" && document$ && typeof document$.subscribe === "function") {
  document$.subscribe(refreshImplementationStatus);
} else if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", refreshImplementationStatus);
} else {
  refreshImplementationStatus();
}
