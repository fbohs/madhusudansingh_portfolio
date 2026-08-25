<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Go (Golang) SDE1 Interview Questions</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    min-height: 100vh;
    padding: 2.5rem 1.5rem 4rem;
  }

  .page-header {
    max-width: 760px;
    margin: 0 auto 2.5rem;
  }

  .header-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--mono);
    font-size: 11px;
    color: var(--accent);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .header-eyebrow::before {
    content: '';
    display: inline-block;
    width: 20px;
    height: 1.5px;
    background: var(--accent);
  }

  h1 {
    font-size: 26px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: -0.02em;
    margin-bottom: 8px;
  }

  .header-sub {
    font-size: 14px;
    color: var(--text-muted);
  }

  .header-meta {
    display: flex;
    gap: 16px;
    margin-top: 16px;
    flex-wrap: wrap;
  }

  .meta-pill {
    font-size: 12px;
    font-family: var(--mono);
    padding: 4px 10px;
    border-radius: 4px;
    border: 0.5px solid var(--border);
    color: var(--text-muted);
    background: var(--bg2);
  }

  .container {
    max-width: 760px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .section {
    background: var(--bg2);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 0.5px solid var(--border);
    cursor: pointer;
    user-select: none;
    transition: background 0.15s;
  }

  .section-header:hover { background: var(--bg3); }

  .section-header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .section-icon {
    width: 30px;
    height: 30px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    flex-shrink: 0;
  }

  .section-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
  }

  .section-count {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--text-dim);
    margin-top: 1px;
  }

  .badge {
    font-size: 10px;
    font-family: var(--mono);
    padding: 3px 8px;
    border-radius: 4px;
    letter-spacing: 0.04em;
  }

  .badge-blue   { background: var(--blue-dim);   color: var(--blue);   border: 0.5px solid rgba(79,158,255,0.2); }
  .badge-red    { background: var(--red-dim);    color: var(--red);    border: 0.5px solid rgba(255,107,107,0.2); }
  .badge-green  { background: var(--accent-dim); color: var(--accent); border: 0.5px solid rgba(0,217,163,0.2); }
  .badge-amber  { background: var(--amber-dim);  color: var(--amber);  border: 0.5px solid rgba(245,166,35,0.2); }
  .badge-purple { background: var(--purple-dim); color: var(--purple); border: 0.5px solid rgba(179,136,255,0.2); }

  .chevron {
    width: 16px;
    height: 16px;
    color: var(--text-dim);
    transition: transform 0.2s;
    flex-shrink: 0;
  }

  .section.open .chevron { transform: rotate(180deg); }

  .q-list {
    display: none;
    flex-direction: column;
    padding: 10px 12px 12px;
    gap: 5px;
  }

  .section.open .q-list { display: flex; }

  .q-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    background: var(--bg3);
    border: 0.5px solid var(--border);
    border-radius: var(--radius);
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    text-decoration: none;
  }

  .q-item:hover {
    border-color: var(--border-hover);
    background: rgba(255,255,255,0.03);
  }

  .q-item:hover .q-num { color: var(--accent); }

  .q-num {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--text-dim);
    min-width: 20px;
    padding-top: 2px;
    transition: color 0.15s;
  }

  .q-body { flex: 1; }

  .q-text {
    font-size: 13px;
    color: var(--text);
    line-height: 1.5;
  }

  .q-text code {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--accent);
    background: var(--accent-dim2);
    padding: 1px 5px;
    border-radius: 3px;
  }

  .q-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 6px;
  }

  .q-tag {
    font-family: var(--mono);
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 3px;
    color: var(--text-dim);
    background: rgba(255,255,255,0.04);
    border: 0.5px solid var(--border);
  }

  .q-arrow {
    color: var(--text-dim);
    font-size: 14px;
    padding-top: 2px;
    transition: color 0.15s, transform 0.15s;
  }

  .q-item:hover .q-arrow {
    color: var(--accent);
    transform: translateX(2px);
  }

  .expand-all {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--text-dim);
    background: none;
    border: 0.5px solid var(--border);
    border-radius: 5px;
    padding: 5px 10px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    margin-bottom: 1.25rem;
    display: block;
    margin-left: auto;
  }

  .expand-all:hover { color: var(--accent); border-color: var(--accent); }

  .answer-modal {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    z-index: 100;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    backdrop-filter: blur(4px);
  }

  .answer-modal.open { display: flex; }

  .answer-box {
    background: var(--bg2);
    border: 0.5px solid var(--border-hover);
    border-radius: var(--radius-lg);
    max-width: 640px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    padding: 1.5rem;
    position: relative;
  }

  .answer-q {
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 0.5px solid var(--border);
    line-height: 1.5;
  }

  .answer-content {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.8;
  }

  .answer-content strong { color: var(--text); font-weight: 500; }
  .answer-content code {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--accent);
    background: var(--accent-dim2);
    padding: 1px 5px;
    border-radius: 3px;
  }

  .answer-content ul {
    margin: 8px 0 8px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .answer-close {
    position: absolute;
    top: 12px;
    right: 14px;
    background: none;
    border: none;
    color: var(--text-dim);
    font-size: 20px;
    cursor: pointer;
    line-height: 1;
    transition: color 0.15s;
  }

  .answer-close:hover { color: var(--text); }

  .progress-bar {
    height: 2px;
    background: var(--border);
    border-radius: 2px;
    margin-bottom: 1.5rem;
    max-width: 760px;
    margin-left: auto;
    margin-right: auto;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--blue));
    border-radius: 2px;
    transition: width 0.4s ease;
  }
