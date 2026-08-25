# Python DSA — Interview & Competition Reference

> Data structures, patterns, graphs, DP, and competition tricks. Companion to the SDE3 reference.

<div class="dsa-ref">

<div class="dsa-tabs" id="dsa-tabs">
  <button class="dsa-tab active" data-sec="ds">Data structures</button>
  <button class="dsa-tab" data-sec="patterns">Patterns</button>
  <button class="dsa-tab" data-sec="graph">Graphs &amp; trees</button>
  <button class="dsa-tab" data-sec="dp">DP</button>
  <button class="dsa-tab" data-sec="tricks">Python tricks</button>
  <button class="dsa-tab" data-sec="complexity">Complexity ref</button>
</div>

<!-- ───────────── DATA STRUCTURES ───────────── -->
<div class="dsa-section active" id="dsa-ds">

<div class="dsa-label">Core built-ins</div>
<div class="dsa-grid">

<div class="dsa-card">
<div class="dsa-title"><span class="badge ds">DS</span> list — dynamic array</div>
<div class="dsa-desc">Use as a stack. Never use <code>list.pop(0)</code> or <code>list.insert(0,x)</code> for queue ops — both are O(n).</div>

```python
a = [1, 2, 3]
a.append(4)       # O(1) amortized
a.pop()           # O(1) — end only
a.pop(0)          # O(n) — don't use as queue!
a.insert(i, x)    # O(n)
a[i:j]            # O(k) slice

import bisect
bisect.bisect_left(a, x)    # O(log n) — sorted list only
bisect.insort(a, x)         # insert and keep sorted
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge ds">DS</span> collections.deque</div>
<div class="dsa-desc">O(1) on both ends. Always use for BFS queues. <code>maxlen</code> makes a circular buffer — useful for sliding window eviction.</div>

```python
from collections import deque
dq = deque([1, 2, 3])
dq.append(4)         # right O(1)
dq.appendleft(0)     # left  O(1)
dq.pop()             # right O(1)
dq.popleft()         # left  O(1)
dq.rotate(k)         # rotate right by k

# Fixed-size sliding window — auto-evicts oldest
dq = deque(maxlen=k)
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge ds">DS</span> dict &amp; Counter</div>
<div class="dsa-desc">Hash map backbone. <code>defaultdict</code> avoids KeyError on missing keys. <code>Counter</code> arithmetic is interview gold.</div>

```python
from collections import defaultdict, Counter

dd = defaultdict(list)
dd['a'].append(1)           # no KeyError

c = Counter("abracadabra")
c.most_common(3)            # top 3 by freq
c1 + c2                     # merge (sum counts)
c1 - c2                     # subtract (drops ≤0)
c1 & c2                     # intersection (min)
c1 | c2                     # union (max)

d.get(k, default)
d.setdefault(k, []).append(v)
{v: k for k, v in d.items()} # invert
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge ds">DS</span> heapq — min-heap</div>
<div class="dsa-desc">Python only has min-heap. Negate values for max-heap. Use tuple heaps <code>(priority, item)</code> for tie-breaking.</div>

```python
import heapq
h = []
heapq.heappush(h, x)         # O(log n)
heapq.heappop(h)              # O(log n) — min
heapq.heappushpop(h, x)      # push then pop, faster
heapq.heapify(lst)            # O(n) in-place
heapq.nlargest(k, arr)        # O(n log k)
heapq.nsmallest(k, arr)

# Max-heap: negate
heapq.heappush(h, -x)
max_val = -heapq.heappop(h)

# Tuple heap — sorted by first element
heapq.heappush(h, (priority, item))
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge ds">DS</span> set &amp; frozenset</div>
<div class="dsa-desc">O(1) avg membership. <code>frozenset</code> is hashable — use it as a dict key or store it in a set (e.g. visited states in BFS).</div>

```python
s = {1, 2, 3}
s.add(4)           # O(1)
s.discard(x)       # no error if missing
x in s             # O(1)

s1 | s2            # union
s1 & s2            # intersection
s1 - s2            # difference
s1 ^ s2            # symmetric difference

# frozenset as hashable key
visited = set()
visited.add(frozenset([1, 2]))
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge ds">DS</span> SortedList (sortedcontainers)</div>
<div class="dsa-desc">Sorted order + O(log n) insert/delete. Not built-in but available on LeetCode and most OJs. Use when you need k-th smallest or range count queries.</div>

```python
from sortedcontainers import SortedList
sl = SortedList([3, 1, 4, 1, 5])
sl.add(2)              # O(log n)
sl.discard(1)          # O(log n)
sl.bisect_left(x)      # O(log n) index
sl[i]                  # O(log n)
sl[i:j]                # O(k) slice

