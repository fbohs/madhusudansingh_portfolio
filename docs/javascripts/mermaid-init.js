/*
 * Central mermaid theming, plus the on-demand loader for mermaid itself.
 *
 * Reads the design tokens from :root in stylesheets/extra.css so the palette has
 * exactly one source of truth. Docs pages must not carry `style` lines, classDef
 * blocks, or hex values — use the semantic classes below via `:::name`.
 *
 * mermaid is deliberately NOT in extra_javascript: it is 3.5 MB (950 KB gzipped)
 * and only about half the pages carry a diagram. This file is the only entry
 * point — it builds the config cheaply on every page, then fetches mermaid at the
 * bottom only if a `.mermaid` node is actually present.
 *
 * The version is pinned and integrity-checked. To bump it, change both constants
 * together — a stale hash silently blocks the script in every browser:
 *
 *   curl -sL -o m.js https://unpkg.com/mermaid@<version>/dist/mermaid.min.js
 *   echo "sha384-$(openssl dgst -sha384 -binary m.js | openssl base64 -A)"
 */
(function () {
  var MERMAID_SRC = 'https://unpkg.com/mermaid@11.16.1/dist/mermaid.min.js';
  var MERMAID_SRI = 'sha384-aBQXj4hK6Jm05i7aQAsUV3bLdSUrHX1BGYfMB0166TtWt/RRaw+h0Eelme9OCOvy';

  /* Only unrendered diagrams — mermaid stamps data-processed on the ones it
   * has already drawn, and re-running over those duplicates the SVG. */
  var PENDING = '.mermaid:not([data-processed])';

  var root = getComputedStyle(document.documentElement);

  function token(name, fallback) {
    var v = root.getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }

  var bg       = token('--bg', '#0f1117');
  var bg2      = token('--bg2', '#161b27');
  var bg3      = token('--bg3', '#1c2333');
  var text     = token('--text', '#e8eaf0');
  var muted    = token('--text-muted', '#7a8499');
  var dim      = token('--text-dim', '#4a5168');
  var accent   = token('--accent', '#00d9a3');
  var blue     = token('--blue', '#4f9eff');
  var amber    = token('--amber', '#f5a623');
  var red      = token('--red', '#ff6b6b');
  var purple   = token('--purple', '#b388ff');
  var sans     = token('--sans', "'Sora', sans-serif");

  var accentDim = token('--accent-dim', 'rgba(0, 217, 163, 0.12)');
  var blueDim   = token('--blue-dim', 'rgba(79, 158, 255, 0.12)');
  var amberDim  = token('--amber-dim', 'rgba(245, 166, 35, 0.12)');
  var redDim    = token('--red-dim', 'rgba(255, 107, 107, 0.12)');
  var purpleDim = token('--purple-dim', 'rgba(179, 136, 255, 0.12)');

  /* Semantic emphasis classes, applied in diagrams with `:::accent` etc.
   * Mermaid puts the class on the node's <g>, so target the shape children. */
  var shapes = 'rect, polygon, circle, ellipse, path';

  function emphasis(name, stroke, fill) {
    return (
      '.node.' + name + ' ' + shapes.split(', ').join(', .node.' + name + ' ') + ' {' +
      '  stroke: ' + stroke + ' !important;' +
      '  fill: ' + fill + ' !important;' +
      '}' +
      '.node.' + name + ' .nodeLabel { color: ' + text + ' !important; }'
    );
  }

  var themeCSS = [
    emphasis('accent', accent, accentDim),
    emphasis('blue',   blue,   blueDim),
    emphasis('amber',  amber,  amberDim),
    emphasis('red',    red,    redDim),
    emphasis('purple', purple, purpleDim),
    emphasis('muted',  dim,    bg),
    /* Edge labels sit on the page background, not a white chip. */
    '.edgeLabel, .edgeLabel p { background-color: ' + bg + ' !important; color: ' + muted + ' !important; }',
    '.edgeLabel rect { fill: ' + bg + ' !important; opacity: 1 !important; }',
    /* Subgraph containers. */
    '.cluster rect { fill: ' + bg + ' !important; stroke: ' + dim + ' !important; }',
    '.cluster .cluster-label, .cluster text { fill: ' + muted + ' !important; }'
  ].join('\n');

  /* startOnLoad is false on purpose: mermaid arrives after its own
   * DOMContentLoaded hook would have fired, so render() drives it explicitly. */
  var CONFIG = {
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily: sans,
    flowchart: { curve: 'basis', useMaxWidth: true },
    themeCSS: themeCSS,
    themeVariables: {
      darkMode: true,

      background: bg,
      fontFamily: sans,
      fontSize: '14px',

      /* Nodes: raised surface, same layer as code blocks and tables. */
      primaryColor: bg2,
      primaryTextColor: text,
      primaryBorderColor: dim,
      mainBkg: bg2,
      nodeBorder: dim,
      nodeTextColor: text,

      secondaryColor: bg3,
      secondaryTextColor: text,
      secondaryBorderColor: dim,
      tertiaryColor: bg3,
      tertiaryTextColor: text,
      tertiaryBorderColor: dim,

      textColor: text,
      titleColor: text,
      lineColor: dim,
      edgeLabelBackground: bg,

      clusterBkg: bg,
      clusterBorder: dim,

      /* Sequence diagrams. */
      actorBkg: bg2,
      actorBorder: dim,
      actorTextColor: text,
      actorLineColor: dim,
      signalColor: muted,
      signalTextColor: muted,
      labelBoxBkgColor: bg3,
      labelBoxBorderColor: dim,
      labelTextColor: text,
      loopTextColor: muted,
      noteBkgColor: bg3,
      noteBorderColor: accent,
      noteTextColor: text,
      sequenceNumberColor: bg,

      /* Mindmaps and pie/quadrant series. */
      cScale0: bg2,  cScaleLabel0: text,
      cScale1: bg3,  cScaleLabel1: text,
      cScale2: bg2,  cScaleLabel2: text,
      pie1: accent, pie2: blue, pie3: amber, pie4: purple, pie5: red,
      pieTitleTextColor: text,
      pieSectionTextColor: bg,
      pieStrokeColor: bg,

      /* State and git graphs. */
      labelColor: text,
      altBackground: bg3,
      errorBkgColor: redDim,
      errorTextColor: red
    }
  };

  /* Single in-flight fetch, reused by every later render() call. */
  var loading = null;

  function loadMermaid() {
    if (loading) return loading;

    loading = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = MERMAID_SRC;
      s.integrity = MERMAID_SRI;
      s.crossOrigin = 'anonymous';
      s.onload = function () {
        mermaid.initialize(CONFIG);
        resolve();
      };
      s.onerror = function () {
        loading = null; /* let a later page view retry */
        reject(new Error('failed to load ' + MERMAID_SRC));
      };
      document.head.appendChild(s);
    });

    return loading;
  }

  function render() {
    if (!document.querySelector(PENDING)) return;

    loadMermaid()
      .then(function () {
        return mermaid.run({ querySelector: PENDING });
      })
      .catch(function (err) {
        console.error('[mermaid]', err);
      });
  }

  /* Material publishes document$, which emits on every page view. With
   * navigation.instant off it fires once per load, but subscribing keeps this
   * correct if that feature is ever turned on — mermaid is fetched once and
   * only the render pass repeats. */
  if (window.document$ && typeof window.document$.subscribe === 'function') {
    window.document$.subscribe(render);
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
