# 30-Day Senior Engineer Sprint

<div id="sprint30">
<style>
#sprint30 *{box-sizing:border-box}
#sprint30 p{margin:0}
#sprint30{
  font-family:'Sora',sans-serif;
  line-height:1.55;
  padding:0 0 60px;
  --s30-done:#4ade80;
  --s30-done-soft:rgba(74,222,128,.09);
  --s30-accent-deep:#00b38f;
}

/* ── Header ── */
#sprint30 .s30-header{padding:28px 0 22px;border-bottom:1px solid var(--border);margin-bottom:28px}
#sprint30 .s30-eyebrow{
  font-family:'JetBrains Mono',monospace;
  font-size:11px;letter-spacing:.26em;text-transform:uppercase;
  color:var(--accent);margin-bottom:12px;
}
#sprint30 .s30-lede{color:var(--text-muted);font-size:14.5px;max-width:640px;line-height:1.65}
#sprint30 .s30-lede b{color:var(--text);font-weight:600}

#sprint30 .meterbar{display:flex;align-items:flex-end;gap:30px;flex-wrap:wrap;margin-top:24px}
#sprint30 .bignum{display:flex;align-items:baseline;gap:7px}
#sprint30 .bignum .pct{
  font-family:'JetBrains Mono',monospace;font-weight:700;
  font-size:clamp(44px,8vw,68px);line-height:.9;color:var(--text);letter-spacing:-.03em;
}
#sprint30 .bignum .sym{font-family:'JetBrains Mono',monospace;font-size:26px;color:var(--accent)}
#sprint30 .meta-stats{display:flex;gap:26px;padding-bottom:6px}
#sprint30 .stat .v{font-family:'JetBrains Mono',monospace;font-size:19px;font-weight:500;color:var(--text)}
#sprint30 .stat .l{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--text-dim);margin-top:2px}

#sprint30 .track{
  margin-top:20px;height:5px;border-radius:99px;background:var(--bg3);
  overflow:hidden;border:1px solid var(--border);
}
#sprint30 .track > i{
  display:block;height:100%;width:0%;
  background:linear-gradient(90deg,var(--s30-accent-deep),var(--accent));
  border-radius:99px;transition:width .6s cubic-bezier(.2,.8,.2,1);
}

/* ── Week chips ── */
#sprint30 .weeks-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:26px 0 6px}
@media(max-width:640px){#sprint30 .weeks-row{grid-template-columns:repeat(2,1fr)}}
#sprint30 .chip{
  background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);
  padding:13px 14px;text-decoration:none !important;color:var(--text) !important;display:block;
  transition:transform .2s,border-color .2s;
}
#sprint30 .chip:hover{transform:translateY(-3px);border-color:var(--border-hover)}
#sprint30 .chip .wk{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}
#sprint30 .chip .ttl{font-size:13px;font-weight:600;margin:5px 0 10px;line-height:1.3;color:var(--text)}
#sprint30 .chip .ct{font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--text-dim);margin-bottom:6px}
#sprint30 .chip .mini{height:4px;border-radius:99px;background:var(--bg3);overflow:hidden}
#sprint30 .chip .mini > i{display:block;height:100%;width:0;background:var(--accent);border-radius:99px;transition:width .5s}
#sprint30 .chip.full .mini > i{background:var(--s30-done)}
#sprint30 .chip.full .wk{color:var(--s30-done)}

/* ── Week section ── */
#sprint30 .week{margin-top:42px;scroll-margin-top:20px}
#sprint30 .week-head{display:flex;align-items:center;gap:12px;margin-bottom:4px}
#sprint30 .week-head .tag{
  font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--accent);
  border:1px solid var(--border);border-radius:8px;padding:4px 10px;white-space:nowrap;
}
#sprint30 .week-head h2{
  font-family:'Sora',sans-serif !important;font-weight:600 !important;font-size:21px !important;
  letter-spacing:-.01em;color:var(--text) !important;
  border:none !important;padding:0 !important;margin:0 !important;
}
#sprint30 .week-sub{color:var(--text-muted);font-size:13px;margin:2px 0 18px;padding-left:2px}

