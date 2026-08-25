# Python 3 — SDE3 Reference

> Pragmatic reference across DSA rounds, internals & trivia, gotchas, performance, production patterns, and mentoring juniors.

<div class="py3-ref">

<div class="py3-tabs" id="py3-tabs">
  <button class="py3-tab active" data-sec="dsa">DSA rounds</button>
  <button class="py3-tab" data-sec="internals">Internals &amp; trivia</button>
  <button class="py3-tab" data-sec="gotchas">Gotchas</button>
  <button class="py3-tab" data-sec="perf">Performance</button>
  <button class="py3-tab" data-sec="patterns">Prod patterns</button>
  <button class="py3-tab" data-sec="mentor">Mentoring</button>
</div>

<!-- ───────────── DSA ───────────── -->
<div class="py3-section active" id="py3-dsa">

<div class="py3-label">Collections &amp; complexity</div>
<div class="py3-grid">

<div class="py3-card">
<div class="py3-title"><span class="badge dsa">DSA</span> list vs deque</div>
<div class="py3-desc"><code>list.pop(0)</code> is O(n). Use <code>collections.deque</code> for O(1) popleft — critical for BFS.</div>

```python
from collections import deque
q = deque([1, 2, 3])
q.appendleft(0)  # O(1)
q.popleft()      # O(1)
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge dsa">DSA</span> heapq — min heap only</div>
<div class="py3-desc">Python only has min-heap. For max-heap, negate values. heappush/heappop are O(log n).</div>

```python
import heapq
h = []
heapq.heappush(h, 3)
heapq.heappush(h, -5)   # max-heap trick
heapq.heapify(lst)      # O(n), in-place
heapq.nlargest(3, lst)  # O(n log k)
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge dsa">DSA</span> defaultdict &amp; Counter</div>

```python
from collections import defaultdict, Counter
freq = Counter("abracadabra")
freq.most_common(2)   # [('a',5),('b',2)]
graph = defaultdict(list)
graph[0].append(1)    # no KeyError
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge dsa">DSA</span> bisect — binary search</div>
<div class="py3-desc">Sorted list ops in O(log n). Interview gold.</div>

```python
import bisect
a = [1, 3, 4, 7]
bisect.bisect_left(a, 4)   # 2
bisect.bisect_right(a, 4)  # 3
bisect.insort(a, 5)        # keeps sorted
```

</div>
</div>

<div class="py3-label">Sorting tricks</div>
<div class="py3-grid">

<div class="py3-card">
<div class="py3-title"><span class="badge dsa">DSA</span> sort stability &amp; key</div>
<div class="py3-desc">Python sort is <strong>Timsort</strong> — stable, O(n log n). Use <code>key=</code> not <code>cmp=</code>.</div>

```python
pairs = [(1,'b'), (2,'a'), (1,'a')]
pairs.sort(key=lambda x: (x[0], x[1]))

# custom comparator
import functools
functools.cmp_to_key(lambda a, b: a - b)
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge dsa">DSA</span> set &amp; frozenset</div>
<div class="py3-desc">O(1) avg lookup. frozenset is hashable — use as dict key or in sets.</div>

```python
seen = set()
seen.add(1); 1 in seen  # O(1)
a & b   # intersection
a | b   # union
a - b   # difference
a ^ b   # symmetric diff
```

</div>
</div>

<div class="py3-label">Iteration patterns</div>
<div class="py3-grid">

<div class="py3-card">
<div class="py3-title"><span class="badge dsa">DSA</span> enumerate &amp; zip</div>

```python
for i, v in enumerate(arr, start=1): ...
for a, b in zip(l1, l2): ...
# zip stops at shortest; use zip_longest
from itertools import zip_longest
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge dsa">DSA</span> itertools essentials</div>

```python
from itertools import (
    combinations, permutations,
    product, accumulate, chain,
    groupby, islice
)
list(combinations('ABC', 2))
list(accumulate([1,2,3]))  # prefix sum
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge dsa">DSA</span> two-pointer / sliding window</div>

```python
l, r = 0, 0
window = defaultdict(int)
while r < len(s):
    window[s[r]] += 1
    while invalid(window):
        window[s[l]] -= 1
        l += 1
    r += 1
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge dsa">DSA</span> sys.setrecursionlimit</div>
<div class="py3-desc">Default is 1000. Deep DFS will hit it. Either raise it or convert to iterative with an explicit stack.</div>

```python
import sys
sys.setrecursionlimit(10**6)

