import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const saveUrl = `${origin}/api/save-image`
  const libraryUrl = `${origin}/library`

  const script = `(function(){
  var pageUrl=window.location.href;
  var saveUrl=${JSON.stringify(saveUrl)};
  var libUrl=${JSON.stringify(libraryUrl)};

  function getBestSrc(img){
    var lazy=img.getAttribute('data-src')||img.getAttribute('data-lazy-src')||img.getAttribute('data-original')||'';
    var ss=img.srcset||img.getAttribute('data-srcset')||'';
    if(!ss&&img.parentElement&&img.parentElement.tagName==='PICTURE'){
      var s=img.parentElement.querySelector('source[srcset]');
      if(s)ss=s.srcset;
    }
    if(ss){
      var best=ss.split(',').map(function(e){var p=e.trim().split(/\\s+/);return{src:p[0],w:parseInt(p[1])||0};}).sort(function(a,b){return b.w-a.w;})[0];
      if(best&&best.src)return best.src;
    }
    return lazy||img.src||'';
  }

  function getMeta(img){
    var title=img.getAttribute('data-title')||img.getAttribute('data-name')||img.alt||'';
    var artist=img.getAttribute('data-artist')||img.getAttribute('data-author')||img.getAttribute('data-designer')||'';
    var year=img.getAttribute('data-year')||img.getAttribute('data-date')||'';
    var el=img.parentElement;
    for(var i=0;i<6&&el;i++){
      if(!title){var cap=el.querySelector('figcaption');if(cap)title=cap.textContent.trim().split('\\n')[0].trim();}
      if(!title){var hh=el.querySelector('h1,h2,h3,h4');if(hh&&hh.textContent.trim().length<120)title=hh.textContent.trim();}
      if(!title)title=el.getAttribute('data-title')||el.getAttribute('data-name')||'';
      if(!artist)artist=el.getAttribute('data-artist')||el.getAttribute('data-author')||el.getAttribute('data-designer')||'';
      if(!year)year=el.getAttribute('data-year')||el.getAttribute('data-date')||'';
      el=el.parentElement;
    }
    if(!title||!artist){
      document.querySelectorAll('script[type="application/ld+json"]').forEach(function(s){
        try{
          var d=JSON.parse(s.textContent);
          if(!title)title=d.name||d.headline||'';
          if(!artist){var a=d.author||d.creator;if(a)artist=typeof a==='string'?a:(a.name||'');}
          if(!year&&d.datePublished)year=d.datePublished.slice(0,4);
        }catch(e){}
      });
    }
    var ym=(year||'').match(/[0-9]{4}/);
    return{title:title.trim().slice(0,120),artist:artist.trim().slice(0,100),year:ym?ym[0]:''};
  }

  var seen={};
  var imgs=[];
  document.querySelectorAll('img').forEach(function(img){
    if(img.naturalWidth>80||img.width>80){
      var src=getBestSrc(img);
      if(src&&src.indexOf('data:')<0&&!seen[src]){seen[src]=true;imgs.push({el:img,src:src});}
    }
  });

  if(!imgs.length){alert('No large images found on this page.');return;}

  var state=imgs.map(function(im,i){
    var m=getMeta(im.el);
    return{id:i,src:im.src,sel:false,title:m.title,artist:m.artist,year:m.year,status:'idle',err:''};
  });

  var win=window.open('','_blank','width=600,height=720,resizable=yes');
  var doc=win.document;

  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  function render(){
    var sel=state.filter(function(s){return s.sel;});
    var saved=state.filter(function(s){return s.status==='saved';}).length;
    var busy=state.some(function(s){return s.status==='saving';});
    var h='<!DOCTYPE html><html><head><meta charset="utf-8"><style>';
    h+='*{box-sizing:border-box;margin:0;padding:0;font-family:monospace;font-size:12px}';
    h+='body{background:#fff;display:flex;flex-direction:column;height:100vh;overflow:hidden}';
    h+='.hd{padding:10px 12px;border-bottom:1px solid #e4e4e7;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}';
    h+='.hd h3{font-size:13px;font-weight:700}';
    h+='.btns{display:flex;gap:6px}';
    h+='button{padding:4px 10px;border:1px solid #d4d4d8;border-radius:3px;background:#fff;font:inherit;cursor:pointer}';
    h+='button.pri{background:#18181b;color:#fff;border-color:#18181b}';
    h+='button:disabled{opacity:.4;cursor:default}';
    h+='.ga{padding:10px 12px;border-bottom:1px solid #e4e4e7;flex-shrink:0;max-height:220px;overflow-y:auto}';
    h+='.grid{display:flex;flex-wrap:wrap;gap:5px}';
    h+='.thumb{position:relative;width:72px;height:72px;cursor:pointer;border-radius:3px;overflow:hidden;border:2px solid transparent}';
    h+='.thumb.sel{border-color:#18181b}';
    h+='.thumb img{width:100%;height:100%;object-fit:cover;display:block}';
    h+='.ck{position:absolute;top:2px;right:2px;width:15px;height:15px;background:#18181b;border-radius:2px;color:#fff;font-size:9px;display:flex;align-items:center;justify-content:center}';
    h+='.fa{flex:1;overflow-y:auto;padding:10px 12px}';
    h+='.empty{color:#a1a1aa;padding:24px 0;text-align:center}';
    h+='.row{border:1px solid #e4e4e7;border-radius:4px;padding:8px;margin-bottom:7px}';
    h+='.ri{display:flex;gap:8px;align-items:flex-start}';
    h+='.ri>img{width:44px;height:44px;object-fit:cover;border-radius:2px;flex-shrink:0}';
    h+='.flds{flex:1;display:flex;flex-direction:column;gap:4px}';
    h+='input[type=text]{width:100%;padding:3px 5px;border:1px solid #d4d4d8;border-radius:3px;font:inherit}';
    h+='.fr{display:flex;gap:4px}';
    h+='.fr input:first-child{flex:0 0 56px}';
    h+='.st{font-size:10px;margin-top:3px}';
    h+='.sv{color:#71717a}.ok{color:#16a34a}.er{color:#dc2626}';
    h+='.ft{padding:8px 12px;border-top:1px solid #e4e4e7;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}';
    h+='.ft span{color:#71717a}.ft a{color:#18181b}';
    h+='</style></head><body>';
    h+='<div class="hd"><h3>Save to Library</h3><div class="btns">';
    h+='<button onclick="selAll()">Select All</button>';
    h+='<button class="pri" onclick="doSave()"'+(sel.length===0||busy?' disabled':'')+'>Save Selected ('+sel.length+')</button>';
    h+='</div></div>';
    h+='<div class="ga"><div class="grid">';
    state.forEach(function(s){
      h+='<div class="thumb'+(s.sel?' sel':'')+'" onclick="tog('+s.id+')">';
      h+='<img src="'+esc(s.src)+'" onerror="this.parentNode.style.display=\\'none\\'">';
      if(s.sel)h+='<div class="ck">&#10003;</div>';
      h+='</div>';
    });
    h+='</div></div>';
    h+='<div class="fa">';
    if(!sel.length){
      h+='<div class="empty">Click images above to select</div>';
    }else{
      sel.forEach(function(s){
        var dis=(s.status==='saved'||s.status==='saving')?' disabled':'';
        h+='<div class="row"><div class="ri">';
        h+='<img src="'+esc(s.src)+'">';
        h+='<div class="flds">';
        h+='<input type="text" placeholder="Title" value="'+esc(s.title)+'" oninput="upd('+s.id+',\\'title\\',this.value)"'+dis+'>';
        h+='<div class="fr">';
        h+='<input type="text" placeholder="Year" value="'+esc(s.year)+'" oninput="upd('+s.id+',\\'year\\',this.value)"'+dis+'>';
        h+='<input type="text" placeholder="Artist / Designer" value="'+esc(s.artist)+'" oninput="upd('+s.id+',\\'artist\\',this.value)"'+dis+'>';
        h+='</div>';
        if(s.status==='saving')h+='<div class="st sv">Saving\u2026</div>';
        else if(s.status==='saved')h+='<div class="st ok">Saved \u2713</div>';
        else if(s.status==='error')h+='<div class="st er">'+esc(s.err)+'</div>';
        h+='</div></div></div>';
      });
    }
    h+='</div>';
    h+='<div class="ft"><span>'+state.length+' found &middot; '+saved+' saved</span>';
    if(saved)h+='<a href="'+libUrl+'" target="_blank">Open Library \u2192</a>';
    h+='</div></body></html>';
    doc.open();doc.write(h);doc.close();
    win.tog=function(id){state.forEach(function(s){if(s.id===id&&s.status!=='saved')s.sel=!s.sel;});render();};
    win.selAll=function(){state.forEach(function(s){if(s.status!=='saved')s.sel=true;});render();};
    win.upd=function(id,k,v){state.forEach(function(s){if(s.id===id)s[k]=v;});};
    win.doSave=function(){
      var q=state.filter(function(s){return s.sel&&s.status==='idle';});
      if(!q.length)return;
      var i=0;
      function next(){
        if(i>=q.length){render();return;}
        var item=q[i++];
        item.status='saving';render();
        fetch(saveUrl,{
          method:'POST',credentials:'include',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({image_url:item.src,source_url:pageUrl,title:item.title||undefined,artist:item.artist||undefined,year:item.year||undefined})
        }).then(function(r){return r.json();}).then(function(d){
          if(d.artworkId){item.status='saved';}
          else{item.status='error';item.err=d.error||'Unknown error';}
          render();next();
        }).catch(function(){item.status='error';item.err='Network error';render();next();});
      }
      next();
    };
  }

  render();
})();`

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  })
}
