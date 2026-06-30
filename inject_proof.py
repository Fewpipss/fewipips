"""Inject email + cert proof sections + lightbox into home index.html via
post-hydration JS. No RSC mirror needed - sections are built after React
mounts, then inserted into the DOM after the #why section."""
import os, sys
sys.stdout.reconfigure(encoding="utf-8")

HOME = r"C:\Users\Korisnik\AppData\Local\Temp\fewipips-latest\index.html"

with open(HOME, "r", encoding="utf-8", errors="replace") as f:
    t = f.read()
orig_len = len(t)

if "proof-stack-css" in t:
    print("  SKIP: proof sections already injected")
    sys.exit(0)

PROOF_CSS = (
    "<style id=\"proof-stack-css\">"
    ".sec-proof,.sec-certs{padding:48px 0 24px;position:relative}"
    ".sec-certs{padding:24px 0 64px}"
    ".sec-proof .c,.sec-certs .c{max-width:1200px;margin:0 auto;padding:0 24px}"
    ".proof-head{text-align:center;margin-bottom:32px}"
    ".proof-head .sec-label{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#a855f7;margin-bottom:12px;background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.25);padding:6px 14px;border-radius:999px}"
    ".proof-head h2{font-size:clamp(28px,3.5vw,42px);font-weight:800;letter-spacing:-.02em;margin:0 0 10px;color:#fff}"
    ".proof-head p{font-size:15px;color:rgba(255,255,255,.65);margin:0;max-width:560px;margin-left:auto;margin-right:auto;line-height:1.55}"
    ".pstack{position:relative;width:100%;max-width:680px;margin:0 auto;aspect-ratio:1152/628;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;touch-action:pan-y}"
    ".pstack.tall{aspect-ratio:1280/900}"
    ".pcard{position:absolute;inset:0;border-radius:20px;overflow:hidden;background:#f5f6fa;box-shadow:0 30px 80px rgba(0,0,0,.55),0 6px 18px rgba(0,0,0,.35);transition:transform .42s cubic-bezier(.22,1,.36,1),opacity .42s cubic-bezier(.22,1,.36,1);cursor:grab;will-change:transform,opacity}"
    ".pstack.tall .pcard{background:#06120a}"
    ".pcard.dragging{cursor:grabbing;transition:none}"
    ".pcard img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;transform:scale(1.015)}"
    ".pcard .ptag{position:absolute;top:12px;left:12px;background:rgba(10,11,15,.85);color:#fff;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:7px 11px;border-radius:8px;z-index:5;pointer-events:none}"
    ".pnav{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;background:rgba(20,22,30,.92);border:1px solid rgba(255,255,255,.1);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:20;transition:all .25s cubic-bezier(.22,1,.36,1);font-family:inherit;padding:0}"
    ".pnav:hover{background:linear-gradient(135deg,#a855f7,#ec4899);border-color:transparent;transform:translateY(-50%) scale(1.08);box-shadow:0 8px 24px rgba(168,85,247,.4)}"
    ".pnav.prev{left:-22px}.pnav.next{right:-22px}"
    ".pnav svg{width:18px;height:18px}"
    "@media(max-width:760px){.pnav.prev{left:-10px}.pnav.next{right:-10px}.pnav{width:38px;height:38px}}"
    ".pdots{display:flex;justify-content:center;gap:7px;margin-top:28px}"
    ".pdot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.15);cursor:pointer;transition:all .25s cubic-bezier(.22,1,.36,1);border:none;padding:0}"
    ".pdot:hover{background:rgba(255,255,255,.3)}"
    ".pdot.active{background:linear-gradient(135deg,#a855f7,#ec4899);width:22px;border-radius:4px;box-shadow:0 0 8px rgba(236,72,153,.5)}"
    ".proof-cta{text-align:center;margin-top:44px}"
    ".proof-cta a{display:inline-flex;align-items:center;gap:10px;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 26px;border-radius:14px;transition:all .25s cubic-bezier(.22,1,.36,1);box-shadow:0 10px 30px rgba(168,85,247,.35)}"
    ".proof-cta a:hover{transform:translateY(-2px);box-shadow:0 14px 36px rgba(236,72,153,.45)}"
    ".proof-cta a svg{width:16px;height:16px}"
    ".plb{position:fixed;inset:0;background:rgba(5,6,9,.92);backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;padding:24px;z-index:10000;cursor:zoom-out;animation:plbIn .25s ease}"
    ".plb.open{display:flex}"
    "@keyframes plbIn{from{opacity:0}to{opacity:1}}"
    ".plb-frame{position:relative;max-width:min(1280px,95vw);max-height:90vh;cursor:default}"
    ".plb-img{max-width:100%;max-height:90vh;display:block;border-radius:14px;background:#fff;box-shadow:0 30px 80px rgba(0,0,0,.6)}"
    ".plb-close{position:absolute;top:-14px;right:-14px;width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;font-family:inherit;box-shadow:0 8px 24px rgba(0,0,0,.4);transition:transform .2s cubic-bezier(.22,1,.36,1);padding:0}"
    ".plb-close:hover{transform:scale(1.08)}"
    ".plb-close svg{width:20px;height:20px}"
    "</style>"
)