/* ── Day grid ── */
#sprint30 .days{display:grid;grid-template-columns:repeat(2,1fr);gap:13px}
@media(max-width:760px){#sprint30 .days{grid-template-columns:1fr}}

#sprint30 .day{
  background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);
  padding:15px 15px 6px;position:relative;overflow:hidden;
  transition:border-color .25s,background .25s;
}
#sprint30 .day::before{
  content:"";position:absolute;left:0;top:0;bottom:0;width:3px;
  background:var(--border);transition:background .25s;
}
#sprint30 .day.deep::before{background:linear-gradient(180deg,var(--accent),var(--s30-accent-deep))}
#sprint30 .day.done{border-color:rgba(74,222,128,.3);background:linear-gradient(180deg,var(--s30-done-soft),transparent 40%)}
#sprint30 .day.done::before{background:var(--s30-done)}

#sprint30 .day-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:11px}
#sprint30 .day-no{display:flex;align-items:baseline;gap:8px}
#sprint30 .day-no .n{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:var(--accent)}
#sprint30 .day-no .tag{font-size:13px;font-weight:600;color:var(--text)}
#sprint30 .badge{
  font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.13em;text-transform:uppercase;
  color:var(--accent);background:var(--accent-dim);border-radius:6px;padding:3px 7px;
  white-space:nowrap;border:1px solid rgba(0,217,163,.2);
}
#sprint30 .day.done .check-emoji{color:var(--s30-done);font-size:13px}

/* ── Task rows ── */
#sprint30 .task{
  display:flex;gap:10px;align-items:flex-start;padding:7px 4px;cursor:pointer;
  border-top:1px solid var(--border);
}
#sprint30 .task:first-of-type{border-top:none}
#sprint30 .task input{position:absolute;opacity:0;width:0;height:0}
#sprint30 .box{
  flex:0 0 auto;width:17px;height:17px;margin-top:3px;border-radius:5px;
  border:1.5px solid var(--text-dim);position:relative;transition:all .18s;
}
#sprint30 .task:hover .box{border-color:var(--accent)}
#sprint30 .box::after{
  content:"";position:absolute;left:4px;top:1px;width:5px;height:9px;
  border:solid var(--bg);border-width:0 2px 2px 0;
  transform:rotate(45deg) scale(0);
  transition:transform .18s cubic-bezier(.2,1.4,.5,1);
}
#sprint30 .task input:checked + .box{background:var(--accent);border-color:var(--accent)}
#sprint30 .task input:checked + .box::after{transform:rotate(45deg) scale(1)}
#sprint30 .task input:focus-visible + .box{outline:2px solid var(--accent);outline-offset:2px}
#sprint30 .task .txt{font-size:13px;color:var(--text);transition:color .18s;line-height:1.55}
#sprint30 .task .txt b{color:var(--accent);font-weight:600}
#sprint30 .task input:checked ~ .txt{color:var(--text-dim);text-decoration:line-through;text-decoration-color:var(--border)}

/* ── Note / footer ── */
#sprint30 .sprint-note{
  background:var(--accent-dim2);border:1px solid var(--border);
  border-left:3px solid var(--accent);border-radius:var(--radius);
  padding:12px 15px;font-size:13px;color:var(--text-muted);margin-bottom:26px;line-height:1.6;
}
#sprint30 .sprint-note b{color:var(--accent)}

#sprint30 .footnote{
  margin-top:42px;padding-top:20px;border-top:1px solid var(--border);
  display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;
  color:var(--text-dim);font-size:11.5px;font-family:'JetBrains Mono',monospace;
}
#sprint30 .reset{
  background:transparent;border:1px solid var(--border);color:var(--text-muted);
  font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;
  padding:8px 14px;border-radius:8px;cursor:pointer;transition:all .2s;
}
#sprint30 .reset:hover{border-color:var(--red);color:var(--red)}

#sprint30 .week,#sprint30 .weeks-row,#sprint30 .sprint-note{
  opacity:0;transform:translateY(12px);animation:s30rise .6s forwards;
}
@keyframes s30rise{to{opacity:1;transform:none}}
</style>

<div class="s30-header">
  <div class="s30-eyebrow">Backend &amp; AI · Senior IC Loop</div>
  <p class="s30-lede">A daily plan that protects the time senior loops are actually decided on — <b>system design narration, AI design, and behavioral stories</b> — while keeping DSA warm rather than letting it eat the calendar.</p>
  <div class="meterbar">
    <div class="bignum"><span class="pct" id="pct">0</span><span class="sym">%</span></div>
    <div class="meta-stats">
      <div class="stat"><div class="v" id="taskCt">0/0</div><div class="l">Tasks</div></div>
      <div class="stat"><div class="v" id="dayCt">0/30</div><div class="l">Days cleared</div></div>
    </div>
  </div>
  <div class="track"><i id="bar"></i></div>
