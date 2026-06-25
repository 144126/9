<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';

  gsap.registerPlugin(ScrollTrigger);

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
  let posts_el: HTMLElement;

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
    await tick();
    gsap.from('.post-card', {
      y: 80,
      opacity: 0,
      scale: 0.92,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: posts_el,
        start: 'top 85%',
      },
    });
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

<main class="overflow-x-hidden w-full max-w-full min-h-screen bg-[#0a0a0a] font-outfit text-white antialiased">
  <section bind:this={posts_el} class="py-16 md:py-24 px-4 max-w-2xl mx-auto">
    <form onsubmit={send} class="flex gap-3 mb-10">
      <input type="text" bind:value={text} placeholder="write a post…" class="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-amber-400/40 focus:bg-white/[0.07] transition-all duration-300" />
      <button class="bg-amber-400 text-[#0a0a0a] rounded-xl px-6 py-3.5 text-sm font-semibold tracking-wide hover:bg-amber-300 transition-all duration-300 active:scale-95">send</button>
    </form>

    <form onsubmit={search} class="flex gap-3 mb-8">
      <div class="flex-1 relative">
        <input type="search" bind:value={q} placeholder="search posts…" class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-amber-400/40 focus:bg-white/[0.07] transition-all duration-300 pl-11" />
        <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      </div>
      <button type="button" onclick={() => show_filter = !show_filter} class="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-zinc-500 hover:text-white hover:border-white/20 transition-all duration-300" title="filter">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
      </button>
      <button class="bg-white/10 text-white rounded-xl px-6 py-3.5 text-sm font-medium hover:bg-white/15 transition-all duration-300 active:scale-95">search</button>
    </form>

    <div class="overflow-hidden transition-all duration-500 ease-out" style="max-height: {show_filter ? '400px' : '0px'}; opacity: {show_filter ? 1 : 0};">
      <div class="border border-white/[0.06] rounded-2xl p-6 mb-8 bg-white/[0.02]">
        <label class="flex items-center gap-3 mb-5 text-sm">
          <input type="checkbox" bind:checked={filter_enabled} class="w-4 h-4 rounded border-zinc-700 bg-white/5 text-amber-400 focus:ring-amber-400/30" />
          <span class="text-zinc-400">filter by datetime</span>
        </label>
        {#if filter_enabled}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex items-center gap-3">
              <input type="datetime-local" bind:value={t_start} class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-400/40 transition-colors" />
              <button onclick={() => now('start')} class="text-amber-400/70 hover:text-amber-400 text-xs transition-colors whitespace-nowrap">now</button>
            </div>
            <div class="flex items-center gap-3">
              <input type="datetime-local" bind:value={t_end} class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-400/40 transition-colors" />
              <button onclick={() => now('end')} class="text-amber-400/70 hover:text-amber-400 text-xs transition-colors whitespace-nowrap">now</button>
            </div>
          </div>
        {/if}
        <div class="flex gap-3 mt-5">
          <button onclick={apply_filter} class="bg-amber-400 text-[#0a0a0a] rounded-lg px-5 py-2 text-xs font-semibold hover:bg-amber-300 transition-all duration-300 active:scale-95">apply</button>
          <button onclick={() => show_filter = false} class="bg-white/5 border border-white/10 rounded-lg px-5 py-2 text-xs text-zinc-400 hover:text-white transition-all duration-300">cancel</button>
        </div>
      </div>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-20">
        <div class="w-6 h-6 border-2 border-zinc-700 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    {:else}
      <div class="space-y-4">
        {#each posts as post, i}
          <div class="post-card bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 md:p-6 group hover:bg-white/[0.04] hover:border-white/[0.10] transition-all duration-500 cursor-default" style="transition-delay: {i * 50}ms">
            <p class="text-sm md:text-base text-zinc-300 font-light leading-relaxed group-hover:text-white transition-colors duration-500">{post.payload?.t ?? ''}</p>
            <div class="flex items-center gap-3 mt-4">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400/40"></span>
              <p class="text-xs text-zinc-600">{new Date(post.payload?.d ?? 0).toLocaleString()}</p>
            </div>
          </div>
        {:else}
          <div class="text-center py-20">
            <p class="text-zinc-700 text-lg font-light">no posts yet</p>
            <p class="text-zinc-800 text-sm mt-2">the first word starts here.</p>
          </div>
        {/each}
      </div>

      <div class="flex items-center justify-center gap-4 mt-12">
        {#if is_search && page > 0}
          <button onclick={prev} class="bg-white/5 border border-white/10 rounded-xl px-5 py-2.5 text-sm text-zinc-400 hover:text-white hover:border-white/20 transition-all duration-300 active:scale-95">prev</button>
        {/if}
        {#if is_search}
          <span class="text-zinc-700 text-sm tabular-nums">{page + 1}</span>
        {/if}
        {#if has_next}
          <button onclick={next} class="bg-white/10 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-white/15 transition-all duration-300 active:scale-95">next</button>
        {/if}
      </div>
    {/if}
  </section>
</main>