PROOF_JS = (
    "<script id=\"proof-injector\">"
    "(function(){"
    "var EMAILS=[" + ",".join([
        '{f:"Carlos_Oliveira_email.jpg",n:"Carlos Oliveira",a:9004.59,m:"april"}',
        '{f:"Diego_Fernandez_email.jpg",n:"Diego Fernandez",a:2677.20,m:"april"}',
        '{f:"Emma_Booth_email.jpg",n:"Emma Booth",a:3455.07,m:"april"}',
        '{f:"Wei_Zhang_email.jpg",n:"Wei Zhang",a:11412.01,m:"april"}',
        '{f:"James_Hargreaves_email.jpg",n:"James Hargreaves",a:4910.32,m:"may"}',
        '{f:"Li_Mei_Chen_email.jpg",n:"Li Mei Chen",a:1500.70,m:"may"}',
        '{f:"Priya_Sharma_email.jpg",n:"Priya Sharma",a:459.98,m:"may"}',
        '{f:"Raj_Krishnamurthy_email.jpg",n:"Raj Krishnamurthy",a:650.80,m:"june"}',
        '{f:"Stephanie_Tremblay_email.jpg",n:"Stephanie Tremblay",a:2913.72,m:"june"}',
        '{f:"Tyler_Johnson_email.jpg",n:"Tyler Johnson",a:2003.31,m:"june"}',
    ]) + "];"
    "var CERTS=[" + ",".join([
        '{f:"april-Carlos_Oliveira.jpg",n:"Carlos Oliveira",a:9004.59,m:"april"}',
        '{f:"april-Emma_Booth.jpg",n:"Emma Booth",a:3455.07,m:"april"}',
        '{f:"april-Wei_Zhang.jpg",n:"Wei Zhang",a:11412.01,m:"april"}',
        '{f:"may-Aisha_Rahman.jpg",n:"Aisha Rahman",a:686.79,m:"may"}',
        '{f:"may-Hiroshi_Tanaka.jpg",n:"Hiroshi Tanaka",a:3360.20,m:"may"}',
        '{f:"may-Joshua_Morgan.jpg",n:"Joshua Morgan",a:850.54,m:"may"}',
        '{f:"june-Adrian_Cole.jpg",n:"Adrian Cole",a:3492.98,m:"june"}',
        '{f:"june-Daniel_Foster.jpg",n:"Daniel Foster",a:3295.70,m:"june"}',
    ]) + "];"
    "function cmp(n){if(n>=1e3)return'$'+(n/1e3).toFixed(1).replace(/\\.0$/,'')+'k';return'$'+Math.round(n)}"
    "function svgArr(d){return '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"'+(d>0?'9 18 15 12 9 6':'15 18 9 12 15 6')+'\"/></svg>'}"
    "function buildStack(opts){"
    "var sec=document.createElement('section');sec.className=opts.secClass;sec.id=opts.secId;"
    "sec.innerHTML='<div class=\"c\"><div class=\"proof-head\"><div class=\"sec-label\">'+opts.label+'</div><h2>'+opts.title+'</h2><p>'+opts.sub+'</p></div>"
    "<div class=\"pstack '+(opts.tall?'tall':'')+'\" id=\"'+opts.stackId+'\">"
    "<button type=\"button\" class=\"pnav prev\" aria-label=\"Previous\">'+svgArr(-1)+'</button>"
    "<button type=\"button\" class=\"pnav next\" aria-label=\"Next\">'+svgArr(1)+'</button>"
    "</div>"
    "<div class=\"pdots\" id=\"'+opts.dotsId+'\"></div></div>';"
    "var state={idx:0,items:opts.items.slice()};"
    "var stack=sec.querySelector('#'+opts.stackId);"
    "var dotsEl=sec.querySelector('#'+opts.dotsId);"
    "function render(){"
    "stack.querySelectorAll('.pcard').forEach(function(c){c.remove()});"
    "var n=state.items.length;"
    "dotsEl.innerHTML='';"
    "for(var i=0;i<n;i++){"
    "var d=document.createElement('button');"
    "d.type='button';d.className='pdot'+(i===state.idx?' active':'');"
    "d.setAttribute('aria-label','Go to '+(i+1));"
    "(function(i){d.addEventListener('click',function(){state.idx=i;render()})})(i);"
    "dotsEl.appendChild(d)}"
    "if(!n)return;"
    "var positions=[{o:0,s:1,y:0,r:0,z:3,op:1},{o:1,s:.95,y:14,r:-2,z:2,op:.55},{o:2,s:.9,y:28,r:-4,z:1,op:.3}];"
    "positions.slice().reverse().forEach(function(p){"
    "var i=(state.idx+p.o)%n;var it=state.items[i];"
    "var card=document.createElement('div');card.className='pcard';"
    "card.style.zIndex=p.z;card.style.opacity=p.op;"
    "card.style.transform='translateY('+p.y+'px) scale('+p.s+') rotate('+p.r+'deg)';"
    "card.innerHTML='<div class=\"ptag\">Paid '+cmp(it.a)+' &middot; '+it.n+'</div>"
    "<img src=\"/'+opts.dir+'/'+it.f+'\" alt=\"'+it.n+'\" loading=\"lazy\" decoding=\"async\" />';"
    "card.dataset.src='/'+opts.dir+'/'+it.f;"
    "if(p.o===0)attachDrag(card,state,render);"
    "stack.appendChild(card)})}"
    "function attachDrag(card,state,render){"
    "var sx=0,dx=0,dragging=false,clicked=true;"
    "function down(e){dragging=true;clicked=true;sx=(e.touches?e.touches[0].clientX:e.clientX);card.classList.add('dragging');"
    "if(card.setPointerCapture&&e.pointerId)card.setPointerCapture(e.pointerId)}"
    "function move(e){if(!dragging)return;var x=(e.touches?e.touches[0].clientX:e.clientX);dx=x-sx;"
    "if(Math.abs(dx)>6)clicked=false;card.style.transform='translate('+dx+'px,0) rotate('+(dx/30)+'deg)'}"
    "function up(){if(!dragging)return;dragging=false;card.classList.remove('dragging');"
    "if(Math.abs(dx)>100){var dir=dx<0?1:-1;state.idx=((state.idx+dir)%state.items.length+state.items.length)%state.items.length;render()}"
    "else if(clicked&&Math.abs(dx)<6){openLB(card.dataset.src);card.style.transform=''}"
    "else{card.style.transform=''}dx=0}"
    "card.addEventListener('pointerdown',down);card.addEventListener('pointermove',move);"
    "card.addEventListener('pointerup',up);card.addEventListener('pointercancel',up)}"
    "sec.querySelectorAll('.pnav').forEach(function(b){b.addEventListener('click',function(){"
    "var isNext=b.classList.contains('next');var n=state.items.length;"
    "state.idx=isNext?(state.idx+1)%n:(state.idx-1+n)%n;render()})});"
    "return {sec:sec,render:render}}"
    "var emails=buildStack({secClass:'sec sec-proof',secId:'payouts-proof',stackId:'pstack-emails',dotsId:'pdots-emails',"
    "label:'Verified Payouts',title:'Real payouts. Real traders.',sub:'Drag, click an arrow, or tap a dot. Click a card to open it full size.',"
    "items:EMAILS,dir:'proof/emails',tall:false});"
    "var certs=buildStack({secClass:'sec sec-certs',secId:'payouts-certs',stackId:'pstack-certs',dotsId:'pdots-certs',"
    "label:'Funded Certificates',title:'Backed by certificates.',sub:'Every payout is documented. Browse the full archive for all months.',"
    "items:CERTS,dir:'proof/certs',tall:true});"
    "var cta=document.createElement('div');cta.className='proof-cta';"
    "cta.innerHTML='<a href=\"https://fewpips-proof.pages.dev/\" target=\"_blank\" rel=\"noopener\">View all 18 verified payouts <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/><polyline points=\"12 5 19 12 12 19\"/></svg></a>';"
    "var lb=document.createElement('div');lb.className='plb';lb.id='plb';"
    "lb.innerHTML='<div class=\"plb-frame\"><button class=\"plb-close\" type=\"button\" aria-label=\"Close\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/></svg></button><img class=\"plb-img\" id=\"plb-img\" alt=\"Preview\" /></div>';"
    "var lbImg;"
    "function openLB(src){lbImg=lbImg||document.getElementById('plb-img');lbImg.src=src;lb.classList.add('open');document.body.style.overflow='hidden'}"
    "function closeLB(){lb.classList.remove('open');document.body.style.overflow='';if(lbImg)lbImg.src=''}"
    "lb.addEventListener('click',function(e){if(e.target===lb)closeLB()});"
    "lb.querySelector('.plb-close').addEventListener('click',closeLB);"
    "document.addEventListener('keydown',function(e){if(e.key==='Escape')closeLB()});"
    "function insert(){"
    "if(document.getElementById('payouts-proof'))return;"
    "var why=document.getElementById('why');"
    "if(!why){setTimeout(insert,200);return}"
    "var afterWhy=why.nextElementSibling;"
    "why.parentNode.insertBefore(emails.sec,afterWhy);"
    "var divEl=document.createElement('div');divEl.className='dv';divEl.setAttribute('aria-hidden','true');"
    "why.parentNode.insertBefore(divEl,afterWhy);"
    "why.parentNode.insertBefore(certs.sec,afterWhy);"
    "var ctaWrap=document.createElement('div');ctaWrap.appendChild(cta);"
    "certs.sec.querySelector('.c').appendChild(cta);"
    "document.body.appendChild(lb);"
    "emails.render();certs.render()}"
    "if(document.readyState==='complete'||document.readyState==='interactive'){setTimeout(insert,300)}"
    "else{document.addEventListener('DOMContentLoaded',function(){setTimeout(insert,300)})}"
    "})();</script>"
)

if "</head>" not in t:
    raise SystemExit("FAIL: </head> not found")
if "</body>" not in t:
    raise SystemExit("FAIL: </body> not found")

t = t.replace("</head>", PROOF_CSS + "</head>", 1)
t = t.replace("</body>", PROOF_JS + "</body>", 1)

with open(HOME, "w", encoding="utf-8", newline="") as f:
    f.write(t)
print(f"  HOME: {orig_len} -> {len(t)} bytes (+{len(t)-orig_len})")
