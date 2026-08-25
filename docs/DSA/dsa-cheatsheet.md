# DSA Language Cheatsheet

Quick-reference for DSA interview rounds across JavaScript, TypeScript, Go, and Python 3.

---

<div id="dsa-cheat">
<style>
#dsa-cheat *{box-sizing:border-box;margin:0;padding:0}
#dsa-cheat{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;line-height:1.55;padding:16px 0 32px;max-width:100%}
#dsa-cheat .top-bar{display:flex;align-items:center;gap:10px;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid var(--border);flex-wrap:wrap}
#dsa-cheat .top-title{font-family:'Sora',ui-sans-serif,sans-serif;font-size:17px;font-weight:600;flex:1;color:var(--text)}
#dsa-cheat .lang-pill{font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;font-family:'Sora',ui-sans-serif,sans-serif}
#dsa-cheat .pill-js{background:var(--amber-dim);color:var(--amber);border:1px solid var(--amber)}
#dsa-cheat .pill-ts{background:var(--blue-dim);color:var(--blue);border:1px solid var(--blue)}
#dsa-cheat .pill-go{background:var(--accent-dim);color:var(--accent);border:1px solid var(--accent)}
#dsa-cheat .pill-py{background:var(--purple-dim);color:var(--purple);border:1px solid var(--purple)}
#dsa-cheat .tabs{display:flex;gap:4px;margin-bottom:14px;flex-wrap:wrap}
#dsa-cheat .tab-btn{font-family:'Sora',ui-sans-serif,sans-serif;font-size:12px;font-weight:500;padding:5px 12px;border-radius:6px;border:1px solid var(--border);background:var(--bg2);color:var(--text-muted);cursor:pointer;transition:all .12s}
#dsa-cheat .tab-btn:hover{background:var(--bg3);color:var(--text)}
#dsa-cheat .tab-btn.active{background:var(--accent);color:#0f1117;border-color:var(--accent)}
#dsa-cheat .section{display:none}
#dsa-cheat .section.active{display:block}
#dsa-cheat .grid4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:8px}
#dsa-cheat .grid4-header{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:4px}
#dsa-cheat .lang-header{font-family:'Sora',ui-sans-serif,sans-serif;font-size:11px;font-weight:600;padding:5px 8px;border-radius:6px;text-align:center}
#dsa-cheat .lh-js{background:var(--amber-dim);color:var(--amber);border:1px solid rgba(245,166,35,0.25)}
#dsa-cheat .lh-ts{background:var(--blue-dim);color:var(--blue);border:1px solid rgba(79,158,255,0.25)}
#dsa-cheat .lh-go{background:var(--accent-dim);color:var(--accent);border:1px solid rgba(0,217,163,0.25)}
#dsa-cheat .lh-py{background:var(--purple-dim);color:var(--purple);border:1px solid rgba(179,136,255,0.25)}
#dsa-cheat .row-label{font-family:'Sora',ui-sans-serif,sans-serif;font-size:10px;font-weight:600;color:var(--text-muted);padding:6px 0 2px;margin-top:6px;border-top:1px solid var(--border);grid-column:1/-1;text-transform:uppercase;letter-spacing:.06em}
#dsa-cheat .row-label:first-child{border-top:none;margin-top:0}
#dsa-cheat .cell{background:var(--bg2);border-radius:6px;padding:7px 8px;font-size:10px;line-height:1.65;border:1px solid var(--border);overflow-x:auto}
#dsa-cheat .cell.js{border-left:3px solid var(--amber)}
#dsa-cheat .cell.ts{border-left:3px solid var(--blue)}
#dsa-cheat .cell.go{border-left:3px solid var(--accent)}
#dsa-cheat .cell.py{border-left:3px solid var(--purple)}
#dsa-cheat .cell code{display:block;white-space:pre;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;color:var(--text);background:none;padding:0}
#dsa-cheat .note-box{background:var(--accent-dim2);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:6px;padding:7px 11px;font-family:'Sora',ui-sans-serif,sans-serif;font-size:11.5px;color:var(--text-muted);margin-bottom:10px;line-height:1.6}
#dsa-cheat .kw{color:var(--accent);font-weight:600}
#dsa-cheat .fn{color:var(--blue)}
#dsa-cheat .cm{color:var(--text-dim);font-style:italic}
#dsa-cheat .str{color:var(--accent)}
#dsa-cheat .num{color:var(--amber)}
#dsa-cheat .tp{color:var(--purple)}
#dsa-cheat .tip-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:12px}
#dsa-cheat .tip-card{background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 12px}
#dsa-cheat .tip-card-title{font-family:'Sora',ui-sans-serif,sans-serif;font-size:11.5px;font-weight:600;margin-bottom:7px;color:var(--text)}
#dsa-cheat .tip-card code{display:block;white-space:pre;font-size:10px;line-height:1.7;font-family:'JetBrains Mono',ui-monospace,monospace;color:var(--text)}
#dsa-cheat .cplx-table{width:100%;font-size:10.5px;border-collapse:collapse;font-family:'Sora',ui-sans-serif,sans-serif}
#dsa-cheat .cplx-table th{text-align:left;padding:5px 8px;border-bottom:1px solid var(--border);font-weight:600;color:var(--text);font-size:10.5px}
#dsa-cheat .cplx-table td{padding:5px 8px;border-bottom:1px solid var(--border);font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10.5px;color:var(--text-muted)}
#dsa-cheat .cplx-table tr:last-child td{border-bottom:none}
#dsa-cheat .warn{color:var(--amber);font-weight:600}
@media(max-width:700px){
  #dsa-cheat .grid4,#dsa-cheat .grid4-header{grid-template-columns:repeat(2,minmax(0,1fr))}
  #dsa-cheat .tip-grid{grid-template-columns:1fr}
  #dsa-cheat .lang-header.lh-go,#dsa-cheat .lang-header.lh-py,
  #dsa-cheat .cell.go,#dsa-cheat .cell.py{display:none}
}
</style>

<div class="top-bar">
  <span class="top-title">DSA Interview Cheatsheet</span>
  <span class="lang-pill pill-js">JS</span>
  <span class="lang-pill pill-ts">TS</span>
  <span class="lang-pill pill-go">Go</span>
  <span class="lang-pill pill-py">Python</span>
</div>

<div class="tabs">
  <button class="tab-btn active" onclick="dsaTab(this,'arrays')">Arrays &amp; Strings</button>
  <button class="tab-btn" onclick="dsaTab(this,'maps')">Maps &amp; Sets</button>
  <button class="tab-btn" onclick="dsaTab(this,'stackq')">Stack &amp; Queue</button>
  <button class="tab-btn" onclick="dsaTab(this,'heap')">Heap / PQ</button>
  <button class="tab-btn" onclick="dsaTab(this,'ll')">Linked List</button>
  <button class="tab-btn" onclick="dsaTab(this,'trees')">Trees &amp; Graphs</button>
  <button class="tab-btn" onclick="dsaTab(this,'sort')">Sorting &amp; Search</button>
  <button class="tab-btn" onclick="dsaTab(this,'dp')">DP Patterns</button>
  <button class="tab-btn" onclick="dsaTab(this,'tips')">Quick Tips</button>
</div>

<!-- ───────────── ARRAYS ───────────── -->
<div class="section active" id="dsa-arrays">
<div class="note-box">Core ops: declare, init with size, slice/subarray, sort, reverse, two-pointer setup.</div>
<div class="grid4-header">
  <div class="lang-header lh-js">JavaScript</div>
  <div class="lang-header lh-ts">TypeScript</div>
  <div class="lang-header lh-go">Go</div>
  <div class="lang-header lh-py">Python 3</div>
</div>
<div class="grid4">
  <div class="row-label">Declare / init</div>
  <div class="cell js"><code><span class="kw">const</span> a = [<span class="num">1</span>,<span class="num">2</span>,<span class="num">3</span>];