# or better: iterative DFS
stack = [root]
while stack:
    node = stack.pop()
    ...
```

</div>
</div>
</div>

<!-- ───────────── INTERNALS ───────────── -->
<div class="py3-section" id="py3-internals">

<div class="py3-label">Memory model</div>
<div class="py3-grid">

<div class="py3-card">
<div class="py3-title"><span class="badge trivia">Trivia</span> everything is an object</div>
<div class="py3-desc">Integers, functions, classes — all PyObjects on the heap with refcount + type pointer. Small ints (-5 to 256) and interned strings are cached singletons.</div>

```python
a = 256; b = 256
a is b    # True  (cached singleton)
a = 257; b = 257
a is b    # False (new object each time)
id(a) == id(b)  # use == not is for values
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge trivia">Trivia</span> GIL</div>
<div class="py3-desc">Global Interpreter Lock — only one thread runs Python bytecode at a time. IO-bound: use threads. CPU-bound: use multiprocessing or C extensions. Python 3.13+ has experimental no-GIL mode.</div>

```python
from concurrent.futures import (
    ThreadPoolExecutor,   # IO-bound
    ProcessPoolExecutor   # CPU-bound
)
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge trivia">Trivia</span> __slots__</div>
<div class="py3-desc">Classes store instance attrs in a __dict__ by default. __slots__ eliminates the dict, saving ~40–50% memory per instance. Critical at scale.</div>

```python
class Point:
    __slots__ = ('x', 'y')
    def __init__(self, x, y):
        self.x, self.y = x, y
# no __dict__, no arbitrary attrs
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge trivia">Trivia</span> generators &amp; lazy eval</div>
<div class="py3-desc">Generators are resumable functions. They yield one value at a time — O(1) memory vs O(n) for a list comprehension. Essential for streaming large data.</div>

```python
from itertools import islice

def chunked(iterable, n):
    it = iter(iterable)
    while chunk := list(islice(it, n)):
        yield chunk

# generator expression — no allocation
total = sum(x*x for x in range(10**9))
```

</div>
</div>

<div class="py3-label">Type system &amp; data model</div>
<div class="py3-grid">

<div class="py3-card">
<div class="py3-title"><span class="badge trivia">Trivia</span> dunder methods</div>
<div class="py3-desc">The data model — how Python operators map to methods.</div>

```python
__len__    __getitem__  __setitem__
__iter__   __next__     __contains__
__enter__  __exit__     # context manager
__hash__   __eq__       # if eq, must hash
__repr__   __str__      __format__
__call__                # callable object
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge trivia">Trivia</span> MRO — C3 linearisation</div>
<div class="py3-desc">Method Resolution Order for multiple inheritance. Use __mro__ to debug. super() follows MRO, not the parent class directly.</div>

```python
class A: pass
class B(A): pass
class C(A): pass
class D(B, C): pass
D.__mro__  # D → B → C → A → object
# Diamond problem solved
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge trivia">Trivia</span> descriptor protocol</div>
<div class="py3-desc">How @property, @classmethod, @staticmethod work under the hood. Implement __get__/__set__/__delete__ to make your own.</div>

```python
class Validator:
    def __set_name__(self, owner, name):
        self.name = name
    def __set__(self, obj, val):
        if val < 0: raise ValueError
        obj.__dict__[self.name] = val
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge trivia">Trivia</span> walrus operator :=</div>
<div class="py3-desc">Assignment expression (3.8+). Assign and test in one go. Avoids double-calling expensive functions.</div>

```python
# clean while loops
while chunk := f.read(8192):
    process(chunk)

# filter + transform in one pass
results = [y for x in data
           if (y := expensive(x)) > 0]
```

</div>
</div>
</div>

<!-- ───────────── GOTCHAS ───────────── -->
<div class="py3-section" id="py3-gotchas">

<div class="py3-label">Classic interview traps</div>
<div class="py3-grid">

<div class="py3-card">
<div class="py3-title"><span class="badge gotcha">Gotcha</span> mutable default argument</div>
<div class="py3-desc">Default args are evaluated once at definition time, not per call. Shared across all calls — silent mutation bug.</div>

```python
# WRONG
def append(val, lst=[]):
    lst.append(val); return lst