# Count elements in range [a, b]
sl.bisect_right(b) - sl.bisect_left(a)
```

</div>

</div>

<div class="dsa-label">Stack-based structures</div>
<div class="dsa-grid">

<div class="dsa-card">
<div class="dsa-title"><span class="badge ds">DS</span> monotonic stack</div>
<div class="dsa-desc">Signal: "next/prev greater/smaller", daily temperatures, histogram area. Maintain invariant (increasing or decreasing) by popping on violation.</div>

```python
def next_greater(arr):
    n = len(arr)
    res = [-1] * n
    stack = []          # indices, values decreasing
    for i in range(n):
        while stack and arr[stack[-1]] < arr[i]:
            res[stack.pop()] = arr[i]
        stack.append(i)
    return res

# prev_smaller: iterate left, maintain increasing stack
# Largest rectangle in histogram → mono stack O(n)
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge ds">DS</span> min-stack</div>
<div class="dsa-desc">O(1) get_min alongside normal push/pop. Shadow stack tracks running minimum at each depth.</div>

```python
class MinStack:
    def __init__(self):
        self.stack = []
        self.min_stack = []

    def push(self, val):
        self.stack.append(val)
        m = min(val, self.min_stack[-1]
                if self.min_stack else val)
        self.min_stack.append(m)

    def pop(self):
        self.stack.pop()
        self.min_stack.pop()

    def get_min(self):
        return self.min_stack[-1]
```

</div>

</div>
</div>

<!-- ───────────── PATTERNS ───────────── -->
<div class="dsa-section" id="dsa-patterns">

<div class="dsa-label">Foundational two-pointer &amp; window</div>
<div class="dsa-grid">

<div class="dsa-card">
<div class="dsa-title"><span class="badge pat">Pattern</span> two pointers</div>
<div class="dsa-desc">Sorted array pair sums, container with most water, in-place reversal, palindrome check. Requires sorted input or specific structure.</div>

```python
def two_sum_sorted(arr, target):
    l, r = 0, len(arr) - 1
    while l < r:
        s = arr[l] + arr[r]
        if s == target:   return [l, r]
        elif s < target:  l += 1
        else:             r -= 1
    return []
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge pat">Pattern</span> sliding window</div>
<div class="dsa-desc">Variable window: shrink when constraint violated. Fixed window: advance l and r together. Use <code>deque</code> for sliding window max/min.</div>

```python
def longest_no_repeat(s):
    char_idx = {}
    l, res = 0, 0
    for r, c in enumerate(s):
        if c in char_idx and char_idx[c] >= l:
            l = char_idx[c] + 1
        char_idx[c] = r
        res = max(res, r - l + 1)
    return res
```

</div>

</div>

<div class="dsa-label">Search &amp; range</div>
<div class="dsa-grid">

<div class="dsa-card">
<div class="dsa-title"><span class="badge pat">Pattern</span> binary search on answer</div>
<div class="dsa-desc">"Minimum X such that condition(X) is true." The search space is the answer domain, not the array index.</div>

```python
def binary_search_answer(lo, hi):
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            hi = mid        # search left (minimize)
        else:
            lo = mid + 1
    return lo
# For maximize: flip condition — use lo = mid
# hi = lo + 1 for half-open interval variants
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge pat">Pattern</span> prefix sum &amp; difference array</div>
<div class="dsa-desc">Range sum in O(1). Subarray sum = k via prefix + hash map. Difference array gives O(1) range updates.</div>

```python
from collections import defaultdict
from itertools import accumulate

def subarray_sum_k(nums, k):
    count, prefix = 0, 0
    seen = defaultdict(int)
    seen[0] = 1
    for n in nums:
        prefix += n
        count += seen[prefix - k]
        seen[prefix] += 1
    return count

# Range update in O(1) with difference array
diff = [0] * (n + 1)
diff[l] += val; diff[r + 1] -= val
result = list(accumulate(diff))
```

</div>

</div>