</div>

<div class="sprint-note">
  <b>Assumption baked in:</b> the AI sections target <b>AI application / platform</b> roles (RAG, vector search, LLM cost/latency, evals, guardrails) — the best fit for your backend + distributed-systems profile. If it's heavier ML-modeling, swap those days for embeddings/attention/fine-tuning fundamentals and tell me which companies so I retune.
</div>

<div class="weeks-row" id="weeksRow"></div>

<div id="plan"></div>

<div class="footnote">
  <span id="saveState">Progress saves to this browser.</span>
  <button class="reset" id="resetBtn">Reset progress</button>
</div>

<script>
const PLAN = [
  {
    week:1, tag:"Week 01", title:"Assess · DSA gaps · ramp",
    sub:"Patch the one real hole (graphs), set up the behavioral pipeline, knock the rust off system design.",
    days:[
      {n:1, tag:"Setup + brain-dump", tasks:[
        "Brain-dump 10–12 raw behavioral situations (incident, hard tradeoff, disagreement, mentoring win, ambiguous scope). Don't polish.",
        "Pick / write your <b>system-design framework one-pager</b> and your <b>LLD 5–6 step</b> one-pager.",
        "Warm-up: 1 easy array/string problem to start the streak."
      ]},
      {n:2, tag:"Graphs I", tasks:[
        "Review graph representations, BFS, DFS (recursive + iterative).",
        "Solve: number of islands, clone graph, course-schedule (cycle detect intro)."
      ]},
      {n:3, tag:"Graphs II", tasks:[
        "Topological sort (Kahn's + DFS), cycle detection in directed graphs.",
        "Solve 2 problems (course schedule II, alien dictionary-style ordering)."
      ]},
      {n:4, tag:"Graphs III + union-find", tasks:[
        "Dijkstra / shortest path; intro union-find (path compression + rank).",
        "Solve: network delay time + number of connected components."
      ]},
      {n:5, tag:"Heaps + intervals", tasks:[
        "Heaps / top-K pattern; interval merging & sweep.",
        "Solve: kth largest, merge intervals, meeting rooms II."
      ]},
      {n:6, tag:"System design rep #1", deep:true, tasks:[
        "Pick rate limiter OR URL shortener. Narrate end-to-end, <b>timed + drawing</b>, out loud.",
        "Replay your recording — grade clarifying questions and tradeoff narration, not just the answer."
      ]},
      {n:7, tag:"Binary-search + consolidate", deep:true, tasks:[
        "Binary-search-on-answer pattern; consolidate union-find.",
        "Solve 2–3 problems. Light review of the week's patterns."
      ]}
    ]
  },
  {
    week:2, tag:"Week 02", title:"DSA breadth · SD depth · AI intro",
    sub:"Round out DP/backtracking, narrate two full HLDs, and do your first AI system design.",
    days:[
      {n:8, tag:"DP beyond LCS", tasks:[
        "Knapsack family: 0/1 and unbounded; coin change variants.",
        "Solve 2–3 problems focusing on state definition."
      ]},
      {n:9, tag:"DP on trees + intervals", tasks:[
        "Interval DP (matrix chain / burst balloons) + DP on trees (house robber III).",
        "Solve 2 problems."
      ]},
      {n:10, tag:"Backtracking + tries", tasks:[
        "Backtracking template (subsets, permutations, combination sum); trie build + search.",
        "Solve 2–3 problems."
      ]},
      {n:11, tag:"Monotonic stack + window", tasks:[
        "Monotonic stack (next greater, daily temps); sliding-window consolidation.",
        "Solve 2 problems. Keep a warm-up problem too."
      ]},
      {n:12, tag:"HLD rep #1", deep:true, tasks:[
        "Pick chat/messaging OR news feed. Full narration with capacity estimates + data model.",
        "Lean on what you already know (presence architecture, fan-out). Record + self-grade."
      ]},
      {n:13, tag:"AI SD #1 — RAG Q&A", deep:true, tasks:[
        "Design a RAG Q&A system: chunking, embeddings, vector DB choice (HNSW vs IVF tradeoffs).",
        "Cover retrieval + reranking, caching LLM calls, latency/cost budget, evals & hallucination handling."
      ]},
      {n:14, tag:"LLD rep", tasks:[
        "LRU cache OR thread-safe rate limiter — drive it through your 5–6 step framework.",
        "Explicitly handle concurrency / thread-safety out loud."
      ]}
    ]
  },
  {
    week:3, tag:"Week 03", title:"Mocks · AI deep dives · behavioral",
    sub:"The decisive week. Maximize full-loop reps and turn the brain-dump into tight stories.",
    days:[
      {n:15, tag:"Mock #1 — System design", tasks:[
        "Full timed SD mock (peer or platform), recorded.",
        "Self-grade harshly on communication + clarifying-question habits."
      ]},
      {n:16, tag:"AI SD #2 — LLM chatbot at scale", tasks:[
        "Streaming responses, rate limiting, quota/token budgeting, prompt + version management.",
        "Guardrails & prompt-injection defense; multi-tenant isolation."
      ]},
      {n:17, tag:"Mock #2 — DSA", tasks:[
        "2 mediums under interview time pressure, thinking out loud.",
        "Review where you stalled — pattern recall or implementation?"
      ]},
      {n:18, tag:"AI SD #3 — Semantic search / recs", tasks:[
        "Real-time recommendation or semantic search: embedding pipeline, ANN index, freshness.",
        "Online/offline split, ranking, feedback loop."
      ]},
      {n:19, tag:"Behavioral build", deep:true, tasks:[
        "Convert brain-dump into ~8 tight STAR stories, each covering multiple themes.",
        "Map to company values / leadership principles if applicable. Rehearse 3 out loud."
      ]},
      {n:20, tag:"Mock #3 — Full loop", deep:true, tasks:[
        "Full loop: system design + DSA + behavioral, recorded.",
        "Note the single weakest dimension for Week 4 targeting."
      ]},
      {n:21, tag:"Patch + maintain", tasks:[
        "Patch the weakest area surfaced in mocks.",
        "Light DSA warm-up only — no new patterns today."
      ]}
    ]
  },
  {
    week:4, tag:"Week 04", title:"Patch · company-specific · taper",
    sub:"Close gaps, get specific to the company, then deliberately wind down before the loop.",
    days:[
      {n:22, tag:"HLD rep #2", tasks:[
        "Notification system OR distributed cache — full narration.",
        "Push on a failure mode and a scaling bottleneck you'd normally skip."
      ]},
      {n:23, tag:"AI SD review", tasks:[
        "Re-narrate your weakest AI design from memory, cleanly, in under time.",
        "Tighten the cost/latency and evals story — that's where AI loops probe."
      ]},
      {n:24, tag:"Company-specific", tasks:[
        "Read their engineering blog; learn the stack and recent architecture posts.",
        "Confirm loop format and what each round weights."
      ]},
      {n:25, tag:"Mock #4 — weakest dimension", tasks:[
        "Targeted mock on whatever scored lowest in Week 3.",
        "Recorded; quick self-grade."
      ]},
      {n:26, tag:"Behavioral polish", tasks:[
        "Map stories to the company's specific values; rehearse all ~8 out loud.",
        "Prepare your own thoughtful questions for interviewers."
      ]},
      {n:27, tag:"LLD #2 + maintenance", tasks:[
        "Second LLD rep (parking lot / elevator / rate limiter variant).",
        "A few DSA problems to stay warm."
      ]},
      {n:28, tag:"Full review", tasks:[
        "Re-read framework one-pagers, story bank, and AI SD checklists.",
        "Light warm-up only."
      ]},
      {n:29, tag:"Taper", deep:true, tasks:[
        "1–2 easy warm-up problems. Re-read notes, no new material.",
        "Logistics: environment, IDE, camera/mic, schedule. Rest."
      ]},
      {n:30, tag:"Rest + skim", deep:true, tasks:[
        "Light skim of story bank + frameworks only.",
        "Sleep early. Trust the prep. No cramming."
      ]}
    ]
  }
];

