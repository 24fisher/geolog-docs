document.addEventListener("DOMContentLoaded", () => {
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

  const appendOnce = (element, item) => {
    if (!element || !item) return;
    if (item.spec_status && !element.querySelector(":scope > .spec-status")) {
      element.append(" ", makeSpecBadge(item));
    }
    if (!element.querySelector(":scope > .implementation-status")) {
      element.append(" ", makeBadge(item));
    }
  };

  const caseByHref = (href) => {
    try {
      const url = new URL(href, window.location.href);
      const id = url.hash.replace(/^#/, "").toUpperCase();
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

  document.querySelectorAll(".md-content a[href], .md-sidebar--secondary a[href]").forEach((link) => {
    appendOnce(link, caseByHref(link.getAttribute("href")) || interfaceByHref(link.getAttribute("href")));
  });

  document.querySelectorAll('a[id*="-case-"]').forEach((anchor) => {
    const id = anchor.id.toUpperCase();
    const heading = anchor.nextElementSibling;
    if (heading && /^H[1-6]$/.test(heading.tagName)) appendOnce(heading, data.cases[id]);
  });

  const currentPath = window.location.pathname.replace(/^.*\/geolog-docs\//, "").replace(/^\//, "");
  const currentInterface = Object.values(data.interfaces).find(
    (item) => currentPath === item.href || currentPath === item.href.replace(/\/$/, "")
  );
  if (currentInterface) appendOnce(document.querySelector(".md-content h1"), currentInterface);

  document.querySelectorAll(".md-sidebar--primary .md-nav__link[href]").forEach((link) => {
    const href = link.getAttribute("href") || "";
    const item = caseByHref(href) || interfaceByHref(href);
    if (item) {
      appendOnce(link, item);
      return;
    }
    try {
      const url = new URL(href, window.location.href);
      const path = url.pathname.replace(/^.*\/geolog-docs\//, "").replace(/^\//, "").replace(/\/$/, "");
      if (path === "cases") {
        appendOnce(link, {
          status: data.aggregate.cases,
          spec_status: data.aggregate.case_specs,
        });
      }
    } catch {
      // Ignore malformed navigation links.
    }
  });

  document.querySelectorAll(".md-sidebar--primary .md-nav__title").forEach((title) => {
    if (title.textContent.trim() === "Интерфейсы") {
      appendOnce(title, {
        status: data.aggregate.interfaces,
        spec_status: data.aggregate.interface_specs,
      });
    }
  });
});
