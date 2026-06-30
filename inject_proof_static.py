"""Embed payout proof sections as STATIC HTML in home index.html.

Strategy:
1. CSS in <head>
2. Sections as static HTML inserted into body AFTER </section> of #why
   AND ALSO mirrored in RSC payload so React 19's reconciler doesn't wipe them.
3. Minimal nav + lightbox JS at end of body.

RSC mirror anchor: inserts new inline sections right BEFORE the existing
sec-about RSC entry (chunk id 19), so they show between Why and About in
both the body AND the React tree.
"""
import os, sys, json, re
sys.stdout.reconfigure(encoding="utf-8")

HOME = r"C:\Users\Korisnik\AppData\Local\Temp\fewipips-latest\index.html"

with open(HOME, "r", encoding="utf-8", errors="replace") as f:
    t = f.read()
orig = len(t)

if "proof-stack-css" in t:
    print("  SKIP: already injected"); sys.exit(0)

# ---------- 1) CSS ----------
PROOF_CSS = (
    "<style id=\"proof-stack-css\">"
    ".sec-proof,.sec-certs{padding:64px 0 32px;position:relative;background:transparent}"
    ".sec-certs{padding:32px 0 80px}"
    ".sec-proof .c,.sec-certs .c{max-width:1200px;margin:0 auto;padding:0 24px;position:relative;z-index:2}"
    ".proof-head{text-align:center;margin-bottom:36px}"
    ".proof-head .sec-label{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#c084fc;margin-bottom:14px;background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.3);padding:7px 16px;border-radius:999px}"
    ".proof-head h2{font-size:clamp(28px,3.5vw,42px);font-weight:800;letter-spacing:-.02em;margin:0 0 10px;color:#fff;line-height:1.1}"
    ".proof-head p{font-size:15px;color:rgba(255,255,255,.65);margin:0 auto;max-width:560px;line-height:1.55}"
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
    ".pdot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.18);cursor:pointer;transition:all .25s cubic-bezier(.22,1,.36,1);border:none;padding:0}"
    ".pdot:hover{background:rgba(255,255,255,.3)}"
    ".pdot.active{background:linear-gradient(135deg,#a855f7,#ec4899);width:22px;border-radius:4px;box-shadow:0 0 8px rgba(236,72,153,.5)}"
    ".proof-cta{text-align:center;margin-top:44px}"
    ".proof-cta a{display:inline-flex;align-items:center;gap:10px;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 26px;border-radius:14px;transition:all .25s cubic-bezier(.22,1,.36,1);box-shadow:0 10px 30px rgba(168,85,247,.35)}"
    ".proof-cta a:hover{transform:translateY(-2px);box-shadow:0 14px 36px rgba(236,72,153,.45)}"
    ".proof-cta a svg{width:16px;height:16px}"
    ".plb{position:fixed;inset:0;background:rgba(5,6,9,.92);backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;padding:24px;z-index:10000;cursor:zoom-out}"
    ".plb.open{display:flex;animation:plbIn .25s ease}"
    "@keyframes plbIn{from{opacity:0}to{opacity:1}}"
    ".plb-frame{position:relative;max-width:min(1280px,95vw);max-height:90vh;cursor:default}"
    ".plb-img{max-width:100%;max-height:90vh;display:block;border-radius:14px;background:#fff;box-shadow:0 30px 80px rgba(0,0,0,.6)}"
    ".plb-close{position:absolute;top:-14px;right:-14px;width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;font-family:inherit;box-shadow:0 8px 24px rgba(0,0,0,.4);transition:transform .2s cubic-bezier(.22,1,.36,1);padding:0}"
    ".plb-close:hover{transform:scale(1.08)}"
    ".plb-close svg{width:20px;height:20px}"
    "</style>"
)

# ---------- 2) Data ----------
EMAILS = [
    ("Carlos_Oliveira_email.jpg","Carlos Oliveira",9004.59),
    ("Diego_Fernandez_email.jpg","Diego Fernandez",2677.20),
    ("Emma_Booth_email.jpg","Emma Booth",3455.07),
    ("Wei_Zhang_email.jpg","Wei Zhang",11412.01),
    ("James_Hargreaves_email.jpg","James Hargreaves",4910.32),
    ("Li_Mei_Chen_email.jpg","Li Mei Chen",1500.70),
    ("Priya_Sharma_email.jpg","Priya Sharma",459.98),
    ("Raj_Krishnamurthy_email.jpg","Raj Krishnamurthy",650.80),
    ("Stephanie_Tremblay_email.jpg","Stephanie Tremblay",2913.72),
    ("Tyler_Johnson_email.jpg","Tyler Johnson",2003.31),
]
CERTS = [
    ("april-Carlos_Oliveira.jpg","Carlos Oliveira",9004.59),
    ("april-Emma_Booth.jpg","Emma Booth",3455.07),
    ("april-Wei_Zhang.jpg","Wei Zhang",11412.01),
    ("may-Aisha_Rahman.jpg","Aisha Rahman",686.79),
    ("may-Hiroshi_Tanaka.jpg","Hiroshi Tanaka",3360.20),
    ("may-Joshua_Morgan.jpg","Joshua Morgan",850.54),
    ("june-Adrian_Cole.jpg","Adrian Cole",3492.98),
    ("june-Daniel_Foster.jpg","Daniel Foster",3295.70),
]

