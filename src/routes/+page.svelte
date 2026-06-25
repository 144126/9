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
  let hero: HTMLElement;
  let bento: HTMLElement;
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

  onMount(() => {
    load();
    gsap.from('.hero-el', {
      y: 80,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: 'power4.out',
      delay: 0.2,
    });
    gsap.from('.bento-card', {
      y: 100,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: bento,
        start: 'top 85%',
      },
    });
    gsap.from('.marquee-track', {
      opacity: 0,
      x: -60,
      duration: 1,
      scrollTrigger: {
        trigger: '.marquee-wrap',
        start: 'top 90%',
      },
    });
  });
</script>

<main class="overflow-x-hidden w-full max-w-full bg-[#0a0a0a] font-outfit text-white antialiased">
  <!-- NAV -->
  <nav class="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-2.5 text-sm">
    <a href="/" class="font-semibold tracking-tight text-amber-400 text-lg">i</a>
    <span class="text-zinc-600">/</span>
    <span class="text-zinc-500">quiet thoughts</span>
  </nav>

  <!-- HERO -->
  <section class="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.12)_0%,transparent_60%)] pointer-events-none"></div>
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.03)_0%,transparent_50%)] pointer-events-none"></div>
    <div class="relative z-10 flex flex-col items-center">
      <h1 class="hero-el text-[clamp(2.5rem,6vw,4.5rem)] font-light tracking-tight leading-[1.1] text-center max-w-4xl">
        share a
        <span class="inline-block w-14 h-7 md:w-20 md:h-10 rounded-full align-middle bg-cover bg-center mx-2 md:mx-3 -mt-1" style="background-image:url(https://picsum.photos/seed/thought/200/100);filter:grayscale(0.3) contrast(1.2)"></span>
        <span class="font-semibold text-amber-400/90">thought</span><span class="text-amber-400/60">.</span>
      </h1>
      <p class="hero-el text-zinc-500 text-sm md:text-base text-center max-w-lg mt-5 font-light tracking-wide">just words. no noise. drop one below.</p>
      <form onsubmit={send} class="hero-el mt-12 w-full max-w-lg flex gap-3">
        <input type="text" bind:value={text} placeholder="write a post…" class="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-amber-400/40 focus:bg-white/[0.07] transition-all duration-300" />
        <button class="bg-amber-400 text-[#0a0a0a] rounded-xl px-6 py-3.5 text-sm font-semibold tracking-wide hover:bg-amber-300 transition-all duration-300 active:scale-95">send</button>
      </form>
    </div>
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-zinc-700 text-xs tracking-widest uppercase">scroll</div>
  </section>

  <!-- MARQUEE -->
  <section class="marquee-wrap py-12 border-t border-white/[0.03] overflow-hidden">
    <div class="marquee-track flex whitespace-nowrap gap-16 text-zinc-800 text-xs md:text-sm font-light tracking-[0.2em] uppercase animate-[marquee_24s_linear_infinite]">
      {#each Array(6) as _}
        <span class="flex gap-16"><span>thoughts</span><span class="text-zinc-700">·</span><span>ideas</span><span class="text-zinc-700">·</span><span>moments</span><span class="text-zinc-700">·</span><span>words</span><span class="text-zinc-700">·</span><span>stories</span><span class="text-zinc-700">·</span><span>traces</span><span class="text-zinc-700">·</span></span>
      {/each}
    </div>
  </section>

  <!-- BENTO STATS -->
  <section bind:this={bento} class="py-32 md:py-48 px-4 max-w-6xl mx-auto">
    <div class="grid grid-cols-3 gap-4 grid-flow-dense">
      <div class="bento-card col-span-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 md:p-8 flex flex-col justify-between group hover:bg-white/[0.05] transition-all duration-500">
        <span class="text-zinc-600 text-xs tracking-widest uppercase">total</span>
        <span class="text-4xl md:text-5xl font-light text-amber-400/80 mt-6">{posts.length}</span>
        <span class="text-zinc-600 text-xs mt-2">posts collected</span>
      </div>
      <div class="bento-card col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 md:p-8 group hover:bg-white/[0.05] transition-all duration-500 overflow-hidden">
        <span class="text-zinc-600 text-xs tracking-widest uppercase">latest</span>
        {#if posts.length > 0}
          <p class="text-base md:text-lg font-light text-zinc-300 mt-4 line-clamp-3">{posts[0].payload?.t ?? '—'}</p>
          <p class="text-zinc-600 text-xs mt-3">{new Date(posts[0].payload?.d ?? 0).toLocaleString()}</p>
        {:else}
          <p class="text-zinc-700 text-base mt-4 italic">no posts yet</p>
        {/if}
      </div>
      <div class="bento-card col-span-1 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center group hover:bg-white/[0.04] transition-all duration-500">
        <div class="w-12 h-12 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-400/60 text-xl font-light">i</div>
      </div>
      <div class="bento-card col-span-3 bg-gradient-to-br from-amber-400/[0.03] to-transparent border border-amber-400/[0.06] rounded-2xl p-6 md:p-8 group hover:from-amber-400/[0.05] transition-all duration-500">
        <span class="text-zinc-600 text-xs tracking-widest uppercase">activity</span>
        <p class="text-zinc-600 text-sm mt-3 font-light">a quiet space for fleeting thoughts. every word left here lingers in the dark.</p>
      </div>
    </div>
  </section>

  <!-- SEARCH + POSTS -->
  <section bind:this={posts_el} class="py-32 md:py-48 px-4 max-w-6xl mx-auto">
    <div class="flex items-end justify-between mb-12">
      <div>
        <h2 class="text-3xl md:text-4xl font-light tracking-tight text-zinc-200">posts</h2>
        <p class="text-zinc-600 text-sm mt-2 font-light">browse the archive</p>
      </div>
      {#if posts.length > 0}
        <span class="text-zinc-700 text-xs">{posts.length} shown</span>
      {/if}
    </div>

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

    <!-- FILTER: horizontal accordion -->
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

    <!-- POSTS -->
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

      <!-- PAGINATION -->
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

  <!-- FOOTER -->
  <footer class="border-t border-white/[0.04] py-16 md:py-20 px-4">
    <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="flex items-center gap-3">
        <span class="text-amber-400 font-semibold tracking-tight text-lg">i</span>
        <span class="text-zinc-700 text-xs">·</span>
        <span class="text-zinc-600 text-xs font-light">a quiet corner</span>
      </div>
      <div class="flex items-center gap-8 text-xs text-zinc-700">
        <span class="hover:text-zinc-500 transition-colors cursor-default">thoughts</span>
        <span class="hover:text-zinc-500 transition-colors cursor-default">traces</span>
        <span class="hover:text-zinc-500 transition-colors cursor-default">silence</span>
      </div>
    </div>
  </footer>
</main>

<style>
  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
</style>