<span class="kw">const</span> z = <span class="kw">new</span> <span class="fn">Array</span>(<span class="num">5</span>).<span class="fn">fill</span>(<span class="num">0</span>);</code></div>
  <div class="cell ts"><code><span class="kw">const</span> a: <span class="tp">number</span>[] = [<span class="num">1</span>,<span class="num">2</span>,<span class="num">3</span>];
<span class="kw">const</span> z = <span class="kw">new</span> <span class="fn">Array</span>&lt;<span class="tp">number</span>&gt;(<span class="num">5</span>).<span class="fn">fill</span>(<span class="num">0</span>);</code></div>
  <div class="cell go"><code>a := []<span class="tp">int</span>{<span class="num">1</span>,<span class="num">2</span>,<span class="num">3</span>}
z := <span class="fn">make</span>([]<span class="tp">int</span>, <span class="num">5</span>) <span class="cm">// all 0</span></code></div>
  <div class="cell py"><code>a = [<span class="num">1</span>, <span class="num">2</span>, <span class="num">3</span>]
z = [<span class="num">0</span>] * <span class="num">5</span></code></div>

  <div class="row-label">Append / push</div>
  <div class="cell js"><code>a.<span class="fn">push</span>(<span class="num">4</span>);
a.<span class="fn">unshift</span>(<span class="num">0</span>); <span class="cm">// front O(n)</span></code></div>
  <div class="cell ts"><code>a.<span class="fn">push</span>(<span class="num">4</span>);
a.<span class="fn">unshift</span>(<span class="num">0</span>); <span class="cm">// front O(n)</span></code></div>
  <div class="cell go"><code>a = <span class="fn">append</span>(a, <span class="num">4</span>)
<span class="cm">// prepend:</span>
a = <span class="fn">append</span>([]<span class="tp">int</span>{<span class="num">0</span>}, a...)</code></div>
  <div class="cell py"><code>a.<span class="fn">append</span>(<span class="num">4</span>)
a.<span class="fn">insert</span>(<span class="num">0</span>, <span class="num">0</span>) <span class="cm"># front O(n)</span></code></div>

  <div class="row-label">Slice / subarray</div>
  <div class="cell js"><code>a.<span class="fn">slice</span>(<span class="num">1</span>, <span class="num">3</span>) <span class="cm">// [1,3) copy</span>
a.<span class="fn">splice</span>(<span class="num">1</span>, <span class="num">2</span>) <span class="cm">// mutates</span></code></div>
  <div class="cell ts"><code>a.<span class="fn">slice</span>(<span class="num">1</span>, <span class="num">3</span>) <span class="cm">// [1,3) copy</span>
a.<span class="fn">splice</span>(<span class="num">1</span>, <span class="num">2</span>) <span class="cm">// mutates</span></code></div>
  <div class="cell go"><code>a[<span class="num">1</span>:<span class="num">3</span>] <span class="cm">// view, shares mem</span>
<span class="fn">append</span>([]<span class="tp">int</span>{}, a[<span class="num">1</span>:<span class="num">3</span>]...) <span class="cm">// copy</span></code></div>
  <div class="cell py"><code>a[<span class="num">1</span>:<span class="num">3</span>]   <span class="cm"># copy</span>
a[::-<span class="num">1</span>]  <span class="cm"># reversed copy</span></code></div>

  <div class="row-label">Sort</div>
  <div class="cell js"><code>a.<span class="fn">sort</span>((x,y)=>x-y); <span class="cm">// nums</span>
a.<span class="fn">sort</span>(); <span class="cm">// LEXICOGRAPHIC!</span></code></div>
  <div class="cell ts"><code>a.<span class="fn">sort</span>((x,y)=>x-y);
<span class="cm">// same pitfall as JS!</span></code></div>
  <div class="cell go"><code><span class="fn">sort</span>.<span class="fn">Ints</span>(a)
<span class="fn">sort</span>.<span class="fn">Slice</span>(a, <span class="kw">func</span>(i,j <span class="tp">int</span>) <span class="tp">bool</span> {
  <span class="kw">return</span> a[i] &lt; a[j] })</code></div>
  <div class="cell py"><code>a.<span class="fn">sort</span>()           <span class="cm"># in-place</span>
<span class="fn">sorted</span>(a)          <span class="cm"># new list</span>
a.<span class="fn">sort</span>(key=<span class="kw">lambda</span> x: -x)</code></div>

  <div class="row-label">Two-pointer template</div>
  <div class="cell js"><code><span class="kw">let</span> l=<span class="num">0</span>, r=a.<span class="fn">length</span>-<span class="num">1</span>;
<span class="kw">while</span>(l&lt;r){
  <span class="cm">// logic</span>
  l++; r--;
}</code></div>
  <div class="cell ts"><code><span class="kw">let</span> l=<span class="num">0</span>, r=a.<span class="fn">length</span>-<span class="num">1</span>;
<span class="kw">while</span>(l&lt;r){
  <span class="cm">// logic</span>
  l++; r--;
}</code></div>
  <div class="cell go"><code>l, r := <span class="num">0</span>, <span class="fn">len</span>(a)-<span class="num">1</span>
<span class="kw">for</span> l &lt; r {
  <span class="cm">// logic</span>
  l++; r--
}</code></div>
  <div class="cell py"><code>l, r = <span class="num">0</span>, <span class="fn">len</span>(a)-<span class="num">1</span>
<span class="kw">while</span> l &lt; r:
    <span class="cm"># logic</span>
    l += <span class="num">1</span>; r -= <span class="num">1</span></code></div>

  <div class="row-label">String → char array &amp; back</div>
  <div class="cell js"><code>[...<span class="str">"hello"</span>]   <span class="cm">// array</span>
arr.<span class="fn">join</span>(<span class="str">""</span>)   <span class="cm">// back</span></code></div>
  <div class="cell ts"><code>[...<span class="str">"hello"</span>]   <span class="cm">// string[]</span>
arr.<span class="fn">join</span>(<span class="str">""</span>)   <span class="cm">// back</span></code></div>
  <div class="cell go"><code>[]<span class="tp">rune</span>(<span class="str">"hello"</span>)   <span class="cm">// unicode</span>
[]<span class="tp">byte</span>(<span class="str">"hello"</span>)   <span class="cm">// ASCII</span>
<span class="tp">string</span>(arr)       <span class="cm">// back</span></code></div>
  <div class="cell py"><code><span class="fn">list</span>(<span class="str">"hello"</span>)   <span class="cm"># list of chars</span>
<span class="str">""</span>.<span class="fn">join</span>(arr)   <span class="cm"># back to str</span></code></div>
</div>
</div>

<!-- ───────────── MAPS & SETS ───────────── -->
<div class="section" id="dsa-maps">
<div class="note-box">Frequency count, visited set, and existence check are the most common interview patterns.</div>
<div class="grid4-header">
  <div class="lang-header lh-js">JavaScript</div>
  <div class="lang-header lh-ts">TypeScript</div>
  <div class="lang-header lh-go">Go</div>
  <div class="lang-header lh-py">Python 3</div>
</div>
<div class="grid4">
  <div class="row-label">Create map / dict</div>
  <div class="cell js"><code><span class="kw">const</span> m = <span class="kw">new</span> <span class="fn">Map</span>();
<span class="kw">const</span> obj = {}; <span class="cm">// plain obj</span></code></div>
  <div class="cell ts"><code><span class="kw">const</span> m = <span class="kw">new</span> <span class="fn">Map</span>&lt;<span class="tp">string</span>,<span class="tp">number</span>&gt;();
<span class="kw">const</span> obj: <span class="fn">Record</span>&lt;<span class="tp">string</span>,<span class="tp">number</span>&gt; = {};</code></div>
  <div class="cell go"><code>m := <span class="fn">make</span>(<span class="kw">map</span>[<span class="tp">string</span>]<span class="tp">int</span>)
m := <span class="kw">map</span>[<span class="tp">string</span>]<span class="tp">int</span>{<span class="str">"a"</span>:<span class="num">1</span>}</code></div>
  <div class="cell py"><code>m = {}
