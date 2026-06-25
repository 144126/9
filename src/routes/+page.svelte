<script lang="ts">
  import { onMount } from 'svelte';

  let q = $state('');
  let page = $state(0);
  let posts = $state<any[]>([]);
  let next_offset = $state<any>(null);
  let loading = $state(true);
  let text = $state('');
  let show_filter = $state(false);
  let filter_enabled = $state(false);
  let t_start = $state('');
  let t_end = $state('');
  let is_search = $derived(q.length > 0);

  async function send(e: Event) {
    e.preventDefault();
    if (!text) return;
    await fetch('/', { method: 'POST', body: JSON.stringify({ t: text }), headers: { 'Content-Type': 'application/json' } });
    text = '';
    load();
  }

  async function load() {
    loading = true;
    const params = new URLSearchParams();
    if (q) params.set('s', q);
    if (is_search) {
      if (page > 0) params.set('p', String(page + 1));
    } else if (next_offset != null) {
      params.set('p', String(next_offset));
    }
    if (filter_enabled) {
      if (t_start) params.set('t', String(new Date(t_start).getTime()));
      if (t_end) params.set('e', String(new Date(t_end).getTime()));
    }
    const res = await fetch(`/?${params}`);
    const data: any = await res.json();
    if (Array.isArray(data)) {
      posts = data;
    } else {
      posts = data.points || [];
      next_offset = data.next_page_offset ?? null;
    }
    loading = false;
  }

  function search(e: Event) {
    e.preventDefault();
    page = 0;
    next_offset = null;
    load();
  }

  function next() {
    if (is_search) page++;
    load();
  }

  function prev() {
    if (is_search && page > 0) page--;
    load();
  }

  function apply_filter() {
    show_filter = false;
    page = 0;
    next_offset = null;
    load();
  }

  function now(f: 'start' | 'end') {
    const n = new Date().toISOString().slice(0, 16);
    if (f === 'start') t_start = n;
    else t_end = n;
  }

  let has_next = $derived(is_search ? posts.length >= 20 : next_offset != null);

  onMount(() => load());
</script>

<div class="max-w-2xl mx-auto p-4">
  <form onsubmit={send} class="flex gap-2 mb-4">
    <input type="text" bind:value={text} placeholder="write a post…" class="flex-1 border rounded px-3 py-2" />
    <button class="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium">send</button>
  </form>

  <form onsubmit={search} class="flex gap-2 mb-4">
    <input type="search" bind:value={q} placeholder="search posts…" class="flex-1 border rounded px-3 py-2" />
    <button type="button" onclick={() => show_filter = !show_filter} class="border rounded px-3 py-2 text-lg leading-none" title="filter">⏳</button>
    <button class="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium">search</button>
  </form>

  {#if show_filter}
    <div class="border rounded p-4 mb-4 text-sm">
      <label class="flex items-center gap-2 mb-3">
        <input type="checkbox" bind:checked={filter_enabled} />
        filter by datetime
      </label>
      {#if filter_enabled}
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <input type="datetime-local" bind:value={t_start} class="border rounded px-2 py-1 flex-1" />
            <button onclick={() => now('start')} class="underline text-xs">now</button>
          </div>
          <div class="flex items-center gap-2">
            <input type="datetime-local" bind:value={t_end} class="border rounded px-2 py-1 flex-1" />
            <button onclick={() => now('end')} class="underline text-xs">now</button>
          </div>
        </div>
      {/if}
      <div class="flex gap-2 mt-3">
        <button onclick={apply_filter} class="bg-blue-600 text-white rounded px-3 py-1 text-xs font-medium">apply</button>
        <button onclick={() => show_filter = false} class="border rounded px-3 py-1 text-xs">cancel</button>
      </div>
    </div>
  {/if}

  {#if loading}
    <p class="text-sm text-gray-500">loading…</p>
  {:else}
    <div class="space-y-2 mb-4">
      {#each posts as post}
        <div class="border rounded p-3">
          <p class="text-sm">{post.payload?.t ?? ''}</p>
          <p class="text-xs text-gray-500 mt-1">{new Date(post.payload?.d ?? 0).toLocaleString()}</p>
        </div>
      {:else}
        <p class="text-sm text-gray-500">no posts yet</p>
      {/each}
    </div>

    <div class="flex items-center justify-center gap-3 text-sm">
      {#if is_search && page > 0}
        <button onclick={prev} class="border rounded px-3 py-1">prev</button>
      {/if}
      {#if is_search}
        <span class="text-gray-500">{page + 1}</span>
      {/if}
      {#if has_next}
        <button onclick={next} class="border rounded px-3 py-1">next</button>
      {/if}
    </div>
  {/if}
</div>