<div class="dsa-label">Linked list &amp; cycle</div>
<div class="dsa-grid">

<div class="dsa-card">
<div class="dsa-title"><span class="badge pat">Pattern</span> fast &amp; slow pointers</div>
<div class="dsa-desc">Floyd's cycle detection. Also: middle of list (slow stops at mid), happy number. When slow meets fast, reset slow to head to find cycle entry.</div>

```python
def detect_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            slow = head        # find entry point
            while slow != fast:
                slow = slow.next
                fast = fast.next
            return slow        # cycle start
    return None
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge pat">Pattern</span> backtracking template</div>
<div class="dsa-desc">Permutations, combinations, subsets, N-Queens, Sudoku. Always copy path on solution. Prune early — return when path can't lead to solution.</div>

```python
def backtrack(path, choices, result):
    if is_solution(path):
        result.append(path[:])   # copy!
        return
    for i, choice in enumerate(choices):
        if not is_valid(path, choice):
            continue
        path.append(choice)              # choose
        backtrack(path, choices[i+1:], result)
        path.pop()                       # unchoose

# Subsets: pass start index, not choices[i+1:]
# Permutations: pass remaining unused set
```

</div>

</div>

<div class="dsa-label">Graph primitives</div>
<div class="dsa-grid">

<div class="dsa-card">
<div class="dsa-title"><span class="badge pat">Pattern</span> Union-Find (DSU)</div>
<div class="dsa-desc">Connected components, cycle detection, Kruskal's MST. Path compression + union by rank gives near-O(1) per op.</div>

```python
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px == py: return False    # already connected
        if self.rank[px] < self.rank[py]: px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]: self.rank[px] += 1
        return True
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge pat">Pattern</span> intervals</div>
<div class="dsa-desc">Sort by start. Merge when <code>start ≤ prev_end</code>. Meeting rooms II: min-heap of end times — pop if next start ≥ heap[0], else push.</div>

```python
def merge_intervals(intervals):
    intervals.sort()
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged

# Meeting rooms II
import heapq
def min_rooms(intervals):
    intervals.sort()
    heap = []
    for start, end in intervals:
        if heap and start >= heap[0]:
            heapq.heapreplace(heap, end)
        else:
            heapq.heappush(heap, end)
    return len(heap)
```

</div>

</div>
</div>

<!-- ───────────── GRAPHS & TREES ───────────── -->
<div class="dsa-section" id="dsa-graph">

<div class="dsa-label">Tree traversals</div>
<div class="dsa-grid">

<div class="dsa-card">
<div class="dsa-title"><span class="badge graph">Graph</span> inorder — iterative</div>
<div class="dsa-desc">Safe for deep trees — no recursion limit risk. Same pattern adapts to preorder (process before pushing left) and postorder.</div>

```python
def inorder(root):
    res, stack = [], []
    cur = root
    while cur or stack:
        while cur:
            stack.append(cur)
            cur = cur.left
        cur = stack.pop()
        res.append(cur.val)
        cur = cur.right
    return res
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge graph">Graph</span> level-order BFS</div>
<div class="dsa-desc">Snapshot <code>len(q)</code> at the start of each level — this is the "process one level at a time" trick that makes level separation clean.</div>

```python
from collections import deque

def level_order(root):
    if not root: return []
    q = deque([root])
    res = []
    while q:
        level = []
        for _ in range(len(q)):      # snapshot this level
            node = q.popleft()
            level.append(node.val)
            if node.left:  q.append(node.left)
            if node.right: q.append(node.right)
        res.append(level)
    return res
```

</div>

</div>

<div class="dsa-label">Graph traversal</div>
<div class="dsa-grid">

<div class="dsa-card">
<div class="dsa-title"><span class="badge graph">Graph</span> BFS — shortest path</div>
<div class="dsa-desc">Unweighted shortest path. Always mark visited before enqueuing, not after dequeuing — avoids re-adding the same node.</div>

```python
from collections import defaultdict, deque

def bfs(start, end, graph):
    q = deque([(start, 0)])
    visited = {start}
    while q:
        node, dist = q.popleft()
        if node == end: return dist
        for nei in graph[node]:
            if nei not in visited:
                visited.add(nei)    # mark before enqueue
                q.append((nei, dist + 1))
    return -1
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge graph">Graph</span> DFS — iterative</div>
<div class="dsa-desc">Convert recursive DFS to iterative to avoid hitting Python's 1000 recursion limit on deep graphs.</div>