m = {<span class="str">"a"</span>: <span class="num">1</span>}</code></div>

  <div class="row-label">Get / set / delete</div>
  <div class="cell js"><code>m.<span class="fn">get</span>(k); m.<span class="fn">set</span>(k,v);
m.<span class="fn">delete</span>(k); m.<span class="fn">has</span>(k);</code></div>
  <div class="cell ts"><code>m.<span class="fn">get</span>(k); m.<span class="fn">set</span>(k,v);
m.<span class="fn">delete</span>(k); m.<span class="fn">has</span>(k);</code></div>
  <div class="cell go"><code>v := m[k]       <span class="cm">// 0 if missing</span>
v, ok := m[k]   <span class="cm">// safe check</span>
<span class="kw">delete</span>(m, k)</code></div>
  <div class="cell py"><code>m[k]; m[k]=v; <span class="kw">del</span> m[k]
m.<span class="fn">get</span>(k, default)  <span class="cm"># safe</span></code></div>

  <div class="row-label">Frequency counter</div>
  <div class="cell js"><code><span class="kw">const</span> freq = <span class="kw">new</span> <span class="fn">Map</span>();
<span class="kw">for</span> (<span class="kw">const</span> x <span class="kw">of</span> arr)
  freq.<span class="fn">set</span>(x,(freq.<span class="fn">get</span>(x)??<span class="num">0</span>)+<span class="num">1</span>);</code></div>
  <div class="cell ts"><code><span class="kw">const</span> freq = <span class="kw">new</span> <span class="fn">Map</span>&lt;<span class="tp">number</span>,<span class="tp">number</span>&gt;();
<span class="kw">for</span> (<span class="kw">const</span> x <span class="kw">of</span> arr)
  freq.<span class="fn">set</span>(x,(freq.<span class="fn">get</span>(x)??<span class="num">0</span>)+<span class="num">1</span>);</code></div>
  <div class="cell go"><code>freq := <span class="fn">make</span>(<span class="kw">map</span>[<span class="tp">int</span>]<span class="tp">int</span>)
<span class="kw">for</span> _, v := <span class="kw">range</span> arr {
  freq[v]++
}</code></div>
  <div class="cell py"><code><span class="kw">from</span> collections <span class="kw">import</span> Counter
freq = <span class="fn">Counter</span>(arr)
freq[x] += <span class="num">1</span>  <span class="cm"># auto-init 0</span></code></div>

  <div class="row-label">Set operations</div>
  <div class="cell js"><code><span class="kw">const</span> s = <span class="kw">new</span> <span class="fn">Set</span>([<span class="num">1</span>,<span class="num">2</span>,<span class="num">3</span>]);
s.<span class="fn">add</span>(<span class="num">4</span>); s.<span class="fn">has</span>(<span class="num">2</span>);
s.<span class="fn">delete</span>(<span class="num">2</span>);</code></div>
  <div class="cell ts"><code><span class="kw">const</span> s = <span class="kw">new</span> <span class="fn">Set</span>&lt;<span class="tp">number</span>&gt;([<span class="num">1</span>,<span class="num">2</span>]);
s.<span class="fn">add</span>(<span class="num">4</span>); s.<span class="fn">has</span>(<span class="num">2</span>);
s.<span class="fn">delete</span>(<span class="num">2</span>);</code></div>
  <div class="cell go"><code><span class="cm">// use map[T]bool or map[T]struct{}</span>
seen := <span class="fn">make</span>(<span class="kw">map</span>[<span class="tp">int</span>]<span class="tp">bool</span>)
seen[x] = <span class="kw">true</span>
_, ok := seen[x]</code></div>
  <div class="cell py"><code>s = {<span class="num">1</span>, <span class="num">2</span>, <span class="num">3</span>}
s.<span class="fn">add</span>(<span class="num">4</span>); <span class="num">2</span> <span class="kw">in</span> s;
s.<span class="fn">discard</span>(<span class="num">2</span>)</code></div>

  <div class="row-label">Iterate map</div>
  <div class="cell js"><code><span class="kw">for</span> (<span class="kw">const</span> [k,v] <span class="kw">of</span> m) {}
m.<span class="fn">forEach</span>((v,k) => {})</code></div>
  <div class="cell ts"><code><span class="kw">for</span> (<span class="kw">const</span> [k,v] <span class="kw">of</span> m) {}
<span class="cm">// Object.entries(obj) for plain</span></code></div>
  <div class="cell go"><code><span class="kw">for</span> k, v := <span class="kw">range</span> m {
  <span class="cm">// order NOT guaranteed</span>
}</code></div>
  <div class="cell py"><code><span class="kw">for</span> k, v <span class="kw">in</span> m.<span class="fn">items</span>(): ...
<span class="kw">for</span> k <span class="kw">in</span> m: ...  <span class="cm"># keys only</span></code></div>
</div>
</div>

<!-- ───────────── STACK & QUEUE ───────────── -->
<div class="section" id="dsa-stackq">
<div class="note-box">Stack = LIFO. Queue = FIFO. JS/TS array <code>shift()</code> is O(n) — avoid for queues. Python <code>deque</code> is the correct choice.</div>
<div class="grid4-header">
  <div class="lang-header lh-js">JavaScript</div>
  <div class="lang-header lh-ts">TypeScript</div>
  <div class="lang-header lh-go">Go</div>
  <div class="lang-header lh-py">Python 3</div>
</div>
<div class="grid4">
  <div class="row-label">Stack (LIFO)</div>
  <div class="cell js"><code><span class="kw">const</span> stk = [];
stk.<span class="fn">push</span>(x);       <span class="cm">// O(1)</span>
stk.<span class="fn">pop</span>();        <span class="cm">// O(1)</span>
stk[stk.<span class="fn">length</span>-<span class="num">1</span>]; <span class="cm">// peek</span></code></div>
  <div class="cell ts"><code><span class="kw">const</span> stk: <span class="tp">number</span>[] = [];
stk.<span class="fn">push</span>(x);
stk.<span class="fn">pop</span>();
stk.at(-<span class="num">1</span>);  <span class="cm">// peek</span></code></div>
  <div class="cell go"><code>stk := []<span class="tp">int</span>{}
stk = <span class="fn">append</span>(stk, x)
top := stk[<span class="fn">len</span>(stk)-<span class="num">1</span>]
stk = stk[:<span class="fn">len</span>(stk)-<span class="num">1</span>] <span class="cm">// pop</span></code></div>
  <div class="cell py"><code>stk = []
stk.<span class="fn">append</span>(x)  <span class="cm"># push O(1)</span>
stk.<span class="fn">pop</span>()      <span class="cm"># O(1)</span>
stk[-<span class="num">1</span>]        <span class="cm"># peek</span></code></div>

  <div class="row-label">Queue (FIFO)</div>
  <div class="cell js"><code><span class="cm">// array.shift() is O(n)!</span>
<span class="kw">const</span> q = [];
q.<span class="fn">push</span>(x);   <span class="cm">// enqueue</span>
q.<span class="fn">shift</span>();   <span class="cm">// dequeue O(n) ⚠</span></code></div>
  <div class="cell ts"><code><span class="cm">// same O(n) caveat</span>
<span class="kw">const</span> q: <span class="tp">number</span>[] = [];
q.<span class="fn">push</span>(x);
q.<span class="fn">shift</span>();  <span class="cm">// O(n) ⚠</span></code></div>
  <div class="cell go"><code>q := []<span class="tp">int</span>{}
q = <span class="fn">append</span>(q, x)  <span class="cm">// enqueue</span>
front := q[<span class="num">0</span>]
q = q[<span class="num">1</span>:]          <span class="cm">// dequeue</span></code></div>
  <div class="cell py"><code><span class="kw">from</span> collections <span class="kw">import</span> deque
q = <span class="fn">deque</span>()
q.<span class="fn">append</span>(x)    <span class="cm"># O(1)</span>
q.<span class="fn">popleft</span>()    <span class="cm"># O(1) ✓</span></code></div>

  <div class="row-label">Monotonic stack pattern</div>
  <div class="cell js"><code><span class="kw">const</span> stk = [];
