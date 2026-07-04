/* Extract line-structured text from a pdf.js document. Shared by the site and
 * the node smoke test so the browser behavior is exactly what was tested. */
(function (global) {
  "use strict";
  async function extractPdfText(pdf) {
    var pages = [];
    for (var p = 1; p <= pdf.numPages; p++) {
      var page = await pdf.getPage(p);
      var vp0 = page.getViewport({ scale: 1 });
      var tc = await page.getTextContent();
      // margin ruler numbers (review templates) pollute sentences; drop them
      var counts0 = {};
      tc.items.forEach(function (it0) {
        if (it0 && typeof it0.str === "string" && /^\d{1,3}$/.test(it0.str.trim()) && it0.transform) {
          var k0 = Math.round(it0.transform[4]);
          counts0[k0] = (counts0[k0] || 0) + 1;
        }
      });
      var rulerX0 = {};
      Object.keys(counts0).forEach(function (k0) {
        var x0 = parseInt(k0, 10);
        if (counts0[k0] >= 10 && (x0 < 0.16 * vp0.width || x0 > 0.84 * vp0.width)) rulerX0[k0] = true;
      });
      var out = "";
      var lastY = null, lastEndX = null;
      for (var i = 0; i < tc.items.length; i++) {
        var item = tc.items[i];
        if (typeof item.str !== "string") continue;
        if (/^\d{1,3}$/.test(item.str.trim()) && item.transform &&
            rulerX0[Math.round(item.transform[4])]) continue;
        var x = item.transform ? item.transform[4] : null;
        var y = item.transform ? item.transform[5] : null;
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
          out += "\n";
          lastEndX = null;
        } else if (lastEndX !== null && x !== null && x - lastEndX > 1 &&
                   out && !/\s$/.test(out) && item.str && !/^\s/.test(item.str)) {
          out += " ";
        }
        out += item.str;
        if (item.hasEOL) {
          out += "\n";
          lastY = null; lastEndX = null;
        } else {
          if (y !== null) lastY = y;
          lastEndX = (x !== null && typeof item.width === "number") ? x + item.width : null;
        }
      }
      pages.push(out);
    }
    return pages.join("\n\n");
  }
  // Per-line geometry (position + width + height), grouped by baseline.
  // Used for trailing-text detection and the page-1 anonymization scan.
  // Review templates (ICLR/CVPR/NeurIPS) print ruler line numbers in the
  // margins at the same baselines as the text; if kept, they merge into the
  // lines and wreck every width measurement, so they are stripped first.
  function stripRulerTokens(raw, pageWidth) {
    var counts = {};
    raw.forEach(function (g) {
      if (/^\d{1,3}$/.test(g.str.trim())) {
        var key = Math.round(g.x);
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    var rulerX = {};
    Object.keys(counts).forEach(function (k) {
      var x = parseInt(k, 10);
      var inMargin = x < 0.16 * pageWidth || x > 0.84 * pageWidth;
      if (counts[k] >= 10 && inMargin) rulerX[k] = true;
    });
    if (!Object.keys(rulerX).length) return { items: raw, marks: [] };
    var marks = [];
    var kept = raw.filter(function (g) {
      var isNum = /^\d{1,3}$/.test(g.str.trim());
      if (isNum && rulerX[Math.round(g.x)]) { marks.push({ y: g.y, num: g.str.trim() }); return false; }
      return true;
    });
    return { items: kept, marks: marks };
  }

  async function extractPdfLines(pdf) {
    var pages = [];
    for (var p = 1; p <= pdf.numPages; p++) {
      var page = await pdf.getPage(p);
      var vp = page.getViewport({ scale: 1 });
      var tc = await page.getTextContent();
      var raw = [];
      for (var i = 0; i < tc.items.length; i++) {
        var it = tc.items[i];
        if (typeof it.str !== "string" || !it.str.trim()) continue;
        var tr = it.transform || [1, 0, 0, 1, 0, 0];
        var h = Math.hypot(tr[2], tr[3]) || it.height || 8;
        var x = tr[4], y = tr[5], wdt = typeof it.width === "number" ? it.width : 0;
        raw.push({ x: x, y: y, h: h, xL: x, xR: x + wdt, str: it.str, f: it.fontName || "" });
      }
      var sr = stripRulerTokens(raw, vp.width);
      raw = sr.items;
      var rulerMarks = sr.marks;
      raw.sort(function (a, b) { return (b.y - a.y) || (a.x - b.x); });
      var groups = [], cur = null;
      for (var r = 0; r < raw.length; r++) {
        var g = raw[r];
        if (cur && Math.abs(g.y - cur.y) <= Math.max(2, (g.h || 8) * 0.6)) {
          cur.items.push(g);
        } else { if (cur) groups.push(cur); cur = { y: g.y, items: [g] }; }
      }
      if (cur) groups.push(cur);
      // split each baseline group where a large horizontal gap separates
      // items: a wrapfigure caption or a second column shares the baseline
      // with body text and must not merge into one line
      var lines = [];
      groups.forEach(function (ln) {
        var its = ln.items.sort(function (a, b) { return a.x - b.x; });
        var segs = [[its[0]]];
        for (var si = 1; si < its.length; si++) {
          var gpx = its[si].xL - its[si - 1].xR;
          var lim = Math.max(9, 1.1 * (its[si].h || 8));
          if (gpx > lim) segs.push([its[si]]);
          else segs[segs.length - 1].push(its[si]);
        }
        segs.forEach(function (seg) {
          var xs = seg.map(function (i) { return i.xL; });
          var xe = seg.map(function (i) { return i.xR; });
          var hs = seg.map(function (i) { return i.h; });
          var parts = [];
          var fcount = {};
          for (var fi = 0; fi < seg.length; fi++) {
            var fk = seg[fi].f || "";
            fcount[fk] = (fcount[fk] || 0) + seg[fi].str.length;
          }
          var segFont = "", fbest = -1;
          Object.keys(fcount).forEach(function (k) { if (fcount[k] > fbest) { fbest = fcount[k]; segFont = k; } });
          for (var pi2 = 0; pi2 < seg.length; pi2++) {
            if (pi2 > 0) {
              var gg = seg[pi2].xL - seg[pi2 - 1].xR;
              if (gg > Math.max(1.5, 0.22 * (seg[pi2].h || 8)) &&
                  !/\s$/.test(seg[pi2 - 1].str) && !/^\s/.test(seg[pi2].str)) parts.push(" ");
            }
            parts.push(seg[pi2].str);
          }
          lines.push({
            text: parts.join("").replace(/\s+/g, " ").trim(),
            xL: Math.min.apply(null, xs), xR: Math.max.apply(null, xe),
            y: ln.y, h: Math.max.apply(null, hs), font: segFont,
          });
        });
      });
      pages.push({ lines: lines, width: vp.width, height: vp.height, ruler: rulerMarks });
    }
    return pages;
  }
  // Bounding boxes of drawn images per page, from the operator list.
  // An image paints the unit square through the current transform, so tracking
  // save/restore/transform gives its box in the same coordinates as the text.
  // OPS is the pdf.js OPS table (pass pdfjsLib.OPS in the browser).
  async function extractImageBoxes(pdf, OPS) {
    function mul(m1, m2) {
      return [
        m1[0] * m2[0] + m1[2] * m2[1],
        m1[1] * m2[0] + m1[3] * m2[1],
        m1[0] * m2[2] + m1[2] * m2[3],
        m1[1] * m2[2] + m1[3] * m2[3],
        m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
        m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
      ];
    }
    var pages = [];
    for (var p = 1; p <= pdf.numPages; p++) {
      var boxes = [];
      try {
        var page = await pdf.getPage(p);
        var ops = await page.getOperatorList();
        var ctm = [1, 0, 0, 1, 0, 0];
        var stack = [];
        for (var i = 0; i < ops.fnArray.length; i++) {
          var fn = ops.fnArray[i], args = ops.argsArray[i];
          if (fn === OPS.save) stack.push(ctm.slice());
          else if (fn === OPS.restore) ctm = stack.pop() || ctm;
          else if (fn === OPS.transform) ctm = mul(ctm, args);
          else if (fn === OPS.paintFormXObjectBegin) {
            stack.push(ctm.slice());
            if (args && args[0]) ctm = mul(ctm, args[0]);
          } else if (fn === OPS.paintFormXObjectEnd) {
            ctm = stack.pop() || ctm;
          } else if (fn === OPS.paintImageXObject ||
                     fn === OPS.paintInlineImageXObject ||
                     fn === OPS.paintImageMaskXObject ||
                     fn === OPS.paintImageXObjectRepeat) {
            var xs = [], ys = [];
            [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(function (uv) {
              xs.push(ctm[0] * uv[0] + ctm[2] * uv[1] + ctm[4]);
              ys.push(ctm[1] * uv[0] + ctm[3] * uv[1] + ctm[5]);
            });
            var box = {
              xL: Math.min.apply(null, xs), xR: Math.max.apply(null, xs),
              yBottom: Math.min.apply(null, ys), yTop: Math.max.apply(null, ys),
            };
            if (box.xR - box.xL > 15 && box.yTop - box.yBottom > 15) boxes.push(box);
          }
        }
      } catch (e) { /* keep going; this page just has no measured images */ }
      pages.push(boxes);
    }
    return pages;
  }

  var api = { extractPdfText: extractPdfText, extractPdfLines: extractPdfLines,
              extractImageBoxes: extractImageBoxes };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.PlanPdfExtract = api;
})(typeof window !== "undefined" ? window : globalThis);