const STORE_KEY = "sd30_prep_v1";
let done = new Set();

function load(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(raw) done = new Set(JSON.parse(raw));
  }catch(e){
    document.getElementById("saveState").textContent =
      "Preview mode — saving works once on your own site/file.";
  }
}
function save(){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify([...done])); }catch(e){}
}

function taskId(w,n,i){ return "w"+w+"d"+n+"t"+i; }

function render(){
  const plan = document.getElementById("plan");
  const row = document.getElementById("weeksRow");
  plan.innerHTML = ""; row.innerHTML = "";

  PLAN.forEach((wk,wi)=>{
    const a = document.createElement("a");
    a.className="chip"; a.href="#week"+wk.week; a.id="chip"+wk.week;
    a.innerHTML = `<div class="wk">${wk.tag}</div><div class="ttl">${wk.title}</div>
      <div class="ct" id="chipct${wk.week}">0/0</div>
      <div class="mini"><i id="chipbar${wk.week}"></i></div>`;
    row.appendChild(a);

    const sec = document.createElement("section");
    sec.className="week"; sec.id="week"+wk.week;
    sec.style.animationDelay = (0.05*wi)+"s";
    sec.innerHTML = `<div class="week-head"><span class="tag">${wk.tag}</span><h2>${wk.title}</h2></div>
      <p class="week-sub">${wk.sub}</p><div class="days" id="days${wk.week}"></div>`;
    plan.appendChild(sec);

    const daysEl = sec.querySelector("#days"+wk.week);
    wk.days.forEach(d=>{
      const card = document.createElement("div");
      card.className = "day" + (d.deep ? " deep":"");
      card.id = "day"+d.n;
      let tasksHtml = "";
      d.tasks.forEach((t,i)=>{
        const id = taskId(wk.week,d.n,i);
        const checked = done.has(id) ? "checked":"";
        tasksHtml += `<label class="task">
          <input type="checkbox" data-id="${id}" ${checked}>
          <span class="box"></span><span class="txt">${t}</span></label>`;
      });
      card.innerHTML = `<div class="day-head">
          <div class="day-no"><span class="n">DAY ${String(d.n).padStart(2,"0")}</span><span class="tag">${d.tag}</span></div>
          ${d.deep?'<span class="badge">deep work</span>':'<span class="check-emoji"></span>'}
        </div>${tasksHtml}`;
      daysEl.appendChild(card);
    });
  });

  document.querySelectorAll('.task input').forEach(cb=>{
    cb.addEventListener("change",()=>{
      const id = cb.dataset.id;
      cb.checked ? done.add(id) : done.delete(id);
      save(); refresh();
    });
  });
  refresh();
}