<span class="kw">for</span> (<span class="kw">const</span> x <span class="kw">of</span> arr) {
  <span class="kw">while</span>(stk.<span class="fn">length</span> && stk.at(-<span class="num">1</span>) > x)
    stk.<span class="fn">pop</span>();
  stk.<span class="fn">push</span>(x);
}</code></div>
  <div class="cell ts"><code><span class="kw">const</span> stk: <span class="tp">number</span>[] = [];
<span class="kw">for</span> (<span class="kw">const</span> x <span class="kw">of</span> arr) {
  <span class="kw">while</span>(stk.<span class="fn">length</span> && stk.at(-<span class="num">1</span>)! > x)
    stk.<span class="fn">pop</span>();
  stk.<span class="fn">push</span>(x);
}</code></div>
  <div class="cell go"><code>stk := []<span class="tp">int</span>{}
<span class="kw">for</span> _, x := <span class="kw">range</span> arr {
  <span class="kw">for</span> <span class="fn">len</span>(stk)&gt;<span class="num">0</span> && stk[<span class="fn">len</span>(stk)-<span class="num">1</span>]&gt;x {
    stk = stk[:<span class="fn">len</span>(stk)-<span class="num">1</span>]
  }
  stk = <span class="fn">append</span>(stk, x)
}</code></div>
  <div class="cell py"><code>stk = []
<span class="kw">for</span> x <span class="kw">in</span> arr:
    <span class="kw">while</span> stk <span class="kw">and</span> stk[-<span class="num">1</span>] &gt; x:
        stk.<span class="fn">pop</span>()
    stk.<span class="fn">append</span>(x)</code></div>
</div>
</div>

<!-- ───────────── HEAP ───────────── -->
<div class="section" id="dsa-heap">
<div class="note-box">JS/TS have no built-in heap — write a class or use the negate trick with a MinHeap. Python <code>heapq</code> and Go's <code>container/heap</code> are min-heaps natively.</div>
<div class="grid4-header">
  <div class="lang-header lh-js">JavaScript</div>
  <div class="lang-header lh-ts">TypeScript</div>
  <div class="lang-header lh-go">Go</div>
  <div class="lang-header lh-py">Python 3</div>
</div>
<div class="grid4">
  <div class="row-label">Min-heap push / pop</div>
  <div class="cell js"><code><span class="cm">// No built-in. Minimal class:</span>
<span class="kw">class</span> <span class="fn">MinHeap</span> {
  <span class="fn">push</span>(v) { <span class="cm">/* sift up */</span> }
  <span class="fn">pop</span>()  { <span class="cm">/* sift down */</span> }
  <span class="fn">peek</span>() { <span class="kw">return</span> <span class="kw">this</span>.h[<span class="num">0</span>] }
}</code></div>
  <div class="cell ts"><code><span class="kw">class</span> <span class="fn">MinHeap</span>&lt;T&gt; {
  <span class="kw">constructor</span>(<span class="kw">private</span> cmp:
    (a:<span class="tp">T</span>,b:<span class="tp">T</span>)=&gt;<span class="tp">number</span>) {}
  <span class="fn">push</span>(v:<span class="tp">T</span>) { <span class="cm">/* ... */</span> }
  <span class="fn">pop</span>(): <span class="tp">T</span>  { <span class="cm">/* ... */</span> }
}</code></div>
  <div class="cell go"><code><span class="kw">import</span> <span class="str">"container/heap"</span>
<span class="cm">// implement heap.Interface:</span>
<span class="cm">// Len, Less, Swap, Push, Pop</span>
heap.<span class="fn">Push</span>(&amp;h, x)
heap.<span class="fn">Pop</span>(&amp;h)</code></div>
  <div class="cell py"><code><span class="kw">import</span> heapq
h = []
heapq.<span class="fn">heappush</span>(h, x)
x = heapq.<span class="fn">heappop</span>(h)
h[<span class="num">0</span>]  <span class="cm"># peek min</span></code></div>

  <div class="row-label">Max-heap trick</div>
  <div class="cell js"><code><span class="cm">// Negate → use MinHeap</span>
heap.<span class="fn">push</span>(-x);
<span class="kw">const</span> max = -heap.<span class="fn">pop</span>();</code></div>
  <div class="cell ts"><code><span class="cm">// same negate trick</span>
heap.<span class="fn">push</span>(-x);
<span class="kw">const</span> max = -heap.<span class="fn">pop</span>();</code></div>
  <div class="cell go"><code><span class="cm">// flip Less: a[i] > a[j]</span>
<span class="cm">// or negate values before Push</span></code></div>
  <div class="cell py"><code><span class="cm"># negate for max-heap</span>
heapq.<span class="fn">heappush</span>(h, -x)
max_val = -heapq.<span class="fn">heappop</span>(h)</code></div>

  <div class="row-label">Heapify existing array</div>
  <div class="cell js"><code><span class="cm">// O(n log n) — push each</span>
arr.<span class="fn">forEach</span>(x =&gt; h.<span class="fn">push</span>(x));</code></div>
  <div class="cell ts"><code><span class="cm">// same O(n log n)</span></code></div>
  <div class="cell go"><code>h := <span class="fn">append</span>(<span class="fn">IntHeap</span>(nil), arr...)
heap.<span class="fn">Init</span>(&amp;h)  <span class="cm">// O(n)</span></code></div>
  <div class="cell py"><code>heapq.<span class="fn">heapify</span>(arr)  <span class="cm"># O(n)</span>
<span class="cm"># modifies in-place</span></code></div>

  <div class="row-label">Top-K pattern</div>
  <div class="cell js"><code><span class="kw">for</span> (<span class="kw">const</span> x <span class="kw">of</span> arr) {
  h.<span class="fn">push</span>(x);
  <span class="kw">if</span> (h.<span class="fn">size</span>() &gt; k) h.<span class="fn">pop</span>();
}
<span class="cm">// heap has top-k elements</span></code></div>
  <div class="cell ts"><code><span class="kw">for</span> (<span class="kw">const</span> x <span class="kw">of</span> arr) {
  h.<span class="fn">push</span>(x);
  <span class="kw">if</span> (h.<span class="fn">size</span>() &gt; k) h.<span class="fn">pop</span>();
}</code></div>
  <div class="cell go"><code><span class="kw">for</span> _, x := <span class="kw">range</span> arr {
  heap.<span class="fn">Push</span>(&amp;h, x)
  <span class="kw">if</span> h.<span class="fn">Len</span>() &gt; k {
    heap.<span class="fn">Pop</span>(&amp;h)
  }
}</code></div>
  <div class="cell py"><code><span class="cm"># simplest way</span>
heapq.<span class="fn">nlargest</span>(k, arr)
heapq.<span class="fn">nsmallest</span>(k, arr)</code></div>
</div>
</div>

<!-- ───────────── LINKED LIST ───────────── -->
<div class="section" id="dsa-ll">
<div class="note-box">Dummy head eliminates edge cases. Fast/slow pointer detects cycles and finds midpoints. Always track <code>prev</code> for in-place reversal.</div>
<div class="grid4-header">
  <div class="lang-header lh-js">JavaScript</div>
  <div class="lang-header lh-ts">TypeScript</div>
  <div class="lang-header lh-go">Go</div>
  <div class="lang-header lh-py">Python 3</div>