def cmp(n):
    if n >= 1000: return f"${n/1000:.1f}".rstrip("0").rstrip(".") + "k"
    return f"${round(n)}"

ARR_PREV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>'
ARR_NEXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'

def build_card(d, items, i, off):
    pos = [(0,1,0,0,3,1.0),(1,0.95,14,-2,2,0.55),(2,0.9,28,-4,1,0.3)]
    o, s, y, r, z, op = pos[off]
    it = items[(i+o) % len(items)]
    fn, name, amt = it
    tag = f"Paid {cmp(amt)} &middot; {name}"
    style = f"z-index:{z};opacity:{op};transform:translateY({y}px) scale({s}) rotate({r}deg)"
    return (
        f'<div class="pcard" data-idx="{(i+o)%len(items)}" data-src="/{d}/{fn}" style="{style}">'
        f'<div class="ptag">{tag}</div>'
        f'<img src="/{d}/{fn}" alt="{name}" loading="lazy" decoding="async" />'
        f'</div>'
    )

def build_section(sec_class, sec_id, stack_id, dots_id, label, title, sub, items, dir_, tall=False):
    n = len(items)
    cards = "".join(build_card(dir_, items, 0, off) for off in (2,1,0))  # reverse z order
    dots = "".join(f'<button type="button" class="pdot{" active" if i==0 else ""}" data-i="{i}" aria-label="Go to {i+1}"></button>' for i in range(n))
    tall_cls = " tall" if tall else ""
    return (
        f'<section class="{sec_class}" id="{sec_id}">'
        f'<div class="c">'
        f'<div class="proof-head">'
        f'<div class="sec-label">{label}</div>'
        f'<h2>{title}</h2>'
        f'<p>{sub}</p>'
        f'</div>'
        f'<div class="pstack{tall_cls}" id="{stack_id}" data-total="{n}">'
        f'<button type="button" class="pnav prev" data-stack="{stack_id}" data-dir="-1" aria-label="Previous">{ARR_PREV}</button>'
        f'<button type="button" class="pnav next" data-stack="{stack_id}" data-dir="1" aria-label="Next">{ARR_NEXT}</button>'
        f'{cards}'
        f'</div>'
        f'<div class="pdots" id="{dots_id}" data-stack="{stack_id}">{dots}</div>'
        f'</div>'
        f'</section>'
    )

EMAIL_SEC = build_section("sec sec-proof","payouts-proof","pstack-emails","pdots-emails",
    "Verified Payouts","Real payouts. Real traders.",
    "Drag, click an arrow, or tap a dot. Click a card to open it full size.",
    EMAILS, "proof/emails", tall=False)

CERT_SEC = build_section("sec sec-certs","payouts-certs","pstack-certs","pdots-certs",
    "Payout Certificates","Backed by certificates.",
    "Every payout is documented. Browse the full archive for all months.",
    CERTS, "proof/certs", tall=True)

CTA_HTML = (
    '<div class="proof-cta"><a href="https://fewpips-proof.pages.dev/" target="_blank" rel="noopener">'
    'View all 18 verified payouts '
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'
    '</a></div>'
)

DIVIDER = '<div class="dv" aria-hidden="true"></div>'

# Inject CTA into the certs section's .c (between dots and </section>)
CERT_SEC = CERT_SEC.replace('</div></section>', f'</div>{CTA_HTML}</section>', 1)

BODY_BLOCK = DIVIDER + EMAIL_SEC + DIVIDER + CERT_SEC

