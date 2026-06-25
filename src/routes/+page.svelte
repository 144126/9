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

  let has_next = $derived(is_search ? posts.length >= 20 : next_offset != null);

  onMount(() => load());
</script>

<main class="overflow-x-hidden w-full max-w-full min-h-screen bg-[#0a0a0a] font-outfit text-white antialiased">
  <section bind:this={posts_el} class="py-16 md:py-24 px-4 max-w-2xl mx-auto">
    <form onsubmit={send} class="flex gap-3 mb-10">
      <input type="text" bind:value={text} placeholder="write a post…" class="flex-1 border-b border-white/10 px-5 py-3.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-amber-400/40 transition-all duration-300" />
      <button class="bg-amber-400 text-[#0a0a0a] rounded-full px-6 py-3.5 text-sm font-semibold tracking-wide hover:bg-amber-300 transition-all duration-300 active:scale-95">send</button>
    </form>

    <form onsubmit={search} class="flex gap-3 mb-8">
      <div class="flex-1 relative">
        <input type="search" bind:value={q} placeholder="search posts…" class="w-full border-b border-white/10 px-5 py-3.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-amber-400/40 transition-all duration-300 pl-11" />
        <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      </div>

      <button class="bg-white/10 text-white rounded-full px-6 py-3.5 text-sm font-medium hover:bg-white/15 transition-all duration-300 active:scale-95">search</button>
    </form>

    {#if loading}
      <div class="flex items-center justify-center py-20">
        <div class="w-6 h-6 border-2 border-zinc-700 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    {:else}
      <div class="space-y-4">
        {#each posts as post, i}
          <div class="post-card border-b border-white/[0.06] pb-5 md:pb-6 group cursor-default">
            <p class="text-sm md:text-base text-zinc-300 font-light leading-relaxed group-hover:text-white transition-colors duration-500">{post.payload?.t ?? ''}</p>
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
          <button onclick={prev} class="bg-white/5 border border-white/10 rounded-full px-5 py-2.5 text-sm text-zinc-400 hover:text-white hover:border-white/20 transition-all duration-300 active:scale-95">prev</button>
        {/if}
        {#if is_search}
          <span class="text-zinc-700 text-sm tabular-nums">{page + 1}</span>
        {/if}
        {#if has_next}
          <button onclick={next} class="bg-white/10 text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-white/15 transition-all duration-300 active:scale-95">next</button>
        {/if}
      </div>
    {/if}
  </section>
</main>
