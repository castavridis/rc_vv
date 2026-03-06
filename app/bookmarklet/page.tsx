import { headers } from 'next/headers'
import Link from 'next/link'

function buildBookmarklet(origin: string): string {
  const saveUrl = `${origin}/api/save-image`
  const libraryUrl = `${origin}/library`

  const code = `(function(){
var imgs=[],src=window.location.href;
document.querySelectorAll('img').forEach(function(i){if(i.naturalWidth>80)imgs.push(i.src);});
var win=window.open('','_blank','width=520,height=560');
var h='<style>*{font-family:monospace;box-sizing:border-box;margin:0;padding:0}body{padding:16px;background:#fff}h3{font-size:14px;font-weight:700;margin-bottom:12px}#grid{display:flex;flex-wrap:wrap;gap:6px;max-height:220px;overflow-y:auto;margin-bottom:12px}.img{width:80px;height:80px;object-fit:cover;cursor:pointer;border:2px solid transparent;border-radius:4px}.img.sel{border-color:#18181b}label{display:block;font-size:11px;color:#71717a;margin-bottom:4px;margin-top:8px}input,textarea{width:100%;padding:5px 8px;border:1px solid #d4d4d8;border-radius:4px;font:inherit;font-size:12px}#msg{margin-top:8px;font-size:12px;color:#16a34a}#err{margin-top:8px;font-size:12px;color:#dc2626}button{margin-top:10px;width:100%;padding:8px;background:#18181b;color:#fff;border:0;border-radius:4px;font:inherit;font-size:13px;cursor:pointer}button:disabled{opacity:.5}</style>';
h+='<h3>Save to Library</h3><div id="grid">';
imgs.forEach(function(s){h+='<img class="img" src="'+s+'" data-src="'+s+'" onclick="pick(this)"/>';});
h+='</div>';
h+='<label>Title (optional)</label><input id="t" placeholder="leave blank to use site name"/>';
h+='<div id="msg"></div><div id="err"></div><button id="btn" onclick="save()">Save Image</button>';
win.document.write(h);
win._sel=null;
win.pick=function(el){
  win.document.querySelectorAll('.img').forEach(function(i){i.classList.remove('sel');});
  el.classList.add('sel');win._sel=el.dataset.src;
};
win.save=function(){
  if(!win._sel){win.document.getElementById('err').textContent='Pick an image first.';return;}
  win.document.getElementById('err').textContent='';
  win.document.getElementById('btn').disabled=true;
  win.document.getElementById('msg').textContent='Saving…';
  fetch('${saveUrl}',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({image_url:win._sel,source_url:src,title:win.document.getElementById('t').value||undefined})})
  .then(function(r){return r.json();})
  .then(function(d){
    if(d.artworkId){
      win.document.getElementById('msg').innerHTML='Saved! <a href="${libraryUrl}" target="_blank">Open library</a>';
    }else{
      win.document.getElementById('err').textContent='Error: '+(d.error||'unknown');
      win.document.getElementById('btn').disabled=false;
    }
  }).catch(function(e){
    win.document.getElementById('err').textContent='Network error. Are you logged in to ${origin}?';
    win.document.getElementById('btn').disabled=false;
  });
};
})();`

  return `javascript:${encodeURIComponent(code)}`
}

export default async function BookmarkletPage() {
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3001'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const origin = `${proto}://${host}`
  const bookmarklet = buildBookmarklet(origin)

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Link
        href="/library"
        className="text-xs font-mono text-zinc-400 hover:text-zinc-600 mb-8 inline-block"
      >
        ← Library
      </Link>

      <h1 className="text-2xl font-bold font-mono mb-2">Safari Bookmarklet</h1>
      <p className="text-sm text-zinc-500 mb-8">
        Save images from any webpage directly to your library with one click.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
            Step 1 — Add the bookmarklet
          </h2>
          <div className="bg-zinc-50 border border-zinc-200 rounded p-4 space-y-3">
            <p className="text-sm text-zinc-600">
              Drag this button to your Safari bookmarks bar:
            </p>
            <a
              href={bookmarklet}
              className="inline-block px-4 py-2 bg-zinc-800 text-white text-sm font-mono rounded cursor-move select-none"
              onClick={e => e.preventDefault()}
            >
              Save to Library
            </a>
            <p className="text-xs text-zinc-400">
              (If drag-and-drop doesn&apos;t work: bookmark any page, then edit the bookmark&apos;s URL and paste the code below.)
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
            Step 2 — Use it
          </h2>
          <ol className="text-sm text-zinc-600 space-y-2 list-decimal list-inside">
            <li>Navigate to any page with images.</li>
            <li>Click <span className="font-semibold">Save to Library</span> in your bookmarks bar.</li>
            <li>A panel opens showing all images on the page — click one to select it.</li>
            <li>Optionally add a title, then click <span className="font-semibold">Save Image</span>.</li>
            <li>The image is saved to your library. Open it to add metadata and ratings.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
            Bookmarklet code
          </h2>
          <p className="text-xs text-zinc-400 mb-2">Copy this and paste it as a bookmark URL:</p>
          <textarea
            readOnly
            className="w-full h-28 px-3 py-2 border border-zinc-200 rounded text-xs font-mono bg-zinc-50 text-zinc-600 resize-none focus:outline-none"
            defaultValue={bookmarklet}
          />
        </section>
      </div>
    </div>
  )
}