```python
def dfs(start, graph):
    stack = [start]
    visited = {start}
    while stack:
        node = stack.pop()
        for nei in graph[node]:
            if nei not in visited:
                visited.add(nei)
                stack.append(nei)

# Build adjacency list
from collections import defaultdict
graph = defaultdict(list)
for u, v in edges:
    graph[u].append(v)
    graph[v].append(u)   # undirected
```

</div>

</div>

<div class="dsa-label">Shortest paths</div>
<div class="dsa-grid">

<div class="dsa-card">
<div class="dsa-title"><span class="badge graph">Graph</span> Dijkstra</div>
<div class="dsa-desc">Weighted graph, non-negative edges. Stale entry check (<code>if d > dist[u]: continue</code>) is essential — without it, you reprocess old heap entries.</div>

```python
import heapq
from collections import defaultdict

def dijkstra(n, edges, src):
    graph = defaultdict(list)
    for u, v, w in edges:
        graph[u].append((w, v))
    dist = [float('inf')] * n
    dist[src] = 0
    heap = [(0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]: continue       # stale — skip
        for w, v in graph[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                heapq.heappush(heap, (dist[v], v))
    return dist
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge graph">Graph</span> Bellman-Ford</div>
<div class="dsa-desc">Handles negative edges. Relax all edges n-1 times. An n-th relaxation that still updates → negative cycle exists.</div>

```python
def bellman_ford(n, edges, src):
    dist = [float('inf')] * n
    dist[src] = 0
    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
    # n-th pass: negative cycle detection
    for u, v, w in edges:
        if dist[u] + w < dist[v]:
            return None   # negative cycle
    return dist
```

</div>

</div>

<div class="dsa-label">Ordering &amp; connectivity</div>
<div class="dsa-grid">

<div class="dsa-card">
<div class="dsa-title"><span class="badge graph">Graph</span> topological sort (Kahn's)</div>
<div class="dsa-desc">BFS-based topo sort. If output length &lt; n, a cycle exists. Course schedule, build order, task dependency problems.</div>

```python
def topo_sort(n, prerequisites):
    graph = defaultdict(list)
    indegree = [0] * n
    for u, v in prerequisites:
        graph[v].append(u)
        indegree[u] += 1
    q = deque(i for i in range(n) if indegree[i] == 0)
    order = []
    while q:
        node = q.popleft()
        order.append(node)
        for nei in graph[node]:
            indegree[nei] -= 1
            if indegree[nei] == 0:
                q.append(nei)
    return order if len(order) == n else []  # [] = cycle
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge graph">Graph</span> Trie</div>
<div class="dsa-desc">Prefix tree for string search, autocomplete, word dictionary. <code>starts_with</code> is O(len(prefix)) — much faster than a hash set for prefix queries.</div>

```python
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for c in word:
            node = node.children.setdefault(c, TrieNode())
        node.is_end = True

    def search(self, word):
        node = self.root
        for c in word:
            if c not in node.children: return False
            node = node.children[c]
        return node.is_end

    def starts_with(self, prefix):
        node = self.root
        for c in prefix:
            if c not in node.children: return False
            node = node.children[c]
        return True
```

</div>

</div>
</div>

<!-- ───────────── DP ───────────── -->
<div class="dsa-section" id="dsa-dp">

<div class="dsa-label">Approach checklist</div>
<div class="dsa-card dsa-checklist">
<div class="pill-row">
<span class="pill">1. identify state</span>
<span class="pill">2. define dp[i] in English</span>
<span class="pill">3. write recurrence</span>
<span class="pill">4. base case + iteration order</span>
<span class="pill">5. space optimize?</span>
</div>
</div>

<div class="dsa-label">Classic patterns</div>
<div class="dsa-grid">

<div class="dsa-card">
<div class="dsa-title"><span class="badge dp">DP</span> 1D — Fibonacci family</div>
<div class="dsa-desc">Climbing stairs, min cost climbing, house robber. Reduce to two variables once you recognise only adjacent states matter.</div>

