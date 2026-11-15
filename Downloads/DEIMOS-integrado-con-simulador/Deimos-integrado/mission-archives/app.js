(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var worldsEl = $('worlds'), story = $('story'), storyBody = $('storyBody'),
      storyClose = $('storyClose'), storyTitle = $('storyTitle'),
      tabH = $('tabH'), tabD = $('tabD');
  function mod(a, n) { return ((a % n) + n) % n; }

  /* ================= DIBUJOS (SVG) ================= */
  function svg(inner) {
    return '<svg viewBox="0 0 240 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<ellipse cx="120" cy="135" rx="104" ry="5" fill="rgba(0,0,0,.35)"/>' + inner + '</svg>';
  }
  function svgAir(inner) {
    return '<svg viewBox="0 0 240 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + inner + '</svg>';
  }
  function wheel(cx, r, col) {
    var cy = 134 - r, s = '';
    s += '<g class="wheel" style="transform-origin:' + cx + 'px ' + cy + 'px">';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#26262b"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 4) + '" fill="' + col + '"/>';
    [0, 45, 90, 135].forEach(function (a) {
      s += '<line x1="' + (cx - r + 4) + '" y1="' + cy + '" x2="' + (cx + r - 4) + '" y2="' + cy +
           '" stroke="#26262b" stroke-width="2" transform="rotate(' + a + ' ' + cx + ' ' + cy + ')"/>';
    });
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="#26262b"/>';
    s += '<circle cx="' + cx + '" cy="' + (cy - r + 7) + '" r="2.2" fill="#f5e6c8"/>';
    return s + '</g>';
  }
  function wheels(xs, r, col) {
    return xs.map(function (x) { return wheel(x, r, col); }).join('');
  }

  function sojourner() {
    return svg(
      '<path d="M90 120 L125 92 L160 120" stroke="#8f959c" stroke-width="4" fill="none" stroke-linejoin="round"/>' +
      wheels([90, 125, 160], 14, '#b9bfc6') +
      '<rect x="78" y="72" width="96" height="30" rx="4" fill="#c9ced4" stroke="#8d939a" stroke-width="2"/>' +
      '<polygon points="70,72 182,72 172,48 80,48" fill="#1c2a63" stroke="#aab4d8" stroke-width="1.5"/>' +
      '<path d="M98 48 L92 72 M125 48 L125 72 M152 48 L158 72 M75 60 H177" stroke="#4b63b8" stroke-width="1"/>' +
      '<line x1="160" y1="48" x2="160" y2="14" stroke="#ddd" stroke-width="2"/>' +
      '<circle cx="160" cy="13" r="3" fill="#ddd"/>' +
      '<circle cx="170" cy="86" r="4" fill="#222"/><circle cx="169" cy="85" r="1.2" fill="#8fb7ff"/>'
    );
  }
  function mer(bodyCol, panelCol) {
    return svg(
      '<path d="M88 118 L118 90 H172 L168 118 M128 118 L118 90" stroke="#8f959c" stroke-width="4" fill="none" stroke-linejoin="round"/>' +
      wheels([88, 128, 168], 16, '#b9bfc6') +
      '<rect x="70" y="74" width="100" height="26" rx="5" fill="' + bodyCol + '" stroke="#8d939a" stroke-width="2"/>' +
      '<polygon points="52,74 188,74 200,60 64,60" fill="' + panelCol + '" stroke="#b8c2e8" stroke-width="1.5"/>' +
      '<path d="M90 60 L86 74 M115 60 L113 74 M140 60 L140 74 M165 60 L167 74 M58 67 H194" stroke="#5d77c9" stroke-width="1"/>' +
      '<line x1="148" y1="60" x2="148" y2="26" stroke="#cfd4da" stroke-width="3"/>' +
      '<rect x="136" y="18" width="26" height="10" rx="2" fill="#2d2d33"/>' +
      '<circle cx="143" cy="23" r="3" fill="#8fb7ff"/><circle cx="155" cy="23" r="3" fill="#8fb7ff"/>' +
      '<line x1="90" y1="60" x2="90" y2="42" stroke="#bbb" stroke-width="2"/>' +
      '<ellipse cx="90" cy="40" rx="14" ry="6" fill="#e8e8e8" stroke="#999" transform="rotate(-15 90 40)"/>' +
      '<path d="M170 88 L195 94 L206 106" stroke="#aeb4ba" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<circle cx="207" cy="107" r="4" fill="#555"/>'
    );
  }
  function curiosity() {
    return svg(
      '<path d="M78 113 L118 88 H175 L172 113 M125 113 L118 88" stroke="#8f959c" stroke-width="5" fill="none" stroke-linejoin="round"/>' +
      wheels([78, 125, 172], 21, '#aeb4ba') +
      '<rect x="28" y="66" width="34" height="14" rx="3" fill="#4a4a50"/>' +
      '<path d="M36 66 V80 M42 66 V80 M48 66 V80 M54 66 V80" stroke="#77777e" stroke-width="2"/>' +
      '<rect x="60" y="58" width="120" height="36" rx="6" fill="#d7dbe0" stroke="#8d939a" stroke-width="2"/>' +
      '<rect x="60" y="54" width="120" height="6" rx="2" fill="#b8bec5"/>' +
      '<polygon points="70,54 78,42 94,42 102,54 94,58 78,58" fill="#e5e5e5" stroke="#999" stroke-width="1.5"/>' +
      '<line x1="150" y1="54" x2="150" y2="22" stroke="#cfd4da" stroke-width="3"/>' +
      '<rect x="138" y="12" width="28" height="12" rx="2" fill="#2d2d33"/>' +
      '<circle cx="145" cy="18" r="3" fill="#8fb7ff"/><circle cx="158" cy="18" r="3" fill="#8fb7ff"/>' +
      '<path d="M180 78 L205 70 L214 84" stroke="#aeb4ba" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="214" cy="86" r="6" fill="#555"/><circle cx="212" cy="85" r="1.6" fill="#ccc"/><circle cx="216" cy="88" r="1.6" fill="#ccc"/>'
    );
  }
  function perseverance() {
    return svg(
      '<path d="M78 113 L118 88 H175 L172 113 M125 113 L118 88" stroke="#7f858c" stroke-width="5" fill="none" stroke-linejoin="round"/>' +
      wheels([78, 125, 172], 21, '#c4c9ce') +
      '<rect x="32" y="68" width="30" height="12" rx="3" fill="#3f3f45"/>' +
      '<path d="M39 68 V80 M45 68 V80 M51 68 V80" stroke="#77777e" stroke-width="2"/>' +
      '<rect x="60" y="58" width="120" height="36" rx="6" fill="#eceef0" stroke="#8d939a" stroke-width="2"/>' +
      '<rect x="60" y="54" width="120" height="6" rx="2" fill="#c3c8ce"/>' +
      '<rect x="68" y="80" width="16" height="9" fill="#fff" stroke="#999" stroke-width=".8"/>' +
      '<rect x="68" y="80" width="7" height="5" fill="#2b4a9a"/>' +
      '<path d="M68 82.5 H84 M68 85 H84 M68 87.5 H84" stroke="#c0392b" stroke-width="1"/>' +
      '<ellipse cx="88" cy="48" rx="16" ry="7" fill="#e5e5e5" stroke="#999" stroke-width="1.5" transform="rotate(-12 88 48)"/>' +
      '<line x1="150" y1="54" x2="150" y2="22" stroke="#d6dade" stroke-width="3"/>' +
      '<rect x="134" y="9" width="36" height="15" rx="3" fill="#25252b"/>' +
      '<circle cx="143" cy="16" r="4.5" fill="#8fb7ff"/><circle cx="158" cy="16" r="4.5" fill="#8fb7ff"/>' +
      '<rect x="150" y="94" width="26" height="8" rx="2" fill="#33333a"/>' +
      '<path d="M180 76 L206 68 L216 84" stroke="#c4c9ce" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="210" y="82" width="12" height="10" rx="2" fill="#444"/><circle cx="216" cy="87" r="2.5" fill="#e0c060"/>'
    );
  }

  function roverFront(o) {
    var wr = o.wr, bw = o.bw, bh = o.bh, wy = 134 - 2 * wr, by = wy - bh + 10,
        wx = bw / 2 + wr * 0.45 + 6, s = '', i;
    [-1, 1].forEach(function (d) {
      var x = 120 + d * wx - wr * 0.45;
      s += '<line x1="' + (120 + d * bw / 2) + '" y1="' + (by + bh - 6) + '" x2="' + (120 + d * wx) +
           '" y2="' + (wy + wr) + '" stroke="#8f959c" stroke-width="4"/>';
      s += '<rect x="' + x + '" y="' + wy + '" width="' + (wr * 0.9) + '" height="' + (2 * wr) +
           '" rx="4" fill="#26262b"/>';
      for (i = 1; i < 5; i++) {
        var yy = wy + i * 2 * wr / 5;
        s += '<line x1="' + x + '" y1="' + yy + '" x2="' + (x + wr * 0.9) + '" y2="' + yy +
             '" stroke="#5a5a62" stroke-width="1.5"/>';
      }
    });
    s += '<rect x="' + (120 - bw / 2) + '" y="' + by + '" width="' + bw + '" height="' + bh +
         '" rx="6" fill="' + o.body + '" stroke="#8d939a" stroke-width="2"/>';
    var top = by;
    if (o.panel) {
      var pw = o.pw;
      s += '<polygon points="' + (120 - pw) + ',' + by + ' ' + (120 + pw) + ',' + by + ' ' + (120 + pw - 10) +
           ',' + (by - 14) + ' ' + (120 - pw + 10) + ',' + (by - 14) + '" fill="' + o.panel +
           '" stroke="#b8c2e8" stroke-width="1.5"/>';
      for (i = 1; i < 7; i++) {
        var gx = 120 - pw + i * (2 * pw) / 7;
        s += '<line x1="' + gx + '" y1="' + by + '" x2="' + gx + '" y2="' + (by - 14) + '" stroke="#5d77c9" stroke-width="1"/>';
      }
      top = by - 14;
    }
    var hy = top - o.mh - 12;
    s += '<line x1="120" y1="' + top + '" x2="120" y2="' + (hy + 12) + '" stroke="#cfd4da" stroke-width="3"/>';
    s += '<rect x="' + (120 - o.hw / 2) + '" y="' + hy + '" width="' + o.hw + '" height="12" rx="3" fill="#2d2d33"/>';
    s += '<circle cx="' + (120 - o.hw / 4) + '" cy="' + (hy + 6) + '" r="3.4" fill="#8fb7ff"/>' +
         '<circle cx="' + (120 + o.hw / 4) + '" cy="' + (hy + 6) + '" r="3.4" fill="#8fb7ff"/>' +
         '<circle cx="' + (120 - o.hw / 4 - 1) + '" cy="' + (hy + 5) + '" r="1" fill="#fff"/>' +
         '<circle cx="' + (120 + o.hw / 4 - 1) + '" cy="' + (hy + 5) + '" r="1" fill="#fff"/>';
    if (o.arm) {
      s += '<circle cx="120" cy="' + (by + bh - 9) + '" r="7" fill="#444" stroke="#222"/>' +
           '<circle cx="117" cy="' + (by + bh - 10) + '" r="1.6" fill="#ccc"/>' +
           '<circle cx="123" cy="' + (by + bh - 8) + '" r="1.6" fill="#ccc"/>';
    }
    return svg(s);
  }

  function skewPanel(xa, xb, a1, a2, b1, b2, n) {
    var s = '<polygon points="' + xa + ',' + a1 + ' ' + xb + ',' + b1 + ' ' + xb + ',' + b2 + ' ' + xa + ',' + a2 +
            '" fill="#1c2a63" stroke="#aab4d8" stroke-width="1.5"/>';
    for (var i = 1; i < n; i++) {
      var f = i / n, x = xa + (xb - xa) * f, y1 = a1 + (b1 - a1) * f, y2 = a2 + (b2 - a2) * f;
      s += '<line x1="' + x + '" y1="' + y1 + '" x2="' + x + '" y2="' + y2 + '" stroke="#5d77c9" stroke-width="1"/>';
    }
    return s;
  }
  function panelRect(x, y, w, h, n) {
    var s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
            '" fill="#1c2a63" stroke="#aab4d8" stroke-width="1.5"/>';
    for (var i = 1; i < n; i++) {
      var gx = x + i * w / n;
      s += '<line x1="' + gx + '" y1="' + y + '" x2="' + gx + '" y2="' + (y + h) + '" stroke="#5d77c9" stroke-width="1"/>';
    }
    return s + '<line x1="' + x + '" y1="' + (y + h / 2) + '" x2="' + (x + w) + '" y2="' + (y + h / 2) +
           '" stroke="#5d77c9" stroke-width="1"/>';
  }

  function mroSide() {
    return svgAir(
      skewPanel(12, 96, 84, 100, 66, 80, 5) + skewPanel(228, 144, 84, 100, 66, 80, 5) +
      '<rect x="94" y="62" width="52" height="38" rx="5" fill="#c9a43a" stroke="#8a6d1c" stroke-width="2"/>' +
      '<path d="M94 74 H146 M94 86 H146" stroke="#e5c46a" stroke-width="1.5"/>' +
      '<line x1="112" y1="62" x2="96" y2="46" stroke="#bbb" stroke-width="3"/>' +
      '<ellipse cx="90" cy="40" rx="30" ry="10" transform="rotate(-28 90 40)" fill="#f2f2f2" stroke="#999" stroke-width="1.5"/>' +
      '<circle cx="94" cy="44" r="2.5" fill="#999"/>' +
      '<rect x="112" y="100" width="18" height="10" rx="2" fill="#2d2d33"/><circle cx="121" cy="110" r="3.5" fill="#8fb7ff"/>' +
      '<line x1="140" y1="62" x2="150" y2="36" stroke="#cfd4da" stroke-width="2"/><circle cx="150" cy="35" r="3" fill="#cfd4da"/>'
    );
  }
  function mroFront() {
    return svgAir(
      panelRect(6, 58, 84, 40, 6) + panelRect(150, 58, 84, 40, 6) +
      '<line x1="90" y1="78" x2="96" y2="78" stroke="#aaa" stroke-width="3"/><line x1="144" y1="78" x2="150" y2="78" stroke="#aaa" stroke-width="3"/>' +
      '<rect x="94" y="52" width="52" height="52" rx="5" fill="#c9a43a" stroke="#8a6d1c" stroke-width="2"/>' +
      '<circle cx="120" cy="76" r="26" fill="#f2f2f2" stroke="#999" stroke-width="1.5"/>' +
      '<circle cx="120" cy="76" r="17" fill="none" stroke="#ccc" stroke-width="1.5"/>' +
      '<path d="M120 76 L120 50 M120 76 L142.5 89 M120 76 L97.5 89" stroke="#aaa" stroke-width="1.5"/>' +
      '<circle cx="120" cy="76" r="4" fill="#888"/>' +
      '<circle cx="120" cy="114" r="8" fill="#2d2d33" stroke="#555" stroke-width="1.5"/><circle cx="118" cy="112" r="2.2" fill="#8fb7ff"/>'
    );
  }
  function mexSide() {
    return svgAir(
      skewPanel(16, 96, 86, 98, 68, 80, 4) + skewPanel(224, 144, 86, 98, 68, 80, 4) +
      '<rect x="96" y="62" width="48" height="36" rx="5" fill="#e9e6dc" stroke="#9a9686" stroke-width="2"/>' +
      '<rect x="96" y="86" width="48" height="12" fill="#c9a43a" stroke="#8a6d1c" stroke-width="1.5"/>' +
      '<line x1="108" y1="62" x2="102" y2="50" stroke="#bbb" stroke-width="3"/>' +
      '<ellipse cx="100" cy="46" rx="20" ry="7" transform="rotate(-20 100 46)" fill="#fff" stroke="#999" stroke-width="1.5"/>' +
      '<line x1="140" y1="62" x2="232" y2="28" stroke="#9a9a9a" stroke-width="2"/><circle cx="232" cy="28" r="2.5" fill="#bbb"/>' +
      '<rect x="116" y="98" width="14" height="9" rx="2" fill="#2d2d33"/><circle cx="123" cy="107" r="3" fill="#8fb7ff"/>'
    );
  }
  function mexFront() {
    return svgAir(
      panelRect(8, 62, 80, 34, 5) + panelRect(152, 62, 80, 34, 5) +
      '<line x1="88" y1="79" x2="96" y2="79" stroke="#aaa" stroke-width="3"/><line x1="144" y1="79" x2="152" y2="79" stroke="#aaa" stroke-width="3"/>' +
      '<line x1="6" y1="40" x2="234" y2="40" stroke="#9a9a9a" stroke-width="2"/>' +
      '<circle cx="6" cy="40" r="2.5" fill="#bbb"/><circle cx="234" cy="40" r="2.5" fill="#bbb"/>' +
      '<line x1="120" y1="40" x2="120" y2="58" stroke="#bbb" stroke-width="3"/>' +
      '<rect x="96" y="56" width="48" height="50" rx="5" fill="#e9e6dc" stroke="#9a9686" stroke-width="2"/>' +
      '<rect x="96" y="92" width="48" height="14" fill="#c9a43a" stroke="#8a6d1c" stroke-width="1.5"/>' +
      '<circle cx="120" cy="76" r="15" fill="#fff" stroke="#999" stroke-width="1.5"/>' +
      '<circle cx="120" cy="76" r="3.5" fill="#888"/>' +
      '<circle cx="120" cy="99" r="5" fill="#2d2d33"/><circle cx="118.5" cy="97.5" r="1.5" fill="#8fb7ff"/>'
    );
  }

  var MOUND =
    '<path d="M-4 140 L-4 134 Q40 126 80 106 Q115 86 150 94 Q190 102 244 134 L244 140 Z" fill="#9d4826"/>' +
    '<path d="M-4 134 Q40 126 80 106 Q115 86 150 94 Q190 102 244 134" fill="none" stroke="rgba(255,200,150,.35)" stroke-width="2"/>' +
    '<ellipse cx="60" cy="122" rx="6" ry="3" fill="#6b2d1b"/><ellipse cx="178" cy="118" rx="8" ry="3.5" fill="#6b2d1b"/>' +
    '<ellipse cx="124" cy="104" rx="5" ry="2.4" fill="#b5694a"/>';

  function vikingSide() {
    return svgAir(
      '<g transform="translate(0 18) rotate(-4 120 90)">' +
      '<line x1="94" y1="100" x2="72" y2="130" stroke="#8f959c" stroke-width="4"/>' +
      '<line x1="146" y1="100" x2="170" y2="130" stroke="#8f959c" stroke-width="4"/>' +
      '<rect x="76" y="62" width="88" height="42" rx="6" fill="#cfd3d8" stroke="#8d939a" stroke-width="2"/>' +
      '<rect x="76" y="62" width="88" height="8" rx="3" fill="#b3b9c0"/>' +
      '<path d="M86 76 H154 M86 88 H154" stroke="#a5abb2" stroke-width="1.5"/>' +
      '<line x1="90" y1="62" x2="90" y2="30" stroke="#ddd" stroke-width="2"/><circle cx="90" cy="29" r="3" fill="#ddd"/>' +
      '<line x1="146" y1="62" x2="158" y2="40" stroke="#bbb" stroke-width="3"/>' +
      '<ellipse cx="164" cy="34" rx="20" ry="8" transform="rotate(-35 164 34)" fill="#f2f2f2" stroke="#999" stroke-width="1.5"/>' +
      '<rect x="118" y="50" width="12" height="12" rx="2" fill="#2d2d33"/><circle cx="124" cy="55" r="3" fill="#8fb7ff"/>' +
      '<path d="M76 90 L48 96 L30 112" stroke="#aeb4ba" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<circle cx="30" cy="113" r="4" fill="#555"/>' +
      '</g>' + MOUND
    );
  }
  function vikingFront() {
    return svgAir(
      '<g transform="translate(0 18)">' +
      '<line x1="92" y1="100" x2="70" y2="130" stroke="#8f959c" stroke-width="4"/>' +
      '<line x1="148" y1="100" x2="170" y2="130" stroke="#8f959c" stroke-width="4"/>' +
      '<rect x="70" y="62" width="100" height="42" rx="6" fill="#cfd3d8" stroke="#8d939a" stroke-width="2"/>' +
      '<rect x="70" y="62" width="100" height="8" rx="3" fill="#b3b9c0"/>' +
      '<path d="M80 78 H160 M80 90 H160" stroke="#a5abb2" stroke-width="1.5"/>' +
      '<rect x="104" y="44" width="32" height="18" rx="3" fill="#2d2d33"/>' +
      '<circle cx="113" cy="53" r="4" fill="#8fb7ff"/><circle cx="127" cy="53" r="4" fill="#8fb7ff"/>' +
      '<circle cx="112" cy="52" r="1.2" fill="#fff"/><circle cx="126" cy="52" r="1.2" fill="#fff"/>' +
      '<line x1="84" y1="62" x2="84" y2="26" stroke="#ddd" stroke-width="2"/><circle cx="84" cy="25" r="3" fill="#ddd"/>' +
      '<line x1="156" y1="62" x2="164" y2="48" stroke="#bbb" stroke-width="3"/>' +
      '<circle cx="168" cy="38" r="17" fill="#f2f2f2" stroke="#999" stroke-width="1.5"/>' +
      '<circle cx="168" cy="38" r="9" fill="none" stroke="#ccc"/><circle cx="168" cy="38" r="2.5" fill="#888"/>' +
      '</g>' + MOUND
    );
  }

  function insightSide() {
    return svg(
      '<line x1="98" y1="96" x2="82" y2="130" stroke="#8f959c" stroke-width="4"/>' +
      '<line x1="142" y1="96" x2="158" y2="130" stroke="#8f959c" stroke-width="4"/>' +
      '<ellipse cx="82" cy="132" rx="9" ry="3" fill="#7f858c"/><ellipse cx="158" cy="132" rx="9" ry="3" fill="#7f858c"/>' +
      '<ellipse cx="40" cy="88" rx="36" ry="12" fill="#1c2a63" stroke="#aab4d8" stroke-width="1.5"/>' +
      '<path d="M6 88 H74 M40 77 V99 M20 80 L60 96 M60 80 L20 96" stroke="#5d77c9" stroke-width="1"/>' +
      '<ellipse cx="200" cy="88" rx="36" ry="12" fill="#1c2a63" stroke="#aab4d8" stroke-width="1.5"/>' +
      '<path d="M166 88 H234 M200 77 V99 M180 80 L220 96 M220 80 L180 96" stroke="#5d77c9" stroke-width="1"/>' +
      '<line x1="74" y1="90" x2="86" y2="90" stroke="#aaa" stroke-width="3"/><line x1="154" y1="90" x2="166" y2="90" stroke="#aaa" stroke-width="3"/>' +
      '<rect x="86" y="80" width="68" height="18" rx="4" fill="#dfe2e6" stroke="#8d939a" stroke-width="2"/>' +
      '<rect x="86" y="92" width="68" height="6" fill="#c9a43a"/>' +
      '<rect x="104" y="64" width="34" height="16" rx="3" fill="#c9ced4" stroke="#8d939a" stroke-width="1.5"/>' +
      '<line x1="130" y1="64" x2="138" y2="40" stroke="#ddd" stroke-width="2"/>' +
      '<ellipse cx="140" cy="36" rx="9" ry="4" transform="rotate(-30 140 36)" fill="#f2f2f2" stroke="#999"/>' +
      '<path d="M96 98 L80 114 L66 122" stroke="#aeb4ba" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="65" cy="123" r="4" fill="#555"/>' +
      '<path d="M170 134 A18 14 0 0 1 206 134 Z" fill="#c8cdd2" stroke="#8d939a" stroke-width="1.5"/>'
    );
  }
  function insightFront() {
    function panel(cx) {
      var s = '<circle cx="' + cx + '" cy="84" r="38" fill="#1c2a63" stroke="#aab4d8" stroke-width="1.5"/>' +
              '<circle cx="' + cx + '" cy="84" r="20" fill="none" stroke="#5d77c9" stroke-width="1"/>';
      [0, 45, 90, 135].forEach(function (a) {
        s += '<line x1="' + (cx - 38) + '" y1="84" x2="' + (cx + 38) + '" y2="84" stroke="#5d77c9" stroke-width="1" transform="rotate(' + a + ' ' + cx + ' 84)"/>';
      });
      return s;
    }
    return svg(
      panel(46) + panel(194) +
      '<line x1="84" y1="84" x2="94" y2="84" stroke="#aaa" stroke-width="3"/><line x1="146" y1="84" x2="156" y2="84" stroke="#aaa" stroke-width="3"/>' +
      '<line x1="98" y1="108" x2="82" y2="132" stroke="#8f959c" stroke-width="4"/>' +
      '<line x1="142" y1="108" x2="158" y2="132" stroke="#8f959c" stroke-width="4"/>' +
      '<ellipse cx="82" cy="133" rx="9" ry="3" fill="#7f858c"/><ellipse cx="158" cy="133" rx="9" ry="3" fill="#7f858c"/>' +
      '<rect x="90" y="72" width="60" height="38" rx="5" fill="#dfe2e6" stroke="#8d939a" stroke-width="2"/>' +
      '<rect x="90" y="100" width="60" height="10" fill="#c9a43a"/>' +
      '<line x1="120" y1="72" x2="120" y2="52" stroke="#cfd4da" stroke-width="3"/>' +
      '<rect x="106" y="40" width="28" height="12" rx="3" fill="#2d2d33"/>' +
      '<circle cx="113" cy="46" r="3.4" fill="#8fb7ff"/><circle cx="127" cy="46" r="3.4" fill="#8fb7ff"/>' +
      '<circle cx="112" cy="45" r="1" fill="#fff"/><circle cx="126" cy="45" r="1" fill="#fff"/>' +
      '<path d="M98 134 A22 16 0 0 1 142 134 Z" fill="#c8cdd2" stroke="#8d939a" stroke-width="1.5"/>'
    );
  }

  /* ================= DATOS ================= */
  var ITEMS = [
    {
      name: 'Sojourner', kind: 'rover', world: 0, color: '#f2c14e', scale: 0.65,
      side: sojourner(),
      front: roverFront({ wr: 14, bw: 84, bh: 26, body: '#c9ced4', panel: '#1c2a63', pw: 62, mh: 12, hw: 18 }),
      bubble: '¡Hola! Soy Sojourner, el primer rover que rodó sobre Marte. ¡Pequeño pero valiente!',
      sub: 'El pionero: el primer vehículo con ruedas en otro planeta',
      facts: [['Misión', 'Mars Pathfinder'], ['Lugar', 'Ares Vallis'],
              ['Lanzamiento', '4 de diciembre de 1996'], ['Aterrizaje', '4 de julio de 1997']],
      stats: [['Masa', '10,5 kg'], ['Tamaño', '65 × 48 × 30 cm'], ['Velocidad máx.', '1 cm/s'],
              ['Misión planeada', '7 soles'], ['Misión real', '83 soles'], ['Distancia', '~100 m'],
              ['Energía', 'Panel solar'], ['Instrumentos', 'Espectrómetro APXS y 3 cámaras'],
              ['Estado', 'Terminada en 1997']],
      story: [
        'Sojourner viajó a Marte dentro de la sonda Mars Pathfinder y bajó a la superficie pocos días después del aterrizaje del 4 de julio de 1997. Fue el primer vehículo con ruedas en explorar otro planeta.',
        'Era diminuto: pesaba unos 10 kg y medía alrededor de 65 cm. Su nombre salió de un concurso de ensayos para estudiantes y homenajea a Sojourner Truth, activista por los derechos humanos.',
        'Se diseñó para trabajar una semana marciana, pero duró mucho más. Con su espectrómetro analizó rocas con nombres como Barnacle Bill y Yogi, y recorrió unos 100 metros. Demostró que los rovers funcionaban y abrió el camino a todos los que vinieron después.'
      ]
    },
    {
      name: 'Spirit', kind: 'rover', world: 0, color: '#6fb3ff', scale: 0.85,
      side: mer('#d8c27a', '#23336f'),
      front: roverFront({ wr: 16, bw: 96, bh: 28, body: '#d8c27a', panel: '#23336f', pw: 82, mh: 20, hw: 26, arm: true }),
      bubble: 'Soy Spirit. Aterricé en el cráter Gusev en 2004 buscando pistas de agua antigua.',
      sub: 'Gemelo de Opportunity: el geólogo de Gusev',
      facts: [['Misión', 'Mars Exploration Rover (MER-A)'], ['Lugar', 'Cráter Gusev'],
              ['Lanzamiento', '10 de junio de 2003'], ['Aterrizaje', '4 de enero de 2004']],
      stats: [['Masa', '185 kg'], ['Tamaño', '1,6 × 2,3 × 1,5 m'], ['Velocidad máx.', '5 cm/s'],
              ['Misión planeada', '90 soles'], ['Duración real', '~6 años'], ['Distancia', '7,73 km'],
              ['Energía', 'Paneles solares'], ['Instrumentos', 'Cámaras y espectrómetros'],
              ['Último contacto', 'Marzo de 2010']],
      story: [
        'Spirit aterrizó en el cráter Gusev, que los científicos sospechaban que fue un lago antiguo. Su misión planeada era de 90 soles, pero trabajó más de seis años.',
        'Cerca de una formación llamada Home Plate encontró suelos ricos en sílice, una pista de que allí hubo agua o vapor caliente en el pasado. En total recorrió unos 7,7 km.',
        'En 2009 quedó atascado en arena blanda, en un lugar apodado Troy. Siguió trabajando como estación fija hasta que dejó de comunicarse en marzo de 2010. NASA dio por terminados los intentos de contacto en mayo de 2011.'
      ]
    },
    {
      name: 'Opportunity', kind: 'rover', world: 0, color: '#7ee0a1', scale: 0.85,
      side: mer('#e9dfb8', '#2a5a8a'),
      front: roverFront({ wr: 16, bw: 96, bh: 28, body: '#e9dfb8', panel: '#2a5a8a', pw: 82, mh: 20, hw: 26, arm: true }),
      bubble: '¡Opportunity al habla! Me diseñaron para 90 soles y duré casi 15 años.',
      sub: 'El corredor de fondo de Marte',
      facts: [['Misión', 'Mars Exploration Rover (MER-B)'], ['Lugar', 'Meridiani Planum'],
              ['Lanzamiento', '7 de julio de 2003'], ['Aterrizaje', '25 de enero de 2004']],
      stats: [['Masa', '185 kg'], ['Tamaño', '1,6 × 2,3 × 1,5 m'], ['Velocidad máx.', '5 cm/s'],
              ['Misión planeada', '90 soles'], ['Duración real', '~14 años y medio'], ['Distancia', '45,16 km'],
              ['Energía', 'Paneles solares'], ['Instrumentos', 'Cámaras y espectrómetros'],
              ['Último contacto', 'Junio de 2018']],
      story: [
        'Opportunity aterrizó en Meridiani Planum, dentro de un pequeño cráter, casi como un hoyo en uno. Muy cerca descubrió pequeñas esferas de hematita, apodadas arándanos, y rocas que mostraban que allí hubo agua líquida.',
        'Estaba pensado para durar 90 soles y trabajó casi 15 años. Recorrió más de 45 km, más que un maratón, un récord de distancia para un vehículo en otro mundo.',
        'En 2018 una enorme tormenta de polvo cubrió el cielo y sus paneles solares dejaron de recibir luz. Su última señal llegó en junio de 2018 y NASA declaró terminada la misión en febrero de 2019.'
      ]
    },
    {
      name: 'Curiosity', kind: 'rover', world: 0, color: '#ff8a5c', scale: 1.05,
      side: curiosity(),
      front: roverFront({ wr: 21, bw: 100, bh: 36, body: '#d7dbe0', mh: 26, hw: 28, arm: true }),
      bubble: 'Soy Curiosity. Aterricé en el cráter Gale en 2012 y estoy subiendo el Monte Sharp.',
      sub: 'Un laboratorio móvil del tamaño de un auto pequeño',
      facts: [['Misión', 'Mars Science Laboratory'], ['Lugar', 'Cráter Gale'],
              ['Lanzamiento', '26 de noviembre de 2011'], ['Aterrizaje', '6 de agosto de 2012']],
      stats: [['Masa', '899 kg'], ['Tamaño', '2,9 × 2,7 × 2,2 m'], ['Ruedas', '6 de 50 cm'],
              ['Velocidad máx.', '4 cm/s'], ['Misión planeada', '1 año marciano (687 días)'],
              ['Distancia', 'más de 33 km'], ['Energía', 'Generador nuclear (MMRTG)'],
              ['Instrumentos', '10 científicos'], ['Estado', 'En operación']],
      story: [
        'Curiosity pesa cerca de 900 kg y llegó a Marte con una maniobra nunca vista: una grúa celeste (sky crane) lo bajó con cables hasta el suelo del cráter Gale.',
        'No depende del Sol: lo alimenta un generador de radioisótopos que le da energía de día y de noche. En 2013 confirmó que Gale fue un lago antiguo con las condiciones químicas necesarias para la vida microbiana.',
        'Desde entonces sube por el Monte Sharp, leyendo sus capas de roca como páginas de la historia del planeta. Ha detectado moléculas orgánicas y cambios estacionales de metano en la atmósfera.'
      ]
    },
    {
      name: 'Perseverance', kind: 'rover', world: 0, color: '#ff7aa8', scale: 1.05,
      side: perseverance(),
      front: roverFront({ wr: 21, bw: 100, bh: 36, body: '#eceef0', mh: 28, hw: 36, arm: true }),
      bubble: 'Soy Perseverance. En Jezero busco señales de vida antigua y guardo muestras de roca.',
      sub: 'La cazadora de señales de vida antigua',
      facts: [['Misión', 'Mars 2020'], ['Lugar', 'Cráter Jezero'],
              ['Lanzamiento', '30 de julio de 2020'], ['Aterrizaje', '18 de febrero de 2021']],
      stats: [['Masa', '1 025 kg'], ['Tamaño', '3 × 2,7 × 2,2 m'], ['Ruedas', '6 de 52,5 cm'],
              ['Velocidad máx.', '4,2 cm/s'], ['Misión planeada', '1 año marciano (687 días)'],
              ['Distancia', 'más de 30 km'], ['Energía', 'Generador nuclear (MMRTG)'],
              ['Instrumentos', '7 científicos y 19 cámaras'], ['Tubos de muestras', '43'],
              ['Estado', 'En operación']],
      story: [
        'Perseverance aterrizó en el cráter Jezero, donde hace miles de millones de años hubo un lago y un delta de río, un lugar ideal para buscar rastros de vida microbiana pasada.',
        'Taladra rocas y guarda las muestras en tubos sellados, pensados para que una futura misión pueda traerlos a la Tierra. Su instrumento MOXIE logró producir oxígeno a partir del dióxido de carbono marciano.',
        'Viajó junto al pequeño helicóptero Ingenuity, que el 19 de abril de 2021 hizo el primer vuelo motorizado y controlado en otro mundo.'
      ]
    },
    {
      name: 'Mars Express', kind: 'orbiter', world: 1, color: '#b69bff', scale: 1.0,
      side: mexSide(), front: mexFront(),
      bubble: 'Soy Mars Express, de la ESA. Doy vueltas alrededor de Marte desde 2003 y lo fotografío en 3D.',
      sub: 'La primera misión europea a otro planeta',
      facts: [['Misión', 'Mars Express (ESA)'], ['Órbita', 'Polar y elíptica'],
              ['Lanzamiento', '2 de junio de 2003'], ['Llegada', '25 de diciembre de 2003']],
      stats: [['Masa al lanzamiento', '1 223 kg'], ['Cohete', 'Soyuz-Fregat'],
              ['Periodo orbital', '~6,7 horas'], ['Paneles solares', '~12 m de punta a punta'],
              ['Antena de radar', '40 m (MARSIS)'], ['Instrumentos', '7 científicos'],
              ['Estado', 'En operación']],
      story: [
        'Mars Express es la primera misión de la Agencia Espacial Europea (ESA) a otro planeta. Despegó el 2 de junio de 2003 desde Baikonur en un cohete Soyuz y entró en órbita de Marte el 25 de diciembre de 2003.',
        'Llevaba también al módulo Beagle 2, que debía aterrizar pero se perdió: nunca se recibió su señal. En 2015 la cámara HiRISE de la sonda MRO lo encontró sobre la superficie, con los paneles sin desplegarse del todo.',
        'Con su cámara estéreo HRSC fotografía Marte en 3D, y su radar MARSIS exploró el subsuelo. En 2018 sus datos sugirieron agua líquida bajo el hielo del polo sur, un hallazgo que aún se discute. Ha seguido trabajando por más de dos décadas.'
      ]
    },
    {
      name: 'MRO', kind: 'orbiter', world: 1, color: '#5fe0d0', scale: 1.0,
      side: mroSide(), front: mroFront(),
      bubble: 'Soy MRO. Desde mi órbita fotografío Marte con unos 30 cm de detalle y retransmito los mensajes de los rovers.',
      sub: 'Mars Reconnaissance Orbiter: el ojo y la antena de Marte',
      facts: [['Misión', 'Mars Reconnaissance Orbiter'], ['Órbita', 'Baja y casi polar'],
              ['Lanzamiento', '12 de agosto de 2005'], ['Llegada', '10 de marzo de 2006']],
      stats: [['Masa al lanzamiento', '2 180 kg'], ['Cohete', 'Atlas V 401'],
              ['Altitud', '~250 × 320 km'], ['Periodo orbital', '~112 min'],
              ['Resolución HiRISE', '~30 cm por píxel'], ['Paneles solares', '~40 m² en total'],
              ['Antena principal', '3 m de diámetro'], ['Instrumentos', '6 científicos'],
              ['Estado', 'En operación']],
      story: [
        'MRO se lanzó el 12 de agosto de 2005 y entró en órbita de Marte el 10 de marzo de 2006. Después usó el roce con la atmósfera marciana (aerofrenado) para ajustar su órbita y quedar en la altura ideal para trabajar.',
        'Su cámara HiRISE ve detalles de unos 30 cm por píxel, y su radar SHARAD "ve" bajo el suelo y detectó grandes depósitos de hielo de agua. Sus fotos ayudaron a elegir los sitios de aterrizaje de Curiosity, InSight y Perseverance.',
        'Además funciona como antena de relevo: retransmite a la Tierra los datos de rovers y módulos de superficie. Es una de las misiones que más información ha enviado desde Marte.'
      ]
    },
    {
      name: 'Viking 1', kind: 'lander', world: 1, color: '#c3e66e', scale: 1.0,
      side: vikingSide(), front: vikingFront(),
      bubble: 'Soy Viking 1. En 1976 fui el primer módulo de EE. UU. que funcionó en Marte. Aquí me ves medio enterrada en la arena.',
      sub: 'El primer módulo estadounidense que funcionó con éxito en Marte',
      facts: [['Misión', 'Programa Viking'], ['Lugar', 'Chryse Planitia'],
              ['Lanzamiento', '20 de agosto de 1975'], ['Aterrizaje', '20 de julio de 1976']],
      stats: [['Masa del módulo', '~576 kg'], ['Energía', '2 generadores nucleares (RTG)'],
              ['Misión planeada', '90 soles'], ['Misión real', '2 245 soles'],
              ['Experimentos biológicos', '3'], ['Cámaras', '2'],
              ['Otros instrumentos', 'Sismómetro, meteorología y espectrómetro de rayos X'],
              ['Nombre oficial', 'Estación Memorial Thomas Mutch'],
              ['Estado', 'Sin contacto desde 1982']],
      story: [
        'Viking 1 se lanzó el 20 de agosto de 1975 y aterrizó el 20 de julio de 1976 en Chryse Planitia. Fue el primer módulo de aterrizaje de Estados Unidos que funcionó con éxito en Marte y envió las primeras imágenes nítidas desde su superficie.',
        'Era parte de una misión doble: un orbitador y un módulo. Su brazo recolector tomó muestras de suelo para tres experimentos biológicos. Los resultados fueron desconcertantes y la mayoría de los científicos concluyó que no mostraban vida, aunque el debate duró años.',
        'Fue diseñada para unos 90 días, pero trabajó más de seis años: su última comunicación fue el 11 de noviembre de 1982. Nota: en esta escena aparece medio enterrada en la arena como licencia artística.'
      ]
    },
    {
      name: 'InSight', kind: 'lander', world: 1, color: '#ffd0a0', scale: 1.0,
      side: insightSide(), front: insightFront(),
      bubble: 'Soy InSight. Escuché los temblores de Marte para descubrir qué hay dentro del planeta.',
      sub: 'El sismólogo que escuchó el interior de Marte',
      facts: [['Misión', 'InSight'], ['Lugar', 'Elysium Planitia'],
              ['Lanzamiento', '5 de mayo de 2018'], ['Aterrizaje', '26 de noviembre de 2018']],
      stats: [['Masa', '358 kg'], ['Paneles solares', '2, de ~6 m en total'],
              ['Instrumentos', '3: SEIS, HP3 y RISE'], ['Sismos detectados', 'más de 1 300'],
              ['Sismo mayor', 'Magnitud 5 (mayo de 2022)'], ['Misión planeada', '1 año marciano'],
              ['Misión real', '~4 años'], ['Estado', 'Terminada en diciembre de 2022']],
      story: [
        'InSight despegó el 5 de mayo de 2018 y aterrizó el 26 de noviembre de 2018 en Elysium Planitia, una llanura plana y segura. Fue el primer módulo diseñado para estudiar el interior de Marte.',
        'Con su sismómetro SEIS registró más de 1,300 sismos marcianos, incluido uno de magnitud 5 en 2022. Sus ondas mostraron cómo son la corteza, el manto y el núcleo del planeta. Su sonda de calor HP3 no logró enterrarse en el suelo.',
        'El polvo fue cubriendo sus paneles solares y cada vez tenía menos energía. Su última señal llegó a mediados de diciembre de 2022 y NASA dio por terminada la misión el 21 de ese mes.'
      ]
    }
  ];

  var LANES = [
    { ids: [0, 1, 2, 3, 4], speed: 70 },
    { ids: [5, 6], speed: 95, statics: [7, 8] }
  ];
  var LX = { 7: 0.24, 8: 0.76 };

  /* ================= CONSTRUIR APARTADOS ================= */
  var MOUNTAINS =
    '<svg class="mountains" viewBox="0 0 1200 220" preserveAspectRatio="none" aria-hidden="true">' +
    '<path fill="#a9573b" opacity=".85" d="M0 220 L0 140 L90 110 L170 135 L260 90 L340 125 L430 100 L520 140 L600 150 L700 130 L790 80 L860 118 L960 90 L1050 130 L1130 105 L1200 125 L1200 220 Z"/>' +
    '<path fill="#8a4630" d="M560 220 L720 160 L800 115 L900 115 L980 160 L1120 220 Z" opacity=".8"/>' +
    '<path fill="#7a3824" d="M0 220 L0 170 L120 150 L220 175 L330 140 L450 172 L560 150 L690 180 L800 155 L930 178 L1060 150 L1200 175 L1200 220 Z"/>' +
    '</svg>';

  LANES.forEach(function (l, wi) {
    var z = document.createElement('div');
    z.className = 'zone';

    var w = document.createElement('section');
    w.className = 'world';
    w.innerHTML =
      '<div class="sky"><div class="stars"></div><div class="sun s' + wi + '"></div>' +
      (wi ? '<div class="moon"></div>' : '') + '</div>' +
      MOUNTAINS + '<div class="ground"></div><div class="layer"></div>' +
      '<div class="bubble" hidden><b></b><span></span></div>' +
      (wi === 0
        ? '<p class="hint">Toca un icono o un robot · Desliza para ver las sondas</p>'
        : '<p class="hint">Desliza hacia arriba para volver a los rovers</p>');

    var dock = document.createElement('nav');
    dock.className = 'dock';
    dock.setAttribute('aria-label', wi ? 'Sondas y módulos' : 'Rovers');
    var bar = document.createElement('div');
    bar.className = 'bar';
    dock.appendChild(bar);

    z.appendChild(w);
    z.appendChild(dock);
    worldsEl.appendChild(z);

    if (wi === 0) {
      var cut = document.createElement('div');
      cut.className = 'cut';
      cut.textContent = 'corte \u00b7 superficie \u25b2 \u00b7 \u25bc órbita y módulos fijos';
      worldsEl.appendChild(cut);
    }

    l.el = w;
    l.bar = bar;
    l.lastKind = null;
    l.layer = w.querySelector('.layer');
    l.bub = w.querySelector('.bubble');
    l.bn = l.bub.querySelector('b');
    l.bt = l.bub.querySelector('span');
    l.state = 'moving'; l.frozen = false; l.cur = -1;
    l.token = 0; l.talkTimer = null; l.travel = null; l.offset = 0;

    var ground = w.querySelector('.ground');
    for (var r = 0; r < 55; r++) {
      var y = Math.random() * 100;
      var size = 5 + (y / 100) * 26 * (0.5 + Math.random());
      var rock = document.createElement('div');
      rock.className = 'rock';
      rock.style.left = (Math.random() * 100) + '%';
      rock.style.top = y + '%';
      rock.style.width = size + 'px';
      rock.style.height = (size * 0.6) + 'px';
      rock.style.opacity = 0.55 + Math.random() * 0.45;
      ground.appendChild(rock);
    }
  });

  /* ================= UNIDADES E ICONOS ================= */
  ITEMS.forEach(function (it, id) {
    it.id = id;
    var l = LANES[it.world];
    var el = document.createElement('div');
    el.className = 'unit k-' + it.kind;
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', it.name);
    el.innerHTML = '<div class="unit-inner"><div class="face side-face">' + it.side +
                   '</div><div class="face front-face">' + it.front + '</div></div>';
    it.el = el; it.inner = el.firstChild;
    el.addEventListener('click', function () { selectItem(id); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectItem(id); }
    });
    l.layer.appendChild(el);
    if (it.kind !== 'lander') it.k = l.ids.indexOf(id);

    if (l.lastKind && l.lastKind !== it.kind) {
      var sp = document.createElement('span'); sp.className = 'sep'; l.bar.appendChild(sp);
    }
    l.lastKind = it.kind;
    var b = document.createElement('button');
    b.className = 'rbtn';
    b.setAttribute('aria-label', it.name);
    b.style.setProperty('--accent', it.color);
    b.innerHTML = '<span class="ico">' + it.side + '</span><span class="nm">' + it.name + '</span>';
    b.addEventListener('click', function () { selectItem(id); });
    l.bar.appendChild(b);
    it.btn = b;
  });

  /* ================= POSICIONES ================= */
  function layout(l) {
    l.W = l.el.clientWidth; l.H = l.el.clientHeight;
    l.k = Math.min(1, Math.max(0.45, l.H / 400));
    l.cx = l.W / 2;
    var n = l.ids.length;
    l.total = Math.max(n * 340, l.W + 360);
    l.gap = l.total / n;
    l.margin = (l.total - l.W) / 2;
    l.rb = Math.round(l.H * 0.17);
    l.ids.concat(l.statics || []).forEach(function (id) {
      var it = ITEMS[id];
      it.inner.style.transform = 'scale(' + (it.scale * l.k) + ')';
      if (it.kind === 'orbiter') {
        it.el.style.top = Math.round(l.H * 0.27 - 70) + 'px';
        it.el.style.bottom = 'auto';
      } else {
        it.el.style.bottom = (it.kind === 'lander' ? Math.round(l.H * 0.11) : l.rb) + 'px';
      }
      if (it.kind === 'lander') {
        it.el.style.transform = 'translate3d(' + (l.W * LX[id] - 120) + 'px,0,0)';
      }
    });
  }
  function pos(l, k) { return mod(l.offset - k * l.gap, l.total) - l.margin; }
  function target(l, k) { return l.cx + l.margin + k * l.gap; }

  LANES.forEach(function (l, wi) {
    layout(l);
    l.offset = target(l, 0) - (wi ? 520 : 380);
  });

  window.addEventListener('resize', function () {
    LANES.forEach(function (l) {
      var rel = pos(l, 0) - l.cx;
      layout(l);
      l.offset = l.cx + rel + l.margin;
      if (l.cur >= 0) l.offset = target(l, l.cur);
    });
  });

  function renderLane(l, t) {
    l.ids.forEach(function (id, k) {
      var it = ITEMS[id], y = 0;
      if (it.kind === 'orbiter') y = Math.sin(t / 650 + k * 2) * 6;
      it.el.style.transform = 'translate3d(' + (pos(l, k) - 120) + 'px,' + y.toFixed(1) + 'px,0)';
    });
  }

  function setClasses(l) {
    l.el.classList.toggle('moving', !l.frozen && (l.state === 'moving' || l.state === 'travel'));
    l.el.classList.toggle('fast', l.state === 'travel');
  }
  function flip(el, on) { el.classList.toggle('front', !!on); }
  function setActive(id, on) { ITEMS[id].btn.classList.toggle('active', !!on); }

  /* ================= BURBUJA ================= */
  function place(l, it) {
    var h = 140 * it.scale * l.k, x = l.cx, b = l.bub;
    if (it.kind === 'lander') x = l.W * LX[it.id];
    var half = Math.min(180, l.W * 0.44);
    var left = Math.max(half, Math.min(l.W - half, x));
    b.style.left = left + 'px';
    b.style.setProperty('--ax', (x - left) + 'px');
    b.style.setProperty('--accent', it.color);
    if (it.kind === 'orbiter') {
      b.classList.add('below');
      b.style.top = Math.round(l.H * 0.27 + h / 2 + 14) + 'px';
      b.style.bottom = 'auto';
    } else {
      b.classList.remove('below');
      b.style.top = 'auto';
      b.style.bottom = Math.round((it.kind === 'lander' ? l.H * 0.11 : l.rb) + h + 14) + 'px';
    }
    l.bn.textContent = it.name;
  }
  function say(l, text, done) {
    var t = ++l.token;
    l.bt.textContent = '';
    l.bub.hidden = false;
    (function nx(i) {
      if (t !== l.token) return;
      l.bt.textContent = text.slice(0, i);
      if (i < text.length) l.talkTimer = setTimeout(function () { nx(i + 1); }, 28);
      else if (done) l.talkTimer = setTimeout(done, 3200);
    })(0);
  }
  function cancelTalk(l) {
    clearTimeout(l.talkTimer);
    l.token++;
    l.bub.hidden = true;
  }

  function startTalk(l, k) {
    var id = l.ids[k], it = ITEMS[id];
    l.state = 'talking'; l.cur = k;
    setClasses(l); setActive(id, true);
    flip(it.el, true);
    place(l, it);
    say(l, it.bubble, function () { resume(l); });
  }
  function resume(l) {
    cancelTalk(l);
    if (l.cur >= 0) {
      var id = l.ids[l.cur];
      flip(ITEMS[id].el, false);
      setActive(id, false);
    }
    l.cur = -1;
    l.offset += 2;
    l.state = 'moving';
    setClasses(l);
  }

  /* ================= ETIQUETA: HISTORIA / DATOS ================= */
  var storyId = -1, curTab = 'h';

  function renderStory() {
    var it = ITEMS[storyId], h;
    storyTitle.textContent = it.name;
    tabH.classList.toggle('on', curTab === 'h');
    tabD.classList.toggle('on', curTab === 'd');
    tabH.setAttribute('aria-selected', curTab === 'h');
    tabD.setAttribute('aria-selected', curTab === 'd');

    if (curTab === 'h') {
      h = '<p class="sub">' + it.sub + '</p>' +
          it.story.map(function (p) { return '<p>' + p + '</p>'; }).join('');
    } else {
      h = '<h3>Ficha de la misión</h3><dl class="facts">' + it.facts.map(function (f) {
            return '<div><dt>' + f[0] + '</dt><dd>' + f[1] + '</dd></div>';
          }).join('') + '</dl>' +
          '<h3>Estadísticas</h3><div class="stats">' + it.stats.map(function (s) {
            return '<div class="stat"><b' + (s[1].length > 13 ? ' class="long"' : '') + '>' + s[1] +
                   '</b><span>' + s[0] + '</span></div>';
          }).join('') + '</div>';
    }
    storyBody.innerHTML = h;
    storyBody.scrollTop = 0;
    storyBody.style.animation = 'none';
    void storyBody.offsetWidth;
    storyBody.style.animation = '';
  }
  [tabH, tabD].forEach(function (t) {
    t.addEventListener('click', function () {
      if (storyId < 0) return;
      curTab = t.getAttribute('data-tab');
      renderStory();
    });
  });

  function freeze(l) {
    if (l.state === 'talking') {
      cancelTalk(l);
      var id = l.ids[l.cur];
      flip(ITEMS[id].el, false); setActive(id, false);
      l.cur = -1; l.offset += 2; l.state = 'moving';
    }
    l.frozen = true;
    setClasses(l);
  }
  function openStory(id) {
    var it = ITEMS[id];
    storyId = id;
    curTab = 'h';
    story.className = 'story ' + (it.world === 0 ? 'at-bottom' : 'at-top');
    story.style.setProperty('--accent', it.color);
    renderStory();
    story.hidden = false;
    storyClose.focus({ preventScroll: true });
    LANES.forEach(function (l) {
      if (it.kind !== 'lander' && LANES[it.world] === l) return;
      freeze(l);
    });
  }
  function closeAll() {
    LANES.forEach(function (l) {
      cancelTalk(l);
      if (l.cur >= 0) { l.cur = -1; l.offset += 2; }
      l.state = 'moving'; l.travel = null; l.frozen = false;
      setClasses(l);
    });
    ITEMS.forEach(function (it) { flip(it.el, false); it.btn.classList.remove('active'); });
    story.hidden = true;
    storyId = -1;
  }
  storyClose.addEventListener('click', closeAll);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !story.hidden) closeAll();
  });

  /* ================= SELECCIONAR ================= */
  function selectItem(id) {
    closeAll();
    var it = ITEMS[id], l = LANES[it.world];
    setActive(id, true);

    if (it.kind === 'lander') {
      flip(it.el, true);
      place(l, it);
      say(l, it.bubble, null);
      openStory(id);
      return;
    }

    var k = it.k, tg = target(l, k), delta = mod(tg - l.offset, l.total);
    if (delta > l.total - 4) delta = 0;
    if (delta < 1) {
      l.offset = tg; l.cur = k; l.state = 'story';
      flip(it.el, true); setClasses(l);
      openStory(id);
      return;
    }
    var dur = Math.min(Math.max(delta / 700, 0.7), 2.6) * 1000;
    l.travel = { from: l.offset, delta: delta, t0: performance.now(), dur: dur, k: k };
    l.state = 'travel';
    setClasses(l);
  }
  function arrive(l) {
    var k = l.travel.k, id = l.ids[k];
    l.cur = k; l.state = 'story'; l.travel = null;
    flip(ITEMS[id].el, true);
    setClasses(l);
    openStory(id);
  }

  function ease(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }

  /* ================= BUCLE ================= */
  var last = performance.now();
  function tick(t) {
    var dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    LANES.forEach(function (l) {
      if (!l.frozen) {
        if (l.state === 'moving') {
          var d = l.speed * dt, hit = -1, best = Infinity;
          for (var k = 0; k < l.ids.length; k++) {
            var dist = mod(l.cx - pos(l, k), l.total);
            if (dist > l.total - 0.01) dist = 0;
            if (dist <= d && dist < best) { best = dist; hit = k; }
          }
          if (hit >= 0) { l.offset += best; startTalk(l, hit); }
          else l.offset += d;
        } else if (l.state === 'travel') {
          var p = (t - l.travel.t0) / l.travel.dur;
          if (p >= 1) { l.offset = l.travel.from + l.travel.delta; arrive(l); }
          else l.offset = l.travel.from + l.travel.delta * ease(p);
        }
      }
      renderLane(l, t);
    });
    requestAnimationFrame(tick);
  }

  LANES.forEach(setClasses);
  requestAnimationFrame(tick);
})();