</div>
<div class="grid4">
  <div class="row-label">Node definition</div>
  <div class="cell js"><code><span class="kw">class</span> <span class="fn">ListNode</span> {
  <span class="kw">constructor</span>(val=<span class="num">0</span>, next=<span class="kw">null</span>) {
    <span class="kw">this</span>.val=val;
    <span class="kw">this</span>.next=next;
  }
}</code></div>
  <div class="cell ts"><code><span class="kw">class</span> <span class="fn">ListNode</span> {
  <span class="kw">constructor</span>(
    <span class="kw">public</span> val=<span class="num">0</span>,
    <span class="kw">public</span> next: <span class="tp">ListNode</span>|<span class="kw">null</span>=<span class="kw">null</span>
  ) {}
}</code></div>
  <div class="cell go"><code><span class="kw">type</span> <span class="tp">ListNode</span> <span class="kw">struct</span> {
  Val  <span class="tp">int</span>
  Next *<span class="tp">ListNode</span>
}</code></div>
  <div class="cell py"><code><span class="kw">class</span> <span class="fn">ListNode</span>:
    <span class="kw">def</span> <span class="fn">__init__</span>(self,
            val=<span class="num">0</span>, nxt=<span class="kw">None</span>):
        self.val = val
        self.next = nxt</code></div>

  <div class="row-label">Reverse in-place</div>
  <div class="cell js"><code><span class="kw">let</span> prev=<span class="kw">null</span>, cur=head;
<span class="kw">while</span>(cur){
  <span class="kw">let</span> nxt=cur.next;
  cur.next=prev;
  prev=cur; cur=nxt;
}
<span class="kw">return</span> prev;</code></div>
  <div class="cell ts"><code><span class="kw">let</span> prev: <span class="tp">ListNode</span>|<span class="kw">null</span>=<span class="kw">null</span>;
<span class="kw">let</span> cur=head;
<span class="kw">while</span>(cur){
  <span class="kw">const</span> nxt=cur.next;
  cur.next=prev; prev=cur; cur=nxt;
}
<span class="kw">return</span> prev;</code></div>
  <div class="cell go"><code><span class="kw">var</span> prev *<span class="tp">ListNode</span>
cur := head
<span class="kw">for</span> cur != <span class="kw">nil</span> {
  nxt := cur.Next
  cur.Next = prev
  prev = cur; cur = nxt
}
<span class="kw">return</span> prev</code></div>
  <div class="cell py"><code>prev, cur = <span class="kw">None</span>, head
<span class="kw">while</span> cur:
    nxt = cur.next
    cur.next = prev
    prev, cur = cur, nxt
<span class="kw">return</span> prev</code></div>

  <div class="row-label">Fast / slow pointer</div>
  <div class="cell js"><code><span class="kw">let</span> slow=head, fast=head;
<span class="kw">while</span>(fast&&fast.next){
  slow=slow.next;
  fast=fast.next.next;
}
<span class="cm">// slow = midpoint</span></code></div>
  <div class="cell ts"><code><span class="kw">let</span> slow=head, fast=head;
<span class="kw">while</span>(fast?.next){
  slow=slow!.next!;
  fast=fast.next.next;
}
<span class="cm">// slow = midpoint</span></code></div>
  <div class="cell go"><code>slow, fast := head, head
<span class="kw">for</span> fast != <span class="kw">nil</span> && fast.Next != <span class="kw">nil</span> {
  slow = slow.Next
  fast = fast.Next.Next
}
<span class="cm">// slow = midpoint</span></code></div>
  <div class="cell py"><code>slow = fast = head
<span class="kw">while</span> fast <span class="kw">and</span> fast.next:
    slow = slow.next
    fast = fast.next.next
<span class="cm"># slow = midpoint</span></code></div>

  <div class="row-label">Dummy head pattern</div>
  <div class="cell js"><code><span class="kw">const</span> dummy = <span class="kw">new</span> <span class="fn">ListNode</span>(<span class="num">0</span>);
dummy.next = head;
<span class="kw">let</span> cur = dummy;
<span class="cm">// build / modify ...</span>
<span class="kw">return</span> dummy.next;</code></div>
  <div class="cell ts"><code><span class="kw">const</span> dummy = <span class="kw">new</span> <span class="fn">ListNode</span>(<span class="num">0</span>);
dummy.next = head;
<span class="kw">let</span> cur: <span class="tp">ListNode</span> = dummy;
<span class="kw">return</span> dummy.next;</code></div>
  <div class="cell go"><code>dummy := &amp;<span class="tp">ListNode</span>{}
dummy.Next = head
cur := dummy
<span class="cm">// ...</span>
<span class="kw">return</span> dummy.Next</code></div>
  <div class="cell py"><code>dummy = <span class="fn">ListNode</span>(<span class="num">0</span>)
dummy.next = head
cur = dummy
<span class="cm"># ...</span>
<span class="kw">return</span> dummy.next</code></div>
</div>
</div>

<!-- ───────────── TREES & GRAPHS ───────────── -->
<div class="section" id="dsa-trees">
<div class="note-box">BFS for shortest path / level-order. DFS for path/subtree problems. Use iterative DFS for deep trees to avoid stack overflow.</div>
<div class="grid4-header">
  <div class="lang-header lh-js">JavaScript</div>
  <div class="lang-header lh-ts">TypeScript</div>
  <div class="lang-header lh-go">Go</div>
  <div class="lang-header lh-py">Python 3</div>
</div>
<div class="grid4">
  <div class="row-label">Tree node</div>
  <div class="cell js"><code><span class="kw">class</span> <span class="fn">TreeNode</span> {
  <span class="kw">constructor</span>(val=<span class="num">0</span>,
    left=<span class="kw">null</span>, right=<span class="kw">null</span>) {
    <span class="kw">this</span>.val=val;
    <span class="kw">this</span>.left=left; <span class="kw">this</span>.right=right;
  }
}</code></div>
  <div class="cell ts"><code><span class="kw">class</span> <span class="fn">TreeNode</span> {
  <span class="kw">constructor</span>(<span class="kw">public</span> val=<span class="num">0</span>,
    <span class="kw">public</span> left:<span class="tp">TreeNode</span>|<span class="kw">null</span>=<span class="kw">null</span>,
    <span class="kw">public</span> right:<span class="tp">TreeNode</span>|<span class="kw">null</span>=<span class="kw">null</span>
  ){}
}</code></div>
  <div class="cell go"><code><span class="kw">type</span> <span class="tp">TreeNode</span> <span class="kw">struct</span> {
  Val         <span class="tp">int</span>
  Left, Right *<span class="tp">TreeNode</span>
}</code></div>
  <div class="cell py"><code><span class="kw">class</span> <span class="fn">TreeNode</span>:
    <span class="kw">def</span> <span class="fn">__init__</span>(self, val=<span class="num">0</span>,
        left=<span class="kw">None</span>, right=<span class="kw">None</span>):
        self.val=val
        self.left=left; self.right=right</code></div>

  <div class="row-label">DFS inorder (iterative)</div>
  <div class="cell js"><code><span class="kw">const</span> stk=[], res=[];
<span class="kw">let</span> cur=root;
<span class="kw">while</span>(cur||stk.<span class="fn">length</span>){
  <span class="kw">while</span>(cur){stk.<span class="fn">push</span>(cur);cur=cur.left;}
  cur=stk.<span class="fn">pop</span>();res.<span class="fn">push</span>(cur.val);
  cur=cur.right;
}</code></div>
  <div class="cell ts"><code><span class="kw">const</span> stk:<span class="tp">TreeNode</span>[]=[];
<span class="kw">let</span> cur:<span class="tp">TreeNode</span>|<span class="kw">null</span>=root;
<span class="kw">while</span>(cur||stk.<span class="fn">length</span>){
  <span class="kw">while</span>(cur){stk.<span class="fn">push</span>(cur);cur=cur.left;}
  cur=stk.<span class="fn">pop</span>()!;res.<span class="fn">push</span>(cur.val);
  cur=cur.right;
}</code></div>
  <div class="cell go"><code>stk := []*<span class="tp">TreeNode</span>{}; cur := root
<span class="kw">for</span> cur != <span class="kw">nil</span> || <span class="fn">len</span>(stk) &gt; <span class="num">0</span> {
  <span class="kw">for</span> cur != <span class="kw">nil</span> {
    stk = <span class="fn">append</span>(stk, cur); cur = cur.Left }
  n := <span class="fn">len</span>(stk)-<span class="num">1</span>
  cur = stk[n]; stk = stk[:n]
  res = <span class="fn">append</span>(res, cur.Val); cur = cur.Right
}</code></div>
  <div class="cell py"><code>stk, cur, res = [], root, []