function refresh(){
  let total=0, doneCt=0, daysCleared=0;
  PLAN.forEach(wk=>{
    let wTot=0, wDone=0;
    wk.days.forEach(d=>{
      let dTot=d.tasks.length, dDone=0;
      d.tasks.forEach((t,i)=>{ if(done.has(taskId(wk.week,d.n,i))) dDone++; });
      total+=dTot; doneCt+=dDone; wTot+=dTot; wDone+=dDone;
      const card=document.getElementById("day"+d.n);
      if(card){
        const complete = dDone===dTot;
        card.classList.toggle("done",complete);
        const em = card.querySelector(".check-emoji");
        if(em) em.textContent = complete ? "✓" : "";
        if(complete) daysCleared++;
      }
    });
    const wp = wTot ? Math.round(wDone/wTot*100):0;
    const bar=document.getElementById("chipbar"+wk.week);
    const ct=document.getElementById("chipct"+wk.week);
    const chip=document.getElementById("chip"+wk.week);
    if(bar) bar.style.width=wp+"%";
    if(ct) ct.textContent=wDone+"/"+wTot+" · "+wp+"%";
    if(chip) chip.classList.toggle("full", wDone===wTot && wTot>0);
  });
  const pct = total ? Math.round(doneCt/total*100):0;
  document.getElementById("pct").textContent=pct;
  document.getElementById("bar").style.width=pct+"%";
  document.getElementById("taskCt").textContent=doneCt+"/"+total;
  document.getElementById("dayCt").textContent=daysCleared+"/30";
}

document.getElementById("resetBtn").addEventListener("click",()=>{
  if(confirm("Reset all progress? This clears every checkbox.")){
    done.clear(); save();
    document.querySelectorAll('.task input').forEach(cb=>cb.checked=false);
    refresh();
  }
});

load();
render();
</script>
</div>