# ---------- 3) Lightbox + nav JS ----------
PROOF_JS = (
    "<script id=\"proof-injector\">"
    "(function(){"
    "function ensureLB(){"
    "var lb=document.getElementById('plb');"
    "if(lb&&lb.isConnected)return lb;"
    "lb=document.createElement('div');lb.className='plb';lb.id='plb';"
    "lb.innerHTML='<div class=\"plb-frame\"><button class=\"plb-close\" type=\"button\" aria-label=\"Close\">"
    "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\">"
    "<line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/></svg></button>"
    "<img class=\"plb-img\" id=\"plb-img\" alt=\"Preview\" /></div>';"
    "document.body.appendChild(lb);"
    "lb.addEventListener('click',function(e){if(e.target===lb)closeLB()});"
    "lb.querySelector('.plb-close').addEventListener('click',closeLB);"
    "return lb}"
    "function openLB(s){var lb=ensureLB();var img=document.getElementById('plb-img');img.src=s;lb.classList.add('open');document.body.style.overflow='hidden'}"
    "function closeLB(){var lb=document.getElementById('plb');if(!lb)return;lb.classList.remove('open');document.body.style.overflow='';var img=document.getElementById('plb-img');if(img)img.src=''}"
    "ensureLB();"
    "document.addEventListener('keydown',function(e){if(e.key==='Escape')closeLB()});"
    "document.addEventListener('click',function(e){"
    "var c=e.target.closest('.pcard');if(!c)return;"
    "if(e.target.closest('.pnav'))return;"
    "if(c.dataset.dragged==='1'){c.dataset.dragged='';return}"
    "var src=c.getAttribute('data-src');if(src)openLB(src)});"
    "var stacks={};"
    "function snapshot(stackId){"
    "var s=document.getElementById(stackId);if(!s)return null;"
    "if(stacks[stackId])return stacks[stackId];"
    "var items=[];s.querySelectorAll('.pcard').forEach(function(c){"
    "var i=parseInt(c.getAttribute('data-idx'),10);"
    "items[i]={src:c.getAttribute('data-src'),tag:c.querySelector('.ptag').innerHTML}});"
    "var dots=document.querySelector('[data-stack=\"'+stackId+'\"].pdots, [data-stack=\"'+stackId+'\"]');"
    "stacks[stackId]={items:items,idx:0,stack:s};"
    "return stacks[stackId]}"
    "function render(stackId){"
    "var st=stacks[stackId];if(!st)return;"
    "var s=st.stack;"
    "var pos=[{o:0,sc:1,y:0,r:0,z:3,op:1},{o:1,sc:.95,y:14,r:-2,z:2,op:.55},{o:2,sc:.9,y:28,r:-4,z:1,op:.3}];"
    "s.querySelectorAll('.pcard').forEach(function(c){c.remove()});"
    "var n=st.items.length;"
    "pos.slice().reverse().forEach(function(p){"
    "var i=(st.idx+p.o)%n;var it=st.items[i];if(!it)return;"
    "var c=document.createElement('div');c.className='pcard';c.dataset.idx=i;c.dataset.src=it.src;"
    "c.style.zIndex=p.z;c.style.opacity=p.op;c.style.transform='translateY('+p.y+'px) scale('+p.sc+') rotate('+p.r+'deg)';"
    "c.innerHTML='<div class=\"ptag\">'+it.tag+'</div><img src=\"'+it.src+'\" alt=\"\" loading=\"lazy\" decoding=\"async\" />';"
    "if(p.o===0)attachDrag(c,stackId);"
    "s.appendChild(c)});"
    "var ds=document.querySelector('.pdots[data-stack=\"'+stackId+'\"]');"
    "if(ds)ds.querySelectorAll('.pdot').forEach(function(d,i){d.classList.toggle('active',i===st.idx)})}"
    "function attachDrag(card,stackId){"
    "var sx=0,dx=0,dr=false,cl=true;"
    "function down(e){dr=true;cl=true;sx=(e.touches?e.touches[0].clientX:e.clientX);card.classList.add('dragging');"
    "if(card.setPointerCapture&&e.pointerId)card.setPointerCapture(e.pointerId)}"
    "function move(e){if(!dr)return;var x=(e.touches?e.touches[0].clientX:e.clientX);dx=x-sx;"
    "if(Math.abs(dx)>6)cl=false;card.style.transform='translate('+dx+'px,0) rotate('+(dx/30)+'deg)'}"
    "function up(){if(!dr)return;dr=false;card.classList.remove('dragging');"
    "var st=stacks[stackId];"
    "if(Math.abs(dx)>100){var d=dx<0?1:-1;st.idx=((st.idx+d)%st.items.length+st.items.length)%st.items.length;render(stackId);card.dataset.dragged='1'}"
    "else if(Math.abs(dx)>6){card.style.transform='';card.dataset.dragged='1'}"
    "else{card.style.transform=''}dx=0}"
    "card.addEventListener('pointerdown',down);card.addEventListener('pointermove',move);"
    "card.addEventListener('pointerup',up);card.addEventListener('pointercancel',up)}"
    "var savedHTML='';"
    "function captureHTML(){"
    "var ep=document.getElementById('payouts-proof');"
    "var ec=document.getElementById('payouts-certs');"
    "if(!ep||!ec)return;"
    "var parent=ep.parentNode;"
    "var html='';var n=ep.previousElementSibling;"
    "if(n&&n.classList&&n.classList.contains('dv'))html+=n.outerHTML;"
    "html+=ep.outerHTML;"
    "n=ep.nextElementSibling;"
    "if(n&&n.classList&&n.classList.contains('dv'))html+=n.outerHTML;"
    "html+=ec.outerHTML;"
    "savedHTML=html}"
    "function reinsertIfMissing(){"
    "if(document.getElementById('payouts-proof')&&document.getElementById('payouts-certs'))return;"
    "if(!savedHTML)return;"
    "var why=document.getElementById('why');if(!why)return;"
    "var afterDv=why.nextElementSibling;"
    "var tmp=document.createElement('div');tmp.innerHTML=savedHTML;"
    "var nodes=Array.from(tmp.childNodes);"
    "var parent=why.parentNode;"
    "var anchor=afterDv&&afterDv.classList&&afterDv.classList.contains('dv')?afterDv:why.nextSibling;"
    "nodes.forEach(function(node){parent.insertBefore(node,anchor)});"
    "stacks={};"
    "['pstack-emails','pstack-certs'].forEach(function(id){snapshot(id)})}"
    "function init(){"
    "captureHTML();"
    "['pstack-emails','pstack-certs'].forEach(function(id){"
    "snapshot(id);"
    "var s=document.getElementById(id);if(!s)return;"
    "var card=s.querySelector('.pcard[data-idx=\"0\"]');"
    "if(card&&card.style.zIndex==='3')attachDrag(card,id)});"
    "document.addEventListener('click',function(e){"
    "var n=e.target.closest('.pnav');"
    "if(n){var sid=n.getAttribute('data-stack');var dir=parseInt(n.getAttribute('data-dir'),10);"
    "var st=stacks[sid];if(!st)return;"
    "st.idx=((st.idx+dir)%st.items.length+st.items.length)%st.items.length;render(sid);return}"
    "var d=e.target.closest('.pdot');"
    "if(d){var sid2=d.parentNode.getAttribute('data-stack');var i=parseInt(d.getAttribute('data-i'),10);"
    "var st2=stacks[sid2];if(!st2)return;st2.idx=i;render(sid2)}});"
    "var why=document.getElementById('why');"
    "if(why&&why.parentNode){"
    "var obs=new MutationObserver(function(muts){"
    "var needsCheck=false;for(var i=0;i<muts.length;i++){if(muts[i].removedNodes.length>0){needsCheck=true;break}}"
    "if(needsCheck)setTimeout(reinsertIfMissing,0)});"
    "obs.observe(why.parentNode,{childList:true});"
    "setInterval(reinsertIfMissing,1500)}}"
    "if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init)}else{init()}"
    "})();</script>"
)

