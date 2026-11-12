// Guillaume Faure : qui a accès à quoi.
(function () {
    "use strict";

    const SVG_NS = "http://www.w3.org/2000/svg";
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    const year = $("#year");
    if (year) year.textContent = new Date().getFullYear();

    /* ---------- Graphe d'accès ---------- */
    const graph = $("#graph");
    const wires = $("#wires");
    const caption = $("#graph-caption");
    if (!graph || !wires) return;

    const me = $("#node-me");
    const groups = $$(".node-group", graph);
    const rights = $$(".node-right", graph);
    const rightById = new Map(rights.map((el) => [el.dataset.id, el]));
    const grantsOf = (g) => g.dataset.grants.split(/\s+/).filter(Boolean);
    if (matchMedia("(hover: none)").matches) {
        caption.textContent = "Touchez un groupe pour voir les droits qu'il m'a donnés.";
    }
    const defaultCaption = caption.textContent.trim();

    // Les arêtes : moi → groupe, puis groupe → droit.
    const edges = [];
    groups.forEach((g) => {
        edges.push({ from: me, to: g, group: g.dataset.id, right: null, stage: 0 });
        grantsOf(g).forEach((id) => {
            const r = rightById.get(id);
            if (r) edges.push({ from: g, to: r, group: g.dataset.id, right: id, stage: 1 });
        });
    });
    edges.forEach((edge, i) => {
        edge.path = document.createElementNS(SVG_NS, "path");
        edge.path.setAttribute("pathLength", "1");
        edge.path.style.setProperty("--stage", edge.stage);
        edge.path.style.setProperty("--i", i % 12);
        wires.appendChild(edge.path);
    });

    function layout() {
        const box = graph.getBoundingClientRect();
        wires.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
        edges.forEach((edge) => {
            const a = edge.from.getBoundingClientRect();
            const b = edge.to.getBoundingClientRect();
            const x1 = a.right - box.left;
            const y1 = a.top + a.height / 2 - box.top;
            const x2 = b.left - box.left + (edge.right ? 4.5 : 0);
            const y2 = b.top + b.height / 2 - box.top;
            const dx = (x2 - x1) / 2;
            edge.path.setAttribute("d", `M${x1} ${y1}C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`);
        });
    }

    function clear() {
        graph.classList.remove("has-active");
        $$(".lit", graph).forEach((el) => el.classList.remove("lit"));
        caption.textContent = defaultCaption;
    }

    function activateGroup(g) {
        clear();
        graph.classList.add("has-active");
        g.classList.add("lit");
        const granted = grantsOf(g);
        granted.forEach((id) => rightById.get(id).classList.add("lit"));
        edges.forEach((e) => e.path.classList.toggle("lit", e.group === g.dataset.id));
        caption.textContent = g.dataset.caption;
    }

    function activateRight(r) {
        clear();
        graph.classList.add("has-active");
        r.classList.add("lit");
        const via = groups.filter((g) => grantsOf(g).includes(r.dataset.id));
        via.forEach((g) => g.classList.add("lit"));
        const viaIds = via.map((g) => g.dataset.id);
        edges.forEach((e) => {
            const lit = e.right === r.dataset.id || (e.right === null && viaIds.includes(e.group));
            e.path.classList.toggle("lit", lit);
        });
        const names = via.map((g) => $(".node-title", g).textContent);
        caption.textContent = r.textContent + ", obtenu via " + names.join(" et ") + ".";
    }

    groups.forEach((g) => {
        g.addEventListener("mouseenter", () => activateGroup(g));
        g.addEventListener("focus", () => activateGroup(g));
        if (g.tagName === "BUTTON") g.addEventListener("click", () => activateGroup(g));
    });
    rights.forEach((r) => r.addEventListener("mouseenter", () => activateRight(r)));
    graph.addEventListener("mouseleave", clear);
    graph.addEventListener("focusout", (e) => {
        if (!graph.contains(e.relatedTarget)) clear();
    });

    layout();
    wires.classList.add("draw");
    addEventListener("resize", layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    if ("ResizeObserver" in window) new ResizeObserver(layout).observe(graph);

    /* ---------- Pour celles et ceux qui ouvrent la console ---------- */
    window.whoami = function () {
        console.log("visiteur, membre de : curieux\nFlag : GF{c3lu1_qu1_ch3rch3_tr0uv3}\nOn devrait se parler : faureliffran.guillaume@gmail.com");
        return "GF{c3lu1_qu1_ch3rch3_tr0uv3}";
    };
    console.log(
        "%c GF %c Tu inspectes la console ? Bon réflexe. Tape whoami()",
        "background:#2b3fe0;color:#ffd23f;font-weight:700;padding:2px 4px",
        "color:inherit"
    );
})();