</style>
</head>
<body>

<div class="page-header">
  <div class="header-eyebrow">Interview prep</div>
  <h1>Go (Golang) — SDE1</h1>
  <p class="header-sub">Must-know questions for a junior Go engineering interview, grouped by topic.</p>
  <div class="header-meta">
    <span class="meta-pill">19 questions</span>
    <span class="meta-pill">5 topics</span>
    <span class="meta-pill">SDE1 level</span>
  </div>
</div>

<div style="max-width:760px; margin: 0 auto;">
  <button class="expand-all" onclick="toggleAll()">expand all</button>
</div>

<div class="container" id="sections"></div>

<div class="answer-modal" id="modal" onclick="closeModal(event)">
  <div class="answer-box">
    <button class="answer-close" onclick="closeModalDirect()">×</button>
    <p class="answer-q" id="modal-q"></p>
    <div class="answer-content" id="modal-a"></div>
  </div>
</div>

<script>
const data = [
  {
    title: "Core language basics",
    icon: "⬡",
    iconBg: "rgba(79,158,255,0.15)",
    badge: "Foundational",
    badgeClass: "badge-blue",
    questions: [
      {
        q: "What is the difference between arrays and slices? How does a slice header work?",
        tags: ["slices", "arrays", "memory"],
        answer: `<strong>Arrays</strong> have a fixed size defined at compile time: <code>[3]int{1,2,3}</code>. They are value types — assigning an array copies all elements.<br><br>
<strong>Slices</strong> are dynamic views over an underlying array. A slice header is a 3-field struct: <code>{pointer, length, capacity}</code>. Assigning a slice copies the header, not the data — both slices share the same backing array.<br><br>
<strong>Key gotcha:</strong> appending to a slice may or may not allocate a new backing array. If <code>len < cap</code>, append reuses the existing array and mutations are visible to the original slice. If <code>len == cap</code>, a new array is allocated. Use <code>copy()</code> or a full-slice expression <code>s[0:len:len]</code> to get an independent slice.`
      },
      {
        q: "How do maps work in Go? What's the zero value for a missing key? Are maps concurrency-safe?",
        tags: ["maps", "zero values", "concurrency"],
        answer: `Maps are hash tables. Accessing a missing key returns the <strong>zero value</strong> for the value type — <code>0</code> for int, <code>""</code> for string, <code>nil</code> for pointers, etc. No panic occurs.<br><br>
Use the two-value form to distinguish a missing key from a zero value: <code>v, ok := m[key]</code>. If <code>ok</code> is false, the key is absent.<br><br>
<strong>Maps are NOT safe for concurrent use.</strong> Concurrent reads are fine, but any concurrent write causes a runtime panic (Go detects this with its built-in race detector). Use <code>sync.RWMutex</code> or <code>sync.Map</code> for concurrent access.`
      },
      {
        q: "What are pointers in Go and when should you use them vs value types?",
        tags: ["pointers", "values", "memory"],
        answer: `A pointer holds the memory address of a value. You get a pointer with <code>&x</code> and dereference with <code>*p</code>. Go has no pointer arithmetic.<br><br>
<strong>Use pointers when:</strong>
<ul>
  <li>The struct is large and copying would be expensive.</li>
  <li>The function needs to mutate the caller's variable.</li>
  <li>You need to represent an optional value (nil pointer = absent).</li>
  <li>Sharing state between goroutines (with proper synchronization).</li>
</ul>
<strong>Use value types when:</strong> the data is small (int, bool, small structs), you want immutability by default, or you're working with types like <code>time.Time</code> that are designed as values.`
      },
      {
        q: "What's the difference between <code>make()</code> and <code>new()</code>?",
        tags: ["make", "new", "allocation"],
        answer: `<code>new(T)</code> allocates zeroed memory for type T and returns a <code>*T</code>. It works for any type but is rarely used explicitly.<br><br>
<code>make(T, args)</code> allocates <strong>and initializes</strong> a slice, map, or channel — the only three types that need internal initialization before use. It returns the type itself (not a pointer).<br><br>
<code>new([]int)</code> returns a pointer to a nil slice — the slice is not usable yet.<br>
<code>make([]int, 5)</code> returns an initialized slice of length 5, ready to use.`
      },
      {
        q: "How do interfaces work in Go? What does implicit satisfaction mean?",
        tags: ["interfaces", "types", "polymorphism"],
        answer: `An interface defines a set of method signatures. A type satisfies an interface automatically if it implements all the methods — there's no <code>implements</code> keyword. This is called <strong>implicit (structural) satisfaction</strong>.<br><br>
Internally, an interface value holds two words: a type pointer and a data pointer. A nil interface has both as nil. A non-nil interface holding a nil pointer is itself non-nil — a common source of bugs.<br><br>
<code>interface{}</code> (or <code>any</code> in Go 1.18+) is the empty interface — every type satisfies it. Used for generic containers before generics, or when the type is truly unknown. Type-assert back out with <code>v.(ConcreteType)</code> or a type switch.`
      }
    ]
  },
  {
    title: "Concurrency",
    icon: "⇄",
    iconBg: "rgba(255,107,107,0.15)",
    badge: "High priority",
    badgeClass: "badge-red",
    questions: [
      {
        q: "What is a goroutine? How does it differ from an OS thread?",
        tags: ["goroutines", "scheduler", "runtime"],
        answer: `A goroutine is a lightweight function execution managed by the Go runtime. You start one with <code>go f()</code>.<br><br>
<strong>vs OS threads:</strong>
<ul>
  <li>Goroutines start with ~2–8 KB stacks (grow dynamically), threads typically start at 1–8 MB.</li>
  <li>Goroutines are multiplexed onto OS threads by the Go scheduler (M:N threading — M goroutines on N OS threads).</li>
  <li>Context switching between goroutines is done in user space — much cheaper than kernel context switches.</li>
  <li>You can have millions of goroutines; tens of thousands of OS threads would exhaust memory.</li>
</ul>
The scheduler uses a work-stealing algorithm and is cooperative+preemptive since Go 1.14.`
      },
      {
        q: "What are channels? Explain buffered vs unbuffered channels.",
        tags: ["channels", "blocking", "communication"],
        answer: `Channels are typed conduits for communication between goroutines. Created with <code>make(chan T)</code>.<br><br>
<strong>Unbuffered channel</strong>: send blocks until a receiver is ready, and receive blocks until a sender is ready. This provides synchronization — the two goroutines rendezvous at the channel.<br><br>
<strong>Buffered channel</strong> (<code>make(chan T, n)</code>): send only blocks when the buffer is full; receive only blocks when the buffer is empty. Allows the sender to proceed without an immediate receiver.<br><br>
<strong>Closing a channel</strong>: signals receivers that no more values will be sent. Receiving from a closed channel returns the zero value immediately. Sending to a closed channel panics. Use <code>v, ok := <-ch</code> to detect closure.`
      },
      {
        q: "What does <code>select</code> do and when would you use it?",
        tags: ["select", "channels", "timeout"],
        answer: `<code>select</code> lets a goroutine wait on multiple channel operations. It picks whichever case is ready; if multiple are ready it chooses one at random.<br><br>
<strong>Common patterns:</strong>
<ul>
  <li><strong>Timeout:</strong> combine a channel receive with <code>time.After(d)</code> to set a deadline.</li>
  <li><strong>Non-blocking receive:</strong> add a <code>default</code> case — executes immediately if no channel is ready.</li>
  <li><strong>Fan-in:</strong> merge multiple input channels into one by selecting across all of them.</li>
  <li><strong>Cancellation:</strong> select on both a work channel and a <code>ctx.Done()</code> channel to respect context cancellation.</li>
</ul>`
      },
      {
        q: "What is a race condition? How do you detect one and how do you prevent it?",
        tags: ["race condition", "mutex", "sync"],
        answer: `A race condition occurs when two goroutines access shared memory concurrently and at least one is writing, without synchronization.<br><br>
<strong>Detection:</strong> run your tests or binary with <code>-race</code>: <code>go test -race ./...</code>. The race detector instruments memory accesses and reports conflicts with stack traces.<br><br>
<strong>Prevention options:</strong>
<ul>
  <li><code>sync.Mutex</code> / <code>sync.RWMutex</code> — protect shared state with a lock.</li>
  <li><strong>Channels</strong> — communicate data ownership between goroutines instead of sharing memory.</li>
  <li><code>sync/atomic</code> — for simple counters and flags without a full mutex.</li>
  <li><code>sync.Map</code> — for concurrent map access.</li>
</ul>
Go's mantra: <em>"Do not communicate by sharing memory; share memory by communicating."</em>`
      },
      {
        q: "What is <code>sync.WaitGroup</code> and how does it work?",
        tags: ["WaitGroup", "sync", "goroutines"],
        answer: `<code>sync.WaitGroup</code> waits for a collection of goroutines to finish. It has three methods:<br><br>
<ul>
  <li><code>wg.Add(n)</code> — increments the counter by n. Call this <em>before</em> launching the goroutine.</li>
  <li><code>wg.Done()</code> — decrements the counter by 1. Typically deferred inside the goroutine.</li>
  <li><code>wg.Wait()</code> — blocks until the counter reaches zero.</li>
</ul>
<strong>Common mistake:</strong> calling <code>Add</code> inside the goroutine itself — the goroutine may not have started before <code>Wait</code> is reached. Always call <code>Add</code> in the launching goroutine.`
      }
    ]
  },
  {
    title: "Error handling & control flow",
    icon: "⚠",
    iconBg: "rgba(0,217,163,0.15)",
    badge: "Core pattern",
    badgeClass: "badge-green",
    questions: [
      {
        q: "How does Go handle errors? Why errors instead of exceptions? How do you wrap/unwrap errors?",
        tags: ["errors", "wrapping", "idiomatic"],
        answer: `Go treats errors as values. Functions return an <code>error</code> as the last return value; callers check it explicitly. There are no try/catch blocks.<br><br>
<strong>Why not exceptions?</strong> Exceptions create hidden control flow, making code harder to reason about. Explicit error returns force the caller to consider failure at each step — aligning with Go's philosophy of clarity.<br><br>
<strong>Wrapping (Go 1.13+):</strong> use <code>fmt.Errorf("context: %w", err)</code> to wrap an error with additional context. The original error is preserved in the chain.<br><br>
<code>errors.Is(err, target)</code> — checks if any error in the chain matches target (by value).<br>
<code>errors.As(err, &target)</code> — checks if any error in the chain can be assigned to target type (for custom error types).`
      },
      {
        q: "Explain <code>defer</code>, <code>panic</code>, and <code>recover</code>. How do they interact?",
        tags: ["defer", "panic", "recover"],
        answer: `<strong>defer</strong> schedules a function call to run when the surrounding function returns (for any reason — normal return, panic, or runtime error). Deferred calls run LIFO.<br><br>
<strong>panic</strong> stops normal execution and unwinds the stack, running deferred functions along the way. If nothing recovers it, the program crashes with a stack trace.<br><br>
<strong>recover</strong> can only be called inside a deferred function. It catches a panic and returns the panic value, allowing the program to continue. After recover, the panicking function does not resume — control returns to whatever called it.<br><br>
<strong>Pattern:</strong> Use panic only for truly unrecoverable programmer errors. For library code, catch panics in a deferred recover and return them as errors to avoid crashing the caller's program.`
      },
      {
        q: "What are common <code>defer</code> gotchas — loops, closures, and named return values?",
        tags: ["defer", "closures", "gotchas"],
        answer: `<strong>1. Defer in a loop:</strong> deferred calls accumulate until the function returns, not until the loop iteration ends. For cleanup inside a loop (e.g., closing files), wrap the body in a helper function or use an IIFE.<br><br>
<strong>2. Argument evaluation:</strong> defer arguments are evaluated immediately when the defer is registered, not when it runs. <code>defer fmt.Println(x)</code> captures the current value of x.<br><br>
<strong>3. Named return values:</strong> a deferred function can read and modify named return values. This is intentional and useful for wrapping errors, but can be surprising: <code>defer func() { err = wrap(err) }()</code> works because the deferred closure captures the named return <code>err</code> by reference.`
      }
    ]
  },
  {
    title: "Memory & runtime",
    icon: "◈",
    iconBg: "rgba(245,166,35,0.15)",
    badge: "Depth check",
    badgeClass: "badge-amber",
    questions: [
      {
        q: "What is escape analysis? When does a variable live on the stack vs heap?",
        tags: ["escape analysis", "stack", "heap"],
        answer: `The Go compiler performs <strong>escape analysis</strong> at compile time to decide where to allocate each variable.<br><br>
<strong>Stack:</strong> fast allocation/deallocation, automatically reclaimed when the function returns. Used when the compiler can prove the variable doesn't outlive its function.<br><br>
<strong>Heap:</strong> managed by the GC. Used when a variable "escapes" — e.g., its address is returned, it's stored in a global, or it's sent over a channel or interface.<br><br>
<strong>Inspect with:</strong> <code>go build -gcflags="-m"</code> prints escape decisions. Reducing heap allocations (especially in hot paths) improves performance and reduces GC pressure.`
      },
      {
        q: "How does Go's garbage collector work at a high level?",
        tags: ["GC", "memory", "runtime"],
        answer: `Go uses a <strong>concurrent, tri-color mark-and-sweep</strong> GC.<br><br>
<ul>
  <li><strong>Mark phase:</strong> starting from roots (globals, stack variables), the GC marks all reachable objects. Most of this work happens concurrently with the running program.</li>
  <li><strong>Sweep phase:</strong> reclaims unmarked (unreachable) memory.</li>
  <li><strong>Write barrier:</strong> during marking, a write barrier ensures that any new pointers created by the mutator (your code) are also tracked.</li>
</ul>
<strong>Stop-the-world (STW) pauses</strong> exist but are very short (sub-millisecond in modern Go) — used to start/stop the mark phase. Go 1.14+ also introduced asynchronous preemption for goroutines, further reducing latency.`
      },
      {
        q: "What is a closure and what is the classic loop-variable capture bug?",
        tags: ["closures", "bugs", "loops"],
        answer: `A closure is a function that captures variables from its enclosing scope by reference, not by value.<br><br>
<strong>Classic bug (pre-Go 1.22):</strong>
<code style="display:block; margin:8px 0; padding:8px; background:rgba(255,255,255,0.04); border-radius:4px; line-height:1.6;">
for _, v := range items {<br>
&nbsp;&nbsp;go func() { fmt.Println(v) }() // all goroutines print last value<br>
}
</code>
All goroutines capture the same loop variable <code>v</code>, which by the time they run holds the final value.<br><br>
<strong>Fix (pre-1.22):</strong> shadow the variable: <code>v := v</code> inside the loop, or pass it as an argument: <code>go func(v T) {...}(v)</code>.<br><br>
<strong>Go 1.22+:</strong> loop variables are now per-iteration by default — the bug no longer exists in new code.`
      }
    ]
  },
  {
    title: "Packages, modules & tooling",
    icon: "⊞",
    iconBg: "rgba(179,136,255,0.15)",
    badge: "Practical",
    badgeClass: "badge-purple",
    questions: [
      {
        q: "How does Go modules work? What are <code>go.mod</code> and <code>go.sum</code>?",
        tags: ["modules", "go.mod", "dependencies"],
        answer: `Go modules (introduced in 1.11, default since 1.16) are the standard dependency management system.<br><br>
<strong>go.mod</strong> declares your module's path, the minimum Go version, and all direct and indirect dependencies with their required minimum versions. Go uses <strong>Minimum Version Selection (MVS)</strong> — it picks the minimum version that satisfies all requirements, making builds reproducible without a lock file per se.<br><br>
<strong>go.sum</strong> records the cryptographic hashes of specific module versions. Go verifies downloads against this file to detect tampering.<br><br>
<strong>Key commands:</strong> <code>go get pkg@version</code> to add/update, <code>go mod tidy</code> to remove unused deps and update go.sum, <code>go mod vendor</code> to snapshot deps locally.`
      },
      {
        q: "How do you write tests in Go? What is table-driven testing?",
        tags: ["testing", "table-driven", "go test"],
        answer: `Test files end in <code>_test.go</code> and are excluded from production builds. Test functions take <code>t *testing.T</code>.<br><br>
Run tests with <code>go test ./...</code>. Add <code>-v</code> for verbose output, <code>-run TestName</code> to filter, <code>-bench</code> for benchmarks.<br><br>
<strong>Table-driven tests</strong> are the idiomatic Go pattern: define a slice of test cases (input + expected output), then loop over them calling <code>t.Run()</code> for each. This keeps test logic in one place and makes adding cases trivial:
<code style="display:block; margin:8px 0; padding:8px; background:rgba(255,255,255,0.04); border-radius:4px; line-height:1.6;">
tests := []struct{ input, want string }{...}<br>
for _, tc := range tests {<br>
&nbsp;&nbsp;t.Run(tc.input, func(t *testing.T) {<br>
&nbsp;&nbsp;&nbsp;&nbsp;got := fn(tc.input)<br>
&nbsp;&nbsp;&nbsp;&nbsp;if got != tc.want { t.Errorf(...) }<br>
&nbsp;&nbsp;})<br>
}
</code>`
      },
      {
        q: "What is <code>init()</code> and what order do init functions run in?",
        tags: ["init", "packages", "startup"],
        answer: `<code>init()</code> is a special function that runs automatically before <code>main()</code>. A package can have multiple <code>init()</code> functions, even in the same file.<br><br>
<strong>Execution order:</strong>
<ul>
  <li>Package-level variables are initialized first, in the order they appear (with dependency resolution).</li>
  <li>Then <code>init()</code> functions run in the order they appear in source files (files in lexicographic order).</li>
  <li>All <code>init()</code> functions of imported packages run before those of the importing package.</li>
</ul>
<strong>Use sparingly.</strong> <code>init()</code> makes initialization order implicit and hard to test. Prefer explicit initialization in <code>main()</code> or constructor functions.`
      }
    ]
  }
];