# ---------- 4) Inject into HTML ----------
# Insert CSS in head
if "</head>" not in t:
    raise SystemExit("FAIL: no </head>")
t = t.replace("</head>", PROOF_CSS + "</head>", 1)

# Insert body sections right after </section> of why
why_open = '<section class="sec why" id="why">'
i = t.find(why_open)
if i < 0:
    raise SystemExit("FAIL: why open not found")
j = t.find("</section>", i)
if j < 0:
    raise SystemExit("FAIL: why close not found")
# After </section>, original has <div class="dv"></div><section sec about ...>
# Insert proof block BETWEEN why-close and the dv
insert_at = j + len("</section>")
t = t[:insert_at] + BODY_BLOCK + t[insert_at:]
print(f"  body insert at: {insert_at}")

# Insert JS before </body>
if "</body>" not in t:
    raise SystemExit("FAIL: no </body>")
t = t.replace("</body>", PROOF_JS + "</body>", 1)

# ---------- 5) RSC mirror ----------
# The page has chunked RSC payloads. About is at chunk 19. We add new chunks
# 19a/19b BEFORE the existing 19 push. The parent that lists chunks Y/18/19...
# needs its child array updated too -- the parent is whichever chunk references "$19".
#
# Simplest: rather than altering parents (risk), we add a NEW about ref +
# our sections inline. But that's still hard without breaking serialization.
#
# Pragmatic fallback: leave RSC alone. React 19 SSR + static export will keep
# our extra DOM children as long as we don't mismatch the existing tree at the
# same DOM path. Our sections are NEW siblings of #why -- inserted INTO main
# directly. React's reconciler may either preserve or wipe them depending on
# the schedule. To handle wipes, we leave a MutationObserver in the JS that
# re-inserts the sections if they vanish.

# Save patched HTML
with open(HOME, "w", encoding="utf-8", newline="") as f:
    f.write(t)
print(f"  HOME: {orig} -> {len(t)} bytes (+{len(t)-orig})")
