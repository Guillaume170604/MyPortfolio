// Guillaume Faure — Rapport de test d'intrusion
(function () {
    "use strict";

    const root = document.documentElement;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    /* ---------- Thème ---------- */
    function setTheme(theme) {
        root.dataset.theme = theme;
        try { localStorage.setItem("theme", theme); } catch (e) { /* stockage indisponible */ }
        const meta = $('meta[name="theme-color"]');
        if (meta) meta.content = theme === "dark" ? "#0f1012" : "#ece7db";
    }
    function toggleTheme() {
        setTheme(root.dataset.theme === "dark" ? "light" : "dark");
    }
    $("#theme-toggle").addEventListener("click", toggleTheme);

    /* ---------- Dates ---------- */
    const now = new Date();
    $("#issue-date").textContent = "Émis le " + now.toLocaleDateString("fr-FR");
    $("#year").textContent = now.getFullYear();

    /* ---------- Nom « déchiffré » à l'ouverture ---------- */
    const GLYPHS = "XKZV#$%&?/<>0179";
    function scramble(el, delay) {
        const target = el.dataset.text;
        const start = performance.now() + delay;
        const perChar = 70;
        el.setAttribute("aria-label", target);
        (function frame(t) {
            const solved = Math.max(0, Math.floor((t - start) / perChar));
            let out = "";
            for (let i = 0; i < target.length; i++) {
                out += i < solved ? target[i] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            }
            el.textContent = out;
            if (solved < target.length) requestAnimationFrame(frame);
            else el.textContent = target;
        })(performance.now());
    }
    if (!reducedMotion) {
        $$(".scramble").forEach((el, i) => scramble(el, 150 + i * 350));
    }

    /* ---------- Zones caviardées (tactile) ---------- */
    $$(".redact").forEach((el) => {
        el.addEventListener("click", () => el.classList.toggle("open"));
    });

    /* ---------- Apparition au défilement ---------- */
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("in");
            revealObserver.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach((el) => revealObserver.observe(el));

    /* ---------- Scan nmap ligne par ligne ---------- */
    const scan = $("#scan");
    const scanObserver = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        scanObserver.disconnect();
        $$(".ln", scan).forEach((line, i) => {
            setTimeout(() => line.classList.add("on"), reducedMotion ? 0 : 250 + i * 110);
        });
    }, { threshold: 0.3 });
    scanObserver.observe(scan);

    /* ---------- Rail : phase active + barre de progression ---------- */
    const railLinks = $$(".rail a");
    const phases = railLinks.map((a) => $(a.getAttribute("href")));
    const bar = $("#progress-bar");
    let ticking = false;

    function onScroll() {
        ticking = false;
        const max = root.scrollHeight - innerHeight;
        bar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + "%";

        const probe = innerHeight * 0.4;
        let current = -1;
        phases.forEach((section, i) => {
            if (section.getBoundingClientRect().top <= probe) current = i;
        });
        railLinks.forEach((a, i) => a.classList.toggle("active", i === current));
    }
    addEventListener("scroll", () => {
        if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    addEventListener("resize", onScroll);
    onScroll();

    /* ---------- Terminal ---------- */
    const termBody = $("#term-body");
    const termOut = $("#term-out");
    const termIn = $("#term-in");
    const PROMPT = "visiteur@gf:~$ ";
    const history = [];
    let historyIndex = 0;

    const FILES = {
        "a_propos.txt":
            "Guillaume Faure — Master 1 Informatique, Université Côte d'Azur.\n" +
            "Alternant chez PRO BTP (gestion des identités et habilitations).\n" +
            "En constante recherche de savoir.",
        "competences.txt":
            "offensif   : Metasploit, Burp Suite, Nmap, Hydra, John the Ripper\n" +
            "défensif   : Wireshark, SOC niveau 1\n" +
            "identités  : Active Directory, Azure Entra ID, PKI\n" +
            "dev        : Python, Java, C/C++, AutoIt, HTML/CSS/JS",
        "contact.txt":
            "mail   : faureliffran.guillaume@gmail.com\n" +
            "github : https://github.com/Guillaume170604",
        ".flag":
            "GF{c3lu1_qu1_ch3rch3_tr0uv3}\n" +
            "Bien joué. Si tu as lu jusqu'ici, on devrait se parler : tape « contact »."
    };

    function print(text, cls) {
        const line = document.createElement("div");
        line.className = cls || "res";
        line.textContent = text;
        termOut.appendChild(line);
    }

    const COMMANDS = {
        help() {
            print(
                "Commandes disponibles :\n" +
                "  whoami      qui êtes-vous ?\n" +
                "  ls [-a]     lister les fichiers\n" +
                "  cat <f>     lire un fichier\n" +
                "  cv          télécharger le CV\n" +
                "  contact     écrire à Guillaume\n" +
                "  theme       changer de thème\n" +
                "  clear       effacer l'écran"
            );
        },
        whoami() { print("visiteur — mais peut-être bientôt « recruteur » ?"); },
        id() { print("uid=1001(visiteur) gid=1001(visiteurs) groupes=1001(visiteurs),4242(curieux)"); },
        pwd() { print("/home/visiteur"); },
        ls(args) {
            const all = args.some((a) => /^-\w*a/.test(a));
            const names = Object.keys(FILES).filter((n) => all || !n.startsWith("."));
            print(names.sort().join("   "));
        },
        cat(args) {
            if (!args.length) return print("cat : il manque un nom de fichier", "err");
            args.forEach((name) => {
                const key = name.replace(/^\.\//, "");
                if (Object.prototype.hasOwnProperty.call(FILES, key)) {
                    print(FILES[key], key === ".flag" ? "flag" : "res");
                } else {
                    print("cat : " + name + " : aucun fichier de ce type", "err");
                }
            });
        },
        cv() {
            print("Téléchargement de Guillaume_FAURE_CV.pdf…");
            const a = document.createElement("a");
            a.href = "Guillaume_FAURE_CV.pdf";
            a.download = "";
            document.body.appendChild(a);
            a.click();
            a.remove();
        },
        contact() {
            print("Ouverture de votre messagerie…");
            location.href = "mailto:faureliffran.guillaume@gmail.com";
        },
        theme() {
            toggleTheme();
            print("Thème : " + (root.dataset.theme === "dark" ? "nuit" : "jour"));
        },
        sudo() { print("visiteur n'est pas dans le fichier sudoers. Cet incident sera signalé.", "err"); },
        nmap() { print("Déjà fait : voir la phase 02, plus haut."); },
        exit() { print("On ne quitte pas un rapport avant la recommandation finale."); },
        clear() { termOut.textContent = ""; }
    };

    function run(raw) {
        const input = raw.trim();
        print(PROMPT + input, "cmd");
        if (!input) return;
        history.push(input);
        historyIndex = history.length;
        const [name, ...args] = input.split(/\s+/);
        const command = Object.prototype.hasOwnProperty.call(COMMANDS, name) ? COMMANDS[name] : null;
        if (command) command(args);
        else print(name + " : commande introuvable — essayez « help »", "err");
    }

    termIn.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            run(termIn.value);
            termIn.value = "";
            termBody.scrollTop = termBody.scrollHeight;
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            if (!history.length) return;
            e.preventDefault();
            historyIndex += e.key === "ArrowUp" ? -1 : 1;
            historyIndex = Math.max(0, Math.min(history.length, historyIndex));
            termIn.value = history[historyIndex] || "";
        } else if (e.key === "l" && e.ctrlKey) {
            e.preventDefault();
            COMMANDS.clear();
        }
    });
    termBody.addEventListener("click", () => {
        if (!String(getSelection())) termIn.focus({ preventScroll: true });
    });

    print("Accès obtenu. Bienvenue sur la machine de Guillaume.");
    print("Tapez « help » pour la liste des commandes.");

    /* ---------- Pour celles et ceux qui ouvrent la console ---------- */
    console.log(
        "%c GF %c Tu inspectes la console ? Bon réflexe.\nIl y a un flag caché dans le terminal en bas de page : ls -a",
        "background:#d42a1c;color:#fff;font-weight:700;padding:2px 4px",
        "color:inherit"
    );
})();