let allOpen = false;

function toggleAll() {
  allOpen = !allOpen;
  document.querySelectorAll('.section').forEach(s => {
    if (allOpen) s.classList.add('open');
    else s.classList.remove('open');
  });
  document.querySelector('.expand-all').textContent = allOpen ? 'collapse all' : 'expand all';
}

function toggleSection(el) {
  el.closest('.section').classList.toggle('open');
}

function openQuestion(q, a) {
  document.getElementById('modal-q').innerHTML = q;
  document.getElementById('modal-a').innerHTML = a;
  document.getElementById('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(e) {
  if (e.target === document.getElementById('modal')) closeModalDirect();
}

function closeModalDirect() {
  document.getElementById('modal').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModalDirect(); });

const container = document.getElementById('sections');
let qNum = 1;

data.forEach(section => {
  const sec = document.createElement('div');
  sec.className = 'section';

  const total = section.questions.length;
  sec.innerHTML = `
    <div class="section-header" onclick="toggleSection(this)">
      <div class="section-header-left">
        <div class="section-icon" style="background:${section.iconBg}">${section.icon}</div>
        <div>
          <div class="section-title">${section.title}</div>
          <div class="section-count">${total} question${total > 1 ? 's' : ''}</div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <span class="badge ${section.badgeClass}">${section.badge}</span>
        <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>
    <div class="q-list"></div>
  `;

  const qList = sec.querySelector('.q-list');
  section.questions.forEach(item => {
    const div = document.createElement('div');
    div.className = 'q-item';
    div.onclick = () => openQuestion(item.q, item.answer);
    div.innerHTML = `
      <span class="q-num">${String(qNum).padStart(2,'0')}</span>
      <div class="q-body">
        <div class="q-text">${item.q}</div>
        <div class="q-tags">${item.tags.map(t => `<span class="q-tag">${t}</span>`).join('')}</div>
      </div>
      <span class="q-arrow">›</span>
    `;
    qList.appendChild(div);
    qNum++;
  });

  container.appendChild(sec);
});
</script>
</body>
</html>