<span class="kw">while</span> cur <span class="kw">or</span> stk:
    <span class="kw">while</span> cur:
        stk.<span class="fn">append</span>(cur); cur = cur.left
    cur = stk.<span class="fn">pop</span>()
    res.<span class="fn">append</span>(cur.val); cur = cur.right</code></div>

  <div class="row-label">BFS level-order</div>
  <div class="cell js"><code><span class="kw">const</span> q=[root];
<span class="kw">while</span>(q.<span class="fn">length</span>){
  <span class="kw">const</span> node=q.<span class="fn">shift</span>();
  <span class="kw">if</span>(node.left) q.<span class="fn">push</span>(node.left);
  <span class="kw">if</span>(node.right) q.<span class="fn">push</span>(node.right);
}</code></div>
  <div class="cell ts"><code><span class="kw">const</span> q=[root];
<span class="kw">while</span>(q.<span class="fn">length</span>){
  <span class="kw">const</span> node=q.<span class="fn">shift</span>()!;
  <span class="kw">if</span>(node.left) q.<span class="fn">push</span>(node.left);
  <span class="kw">if</span>(node.right) q.<span class="fn">push</span>(node.right);
}</code></div>
  <div class="cell go"><code>q := []*<span class="tp">TreeNode</span>{root}
<span class="kw">for</span> <span class="fn">len</span>(q) &gt; <span class="num">0</span> {
  node := q[<span class="num">0</span>]; q = q[<span class="num">1</span>:]
  <span class="kw">if</span> node.Left != <span class="kw">nil</span> { q = <span class="fn">append</span>(q, node.Left) }
  <span class="kw">if</span> node.Right != <span class="kw">nil</span> { q = <span class="fn">append</span>(q, node.Right) }
}</code></div>
  <div class="cell py"><code><span class="kw">from</span> collections <span class="kw">import</span> deque
q = <span class="fn">deque</span>([root])
<span class="kw">while</span> q:
    node = q.<span class="fn">popleft</span>()
    <span class="kw">if</span> node.left: q.<span class="fn">append</span>(node.left)
    <span class="kw">if</span> node.right: q.<span class="fn">append</span>(node.right)</code></div>

  <div class="row-label">Adjacency list + visited</div>
  <div class="cell js"><code><span class="kw">const</span> g = <span class="kw">new</span> <span class="fn">Map</span>();
g.<span class="fn">set</span>(u, [...(g.<span class="fn">get</span>(u)??[]), v]);
<span class="kw">const</span> vis = <span class="kw">new</span> <span class="fn">Set</span>();</code></div>
  <div class="cell ts"><code><span class="kw">const</span> g = <span class="kw">new</span> <span class="fn">Map</span>&lt;<span class="tp">number</span>,<span class="tp">number</span>[]&gt;();
<span class="kw">const</span> vis = <span class="kw">new</span> <span class="fn">Set</span>&lt;<span class="tp">number</span>&gt;();</code></div>
  <div class="cell go"><code>g := <span class="fn">make</span>(<span class="kw">map</span>[<span class="tp">int</span>][]<span class="tp">int</span>)
g[u] = <span class="fn">append</span>(g[u], v)
vis := <span class="fn">make</span>(<span class="kw">map</span>[<span class="tp">int</span>]<span class="tp">bool</span>)</code></div>
  <div class="cell py"><code><span class="kw">from</span> collections <span class="kw">import</span> defaultdict
g = <span class="fn">defaultdict</span>(list)
g[u].<span class="fn">append</span>(v)
vis = <span class="fn">set</span>()</code></div>
</div>
</div>

<!-- ───────────── SORTING & SEARCH ───────────── -->
<div class="section" id="dsa-sort">
<div class="note-box">Binary search invariant: what does <code>lo</code> always satisfy? What does <code>hi</code> always satisfy? The answer is <code>lo</code> when the loop ends.</div>
<div class="grid4-header">
  <div class="lang-header lh-js">JavaScript</div>
  <div class="lang-header lh-ts">TypeScript</div>
  <div class="lang-header lh-go">Go</div>
  <div class="lang-header lh-py">Python 3</div>
</div>
<div class="grid4">
  <div class="row-label">Binary search (exact)</div>
  <div class="cell js"><code><span class="kw">let</span> lo=<span class="num">0</span>, hi=n-<span class="num">1</span>;
<span class="kw">while</span>(lo&lt;=hi){
  <span class="kw">const</span> mid=(lo+hi)&gt;&gt;<span class="num">1</span>;
  <span class="kw">if</span>(a[mid]===t) <span class="kw">return</span> mid;
  <span class="kw">else if</span>(a[mid]&lt;t) lo=mid+<span class="num">1</span>;
  <span class="kw">else</span> hi=mid-<span class="num">1</span>;
}</code></div>
  <div class="cell ts"><code><span class="kw">let</span> lo=<span class="num">0</span>, hi=n-<span class="num">1</span>;
<span class="kw">while</span>(lo&lt;=hi){
  <span class="kw">const</span> mid=(lo+hi)&gt;&gt;<span class="num">1</span>;
  <span class="kw">if</span>(a[mid]===t) <span class="kw">return</span> mid;
  <span class="kw">else if</span>(a[mid]&lt;t) lo=mid+<span class="num">1</span>;
  <span class="kw">else</span> hi=mid-<span class="num">1</span>;
}</code></div>
  <div class="cell go"><code>lo, hi := <span class="num">0</span>, <span class="fn">len</span>(a)-<span class="num">1</span>
<span class="kw">for</span> lo &lt;= hi {
  mid := (lo + hi) &gt;&gt; <span class="num">1</span>
  <span class="kw">if</span> a[mid] == t { <span class="kw">return</span> mid }
  <span class="kw">else if</span> a[mid] &lt; t { lo = mid+<span class="num">1</span> }
  <span class="kw">else</span> { hi = mid-<span class="num">1</span> }
}</code></div>
  <div class="cell py"><code><span class="kw">import</span> bisect
<span class="cm"># use bisect_left for left-bound</span>
lo, hi = <span class="num">0</span>, <span class="fn">len</span>(a)-<span class="num">1</span>
<span class="kw">while</span> lo &lt;= hi:
    mid = (lo+hi)&gt;&gt;<span class="num">1</span>
    <span class="kw">if</span> a[mid]==t: <span class="kw">return</span> mid
    <span class="kw">elif</span> a[mid]&lt;t: lo=mid+<span class="num">1</span>
    <span class="kw">else</span>: hi=mid-<span class="num">1</span></code></div>

  <div class="row-label">Left-bound (first ≥ target)</div>
  <div class="cell js"><code><span class="kw">let</span> lo=<span class="num">0</span>, hi=n;
<span class="kw">while</span>(lo&lt;hi){
  <span class="kw">const</span> mid=(lo+hi)&gt;&gt;<span class="num">1</span>;
  <span class="kw">if</span>(a[mid]&lt;t) lo=mid+<span class="num">1</span>;
  <span class="kw">else</span> hi=mid;
}
<span class="cm">// lo = first index >= t</span></code></div>
  <div class="cell ts"><code><span class="kw">let</span> lo=<span class="num">0</span>, hi=n;
<span class="kw">while</span>(lo&lt;hi){
  <span class="kw">const</span> mid=(lo+hi)&gt;&gt;<span class="num">1</span>;
  <span class="kw">if</span>(a[mid]&lt;t) lo=mid+<span class="num">1</span>;
  <span class="kw">else</span> hi=mid;
}</code></div>
  <div class="cell go"><code>lo, hi := <span class="num">0</span>, <span class="fn">len</span>(a)
<span class="kw">for</span> lo &lt; hi {
  mid := (lo+hi) &gt;&gt; <span class="num">1</span>
  <span class="kw">if</span> a[mid] &lt; t { lo = mid+<span class="num">1</span> }
  <span class="kw">else</span> { hi = mid }
}
<span class="cm">// or: sort.SearchInts(a, t)</span></code></div>
  <div class="cell py"><code>bisect.<span class="fn">bisect_left</span>(a, t)
