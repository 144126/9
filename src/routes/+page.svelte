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
    gsap.utils.toArray<HTMLElement>('.post-text').forEach(el => {
      const words = el.innerText.split(' ').map(w => `<span class="word" style="opacity:0.1">${w}</span>`).join(' ');
      el.innerHTML = words;
      gsap.to(el.querySelectorAll('.word'), {
        opacity: 1,
        duration: 1.2,
        stagger: 0.03,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          end: 'top 40%',
          scrub: 1.5,
        },
      });
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
    gsap.from('.hero-img', {
      scale: 0.85,
      opacity: 0,
      x: 80,
      duration: 1.2,
      ease: 'power4.out',
      delay: 0.3,
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
  });
</script>

<main class="overflow-x-hidden w-full max-w-full bg-[#0a0a0a] font-cabinet text-white antialiased">
  <!-- NAV -->
  <nav class="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-2.5 text-sm">
    <a href="/" class="font-semibold tracking-tight text-amber-400 text-lg">i</a>
    <span class="text-zinc-600">/</span>
    <span class="text-zinc-500">quiet thoughts</span>
  </nav>

  <!-- HERO: Editorial Split -->
  <section bind:this={hero} class="relative min-h-screen flex items-center px-6 md:px-16 pt-24">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(217,119,6,0.08)_0%,transparent_60%)] pointer-events-none"></div>
    <div class="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
      <div class="max-w-xl">
        <h1 class="hero-el text-[clamp(2.8rem,5vw,5rem)] font-bold tracking-tight leading-[1.05]">
          drop a
          <span class="inline-block w-16 h-8 md:w-24 md:h-12 rounded-full align-middle bg-cover bg-center mx-2 md:mx-3 -mt-1" style="background-image:url(https://picsum.photos/seed/whisper/300/150);filter:grayscale(0.4) contrast(1.2)"></span>
          <span class="text-amber-400/90">thought</span><span class="text-amber-400/50">.</span>
        </h1>
        <p class="hero-el text-zinc-500 text-sm md:text-base max-w-md mt-5 font-light leading-relaxed">a quiet space for fleeting words. no noise, no likes, no followers.</p>
        <form onsubmit={send} class="hero-el mt-10 flex gap-4">
          <input type="text" bind:value={text} placeholder="write a post…" class="flex-1 bg-transparent border-0 border-b-2 border-zinc-700 rounded-none px-0 pb-3 pt-1 text-sm text-white placeholder-zinc-600 outline-none focus:border-amber-400 transition-all duration-300" />
          <button class="bg-amber-400 text-[#0a0a0a] rounded-full px-8 py-3 text-sm font-semibold tracking-wide hover:bg-amber-300 transition-all duration-300 active:scale-95">send</button>
        </form>
      </div>
      <div class="hero-img relative flex justify-end">
        <div class="w-full max-w-lg aspect-[4/3] rounded-2xl bg-cover bg-center opacity-90 contrast-125" style="background-image:url(https://picsum.photos/seed/void/800/600);filter:grayscale(0.6)"></div>
        <div class="absolute -bottom-6 -left-6 w-40 h-40 bg-amber-400/5 rounded-full blur-3xl pointer-events-none"></div>
      </div>
    </div>
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 text-zinc-700 text-xs tracking-widest uppercase animate-bounce">scroll</div>
  </section>

  <!-- MARQUEE -->
  <section class="py-12 border-t border-white/[0.03] overflow-hidden">
    <div class="flex whitespace-nowrap gap-16 text-zinc-800 text-xs md:text-sm font-light tracking-[0.2em] uppercase animate-[marquee_24s_linear_infinite]">
      {#each Array(6) as _}
        <span class="flex gap-16"><span>thoughts</span><span class="text-zinc-700">·</span><span>ideas</span><span class="text-zinc-700">·</span><span>moments</span><span class="text-zinc-700">·</span><span>words</span><span class="text-zinc-700">·</span><span>silence</span><span class="text-zinc-700">·</span><span>traces</span><span class="text-zinc-700">·</span></span>
      {/each}
    </div>
  </section>

  <!-- BENTO -->
  <section bind:this={bento} class="py-32 md:py-48 px-6 max-w-7xl mx-auto">
    <div class="grid grid-cols-4 gap-4 grid-flow-dense">
      <div class="bento-card col-span-2 row-span-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 md:p-8 group hover:bg-white/[0.05] transition-all duration-500 overflow-hidden">
        <span class="text-zinc-600 text-xs tracking-widest uppercase">latest</span>
        {#if posts.length > 0}
          <p class="text-base md:text-lg font-light text-zinc-300 mt-4 line-clamp-3">{posts[0].payload?.t ?? '—'}</p>
          <p class="text-zinc-600 text-xs mt-3">{new Date(posts[0].payload?.d ?? 0).toLocaleString()}</p>
        {:else}
          <p class="text-zinc-700 text-base mt-4 italic">no posts yet</p>
        {/if}
      </div>
      <div class="bento-card col-span-1 row-span-2 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 md:p-8 flex flex-col justify-between group hover:bg-white/[0.05] transition-all duration-500">
        <span class="text-zinc-600 text-xs tracking-widest uppercase">total</span>
        <span class="text-5xl md:text-6xl font-light text-amber-400/80">{posts.length}</span>
        <span class="text-zinc-600 text-xs">posts collected</span>
      </div>
      <div class="bento-card col-span-1 row-span-1 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 md:p-8 flex items-center justify-center group hover:bg-white/[0.04] transition-all duration-500">
        <div class="w-14 h-14 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-400/60 text-2xl font-light">i</div>
      </div>
      <div class="bento-card col-span-2 row-span-1 bg-gradient-to-br from-amber-400/[0.03] to-transparent border border-amber-400/[0.06] rounded-2xl p-6 md:p-8 group hover:from-amber-400/[0.05] transition-all duration-500">
        <span class="text-zinc-600 text-xs tracking-widest uppercase">activity</span>
        <p class="text-zinc-600 text-sm mt-3 font-light">a quiet space for fleeting thoughts. every word left here lingers in the dark.</p>
      </div>
    </div>
  </section>

  <!-- POSTS -->
  <section bind:this={posts_el} class="py-32 md:py-48 px-6 max-w-7xl mx-auto">
    <div class="flex items-end justify-between mb-16">
      <div>
        <h2 class="text-4xl md:text-5xl font-bold tracking-tight text-zinc-200">posts</h2>
        <p class="text-zinc-600 text-sm mt-3 font-light">browse the archive</p>
      </div>
      {#if posts.length > 0}
        <span class="text-zinc-700 text-xs tabular-nums">{posts.length} shown</span>
      {/if}
    </div>

    <form onsubmit={search} class="flex gap-4 mb-12">
      <div class="flex-1 relative">
        <input type="search" bind:value={q} placeholder="search posts…" class="w-full bg-transparent border-0 border-b-2 border-zinc-700 rounded-none px-0 pb-3 pt-1 pl-7 text-sm text-white placeholder-zinc-600 outline-none focus:border-amber-400 transition-all duration-300" />
        <svg class="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      </div>
      <button type="button" onclick={() => show_filter = !show_filter} class="bg-white/5 border border-white/10 rounded-full w-11 h-11 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 transition-all duration-300 flex-shrink-0" title="filter">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
      </button>
      <button class="bg-white/10 text-white rounded-full px-8 py-2.5 text-sm font-medium hover:bg-white/15 transition-all duration-300 active:scale-95">search</button>
    </form>

    <!-- FILTER: Horizontal Accordion -->
    <div class="overflow-hidden transition-all duration-500 ease-out" style="max-height: {show_filter ? '400px' : '0px'}; opacity: {show_filter ? 1 : 0};">
      <div class="border border-white/[0.06] rounded-2xl p-6 mb-12 bg-white/[0.02]">
        <label class="flex items-center gap-3 mb-5 text-sm">
          <input type="checkbox" bind:checked={filter_enabled} class="w-4 h-4 rounded border-zinc-700 bg-white/5 text-amber-400 focus:ring-amber-400/30" />
          <span class="text-zinc-400">filter by datetime</span>
        </label>
        {#if filter_enabled}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex items-center gap-3">
              <input type="datetime-local" bind:value={t_start} class="flex-1 bg-transparent border-0 border-b-2 border-zinc-700 rounded-none px-0 pb-2 text-sm text-white outline-none focus:border-amber-400 transition-colors" />
              <button onclick={() => now('start')} class="text-amber-400/70 hover:text-amber-400 text-xs transition-colors whitespace-nowrap">now</button>
            </div>
            <div class="flex items-center gap-3">
              <input type="datetime-local" bind:value={t_end} class="flex-1 bg-transparent border-0 border-b-2 border-zinc-700 rounded-none px-0 pb-2 text-sm text-white outline-none focus:border-amber-400 transition-colors" />
              <button onclick={() => now('end')} class="text-amber-400/70 hover:text-amber-400 text-xs transition-colors whitespace-nowrap">now</button>
            </div>
          </div>
        {/if}
        <div class="flex gap-3 mt-6">
          <button onclick={apply_filter} class="bg-amber-400 text-[#0a0a0a] rounded-full px-6 py-2 text-xs font-semibold hover:bg-amber-300 transition-all duration-300 active:scale-95">apply</button>
          <button onclick={() => show_filter = false} class="bg-white/5 border border-white/10 rounded-full px-6 py-2 text-xs text-zinc-400 hover:text-white transition-all duration-300">cancel</button>
        </div>
      </div>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-20">
        <div class="w-6 h-6 border-2 border-zinc-700 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        {#each posts as post, i}
          <div class="post-card bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 md:p-7 group hover:bg-white/[0.04] hover:border-white/[0.10] hover:scale-[1.02] transition-all duration-500 cursor-default overflow-hidden">
            <p class="post-text text-sm md:text-base text-zinc-300 font-light leading-relaxed group-hover:text-white transition-colors duration-500">{post.payload?.t ?? ''}</p>
            <div class="flex items-center gap-3 mt-5">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400/40"></span>
              <p class="text-xs text-zinc-600">{new Date(post.payload?.d ?? 0).toLocaleString()}</p>
            </div>
          </div>
        {:else}
          <div class="col-span-full text-center py-20">
            <p class="text-zinc-700 text-lg font-light">no posts yet</p>
            <p class="text-zinc-800 text-sm mt-2">the first word starts here.</p>
          </div>
        {/each}
      </div>

      <div class="flex items-center justify-center gap-4 mt-16">
        {#if is_search && page > 0}
          <button onclick={prev} class="bg-white/5 border border-white/10 rounded-full px-6 py-2.5 text-sm text-zinc-400 hover:text-white hover:border-white/20 transition-all duration-300 active:scale-95">prev</button>
        {/if}
        {#if is_search}
          <span class="text-zinc-700 text-sm tabular-nums">{page + 1}</span>
        {/if}
        {#if has_next}
          <button onclick={next} class="bg-white/10 text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-white/15 transition-all duration-300 active:scale-95">next</button>
        {/if}
      </div>
    {/if}
  </section>

  <!-- FOOTER -->
  <footer class="border-t border-white/[0.04] py-16 md:py-20 px-6">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
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
