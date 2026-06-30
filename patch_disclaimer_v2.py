"""Disclaimer at end of CFG/Challenges pricing table (LEFT side rules area),
small left-aligned text. Uses post-hydration JS injection with persistent
MutationObserver+interval so React can't permanently wipe it.

Also: Futures leverage 1:20 row direct-edit in chunk (data array) so it
sticks naturally."""
import os, sys, json
sys.stdout.reconfigure(encoding="utf-8")

ROOT = r"C:\Users\Korisnik\AppData\Local\Temp\fewipips-latest"
HOME = os.path.join(ROOT, "index.html")
FUTURES = os.path.join(ROOT, "futures", "index.html")
FUT_CHUNK = os.path.join(ROOT, "_next", "static", "chunks", "0uj1y.q_i1wzs.js")

DISCLAIMER_HTML = (
    'Please read our <a href="https://www.fewpips.com/legal">Trading Rules</a> '
    'and <a href="https://www.fewpips.com/terms">Terms &amp; Conditions</a> '
    'before placing your first trade. It is your responsibility as the account holder '
    'to understand and comply with the Fewpips rules under which your account is evaluated.'
)

INJECT = (
    '<style id="cfg-disclaimer-css">'
    '.cfg-body{position:relative}'
    '.cfg-body-disclaimer{font-size:11px;color:rgba(255,255,255,.45);text-align:left;margin:24px 0 0;padding:0;line-height:1.5;max-width:none}'
    '.cfg-body-disclaimer a{color:rgba(255,255,255,.62);text-decoration:underline}'
    '.cfg-body-disclaimer a:hover{color:#fff}'
    '.cfg-section-foot{padding:0 24px;max-width:1280px;margin:0 auto}'
    '</style>'
    '<script id="cfg-disclaimer-js">'
    '(function(){'
    'var TEXT=' + json.dumps(DISCLAIMER_HTML) + ';'
    'function inject(){'
    'var bodies=document.querySelectorAll(".cfg-body");'
    'bodies.forEach(function(body){'
    'var sec=body.closest("section");if(!sec)return;'
    'var c=body.closest(".c")||sec.querySelector(":scope > .c");'
    'if(!c)c=body.parentNode;'
    'if(c.querySelector(":scope > .cfg-body-disclaimer"))return;'
    'var p=document.createElement("p");p.className="cfg-body-disclaimer";p.innerHTML=TEXT;'
    'if(body.nextSibling){c.insertBefore(p,body.nextSibling)}else{c.appendChild(p)}'
    '})}'
    'function go(){inject()}'
    'if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",function(){setTimeout(go,300)})}'
    'else{setTimeout(go,300)}'
    'var obs=new MutationObserver(function(){go()});'
    'obs.observe(document.body,{childList:true,subtree:true});'
    'setInterval(go,2000);'
    '})();</script>'
)

def patch_page(path, name):
    with open(path, "r", encoding="utf-8") as f:
        h = f.read()
    if "cfg-disclaimer-css" in h:
        print(f"  {name}: already patched"); return
    h = h.replace("</body>", INJECT + "</body>", 1)
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(h)
    print(f"  {name}: patched ({len(h)} bytes)")

def patch_futures_leverage_chunk():
    with open(FUT_CHUNK, "r", encoding="utf-8") as f:
        c = f.read()
    if 'name:"Leverage",value:"1:20"' in c:
        print("  FUT CHUNK: leverage already present"); return
    # Insert leverage entry before each {name:"EAs",...}
    old = '{name:"EAs"'
    new = '{name:"Leverage",value:"1:20",highlight:!0},{name:"EAs"'
    cnt = c.count(old)
    c = c.replace(old, new)
    with open(FUT_CHUNK, "w", encoding="utf-8", newline="") as f:
        f.write(c)
    print(f"  FUT CHUNK: leverage added at {cnt} location(s)")

patch_page(HOME, "HOME")
patch_page(FUTURES, "FUTURES")
patch_futures_leverage_chunk()
print("Done.")