<span class="cm"># leftmost i s.t. a[i] >= t</span>
bisect.<span class="fn">bisect_right</span>(a, t)
<span class="cm"># leftmost i s.t. a[i] > t</span></code></div>

  <div class="row-label">Custom sort comparator</div>
  <div class="cell js"><code>arr.<span class="fn">sort</span>((a,b) =&gt; {
  <span class="kw">if</span>(a.x !== b.x) <span class="kw">return</span> a.x-b.x;
  <span class="kw">return</span> b.y-a.y; <span class="cm">// desc y</span>
});</code></div>
  <div class="cell ts"><code>arr.<span class="fn">sort</span>((a,b): <span class="tp">number</span> =&gt; {
  <span class="kw">if</span>(a.x !== b.x) <span class="kw">return</span> a.x-b.x;
  <span class="kw">return</span> b.y-a.y;
});</code></div>
  <div class="cell go"><code><span class="fn">sort</span>.<span class="fn">Slice</span>(arr, <span class="kw">func</span>(i,j <span class="tp">int</span>) <span class="tp">bool</span> {
  <span class="kw">if</span> arr[i].X != arr[j].X {
    <span class="kw">return</span> arr[i].X &lt; arr[j].X
  }
  <span class="kw">return</span> arr[i].Y &gt; arr[j].Y
})</code></div>
  <div class="cell py"><code><span class="kw">from</span> functools <span class="kw">import</span> cmp_to_key
arr.<span class="fn">sort</span>(key=<span class="kw">lambda</span> x: (x.x, -x.y))
<span class="cm"># tuple key: primary asc, secondary desc</span>
<span class="cm"># cmp_to_key for complex 3-way compare</span></code></div>
</div>
</div>

<!-- ───────────── DP ───────────── -->
<div class="section" id="dsa-dp">
<div class="note-box">Define: state, transition, base case, answer location. Top-down is easier to write; bottom-up avoids recursion depth limits.</div>
<div class="grid4-header">
  <div class="lang-header lh-js">JavaScript</div>
  <div class="lang-header lh-ts">TypeScript</div>
  <div class="lang-header lh-go">Go</div>
  <div class="lang-header lh-py">Python 3</div>
</div>
<div class="grid4">
  <div class="row-label">Top-down memo</div>
  <div class="cell js"><code><span class="kw">const</span> memo = <span class="kw">new</span> <span class="fn">Map</span>();
<span class="kw">function</span> <span class="fn">dp</span>(i) {
  <span class="kw">if</span>(memo.<span class="fn">has</span>(i)) <span class="kw">return</span> memo.<span class="fn">get</span>(i);
  <span class="kw">const</span> res = <span class="cm">/* recurrence */</span>;
  memo.<span class="fn">set</span>(i, res);
  <span class="kw">return</span> res;
}</code></div>
  <div class="cell ts"><code><span class="kw">const</span> memo = <span class="kw">new</span> <span class="fn">Map</span>&lt;<span class="tp">number</span>,<span class="tp">number</span>&gt;();
<span class="kw">function</span> <span class="fn">dp</span>(i: <span class="tp">number</span>): <span class="tp">number</span> {
  <span class="kw">if</span>(memo.<span class="fn">has</span>(i)) <span class="kw">return</span> memo.<span class="fn">get</span>(i)!;
  <span class="kw">const</span> res = <span class="cm">/* ... */</span>;
  memo.<span class="fn">set</span>(i, res); <span class="kw">return</span> res;
}</code></div>
  <div class="cell go"><code>memo := <span class="fn">make</span>(<span class="kw">map</span>[<span class="tp">int</span>]<span class="tp">int</span>)
<span class="kw">var</span> dp <span class="kw">func</span>(<span class="tp">int</span>) <span class="tp">int</span>
dp = <span class="kw">func</span>(i <span class="tp">int</span>) <span class="tp">int</span> {
  <span class="kw">if</span> v, ok := memo[i]; ok { <span class="kw">return</span> v }
  res := <span class="cm">/* ... */</span>
  memo[i] = res; <span class="kw">return</span> res
}</code></div>
  <div class="cell py"><code><span class="kw">from</span> functools <span class="kw">import</span> lru_cache

@<span class="fn">lru_cache</span>(maxsize=<span class="kw">None</span>)
<span class="kw">def</span> <span class="fn">dp</span>(i):
    <span class="kw">if</span> base_case: <span class="kw">return</span> ...
    <span class="kw">return</span> <span class="cm"># recurrence</span></code></div>

  <div class="row-label">Bottom-up 1D</div>
  <div class="cell js"><code><span class="kw">const</span> dp = <span class="kw">new</span> <span class="fn">Array</span>(n+<span class="num">1</span>).<span class="fn">fill</span>(<span class="num">0</span>);
dp[<span class="num">0</span>] = <span class="num">1</span>; <span class="cm">// base case</span>
<span class="kw">for</span>(<span class="kw">let</span> i=<span class="num">1</span>;i&lt;=n;i++)
  dp[i] = dp[i-<span class="num">1</span>] + dp[i-<span class="num">2</span>];</code></div>
  <div class="cell ts"><code><span class="kw">const</span> dp: <span class="tp">number</span>[] = <span class="kw">new</span> <span class="fn">Array</span>(n+<span class="num">1</span>).<span class="fn">fill</span>(<span class="num">0</span>);
dp[<span class="num">0</span>] = <span class="num">1</span>;
<span class="kw">for</span>(<span class="kw">let</span> i=<span class="num">1</span>;i&lt;=n;i++)
  dp[i] = dp[i-<span class="num">1</span>] + dp[i-<span class="num">2</span>];</code></div>
  <div class="cell go"><code>dp := <span class="fn">make</span>([]<span class="tp">int</span>, n+<span class="num">1</span>)
dp[<span class="num">0</span>] = <span class="num">1</span>
<span class="kw">for</span> i := <span class="num">1</span>; i &lt;= n; i++ {
  dp[i] = dp[i-<span class="num">1</span>] + dp[i-<span class="num">2</span>]
}</code></div>
  <div class="cell py"><code>dp = [<span class="num">0</span>] * (n + <span class="num">1</span>)
dp[<span class="num">0</span>] = <span class="num">1</span>
<span class="kw">for</span> i <span class="kw">in</span> <span class="fn">range</span>(<span class="num">1</span>, n + <span class="num">1</span>):
    dp[i] = dp[i-<span class="num">1</span>] + dp[i-<span class="num">2</span>]</code></div>

  <div class="row-label">2D DP (knapsack / LCS)</div>
  <div class="cell js"><code><span class="kw">const</span> dp = <span class="fn">Array</span>.<span class="fn">from</span>({length:m+<span class="num">1</span>},
  () =&gt; <span class="kw">new</span> <span class="fn">Array</span>(n+<span class="num">1</span>).<span class="fn">fill</span>(<span class="num">0</span>));
<span class="kw">for</span>(<span class="kw">let</span> i=<span class="num">1</span>;i&lt;=m;i++)
  <span class="kw">for</span>(<span class="kw">let</span> j=<span class="num">1</span>;j&lt;=n;j++)
    dp[i][j] = <span class="cm">/* transition */</span>;</code></div>
  <div class="cell ts"><code><span class="kw">const</span> dp:<span class="tp">number</span>[][] = <span class="fn">Array</span>.<span class="fn">from</span>(
  {length:m+<span class="num">1</span>},()=&gt;<span class="kw">new</span> <span class="fn">Array</span>(n+<span class="num">1</span>).<span class="fn">fill</span>(<span class="num">0</span>));
<span class="kw">for</span>(<span class="kw">let</span> i=<span class="num">1</span>;i&lt;=m;i++)
  <span class="kw">for</span>(<span class="kw">let</span> j=<span class="num">1</span>;j&lt;=n;j++) {}</code></div>
  <div class="cell go"><code>dp := <span class="fn">make</span>([][]<span class="tp">int</span>, m+<span class="num">1</span>)
