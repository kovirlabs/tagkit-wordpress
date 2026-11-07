/*! TagAction v0.1.0 | Apache-2.0 | https://github.com/kovirlabs/tagaction | tested with TagBrush.css 1.1.0 */
(() => {
  // src/styles.js
  var CSS2 = `@layer tagaction{:where([data-tag="code"]){position:relative}:where([data-tag="code"]>pre){padding-inline-end:5rem}:where([data-tag="copy"]){position:absolute;top:0.4rem;right:0.4rem;margin:0;padding:0.15rem 0.6rem;font-size:0.8rem;line-height:1.5;background:var(--color-surface,Canvas)}:where(:has(>[data-tag="dropdown"])){position:relative}:where([data-tag="dropdown"]:not([hidden])){position:absolute;z-index:10;top:100%;right:0;min-width:12rem;margin:0.25rem 0 0;padding:0.5rem;display:flex;flex-direction:column;align-items:stretch;gap:0.25rem;list-style:none;background:var(--color-surface,Canvas);border:1px solid var(--color-border,GrayText);border-radius:var(--border-radius,0.5rem);box-shadow:0 8px 24px rgb(0 0 0 / 0.15)}:where([data-tag="sort"]){all:unset;display:inline-flex;align-items:center;gap:0.35em;cursor:pointer;font:inherit;color:inherit;text-align:inherit}:where([data-tag="sort"]):focus-visible{outline:2px solid var(--color-primary,Highlight);outline-offset:2px;border-radius:2px}:where([data-tag="sort"])::after{content:"\u2195" / "";opacity:0.45;font-size:0.85em}:where([aria-sort="ascending"]>[data-tag="sort"])::after{content:"\u2191" / "";opacity:1}:where([aria-sort="descending"]>[data-tag="sort"])::after{content:"\u2193" / "";opacity:1}:where([data-tag="anchor"]){margin-inline-start:0.35em;color:var(--color-text-muted,GrayText);text-decoration:none;font-weight:normal;opacity:0}:where(:hover>[data-tag="anchor"],[data-tag="anchor"]:focus-visible){opacity:1}@media (hover:none){:where([data-tag="anchor"]){opacity:1}}:where([data-tag="count"],[data-tag="files"]){display:block;text-align:end;color:var(--color-text-muted,GrayText)}:where([data-tag="files"]){text-align:start}:where([data-tag="count"][data-tag-low]){color:var(--color-error,#b91c1c)}:where([data-tag="error"]){display:block;color:var(--color-error,#b91c1c)}:where([data-tag="abbr"]){font-size:inherit;color:var(--color-text-muted,inherit)}:where([data-tag-drop]){outline:2px dashed var(--color-primary,Highlight);outline-offset:2px}:where(img[data-tag="zoom"]){cursor:zoom-in}:where(abbr[title][tabindex]){cursor:help}:where([data-tag="viewer"]){max-width:95vw;max-height:95vh;padding:0.5rem}:where([data-tag="viewer"] form){display:flex;justify-content:end;margin:0}:where([data-tag="viewer"] figure){margin:0;cursor:zoom-out}:where([data-tag="viewer"] img){display:block;max-width:100%;max-height:80vh;margin:auto;object-fit:contain}}`;
  function addStyles() {
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(CSS2);
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    } catch {
      const style = document.createElement("style");
      style.setAttribute("data-tagaction", "styles");
      style.textContent = CSS2;
      document.head.append(style);
    }
  }

  // src/core.js
  var done = /* @__PURE__ */ new WeakMap();
  function once(element, name) {
    let names = done.get(element);
    if (!names) done.set(element, names = /* @__PURE__ */ new Set());
    if (names.has(name)) return false;
    names.add(name);
    return true;
  }
  function find(root, selector) {
    const list = root.matches?.(selector) ? [root] : [];
    if (root.querySelectorAll) list.push(...root.querySelectorAll(selector));
    return list.filter((element) => !element.closest('[data-tagaction="off"]'));
  }
  function each(root, selector, name, setup) {
    for (const element of find(root, selector)) if (once(element, name)) setup(element);
  }
  function h(name, attributes = {}, text) {
    const element = document.createElement(name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    if (text != null) element.textContent = text;
    return element;
  }
  var reveal = (control) => control.removeAttribute("hidden");
  var counter = 0;
  function idFor(element, base = "tag") {
    if (!element.id) {
      let id;
      do
        id = `${base}-${++counter}`;
      while (document.getElementById(id));
      element.id = id;
    }
    return element.id;
  }
  function addToken(element, attribute, token) {
    const tokens = (element.getAttribute(attribute) ?? "").split(/\s+/).filter(Boolean);
    if (!tokens.includes(token)) element.setAttribute(attribute, [...tokens, token].join(" "));
  }
  var store = {
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch {
      }
    }
  };
  var focusables = (container) => [...container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter((element) => !element.closest("[hidden]"));

  // src/behaviors/command.js
  var supported = () => "commandForElement" in HTMLButtonElement.prototype;
  var builtIn = {
    "show-modal": (target) => target.open || target.showModal?.(),
    close: (target, button) => target.close?.(button.value),
    "request-close": (target, button) => target.requestClose ? target.requestClose(button.value) : target.close?.(button.value),
    "toggle-popover": (target) => target.togglePopover?.(),
    "show-popover": (target) => target.matches(":popover-open") || target.showPopover?.(),
    "hide-popover": (target) => target.matches(":popover-open") && target.hidePopover?.()
  };
  function init() {
    if (supported() || !once(document, "command")) return;
    document.addEventListener("click", (event) => {
      const button = event.target.closest?.("button[commandfor]");
      if (!button || button.disabled || button.closest('[data-tagaction="off"]')) return;
      const target = document.getElementById(button.getAttribute("commandfor"));
      const command = (button.getAttribute("command") ?? "").toLowerCase();
      if (!target || !command) return;
      const commandEvent = new Event("command", { cancelable: true });
      commandEvent.command = command.startsWith("--") ? button.getAttribute("command") : command;
      commandEvent.source = button;
      if (target.dispatchEvent(commandEvent)) builtIn[command]?.(target, button);
    });
  }

  // src/behaviors/dialog.js
  function init2(root) {
    each(root, "dialog:not([closedby])", "dialog", (dialog) => {
      let pressedOnBackdrop = false;
      const onBackdrop = (event) => {
        if (event.target !== dialog || !dialog.matches(":modal")) return false;
        const box = dialog.getBoundingClientRect();
        return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
      };
      dialog.addEventListener("pointerdown", (event) => {
        pressedOnBackdrop = onBackdrop(event);
      });
      dialog.addEventListener("click", (event) => {
        if (event.detail === 0 || !pressedOnBackdrop || !onBackdrop(event)) return;
        if (dialog.requestClose) dialog.requestClose();
        else dialog.close();
      });
    });
  }

  // src/behaviors/details.js
  var nativeGroups = () => "name" in HTMLDetailsElement.prototype;
  var keyFor = (details) => `tagaction:details:${location.pathname}#${details.id}`;
  function init3(root) {
    each(root, "details", "details", (details) => {
      if (!nativeGroups() && details.getAttribute("name")) {
        details.addEventListener("toggle", () => {
          if (!details.open) return;
          const name = details.getAttribute("name");
          for (const other of document.querySelectorAll("details[open]")) {
            if (other !== details && other.getAttribute("name") === name) other.open = false;
          }
        });
      }
      if (details.id && details.closest("[data-tag-remember]")) {
        const saved = store.get(keyFor(details));
        if (saved !== null) details.open = saved === "open";
        details.addEventListener("toggle", () => store.set(keyFor(details), details.open ? "open" : "closed"));
      }
    });
  }

  // src/behaviors/table.js
  var collator = new Intl.Collator(void 0, { numeric: true, sensitivity: "base" });
  var NUMBER = /^[^\d\s-]{0,3}\s*[-−]?\d[\d,\s]*(\.\d+)?\s*[%a-zA-Z]{0,3}$/;
  function sortKey(cell) {
    if (!cell) return "";
    const valued = cell.querySelector("data[value], time[datetime], meter, progress");
    if (valued) return valued.getAttribute("value") ?? valued.getAttribute("datetime") ?? "";
    return cell.textContent.trim();
  }
  function compare(a, b) {
    if (NUMBER.test(a) && NUMBER.test(b)) {
      const number = (text) => parseFloat(text.replace(/[^\d.−-]/g, "").replace("\u2212", "-"));
      return number(a) - number(b);
    }
    if (a === "" || b === "") return a === "" ? b === "" ? 0 : 1 : -1;
    return collator.compare(a, b);
  }
  function sort(table, header) {
    const descending = header.getAttribute("aria-sort") === "ascending";
    for (const th of header.parentElement.children) th.removeAttribute("aria-sort");
    header.setAttribute("aria-sort", descending ? "descending" : "ascending");
    const index = header.cellIndex;
    for (const body of table.tBodies) {
      const rows = [...body.rows];
      rows.sort((a, b) => compare(sortKey(a.cells[index]), sortKey(b.cells[index])) * (descending ? -1 : 1));
      body.append(...rows);
    }
  }
  function filter(control, target) {
    const words = control.value.toLowerCase().split(/\s+/).filter(Boolean);
    const items = target.tBodies ? [...target.tBodies].flatMap((body) => [...body.rows]) : [...target.children].filter((child) => child.matches("li"));
    for (const item of items) {
      const text = item.textContent.toLowerCase();
      item.hidden = !words.every((word) => text.includes(word));
    }
  }
  function init4(root) {
    each(root, "table", "table", (table) => {
      const headerRow = table.tHead?.rows[table.tHead.rows.length - 1];
      if (!headerRow || ![...table.tBodies].some((body) => body.rows.length > 1)) return;
      for (const th of headerRow.cells) {
        if (th.tagName !== "TH" || th.colSpan > 1 || th.dataset.tagaction === "off" || !th.textContent.trim()) continue;
        const button = h("button", { type: "button", "data-tag": "sort" });
        button.append(...th.childNodes);
        th.append(button);
        button.addEventListener("click", () => sort(table, th));
      }
    });
    each(root, 'input[aria-controls]:is([type="search"], [type="text"], :not([type]))', "filter", (control) => {
      const target = document.getElementById(control.getAttribute("aria-controls"));
      if (!target?.matches("table, ul, ol, menu")) return;
      reveal(control);
      control.addEventListener("input", () => filter(control, target));
      if (control.value) filter(control, target);
    });
  }

  // src/behaviors/form.js
  var messages = /* @__PURE__ */ new WeakMap();
  var helpText = /* @__PURE__ */ new WeakMap();
  function anchorFor(field) {
    if (field.type === "radio") return field.closest("fieldset") ?? field.closest("label") ?? field;
    return field.closest('label:has(input:is([type="checkbox"], [type="radio"])), [data-tag="password"]') ?? field;
  }
  function messageFor(field) {
    const anchor = anchorFor(field);
    let small = messages.get(anchor);
    if (!small) {
      const next = anchor.nextElementSibling;
      if (!anchor.matches("fieldset") && next?.matches("small:not([data-tag])")) {
        small = next;
        helpText.set(small, small.textContent);
      } else {
        small = h("small", { "data-tag": "error" });
        if (anchor.matches("fieldset")) anchor.append(small);
        else anchor.after(small);
      }
      messages.set(anchor, small);
    }
    addToken(field, "aria-describedby", idFor(small));
    return small;
  }
  function show(field) {
    const small = messageFor(field);
    const title = field.validity.patternMismatch && field.title ? ` ${field.title}` : "";
    small.textContent = field.validationMessage + title;
    small.setAttribute("data-tag", "error");
    field.setAttribute("aria-invalid", "true");
  }
  function clear(field) {
    if (field.getAttribute("aria-invalid") !== "true") return;
    const group = field.type === "radio" && field.form ? [...field.form.elements].filter((f) => f.name === field.name) : [field];
    if (!group.every((f) => f.validity.valid)) return;
    const small = messages.get(anchorFor(field));
    for (const f of group) f.removeAttribute("aria-invalid");
    if (!small) return;
    if (helpText.has(small)) {
      small.textContent = helpText.get(small);
      small.removeAttribute("data-tag");
    } else {
      small.textContent = "";
    }
  }
  function submitButton(form, submitter) {
    return submitter ?? form.querySelector('button:not([type]), button[type="submit"], input[type="submit"]');
  }
  function init5(root) {
    each(root, "form", "form", (form) => {
      let firstInvalid = null;
      let dirty = false;
      form.addEventListener("invalid", (event) => {
        const field = event.target;
        event.preventDefault();
        show(field);
        if (!firstInvalid) {
          firstInvalid = field;
          setTimeout(() => {
            firstInvalid.focus();
            firstInvalid = null;
          });
        }
      }, true);
      const recheck = (event) => clear(event.target);
      form.addEventListener("input", recheck);
      form.addEventListener("change", recheck);
      form.addEventListener("input", () => {
        dirty = true;
      });
      form.addEventListener("reset", () => {
        dirty = false;
      });
      form.addEventListener("submit", (event) => {
        dirty = false;
        setTimeout(() => {
          if (event.defaultPrevented || form.method === "dialog") return;
          if (form.target && form.target !== "_self") return;
          const button = submitButton(form, event.submitter);
          if (!button) return;
          button.disabled = true;
          button.setAttribute("aria-busy", "true");
          const restore = () => {
            button.disabled = false;
            button.removeAttribute("aria-busy");
          };
          setTimeout(restore, 1e4);
          addEventListener("pageshow", restore, { once: true });
        });
      });
      if (form.method === "post") {
        addEventListener("beforeunload", (event) => {
          if (!dirty || !form.isConnected) return;
          event.preventDefault();
          event.returnValue = "";
        });
      }
    });
  }

  // src/behaviors/textarea.js
  function init6(root) {
    each(root, "textarea:not([rows])", "grow", (textarea) => {
      if (CSS.supports?.("field-sizing", "content")) return;
      const grow = () => {
        const style = getComputedStyle(textarea);
        const borders = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight + borders}px`;
      };
      textarea.addEventListener("input", grow);
      if (textarea.value) requestAnimationFrame(grow);
    });
    each(root, "textarea[maxlength]", "count", (textarea) => {
      const max = textarea.maxLength;
      if (max < 0) return;
      const counter2 = h("small", { "data-tag": "count" });
      const help = textarea.nextElementSibling?.matches("small") ? textarea.nextElementSibling : null;
      (help ?? textarea).after(counter2);
      addToken(textarea, "aria-describedby", idFor(counter2));
      const update = () => {
        const left = max - textarea.value.length;
        counter2.textContent = `${textarea.value.length} / ${max}`;
        counter2.toggleAttribute("data-tag-low", left <= Math.max(10, max * 0.1));
      };
      textarea.addEventListener("input", update);
      update();
    });
  }

  // src/behaviors/file.js
  function init7(root) {
    each(root, 'input[type="file"]', "file", (input) => {
      let list = null;
      const update = () => {
        if (!input.multiple) return;
        if (!list) {
          list = h("small", { "data-tag": "files", "aria-live": "polite" });
          const help = input.nextElementSibling?.matches("small:not([data-tag])") ? input.nextElementSibling : null;
          (help ?? input).after(list);
          addToken(input, "aria-describedby", idFor(list));
        }
        list.textContent = [...input.files].map((file) => file.name).join(", ");
      };
      input.addEventListener("change", update);
      for (const zone of [input, ...input.labels]) {
        const over = (on) => {
          input.toggleAttribute("data-tag-drop", on);
          zone.toggleAttribute("data-tag-drop", on);
        };
        zone.addEventListener("dragover", (event) => {
          if (input.disabled || !event.dataTransfer?.types.includes("Files")) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          over(true);
        });
        zone.addEventListener("dragleave", () => over(false));
        zone.addEventListener("drop", (event) => {
          over(false);
          if (input.disabled || !event.dataTransfer?.files.length) return;
          event.preventDefault();
          const files = new DataTransfer();
          for (const file of [...event.dataTransfer.files].slice(0, input.multiple ? void 0 : 1)) files.items.add(file);
          input.files = files.files;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        });
      }
    });
  }

  // src/behaviors/password.js
  function init8(root) {
    each(root, 'input[type="password"]', "password", (input) => {
      let group = input.parentElement;
      if (!group?.matches('[role="group"]')) {
        group = h("div", { role: "group", "data-tag": "password" });
        input.before(group);
        group.append(input);
      }
      const button = h("button", {
        type: "button",
        class: "outline",
        "data-tag": "reveal",
        "aria-pressed": "false",
        "aria-controls": idFor(input),
        "aria-label": "Show password"
      }, "Show");
      input.after(button);
      const set = (visible) => {
        input.type = visible ? "text" : "password";
        button.setAttribute("aria-pressed", String(visible));
        button.textContent = visible ? "Hide" : "Show";
      };
      button.addEventListener("click", () => set(input.type === "password"));
      input.form?.addEventListener("submit", () => set(false));
    });
  }

  // src/behaviors/code.js
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = h("textarea", { readonly: "", "aria-hidden": "true", style: "position:fixed;opacity:0" });
      area.value = text;
      document.body.append(area);
      area.select();
      const copied = document.execCommand("copy");
      area.remove();
      return copied;
    }
  }
  function init9(root) {
    each(root, "pre", "copy", (pre) => {
      if (!pre.textContent.trim()) return;
      const wrapper = h("div", { "data-tag": "code" });
      const button = h("button", { type: "button", class: "outline", "data-tag": "copy", "aria-live": "polite" }, "Copy");
      pre.before(wrapper);
      wrapper.append(pre, button);
      let timer;
      button.addEventListener("click", async () => {
        const copied = await copy(pre.textContent);
        button.textContent = copied ? "Copied" : "Press Ctrl+C to copy";
        if (!copied) getSelection()?.selectAllChildren(pre);
        clearTimeout(timer);
        timer = setTimeout(() => {
          button.textContent = "Copy";
        }, 2e3);
      });
    });
  }

  // src/behaviors/time.js
  var ZONED = /T\d\d:\d\d.*(Z|[+-]\d\d:?\d\d)$/i;
  var UNITS = [["year", 31536e6], ["month", 2592e6], ["week", 6048e5], ["day", 864e5], ["hour", 36e5], ["minute", 6e4], ["second", 1e3]];
  function relative(date, now = Date.now()) {
    const difference = date - now;
    const [unit, size] = UNITS.find(([, ms]) => Math.abs(difference) >= ms) ?? UNITS[UNITS.length - 1];
    return new Intl.RelativeTimeFormat(void 0, { numeric: "auto" }).format(Math.round(difference / size), unit);
  }
  function render(time) {
    const value = time.getAttribute("datetime").trim();
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return;
    const relativeMode = time.dataset.tagTime === "relative";
    if (!relativeMode && !ZONED.test(value)) return;
    const full = new Intl.DateTimeFormat(void 0, { dateStyle: "medium", timeStyle: ZONED.test(value) ? "short" : void 0 }).format(date);
    time.textContent = relativeMode ? relative(date) : full;
    if (!time.title) time.title = full;
  }
  function init10(root) {
    each(root, "time[datetime]", "time", render);
    if (find(document, 'time[data-tag-time="relative"]').length && once(document, "time-tick")) {
      setInterval(() => find(document, 'time[datetime][data-tag-time="relative"]').forEach(render), 6e4);
    }
  }

  // src/behaviors/headings.js
  var SKIP = 'nav, aside, dialog, footer, body > header, [popover], [data-tagaction="off"]';
  var slug = (text) => text.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "section";
  function headingText(heading) {
    const copy2 = heading.cloneNode(true);
    copy2.querySelector('[data-tag="anchor"]')?.remove();
    return copy2.textContent.trim();
  }
  function buildToc(nav) {
    const scope = document.querySelector("main") ?? document.body;
    const headings = [...scope.querySelectorAll("h2, h3")].filter((heading) => !heading.parentElement.closest(SKIP));
    if (!headings.length) return;
    const list = h("ul");
    let sublist = null;
    for (const heading of headings) {
      if (!heading.id) {
        const base = slug(headingText(heading));
        let id = base;
        for (let n = 2; document.getElementById(id); n++) id = `${base}-${n}`;
        heading.id = id;
      }
      const item = h("li");
      item.append(h("a", { href: `#${heading.id}` }, headingText(heading)));
      if (heading.tagName === "H3" && list.lastElementChild) {
        if (!sublist || sublist.parentElement !== list.lastElementChild) list.lastElementChild.append(sublist = h("ul"));
        sublist.append(item);
      } else {
        list.append(item);
        sublist = null;
      }
    }
    nav.append(list);
    if (!nav.hasAttribute("aria-label") && !nav.hasAttribute("aria-labelledby")) nav.setAttribute("aria-label", "On this page");
  }
  function init11(root) {
    each(root, "nav[data-tag-toc]", "toc", buildToc);
    for (const heading of find(root, "h2[id], h3[id]")) {
      if (heading.parentElement.closest(SKIP) || !once(heading, "anchor")) continue;
      heading.append(h("a", { href: `#${heading.id}`, "data-tag": "anchor", "aria-label": `Link to section: ${headingText(heading)}` }, "#"));
    }
  }

  // src/behaviors/nav.js
  var normalize = (url) => url.origin + url.pathname.replace(/\/index\.html?$/, "/").replace(/(.)\/$/, "$1");
  function markCurrentPage(nav) {
    if (nav.querySelector("[aria-current]")) return;
    const here = normalize(location);
    const link = [...nav.querySelectorAll("a[href]")].find((a) => {
      if (a.getAttribute("href").startsWith("#")) return false;
      const url = new URL(a.href);
      return url.protocol.startsWith("http") || url.protocol === "file:" ? normalize(url) === here : false;
    });
    link?.setAttribute("aria-current", "page");
  }
  function followScroll(nav, links) {
    const targets = links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))));
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = innerHeight * 0.25;
      const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
      let active = atBottom ? targets.length - 1 : 0;
      if (!atBottom) targets.forEach((target, i) => {
        if (target.getBoundingClientRect().top <= line) active = i;
      });
      links.forEach((a, i) => {
        if (i === active) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    };
    addEventListener("scroll", () => {
      frame ||= requestAnimationFrame(update);
    }, { passive: true });
    update();
  }
  function init12(root) {
    each(root, "nav", "nav", (nav) => {
      const links = [...nav.querySelectorAll('a[href^="#"]')].filter((a) => a.hash.length > 1 && document.getElementById(decodeURIComponent(a.hash.slice(1))));
      if (links.length >= 2 && links.length === nav.querySelectorAll("a[href]").length) followScroll(nav, links);
      else markCurrentPage(nav);
    });
  }

  // src/behaviors/img.js
  var IMAGE_FILE = /\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i;
  function view(src, image) {
    const dialog = h("dialog", { "data-tag": "viewer", "aria-label": image.alt || "Image" });
    const form = h("form", { method: "dialog" });
    form.append(h("button", { "aria-label": "Close" }, "\u2715"));
    const figure = h("figure");
    figure.append(h("img", { src, alt: image.alt }));
    const caption = image.closest("figure")?.querySelector("figcaption");
    if (caption) figure.append(caption.cloneNode(true));
    dialog.append(form, figure);
    dialog.addEventListener("close", () => dialog.remove());
    dialog.addEventListener("click", (event) => {
      if (event.target.closest("figure, dialog") && event.detail) dialog.close();
    });
    document.body.append(dialog);
    dialog.showModal();
  }
  var shrunk = (image) => image.naturalWidth > image.clientWidth * 1.2 || image.naturalHeight > image.clientHeight * 1.2;
  function init13(root) {
    each(root, "a[href]:has(> img:only-child)", "zoom-link", (link) => {
      if (!IMAGE_FILE.test(new URL(link.href).pathname)) return;
      link.setAttribute("aria-haspopup", "dialog");
      link.addEventListener("click", (event) => {
        if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        view(link.href, link.querySelector("img"));
      });
    });
    each(root, "figure img", "zoom", (image) => {
      if (image.closest("a, button, dialog")) return;
      const setup = () => {
        if (!shrunk(image)) return;
        image.tabIndex = 0;
        image.setAttribute("data-tag", "zoom");
      };
      if (image.complete) setup();
      else image.addEventListener("load", setup, { once: true });
      const open = () => image.dataset.tag === "zoom" && view(image.currentSrc || image.src, image);
      image.addEventListener("click", open);
      image.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
    });
  }

  // src/behaviors/menu.js
  function arrowKeys(container, event, close) {
    const items = focusables(container);
    const index = items.indexOf(document.activeElement);
    let next;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = items[(index + 1) % items.length];
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = items[(index - 1 + items.length) % items.length];
    else if (event.key === "Home") next = items[0];
    else if (event.key === "End") next = items[items.length - 1];
    else if (event.key === "Escape" && close) {
      close(true);
      event.preventDefault();
      return;
    }
    if (!next) return;
    event.preventDefault();
    next.focus();
  }
  function init14(root) {
    each(root, "button[aria-controls][aria-expanded]", "menu", (button) => {
      const list = document.getElementById(button.getAttribute("aria-controls"));
      if (!list || list.closest('[data-tagaction="off"]')) return;
      reveal(button);
      const isOpen = () => button.getAttribute("aria-expanded") === "true";
      const set = (open) => {
        button.setAttribute("aria-expanded", String(open));
        list.hidden = !open;
      };
      const close = (returnFocus) => {
        if (!isOpen()) return;
        set(false);
        if (returnFocus) button.focus();
      };
      if (list.parentElement === button.parentElement && list.closest("nav")) list.setAttribute("data-tag", "dropdown");
      set(isOpen());
      button.addEventListener("click", () => set(!isOpen()));
      button.addEventListener("keydown", (event) => {
        if (event.key === "Escape") close(true);
        if (event.key === "ArrowDown") {
          event.preventDefault();
          set(true);
          focusables(list)[0]?.focus();
        }
      });
      list.addEventListener("keydown", (event) => arrowKeys(list, event, close));
      document.addEventListener("click", (event) => {
        if (isOpen() && !button.contains(event.target) && !list.contains(event.target)) close(false);
      });
      list.addEventListener("focusout", (event) => {
        if (event.relatedTarget && !list.contains(event.relatedTarget) && event.relatedTarget !== button) close(false);
      });
    });
    each(root, "menu, [popover]:has(nav, ul, ol, menu)", "arrows", (container) => {
      container.addEventListener("keydown", (event) => {
        if (event.defaultPrevented || event.target.matches("input, textarea, select")) return;
        arrowKeys(container, event);
      });
    });
  }

  // src/behaviors/output.js
  function valueOf(field) {
    if ((field.type === "checkbox" || field.type === "radio") && !field.checked) return 0;
    return field.value;
  }
  function init15(root) {
    each(root, "output[for]", "output", (output) => {
      const fields = output.getAttribute("for").split(/\s+/).map((id) => document.getElementById(id)).filter(Boolean);
      if (!fields.length) return;
      const update = () => {
        if (fields.length === 1) {
          output.value = valueOf(fields[0]);
          return;
        }
        const total = fields.reduce((sum, field) => sum + (parseFloat(valueOf(field)) || 0), 0);
        output.value = String(Math.round(total * 1e6) / 1e6);
      };
      for (const target of new Set(fields.map((field) => field.form ?? field))) {
        target.addEventListener("input", update);
        target.addEventListener("change", update);
        target.addEventListener("reset", () => setTimeout(update));
      }
      update();
    });
  }

  // src/behaviors/abbr.js
  function init16(root) {
    each(root, "abbr[title]", "abbr", (abbr) => {
      const title = abbr.title.trim();
      if (!title) return;
      abbr.tabIndex = 0;
      let expansion = null;
      const toggle = () => {
        if (expansion) {
          expansion.remove();
          expansion = null;
        } else {
          expansion = h("small", { "data-tag": "abbr" }, ` (${title})`);
          abbr.after(expansion);
        }
      };
      abbr.addEventListener("click", toggle);
      abbr.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggle();
        }
      });
    });
  }

  // src/behaviors/template.js
  var REFERENCES = ["for", "list", "commandfor", "aria-controls", "aria-describedby", "aria-labelledby"];
  function clone(template) {
    const copies = (Number(template.dataset.tagCopies) || 1) + 1;
    template.dataset.tagCopies = copies;
    const fragment = template.content.cloneNode(true);
    const renamed = /* @__PURE__ */ new Map();
    for (const element of fragment.querySelectorAll("[id]")) {
      const id = `${element.id}-${copies}`;
      renamed.set(element.id, id);
      element.id = id;
    }
    for (const element of fragment.querySelectorAll(REFERENCES.map((name) => `[${name}]`).join(","))) {
      for (const name of REFERENCES) {
        const value = element.getAttribute(name);
        if (value) element.setAttribute(name, value.split(/\s+/).map((id) => renamed.get(id) ?? id).join(" "));
      }
    }
    const added = [...fragment.children];
    template.before(fragment);
    added.map((element) => focusables(element)[0] ?? null).find(Boolean)?.focus();
  }
  function init17(root) {
    each(root, 'button[commandfor][command="--clone"]', "clone-button", (button) => {
      if (document.getElementById(button.getAttribute("commandfor"))?.matches("template")) reveal(button);
    });
    if (!once(document, "template")) return;
    document.addEventListener("command", (event) => {
      const template = event.target;
      if (event.command !== "--clone" || !template.matches?.("template") || !find(template, "template").length) return;
      clone(template);
    }, true);
  }

  // src/index.js
  var behaviors = [init, init2, init3, init4, init5, init6, init7, init8, init9, init10, init11, init12, init13, init14, init15, init16, init17];
  var VERSION = "0.1.0";
  function init18(root = document) {
    for (const behavior of behaviors) {
      try {
        behavior(root);
      } catch (error) {
        console.error("TagAction:", error);
      }
    }
  }
  function start() {
    if (document.documentElement.dataset.tagaction === "off") return;
    addStyles();
    init18(document);
    new MutationObserver((records) => {
      const added = /* @__PURE__ */ new Set();
      for (const record of records) {
        for (const node of record.addedNodes) if (node.nodeType === 1) added.add(node);
      }
      for (const node of added) {
        let covered = false;
        for (let parent = node.parentElement; parent && !covered; parent = parent.parentElement) covered = added.has(parent);
        if (!covered && node.isConnected) init18(node);
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
  if (typeof window !== "undefined" && !window.TagAction) {
    window.TagAction = { init: init18, version: VERSION };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
  }
})();