# RIGHT
def append(val, lst=None):
    if lst is None: lst = []
    lst.append(val); return lst
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge gotcha">Gotcha</span> late binding closures</div>
<div class="py3-desc">Closures capture variable by reference, not value. The classic loop lambda trap.</div>

```python
# WRONG — all return 9
fns = [lambda: i for i in range(10)]

# RIGHT — capture by value
fns = [lambda i=i: i for i in range(10)]
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge gotcha">Gotcha</span> == vs is</div>
<div class="py3-desc"><code>is</code> checks identity (same object). <code>==</code> checks equality. Only use <code>is</code> for None, True, False singletons.</div>

```python
x = [1,2,3]; y = [1,2,3]
x == y   # True  (same value)
x is y   # False (different objects)

# correct None check
if val is None: ...
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge gotcha">Gotcha</span> shallow vs deep copy</div>

```python
import copy
a = [[1,2], [3,4]]
b = a[:]              # shallow — inner lists shared
c = a.copy()          # also shallow
d = copy.deepcopy(a)  # fully independent
b[0].append(9)        # mutates a[0] too!
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge gotcha">Gotcha</span> float precision</div>

```python
0.1 + 0.2 == 0.3   # False!
import math
math.isclose(0.1 + 0.2, 0.3)  # True
from decimal import Decimal
Decimal('0.1') + Decimal('0.2')  # exact
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge gotcha">Gotcha</span> dict mutation during iteration</div>
<div class="py3-desc">Dicts are insertion-ordered since 3.7. Never mutate a dict/list while iterating over it.</div>

```python
# safe: iterate a copy
for k in list(d.keys()):
    if condition(k): del d[k]

# or use a comprehension
d = {k: v for k, v in d.items()
     if not condition(k)}
```

</div>
</div>
</div>

<!-- ───────────── PERFORMANCE ───────────── -->
<div class="py3-section" id="py3-perf">

<div class="py3-label">Profile first, optimise second</div>
<div class="py3-grid">

<div class="py3-card">
<div class="py3-title"><span class="badge perf">Perf</span> profiling tools</div>

```python
import timeit
timeit.timeit("'-'.join(map(str,range(100)))", number=10000)

# line profiler (CLI)
# python -m cProfile -s cumtime script.py

from tracemalloc import start, take_snapshot
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge perf">Perf</span> list comp > map > loop</div>
<div class="py3-desc">List comprehensions run in a C loop, faster than explicit for. But generators beat both for large data — no allocation.</div>

```python
# fastest for small-medium
[x*x for x in range(n)]

# fastest for large (lazy)
(x*x for x in range(n))

# string join pattern
''.join([str(x) for x in lst])
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge perf">Perf</span> local var lookup</div>
<div class="py3-desc">Python looks up LEGB (Local → Enclosing → Global → Builtin). Localising a global in hot loops gives ~20% speedup.</div>

```python
def hot_loop(data):
    _append = result.append   # local ref
    _sqrt = math.sqrt         # local ref
    for x in data:
        _append(_sqrt(x))     # faster
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge perf">Perf</span> functools.lru_cache</div>
<div class="py3-desc">Memoisation with one decorator. Use maxsize=None for unbounded. @cache is the 3.9+ alias.</div>

```python
from functools import lru_cache, cache

@cache   # 3.9+ unbounded memo
def fib(n):
    if n < 2: return n
    return fib(n-1) + fib(n-2)

fib.cache_info()  # hits/misses/size
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge perf">Perf</span> numpy / array over lists</div>
<div class="py3-desc">For numerical work, numpy arrays are 10–100× faster — vectorised C ops, no boxing overhead.</div>

```python
import numpy as np
a = np.array([1,2,3], dtype=np.int32)
a * 2        # vectorised, no loop
np.sum(a)    # C speed sum
a[a > 1]     # boolean indexing
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge perf">Perf</span> asyncio for IO-bound work</div>
<div class="py3-desc">asyncio for concurrent IO without threads. Key for services making many external calls.</div>

```python
import asyncio

async def fetch_all(urls):
    async with aiohttp.ClientSession() as s:
        tasks = [fetch(s, u) for u in urls]
        return await asyncio.gather(*tasks)