<span class="kw">for</span> i := <span class="kw">range</span> dp {
  dp[i] = <span class="fn">make</span>([]<span class="tp">int</span>, n+<span class="num">1</span>)
}
<span class="kw">for</span> i:=<span class="num">1</span>;i&lt;=m;i++ {
  <span class="kw">for</span> j:=<span class="num">1</span>;j&lt;=n;j++ {} }</code></div>
  <div class="cell py"><code>dp = [[<span class="num">0</span>]*(n+<span class="num">1</span>) <span class="kw">for</span> _ <span class="kw">in</span> <span class="fn">range</span>(m+<span class="num">1</span>)]
<span class="kw">for</span> i <span class="kw">in</span> <span class="fn">range</span>(<span class="num">1</span>, m+<span class="num">1</span>):
    <span class="kw">for</span> j <span class="kw">in</span> <span class="fn">range</span>(<span class="num">1</span>, n+<span class="num">1</span>):
        dp[i][j] = ...</code></div>

  <div class="row-label">Infinity init</div>
  <div class="cell js"><code>dp.<span class="fn">fill</span>(<span class="fn">Infinity</span>);  <span class="cm">// min problems</span>
dp.<span class="fn">fill</span>(-<span class="fn">Infinity</span>); <span class="cm">// max problems</span></code></div>
  <div class="cell ts"><code>dp.<span class="fn">fill</span>(<span class="fn">Infinity</span>);
dp.<span class="fn">fill</span>(-<span class="fn">Infinity</span>);</code></div>
  <div class="cell go"><code><span class="kw">import</span> <span class="str">"math"</span>
math.MaxInt  math.MinInt
<span class="cm">// or: 1&lt;&lt;60 and -(1&lt;&lt;60)</span></code></div>
  <div class="cell py"><code>dp = [<span class="fn">float</span>(<span class="str">'inf'</span>)] * n
dp = [<span class="fn">float</span>(<span class="str">'-inf'</span>)] * n</code></div>
</div>
</div>

<!-- ───────────── QUICK TIPS ───────────── -->
<div class="section" id="dsa-tips">
<div class="note-box">Language-specific gotchas that cost time in interviews. Know these cold.</div>
<div class="tip-grid">
  <div class="tip-card" style="border-left:3px solid var(--amber)">
    <div class="tip-card-title" style="color:var(--amber)">JavaScript pitfalls</div>
    <code><span class="cm">// Sort is LEXICOGRAPHIC by default!</span>
[<span class="num">10</span>,<span class="num">9</span>,<span class="num">1</span>].<span class="fn">sort</span>()         <span class="cm">// [1,10,9] WRONG</span>
[<span class="num">10</span>,<span class="num">9</span>,<span class="num">1</span>].<span class="fn">sort</span>((a,b)=>a-b) <span class="cm">// [1,9,10] ✓</span>

<span class="cm">// Integer division</span>
<span class="num">7</span> / <span class="num">2</span>             <span class="cm">// 3.5 (not 3!)</span>
<span class="fn">Math</span>.<span class="fn">floor</span>(<span class="num">7</span>/<span class="num">2</span>)   <span class="cm">// 3</span>
(<span class="num">7</span>/<span class="num">2</span>)|<span class="num">0</span>             <span class="cm">// 3 (bitwise)</span>

<span class="cm">// Char codes</span>
<span class="str">"a"</span>.<span class="fn">charCodeAt</span>(<span class="num">0</span>)       <span class="cm">// 97</span>
<span class="fn">String</span>.<span class="fn">fromCharCode</span>(<span class="num">97</span>) <span class="cm">// "a"</span></code>
  </div>
  <div class="tip-card" style="border-left:3px solid var(--blue)">
    <div class="tip-card-title" style="color:var(--blue)">TypeScript extras</div>
    <code><span class="cm">// Non-null assertion when sure</span>
arr.<span class="fn">pop</span>()!  <span class="cm">// T, not T|undefined</span>

<span class="cm">// as const for literal tuple types</span>
<span class="kw">const</span> dirs = [[-<span class="num">1</span>,<span class="num">0</span>],[<span class="num">1</span>,<span class="num">0</span>]] <span class="kw">as const</span>

<span class="cm">// Tuple key pitfall in Map!</span>
<span class="cm">// [1,2] !== [1,2] — use "1,2" string</span>
<span class="kw">const</span> key = `${r},${c}`

<span class="cm">// Readonly prevents accidental mutation</span>
<span class="kw">function</span> <span class="fn">f</span>(a: <span class="fn">Readonly</span>&lt;<span class="tp">number</span>[]&gt;) {}</code>
  </div>
  <div class="tip-card" style="border-left:3px solid var(--accent)">
    <div class="tip-card-title" style="color:var(--accent)">Go gotchas</div>
    <code><span class="cm">// Slice is a VIEW — copy if needed</span>
b := <span class="fn">make</span>([]<span class="tp">int</span>, <span class="fn">len</span>(a))
<span class="fn">copy</span>(b, a)

<span class="cm">// Missing map key returns zero value</span>
v, ok := m[k]  <span class="cm">// always use 2-val form</span>

<span class="cm">// No built-in min/max for ints</span>
<span class="kw">if</span> a &gt; b { <span class="kw">return</span> a }; <span class="kw">return</span> b

<span class="cm">// String concat in loop → Builder</span>
<span class="kw">var</span> sb strings.<span class="tp">Builder</span>
sb.<span class="fn">WriteString</span>(s)
result := sb.<span class="fn">String</span>()</code>
  </div>
  <div class="tip-card" style="border-left:3px solid var(--purple)">
    <div class="tip-card-title" style="color:var(--purple)">Python power moves</div>
    <code><span class="cm"># No integer overflow (arbitrary precision)</span>
<span class="cm"># float('inf') works in min() / max()</span>

<span class="cm"># Tuple as hashable set/dict key</span>
seen.<span class="fn">add</span>((r, c))

<span class="cm"># Swap without temp variable</span>
a, b = b, a

<span class="cm"># Zip for matrix transpose</span>
<span class="fn">list</span>(<span class="fn">zip</span>(*matrix))

<span class="cm"># enumerate + tuple unpacking</span>
<span class="kw">for</span> i, v <span class="kw">in</span> <span class="fn">enumerate</span>(arr): ...

<span class="cm"># defaultdict avoids KeyError</span>
<span class="kw">from</span> collections <span class="kw">import</span> defaultdict</code>
  </div>
</div>

<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 14px">
  <div style="font-family:'Sora',ui-sans-serif,sans-serif;font-size:12px;font-weight:600;margin-bottom:8px;color:var(--text)">Complexity quick-ref</div>
  <table class="cplx-table">
    <thead>
      <tr><th>Operation</th><th>JS / TS</th><th>Go</th><th>Python</th></tr>
    </thead>
    <tbody>
      <tr><td>Array push / pop</td><td>O(1) amort</td><td>O(1) amort</td><td>O(1) amort</td></tr>
      <tr><td>Array shift (front)</td><td class="warn">O(n) ⚠</td><td class="warn">O(n) ⚠</td><td>deque O(1)</td></tr>
      <tr><td>Map get / set</td><td>O(1) avg</td><td>O(1) avg</td><td>O(1) avg</td></tr>
      <tr><td>Sort</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n log n)</td></tr>
      <tr><td>Heap push / pop</td><td>O(log n)</td><td>O(log n)</td><td>O(log n)</td></tr>
      <tr><td>Binary search</td><td>O(log n)</td><td>O(log n)</td><td>O(log n)</td></tr>
    </tbody>
  </table>
</div>
</div>

<script>
function dsaTab(btn, name) {
  var root = document.getElementById('dsa-cheat');
  root.querySelectorAll('.section').forEach(function(s){ s.classList.remove('active'); });
  root.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
  var sec = document.getElementById('dsa-' + name);
  if (sec) sec.classList.add('active');
  btn.classList.add('active');
}
</script>
</div>
