(() => {
  'use strict';
  const data = window.MEMOIR_DATA || { memories: [], tracks: [] };
  const main = document.querySelector('#main');
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const lines = value => esc(value).replace(/\n/g, '<br>');
  const paragraphs = value => String(value || '').split(/\n\n+/).filter(Boolean).map(p => `<p>${lines(p)}</p>`).join('');
  const dateLabel = value => value ? esc(value).replaceAll('-', ' / ') : '';
  const mediaUrl = path => path ? encodeURI(path) : '';
  function sortedMemories() {
    return [...(data.memories || [])].filter(item => item.status === 'published').sort((a,b) =>
      Number(b.special || 0) - Number(a.special || 0) || Number(a.order || 999999) - Number(b.order || 999999) || String(b.date || '').localeCompare(String(a.date || ''))
    );
  }

  function renderHome() {
    const memories = sortedMemories();
    const latest = [...memories].sort((a,b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))[0];
    main.innerHTML = `
      <section class="cover reveal is-visible" aria-labelledby="cover-title">
        <div class="cover-glow" aria-hidden="true"></div><div class="floating-star star-one" aria-hidden="true">✦</div><div class="floating-star star-two" aria-hidden="true">·</div>
        <div class="cover-card"><div class="cover-number">VOLUME · OURS</div><div class="pressed-flower" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          <p class="eyebrow">一本属于两个人的线上剧本回忆录</p><h1 id="cover-title"><span>高<span class="amp">&</span>薯条的</span><strong>剧本回忆</strong></h1>
          <p class="english-title">Our Story, Our Scripts</p><div class="cover-rule"><span>✦</span></div>
          <a class="primary-button" href="#directory">开始阅读 <span>↓</span></a><p class="edition">PRIVATE EDITION · ${new Date().getFullYear()}</p>
        </div>
      </section>
      <section class="directory-section" id="directory" aria-labelledby="directory-title">
        <header class="section-heading reveal"><div><p class="section-kicker">MEMORY DIRECTORY</p><h2 id="directory-title">回忆目录</h2><span class="memory-count">已记录 ${memories.length} 篇</span></div>
          ${latest ? `<a class="latest-link" href="#/memory/${encodeURIComponent(latest.id)}">最近更新 · ${esc(latest.title)} →</a>` : ''}</header>
        ${memories.length ? `<div class="memory-list">${memories.map((memory,index) => memoryCard(memory,index)).join('')}</div>` : `
          <div class="empty-state reveal"><div class="empty-paper"><span class="empty-star">✦</span><h3>暂无回忆</h3></div></div>`}
      </section>
      <section class="share-strip reveal"><span class="share-ornament">✦</span><button class="secondary-button" type="button" data-share>复制网站网址</button></section>`;
    bindPageInteractions();
    if (location.hash === '#directory') setTimeout(() => document.querySelector('#directory')?.scrollIntoView(), 0);
  }

  function memoryCard(memory,index) {
    const cover = memory.images?.[0];
    return `<article class="memory-entry reveal ${memory.special ? 'is-special' : ''}">
      <a class="memory-cover" href="#/memory/${encodeURIComponent(memory.id)}" aria-label="阅读《${esc(memory.title)}》">
        ${cover ? `<img src="${mediaUrl(cover.src)}" alt="《${esc(memory.title)}》回忆截图" loading="lazy">` : `<div class="cover-placeholder"><span>✦</span><small>等待一张故事截图</small></div>`}
        <span class="film-hole film-hole-top"></span><span class="film-hole film-hole-bottom"></span>
      </a><div class="memory-info"><div class="entry-meta"><span class="chapter-no">CHAPTER ${String(index+1).padStart(2,'0')}</span>${memory.date ? `<time>${esc(memory.date).replaceAll('-','.')}</time>`:''}</div>
      ${memory.special ? '<span class="special-mark">纪念章节</span>':''}<h3><a href="#/memory/${encodeURIComponent(memory.id)}">${esc(memory.title)}</a></h3>
      ${memory.summary ? `<p>${esc(memory.summary)}</p>`:''}<div class="entry-foot"><span>${memory.images?.length || 0} 张故事截图</span><a href="#/memory/${encodeURIComponent(memory.id)}">翻开这一页 <span>→</span></a></div></div>
    </article>`;
  }

  function renderMemory(id) {
    const memories = sortedMemories();
    const memory = memories.find(item => String(item.id) === String(id));
    if (!memory) {
      main.innerHTML = `<section class="not-found"><span>✦</span><h1>这一页暂时找不到</h1><a class="primary-button" href="#/">回到目录</a></section>`;
      return;
    }
    const at = memories.indexOf(memory), previous = memories[at-1], next = memories[at+1];
    document.title = `${memory.title} · 高&薯条的剧本回忆`;
    main.innerHTML = `<article class="story">
      <header class="story-header reveal is-visible"><a class="back-link" href="#/">← 回忆目录</a><p class="section-kicker">${memory.special?'SPECIAL MEMORY':'OUR SCRIPT MEMORY'}</p>
        <h1>${esc(memory.title)}</h1><p class="story-subtitle">在故事里相遇，也在故事外记得彼此</p>
        <div class="story-meta">${memory.date?`<div><small>游戏日期</small><time>${dateLabel(memory.date)}</time></div>`:''}
          ${(memory.roleMe||memory.rolePartner)?`<div><small>角色手记</small><span>${[memory.roleMe&&`高 · ${esc(memory.roleMe)}`,memory.rolePartner&&`薯条 · ${esc(memory.rolePartner)}`].filter(Boolean).join(' / ')}</span></div>`:''}</div>
        ${memory.tags?.length?`<div class="tag-row">${memory.tags.map(tag=>`<span># ${esc(tag)}</span>`).join('')}</div>`:''}
      </header>
      ${memory.summary?`<section class="story-summary reveal"><span class="note-label">MEMORY NOTE</span><p>${lines(memory.summary)}</p></section>`:''}
      ${memory.body?`<section class="story-body reveal"><div class="body-ornament">✦</div>${paragraphs(memory.body)}</section>`:''}
      ${memory.dialogue?`<blockquote class="dialogue-card reveal"><span class="quote-mark">“</span>${String(memory.dialogue).split('\n').map(line=>`<p>${esc(line)}</p>`).join('')}<footer>— 那天，想一直记得的话</footer></blockquote>`:''}
      ${memory.images?.length?`<section class="screenshots"><div class="image-section-title reveal"><span></span><p>SCENES WE KEPT · 我们留下的画面</p><span></span></div>
        ${memory.images.map((image,index)=>`<figure class="story-image reveal"><button type="button" class="image-button" data-lightbox-src="${mediaUrl(image.src)}" data-lightbox-alt="《${esc(memory.title)}》截图 ${index+1}"><img src="${mediaUrl(image.src)}" alt="《${esc(memory.title)}》截图 ${index+1}" loading="lazy"><span class="zoom-hint">点击查看原图</span></button>${image.caption?`<figcaption>${esc(image.caption)}</figcaption>`:''}<span class="image-number">${String(index+1).padStart(2,'0')}</span></figure>`).join('')}</section>`:''}
      <nav class="chapter-nav reveal">${previous?`<a href="#/memory/${encodeURIComponent(previous.id)}"><small>上一篇</small><span>← ${esc(previous.title)}</span></a>`:'<span></span>'}${next?`<a class="next" href="#/memory/${encodeURIComponent(next.id)}"><small>下一篇</small><span>${esc(next.title)} →</span></a>`:''}</nav>
    </article>`;
    bindPageInteractions();
  }

  function bindPageInteractions() {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = document.querySelectorAll('.reveal:not(.is-visible)');
    if (reduced || !('IntersectionObserver' in window)) items.forEach(el=>el.classList.add('is-visible'));
    else {
      const observer = new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.06});
      items.forEach(el=>observer.observe(el));
    }
    document.querySelector('[data-share]')?.addEventListener('click', async event => {
      try { await navigator.clipboard.writeText(location.href.split('#')[0]); event.currentTarget.textContent='网址已复制'; }
      catch { prompt('复制这个网址：',location.href.split('#')[0]); }
    });
    document.querySelectorAll('[data-lightbox-src]').forEach(button=>button.addEventListener('click',()=>openLightbox(button.dataset.lightboxSrc,button.dataset.lightboxAlt)));
  }
  const lightbox=document.querySelector('[data-lightbox]'), lightboxImage=lightbox.querySelector('img');
  function openLightbox(src,alt){lightboxImage.src=src;lightboxImage.alt=alt||'原图';lightbox.hidden=false;document.body.style.overflow='hidden'}
  function closeLightbox(){lightbox.hidden=true;lightboxImage.removeAttribute('src');document.body.style.overflow=''}
  lightbox.querySelector('[data-lightbox-close]').addEventListener('click',closeLightbox);
  lightbox.addEventListener('click',event=>{if(event.target===lightbox)closeLightbox()});
  addEventListener('keydown',event=>{if(event.key==='Escape'&&!lightbox.hidden)closeLightbox()});

  function route() {
    const match = location.hash.match(/^#\/memory\/(.+)$/);
    if (match) renderMemory(decodeURIComponent(match[1])); else { document.title='高&薯条的剧本回忆'; renderHome(); }
    if (location.hash !== '#directory') scrollTo({top:0,behavior:'instant'});
  }
  addEventListener('hashchange',route);

  function setupPlayer() {
    const host=document.querySelector('[data-player]'), tracks=data.tracks||[];
    if(!tracks.length){host.remove();return}
    host.innerHTML=`<audio preload="metadata"></audio><button class="player-toggle" type="button" aria-label="播放背景音乐"><svg class="icon-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><svg class="icon-pause" viewBox="0 0 24 24"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg></button><div class="player-copy"><span class="player-kicker">正在聆听</span><select aria-label="选择背景音乐">${tracks.map(track=>`<option value="${esc(track.id)}">${esc(track.name)}${track.artist?' · '+esc(track.artist):''}</option>`).join('')}</select></div><label class="volume-wrap"><svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4zm11.5 1.2v3.6c.9-.4 1.5-1.1 1.5-1.8s-.6-1.4-1.5-1.8z"/></svg><input type="range" min="0" max="1" step=".05" aria-label="音量"></label>`;
    const audio=host.querySelector('audio'),button=host.querySelector('button'),select=host.querySelector('select'),volume=host.querySelector('input');
    const saved=localStorage.getItem('memoir.static.track'), chosen=tracks.find(t=>String(t.id)===saved)||tracks.find(t=>t.isDefault)||tracks[0];
    select.value=String(chosen.id);volume.value=localStorage.getItem('memoir.static.volume')||'.45';audio.volume=Number(volume.value);
    const load=(id,restore=true)=>{const track=tracks.find(t=>String(t.id)===String(id));if(!track)return;audio.src=mediaUrl(track.src);localStorage.setItem('memoir.static.track',String(id));if(restore)audio.addEventListener('loadedmetadata',()=>{const time=Number(localStorage.getItem(`memoir.static.time.${id}`));if(time>0&&time<audio.duration-2)audio.currentTime=time},{once:true})};
    load(chosen.id);
    button.addEventListener('click',()=>audio.paused?audio.play().catch(()=>{}):audio.pause());
    select.addEventListener('change',()=>{const playing=!audio.paused;load(select.value);if(playing)audio.play().catch(()=>{})});
    volume.addEventListener('input',()=>{audio.volume=Number(volume.value);localStorage.setItem('memoir.static.volume',volume.value)});
    audio.addEventListener('play',()=>host.classList.add('is-playing'));audio.addEventListener('pause',()=>host.classList.remove('is-playing'));
    audio.addEventListener('ended',()=>{const i=tracks.findIndex(t=>String(t.id)===select.value),next=tracks[(i+1)%tracks.length];select.value=String(next.id);load(next.id,false);audio.play().catch(()=>{})});
    const save=()=>{if(Number.isFinite(audio.currentTime))localStorage.setItem(`memoir.static.time.${select.value}`,String(audio.currentTime))};
    setInterval(save,5000);addEventListener('pagehide',save);
  }
  setupPlayer();
  route();
})();