```

</div>
</div>
</div>

<!-- ───────────── PROD PATTERNS ───────────── -->
<div class="py3-section" id="py3-patterns">

<div class="py3-label">Production-grade Python</div>
<div class="py3-grid">

<div class="py3-card">
<div class="py3-title"><span class="badge prod">Prod</span> dataclasses &amp; pydantic</div>

```python
from dataclasses import dataclass, field

@dataclass(frozen=True)   # immutable
class Config:
    host: str
    port: int = 8080
    tags: list = field(default_factory=list)

# pydantic for runtime validation
from pydantic import BaseModel, validator
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge prod">Prod</span> context managers</div>

```python
from contextlib import contextmanager, suppress

@contextmanager
def timer(label):
    t = time.perf_counter()
    yield
    print(f"{label}: {time.perf_counter()-t:.3f}s")

with suppress(FileNotFoundError):
    os.remove(tmp_file)  # no try/except
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge prod">Prod</span> pathlib over os.path</div>

```python
from pathlib import Path
p = Path("data/input.csv")
p.exists(); p.suffix          # '.csv'
p.parent / "output.csv"       # path join
p.read_text(encoding="utf-8")
list(Path(".").glob("**/*.py"))
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge prod">Prod</span> typing essentials</div>

```python
from typing import (
    Optional, Union, Any,
    TypeVar, Generic, Protocol,
    overload, TypedDict, TYPE_CHECKING
)
# 3.10+: use X | Y instead of Union[X,Y]
def f(x: int | None) -> str: ...
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge prod">Prod</span> exception discipline</div>
<div class="py3-desc">Catch specific exceptions. Never bare <code>except:</code> — silences KeyboardInterrupt and SystemExit.</div>

```python
# WRONG
try: ...
except: ...   # catches everything!

# RIGHT
try: ...
except (ValueError, KeyError) as e:
    logger.error("msg", exc_info=e)
    raise   # re-raise if needed
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge prod">Prod</span> __all__ &amp; module design</div>
<div class="py3-desc">Define __all__ to control public API. Prevents * imports from leaking internals.</div>

```python
__all__ = ['PublicClass', 'public_fn']

# prefix with _ for internal
def _internal_helper(): ...

# __init__.py re-exports
from .module import PublicClass
```

</div>
</div>
</div>

<!-- ───────────── MENTORING ───────────── -->
<div class="py3-section" id="py3-mentor">

<div class="py3-label">Topics juniors consistently get wrong</div>
<div class="py3-grid">

<div class="py3-card">
<div class="py3-title"><span class="badge mentor">Mentor</span> EAFP vs LBYL</div>
<div class="py3-desc">Python prefers EAFP (Easier to Ask Forgiveness) over LBYL (Look Before You Leap). It's faster and more Pythonic.</div>

```python
# LBYL (non-Pythonic)
if key in d and d[key] is not None: ...

# EAFP (Pythonic)
try:
    val = d[key]
except KeyError:
    val = default
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge mentor">Mentor</span> list vs generator — when each</div>
<div class="py3-desc">Use a list if you need: length, indexing, multiple iteration, slicing. Use a generator if you need: one-pass, memory efficiency, streaming, pipeline chaining.</div>

```python
# pipeline — no intermediate lists
result = sum(
    x*x
    for x in filter(lambda n: n%2, data)
    if x > 10
)
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge mentor">Mentor</span> duck typing &amp; protocols</div>
<div class="py3-desc">Don't isinstance-check — check behaviour. Protocol (3.8+) gives structural subtyping without inheritance.</div>

```python
from typing import Protocol

class Drawable(Protocol):
    def draw(self) -> None: ...

# any class with .draw() satisfies
# Drawable — no inheritance needed
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge mentor">Mentor</span> unpacking operators</div>
<div class="py3-desc">* and ** in function calls, assignments, and collections. Juniors underuse these.</div>

```python
a, *rest, last = [1, 2, 3, 4, 5]
merged = {**dict1, **dict2}   # merge dicts
combined = [*list1, *list2]   # merge lists
def f(*args, **kwargs): ...
f(*my_list, **my_dict)
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge mentor">Mentor</span> comprehension readability threshold</div>
<div class="py3-desc">Nested list comprehensions with conditions are hard to review. If it doesn't fit on one clean line, use a loop.</div>

```python
# hard to review
[[f(x) for x in row if p(x)] for row in mat]

# readable
result = []
for row in mat:
    result.append([f(x) for x in row if p(x)])
```

