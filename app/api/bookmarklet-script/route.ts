import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const saveUrl = `${origin}/api/save-image`
  const libraryUrl = `${origin}/library`
  const librariesUrl = `${origin}/api/libraries`
  const updateRatingsUrl = `${origin}/api/update-ratings`
  const tok = request.nextUrl.searchParams.get('tok') ?? ''

  const script = `(function(){
  var rcTok=${JSON.stringify(tok)};
  var pageUrl=window.location.href;
  var saveUrl=${JSON.stringify(saveUrl)};
  var libUrl=${JSON.stringify(libraryUrl)};
  var librariesUrl=${JSON.stringify(librariesUrl)};
  var libraries=[];
  var selectedLibraryId=null;
  var updateRatingsUrl=${JSON.stringify(updateRatingsUrl)};

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

  var parsers={
    'agi.co':{
      getSrc:function(img){
        var lazy=img.getAttribute('data-src')||img.getAttribute('data-lazy-src')||'';
        if(lazy)return lazy;
        var ss=img.getAttribute('data-srcset')||img.srcset||'';
        if(ss){
          var best=ss.split(',').map(function(e){var p=e.trim().split(/\\s+/);return{src:p[0],w:parseInt(p[1])||0};}).sort(function(a,b){return b.w-a.w;})[0];
          if(best&&best.src)return best.src;
        }
        return img.src||'';
      },
      getMeta:function(img){
        var title=img.getAttribute('alt')||'';
        var artist='';
        var el=img.parentElement;
        for(var i=0;i<8&&el;i++){
          if(!title){var h=el.querySelector('h1,h2,h3,.title,.name');if(h)title=h.textContent.trim().slice(0,120);}
          if(!artist){var a=el.querySelector('.artist,.author,.designer,.by');if(a)artist=a.textContent.trim().slice(0,100);}
          el=el.parentElement;
        }
        return{title:title,artist:artist,year:''};
      }
    },
    'designreviewed.com':{
      getSrc:function(img){
        var lazy=img.getAttribute('data-src')||img.getAttribute('data-lazy')||'';
        if(lazy)return lazy;
        return img.src||'';
      },
      getMeta:function(img){
        var title=img.getAttribute('alt')||img.getAttribute('title')||'';
        var artist='';
        var el=img.parentElement;
        for(var i=0;i<6&&el;i++){
          if(!title){var h=el.querySelector('h1,h2,h3,h4,.entry-title');if(h)title=h.textContent.trim().slice(0,120);}
          el=el.parentElement;
        }
        return{title:title,artist:artist,year:''};
      }
    }
  };

  var hostname=(function(){try{return new URL(pageUrl).hostname.replace(/^www\\./,'');}catch(e){return'';}})();
  var activeParser=parsers[hostname]||null;
  var activeSrc=activeParser?activeParser.getSrc:getBestSrc;
  var activeMeta=activeParser?activeParser.getMeta:getMeta;

  var seen={};
  var imgs=[];
  document.querySelectorAll('img').forEach(function(img){
    if(img.naturalWidth>80||img.width>80){
      var src=activeSrc(img);
      if(src&&src.indexOf('data:')<0&&!seen[src]){seen[src]=true;imgs.push({el:img,src:src});}
    }
  });

  if(!imgs.length){alert('No large images found on this page.');return;}

  var dims=['Sincerity','Excitement','Competence','Sophistication','Ruggedness'];
  var dimData={
    Sincerity:{'Down-to-Earth':['Down-to-Earth','Family Oriented','Small-Town'],Honest:['Honest','Sincere','Real'],Wholesome:['Wholesome','Original'],Cheerful:['Cheerful','Sentimental','Friendly']},
    Excitement:{Daring:['Daring','Trendy','Exciting'],Spirited:['Spirited','Cool','Young'],Imaginative:['Imaginative','Unique'],'Up-to-Date':['Up-to-Date','Independent','Contemporary']},
    Competence:{Reliable:['Reliable','Hard Working','Secure'],Intelligent:['Intelligent','Technical','Corporate'],Successful:['Successful','Leader','Confident']},
    Sophistication:{'Upper Class':['Upper Class','Glamorous','Good Looking'],Charming:['Charming','Feminine','Smooth']},
    Ruggedness:{Outdoorsy:['Outdoorsy','Masculine','Western'],Tough:['Tough','Rugged']}
  };

  var dimTraits={};
  dims.forEach(function(d){
    dimTraits[d]=[];
    Object.values(dimData[d]).forEach(function(arr){dimTraits[d]=dimTraits[d].concat(arr);});
  });

  var lpWidth=540;

  var state=imgs.map(function(im,i){
    var m=activeMeta(im.el);
    var ratings={};
    dims.forEach(function(d){
      var traits={};
      dimTraits[d].forEach(function(t){traits[t]={score:0,reason:''};});
      ratings[d]={score:0,reason:'',traits:traits};
    });
    return{id:i,src:im.src,sel:false,title:m.title,creator:m.artist,year:m.year,context:'',medium:'',tags:'',status:'idle',err:'',ratings:ratings,artworkId:null};
  });

  var expanded={};
  var activeId=null;
  var autoSaveTimers={};

  function scheduleAutoSave(id){
    clearTimeout(autoSaveTimers[id]);
    autoSaveTimers[id]=setTimeout(function(){doAutoSave(id);},800);
  }

  function doAutoSave(id){
    var item=state.find(function(s){return s.id===id;});
    if(!item||!item.artworkId)return;
    fetch(updateRatingsUrl,{
      method:'POST',credentials:'include',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+rcTok},
      body:JSON.stringify({artwork_id:item.artworkId,ratings:item.ratings})
    }).catch(function(){});
  }
  
  function renderLibrarySelect(){render();}

  fetch(librariesUrl,{credentials:'include',headers:{'Authorization':'Bearer '+rcTok}})
    .then(function(r){return r.json();})
    .then(function(d){if(Array.isArray(d)){libraries=d;selectedLibraryId=d[0]&&d[0].id||null;renderLibrarySelect();}})
    .catch(function(){});

  var win=window.open('','_blank','width=1100,height=800,resizable=yes,location=no');
  var doc=win.document;

  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  function render(){
    var sel=state.filter(function(s){return s.sel&&s.status!=='saved';});
    var saved=state.filter(function(s){return s.status==='saved';}).length;
    var unsaved=state.filter(function(s){return s.sel&&s.status!=='saved';}).length;
    var busy=state.some(function(s){return s.status==='saving';});
    var h='<!DOCTYPE html><html><head><meta charset="utf-8"><title>facets collector</title><style>';
    h+='*{box-sizing:border-box;margin:0;padding:0;font-family:monospace;font-size:12px}';
    h+='body{background:#fff;display:flex;flex-direction:column;height:100vh;overflow:hidden}';
    h+='.hd{padding:10px 12px;border-bottom:1px solid #e4e4e7;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}';
    h+='.hd-left{display:flex;align-items:center;gap:6px}';
    h+='.hd h3{font-size:13px;font-weight:700}';
    h+='.parser-badge{font-size:9px;background:#f4f4f5;border-radius:2px;padding:1px 5px;color:#71717a;margin-left:6px}';
    h+='.btns{display:flex;gap:6px}';
    h+='button{padding:4px 10px;border:1px solid #d4d4d8;border-radius:3px;background:#fff;font:inherit;cursor:pointer}';
    h+='button.pri{background:#18181b;color:#fff;border-color:#18181b}';
    h+='button:disabled{opacity:.4;cursor:default}';
    h+='.bd{flex:1;display:flex;flex-direction:row;overflow:hidden}';
    h+='.lp{width:'+lpWidth+'px;border-right:1px solid #e4e4e7;overflow-y:auto;padding:10px 12px;flex-shrink:0}';
    h+='.rs{width:5px;cursor:col-resize;flex-shrink:0;background:#e4e4e7}';
    h+='.rs:hover,.rs.dragging{background:#a1a1aa}';
    h+='.rp{flex:1;overflow-y:auto;padding:10px 12px}';
    h+='.grid{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start}';
    h+='.thumb{position:relative;width:120px;height:120px;overflow:hidden;border-radius:3px;cursor:pointer;border:2px solid transparent;background:#f4f4f5}';
    h+='.thumb.sel{border-color:#18181b}';
    h+='.thumb.active{height:auto;border-color:#18181b}';
    h+='.thumb img{width:100%;height:100%;object-fit:cover;display:block}';
    h+='.thumb.active img{height:auto;object-fit:unset}';
    h+='.ck{position:absolute;top:2px;right:2px;width:15px;height:15px;background:#18181b;border-radius:2px;color:#fff;font-size:9px;display:flex;align-items:center;justify-content:center}';
    h+='.empty{color:#a1a1aa;padding:24px 0;text-align:center}';
    h+='.row{border:1px solid #e4e4e7;border-radius:4px;margin-bottom:7px;overflow:hidden;cursor:pointer}';
    h+='.row.active{border-color:#18181b}';
    h+='.img-cover{width:100%;height:16px;background-size:cover;background-position:center;background-color:#f4f4f5}';
    h+='.flds{padding:6px 8px;display:flex;flex-direction:column;gap:4px}';
    h+='input[type=text],textarea{width:100%;padding:3px 5px;border:1px solid #d4d4d8;border-radius:3px;font:inherit}';
    h+='textarea{resize:none;height:42px}';
    h+='.fr{display:flex;gap:4px}';
    h+='.dims{padding:0 8px 6px}';
    h+='.dim-hd{display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer;border-top:1px solid #f4f4f5}';
    h+='.dim-name{flex:0 0 100px;font-size:10px;font-weight:700;color:#3f3f46}';
    h+='.dim-toggle{font-size:9px;color:#a1a1aa;width:10px;flex-shrink:0}';
    h+='.dim-score-wrap{display:flex;align-items:center;gap:4px;flex:1}';
    h+='.score-num{width:36px;padding:2px 4px;border:1px solid #d4d4d8;border-radius:3px;font:inherit;text-align:center}';
    h+='.reason-in{flex:1;padding:2px 5px;border:1px solid #d4d4d8;border-radius:3px;font:inherit}';
    h+='.traits-wrap{padding:2px 0 4px 16px}';
    h+='.trait-row{display:flex;align-items:center;gap:6px;padding:2px 0}';
    h+='.trait-name{flex:0 0 110px;font-size:9px;color:#71717a}';
    h+='.st{font-size:10px;padding:4px 8px}';
    h+='.sv{color:#71717a}.ok{color:#16a34a}.er{color:#dc2626}';
    h+='.ft{padding:8px 12px;border-top:1px solid #e4e4e7;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}';
    h+='.ft-left{display:flex;align-items:center;gap:8px}';
    h+='.ft span{color:#71717a}.ft a{color:#18181b}';
    h+='</style></head><body>';
    h+='<div class="hd">';
    h+='<div class="hd-left"><h3>facets collector</h3>'+(activeParser?'<span class="parser-badge">'+esc(hostname)+'</span>':'')+' </div>';
    h+='<div class="btns">';
    h+='<button onclick="openLib()">Open Library \u2197</button>';
    h+='<button onclick="selAll()">Select All</button>';
    h+='<button class="pri" onclick="doSave()"'+(unsaved===0||busy?' disabled':'')+'>Save Selected ('+unsaved+')</button>';
    h+='</div></div>';
    h+='<div style="padding:6px 12px;border-bottom:1px solid #e4e4e7;display:flex;align-items:center;gap:8px">';
    h+='<span style="font-size:10px;color:#71717a">Library:</span>';
    h+='<select onchange="selectedLibraryId=this.value||null" style="font:inherit;font-size:11px;border:1px solid #d4d4d8;border-radius:3px;padding:2px 4px">';
    h+='<option value="">— none —</option>';
    libraries.forEach(function(lib){
      h+='<option value="'+esc(lib.id)+'"'+(selectedLibraryId===lib.id?' selected':'')+'>'+esc(lib.name)+'</option>';
    });
    h+='</select>';
    var dimCounts={};
    dims.forEach(function(d){dimCounts[d]=0;});
    state.forEach(function(s){
      if(s.status==='saved'){
        dims.forEach(function(d){if(s.ratings[d].score>=4)dimCounts[d]++;});
      }
    });
    h+='<span style="margin-left:auto;display:flex;gap:6px">';
    dims.forEach(function(d){
      var c=dimCounts[d];
      h+='<span style="font-size:9px;color:'+(c>0?'#18181b':'#a1a1aa')+'" title="'+d+': '+c+' rated 4/5">'+d.slice(0,3)+' <b>'+c+'</b></span>';
    });
    h+='</span>';
    h+='</div>';
    h+='<div class="bd"><div class="lp"><div class="grid">';
    state.forEach(function(s){
      var isActive=(s.id===activeId);
      var isSaved=(s.status==='saved');
      h+='<div class="thumb'+(s.sel?' sel':'')+(isActive?' active':'')+(isSaved?' saved':'')+'" onclick="tog('+s.id+')"'+(isSaved?' style="opacity:0.4;pointer-events:none"':'')+'>';
      if(isActive){
        h+='<img src="'+esc(s.src)+'" style="width:100%;height:auto;object-fit:unset" onerror="this.parentNode.style.display=\\'none\\'">';
      }else{
        h+='<img src="'+esc(s.src)+'" onerror="this.parentNode.style.display=\\'none\\'">';
      }
      if(s.sel)h+='<div class="ck">&#10003;</div>';
      h+='</div>';
    });
    h+='</div></div><div class="rs"></div>';
    h+='<div class="rp">';
    if(!sel.length){
      h+='<div class="empty">Click images on the left to select</div>';
    }else{
      sel.forEach(function(s){
        var dis=(s.status==='saved'||s.status==='saving')?' disabled':'';
        var isActive=(s.id===activeId);
        h+='<div class="row'+(isActive?' active':'')+'" onclick="setActive('+s.id+')">';
        h+='<div class="img-cover" style="background-image:url(\\''+esc(s.src)+'\\')"></div>';
        h+='<div class="flds">';
        h+='<input type="text" placeholder="Title" value="'+esc(s.title)+'" oninput="upd('+s.id+',\\'title\\',this.value)" onclick="event.stopPropagation()"'+dis+'>';
        h+='<div class="fr">';
        h+='<input type="text" style="flex:0 0 56px" placeholder="Year" value="'+esc(s.year)+'" oninput="upd('+s.id+',\\'year\\',this.value)" onclick="event.stopPropagation()"'+dis+'>';
        h+='<input type="text" style="flex:1" placeholder="Creator(s)" value="'+esc(s.creator)+'" oninput="upd('+s.id+',\\'creator\\',this.value)" onclick="event.stopPropagation()"'+dis+'>';
        h+='</div>';
        h+='<textarea placeholder="Additional context\u2026" oninput="upd('+s.id+',\\'context\\',this.value)" onclick="event.stopPropagation()"'+dis+'>'+esc(s.context)+'</textarea>';
        h+='<div class="fr">';
        h+='<input type="text" style="flex:1" placeholder="Medium (e.g. oil, digital)" value="'+esc(s.medium)+'" oninput="upd('+s.id+',\\'medium\\',this.value)" onclick="event.stopPropagation()"'+dis+'>';
        h+='<input type="text" style="flex:1" placeholder="Tags (comma-separated)" value="'+esc(s.tags)+'" oninput="upd('+s.id+',\\'tags\\',this.value)" onclick="event.stopPropagation()"'+dis+'>';
        h+='</div>';
        h+='</div>';
        h+='<div class="dims">';
        dims.forEach(function(d){
          var dr=s.ratings[d];
          var key=s.id+'_'+d;
          var open=!!expanded[key];
          h+='<div class="dim-hd" onclick="togDim('+s.id+',\\''+d+'\\');event.stopPropagation()">';
          h+='<span class="dim-toggle">'+(open?'&#9660;':'&#9658;')+'</span>';
          h+='<span class="dim-name">'+d+'</span>';
          h+='<div class="dim-score-wrap">';
          h+='<input class="score-num" type="number" min="0" max="5" step="1" value="'+dr.score+'" oninput="updDS('+s.id+',\\''+d+'\\',this.value)" onclick="event.stopPropagation()"'+dis+'>';
          h+='<textarea class="reason-in" placeholder="Reason\u2026" oninput="updDR('+s.id+',\\''+d+'\\',this.value)" onclick="event.stopPropagation()"'+dis+' style="height:32px;resize:vertical">'+esc(dr.reason)+'</textarea>';
          h+='</div></div>';
          if(open){
            h+='<div class="traits-wrap">';
            dimTraits[d].forEach(function(t){
              var tr=dr.traits[t]||{score:0,reason:''};
              var applies=tr.score>=1;
              h+='<div class="trait-row">';
              h+='<span class="trait-name">'+esc(t)+'</span>';
              h+='<label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;flex-shrink:0" onclick="event.stopPropagation()">';
              h+='<input type="checkbox" '+(applies?'checked ':'')+' onchange="updTS('+s.id+',\\''+d+'\\',\\''+esc(t)+'\\',this.checked?1:0);event.stopPropagation()" style="accent-color:#18181b;width:14px;height:14px"'+dis+'>';
              h+='<span style="font-size:9px;color:'+(applies?'#18181b':'#a1a1aa')+'">'+(applies?'\u2713':'\u2013')+'</span>';
              h+='</label>';
              h+='<textarea class="reason-in" placeholder="Reason\u2026" oninput="updTR('+s.id+',\\''+d+'\\',\\''+esc(t)+'\\',this.value)" onclick="event.stopPropagation()"'+dis+' style="height:24px;resize:vertical;font-size:9px">'+esc(tr.reason)+'</textarea>';
              h+='</div>';
            });
            h+='</div>';
          }
        });
        h+='</div>';
        if(s.status==='saving')h+='<div class="st sv">Saving\u2026</div>';
        else if(s.status==='saved')h+='<div class="st ok">Saved \u2713</div>';
        else if(s.status==='error')h+='<div class="st er">'+esc(s.err)+'</div>';
        h+='</div>';
      });
    }
    h+='</div></div>';
    h+='<div class="ft">';
    h+='<div class="ft-left"><button onclick="refreshGallery()">\u21bb Refresh</button><span>'+(state.length-saved)+' found &middot; '+saved+' saved</span></div>';
    if(saved)h+='<a href="'+libUrl+'" target="_blank">Open Library \u2192</a>';
    h+='</div></body></html>';
    doc.open();doc.write(h);doc.close();
    var lpEl=doc.querySelector('.lp');
    var rsEl=doc.querySelector('.rs');
    if(rsEl){rsEl.onmousedown=function(e){
      e.preventDefault();rsEl.classList.add('dragging');
      var startX=e.clientX,startW=lpEl.offsetWidth;
      function mv(e){var w=Math.max(120,Math.min(550,startW+e.clientX-startX));lpEl.style.width=w+'px';lpWidth=w;}
      function up(){rsEl.classList.remove('dragging');doc.removeEventListener('mousemove',mv);doc.removeEventListener('mouseup',up);}
      doc.addEventListener('mousemove',mv);
      doc.addEventListener('mouseup',up);
    };}
    var activeThumb=doc.querySelector('.thumb.active');
    if(activeThumb)activeThumb.scrollIntoView({block:'nearest'});
    win.openLib=function(){window.open(libUrl,'_blank');};
    win.tog=function(id){state.forEach(function(s){if(s.id===id&&s.status!=='saved')s.sel=!s.sel;});render();};
    win.selAll=function(){state.forEach(function(s){if(s.status!=='saved')s.sel=true;});render();};
    win.upd=function(id,k,v){state.forEach(function(s){if(s.id===id)s[k]=v;});};
    win.togDim=function(id,dim){var key=id+'_'+dim;expanded[key]=!expanded[key];render();};
    win.setActive=function(id){activeId=(activeId===id)?null:id;render();};
    win.updDS=function(id,dim,v){
      var s=Math.max(0,Math.min(5,Number(v)||0));
      state.forEach(function(item){
        if(item.id!==id)return;
        item.ratings[dim].score=s;
      });
      scheduleAutoSave(id);
    };
    win.updDR=function(id,dim,v){
      state.forEach(function(item){if(item.id===id)item.ratings[dim].reason=v;});
      scheduleAutoSave(id);
    };
    win.updTS=function(id,dim,trait,v){
      var s=Number(v)>=1?1:0;
      state.forEach(function(item){if(item.id===id)item.ratings[dim].traits[trait].score=s;});
      scheduleAutoSave(id);
      render();
    };
    win.updTR=function(id,dim,trait,v){
      state.forEach(function(item){if(item.id===id)item.ratings[dim].traits[trait].reason=v;});
      scheduleAutoSave(id);
    };
    win.refreshGallery=function(){
      var newImgs=[];
      try{
        win.opener.document.querySelectorAll('img').forEach(function(img){
          if(img.naturalWidth>80){
            var src=activeSrc(img);
            if(src&&src.indexOf('data:')<0&&!seen[src]){seen[src]=true;newImgs.push({el:img,src:src});}
          }
        });
      }catch(e){}
      if(newImgs.length){
        var startId=state.length;
        newImgs.forEach(function(im,i){
          var m=activeMeta(im.el);
          var ratings={};
          dims.forEach(function(d){
            var traits={};
            dimTraits[d].forEach(function(t){traits[t]={score:0,reason:''};});
            ratings[d]={score:0,reason:'',traits:traits};
          });
          state.push({id:startId+i,src:im.src,sel:false,title:m.title,creator:m.artist,year:m.year,context:'',medium:'',tags:'',status:'idle',err:'',ratings:ratings,artworkId:null});
        });
        render();
      }
    };
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
          headers:{'Content-Type':'application/json','Authorization':'Bearer '+rcTok},
          body:JSON.stringify({image_url:item.src,source_url:pageUrl,title:item.title||undefined,artist:item.creator||undefined,year:item.year||undefined,context:item.context||undefined,medium:item.medium||undefined,tags:item.tags?item.tags.split(',').map(function(t){return t.trim();}).filter(Boolean):undefined,ratings:item.ratings,library_id:selectedLibraryId||undefined})
        }).then(function(r){return r.json();}).then(function(d){
          if(d.artworkId){item.status='saved';item.artworkId=d.artworkId;}
          else{item.status='error';item.err=d.error||'Unknown error';}
          render();next();
        }).catch(function(){item.status='error';item.err='Network error';render();next();});
      }
      next();
    };
  }

  render();

  win.addEventListener('beforeunload',function(e){
    var hasUnsaved=state.some(function(s){return s.sel&&s.status!=='saved';});
    if(hasUnsaved){e.preventDefault();e.returnValue='';}
  });
})();`

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  })
}
