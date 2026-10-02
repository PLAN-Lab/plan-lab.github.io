/* PLAN Lab guideline checker 
 *
 * To add dataset/benchmark names that must be wrapped in \textsc{}, edit
 * EXTRA_DATASETS below (one string per name). A datasets.txt at the root of an
 * uploaded source zip is also honored, same as the CLI tool.
 */
(function (global) {
  "use strict";

  var SEV_ERROR = "ERROR", SEV_WARN = "WARN", SEV_INFO = "INFO";

  /* ------------------------------------------------------------------ paths */
  function normPath(p) {
    var parts = p.split("/");
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var s = parts[i];
      if (s === "" || s === ".") continue;
      if (s === "..") { if (out.length && out[out.length - 1] !== "..") out.pop(); else out.push(".."); }
      else out.push(s);
    }
    return out.join("/") || ".";
  }
  function dirname(p) { var i = p.lastIndexOf("/"); return i < 0 ? "" : p.slice(0, i); }
  function basename(p) { var i = p.lastIndexOf("/"); return i < 0 ? p : p.slice(i + 1); }
  function joinPath(a, b) { return normPath(a === "" || a === "." ? b : a + "/" + b); }
  function underDir(p, dir) {
    if (dir === "" || dir === ".") return true;
    return p === dir || p.indexOf(dir + "/") === 0;
  }
  function relTo(p, root) {
    if (root === "" || root === ".") return p;
    if (p === root) return basename(p);
    if (p.indexOf(root + "/") === 0) return p.slice(root.length + 1);
    return p;
  }

  /* --------------------------------------------------- comment stripping */
  function stripComment(line) {
    var out = [], i = 0;
    while (i < line.length) {
      var c = line[i];
      if (c === "\\" && i + 1 < line.length) { out.push(line.slice(i, i + 2)); i += 2; continue; }
      if (c === "%") return [out.join(""), line.slice(i + 1)];
      out.push(c); i += 1;
    }
    return [out.join(""), null];
  }

  var SKIP_DIR_SEGS = [".git", "_build", "oldversions", "old", "reports"];
  var SKIP_FILE = /(_old|_Old|_mid|_backup|_bak|_v\d+|copy)\.(tex|bib)$/i;

  function inSkippedDir(path) {
    var segs = dirname(path).split("/");
    for (var i = 0; i < segs.length; i++) if (SKIP_DIR_SEGS.indexOf(segs[i]) >= 0) return true;
    return false;
  }

  function Reporter() { this.items = []; }
  Reporter.prototype.add = function (file, line, sev, rule, msg, snippet) {
    this.items.push({
      file: file, line: line, severity: sev, rule: rule, message: msg,
      snippet: (snippet || "").trim().slice(0, 160),
    });
  };
  Reporter.prototype.counts = function () {
    var c = {};
    this.items.forEach(function (it) { c[it.severity] = (c[it.severity] || 0) + 1; });
    return c;
  };

  /* ------------------------------------------------------------ rule tables */
  var PAST_WE = /\bwe\s+(introduced|proposed|presented|evaluated|trained|developed|designed|showed|demonstrated|achieved|conducted|performed|observed|obtained|used|implemented|built|created|curated|collected|tested|analyzed|compared|investigated|explored|reported|found)\b/i;
  var PASSIVE_VERBS = /\b(is|are|was|were|be|been|being)\s+(evaluated|trained|proposed|presented|introduced|designed|developed|computed|measured|conducted|performed|obtained|achieved|tested|compared|reported|implemented|built|used|shown|given|defined)\b/i;
  var AUTHORS_PAST = /\bthe\s+authors\s+(propose|proposed|present|presented|introduce|introduced)\b/i;
  var HARDREF = /(?<!\\)\b(Section|Sec\.|Sections|Figure|Fig\.|Figures|Table|Tables|Equation|Eq\.|Eqs\.|Eqn\.|Appendix|Algorithm|Alg\.)\s*~?\(?\s*\d/i;
  var CREF_OK = /\\[A-Za-z]*ref\b|\\autoref|\\cref|\\Cref/;
  var RASTER = /\\includegraphics(?:\[[^\]]*\])?\{[^}]*\.(png|jpe?g|bmp|gif|tiff?)\b/i;
  var OUR_MODEL = /\bour\s+(model|method|approach|network|framework|system|architecture|pipeline|algorithm)\b/i;
  var LITERAL_EG = /(?<!\\eg)(?<![A-Za-z])\b(e\.g\.|i\.e\.|etc\.)(?![A-Za-z])/;
  var EG_MACRO_CONTEXT = /\\(eg|ie|etc|cf|vs|wo)\b/;

  var FILLER = [
    [/\bin this (section|paper|subsection),?\s+we\s+(describe|present|introduce|discuss|now)\b/i,
      "Filler lead-in; state the content directly."],
    [/\bwe now (describe|present|introduce|discuss|turn)\b/i,
      "Filler lead-in; remove."],
    [/\bwe hope (this|that|our)\b/i,
      "Banned conclusion phrase ('we hope this inspires\u2026')."],
    [/\bfirst step toward(s)?\b/i,
      "Banned phrase ('this is the first step toward\u2026')."],
  ];
  var VAGUE = [
    [/\bwe provide insights?\b/i, "Vague contribution; be specific and measurable."],
    [/\bwe improve understanding\b/i, "Vague contribution; be specific and measurable."],
    [/\bperforms? well\b/i, "Weak claim; report a precise relative gain instead."],
  ];
  var INTENSIFIERS = /(?<![A-Za-z])(very|really|basically|essentially|quite|actually|simply|just|extremely)(?![A-Za-z])/i;
  var STRAIGHT_QUOTES = /"[^"\n]{1,80}"/;
  var FLOAT_OPEN = /\\begin\{(table|figure|table\*|figure\*)\}(\[[^\]]*\])?/;
  var BIBITEM = /\\bibitem\b/;
  var CAPTION_OPEN = /\\caption\*?\{\s*(\S.{0,12})/;

  var DEFAULT_DATASETS = [
    "ImageNet", "COCO", "MS-COCO", "RefCOCO", "RefCOCOg", "VQA", "VQAv2", "GQA",
    "CLEVR", "Visual Genome", "Flickr30k", "CIFAR", "CIFAR-10", "CIFAR-100",
    "MNIST", "ADE20K", "Cityscapes", "LVIS", "Objects365", "Kinetics",
    "ActivityNet", "UCF101", "HMDB51", "MSR-VTT", "WebVid", "LAION", "CC3M",
    "CC12M", "ScienceQA", "TextVQA", "OK-VQA", "OKVQA", "DocVQA", "ChartQA",
    "MMBench", "SEED-Bench", "POPE", "MMMU", "MathVista", "GRIT", "VCR",
    "NoCaps", "nuScenes", "KITTI", "Waymo", "MoveBench", "DAVIS", "Charades",
    "AGQA", "Something-Something", "GRIT-Bench", "GraphVid-Bench",
  ];
  // Lab-specific additions (mirrors the CLI's datasets.txt). Edit freely.
  var EXTRA_DATASETS = [
    "GraphVid-Bench",
    "MoveBench",
  ];

  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\\-]/g, "\\$&"); }
  function buildDatasetRe(names) {
    if (!names || !names.length) return null;
    var sorted = names.slice().sort(function (a, b) { return b.length - a.length; });
    var alt = sorted.map(escRe).join("|");
    return new RegExp("(?<![\\w\\-/])(" + alt + ")(?![\\w])", "g");
  }

  var PROTECTED_RE = /\\(?:textsc|cite[a-z]*|label|[cC]ref|autoref|eqref|ref|url|href|texttt|lstinline|path|includegraphics|input|begin|end)\s*(?:\[[^\]]*\])?\{[^}]*\}/g;
  function stripProtected(s) { return s.replace(PROTECTED_RE, " "); }

  var INSTRUCTIONAL_MARKERS = [
    "this planning guide", "required structure and expectations",
    "recommended method structure", "recommended experiments structure",
    "tips and style guidelines", "introduction structure",
    "appendix instructions", "final checklist for all submissions",
    "required materials for submissions",
  ];
  function looksLikeTemplate(text) {
    var low = text.toLowerCase();
    return INSTRUCTIONAL_MARKERS.some(function (m) { return low.indexOf(m) >= 0; });
  }


  /* -------------------------------------------------------------- .tex check */
  var VERBATIM_ENVS = ["lstlisting", "verbatim", "Verbatim", "minted", "comment", "lstinputlisting"];
  var VERB_OPEN = new RegExp("\\\\begin\\{(" + VERBATIM_ENVS.join("|") + ")\\}");
  var VERB_CLOSE = new RegExp("\\\\end\\{(" + VERBATIM_ENVS.join("|") + ")\\}");
  var SUBCAP_ENVS = ["subfigure", "subtable", "minipage"];
  var SUBCAP_OPEN = new RegExp("\\\\begin\\{(" + SUBCAP_ENVS.join("|") + ")\\}", "g");
  var SUBCAP_CLOSE = new RegExp("\\\\end\\{(" + SUBCAP_ENVS.join("|") + ")\\}", "g");
  var SUBCAP_OPEN1 = new RegExp("\\\\begin\\{(" + SUBCAP_ENVS.join("|") + ")\\}");

  function countMatches(re, s) { var m = s.match(re); return m ? m.length : 0; }

  function checkTex(path, raw, rep, opts) {
    opts = opts || {};
    if (!opts.includeTemplate && looksLikeTemplate(raw)) {
      rep.add(path, 0, SEV_INFO, "skip",
        "Looks like the instructional template guide; skipped " +
        "(use --include-template to lint it).");
      return;
    }
    var lines = raw.split(/\r?\n/);
    var inAbstract = false, abstractOpenLine = null;
    var abstractHasUrl = false, abstractHasPlanlink = false, abstractHasLogo = false;
    var abstractPlanSlugs = [];
    var mathBoldCmds = {}, mathMacroSeen = {};
    var inVerbatim = false, subcapDepth = 0;

    for (var idx = 0; idx < lines.length; idx++) {
      var n = idx + 1, line = lines[idx];
      if (inVerbatim) { if (VERB_CLOSE.test(line)) inVerbatim = false; continue; }
      if (VERB_OPEN.test(line)) { inVerbatim = true; continue; }

      var sc = stripComment(line), code = sc[0], comment = sc[1];

      var subcapHere = subcapDepth > 0 || SUBCAP_OPEN1.test(code);
      subcapDepth += countMatches(SUBCAP_OPEN, code) - countMatches(SUBCAP_CLOSE, code);
      if (subcapDepth < 0) subcapDepth = 0;

      if (comment !== null) {
        var csl = comment.trim();
        if (/\\(includegraphics|input|begin\{(table|figure)\}|cite[a-z]*\{|section\{)/.test(csl)) {
          rep.add(path, n, SEV_WARN, "commented-out",
            "Commented-out content (figure/table/input/cite/section). " +
            "Remove before submission \u2014 arXiv source must not leak it.", csl);
        }
      }

      var stripped = code.trim();
      if (!stripped) continue;

      if (/\\begin\{abstract\}/.test(code)) {
        inAbstract = true; abstractOpenLine = n;
        abstractHasUrl = false; abstractHasPlanlink = false; abstractHasLogo = false;
        abstractPlanSlugs = [];
      }
      if (/\\end\{abstract\}/.test(code)) {
        inAbstract = false;
        if (opts.cameraReady && !abstractHasUrl) {
          rep.add(path, abstractOpenLine || n, SEV_WARN, "abstract-url",
            "Camera-ready: abstract should end with the project-page URL " +
            "(e.g. https://plan-lab.github.io/MODELNAME).");
        }
        if (opts.cameraReady) {
          var al = abstractOpenLine || n;
          if (!abstractHasPlanlink) {
            rep.add(path, al, SEV_WARN, "planlab-link",
              "Camera-ready: the abstract is missing the PLAN Lab " +
              "project-page link (https://plan-lab.github.io/MODELNAME).");
          }
          if (!abstractHasLogo) {
            rep.add(path, al, SEV_WARN, "planlab-logo",
              "Camera-ready: the abstract is missing the PLAN Lab logo " +
              "(\\logoicon / plan_logo.pdf).");
          }
          var uniq = Array.from(new Set(abstractPlanSlugs));
          if (uniq.length > 1) {
            rep.add(path, al, SEV_WARN, "planlab-slug",
              "PLAN Lab project-page slugs disagree in the abstract: " +
              uniq.sort().join(", ") + ". Use one MODELNAME consistently.");
          }
        }
      }

      var m;
      if ((m = PAST_WE.exec(code))) {
        rep.add(path, n, SEV_ERROR, "voice/tense",
          "Past tense '" + m[0] + "'. Use plural active voice " +
          "('We introduce\u2026').", line);
      }
      if (AUTHORS_PAST.test(code)) {
        rep.add(path, n, SEV_WARN, "voice/tense",
          "'The authors proposed\u2026'. Refer to prior work actively: " +
          "'Prior work proposes\u2026 \\cite{}'.", line);
      }
      if ((m = PASSIVE_VERBS.exec(code))) {
        rep.add(path, n, SEV_WARN, "voice/passive",
          "Likely passive voice '" + m[0] + "'. Prefer active " +
          "('We evaluate\u2026').", line);
      }

      if ((m = HARDREF.exec(code)) && !CREF_OK.test(code)) {
        rep.add(path, n, SEV_ERROR, "cref",
          "Hardcoded reference '" + m[0].trim() + "\u2026'. Use " +
          "\\cref{}/\\Cref{} instead.", line);
      }

      if ((m = RASTER.exec(code))) {
        rep.add(path, n, SEV_ERROR, "raster-figure",
          "Raster image '." + m[1] + "'. Use vector graphics " +
          "(.pdf/.svg); never .png/.jpg.", line);
      }

      if ((m = OUR_MODEL.exec(code))) {
        rep.add(path, n, SEV_WARN, "name-macro",
          "'" + m[0] + "'. Refer to your method by its name macro " +
          "(\\modelnamenc), not 'our {\u2026}'.", line);
      }

      if ((m = LITERAL_EG.exec(code)) && !EG_MACRO_CONTEXT.test(code)) {
        rep.add(path, n, SEV_WARN, "abbrev-macro",
          "Literal '" + m[0] + "'. Use macros \\eg \\ie \\etc.", line);
      }

      for (var fi = 0; fi < FILLER.length; fi++) {
        if (FILLER[fi][0].test(code)) { rep.add(path, n, SEV_WARN, "filler", FILLER[fi][1], line); break; }
      }
      for (var vi = 0; vi < VAGUE.length; vi++) {
        if (VAGUE[vi][0].test(code)) { rep.add(path, n, SEV_WARN, "vague-claim", VAGUE[vi][1], line); break; }
      }

      var mi = INTENSIFIERS.exec(code);
      if (mi) {
        rep.add(path, n, SEV_INFO, "intensifier",
          "Filler word '" + mi[0] + "'. Consider deleting.", line);
      }

      var mmRe = /\\mathbb\{([ERPNZQ])\}/g, mm;
      while ((mm = mmRe.exec(code))) {
        var sym = mm[1];
        if (!mathMacroSeen[sym]) {
          mathMacroSeen[sym] = true;
          rep.add(path, n, SEV_INFO, "math-macro",
            "Raw \\mathbb{" + sym + "} \u2014 use the lab macro (\\E, \\R, \\P, " +
            "\\bb " + sym + "); don't redefine template math.", line);
        }
      }
      if (/\\mathcal\{L\}/.test(code) && !mathMacroSeen["L"]) {
        mathMacroSeen["L"] = true;
        rep.add(path, n, SEV_INFO, "math-macro",
          "Raw \\mathcal{L} for a loss \u2014 use the lab \\loss macro.", line);
      }
      if (/\\mathbf\b/.test(code)) mathBoldCmds["mathbf"] = true;
      if (/\\bm\b|\\boldsymbol\b/.test(code)) mathBoldCmds["bm"] = true;

      if (STRAIGHT_QUOTES.test(code) && code.indexOf("\\lstinline") < 0) {
        rep.add(path, n, SEV_WARN, "quotes",
          "Straight double quotes \"...\". Use \\dq{...} (or ``...'').", line);
      }

      var mf = FLOAT_OPEN.exec(code);
      if (mf) {
        var placement = mf[2];
        if (placement == null || placement.indexOf("t") < 0) {
          rep.add(path, n, SEV_WARN, "float-top",
            "\\begin{" + mf[1] + "}" + (placement || "") + ": place floats " +
            "at top with [t!].", line);
        } else if (placement !== "[t!]") {
          rep.add(path, n, SEV_INFO, "float-top",
            "\\begin{" + mf[1] + "}" + placement + ": lab convention is " +
            "[t!] (forces top). The full-width first-page teaser may " +
            "keep [t] \u2014 use judgment.", line);
        }
      }

      if (opts.datasetRe) {
        var seen = {}, dm;
        opts.datasetRe.lastIndex = 0;
        var protectedCode = stripProtected(code);
        while ((dm = opts.datasetRe.exec(protectedCode))) {
          var name = dm[1];
          if (seen[name]) continue;
          seen[name] = true;
          rep.add(path, n, SEV_WARN, "textsc-dataset",
            "Dataset name '" + name + "' should be wrapped in \\textsc{}.", line);
        }
      }

      var mc = CAPTION_OPEN.exec(code);
      if (mc && !subcapHere) {
        var head = mc[1].replace(/^\s+/, "");
        if (head.indexOf("\\textbf") !== 0 && head.indexOf("\\textsc") !== 0) {
          rep.add(path, n, SEV_INFO, "caption-leadin",
            "Caption should start with a bold Title Case lead-in: " +
            "\\caption{\\textbf{...}}.", line);
        }
      }

      if (BIBITEM.test(code)) {
        rep.add(path, n, SEV_ERROR, "bibtex",
          "\\bibitem found. Never write bibliography manually; use BibTeX.", line);
      }

      if (inAbstract) {
        if (/\\url\{|\\href\{|https?:\/\/|plan-lab\.github\.io/.test(code)) abstractHasUrl = true;
        if (/plan-lab\.github\.io/.test(code)) {
          abstractHasPlanlink = true;
          var sm, slugRe = /plan-lab\.github\.io\/([A-Za-z0-9._-]+)/g;
          while ((sm = slugRe.exec(code))) abstractPlanSlugs.push(sm[1]);
        }
        if (/\\logoicon|plan_logo/.test(code)) abstractHasLogo = true;
        if (/\\cite[a-z]*\{/.test(code)) {
          rep.add(path, n, SEV_ERROR, "abstract",
            "Citation in abstract. The abstract must not cite.", line);
        }
      }

      var dmk = /\\(todo|il|new)\{/.exec(code);
      if (dmk) {
        rep.add(path, n, SEV_INFO, "draft-marker",
          "Drafting macro \\" + dmk[1] + "{} present. Remove before submission.", line);
      }
    }

    if (Object.keys(mathBoldCmds).length > 1) {
      rep.add(path, 0, SEV_WARN, "math-bold-mixed",
        "Mixed bold commands for math (\\mathbf and \\bm/\\boldsymbol). " +
        "Use one consistently for vectors/matrices.");
    }
  }

  /* -------------------------------------------------------------- .bib check */
  var ENTRY_RE = /@(\w+)\s*\{\s*([^,\s]+)/i;

  function checkBib(path, raw, rep) {
    var lines = raw.split(/\r?\n/);
    var keys = {};
    for (var idx = 0; idx < lines.length; idx++) {
      var n = idx + 1, line = lines[idx];
      var m = ENTRY_RE.exec(line);
      if (m) {
        var etype = m[1].toLowerCase(), key = m[2];
        if (etype === "misc") {
          var body = [line], j = n;
          while (j < lines.length && lines[j].replace(/^\s+/, "").indexOf("@") !== 0) {
            body.push(lines[j]); j += 1;
          }
          var bodyTxt = body.join("\n");
          var looksLikePaper =
            /^\s*(journal|eprint|archiveprefix|primaryclass|booktitle|doi)\s*=/im.test(bodyTxt) ||
            /arxiv\.org\/abs|arxiv\s*preprint|arxiv:\s*\d/i.test(bodyTxt);
          if (looksLikePaper) {
            rep.add(path, n, SEV_WARN, "bib-misc",
              "@misc{" + key + "} looks like a paper (has a journal/arXiv/" +
              "booktitle/doi field). Use @article/@inproceedings; reserve " +
              "@misc for blogs, links, and model cards.", line);
          }
        }
        if (etype === "string") {
          // fall through to the arXiv line check below, same as the CLI
        } else if (Object.prototype.hasOwnProperty.call(keys, key)) {
          rep.add(path, n, SEV_ERROR, "bib-dup",
            "Duplicate BibTeX key '" + key + "' (also line " + keys[key] + "). " +
            "Keys must be unique.", line);
        } else {
          keys[key] = n;
        }
      }
      if (/journal\s*=\s*\{?\s*(arxiv|corr|arxiv preprint)/i.test(line)) {
        var k = n - 2, entryStart = null;
        while (k >= 0) {
          if (ENTRY_RE.test(lines[k])) { entryStart = k; break; }
          k -= 1;
        }
        var checked = false;
        if (entryStart !== null && entryStart - 1 >= 0) {
          var prev = lines[entryStart - 1].trim().toLowerCase();
          checked = prev.indexOf("%") === 0 && (
            prev.indexOf("published at") >= 0 || prev.indexOf("check online") >= 0 ||
            prev.indexOf("no published version") >= 0);
        }
        if (!checked) {
          rep.add(path, n, SEV_INFO, "bib-arxiv",
            "arXiv/CoRR entry \u2014 check online whether it has a published " +
            "version and cite that.", line);
        }
      }
    }
  }

  /* -------------------------------------------------------------- extras */
  var TC_SMALL = { a: 1, an: 1, and: 1, as: 1, at: 1, but: 1, by: 1, for: 1, from: 1, in: 1, into: 1, nor: 1, of: 1, on: 1, onto: 1, or: 1, over: 1, per: 1, the: 1, to: 1, up: 1, via: 1, vs: 1, with: 1, within: 1, without: 1 };
  var METRICS = ["FID", "FVD", "PSNR", "SSIM", "LPIPS", "IoU", "mIoU", "Dice", "EPE", "BLEU", "CIDEr", "ROUGE", "METEOR", "mAP", "AP", "Recall", "Precision", "Acc", "Accuracy", "F1"];
  var HEADING_RE = /\\(?:sub)*section\*?\{([^}]*)\}/g;
  var STRIP_CMD_RE = /\\[a-zA-Z]+\s*(?:\[[^\]]*\])?\{([^{}]*)\}/;
  var TABULAR_RE = /\\begin\{tabular\}\s*(?:\[[^\]]*\])?\{([^}]*)\}/g;
  var FLOAT_BEGIN_RE = /\\begin\{(figure\*?|table\*?)\}/g;
  var LABEL_KIND_RE = /\\label\{(fig|tab):([^}]+)\}/;
  var CITE_RE = /\\(?:cite[a-zA-Z]*|[Cc]ref)\*?\s*(?:\[[^\]]*\])?\{([^}]+)\}/g;
  var METRIC_RES = METRICS.map(function (t) { return new RegExp("(?<![A-Za-z])" + escRe(t) + "(?![A-Za-z])"); });

  function stripForTitlecase(t) {
    var prev = null;
    while (prev !== t) { prev = t; t = t.replace(STRIP_CMD_RE, "$1"); }
    return t.replace(/\$[^$]*\$/g, " ");
  }
  function titleCaseViolation(title) {
    var words = stripForTitlecase(title).split(/[\s/\u2013\u2014-]+/).filter(Boolean);
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (!/^[A-Za-z]{4,}$/.test(w)) continue;
      if (TC_SMALL[w.toLowerCase()]) continue;
      if (w[0] === w[0].toLowerCase()) return w;
    }
    return null;
  }

  function checkExtras(usedTex, allFiles, fs, root, rep) {
    // cite numbers from a compiled .aux at the paper root (best effort)
    var citeNums = {};
    var auxCands = [];
    var rootMainAux = joinPath(root, "main.aux");
    if (fs[rootMainAux] !== undefined) auxCands.push(rootMainAux);
    Object.keys(fs).sort().forEach(function (p) {
      if (dirname(p) === (root === "" ? "" : normPath(root)) && /\.aux$/.test(p)) auxCands.push(p);
    });
    auxCands.forEach(function (p) {
      var txt = fs[p];
      if (typeof txt !== "string") return;
      var re = /\\bibcite\{([^}]+)\}\{\{?(\d+)/g, m;
      while ((m = re.exec(txt))) {
        if (!(m[1] in citeNums)) citeNums[m[1]] = parseInt(m[2], 10);
      }
    });

    usedTex.forEach(function (f) {
      var raw = fs[f];
      if (typeof raw !== "string") return;
      var base = basename(f).replace(/\.[^.]*$/, "");
      var isMethod = /\\section\*?\{[^}]*Method/.test(raw) || base.toLowerCase().indexOf("method") >= 0;
      var floatCount = 0;
      var floatLines = [];
      var flagged = { nicetab: false, vrule: false, arrow: false, hyper: false };
      var soleLabel = null;

      var lines = raw.split(/\r?\n/);
      for (var idx = 0; idx < lines.length; idx++) {
        var n = idx + 1, line = lines[idx];
        var code = stripComment(line)[0];
        if (!code.trim()) continue;

        if (code.indexOf("[IL:") >= 0) {
          rep.add(f, n, SEV_WARN, "placeholder",
            "Leftover \\[IL: ...] note. Fill in or remove before submission.", line);
        }
        if (/\\titlerunning\{Abbreviated paper title\}/.test(code)) {
          rep.add(f, n, SEV_WARN, "placeholder",
            "Template \\titlerunning placeholder ('Abbreviated paper title').", line);
        }
        if (code.indexOf("Confidential. Do not distribute.") >= 0) {
          rep.add(f, n, SEV_WARN, "placeholder",
            "Template footer 'Confidential. Do not distribute.' left in.", line);
        }
        if (/\\lipsum|Lorem ipsum/.test(code)) {
          rep.add(f, n, SEV_WARN, "placeholder", "Lorem-ipsum filler text left in.", line);
        }

        HEADING_RE.lastIndex = 0;
        var hm;
        while ((hm = HEADING_RE.exec(code))) {
          var bad = titleCaseViolation(hm[1]);
          if (bad) {
            rep.add(f, n, SEV_INFO, "section-titlecase",
              "Section title not Title Case (\u2018" + bad + "\u2019 should be capitalized).",
              line);
          }
        }

        if (isMethod && !flagged.hyper &&
          /learning rate of\s*\$?\d|\blr\s*=|\b\d+\s+epochs\b|batch size of\s*\d|weight decay of\s*\$?\d|\b\d\s*\\times\s*10\^|\b\d+e-\d/.test(code)) {
          rep.add(f, n, SEV_INFO, "hyperparam-in-method",
            "Hyperparameter value in the Method. Define it here but defer the exact " +
            "value/schedule to the Appendix Implementation Details.", line);
          flagged.hyper = true;
        }

        if (code.indexOf("\\begin{tabular}") >= 0 && !flagged.nicetab) {
          rep.add(f, n, SEV_INFO, "table-style",
            "Use \\NiceTabular (lab style) instead of plain tabular.", line);
          flagged.nicetab = true;
        }
        TABULAR_RE.lastIndex = 0;
        var tm;
        while ((tm = TABULAR_RE.exec(code))) {
          if (tm[1].indexOf("|") >= 0 && !flagged.vrule) {
            rep.add(f, n, SEV_INFO, "table-vrules",
              "Vertical borders in the column spec. Limit vertical rules (booktabs style).",
              line);
            flagged.vrule = true;
          }
        }
        if ((code.split("&").length - 1) >= 2 && !flagged.arrow) {
          var hasMetric = METRIC_RES.some(function (re) { return re.test(code); });
          if (hasMetric && !/\\uparrow|\\downarrow|\u2191|\u2193|\(\\?[ud]/.test(code)) {
            rep.add(f, n, SEV_INFO, "metric-arrows",
              "Metric column without a direction arrow. Add (\u2191)/(\u2193) " +
              "next to each metric.", line);
            flagged.arrow = true;
          }
        }

        if (Object.keys(citeNums).length) {
          CITE_RE.lastIndex = 0;
          var cm;
          while ((cm = CITE_RE.exec(code))) {
            var ckeys = cm[1].split(",").map(function (s) { return s.trim(); }).filter(Boolean);
            var nums = ckeys.filter(function (k) { return k in citeNums; })
              .map(function (k) { return citeNums[k]; });
            var sortedNums = nums.slice().sort(function (a, b) { return a - b; });
            if (nums.length >= 2 && nums.join(",") !== sortedNums.join(",")) {
              rep.add(f, n, SEV_INFO, "cite-order",
                "Numeric citations not in ascending order " +
                "(" + nums.join(", ") + "). Reorder the keys.", line);
              break;
            }
          }
        }

        FLOAT_BEGIN_RE.lastIndex = 0;
        while (FLOAT_BEGIN_RE.exec(code)) { floatCount++; floatLines.push(n); }
        var lm = LABEL_KIND_RE.exec(code);
        if (lm) soleLabel = lm[2];
      }

      if (floatCount > 1) {
        rep.add(f, floatLines[1] || 0, SEV_INFO, "float-per-file",
          floatCount + " floats in one file (" + basename(f) + ", lines " +
          floatLines.join(", ") + "). Lab style: one figure/table per .tex " +
          "file, included with \\input.");
      } else if (floatCount === 1 && soleLabel && base.indexOf(soleLabel) < 0) {
        rep.add(f, floatLines[0] || 0, SEV_INFO, "float-filename",
          "Float label '" + soleLabel + "' does not match filename '" + base + "'. " +
          "Name the file to match its label.");
      }
    });

    allFiles.forEach(function (f) {
      if (!/\.bib$/.test(f)) return;
      var raw = fs[f];
      if (typeof raw !== "string") return;
      var lines = raw.split(/\r?\n/);
      for (var idx = 0; idx < lines.length; idx++) {
        var n = idx + 1, line = lines[idx];
        var mk = /^\s*@\w+\s*\{\s*([^,]+)/.exec(line);
        if (mk && /^(Alpher|Anonymous|FirstName|ECCV2022)/.test(mk[1].trim())) {
          rep.add(f, n, SEV_WARN, "template-ref",
            "Template placeholder reference '" + mk[1].trim() + "'. Remove it.", line);
        }
        var tmm = /(?<![A-Za-z])title\s*=\s*\{(.+?)\}\s*,?\s*$/.exec(line);
        if (tmm) {
          var title = tmm[1];
          if (title.indexOf("{") === 0 && /\}\s*$/.test(title)) continue;
          var words = title.split(/\s+/).filter(function (w) { return /^[A-Za-z]{4,}$/.test(w); });
          if (words.length >= 4) {
            var caps = words.filter(function (w) { return w[0] === w[0].toUpperCase(); }).length;
            if (caps / words.length > 0.6) {
              rep.add(f, n, SEV_INFO, "bib-title-case",
                "Title Case title not brace-protected. Wrap names/acronyms in " +
                "{{...}} or use sentence case (be consistent across the .bib).", line);
            }
          }
        }
      }
    });
  }

  /* ---------------------------------------------------- reading order walk */
  function sectionOrder(fs, root) {
    var order = {};
    var mainTex = joinPath(root, "main.tex");
    if (fs[mainTex] === undefined) {
      var cands = Object.keys(fs).filter(function (p) {
        return underDir(p, root) && basename(p) === "main.tex";
      }).sort(function (a, b) {
        var da = a.split("/").length, db = b.split("/").length;
        return da - db || (a < b ? -1 : a > b ? 1 : 0);
      });
      if (!cands.length) return order;
      mainTex = cands[0];
    }
    var base = dirname(mainTex);
    var counter = { i: 0 };
    var visiting = {};

    function visit(path) {
      var p = normPath(path);
      if (p in order || visiting[p]) return;
      order[p] = counter.i; counter.i += 1;
      if (!/\.tex$/.test(p) || fs[p] === undefined) return;
      visiting[p] = true;
      var raw = fs[p];
      if (typeof raw !== "string") { delete visiting[p]; return; }
      var text = raw.split(/\r?\n/).map(function (ln) {
        return ln.replace(/(?<!\\)%.*$/, "");
      }).join("\n");
      var re = /\\(?:input|include)\{([^}]+)\}|\\bibliography\{([^}]+)\}/g, m;
      while ((m = re.exec(text))) {
        if (m[1] != null) {
          var target = m[1].trim();
          if (!/\.tex$/.test(target)) target += ".tex";
          visit(joinPath(base, target));
        } else {
          m[2].split(",").forEach(function (key) {
            key = key.trim();
            if (!/\.bib$/.test(key)) key += ".bib";
            var bp = normPath(joinPath(base, key));
            if (!(bp in order)) { order[bp] = counter.i; counter.i += 1; }
          });
        }
      }
      delete visiting[p];
    }
    visit(mainTex);
    return order;
  }

  var SECTION_ALIASES = {
    main: "Title & Teaser", intro: "Introduction", introduction: "Introduction",
    related_work: "Related Work", relatedwork: "Related Work", related: "Related Work",
    proposed_method: "Method", method: "Method", approach: "Method",
    data: "Dataset & Benchmark", dataset: "Dataset & Benchmark", benchmark: "Dataset & Benchmark",
    results: "Experiments", experiments: "Experiments", evaluation: "Experiments",
    conclusion: "Conclusion", abstract: "Abstract", preamble: "Preamble",
    x_suppl: "Appendix", suppl: "Appendix", supplementary: "Appendix", appendix: "Appendix",
  };
  function sectionLabel(rel) {
    var base = basename(rel);
    if (/\.bib$/.test(base)) return "References";
    var stem = base.replace(/\.tex$/, "").replace(/^[0-9]+[_-]?/, "");
    var key = stem.toLowerCase();
    if (SECTION_ALIASES[key]) return SECTION_ALIASES[key];
    var t = stem.replace(/[_-]+/g, " ").trim();
    t = t.replace(/\w\S*/g, function (w) { return w[0].toUpperCase() + w.slice(1).toLowerCase(); });
    return t || base;
  }

  function findPaperRoot(fs) {
    var byDir = {};
    Object.keys(fs).forEach(function (p) {
      if (!/\.tex$/.test(p)) return;
      var d = dirname(p);
      (byDir[d] = byDir[d] || []).push(basename(p));
    });
    var bestMain = null, bestCount = -1, bestDir = "";
    Object.keys(byDir).sort().forEach(function (d) {
      var tex = byDir[d];
      if (tex.indexOf("main.tex") >= 0 && (bestMain === null || d.length < bestMain.length)) bestMain = d;
      if (tex.length > bestCount) { bestCount = tex.length; bestDir = d; }
    });
    return bestMain !== null ? bestMain : bestDir;
  }

  /* ------------------------------------------------------------- main entry */
  function loadDatasets(fs, root) {
    var names = {};
    DEFAULT_DATASETS.forEach(function (n) { names[n] = true; });
    EXTRA_DATASETS.forEach(function (n) { names[n] = true; });
    var dt = fs[joinPath(root, "datasets.txt")];
    if (typeof dt === "string") {
      dt.split(/\r?\n/).forEach(function (ln) {
        ln = ln.trim();
        if (ln && ln.indexOf("#") !== 0) names[ln] = true;
      });
    }
    return Object.keys(names);
  }

  function runSource(fileMap, opts) {
    opts = opts || {};
    var fs = {};
    Object.keys(fileMap).forEach(function (p) { fs[normPath(p)] = fileMap[p]; });

    var root = opts.root !== undefined ? opts.root : findPaperRoot(fs);
    var rep = new Reporter();

    var files = Object.keys(fs).filter(function (p) {
      if (!underDir(p, root)) return false;
      if (!/\.(tex|bib)$/.test(p)) return false;
      if (!opts.includeDead) {
        if (inSkippedDir(relTo(p, root))) return false;
        if (SKIP_FILE.test(basename(p))) return false;
      }
      return true;
    }).sort();

    if (!files.length) {
      return { items: [], summary: {}, root: root, order: {}, error: "No .tex/.bib files found." };
    }

    var datasetRe = opts.noDatasets ? null : buildDatasetRe(loadDatasets(fs, root));
    var order = sectionOrder(fs, root);
    var hasOrder = Object.keys(order).length > 0;

    function isUsed(f) {
      if (!hasOrder) return true;
      if (!underDir(f, root)) return true;
      return normPath(f) in order;
    }

    var texFiles = files.filter(function (f) { return /\.tex$/.test(f); });
    var usedTex = texFiles.filter(isUsed);

    files.forEach(function (f) {
      if (!isUsed(f)) {
        rep.add(f, 0, SEV_ERROR, "unused-file",
          "'" + basename(f) + "' is not \\input/\\include'd by main.tex. " +
          "Remove it before submitting (stray files leak into the " +
          "arXiv source and confuse co-authors).");
        return;
      }
      if (/\.tex$/.test(f)) {
        checkTex(f, fs[f], rep, {
          includeTemplate: opts.includeTemplate,
          datasetRe: datasetRe,
          cameraReady: opts.cameraReady,
        });
      } else {
        checkBib(f, fs[f], rep);
      }
    });

    checkExtras(usedTex, files, fs, root, rep);

    // cross-file: floats/equations whose \label is never referenced
    var labels = {}, refs = {};
    usedTex.forEach(function (f) {
      var txt = fs[f];
      if (typeof txt !== "string") return;
      var lines = txt.split(/\r?\n/);
      for (var idx = 0; idx < lines.length; idx++) {
        var code = stripComment(lines[idx])[0];
        var lre = /\\label\{((?:fig|tab|eq):[^}]+)\}/g, m;
        while ((m = lre.exec(code))) {
          if (!(m[1] in labels)) labels[m[1]] = [f, idx + 1];
        }
        var rre = /\\(?:[cC]ref|ref|autoref|eqref|labelcref)\{([^}]+)\}/g;
        while ((m = rre.exec(code))) {
          m[1].split(",").forEach(function (k) { refs[k.trim()] = true; });
        }
      }
    });
    Object.keys(labels).forEach(function (key) {
      if (!refs[key]) {
        var loc = labels[key];
        var kind = { fig: "Figure", tab: "Table", eq: "Equation" }[key.split(":")[0]] || "Float";
        rep.add(loc[0], loc[1], SEV_INFO, "unreferenced-label",
          kind + " label '" + key + "' is never referenced with \\cref. " +
          "Every float must be discussed; unreferenced equations should be inlined.");
      }
    });

    // lab macros imported?
    if (texFiles.length) {
      var hasMacros = false, mainTexPath = null;
      texFiles.forEach(function (f) {
        if (basename(f) === "main.tex") mainTexPath = f;
        var txt = fs[f];
        if (typeof txt === "string" && /\\input\{macro\}/.test(txt)) hasMacros = true;
      });
      if (!hasMacros) {
        rep.add(mainTexPath || texFiles[0], 0, SEV_WARN, "lab-macros",
          "This paper does not import the lab macro.tex (no \\input{macro}). " +
          "New PLAN Lab papers must be built from the official template, which " +
          "imports macro.tex with all lab-wide macros.");
      }
    }

    // relativize file paths to the paper root, like the web app does
    rep.items.forEach(function (it) { it.file = relTo(it.file, root); });
    var relOrder = {};
    Object.keys(order).forEach(function (p) { relOrder[relTo(p, root)] = order[p]; });

    return { items: rep.items, summary: rep.counts(), root: root, order: relOrder };
  }

  /* ================================================== PDF-text rules ===== */
  var PDF_PASSIVE_OK = /\b(?:is|are|was|were|be|been|being)\s+(?:shown|presented|illustrated|given|listed|provided|summarized|summarised|reported|depicted|described|denoted|defined|detailed|outlined|visualized|visualised|introduced|organized|organised|structured|available|highlighted)\b|\b(?:in|by)\s+(?:Fig(?:ure)?s?\.?|Tab(?:le)?s?\.?|Appendix|Section|Sec\.|Eq\.?|Equation|Algorithm)\b/i;
  var PDF_PAST_WE = /\bwe\s+(introduced|proposed|evaluated|presented|developed|showed|achieved|designed|conducted|performed|trained|built|created|summarized|summarised)\b/i;
  var PDF_PRIOR_PAST = /\bthe\s+authors?\s+(proposed|introduced|presented|showed|developed)\b/i;
  var PDF_PASSIVE = /\b(is|are|was|were|been|being)\s+(evaluated|proposed|introduced|presented|trained|computed|performed|conducted|shown|used|obtained|applied|adopted)\b/i;
  var PDF_OWNERSHIP = /\bour\s+(model|method|approach|framework|network|architecture|system)\b/i;
  var PDF_FILLER = [
    [/\bin this section,? we\b/i, "\"In this section we\u2026\""],
    [/\bwe now describe\b/i, "\"We now describe\u2026\""],
    [/\bit is worth noting\b/i, "\"It is worth noting\u2026\""],
    [/\bwe hope\b/i, "\"We hope\u2026\""],
    [/\bfirst step toward/i, "\"first step toward\u2026\""],
    [/\bplays? an?\s+(crucial|key|important|vital)\s+role\b/i, "\"plays a crucial role\u2026\""],
  ];
  var PDF_VAGUE = [
    [/\bwe provide insights?\b/i, "\"we provide insights\u2026\""],
    [/\bperforms?\s+well\b/i, "\"performs well\u2026\""],
    [/\bachieves?\s+good\b/i, "\"achieves good\u2026\""],
    [/\bimprove\s+understanding\b/i, "\"improve understanding\u2026\""],
  ];
  var PDF_SECTIONS = [
    ["Introduction", /\bIntroduction\b/i],
    ["Related Work", /\bRelated Work\b|\bBackground\b/i],
    ["Method", /\bMethod(ology)?\b|\bApproach\b/i],
    ["Experiments", /\bExperiments?\b|\bEvaluation\b|\bResults\b/i],
    ["Conclusion", /\bConclusions?\b/i],
  ];

  function pdfSentences(text) {
    return text.split(/(?<=[.!?])\s+/).map(function (p) { return p.trim(); }).filter(Boolean);
  }
  function pdfSnippet(s, n) {
    n = n || 160;
    s = s.replace(/\s+/g, " ").trim();
    return s.length <= n ? s : s.slice(0, n - 1) + "\u2026";
  }
  function findAbstract(text) {
    var m = /\bA(?:BSTRACT|bstract)\b/.exec(text);
    if (!m) return "";
    var start = m.index + m[0].length;
    var rest = text.slice(start);
    var e = /\n\s*(?:1\.?\s+)?I(?:NTRODUCTION|ntroduction)\b|\n\s*(?:Keywords|Index Terms|CCS Concepts|ACM Reference)\b/.exec(rest);
    var end = e ? start + e.index : start + 1600;
    return text.slice(start, end);
  }

  function checkPdfText(text, filename) {
    filename = filename || "paper.pdf";
    var items = [];
    function add(sev, rule, message, snip, line) {
      items.push({ file: filename, line: line || 0, severity: sev, rule: rule, message: message, snippet: snip || "" });
    }

    if (text.trim().length < 400) {
      add(SEV_WARN, "pdf-extract",
        "Very little text could be extracted from this PDF. If it is a scan " +
        "or image-only export, the prose checks below will be incomplete \u2014 " +
        "upload the LaTeX source .zip for the full check.");
    }

    pdfSentences(text).forEach(function (s) {
      if (PDF_PAST_WE.test(s)) {
        add(SEV_ERROR, "voice/tense",
          "Past tense in a 'we' sentence. Lab style is plural active voice " +
          "('We introduce\u2026', not 'We introduced\u2026').", pdfSnippet(s));
      }
      if (PDF_PRIOR_PAST.test(s)) {
        add(SEV_WARN, "voice/tense",
          "'The authors proposed\u2026'. Refer to prior work actively: " +
          "'Prior work proposes\u2026 [x]'.", pdfSnippet(s));
      }
      if (PDF_PASSIVE.test(s)) {
        if (!PDF_PASSIVE_OK.test(s))
          add(SEV_WARN, "voice/passive",
            "Likely passive voice. Prefer active ('We evaluate\u2026').", pdfSnippet(s));
      }
      if (PDF_OWNERSHIP.test(s)) {
        add(SEV_WARN, "ownership",
          "Use the method-name macro instead (e.g. the model's name).", pdfSnippet(s));
      }
      PDF_FILLER.forEach(function (pair) {
        if (pair[0].test(s)) {
          add(SEV_INFO, "filler",
            "Filler phrase " + pair[1] + " adds no information \u2014 remove it.", pdfSnippet(s));
        }
      });
      PDF_VAGUE.forEach(function (pair) {
        if (pair[0].test(s)) {
          add(SEV_INFO, "vague-claim",
            "Vague claim " + pair[1] + ". Be precise and quantitative " +
            "(e.g. '81.2% IoU, a +6.3% gain').", pdfSnippet(s));
        }
      });
    });

    var abs = findAbstract(text);
    if (abs) {
      var hasGain = /\d+(\.\d+)?\s*%/.test(abs) || /\bimproves?\b.{0,40}\bby\b/i.test(abs);
      if (!hasGain) {
        add(SEV_WARN, "abstract-gain",
          "The abstract does not state a quantitative relative gain. Include " +
          "at least one, e.g. 'improves X by xx.x%'.", pdfSnippet(abs, 200));
      }
      if (/\[\d+(?:\s*,\s*\d+)*\]/.test(abs) || /\([A-Z][A-Za-z]+ et al\.?,?\s*\d{4}\)/.test(abs) || /\$[^$]+\$/.test(abs)) {
        add(SEV_WARN, "abstract-cite",
          "The abstract appears to contain a citation or equation. Keep the " +
          "abstract free of both.", pdfSnippet(abs, 200));
      }
    } else {
      add(SEV_INFO, "abstract-missing",
        "Could not locate an Abstract section to check.");
    }

    PDF_SECTIONS.forEach(function (pair) {
      if (!pair[1].test(text)) {
        add(SEV_WARN, "structure",
          "No '" + pair[0] + "' section detected. A CVPR/NeurIPS-quality paper needs " +
          "a clear " + pair[0] + " section (heading may not have extracted cleanly \u2014 " +
          "verify).");
      }
    });

    var refs = /\bReferences\b/.exec(text);
    if (refs) {
      var tail = text.slice(refs.index + refs[0].length);
      var nrefs = countMatches(/\n\s*\[\d+\]/g, tail);
      if (nrefs > 0 && nrefs < 15) {
        add(SEV_INFO, "refs-count",
          "Only ~" + nrefs + " references detected. Related Work is usually denser " +
          "(\u224810\u201320 focused, mostly from top venues).");
      }
    }

    var summary = {};
    items.forEach(function (it) { summary[it.severity] = (summary[it.severity] || 0) + 1; });
    return { items: items, summary: summary };
  }

  /* ============================================= PDF geometry: trailing text */
  function wordsWithLetters(t) {
    return (t.match(/\S+/g) || []).filter(function (w) { return /[A-Za-z]/.test(w); });
  }
  function looksNonBody(t) {
    if (/^\s*(Figure|Fig\.?|Table|Tab\.?)\s*\d/i.test(t)) return true;   // caption
    if (/^\s*\(?\d+(\.\d+)*\)?\s*$/.test(t)) return true;                 // number / eq number
    if (!/[a-z]/.test(t)) return true;                                    // all-caps heading
    if (/^\d+(\.\d+)*\s+[A-Z]/.test(t)) return true;                      // numbered heading
    if (/^(Abstract|Introduction|Related Work|Background|Method|Approach|Experiments?|Evaluation|Results?|Conclusions?|References|Acknowledge?ments?|Appendix)\b/i.test(t)) return true;
    return false;
  }
  // pages: [{ lines: [{text,xL,xR,y,h,font}], ruler }] from extractPdfLines.
  function checkTrailingText(pages, filename) {
    filename = filename || "paper.pdf";
    var items = [];
    var refsActive = false;
    (pages || []).forEach(function (pg, pi) {
      var lines = (pg.lines || []).slice().sort(function (a, b) { return b.y - a.y; }); // top first
      function overlaps(a, b) { return a.xR > b.xL && a.xL < b.xR; }
      // dominant body font on this page (most characters among multi-word lines)
      var fc = {};
      lines.forEach(function (L2) {
        if ((L2.text.match(/\S+/g) || []).length >= 5 && L2.font)
          fc[L2.font] = (fc[L2.font] || 0) + L2.text.length;
      });
      var bodyFont = "", fb = -1;
      Object.keys(fc).forEach(function (k) { if (fc[k] > fb) { fb = fc[k]; bodyFont = k; } });
      // figure zones: content above a Figure caption belongs to the figure
      var zones = [];
      lines.forEach(function (L2) {
        if (/^(Figure|Fig\.)\s*\d+[.:]/.test(L2.text))
          zones.push({ xL: L2.xL - 40, xR: L2.xR + 40, yLo: L2.y, yHi: L2.y + 340 });
      });
      for (var i = 0; i < lines.length; i++) {
        var L = lines[i];
        var t = L.text.trim();
        // bibliography wraps short lines by design; stop checking at the heading
        // (which can merge with the other column), resume at an appendix heading
        if (/(^|\s)(REFERENCES|References|BIBLIOGRAPHY|Bibliography)$/.test(t) && t.length < 130) { refsActive = true; continue; }
        if (refsActive && (/^[A-Z]\s+[A-Z][A-Z ]{2,}$/.test(t) || /^[A-Z][.)]\s+[A-Z][A-Za-z]/.test(t) || /^Appendix\b/i.test(t))) refsActive = false;
        if (refsActive) continue;
        var w = wordsWithLetters(L.text);
        if (w.length === 0 || w.length > 2) continue;
        if (looksNonBody(L.text)) continue;
        // a real dangling last line continues a sentence, so it starts lowercase
        // (or a digit/paren); uppercase starts are headings or table fragments
        var upperOk = /^[A-Z][\w'\u2019.-]*(\s+\S+)?[.!?]['\")\]]*$/.test(t) &&
          !/^(Figure|Fig\.|Table|Section|Sec\.|Eq|Equation|Algorithm|Appendix)\b/.test(t);
        if (!/^[a-z(\[\d]/.test(t) && !upperOk) continue;
        // mid-sentence lines before display math end in , ; :
        if (/[,;:]$/.test(t)) continue;
        // citation tails and identifiers, wherever they appear
        if (/^(arXiv:|doi[.:]|https?:)/i.test(t) || /arXiv:\d{4}\./i.test(t)) continue;
        if (/^\(?(19|20)\d{2}[a-z]?\s*[.,)]*$/.test(t)) continue;
        // a single dangling word ends its sentence; bare fragments do not
        if (w.length === 1 && !/[.!?]['")\]]*$/.test(t)) continue;
        var inZone = zones.some(function (z) { return L.xR > z.xL && L.xL < z.xR && L.y > z.yLo && L.y < z.yHi; });
        if (inZone) continue;
        var Lw = L.xR - L.xL;
        var prev = null, next = null;
        for (var j = i - 1; j >= 0; j--) if (overlaps(lines[j], L) && lines[j].y > L.y) { prev = lines[j]; break; }
        for (var k = i + 1; k < lines.length; k++) if (overlaps(lines[k], L) && lines[k].y < L.y) { next = lines[k]; break; }
        if (!prev) continue;
        // a runt continuing a bulleted or enumerated line is list or verbatim
        // content, not a paragraph end
        if (/^([\u2022\-\u2013*]\s|\d+[.)]\s)/.test(prev.text.trim())) continue;
        // math subscripts and footnotes sit smaller than the line above
        if (prev.h && L.h && L.h < 0.85 * prev.h) continue;
        // figure labels, verbatim boxes, and math use a different font
        if (L.font && prev.font && L.font !== prev.font) continue;
        if (bodyFont && L.font && L.font !== bodyFont) continue;
        var prevW = prev.xR - prev.xL;
        var prevIsBody = prevW > 4 * Lw && (prev.xR - L.xR) > 0.3 * prevW && Math.abs(prev.xL - L.xL) < 6;
        if (!prevIsBody) continue;
        var newPara = !next || (next.xL - L.xL > 4) || ((L.y - next.y) > 1.6 * (L.h || 8));
        if (!newPara) continue;
        items.push({
          file: filename, line: 0, severity: SEV_ERROR, rule: "trailing-text",
          page: pi + 1, y: L.y, lineNo: rulerLineAt(pg, L.y) || undefined,
          message: "A paragraph ends with a very short last line (\"" + L.text +
            "\"). Rephrase so the last line is fuller; the lab flags line spillover and dangling words.",
          snippet: L.text,
        });
      }
    });
    return items;
  }

  /* ============================================== anonymization (double-blind) */
  var ANON_ENGINE = /(la)?tex|pdftex|xetex|luatex|dvips|ghostscript|distiller|acrobat|quartz|skia|chromium|word|powerpoint|keynote|matplotlib|cairo/i;
  function anonMeta(info, filename) {
    filename = filename || "paper.pdf";
    var items = [];
    if (!info) return items;
    function val(k) { return (info[k] || "").toString().trim(); }
    var author = val("Author");
    if (author) items.push({ file: filename, line: 0, severity: SEV_ERROR, rule: "anon-metadata",
      message: "PDF metadata Author field is set (\"" + author + "\"). Clear it for a double-blind submission.", snippet: "" });
    ["Subject", "Keywords"].forEach(function (k) {
      var v = val(k);
      if (v) items.push({ file: filename, line: 0, severity: SEV_WARN, rule: "anon-metadata",
        message: "PDF metadata " + k + " field is set (\"" + v + "\"). Clear it for double-blind.", snippet: "" });
    });
    var creator = val("Creator");
    if (creator && !ANON_ENGINE.test(creator) && /[A-Za-z]/.test(creator) && /\s/.test(creator))
      items.push({ file: filename, line: 0, severity: SEV_INFO, rule: "anon-metadata",
        message: "PDF metadata Creator field (\"" + creator + "\") may identify you. Confirm it is not a name.", snippet: "" });
    return items;
  }
  function anonText(fullText, page1Text, filename) {
    filename = filename || "paper.pdf";
    var items = [];
    if (/\bAcknowledge?ments?\b/i.test(fullText || ""))
      items.push({ file: filename, line: 0, severity: SEV_WARN, rule: "anon-ack",
        message: "An Acknowledgments section appears in a double-blind submission. Remove it until camera-ready.", snippet: "" });
    var p1 = page1Text || "";
    var email = p1.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    if (email) items.push({ file: filename, line: 0, severity: SEV_WARN, rule: "anon-contact",
      message: "An email address (\"" + email[0] + "\") appears on page 1. Remove it for double-blind.", snippet: email[0] });
    var gh = p1.match(/github\.com\/[A-Za-z0-9_.-]+/i);
    if (gh) items.push({ file: filename, line: 0, severity: SEV_WARN, rule: "anon-contact",
      message: "A GitHub link (\"" + gh[0] + "\") on page 1 can deanonymize the submission. Use an anonymized repository link.", snippet: gh[0] });

    // author names / affiliations in the byline. Look at the lines between the
    // title and the abstract; a real double-blind paper shows "Anonymous
    // Authors" or "Paper ID ####" there, never real names or an institution.
    var head = p1;
    var absAt = head.search(/\bAbstract\b/);
    if (absAt > 0) head = head.slice(0, absAt);
    var headLines = head.split(/\n/).map(function (l) { return l.trim(); }).filter(Boolean).slice(0, 14);
    var anonymized = /\b(Anonymous(?:\s+(?:Authors?|ECCV|CVPR|ICCV|NeurIPS|Submission))?|Paper\s*ID|Submission\s*(?:ID|\d)|Under review)\b/i.test(head);
    if (!anonymized) {
      // an affiliation line (university / institute / lab / company suffix)
      var affil = null;
      for (var ai = 0; ai < headLines.length; ai++) {
        if (/\b(University|Institute|Laborator|College|Corporation|Inc\.|Research|Department|School of|Politecnico|Universit(y|e|a|\u00e0)|\u5927\u5b66)\b/.test(headLines[ai]) &&
            headLines[ai].length < 120) { affil = headLines[ai]; break; }
      }
      if (affil)
        items.push({ file: filename, line: 0, severity: SEV_ERROR, rule: "anon-authors",
          message: "An affiliation line (\"" + affil.slice(0, 80) + "\") appears on page 1. A double-blind " +
            "submission must not name authors or institutions. Replace the byline with the anonymized placeholder.",
          snippet: affil.slice(0, 120), page: 1 });
      // a byline: a short line of Capitalized names with commas / superscripts,
      // sitting above the abstract, no verb
      for (var bi = 0; bi < headLines.length; bi++) {
        var hl = headLines[bi];
        if (hl.length < 8 || hl.length > 160) continue;
        var names = hl.match(/\b[A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+/g) || [];
        var hasSep = /,|\band\b|\u00b7|\d\s*,/.test(hl) || /[A-Za-z]\d/.test(hl);
        var looksProse = /\b(the|is|are|we|this|a|of|for|with|that|to)\b/i.test(hl);
        if (names.length >= 2 && hasSep && !looksProse) {
          items.push({ file: filename, line: 0, severity: SEV_ERROR, rule: "anon-authors",
            message: "A byline that looks like author names (\"" + hl.slice(0, 70) + "\") appears on page 1. " +
              "A double-blind submission must be anonymized.",
            snippet: hl.slice(0, 120), page: 1 });
          break;
        }
      }
    }
    return items;
  }
  function anonSource(fileMap) {
    var items = [];
    Object.keys(fileMap || {}).forEach(function (name) {
      if (!/\.tex$/i.test(name)) return;
      var t = fileMap[name];
      if (typeof t !== "string") return;
      var m;
      if (/\\thanks\{[^}]*[A-Za-z][^}]*\}/.test(t))
        items.push({ file: name, line: 0, severity: SEV_ERROR, rule: "anon-source",
          message: "\\thanks{...} with content is present. Remove author-identifying footnotes for double-blind.", snippet: "" });
      if ((m = t.match(/\\author\{([^}]*)\}/))) {
        var a = m[1].replace(/\\[a-zA-Z]+|[{}]/g, "").trim();
        if (a && !/anonymous/i.test(a))
          items.push({ file: name, line: 0, severity: SEV_ERROR, rule: "anon-source",
            message: "\\author{...} contains \"" + a.slice(0, 60) + "\". Anonymize the author block.", snippet: "" });
      }
      if (/\\begin\{acknowledge?ments?\}/i.test(t) || /\\section\*?\{\s*Acknowledge?ments?\s*\}/i.test(t))
        items.push({ file: name, line: 0, severity: SEV_WARN, rule: "anon-source",
          message: "An acknowledgments section is present. Remove it until camera-ready.", snippet: "" });
      if (/\\orcid|orcid\.org/i.test(t))
        items.push({ file: name, line: 0, severity: SEV_WARN, rule: "anon-source",
          message: "An ORCID appears in the source. Remove it for double-blind.", snippet: "" });
      if ((m = t.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)))
        items.push({ file: name, line: 0, severity: SEV_WARN, rule: "anon-source",
          message: "An email (\"" + m[0] + "\") appears in the source. Remove it for double-blind.", snippet: "" });
    });
    return items;
  }

  /* ==================================== figure/caption spacing (PDF layout) */
  var FIGGAP = { aboveLoose: 15, belowLoose: 22, tableLoose: 20 };

  // pages from extractPdfLines; imageBoxesPerPage from extractImageBoxes.
  function checkFigureSpacing(pages, imageBoxesPerPage, filename) {
    filename = filename || "paper.pdf";
    var items = [];
    (pages || []).forEach(function (pg, pi) {
      var lines = (pg.lines || []).slice().sort(function (a, b) { return b.y - a.y; });
      var boxes = (imageBoxesPerPage && imageBoxesPerPage[pi]) || [];
      for (var i = 0; i < lines.length; i++) {
        var L = lines[i];
        var m = /^(Figure|Table)\s+(\d+)[:.]\s/.exec(L.text + " ");
        if (!m) continue;
        var kind = m[1];
        var label = kind + " " + m[2];
        function rowSiblings(yv) {
          var c = 0;
          for (var q = 0; q < lines.length; q++) {
            var o = lines[q];
            if (Math.abs(o.y - yv) < 0.6 && o.xR > L.xL && o.xL < L.xR) c++;
          }
          return c;
        }
        // a wrapped body line can begin with "Table 4." mid-sentence; a real
        // caption has no tightly spaced same-font prose line directly above it
        var prevAbove = null;
        for (var pa = i - 1; pa >= 0; pa--) {
          if (lines[pa].y > L.y && lines[pa].xR > L.xL && lines[pa].xL < L.xR) { prevAbove = lines[pa]; break; }
        }
        if (prevAbove && (prevAbove.y - L.y) <= 1.45 * L.h &&
            (!prevAbove.font || !L.font || prevAbove.font === L.font) &&
            rowSiblings(prevAbove.y) < 2) continue;
        var tailWords = L.text.replace(/^(?:Figure|Table)\s+\d+[:.]\s*/, "").split(/\s+/).filter(Boolean);
        if (tailWords.length > 0 && tailWords.length < 4)
          items.push({ file: filename, line: 0, severity: SEV_INFO, rule: "short-caption",
            message: label + ": the caption is only " + tailWords.length + " word(s) (\"" + L.text.slice(0, 60) +
              "\"). Lab style: captions are informative and start with a bold Title Case lead-in.",
            snippet: L.text.slice(0, 90), page: pi + 1, y: L.y, lineNo: rulerLineAt(pg, L.y) || undefined });
        var capTop = L.y + L.h;
        // caption block: contiguous wrapped lines under the first caption line
        var lastLine = L, steps = 0;
        for (var j = i + 1; j < lines.length; j++) {
          var nx = lines[j];
          if (!(nx.xR > L.xL && nx.xL < L.xR)) continue;
          // caption continuation lines sit at caption leading; a table row has
          // sibling cells at the same height, the body starts at a larger step
          if (nx.y < lastLine.y && (lastLine.y - nx.y) <= 1.45 * L.h && steps < 5 &&
              rowSiblings(nx.y) < 2 &&
              (!nx.font || !L.font || nx.font === L.font)) { lastLine = nx; steps++; }
          else if (nx.y < lastLine.y) break;
        }
        var capBottom = lastLine.y - 0.25 * L.h;
        if (lastLine !== L) {
          var nextBelow = null;
          for (var nb = 0; nb < lines.length; nb++) {
            var ob = lines[nb];
            if (ob.y < lastLine.y && ob.xR > L.xL && ob.xL < L.xR &&
                (nextBelow === null || ob.y > nextBelow.y)) nextBelow = ob;
          }
          var blockEnds = !nextBelow || (lastLine.y - nextBelow.y) > 1.55 * L.h ||
            rowSiblings(nextBelow.y) >= 2;
          var cw = wordsWithLetters(lastLine.text);
          if (blockEnds && cw.length >= 1 && cw.length <= 2 && !/[,;:]$/.test(lastLine.text.trim()) &&
              (L.xR - L.xL) > 3 * (lastLine.xR - lastLine.xL)) {
            items.push({ file: filename, line: 0, severity: SEV_ERROR, rule: "trailing-text",
              message: label + " caption ends with a very short last line (\"" + lastLine.text +
                "\"). Rephrase the caption so its last line is fuller.",
              snippet: lastLine.text, page: pi + 1, y: lastLine.y,
              lineNo: rulerLineAt(pg, lastLine.y) || undefined });
          }
        }

        var above = null, below = null;
        boxes.forEach(function (b) {
          if (b.xR > L.xL && b.xL < L.xR) {
            if (b.yBottom > capTop && b.yBottom - capTop < 340 &&
                (above === null || b.yBottom < above)) above = b.yBottom;
            if (b.yTop < capBottom && capBottom - b.yTop < 340 &&
                (below === null || b.yTop > below)) below = b.yTop;
          }
        });
        lines.forEach(function (o) {
          if (o === L || o === lastLine) return;
          if (!(o.xR > L.xL && o.xL < L.xR)) return;
          var bot = o.y - 0.2 * o.h, top = o.y + o.h;
          if (o.y > capTop && bot > capTop && bot - capTop < 340 &&
              (above === null || bot < above)) above = bot;
          if (top < capBottom && capBottom - top < 340 &&
              (below === null || top > below)) below = top;
        });

        function push(rule, msg) {
          items.push({ file: filename, line: 0, severity: SEV_WARN, rule: rule,
            message: msg, snippet: L.text.slice(0, 90),
            page: pi + 1, y: L.y, lineNo: rulerLineAt(pg, L.y) || undefined });
        }
        if (kind === "Figure") {
          if (above !== null) {
            var ga = above - capTop;
            if (ga > FIGGAP.aboveLoose)
              push("fig-caption-gap", label + ": about " + Math.round(ga) + "pt of space between " +
                "the figure and its caption; typical is ~10pt. Tighten \\abovecaptionskip or crop " +
                "the graphic's bounding box so figure and caption read as one unit.");
          }
          if (below !== null) {
            var gb = capBottom - below;
            if (gb > FIGGAP.belowLoose)
              push("fig-below-gap", label + ": about " + Math.round(gb) + "pt of empty space under " +
                "the caption before the text resumes; typical is ~15-20pt. Reduce " +
                "\\belowcaptionskip / \\textfloatsep or the float's reserved height.");
          }
        } else if (below !== null) {
          var gt = capBottom - below;
          if (gt > FIGGAP.tableLoose)
            push("fig-caption-gap", label + ": about " + Math.round(gt) + "pt of space between " +
              "the caption and its table; the caption belongs right above the table. Tighten " +
              "\\belowcaptionskip inside the table float.");
        }
      }
    });
    return items;
  }

  /* ============================ PDF paper-quality checks (lab experiment bar) */
  function checkPdfQuality(text, filename) {
    filename = filename || "paper.pdf";
    var items = [];
    function add(sev, rule, msg, snip) {
      items.push({ file: filename, line: 0, severity: sev, rule: rule, message: msg, snippet: snip || "" });
    }
    var refsM = /\n\s*(?:\d+\s+)?R(?:EFERENCES|eferences)\s*\n/.exec(text);
    var body = refsM ? text.slice(0, refsM.index) : text;
    var refsTail = refsM ? text.slice(refsM.index) : "";

    // unresolved \ref/\cite: "??" in the compiled PDF
    var unres = body.match(/\(\?\?\)|(?:Appendix|Section|Sec\.|Table|Figure|Fig\.|Eq\.|Equation|Algorithm)\s*\?\?/g) || [];
    unres.slice(0, 8).forEach(function (u) {
      add(SEV_ERROR, "unresolved-ref", "Unresolved cross-reference '" + u +
        "'. A \\ref/\\cref points at a missing label, or the paper was compiled only once.", u);
    });
    if (unres.length > 8) add(SEV_ERROR, "unresolved-ref", "... plus " + (unres.length - 8) + " more unresolved '??' references.");
    (body.match(/\b[A-Z][A-Za-z0-9]{2,}\s+\?(?=[\s,.)])/g) || []).slice(0, 3).forEach(function (u) {
      add(SEV_WARN, "unresolved-ref", "Possible unresolved reference: '" + u.trim() + "'.", u.trim());
    });

    // venue template text left in the abstract
    var tmplM = body.match(/The abstract paragraph should be indented|The word\s+ABSTRACT must be centered|abstract must be limited to one paragraph/i);
    if (tmplM)
      add(SEV_ERROR, "template-abstract",
        "The abstract still contains the venue template's placeholder text. Write the real abstract.", tmplM[0]);

    // leftover author notes in the text
    (body.match(/\((?:more better word|better word\??|todo[^()]{0,40}|fixme[^()]{0,40}|citation needed|xxx+)\)/gi) || [])
      .slice(0, 5).forEach(function (u) {
        add(SEV_ERROR, "placeholder-note", "Leftover author note '" + u + "' in the text.", u);
      });

    // duplicate leftover section ("2 INTRODUCTION - OLD")
    var oldSec = body.match(/^\s*\d+\s+[A-Z][A-Z .\u2013\u2014-]*\b(?:OLD|BACKUP|DEPRECATED)\b.*$/m);
    if (oldSec)
      add(SEV_ERROR, "old-section", "Leftover duplicate section heading: '" + oldSec[0].trim() +
        "'. Delete the old version before anyone else reads the paper.", oldSec[0].trim());

    // abstract: overclaim phrases with no number nearby (the gain check runs in checkPdfText)
    var abs = findAbstract(body);
    if (abs) {
      [[/state[- ]of[- ]the[- ]art/i, "state-of-the-art"], [/\bfirst (?:ever|to|of its kind)\b/i, "first ever/to"],
       [/\bsolv(?:es|ed)\b/i, "solves"], [/\bguarantee/i, "guarantees"],
       [/\bunprecedented\b/i, "unprecedented"], [/\bperfect(?:ly)?\b/i, "perfect"]].forEach(function (c) {
        var m = c[0].exec(abs);
        if (!m) return;
        var around = abs.slice(Math.max(0, m.index - 60), m.index + 80);
        if (!/\d/.test(around))
          add(SEV_WARN, "abstract-overclaim", "Overclaim-style phrase '" + c[1] +
            "' in the abstract with no number near it. Back it with a quantitative result or soften it.",
            around.replace(/\s+/g, " ").trim());
      });
    }

    // lab experiments bar: ablation, qualitative, failure insight, >1 dataset
    var expM = /\n\s*\d*\s*(?:EXPERIMENTS?|EVALUATION|RESULTS)\b/i.exec(body);
    var expSpan = expM ? body.slice(expM.index) : body.slice(Math.floor(body.length / 2));
    if (!/ablation/i.test(body))
      add(SEV_WARN, "no-ablation", "No ablation found in the main paper. Lab bar: at least 1 ablation in the main paper.");
    if (!/qualitative/i.test(body))
      add(SEV_WARN, "no-qualitative", "No qualitative results found in the main paper. Lab bar: at least 1 qualitative result in the main paper.");
    if (!/(where it fails|failure case|fails (?:on|when|for)|error analysis|limitation)/i.test(expSpan))
      add(SEV_WARN, "no-failure-insight", "The experiments never discuss where or why the method fails. Lab bar: insights on failure cases.");

    // baselines: >=3 in the comparison table, all introduced in Related Work
    var cap = /Table\s+\d+[:.][^\n]*[Cc]omparison[^\n]*/.exec(body);
    if (cap) {
      var region = body.slice(cap.index, cap.index + 4500);
      var names = [];
      var stop = { model: 1, method: 1, params: 1, arch: 1, text: 1, image: 1, dataset: 1, task: 1,
                   samples: 1, total: 1, cider: 1, overall: 1, acc: 1, accuracy: 1 };
      region.split(/\n/).slice(1, 80).forEach(function (ln) {
        var m2 = /^([A-Za-z][A-Za-z0-9 .+\-\/*&]*?)\s+(?:\(?\d|\u2013|\u2014)/.exec(ln.trim());
        if (!m2) return;
        var nm = m2[1].replace(/\s*\(\d+\)\s*$/, "").trim();
        if (nm.length < 3 || stop[nm.toLowerCase()]) return;
        if (/^Flux\b/i.test(nm) || /DRPO|Ours|family|models\b/i.test(nm)) return;
        if (names.indexOf(nm) < 0) names.push(nm);
      });
      var rwM = /\n\s*\d+\s+R(?:ELATED WORK|elated Work)/.exec(body);
      if (rwM && names.length) {
        var rest = body.slice(rwM.index + 10);
        var rwEnd = /\n\s*\d+\s+(?:M(?:ETHOD|ethod)|A(?:PPROACH|pproach)|P(?:RELIMINAR|relimina))/.exec(rest);
        var rw = body.slice(rwM.index, rwEnd ? rwM.index + 10 + rwEnd.index : rwM.index + 9000).toLowerCase();
        var missing = names.filter(function (n) {
          var k = n.toLowerCase(), first = k.split(/[ (]/)[0];
          return rw.indexOf(k) < 0 && rw.indexOf(first) < 0;
        });
        if (missing.length)
          add(SEV_WARN, "baselines-related-work", missing.length + " of " + names.length +
            " compared baselines are never introduced in Related Work (heuristic): " +
            missing.slice(0, 8).join(", ") + (missing.length > 8 ? " +" + (missing.length - 8) + " more" : "") +
            ". Lab rule: every baseline in the results table is introduced in Related Work.");
      }
    }

    // author notes inside the bibliography = unverified citation
    if (refsTail) {
      var fm = refsTail.match(/[^\n]*(?:please verify|author list abbreviated|\bTODO\b|\bFIXME\b)[^\n]*/i);
      if (fm)
        add(SEV_ERROR, "ref-placeholder", "A reference entry carries an author note ('" +
          fm[0].trim().slice(0, 110) + "'). Resolve the note and verify the entry before the draft goes out.", fm[0].trim().slice(0, 160));
    }
    return items;
  }

  /* ================================= references: parse + online verification */
  function parseReferences(text) {
    var m = /\n\s*(?:\d+\s+)?R(?:EFERENCES|eferences)\s*\n/.exec(text);
    if (!m) return [];
    var tail = text.slice(m.index + m[0].length);
    var endM = /\n\s*[A-Z]\.?\s+[A-Z][A-Za-z][A-Za-z0-9 ]{2,}\n/.exec(tail);   // "A IMPLEMENTATION" / "A PartRel3D Dataset"
    if (endM) tail = tail.slice(0, endM.index);
    var lines = tail.split(/\n/), entries = [], cur = "";
    var authorStart = /^[A-Z][A-Za-z'\u2019\u00C0-\u017F-]+(?:,| and | et al\b|\.\s|\s[A-Z])/;
    var numStart = /^\d{1,3}\.\s+\S/;
    lines.forEach(function (ln) {
      ln = ln.trim();
      if (!ln) return;
      var closes = /(?:19|20)\d{2}[a-z]?\.\s*$/.test(cur) || /\((?:19|20)\d{2}\)\s*\.?\s*$/.test(cur) ||
        /\((?:19|20)\d{2}\)\s+\d[\d,\s]*$/.test(cur) || /\.\s*$/.test(cur) && /(19|20)\d{2}/.test(cur);
      // once a numbered list starts, only another numbered line opens a new entry
      var sawNum = entries.length > 0 && /^\d{1,3}\.\s/.test(entries[entries.length - 1]);
      var opensNew = sawNum ? numStart.test(ln) : (authorStart.test(ln) || numStart.test(ln));
      if (cur && closes && opensNew) { entries.push(cur.trim()); cur = ln; }
      else if (cur && /-$/.test(cur) && /^[a-z]/.test(ln)) cur = cur.slice(0, -1) + ln;
      else cur = cur ? cur + " " + ln : ln;
    });
    if (cur.trim()) entries.push(cur.trim());

    function titleOf(s) {
      s = s.replace(/^\d{1,3}\.\s+/, "");
      // Springer/LNCS style: the author block ends at the last initial or
      // "et al." followed by a colon
      var sp = /(?:[A-Z]\.|et\s+al\.)\s*:\s+/.exec(s);
      if (sp) {
        var t2 = s.slice(sp.index + sp[0].length);
        var e2 = t2.search(/[.?]\s+(?=In[:\s]|[A-Z(\u201C"])/);
        var tt = (e2 > 0 ? t2.slice(0, e2) : t2);
        tt = tt.replace(/\.?\s*(?:In:|arXiv preprint|Advances in|ACM Transactions|Proceedings of|IEEE|International Conference)\b[\s\S]*$/, "");
        return tt.replace(/\s+/g, " ").trim();
      }
      // walk sentence boundaries; skip initials ("J.") and "et al.";
      // the first real boundary ends the authors, the second ends the title
      var re = /[.?]\s+/g, b, authorsEnd = null, titleEnd = null;
      while ((b = re.exec(s))) {
        var before = s.slice(0, b.index);
        var lw = (before.match(/([A-Za-z]+)$/) || [, ""])[1];
        if (lw.length === 1) continue;
        if (lw === "al" || lw === "et") { if (authorsEnd === null) authorsEnd = b.index + b[0].length; continue; }
        if (authorsEnd === null) { authorsEnd = b.index + b[0].length; continue; }
        titleEnd = b.index; break;
      }
      if (authorsEnd === null) return "";
      var t = titleEnd !== null ? s.slice(authorsEnd, titleEnd) : s.slice(authorsEnd);
      return t.replace(/\s+/g, " ").trim();
    }
    return entries.map(function (raw) {
      return { raw: raw, title: titleOf(raw), arxiv: /arXiv preprint/i.test(raw) };
    }).filter(function (e) { return e.title.length >= 8; });
  }

  // Attach page + printed margin line number (when the review template has a
  // ruler) to PDF items that only carry a snippet.
  function rulerLineAt(pg, y) {
    var best = null, bd = 8;
    ((pg && pg.ruler) || []).forEach(function (m) {
      var d = Math.abs(m.y - y);
      if (d < bd) { bd = d; best = m.num; }
    });
    return best;
  }
  function locateItems(items, pages, pdfName) {
    if (!pages || !pages.length) return items;
    var taken = {};   // identical snippets consume occurrences in order
    function scan(it, needle, nospace) {
      var nd = nospace ? needle.replace(/\s+/g, "") : needle;
      if (nd.length < 4) return false;
      var tk = needle.replace(/\s+/g, "");
      var used = taken[tk] = taken[tk] || {};
      for (var p = 0; p < pages.length; p++) {
        var lines = pages[p].lines || [];
        for (var li = 0; li < lines.length; li++) {
          var hay = nospace ? lines[li].text.replace(/\s+/g, "")
                            : lines[li].text.replace(/\s+/g, " ");
          if (hay.indexOf(nd) >= 0) {
            var pk = p + ":" + li;
            if (used[pk]) continue;
            used[pk] = 1;
            it.page = p + 1; it.y = lines[li].y;
            var ln = rulerLineAt(pages[p], lines[li].y);
            if (ln) it.lineNo = ln;
            return true;
          }
        }
      }
      return false;
    }
    items.forEach(function (it) {
      if (it.page || (it.line && it.line > 0)) return;
      if (it.file !== pdfName || !it.snippet) return;
      var full = String(it.snippet).replace(/\s+/g, " ").trim();
      if (full.length < 4) return;
      if (scan(it, full.slice(0, 28), false)) return;
      if (scan(it, full.slice(0, 28), true)) return;
      // a flat-text sentence can start with a merged heading; drop it and retry
      var trimmed = full.replace(/^\d+(\.\d+)*\s+[A-Z][A-Z .\u2013\u2014-]*\s(?=[A-Z][a-z])/, "").replace(/^\d+\s+/, "");
      if (trimmed !== full && trimmed.length >= 8 &&
          (scan(it, trimmed.slice(0, 28), false) || scan(it, trimmed.slice(0, 28), true))) return;
      if (full.length > 14) { if (!scan(it, full.slice(0, 14), false)) scan(it, full.slice(0, 14), true); }
    });
    return items;
  }

  // Online reference check. Tries Semantic Scholar, then DBLP, then Crossref,
  // then arXiv. An entry is flagged only when none of the four can find it,
  // and then as a WARNING with a Google Scholar link for the hand check.
  // Google Scholar has no API and blocks automated queries, so it is the
  // click-through fallback, not the resolver. fetchFn is injected
  // (window.fetch in the browser, a mock in tests). Sends titles only.
  function _norm(s2) { return String(s2).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
  function _similar(a, b) {
    a = _norm(a); b = _norm(b);
    if (!a || !b) return false;
    if (a.indexOf(b) >= 0 || b.indexOf(a) >= 0) return true;
    var ta = a.split(" "), tb = b.split(" "), set = {}, inter = 0;
    ta.forEach(function (w) { set[w] = 1; });
    tb.forEach(function (w) { if (set[w]) { inter++; set[w] = 0; } });
    return inter / Math.max(ta.length, tb.length) >= 0.6;
  }
  function scholarLink(title) {
    return "https://scholar.google.com/scholar?q=" + encodeURIComponent(title);
  }

  async function verifyReferences(entries, fetchFn, opts) {
    opts = opts || {};
    var max = opts.max || entries.length, delayMs = opts.delayMs === undefined ? 1150 : opts.delayMs;
    var sleep = opts.sleep || function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    var items = [], netFail = 0;

    async function jget(url) {
      var res = await fetchFn(url);
      if (res.status === 429) { await sleep(3000); res = await fetchFn(url); }
      return res;
    }
    async function tryS2(title) {
      var res = await jget("https://api.semanticscholar.org/graph/v1/paper/search/match?query=" +
        encodeURIComponent(title) + "&fields=title,year,venue");
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("s2 " + res.status);
      var d = await res.json();
      var r = d && d.data && d.data[0];
      return r && r.title ? { title: r.title, venue: r.venue || "", year: r.year, source: "Semantic Scholar" } : null;
    }
    async function tryDblp(title) {
      var res = await jget("https://dblp.org/search/publ/api?format=json&h=5&q=" + encodeURIComponent(title));
      if (!res.ok) throw new Error("dblp " + res.status);
      var d = await res.json();
      var hits = (((d || {}).result || {}).hits || {}).hit || [];
      for (var i = 0; i < hits.length; i++) {
        var inf = hits[i].info || {};
        if (inf.title && _similar(title, inf.title))
          return { title: inf.title, venue: inf.venue || "", year: inf.year, source: "DBLP" };
      }
      return null;
    }
    async function tryCrossref(title) {
      var res = await jget("https://api.crossref.org/works?rows=5&select=title,container-title,issued&query.bibliographic=" +
        encodeURIComponent(title));
      if (!res.ok) throw new Error("crossref " + res.status);
      var d = await res.json();
      var list2 = (((d || {}).message || {}).items) || [];
      for (var i = 0; i < list2.length; i++) {
        var t = (list2[i].title || [])[0];
        if (t && _similar(title, t))
          return { title: t, venue: ((list2[i]["container-title"] || [])[0]) || "", year: null, source: "Crossref" };
      }
      return null;
    }
    async function tryArxiv(title, arxivId) {
      var url = arxivId
        ? "https://export.arxiv.org/api/query?id_list=" + encodeURIComponent(arxivId)
        : "https://export.arxiv.org/api/query?max_results=3&search_query=ti:%22" + encodeURIComponent(title) + "%22";
      var res = await jget(url);
      if (!res.ok) throw new Error("arxiv " + res.status);
      var xml = await res.text();
      var titles = [], mrx = /<title[^>]*>([\s\S]*?)<\/title>/g, mm;
      while ((mm = mrx.exec(xml))) titles.push(mm[1].replace(/\s+/g, " ").trim());
      titles.shift(); // the feed title
      for (var i = 0; i < titles.length; i++) {
        if (/^Error/i.test(titles[i])) continue;
        if (arxivId || _similar(title, titles[i]))
          return { title: titles[i], venue: "", year: null, source: "arXiv" };
      }
      return null;
    }

    var list = entries.slice(0, max);
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (opts.onProgress) opts.onProgress(i + 1, list.length, e.title);
      var arxivId = (e.raw.match(/arxiv[:\s\/]*(\d{4}\.\d{4,5})/i) || [])[1] || null;
      var found = null, closest = null, answered = false;
      var tries = [
        function () { return tryS2(e.title); },
        function () { return tryDblp(e.title); },
        function () { return tryCrossref(e.title); },
        function () { return tryArxiv(e.title, arxivId); },
      ];
      for (var t = 0; t < tries.length && !found; t++) {
        try {
          var r = await tries[t]();
          answered = true;
          if (r) {
            if (_similar(e.title, r.title) || r.source === "arXiv") found = r;
            else if (!closest) closest = r;
          }
        } catch (err) { netFail++; }
      }
      if (found) {
        if (e.arxiv && found.venue && !/arxiv|corr/i.test(found.venue)) {
          items.push({ file: "references", line: 0, severity: SEV_WARN, rule: "ref-published-version",
            message: "\"" + e.title + "\" is cited as an arXiv preprint but " + found.source +
              " lists a published version: " + found.venue + (found.year ? " " + found.year : "") +
              ". Cite the published version.", snippet: e.raw.slice(0, 160) });
        }
      } else if (closest) {
        items.push({ file: "references", line: 0, severity: SEV_INFO, rule: "ref-mismatch",
          message: "Closest match for \"" + e.title + "\" (" + closest.source + ") is \"" + closest.title +
            "\". Confirm the entry's title.", snippet: e.raw.slice(0, 160) });
      } else if (answered) {
        items.push({ file: "references", line: 0, severity: SEV_WARN, rule: "ref-not-found",
          message: "Could not verify \"" + e.title + "\" in Semantic Scholar, DBLP, Crossref, or arXiv. " +
            "Open the Google Scholar link and confirm the entry.",
          snippet: e.raw.slice(0, 160), link: scholarLink(e.title) });
      }
      if (i < list.length - 1 && delayMs) await sleep(delayMs);
    }
    if (netFail)
      items.push({ file: "references", line: 0, severity: SEV_INFO, rule: "ref-unverified",
        message: netFail + " lookup(s) failed on the network; the affected entries were checked against the remaining sources only.", snippet: "" });
    return items;
  }

  /* ------------------------------------------------------ shared metadata */
  // Order rules within a severity block by how much they matter to a reader,
  // not alphabetically. Lower number = shown first. Overstated claims and
  // missing evidence come before mechanical style (macros, quotes).
  var RULE_ORDER = [
    // substance: claims and evidence
    "abstract-overclaim", "abstract-gain", "abstract-cite", "abstract-url",
    "abstract-missing", "vague-claim",
    "no-ablation", "no-qualitative", "no-failure-insight",
    "baselines-related-work",
    // things that break the build or leak
    "template-abstract", "template-ref", "old-section", "placeholder-note",
    "placeholder", "draft-marker", "unresolved-ref", "unreferenced-label",
    "commented-out", "unused-file",
    // references
    "ref-placeholder", "ref-not-found", "ref-published-version", "ref-mismatch",
    "ref-unverified", "bibtex", "bib-misc", "bib-dup", "bib-arxiv", "bib-title-case",
    "refs-count", "cite-order",
    // anonymization
    "anon-metadata", "anon-source", "anon-authors", "anon-contact", "anon-ack",
    // layout the reader sees
    "trailing-text", "fig-caption-gap", "fig-below-gap", "short-caption",
    "caption-leadin", "raster-figure", "float-top", "float-per-file",
    "float-filename", "table-style", "table-vrules",
    // voice
    "voice/tense", "voice/passive", "ownership",
    // mechanical style, least urgent
    "name-macro", "lab-macros", "abbrev-macro", "math-macro", "math-bold-mixed",
    "metric-arrows", "textsc-dataset", "section-titlecase", "hyperparam-in-method",
    "cref", "quotes", "filler", "intensifier", "structure",
    "planlab-link", "planlab-logo", "planlab-slug",
    "lstlisting", "minted", "pdf-extract",
  ];
  var RULE_RANK = {};
  RULE_ORDER.forEach(function (r, i) { RULE_RANK[r] = i; });
  function ruleRank(r) { return (r in RULE_RANK) ? RULE_RANK[r] : 500; }

  // Short human labels for the collapsible rule sub-groups.
  var RULE_LABEL = {
    "abstract-overclaim": "Overstated claims in the abstract",
    "abstract-gain": "Abstract missing a quantitative gain",
    "abstract-cite": "Citations in the abstract",
    "abstract-url": "URLs in the abstract",
    "abstract-missing": "No abstract found",
    "vague-claim": "Vague, unquantified claims",
    "no-ablation": "No ablation in the main paper",
    "no-qualitative": "No qualitative results",
    "no-failure-insight": "No failure analysis",
    "baselines-related-work": "Baselines missing from Related Work",
    "template-abstract": "Template placeholder abstract",
    "template-ref": "Template placeholder text",
    "old-section": "Leftover duplicate section",
    "placeholder-note": "Leftover author notes",
    "placeholder": "Placeholder text",
    "draft-marker": "Draft markers left in",
    "unresolved-ref": "Unresolved cross-references (??)",
    "unreferenced-label": "Floats never referenced",
    "commented-out": "Large commented-out blocks",
    "unused-file": "Unused source files",
    "ref-placeholder": "Reference entries with author notes",
    "ref-not-found": "References that could not be verified",
    "ref-published-version": "arXiv preprints with a published version",
    "ref-mismatch": "Reference title mismatches",
    "ref-unverified": "References not checked online",
    "bibtex": "BibTeX problems",
    "bib-misc": "@misc entries",
    "bib-dup": "Duplicate bib entries",
    "bib-arxiv": "arXiv-only bib entries",
    "bib-title-case": "Bib title casing",
    "refs-count": "Reference count",
    "cite-order": "Citation ordering",
    "anon-metadata": "Author name in the PDF metadata",
    "anon-source": "Identifying commands in the source",
    "anon-contact": "Contact details on page 1",
    "anon-authors": "Author names / affiliation on page 1",
    "anon-authors": "Remove author names and affiliations from page 1; use the venue's anonymized byline placeholder.",
    "anon-ack": "Acknowledgments not anonymized",
    "trailing-text": "Dangling short last lines",
    "fig-caption-gap": "Figure/caption spacing too large",
    "fig-below-gap": "Space under a caption too large",
    "short-caption": "Captions too short",
    "caption-leadin": "Caption lead-ins",
    "raster-figure": "Raster figures (use vector)",
    "float-top": "Floats not placed at the top",
    "float-per-file": "More than one float per file",
    "float-filename": "Float filename conventions",
    "table-style": "Table style",
    "table-vrules": "Vertical rules in tables",
    "voice/tense": "Past tense in a 'we' sentence",
    "voice/passive": "Passive voice",
    "ownership": "'our model' / 'our method'",
    "name-macro": "Model-name macro not used",
    "lab-macros": "Lab macros not used",
    "abbrev-macro": "Abbreviation macros",
    "math-macro": "Math macros",
    "math-bold-mixed": "Mixed bold math",
    "metric-arrows": "Metric arrows",
    "textsc-dataset": "Dataset names not in \\textsc",
    "section-titlecase": "Section title casing",
    "hyperparam-in-method": "Hyperparameters in the method",
    "cref": "Hardcoded references (use \\cref)",
    "quotes": "Straight quotes",
    "filler": "Filler phrases",
    "intensifier": "Intensifiers",
    "structure": "Structure",
    "planlab-link": "PLAN Lab project link",
    "planlab-logo": "PLAN Lab logo",
    "planlab-slug": "PLAN Lab slug",
  };
  function ruleLabel(r) { return RULE_LABEL[r] || r; }

  var FIX_GUIDANCE = {
    "voice/tense": "Rewrite in plural active voice: \"We introduce\u2026\", not \"We introduced\u2026\".",
    "voice/passive": "Make it active: \"We evaluate X\", not \"X is evaluated\".",
    "cref": "Use \\cref{...} / \\Cref{...} instead of typing \"Section 4\", \"Figure 2\", \"Eq. (1)\".",
    "raster-figure": "Replace the .png/.jpg with a vector .pdf or .svg export.",
    "name-macro": "Use your method's name macro (\\modelnamenc), not \"our model/method/approach\".",
    "ownership": "Use your method's name macro (\\modelnamenc), not \"our model/method/approach\".",
    "abbrev-macro": "Replace literal e.g./i.e./etc. with the macros \\eg \\ie \\etc.",
    "filler": "Delete the filler lead-in / banned phrase; state the content directly.",
    "vague-claim": "Replace with a specific, measurable claim (e.g. \"+6.3% IoU\").",
    "intensifier": "Delete the filler word (very/really/basically/quite/actually\u2026).",
    "quotes": "Use \\dq{...} for double quotes (or ``...''), not straight \"...\".",
    "float-top": "Place the float at the top with [t!]: \\begin{table}[t!] / \\begin{figure}[t!]. (Full-width first-page teaser may stay [t].)",
    "bibtex": "Never write \\bibitem manually \u2014 use BibTeX entries in the .bib file.",
    "abstract": "Remove citations/equations from the abstract.",
    "abstract-url": "Camera-ready only: end the abstract with the project-page URL (e.g. https://plan-lab.github.io/MODELNAME).",
    "planlab-link": "Camera-ready (b): add the PLAN Lab project-page line to the abstract \u2014 \\noindent \\logoicon~\\href{https://plan-lab.github.io/MODELNAME}{\\textcolor{IllinoisBlue}{PLAN Lab}~\\textcolor{IllinoisOrange}{https://plan-lab.github.io/MODELNAME}} (set MODELNAME to your project slug).",
    "planlab-logo": "Camera-ready (a+c): in the preamble add \\definecolor{IllinoisOrange}{HTML}{FF5F05}, \\definecolor{IllinoisBlue}{HTML}{13294B}, and \\newcommand{\\logoicon}{\\raisebox{-0.20\\height}{\\includegraphics[height=1.2em]{plan_logo.pdf}}}; and place plan_logo.pdf in the project folder.",
    "planlab-slug": "Make the PLAN Lab slug identical in the href target and the displayed URL.",
    "draft-marker": "Remove drafting macros (\\todo, \\il, \\new) before submission.",
    "math-macro": "Use the lab math macro instead of raw (\\mathbb{E}->\\E, \\mathbb{R}->\\R, \\mathcal{L}->\\loss); don't redefine template math.",
    "math-bold-mixed": "Pick one bold command for math and use it throughout (\\mathbf OR \\bm/\\boldsymbol), so vectors/matrices are styled consistently.",
    "placeholder": "Remove the leftover template placeholder ([IL: ...], titlerunning stub, Confidential footer).",
    "section-titlecase": "Use Title Case for section titles (capitalize all major words).",
    "hyperparam-in-method": "Keep exact hyperparameter values/schedules in the Appendix Implementation Details, not the Method.",
    "table-style": "Use \\NiceTabular (lab style) rather than plain tabular.",
    "table-vrules": "Limit vertical borders; prefer booktabs rules.",
    "metric-arrows": "Add (\u2191)/(\u2193) next to each metric to show which direction is better.",
    "cite-order": "Order multiple numeric citations ascending, e.g. [1, 10, 56].",
    "float-per-file": "Put each figure/table in its own .tex file and \\input it.",
    "float-filename": "Name each float file to match its label (tab_main_results.tex -> tab:main_results).",
    "template-ref": "Delete the template placeholder BibTeX entries (Alpher/Anonymous/ECCV2022).",
    "bib-title-case": "Make BibTeX title casing consistent: sentence case, or wrap to preserve with {{...}}.",
    "long-sentence": "Check for a run-on; consider splitting into shorter sentences.",
    "commented-out": "Delete commented-out figures/tables/text \u2014 they leak in the arXiv source.",
    "bib-misc": "This @misc has a paper field \u2014 make it @article/@inproceedings with the real venue. Genuine blogs/links/model cards should stay @misc (add howpublished/note).",
    "bib-dup": "Rename one of the duplicate BibTeX keys so every key is unique.",
    "bib-arxiv": "Search online for a published version; if found, cite that (and note it), otherwise keep the arXiv entry.",
    "textsc-dataset": "Wrap the dataset name in \\textsc{} (e.g. \\textsc{GQA}).",
    "caption-leadin": "Start the caption with a bold Title Case lead-in: \\caption{\\textbf{...}}.",
    "unreferenced-label": "Reference this float/equation with \\cref{} in the text (or remove it). Unreferenced equations should be inlined.",
    "manual": "Judgment-based guideline the linter cannot auto-verify \u2014 review by hand or with the writing skill.",
    "lab-macros": "Build the paper from the official PLAN template so it imports macro.tex (\\input{macro}) with all lab-wide macros.",
    "unused-file": "Remove this file (or move it out of the project) \u2014 it is not part of the compiled paper and leaks into the arXiv source.",
    "trailing-text": "Rephrase the paragraph so its last line is not one or two dangling words (add or cut a few words upstream).",
    "anon-metadata": "Clear the identifying PDF metadata field before submitting (in LaTeX, \\hypersetup{pdfauthor={},pdfsubject={},pdfkeywords={}}; or strip metadata with exiftool/qpdf).",
    "anon-ack": "Remove the Acknowledgments section for the double-blind submission; add it back for the camera-ready.",
    "anon-contact": "Remove the email address or personal/GitHub link from page 1; use an anonymized link if a repository is required.",
    "anon-source": "Anonymize the author block: empty \\author{}, remove \\thanks/ORCID/emails and the acknowledgments, for the double-blind submission.",
    "skip-structure": "",
    "short-caption": "Write an informative caption with a bold Title Case lead-in (what is shown, what to notice).",
    "fig-caption-gap": "Set \\abovecaptionskip to ~10pt and crop the included graphic (pdfcrop) so the caption sits close under the figure.",
    "fig-below-gap": "Reduce \\belowcaptionskip / \\textfloatsep, or shrink the float's reserved height, so the text resumes near the caption.",
    "unresolved-ref": "Fix the \\ref/\\cref target (or add the missing \\label) and recompile twice so no '??' remains.",
    "template-abstract": "Replace the template placeholder with the real abstract (problem, idea, one quantitative gain).",
    "placeholder-note": "Resolve the note and delete it from the text.",
    "old-section": "Delete the leftover old section; keep only the current version.",
    "abstract-overclaim": "Attach a number to the claim or soften the wording.",
    "no-ablation": "Add at least one ablation to the main paper (lab experiments bar).",
    "no-qualitative": "Add at least one qualitative result to the main paper (lab experiments bar).",
    "no-failure-insight": "Add a short analysis of where and why the method fails (lab experiments bar).",
    "baselines-related-work": "Introduce every compared baseline in Related Work (and cite it) before it appears in the results table.",
    "ref-placeholder": "Verify the reference on Semantic Scholar / arXiv, correct the entry, and delete the note.",
    "ref-not-found": "Open the Google Scholar link, confirm the paper exists, then fix the entry or remove the citation.",
    "ref-published-version": "Replace the arXiv entry with the published version (venue + year).",
    "ref-mismatch": "Check the entry's title against the actual paper.",
    "ref-unverified": "Re-run the online reference check for the remaining entries.",
    "pdf-extract": "If the PDF is a scan/image export, prose checks cannot run \u2014 upload the LaTeX source for the full check.",
    "abstract-gain": "State at least one quantitative relative gain in the abstract, e.g. \"improves X by xx.x%\".",
    "abstract-cite": "Remove citations/equations from the abstract.",
    "abstract-missing": "Make sure the paper has a clearly labeled Abstract.",
    "structure": "Add the missing section (or check that the heading extracted cleanly).",
    "refs-count": "Densify Related Work: ~10\u201320 focused references, mostly top venues.",
    "io": "File could not be read.",
    "skip": "",
  };

  var SEV_META = {
    ERROR: ["Errors", "Clear guideline violations. Fix before sending to the PI."],
    WARN: ["Warnings", "Very likely issues that need a human eye."],
    INFO: ["Notes", "Style nudges. Address where they apply."],
  };

  function verdict(summary) {
    var err = summary.ERROR || 0, warn = summary.WARN || 0;
    if (err > 0) {
      return ["not-ready", "Not ready", false,
        err + " error" + (err !== 1 ? "s" : "") + " to fix before this goes to the PI."];
    }
    if (warn > 0) {
      return ["needs-fixes", "Almost there", true,
        "No errors. " + warn + " warning" + (warn !== 1 ? "s" : "") + " to review, then it is good to send."];
    }
    return ["good", "Good to go", true,
      "No mechanical issues. Do the human read (contributions, citations, figures) and submit."];
  }

  var SEV_ORDER = { ERROR: 0, WARN: 1, INFO: 2 };

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escAttr(s) { return esc(s).replace(/"/g, "&quot;"); }

  var UNREFERENCED_RANK = 1000000;

  /* Standalone HTML report (same layout as the CLI --html report). */
  var REPORT_CSS = ":root{--blue:#13294B;--orange:#FF5F05;--err:#C13B1B;--warn:#FF5F05;--info:#13294B;--bg:#f5f6f8;--card:#fff;--line:#e3e6ea;--ink:#1b1f24;--mut:#6b727c;}" +
    "*{box-sizing:border-box}" +
    "body{margin:0;font:15px/1.55 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:var(--bg);}" +
    ".hero{background:var(--blue);color:#fff;border-bottom:5px solid var(--orange);padding:24px 20px 20px;}" +
    ".hero .inner{max-width:1000px;margin:0 auto;}" +
    ".hero h1{font-size:22px;margin:0 0 3px;color:#fff;}" +
    ".hero .sub{color:#c7d0de;font-size:13px;margin:0;}" +
    ".wrap{max-width:1000px;margin:0 auto;padding:24px 20px 80px;}" +
    "h1{font-size:22px;margin:0 0 2px;}" +
    ".sub{color:var(--mut);font-size:13px;margin-bottom:18px;}" +
    ".summary{display:flex;gap:12px;flex-wrap:wrap;margin:14px 0 22px;}" +
    ".pill{border-radius:10px;padding:10px 16px;color:#fff;font-weight:600;display:flex;flex-direction:column;min-width:96px;}" +
    ".pill .n{font-size:22px;line-height:1;}" +
    ".pill .l{font-size:11px;text-transform:uppercase;letter-spacing:.06em;opacity:.92;margin-top:4px;}" +
    ".pill.err{background:var(--err)} .pill.warn{background:var(--warn)} .pill.info{background:var(--info)}" +
    ".note{background:#fff8e6;border:1px solid #f0e0a8;border-radius:8px;padding:10px 14px;font-size:13px;color:#7a5c00;margin-bottom:22px;}" +
    ".file{background:var(--card);border:1px solid var(--line);border-radius:10px;margin-bottom:16px;overflow:hidden;}" +
    ".file>summary{cursor:pointer;padding:12px 16px;font-weight:600;font-size:14px;display:flex;justify-content:space-between;align-items:center;background:#fbfcfd;}" +
    ".file>summary::-webkit-details-marker{display:none}" +
    ".fpath{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;font-weight:400;color:var(--mut);margin-left:9px;}" +
    ".orphan{font-family:-apple-system,sans-serif;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--mut);background:#eef0f3;border:1px solid var(--line);border-radius:5px;padding:2px 6px;margin-left:9px;}" +
    ".counts{font-weight:400;color:var(--mut);font-family:-apple-system,sans-serif;}" +
    ".counts b{font-family:inherit}" +
    ".rulegrp{margin:6px 0;border:1px solid var(--line);border-radius:8px;overflow:hidden;}" +
    ".rulegrp>summary{cursor:pointer;list-style:none;padding:8px 12px;background:#fafafc;display:flex;align-items:center;gap:10px;font-size:14px;}" +
    ".rulegrp>summary::-webkit-details-marker{display:none;}" +
    ".rulegrp>summary::before{content:\"\\25b8\";color:#999;font-size:11px;}" +
    ".rulegrp[open]>summary::before{content:\"\\25be\";}" +
    ".rulegrp .rlabel{font-weight:600;}" +
    ".rulegrp .rname{color:#9aa;font-family:ui-monospace,monospace;font-size:12px;}" +
    ".rulegrp .rcount{margin-left:auto;background:#ececf2;border-radius:10px;padding:1px 9px;font-size:12px;color:#555;}" +
    ".rulegrp .issue{border-top:1px solid var(--line);}" +
    ".issue{border-top:1px solid var(--line);padding:11px 16px 12px;display:grid;grid-template-columns:26px 64px 52px 1fr;gap:10px;align-items:start;}" +
    ".fix-sel{width:16px;height:16px;margin-top:2px;cursor:pointer;}" +
    ".fixbar{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin:0 0 16px;font-size:13px;}" +
    ".fixbar button{font:inherit;cursor:pointer;border:1px solid var(--line);background:#fff;border-radius:7px;padding:5px 11px;}" +
    ".fixbar #copybtn{background:var(--blue);color:#fff;border-color:var(--blue);font-weight:500;margin-left:auto;}" +
    ".badge{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#fff;border-radius:5px;padding:3px 0;text-align:center;height:fit-content;}" +
    ".badge.err{background:var(--err)} .badge.warn{background:var(--warn)} .badge.info{background:var(--info)}" +
    ".loc{color:var(--mut);font-family:ui-monospace,monospace;font-size:12px;padding-top:1px;}" +
    ".msg{margin:0}" +
    ".rule{display:inline-block;font-family:ui-monospace,monospace;font-size:11px;background:#eef1f4;color:#475;border-radius:4px;padding:1px 6px;margin-right:6px;}" +
    ".fix{color:var(--mut);font-size:13px;margin-top:3px;}" +
    ".snip{font-family:ui-monospace,monospace;font-size:12px;background:#f3f4f6;border-radius:5px;padding:5px 8px;margin-top:6px;color:#374;white-space:pre-wrap;word-break:break-word;}" +
    ".manual{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin-top:22px;}" +
    ".manual h2{font-size:15px;margin:0 0 8px;}" +
    ".manual .mi{display:flex;gap:9px;align-items:flex-start;padding:6px 0;border-top:1px solid var(--line);font-size:13.5px;}" +
    ".manual .mi:first-of-type{border-top:none}" +
    ".manual .tag{font-family:ui-monospace,monospace;font-size:11px;background:#eef1f4;border-radius:4px;padding:1px 6px;white-space:nowrap;}" +
    ".legend{margin-top:26px;font-size:13px;color:var(--mut);}" +
    "footer{margin-top:26px;color:var(--mut);font-size:12px;}";

  var REPORT_JS = "function updcount(){document.getElementById('selcount').textContent=document.querySelectorAll('.fix-sel:checked').length;}" +
    "function selAll(v){document.querySelectorAll('.fix-sel').forEach(function(c){c.checked=v;});updcount();}" +
    "function buildPrompt(){var items=[].slice.call(document.querySelectorAll('.fix-sel:checked')).map(function(c,i){return (i+1)+'. ['+c.dataset.rule+'] '+c.dataset.loc+' \\u2014 '+c.dataset.issue+(c.dataset.fix?'  (fix: '+c.dataset.fix+')':'');});if(!items.length){return null;}return 'Using the plan-paper-writing skill, revise the paper to fix ONLY these selected items, then recompile and confirm it still builds:\\n\\n'+items.join('\\n');}" +
    "function copyFixes(){var p=buildPrompt();if(!p){alert('Tick at least one item first.');return;}var btn=document.getElementById('copybtn');var ta=document.createElement('textarea');ta.value=p;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(680px,92vw);height:240px;z-index:99999;padding:12px;border:2px solid #13294B;border-radius:8px;font:12.5px ui-monospace,monospace;background:#fff;';document.body.appendChild(ta);ta.focus();ta.select();var ok=false;try{ok=document.execCommand('copy');}catch(e){}if(ok){document.body.removeChild(ta);btn.textContent='Copied \\u2014 paste into Claude';setTimeout(function(){btn.innerHTML='Copy \\u201cFix selected\\u201d prompt';},2600);return;}var ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:99998;';var hint=document.createElement('div');hint.textContent='Press \\u2318/Ctrl+C to copy, then click anywhere to close';hint.style.cssText='position:fixed;left:50%;top:calc(50% + 140px);transform:translateX(-50%);z-index:99999;color:#fff;font:13px sans-serif;';function close(){[ta,ov,hint].forEach(function(e){if(e.parentNode)e.parentNode.removeChild(e);});}ov.onclick=close;document.body.appendChild(ov);document.body.appendChild(ta);document.body.appendChild(hint);ta.focus();ta.select();}";

  function renderReportHtml(result, title, subLine) {
    var order = result.order || {};
    var hasOrder = Object.keys(order).length > 0;
    var SRK = { ERROR: 0, WARN: 1, INFO: 2 };
    function frank(f) {
      if (hasOrder && (f in order)) return order[f];
      return /\.pdf$/i.test(String(f)) ? 2000000 : UNREFERENCED_RANK;
    }
    var items = result.items.filter(function (it) { return it.rule !== "skip"; }).slice().sort(function (a, b) {
      var sa = SRK[a.severity] !== undefined ? SRK[a.severity] : 9;
      var sb = SRK[b.severity] !== undefined ? SRK[b.severity] : 9;
      if (sa !== sb) return sa - sb;
      var fa = frank(a.file), fb = frank(b.file);
      if (fa !== fb) return fa - fb;
      if (a.file !== b.file) return a.file < b.file ? -1 : 1;
      if ((a.line || 0) !== (b.line || 0)) return (a.line || 0) - (b.line || 0);
      var pa = a.page || 9999, pb = b.page || 9999;
      if (pa !== pb) return pa - pb;
      return (b.y || 0) - (a.y || 0);
    });
    var firstIdx = {};
    items.forEach(function (it, ix) {
      var k = it.severity + "|" + it.rule;
      if (!(k in firstIdx)) firstIdx[k] = ix;
    });
    items = items.map(function (it, ix) { return { it: it, ix: ix }; }).sort(function (a, b) {
      var sa = SRK[a.it.severity] !== undefined ? SRK[a.it.severity] : 9;
      var sb = SRK[b.it.severity] !== undefined ? SRK[b.it.severity] : 9;
      if (sa !== sb) return sa - sb;
      if (a.it.severity !== "ERROR") {
        var fa = firstIdx[a.it.severity + "|" + a.it.rule], fb = firstIdx[b.it.severity + "|" + b.it.rule];
        if (fa !== fb) return fa - fb;
      }
      return a.ix - b.ix;
    }).map(function (x) { return x.it; });

    var sevClass = { ERROR: "err", WARN: "warn", INFO: "info" };
    var sevName = { ERROR: "Must fix", WARN: "Warning", INFO: "Minor" };
    var sevDesc = {
      ERROR: "Clear violations. Fix these before the draft goes anywhere.",
      WARN: "Very likely issues. Give each a look.",
      INFO: "Style nudges.",
    };
    function locOf(it) {
      if (it.line) return basename(it.file) + " : L" + it.line;
      if (it.page) return "p." + it.page + (it.lineNo ? " L" + it.lineNo : "");
      return "\u2014";
    }
    function rowHtml(it) {
      var sc = sevClass[it.severity];
      var fix = FIX_GUIDANCE[it.rule] || "";
      var fixHtml = fix ? '<div class="fix">\u21b3 ' + esc(fix) + "</div>" : "";
      var link = it.link ? ' <a href="' + escAttr(it.link) + '" target="_blank" rel="noopener">Google Scholar \u2197</a>' : "";
      var snip = it.snippet ? '<div class="snip">' + esc(it.snippet) + "</div>" : "";
      var loc = locOf(it);
      var dataLoc = it.line ? it.file + ":L" + it.line
        : (it.page ? it.file + " p." + it.page + (it.lineNo ? " L" + it.lineNo : "") : it.file);
      var cb = '<input type="checkbox" class="fix-sel" onchange="updcount()" ' +
        'data-rule="' + escAttr(it.rule) + '" data-loc="' + escAttr(dataLoc) + '" ' +
        'data-issue="' + escAttr(it.message) + '" data-fix="' + escAttr(fix) + '">';
      return '<div class="issue">' + cb + '<div class="badge ' + sc + '">' + sevName[it.severity] + "</div>" +
        '<div class="loc">' + esc(loc) + '</div><div><p class="msg">' + esc(it.message) + link + "</p>" +
        fixHtml + snip + "</div></div>";
    }
    var blocks = [];
    ["ERROR", "WARN", "INFO"].forEach(function (sev) {
      var fitems = items.filter(function (it) { return it.severity === sev; });
      if (!fitems.length) return;
      // group by rule; order rule groups by priority (ERROR) or first-seen (WARN/INFO)
      var groups = {}, firstSeen = {};
      fitems.forEach(function (it, ix) {
        (groups[it.rule] = groups[it.rule] || []).push(it);
        if (!(it.rule in firstSeen)) firstSeen[it.rule] = ix;
      });
      var ruleKeys = Object.keys(groups).sort(function (a, b) {
        if (sev === "ERROR") {
          var ra = ruleRank(a), rb = ruleRank(b);
          if (ra !== rb) return ra - rb;
        }
        return firstSeen[a] - firstSeen[b];
      });
      var sub = ruleKeys.map(function (rk) {
        var g = groups[rk];
        var rows = g.map(rowHtml).join("");
        return '<details class="rulegrp"><summary><span class="rlabel">' + esc(ruleLabel(rk)) +
          '</span><span class="rname">' + esc(rk) + '</span>' +
          '<span class="rcount">' + g.length + "</span></summary>" + rows + "</details>";
      }).join("");
      blocks.push('<details class="file" open><summary><span><b>' + sevName[sev] + " (" + fitems.length + ")</b>" +
        '<span class="fpath">' + sevDesc[sev] + "</span></span></summary>" + sub + "</details>");
    });


    var cnt = result.summary || {};
    var d = new Date();
    function p2(x) { return (x < 10 ? "0" : "") + x; }
    var date = d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()) + " " + p2(d.getHours()) + ":" + p2(d.getMinutes());

    return "<!DOCTYPE html>\n<html lang=\"en\"><head><meta charset=\"utf-8\">\n" +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      "<title>PLAN Lab Guideline Report \u2014 " + esc(title) + "</title>\n" +
      "<style>" + REPORT_CSS + "</style></head><body>\n" +
      '<div class="hero"><div class="inner"><h1>PLAN Lab Guideline Report</h1>\n' +
      '<div class="sub">' + esc(title) + " &middot; generated " + date +
      (subLine ? " &middot; " + esc(subLine) : "") + "</div></div></div>\n" +
      '<div class="wrap">\n' +
      '<div class="summary">' +
      '<div class="pill err"><span class="n">' + (cnt.ERROR || 0) + '</span><span class="l">Must fix</span></div>' +
      '<div class="pill warn"><span class="n">' + (cnt.WARN || 0) + '</span><span class="l">Warnings</span></div>' +
      '<div class="pill info"><span class="n">' + (cnt.INFO || 0) + '</span><span class="l">Minor</span></div>' +
      "</div>\n" +
      '<div class="note"><b>How to use this:</b> Tick the items you want fixed, then click <b>Copy \u201cFix selected\u201d prompt</b> and paste it into Claude \u2014 it will revise the paper on just those, using the writing skill. <b>Must fix</b> (red) break the build or violate hard rules; <b>Warnings</b> (amber) need a look; <b>Minor</b> (blue) are nudges.</div>\n' +
      '<div class="fixbar"><span><b id="selcount">0</b> selected</span>' +
      '<button onclick="selAll(true)">Select all</button>' +
      '<button onclick="selAll(false)">Clear</button>' +
      '<button id="copybtn" onclick="copyFixes()">Copy &ldquo;Fix selected&rdquo; prompt</button></div>\n' +
      (blocks.join("") || "<p>No issues found. \u2705</p>") +
      
      '<div class="legend">Severity: <b style="color:var(--err)">Must fix</b> = clear violation / breaks build &nbsp;\u00b7&nbsp; <b style="color:var(--warn)">Warning</b> = likely violation, needs a look &nbsp;\u00b7&nbsp; <b style="color:var(--info)">Minor</b> = style nudge.</div>\n' +
      "<footer>Generated by the PLAN Lab Paper Pre-Check (runs fully in the browser; files never leave the machine). This catches mechanizable issues \u2014 whether each citation supports its claim, and figure design quality, still need a human read.</footer>\n" +
      "</div>\n<script>" + REPORT_JS + "</scr" + "ipt>\n</body></html>";
  }

  var api = {
    runSource: runSource,
    checkPdfText: checkPdfText,
    checkTrailingText: checkTrailingText,
    checkFigureSpacing: checkFigureSpacing,
    checkPdfQuality: checkPdfQuality,
    parseReferences: parseReferences,
    verifyReferences: verifyReferences,
    locateItems: locateItems,
    ruleRank: ruleRank,
    ruleLabel: ruleLabel,
    FIGGAP: FIGGAP,
    anonMeta: anonMeta,
    anonText: anonText,
    anonSource: anonSource,
    checkTex: checkTex,
    checkBib: checkBib,
    findPaperRoot: findPaperRoot,
    sectionOrder: sectionOrder,
    sectionLabel: sectionLabel,
    verdict: verdict,
    renderReportHtml: renderReportHtml,
    FIX_GUIDANCE: FIX_GUIDANCE,
    SEV_META: SEV_META,
    SEV_ORDER: SEV_ORDER,
    EXTRA_DATASETS: EXTRA_DATASETS,
    _normPath: normPath,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.PlanCheck = api;
})(typeof window !== "undefined" ? window : globalThis);