</div>

<div class="py3-card">
<div class="py3-title"><span class="badge mentor">Mentor</span> pytest best practices</div>
<div class="py3-desc">One assert per test. Test behaviour, not implementation. Fixtures over setUp/tearDown. Parametrize for edge cases.</div>

```python
import pytest

@pytest.mark.parametrize("n,expected", [
    (0, 0), (1, 1), (10, 55)
])
def test_fib(n, expected):
    assert fib(n) == expected
```

</div>
</div>

<div class="py3-label">Code review checklist to share with juniors</div>
<div class="py3-card">
<div class="pill-row">
<span class="pill">no bare except</span>
<span class="pill">no mutable defaults</span>
<span class="pill">type hints on public API</span>
<span class="pill">generators for large data</span>
<span class="pill">pathlib not os.path</span>
<span class="pill">f-strings not %</span>
<span class="pill">== not is for values</span>
<span class="pill">context managers for resources</span>
<span class="pill">deepcopy when needed</span>
<span class="pill">log don't print</span>
<span class="pill">docstring on public fns</span>
<span class="pill">no wildcard imports</span>
</div>
</div>
</div>

</div>

<style>
.py3-ref { font-family: var(--md-text-font, sans-serif); }

.py3-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--md-default-fg-color--lightest, #e0e0e0);
  padding-bottom: 0.75rem;
}

.py3-tab {
  font-size: 0.78rem;
  font-weight: 500;
  padding: 5px 14px;
  border-radius: 20px;
  border: 1px solid var(--md-default-fg-color--lighter, #ccc);
  background: transparent;
  color: var(--md-default-fg-color--light, #555);
  cursor: pointer;
  transition: all 0.15s ease;
}

.py3-tab:hover {
  border-color: var(--md-accent-fg-color, #526cfe);
  color: var(--md-accent-fg-color, #526cfe);
}

.py3-tab.active {
  background: var(--md-accent-fg-color, #526cfe);
  border-color: var(--md-accent-fg-color, #526cfe);
  color: var(--md-accent-bg-color, #fff);
}

.py3-section { display: none; }
.py3-section.active { display: block; }

.py3-label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--md-default-fg-color--light, #888);
  margin: 1.5rem 0 0.6rem;
}

.py3-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 10px;
  margin-bottom: 0.5rem;
}

.py3-card {
  background: var(--md-code-bg-color, #f5f5f5);
  border: 1px solid var(--md-default-fg-color--lightest, #e0e0e0);
  border-radius: 8px;
  padding: 0.9rem 1rem;
}

.py3-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--md-default-fg-color, #1a1a1a);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.py3-desc {
  font-size: 0.8rem;
  color: var(--md-default-fg-color--light, #555);
  line-height: 1.55;
  margin-bottom: 6px;
}

.py3-card pre,
.py3-card code {
  font-size: 0.78rem !important;
  margin: 6px 0 0 !important;
}

.badge {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  flex-shrink: 0;
}
.badge.dsa      { background: #ede9fe; color: #5b21b6; }
.badge.trivia   { background: #dbeafe; color: #1e40af; }
.badge.gotcha   { background: #fee2e2; color: #991b1b; }
.badge.perf     { background: #dcfce7; color: #166534; }
.badge.prod     { background: #fef3c7; color: #92400e; }
.badge.mentor   { background: #d1fae5; color: #065f46; }

.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 4px;
}

.pill {
  font-size: 0.75rem;
  padding: 3px 10px;
  border-radius: 12px;
  background: var(--md-default-bg-color, #fff);
  border: 1px solid var(--md-default-fg-color--lighter, #ccc);
  color: var(--md-default-fg-color--light, #555);
  font-family: var(--md-code-font, monospace);
}
</style>

<script>
(function () {
  var tabs = document.getElementById('py3-tabs');
  if (!tabs) return;
  tabs.addEventListener('click', function (e) {
    var btn = e.target.closest('.py3-tab');
    if (!btn) return;
    var sec = btn.dataset.sec;
    document.querySelectorAll('.py3-tab').forEach(function (t) { t.classList.remove('active'); });
    document.querySelectorAll('.py3-section').forEach(function (s) { s.classList.remove('active'); });
    btn.classList.add('active');
    var target = document.getElementById('py3-' + sec);
    if (target) target.classList.add('active');
  });
})();
</script>