```python
# dp[i] = dp[i-1] + dp[i-2]
prev2, prev1 = 1, 1
for i in range(2, n + 1):
    prev2, prev1 = prev1, prev1 + prev2

# House robber variant: max(dp[i-1], dp[i-2] + val)
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge dp">DP</span> LIS — O(n log n)</div>
<div class="dsa-desc">Patience sorting. <code>sub</code> is not the actual LIS — only its length is correct. Use parent tracking to reconstruct the sequence.</div>

```python
import bisect

def lis(nums):
    sub = []
    for x in nums:
        pos = bisect.bisect_left(sub, x)
        if pos == len(sub):
            sub.append(x)
        else:
            sub[pos] = x     # replace to keep sub minimal
    return len(sub)
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge dp">DP</span> 0/1 knapsack</div>
<div class="dsa-desc">Reverse inner loop — ensures each item is used at most once. Forward loop = unbounded knapsack (items reusable).</div>

```python
def knapsack(weights, values, cap):
    dp = [0] * (cap + 1)
    for w, v in zip(weights, values):
        for c in range(cap, w - 1, -1):  # reverse = each item once
            dp[c] = max(dp[c], dp[c - w] + v)
    return dp[cap]
# forward range(w, cap+1) → unbounded (coin change)
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge dp">DP</span> LCS — 2D</div>
<div class="dsa-desc">Longest Common Subsequence. Basis for edit distance, diff algorithms. Space-optimizable to O(min(m,n)) using two rows.</div>

```python
def lcs(s, t):
    m, n = len(s), len(t)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s[i-1] == t[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    return dp[m][n]
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge dp">DP</span> interval DP</div>
<div class="dsa-desc">Matrix chain multiplication, burst balloons, stone merge. Always iterate by increasing window length, split at every k in [i, j).</div>

```python
dp = [[0] * n for _ in range(n)]
for length in range(2, n + 1):
    for i in range(n - length + 1):
        j = i + length - 1
        dp[i][j] = float('inf')
        for k in range(i, j):         # split point
            dp[i][j] = min(
                dp[i][j],
                dp[i][k] + dp[k+1][j] + cost(i, k, j)
            )
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge dp">DP</span> bitmask DP</div>
<div class="dsa-desc">TSP, assignment problems, covering all subsets. Feasible up to n ≈ 20–22. State: which items visited + current position.</div>

```python
def tsp(dist, n):
    full = (1 << n) - 1
    dp = [[float('inf')] * n for _ in range(1 << n)]
    dp[1][0] = 0
    for mask in range(1 << n):
        for u in range(n):
            if not (mask >> u & 1): continue
            for v in range(n):
                if mask >> v & 1: continue
                nmask = mask | (1 << v)
                dp[nmask][v] = min(dp[nmask][v],
                                   dp[mask][u] + dist[u][v])
    return min(dp[full][i] + dist[i][0] for i in range(1, n))
```

</div>

</div>

<div class="dsa-label">Memoization</div>
<div class="dsa-grid">

<div class="dsa-card">
<div class="dsa-title"><span class="badge dp">DP</span> @cache / @lru_cache</div>
<div class="dsa-desc">One decorator turns recursion into top-down DP. Args must be hashable — convert lists to tuples. Clear between test cases in competitions.</div>

```python
from functools import cache, lru_cache

@cache                        # Python 3.9+ — unbounded
def fib(n):
    if n < 2: return n
    return fib(n-1) + fib(n-2)

fib.cache_clear()             # reset between test cases
fib.cache_info()              # hits / misses / currsize

# Args must be hashable — wrap mutable state
@cache
def solve(mask: int, pos: int) -> int: ...

# Convert list to tuple when needed
dp(tuple(arr), target)
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge dp">DP</span> top-down vs bottom-up</div>
<div class="dsa-desc">Both are equivalent. Top-down is easier to write; bottom-up avoids recursion overhead and is easier to space-optimize. Prefer bottom-up for space reduction.</div>

```python
# Top-down: let @cache handle it
@cache
def dp(i, j): ...

# Bottom-up: explicit iteration order
# Space optimize: if dp[i] only needs dp[i-1]
# → replace 2D table with two 1D arrays

prev = [0] * (n + 1)
curr = [0] * (n + 1)
for i in range(1, m + 1):
    for j in range(1, n + 1):
        curr[j] = ...
    prev, curr = curr, [0] * (n + 1)
```

</div>

</div>
</div>

<!-- ───────────── PYTHON TRICKS ───────────── -->
<div class="dsa-section" id="dsa-tricks">

<div class="dsa-label">itertools essentials</div>
<div class="dsa-grid">

<div class="dsa-card">
<div class="dsa-title"><span class="badge trick">Trick</span> itertools for DSA</div>

```python
from itertools import (
    accumulate,                    # prefix sums, running max
    combinations,                  # C(n,r) no repeat
    combinations_with_replacement,
    permutations,                  # P(n,r)
    product,                       # cartesian product
    chain,                         # flatten iterables
    pairwise,                      # adjacent pairs (3.10+)
)

list(accumulate(arr))              # prefix sums
list(accumulate(arr, max))         # running max
list(accumulate(arr, lambda a,b: a*b))  # prefix product

list(combinations(arr, k))         # all size-k subsets
list(product([-1,0,1], repeat=2))  # all (dr,dc) grid dirs
dirs = [(0,1),(0,-1),(1,0),(-1,0)] # 4-directional
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge trick">Trick</span> sorting power moves</div>

```python
# Multi-key sort
arr.sort(key=lambda x: (x[1], -x[0]))

# Strings by length then lex
words.sort(key=lambda w: (len(w), w))

# Custom comparator — "largest number" problem
from functools import cmp_to_key
def cmp(a, b):
    if a + b > b + a: return -1  # a before b
    return 1
strs.sort(key=cmp_to_key(cmp))

# Coordinate compression
sv = sorted(set(arr))
rank = {v: i for i, v in enumerate(sv)}
compressed = [rank[x] for x in arr]
```

</div>

</div>

<div class="dsa-label">Array / matrix tricks</div>
<div class="dsa-grid">

<div class="dsa-card">
<div class="dsa-title"><span class="badge trick">Trick</span> matrix operations</div>

```python
# Transpose
transposed = [list(r) for r in zip(*matrix)]

# Rotate 90° clockwise
rotated = [list(r) for r in zip(*matrix[::-1])]

# Rotate 90° counter-clockwise
rotated = [list(r) for r in zip(*matrix)][::-1]

# Flatten 2D
flat = [x for row in matrix for x in row]

# Deep copy 2D (faster than copy.deepcopy)
copy = [row[:] for row in matrix]
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge trick">Trick</span> string tricks</div>

```python
# Anagram check
Counter(s) == Counter(t)
sorted(s) == sorted(t)    # O(n log n) — slower

# All char frequencies (lowercase only)
freq = [0] * 26
for c in s:
    freq[ord(c) - ord('a')] += 1

# Palindrome
s == s[::-1]

# All substrings
for i in range(len(s)):
    for j in range(i+1, len(s)+1):
        sub = s[i:j]

# Split and rejoin
' '.join(reversed(s.split()))
```

</div>

</div>

<div class="dsa-label">Number theory</div>
<div class="dsa-grid">

<div class="dsa-card">
<div class="dsa-title"><span class="badge trick">Trick</span> math essentials</div>

```python
import math

math.gcd(a, b)            # Euclidean GCD
math.lcm(a, b)            # Python 3.9+
pow(base, exp, mod)       # fast modular exp O(log n)

# Modular inverse (prime modulus only)
inv = pow(a, MOD - 2, MOD)   # Fermat's little theorem

# Sieve of Eratosthenes
def sieve(n):
    is_prime = [True] * (n + 1)
    is_prime[0] = is_prime[1] = False
    for i in range(2, int(n**0.5) + 1):
        if is_prime[i]:
            for j in range(i*i, n+1, i):
                is_prime[j] = False
    return [i for i, p in enumerate(is_prime) if p]
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge trick">Trick</span> bit manipulation</div>

```python
bin(n).count('1')     # popcount
n.bit_count()         # Python 3.10+
n & (n - 1)           # clear lowest set bit
n & (-n)              # isolate lowest set bit
n ^ n                 # = 0 (XOR with itself)
a ^ b ^ a             # = b (XOR trick for missing number)

# Check k-th bit
n >> k & 1

# Set k-th bit
n | (1 << k)

# Enumerate all subsets of a bitmask
sub = mask
while sub:
    process(sub)
    sub = (sub - 1) & mask
```

</div>

</div>

<div class="dsa-label">Competition I/O &amp; gotchas</div>
<div class="dsa-grid">

<div class="dsa-card">
<div class="dsa-title"><span class="badge trick">Trick</span> fast I/O</div>

```python
import sys
input = sys.stdin.readline    # ~5x faster

# Read all at once
data = sys.stdin.read().split()
idx = 0
def rd():
    global idx; idx += 1; return data[idx - 1]
def ri(): return int(rd())

# Fast output
out = []
out.append(str(result))
sys.stdout.write('\n'.join(out) + '\n')

# Multi-test template
T = int(input())
for _ in range(T):
    n = int(input())
    arr = list(map(int, input().split()))
```

</div>

<div class="dsa-card">
<div class="dsa-title"><span class="badge trick">Trick</span> Python-specific gotchas in DSA</div>
<div class="dsa-desc">These trip up C++/Java devs writing Python in contests.</div>

```python
# Floor division — rounds toward -inf (not zero)
7  // 2   # =  3
-7 // 2   # = -4  (not -3 like C++)

# Modulo follows divisor sign
-7 % 3    # = 2   (positive — Python), not -1

# No integer overflow — Python has BigInt!
# float('inf') works as infinity sentinel

# Recursion limit
import sys
sys.setrecursionlimit(200_000)

# Mutable default — classic bug
def f(arr=[]):   # WRONG — shared across calls
def f(arr=None):
    arr = arr or []   # correct
```

</div>

</div>
</div>

<!-- ───────────── COMPLEXITY ───────────── -->
<div class="dsa-section" id="dsa-complexity">

<div class="dsa-label">Built-ins &amp; algorithms</div>
<div class="dsa-grid">

<div class="dsa-card">
<div class="dsa-title">Python built-in complexity</div>
<table class="cx-table">
<tr><td>list append / pop (end)</td><td class="o1">O(1) amort</td></tr>
<tr><td>list insert / del at i</td><td class="on">O(n)</td></tr>
<tr><td>list search (in)</td><td class="on">O(n)</td></tr>
<tr><td>dict / set get, set, del</td><td class="o1">O(1) avg</td></tr>
<tr><td>deque append / pop (both)</td><td class="o1">O(1)</td></tr>
<tr><td>heapq push / pop</td><td class="olog">O(log n)</td></tr>
<tr><td>heapify</td><td class="on">O(n)</td></tr>
<tr><td>sorted() / .sort()</td><td class="on">O(n log n)</td></tr>
<tr><td>bisect_left / right</td><td class="olog">O(log n)</td></tr>
<tr><td>SortedList add / discard</td><td class="olog">O(log n)</td></tr>
</table>
</div>

<div class="dsa-card">
<div class="dsa-title">Algorithm reference</div>
<table class="cx-table">
<tr><td>Binary search</td><td class="olog">O(log n)</td></tr>
<tr><td>BFS / DFS</td><td class="on">O(V + E)</td></tr>
<tr><td>Dijkstra (min-heap)</td><td class="on">O((V+E) log V)</td></tr>
<tr><td>Bellman-Ford</td><td class="on">O(V · E)</td></tr>
<tr><td>Floyd-Warshall</td><td class="on2">O(V³)</td></tr>
<tr><td>Kruskal's MST</td><td class="on">O(E log E)</td></tr>
<tr><td>Topological sort (Kahn)</td><td class="on">O(V + E)</td></tr>
<tr><td>Union-Find (path compress)</td><td class="o1">O(α(n)) ≈ O(1)</td></tr>
<tr><td>LIS (patience sorting)</td><td class="on">O(n log n)</td></tr>
<tr><td>Knapsack 0/1</td><td class="on">O(n × W)</td></tr>
</table>
</div>

<div class="dsa-card">
<div class="dsa-title">Constraints → approach heuristic</div>
<div class="dsa-desc">Python is ~10–50x slower than C++. Assume ~10⁷ safe ops/sec for CPython, ~10⁸ for PyPy.</div>
<table class="cx-table">
<tr><td>n ≤ 10</td><td>O(n!) — backtrack / perms</td></tr>
<tr><td>n ≤ 20–25</td><td>O(2ⁿ) — bitmask DP</td></tr>
<tr><td>n ≤ 100</td><td class="on2">O(n³) — Floyd-Warshall, interval DP</td></tr>
<tr><td>n ≤ 1 000</td><td class="on2">O(n²) — 2D DP, brute force</td></tr>
<tr><td>n ≤ 10⁵</td><td class="on">O(n log n) — sort, heap, seg tree</td></tr>
<tr><td>n ≤ 10⁶</td><td class="o1">O(n) — linear scan, hash map</td></tr>
<tr><td>n ≤ 10⁹</td><td class="olog">O(log n) or O(√n)</td></tr>
</table>
</div>

<div class="dsa-card">
<div class="dsa-title">Space &amp; recursion notes</div>
<table class="cx-table">
<tr><td>Default recursion limit</td><td class="on">1 000</td></tr>
<tr><td>Recommended limit</td><td><code>sys.setrecursionlimit(2*10**5)</code></td></tr>
<tr><td>2D DP → rolling 1D</td><td>O(n²) → O(n)</td></tr>
<tr><td>DFS stack vs recursion</td><td>same O(depth)</td></tr>
<tr><td>BFS space</td><td>O(w) — max width</td></tr>
</table>
<div class="dsa-desc" style="margin-top:8px;">For any DFS with depth &gt; 1 000, convert to iterative or call <code>sys.setrecursionlimit</code> explicitly.</div>
</div>

</div>
</div>

</div>

<style>
.dsa-ref { font-family: var(--md-text-font, sans-serif); }

.dsa-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--md-default-fg-color--lightest, #e0e0e0);
  padding-bottom: 0.75rem;
}

.dsa-tab {
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

.dsa-tab:hover {
  border-color: var(--md-accent-fg-color, #526cfe);
  color: var(--md-accent-fg-color, #526cfe);
}

.dsa-tab.active {
  background: var(--md-accent-fg-color, #526cfe);
  border-color: var(--md-accent-fg-color, #526cfe);
  color: var(--md-accent-bg-color, #fff);
}

.dsa-section { display: none; }
.dsa-section.active { display: block; }

.dsa-label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--md-default-fg-color--light, #888);
  margin: 1.5rem 0 0.6rem;
}

.dsa-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 10px;
  margin-bottom: 0.5rem;
}

.dsa-card {
  background: var(--md-code-bg-color, #f5f5f5);
  border: 1px solid var(--md-default-fg-color--lightest, #e0e0e0);
  border-radius: 8px;
  padding: 0.9rem 1rem;
}

.dsa-checklist {
  margin-bottom: 0.5rem;
}

.dsa-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--md-default-fg-color, #1a1a1a);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dsa-desc {
  font-size: 0.8rem;
  color: var(--md-default-fg-color--light, #555);
  line-height: 1.55;
  margin-bottom: 6px;
}

.dsa-card pre,
.dsa-card code {
  font-size: 0.78rem !important;
  margin: 6px 0 0 !important;
}

/* Badges */
.badge {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  flex-shrink: 0;
}
.badge.ds     { background: #ede9fe; color: #5b21b6; }
.badge.pat    { background: #dbeafe; color: #1e40af; }
.badge.graph  { background: #dcfce7; color: #166534; }
.badge.dp     { background: #fef3c7; color: #92400e; }
.badge.trick  { background: #d1fae5; color: #065f46; }

/* Complexity table */
.cx-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
  margin-top: 6px;
}
.cx-table tr {
  border-bottom: 1px solid var(--md-default-fg-color--lightest, #e0e0e0);
}
.cx-table tr:last-child { border-bottom: none; }
.cx-table td {
  padding: 4px 2px;
  color: var(--md-default-fg-color, #333);
}
.cx-table td:last-child {
  text-align: right;
  font-family: var(--md-code-font, monospace);
  font-weight: 600;
  white-space: nowrap;
}
.o1   { color: #166534; }
.olog { color: #1e40af; }
.on   { color: #92400e; }
.on2  { color: #991b1b; }

/* Pills */
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
  var tabs = document.getElementById('dsa-tabs');
  if (!tabs) return;
  tabs.addEventListener('click', function (e) {
    var btn = e.target.closest('.dsa-tab');
    if (!btn) return;
    var sec = btn.dataset.sec;
    document.querySelectorAll('.dsa-tab').forEach(function (t) { t.classList.remove('active'); });
    document.querySelectorAll('.dsa-section').forEach(function (s) { s.classList.remove('active'); });
    btn.classList.add('active');
    var el = document.getElementById('dsa-' + sec);
    if (el) el.classList.add('active');
  });
})();
</script>
