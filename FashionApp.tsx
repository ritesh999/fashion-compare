"use client";
// components/FashionApp.tsx

import { useState, useRef, useEffect, useCallback } from "react";
import type { RetailerProduct, AgentStep } from "@/types/fashion";

// ─── Constants ────────────────────────────────────────────────────────────────
const RETAILERS = ["ASOS","Zalando","Zara","H&M","Uniqlo","Mango","Shein","Pull&Bear"];
const R_META: Record<string, { color: string; light: string; logo: string }> = {
  "ASOS":      { color:"#1A1A2E", light:"#e8f4f8", logo:"AS" },
  "Zalando":   { color:"#FF6900", light:"#fff3ec", logo:"ZA" },
  "Zara":      { color:"#2C2C2C", light:"#f5f5f5", logo:"ZR" },
  "H&M":       { color:"#D10024", light:"#ffeef0", logo:"HM" },
  "Uniqlo":    { color:"#E60012", light:"#fff0f0", logo:"UQ" },
  "Mango":     { color:"#8B5A00", light:"#fdf5e8", logo:"MG" },
  "Shein":     { color:"#18A565", light:"#edfbf3", logo:"SH" },
  "Pull&Bear": { color:"#4A3728", light:"#f5ede8", logo:"PB" },
};
const TRENDING = [
  "blue slim jeans","white linen shirt","black leather jacket",
  "floral midi dress","beige trench coat","oversized hoodie",
  "wide leg trousers","ankle boots women","knit cardigan",
];

// ─── SSE hook — streams from /api/search ────────────────────────────────────
function useSearch() {
  const [logs, setLogs]       = useState<AgentStep[]>([]);
  const [results, setResults] = useState<RetailerProduct[]>([]);
  const [status, setStatus]   = useState<"idle"|"running"|"done"|"error">("idle");
  const [searchCount, setSearchCount] = useState(0);

  const run = useCallback(async (query: string) => {
    setStatus("running");
    setLogs([{ type:"init", text:`Searching for "${query}"…` }]);
    setResults([]);
    setSearchCount(0);

    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!res.ok || !res.body) {
      setLogs(p => [...p, { type:"error", text:`HTTP ${res.status}` }]);
      setStatus("error");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split("\n\n");
      buf = parts.pop() ?? "";

      for (const chunk of parts) {
        const line = chunk.replace(/^data: /, "").trim();
        if (!line) continue;
        try {
          const evt = JSON.parse(line);
          if (evt.type === "search") setSearchCount(c => c + 1);
          if (evt.type === "done" && evt.results) {
            setResults(evt.results);
            setStatus("done");
          }
          if (evt.type === "error") setStatus("error");
          setLogs(p => [...p, { type: evt.type, text: evt.text }]);
        } catch {}
      }
    }
  }, []);

  return { logs, results, status, searchCount, run };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Stars({ rating = 0 }: { rating?: number }) {
  return (
    <span style={{display:"flex",gap:2,alignItems:"center"}}>
      {[1,2,3,4,5].map(s => (
        <svg key={s} width="11" height="11" viewBox="0 0 24 24"
          fill={s<=Math.round(rating)?"#F59E0B":"none"}
          stroke="#F59E0B" strokeWidth="2.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
      <span style={{fontSize:11,color:"#94a3b8",marginLeft:3}}>{(rating||0).toFixed(1)}</span>
    </span>
  );
}

function StatCard({ label, value, sub, accent }: { label:string; value:string; sub?:string; accent:string }) {
  return (
    <div style={{background:"#fff",borderRadius:16,padding:"18px 20px",border:"1.5px solid #e2e8f0",
      boxShadow:"0 2px 12px rgba(0,0,0,.05)",borderTop:`3px solid ${accent}`}}>
      <div style={{fontSize:10,color:"#94a3b8",letterSpacing:"1.5px",textTransform:"uppercase",fontFamily:"monospace",marginBottom:6}}>{label}</div>
      <div style={{fontSize:24,fontWeight:900,letterSpacing:"-1px",fontFamily:"'Playfair Display',Georgia,serif",color:accent}}>{value}</div>
      {sub && <div style={{fontSize:11,color:"#64748b",marginTop:3}}>{sub}</div>}
    </div>
  );
}

function ProductCard({ product, rank, avgPrice }: { product:RetailerProduct; rank:number; avgPrice:number }) {
  const [hov, setHov] = useState(false);
  const m = R_META[product.retailer] || { color:"#666", light:"#f5f5f5", logo:"??" };
  const savings = avgPrice - product.price;
  const savingsPct = Math.round((savings / avgPrice) * 100);
  const isTop = rank === 0;

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:"#fff",border:isTop?`2px solid ${m.color}`:hov?"2px solid #cbd5e1":"2px solid #f1f5f9",
        borderRadius:20,overflow:"hidden",transition:"all .25s ease",
        transform:hov?"translateY(-4px)":"none",
        boxShadow:isTop?`0 8px 32px ${m.color}22,0 2px 8px rgba(0,0,0,.08)`:hov?"0 12px 40px rgba(0,0,0,.12)":"0 2px 8px rgba(0,0,0,.05)",
        position:"relative",animation:"slideUp .4s ease both"}}>

      {/* Header band */}
      <div style={{background:isTop?`linear-gradient(135deg,${m.color},${m.color}cc)`:`linear-gradient(135deg,${m.light},#fff)`,
        padding:"20px 22px 16px",position:"relative"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div style={{width:42,height:42,borderRadius:12,background:isTop?"rgba(255,255,255,.2)":m.color,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:13,fontWeight:900,color:"#fff",fontFamily:"'Playfair Display',Georgia,serif"}}>{m.logo}</div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
            {isTop&&<span style={{fontSize:9,fontWeight:800,letterSpacing:"1.5px",textTransform:"uppercase",background:"rgba(255,255,255,.25)",color:"#fff",padding:"3px 9px",borderRadius:20,backdropFilter:"blur(8px)"}}>🏆 Best Price</span>}
            {product.badge&&<span style={{fontSize:9,fontWeight:800,letterSpacing:"1.5px",textTransform:"uppercase",background:product.badge==="Sale"?"#ef4444":product.badge==="New In"?"#8b5cf6":"#f59e0b",color:"#fff",padding:"3px 9px",borderRadius:20}}>{product.badge}</span>}
          </div>
        </div>
        <div style={{fontSize:12,fontWeight:800,letterSpacing:"1px",textTransform:"uppercase",color:isTop?"rgba(255,255,255,.7)":m.color,fontFamily:"monospace"}}>{product.retailer}</div>
      </div>

      {/* Body */}
      <div style={{padding:"16px 22px 20px"}}>
        <div style={{fontSize:14,fontWeight:700,color:"#0f172a",lineHeight:1.4,marginBottom:6,fontFamily:"'Playfair Display',Georgia,serif"}}>{product.name}</div>
        <div style={{fontSize:11.5,color:"#64748b",lineHeight:1.5,marginBottom:14,minHeight:34}}>{product.description}</div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <Stars rating={product.rating}/>
          <span style={{fontSize:10.5,color:"#94a3b8"}}>{(product.reviewCount||0).toLocaleString()} reviews</span>
        </div>

        {/* Price */}
        <div style={{background:isTop?`${m.color}08`:"#f8fafc",border:`1px solid ${isTop?m.color+"22":"#e2e8f0"}`,borderRadius:12,padding:"12px 14px",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:4}}>
            <span style={{fontSize:28,fontWeight:900,letterSpacing:"-1px",color:isTop?m.color:"#0f172a",fontFamily:"'Playfair Display',Georgia,serif"}}>€{(product.price||0).toFixed(2)}</span>
            {product.originalPrice&&<span style={{fontSize:13,color:"#94a3b8",textDecoration:"line-through"}}>€{product.originalPrice.toFixed(2)}</span>}
          </div>
          {savings>0.5&&<div style={{fontSize:11,fontWeight:700,color:"#22c55e"}}>↓ €{savings.toFixed(2)} cheaper than average ({savingsPct}% off avg)</div>}
          {savings<-0.5&&<div style={{fontSize:11,fontWeight:600,color:"#94a3b8"}}>€{Math.abs(savings).toFixed(2)} above average</div>}
        </div>

        {/* Sizes */}
        {(product.sizes||[]).length>0&&(
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,color:"#94a3b8",letterSpacing:"1px",textTransform:"uppercase",marginBottom:6}}>Sizes</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {(product.sizes||[]).slice(0,7).map(sz=>(
                <span key={sz} style={{fontSize:10.5,border:"1.5px solid #e2e8f0",color:"#475569",padding:"3px 9px",borderRadius:6,fontWeight:600,fontFamily:"monospace"}}>{sz}</span>
              ))}
              {(product.sizes?.length||0)>7&&<span style={{fontSize:10.5,color:"#94a3b8",alignSelf:"center"}}>+{product.sizes!.length-7}</span>}
            </div>
          </div>
        )}

        <button onClick={()=>product.url&&window.open(product.url,"_blank")}
          style={{width:"100%",padding:"11px 0",background:hov||isTop?m.color:"transparent",border:`2px solid ${m.color}`,
            borderRadius:10,color:hov||isTop?"#fff":m.color,fontSize:12,fontWeight:800,
            letterSpacing:"1.5px",textTransform:"uppercase",cursor:"pointer",transition:"all .2s ease",fontFamily:"monospace"}}>
          Shop on {product.retailer} →
        </button>
      </div>
    </div>
  );
}

function PriceChart({ products }: { products: RetailerProduct[] }) {
  const sorted = [...products].sort((a,b)=>a.price-b.price);
  const min = Math.min(...sorted.map(p=>p.price));
  const max = Math.max(...sorted.map(p=>p.price));
  return (
    <div style={{background:"#fff",borderRadius:20,padding:"24px 28px",border:"1.5px solid #e2e8f0",boxShadow:"0 2px 16px rgba(0,0,0,.06)"}}>
      <div style={{fontSize:12,fontWeight:800,letterSpacing:"1.5px",textTransform:"uppercase",color:"#64748b",marginBottom:20,fontFamily:"monospace"}}>Price Comparison Chart</div>
      {sorted.map((p,i)=>{
        const m=R_META[p.retailer]||{color:"#666"};
        const pct=((p.price-min)/(max-min||1))*70+30;
        const isMin=i===0;
        return(
          <div key={p.retailer} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
            <div style={{width:72,fontSize:10.5,color:m.color,fontWeight:700,fontFamily:"monospace",textAlign:"right",flexShrink:0}}>{p.retailer}</div>
            <div style={{flex:1,height:28,background:"#f1f5f9",borderRadius:8,overflow:"hidden",position:"relative"}}>
              <div style={{width:`${pct}%`,height:"100%",background:isMin?"linear-gradient(90deg,#22c55e,#4ade80)":`linear-gradient(90deg,${m.color}66,${m.color})`,
                borderRadius:8,animation:"growBar 1s ease both",animationDelay:`${i*80}ms`,
                display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:10}}>
                {pct>45&&<span style={{fontSize:10,fontWeight:800,color:"#fff",fontFamily:"monospace"}}>€{p.price.toFixed(2)}</span>}
              </div>
              {pct<=45&&<span style={{position:"absolute",left:`${pct}%`,top:"50%",transform:"translateY(-50%)",marginLeft:8,fontSize:10,fontWeight:800,color:"#0f172a",fontFamily:"monospace"}}>€{p.price.toFixed(2)}</span>}
            </div>
            {isMin&&<span style={{fontSize:10,fontWeight:800,color:"#22c55e",flexShrink:0}}>BEST</span>}
          </div>
        );
      })}
      <style>{`@keyframes growBar{from{width:0!important}to{}}`}</style>
    </div>
  );
}

// ─── Main app ────────────────────────────────────────────────────────────────
export default function FashionApp() {
  const { logs, results, status, searchCount, run } = useSearch();
  const [screen, setScreen]   = useState<"home"|"searching"|"results">("home");
  const [query, setQuery]     = useState("");
  const [inputVal, setInputVal] = useState("");
  const [sortBy, setSortBy]   = useState("price_asc");
  const [filterRetailer, setFilterRetailer] = useState("All");
  const [filterSize, setFilterSize]         = useState("All");
  const [maxPrice, setMaxPrice] = useState(300);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if(logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [logs]);
  useEffect(() => { if(status==="done") setTimeout(()=>setScreen("results"),500); }, [status]);

  const doSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    setQuery(q.trim());
    setInputVal(q.trim());
    setScreen("searching");
    run(q.trim());
  }, [run]);

  // Derived
  const prices = results.map(p=>p.price).filter(Boolean);
  const avgPrice = prices.length ? prices.reduce((a,b)=>a+b,0)/prices.length : 0;
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxFound = prices.length ? Math.max(...prices) : 0;
  const allSizes = [...new Set(results.flatMap(p=>p.sizes||[]))].sort();

  const filtered = results
    .filter(p => filterRetailer==="All"||p.retailer===filterRetailer)
    .filter(p => filterSize==="All"||(p.sizes||[]).includes(filterSize))
    .filter(p => (p.price||0)<=maxPrice);

  const sorted = [...filtered].sort((a,b) => {
    if(sortBy==="price_asc")  return (a.price||0)-(b.price||0);
    if(sortBy==="price_desc") return (b.price||0)-(a.price||0);
    if(sortBy==="rating")     return (b.rating||0)-(a.rating||0);
    if(sortBy==="savings")    return (b.originalPrice?b.originalPrice-b.price:0)-(a.originalPrice?a.originalPrice-a.price:0);
    return 0;
  });

  const globalStyle = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Space+Grotesk:wght@400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes blink{0%,80%,100%{opacity:.15}40%{opacity:1}}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:4px}
    input:focus,select:focus,button:focus{outline:none}
  `;

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (screen === "home") return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#fefce8 0%,#fff7ed 40%,#fdf4ff 100%)",fontFamily:"'Playfair Display',Georgia,serif",position:"relative",overflow:"hidden"}}>
      <style>{globalStyle}</style>
      <div style={{position:"absolute",top:-120,right:-80,width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,#fbbf2466 0%,transparent 70%)",animation:"float 6s ease-in-out infinite"}}/>
      <div style={{position:"absolute",bottom:-100,left:-60,width:350,height:350,borderRadius:"50%",background:"radial-gradient(circle,#a78bfa33 0%,transparent 70%)",animation:"float 8s ease-in-out infinite reverse"}}/>

      <nav style={{padding:"20px 48px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,background:"#0f172a",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#fbbf24"}}>F</div>
          <span style={{fontSize:18,fontWeight:700,color:"#0f172a",letterSpacing:"-0.5px"}}>Fash<span style={{color:"#f59e0b"}}>Price</span></span>
        </div>
        <div style={{fontSize:11,color:"#94a3b8",fontFamily:"'Space Grotesk',sans-serif",letterSpacing:"1px",textTransform:"uppercase"}}>Powered by Claude AI</div>
      </nav>

      <div style={{maxWidth:780,margin:"0 auto",padding:"60px 24px 80px",textAlign:"center",position:"relative",zIndex:10}}>
        <div style={{display:"inline-block",background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.3)",borderRadius:20,padding:"5px 16px",fontSize:11.5,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",color:"#d97706",fontFamily:"'Space Grotesk',sans-serif",marginBottom:28,animation:"slideUp .5s ease"}}>
          8 Retailers · Live AI Search · Real Prices
        </div>
        <h1 style={{fontSize:"clamp(44px,7vw,80px)",fontWeight:900,lineHeight:1.0,letterSpacing:"-3px",color:"#0f172a",marginBottom:20,animation:"slideUp .5s .1s ease both"}}>
          Find the <em style={{color:"#f59e0b",fontStyle:"italic"}}>best price</em><br/>on any fashion item
        </h1>
        <p style={{fontSize:17,color:"#64748b",lineHeight:1.6,maxWidth:480,margin:"0 auto 40px",fontFamily:"'Space Grotesk',sans-serif",fontWeight:400,animation:"slideUp .5s .2s ease both"}}>
          Our AI agent searches ASOS, Zalando, Zara, H&M, Uniqlo, Mango, Shein and more — instantly comparing prices so you always buy at the best deal.
        </p>

        {/* Search */}
        <div style={{maxWidth:600,margin:"0 auto 28px",background:"#fff",border:"2px solid #e2e8f0",borderRadius:20,display:"flex",alignItems:"center",padding:"6px 6px 6px 24px",boxShadow:"0 8px 48px rgba(0,0,0,.10)",animation:"slideUp .5s .3s ease both"}}>
          <svg style={{flexShrink:0,marginRight:12}} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={inputVal} onChange={e=>setInputVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch(inputVal)}
            placeholder='Try "blue slim jeans" or "white sneakers"…'
            style={{flex:1,border:"none",background:"transparent",fontSize:16,color:"#0f172a",fontFamily:"'Space Grotesk',sans-serif",padding:"10px 0"}}/>
          <button onClick={()=>doSearch(inputVal)} disabled={!inputVal.trim()}
            style={{padding:"13px 28px",background:"#0f172a",color:"#fbbf24",border:"none",borderRadius:14,fontSize:13,fontWeight:800,letterSpacing:"0.5px",cursor:inputVal.trim()?"pointer":"not-allowed",fontFamily:"'Space Grotesk',sans-serif",transition:"all .2s",whiteSpace:"nowrap",opacity:inputVal.trim()?1:0.5}}>
            Compare Prices →
          </button>
        </div>

        <div style={{animation:"slideUp .5s .4s ease both"}}>
          <span style={{fontSize:11,color:"#94a3b8",fontFamily:"'Space Grotesk',sans-serif",letterSpacing:"1px",textTransform:"uppercase",marginRight:12}}>Trending:</span>
          {TRENDING.slice(0,6).map(t=>(
            <button key={t} onClick={()=>doSearch(t)} style={{background:"rgba(15,23,42,.06)",border:"none",borderRadius:20,padding:"6px 14px",color:"#475569",fontSize:12,cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif",fontWeight:500,marginRight:8,marginBottom:8,transition:"all .15s"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="rgba(15,23,42,.12)"}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="rgba(15,23,42,.06)"}}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{borderTop:"1px solid rgba(15,23,42,.08)",background:"rgba(255,255,255,.5)",backdropFilter:"blur(12px)",padding:"24px 0",position:"relative",zIndex:10}}>
        <div style={{maxWidth:860,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center",flexWrap:"wrap",gap:8}}>
          <span style={{fontSize:11,color:"#94a3b8",fontFamily:"'Space Grotesk',sans-serif",letterSpacing:"1px",textTransform:"uppercase",marginRight:16}}>Comparing</span>
          {RETAILERS.map(r=>{
            const m=R_META[r]||{color:"#666",light:"#f5f5f5",logo:"??"};
            return(
              <div key={r} style={{display:"flex",alignItems:"center",gap:7,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"7px 14px"}}>
                <div style={{width:22,height:22,borderRadius:6,background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:900,color:"#fff"}}>{m.logo}</div>
                <span style={{fontSize:12,fontWeight:700,color:"#334155",fontFamily:"'Space Grotesk',sans-serif"}}>{r}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── SEARCHING ─────────────────────────────────────────────────────────────
  if (screen === "searching") return (
    <div style={{minHeight:"100vh",background:"#0a0907",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Space Grotesk',sans-serif"}}>
      <style>{globalStyle}</style>
      <div style={{width:"100%",maxWidth:560,padding:"0 24px"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{width:64,height:64,border:"3px solid rgba(245,158,11,.15)",borderTop:"3px solid #f59e0b",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 24px"}}/>
          <div style={{fontSize:11,color:"#4a4540",letterSpacing:"3px",textTransform:"uppercase",marginBottom:12}}>AI Agent Active</div>
          <h2 style={{fontSize:26,fontWeight:800,color:"#e4ddd5",letterSpacing:"-1px",marginBottom:8,fontFamily:"'Playfair Display',Georgia,serif"}}>Searching for "{query}"</h2>
          <p style={{fontSize:13,color:"#5a5550"}}>{searchCount} searches fired across {RETAILERS.length} retailers</p>
        </div>
        <div ref={logRef} style={{background:"#060504",border:"1px solid rgba(255,255,255,.07)",borderRadius:16,padding:"20px",maxHeight:300,overflowY:"auto",fontFamily:"monospace",fontSize:12,lineHeight:1.9}}>
          <div style={{color:"#2e2b27",marginBottom:10,fontSize:10}}>▸ POST /api/search → SSE stream</div>
          {logs.map((l,i)=>(
            <div key={i} style={{display:"flex",gap:10,animation:"fadeIn .3s ease",color:l.type==="search"?"#a8d4a8":l.type==="found"?"#4a7a4a":l.type==="done"?"#22c55e":l.type==="error"?"#ef4444":"#5a7a8a"}}>
              <span style={{flexShrink:0}}>{l.type==="search"?"⌕":l.type==="found"?"✓":l.type==="done"?"✓✓":l.type==="error"?"✗":"→"}</span>
              <span>{l.text}</span>
            </div>
          ))}
          <div style={{display:"flex",gap:4,marginTop:8}}>
            {[0,1,2].map(i=><div key={i} style={{width:4,height:4,borderRadius:"50%",background:"#f59e0b",animation:`blink 1.2s ${i*.2}s infinite`}}/>)}
          </div>
        </div>
      </div>
    </div>
  );

  // ── RESULTS ───────────────────────────────────────────────────────────────
  const best = sorted[0];
  const bestM = best ? R_META[best.retailer]||{color:"#0f172a"} : null;

  return (
    <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"'Space Grotesk',sans-serif"}}>
      <style>{globalStyle}</style>

      {/* Header */}
      <header style={{position:"sticky",top:0,zIndex:100,background:"rgba(255,255,255,.95)",backdropFilter:"blur(16px)",borderBottom:"1px solid #e2e8f0",padding:"12px 32px",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
        <button onClick={()=>{setScreen("home");setInputVal("");setFilterRetailer("All");setFilterSize("All");setMaxPrice(300);setSortBy("price_asc");}}
          style={{display:"flex",alignItems:"center",gap:8,background:"none",border:"none",cursor:"pointer",padding:"6px 10px",borderRadius:8,transition:"background .15s"}}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="#f1f5f9"}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}>
          <div style={{width:30,height:30,background:"#0f172a",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fbbf24"}}>F</div>
          <span style={{fontSize:15,fontWeight:700,color:"#0f172a",letterSpacing:"-0.5px"}}>Fash<span style={{color:"#f59e0b"}}>Price</span></span>
        </button>

        <div style={{flex:1,minWidth:200,maxWidth:440,display:"flex",alignItems:"center",background:"#f1f5f9",border:"1.5px solid #e2e8f0",borderRadius:12,padding:"0 16px",gap:10}}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={inputVal} onChange={e=>setInputVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch(inputVal)}
            style={{flex:1,border:"none",background:"transparent",fontSize:13,color:"#0f172a",padding:"9px 0",fontFamily:"'Space Grotesk',sans-serif"}}/>
          <button onClick={()=>doSearch(inputVal)} style={{background:"#0f172a",color:"#fbbf24",border:"none",borderRadius:8,padding:"5px 14px",fontSize:11,fontWeight:800,cursor:"pointer"}}>Search</button>
        </div>
        <span style={{marginLeft:"auto",fontSize:11,color:"#94a3b8",letterSpacing:"1px",textTransform:"uppercase"}}>{results.length} retailers · {searchCount} searches</span>
      </header>

      <div style={{maxWidth:1400,margin:"0 auto",padding:"28px 24px 60px"}}>
        {/* Title */}
        <div style={{marginBottom:28,animation:"slideUp .4s ease"}}>
          <div style={{fontSize:11,color:"#94a3b8",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:8}}>Comparing prices for</div>
          <div style={{display:"flex",alignItems:"baseline",gap:16,flexWrap:"wrap"}}>
            <h1 style={{fontSize:"clamp(28px,4vw,44px)",fontWeight:900,letterSpacing:"-1.5px",color:"#0f172a",fontFamily:"'Playfair Display',Georgia,serif"}}>"{query}"</h1>
            <span style={{fontSize:11,color:"#64748b",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:20,padding:"4px 14px",fontWeight:600}}>{filtered.length} of {results.length} retailers shown</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:28,animation:"slideUp .4s .1s ease both"}}>
          <StatCard label="Best Price"    value={`€${minPrice.toFixed(2)}`}   sub={results.find(p=>p.price===minPrice)?.retailer} accent="#22c55e"/>
          <StatCard label="Highest Price" value={`€${maxFound.toFixed(2)}`}   sub={results.find(p=>p.price===maxFound)?.retailer} accent="#ef4444"/>
          <StatCard label="Average Price" value={`€${avgPrice.toFixed(2)}`}   sub={`${results.length} retailers`}                 accent="#f59e0b"/>
          <StatCard label="Max Savings"   value={`€${(maxFound-minPrice).toFixed(2)}`} sub={`${Math.round(((maxFound-minPrice)/maxFound)*100)}% spread`} accent="#8b5cf6"/>
        </div>

        {/* Layout */}
        <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:24,alignItems:"start",animation:"slideUp .4s .2s ease both"}}>
          
          {/* Sidebar */}
          <div style={{background:"#fff",borderRadius:20,padding:"22px",border:"1.5px solid #e2e8f0",boxShadow:"0 2px 12px rgba(0,0,0,.05)",position:"sticky",top:76}}>
            <div style={{fontSize:12,fontWeight:800,letterSpacing:"1px",textTransform:"uppercase",color:"#0f172a",marginBottom:20}}>Filter & Sort</div>

            <div style={{marginBottom:20}}>
              <label style={{fontSize:11,color:"#94a3b8",letterSpacing:"1px",textTransform:"uppercase",display:"block",marginBottom:8}}>Sort by</label>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{width:"100%",background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"9px 12px",fontSize:13,color:"#0f172a",cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif"}}>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="rating">Best Rated</option>
                <option value="savings">Biggest Discount</option>
              </select>
            </div>

            <div style={{marginBottom:20}}>
              <label style={{fontSize:11,color:"#94a3b8",letterSpacing:"1px",textTransform:"uppercase",display:"block",marginBottom:8}}>Retailer</label>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {["All",...RETAILERS].map(r=>{
                  const m=R_META[r];
                  return(
                    <button key={r} onClick={()=>setFilterRetailer(r)} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",borderRadius:10,border:"1.5px solid",borderColor:filterRetailer===r?(m?.color||"#0f172a"):"#e2e8f0",background:filterRetailer===r?(m?.light||"#f1f5f9"):"transparent",cursor:"pointer",transition:"all .15s",textAlign:"left"}}>
                      {m&&<div style={{width:16,height:16,borderRadius:4,background:m.color,flexShrink:0}}/>}
                      <span style={{fontSize:12,fontWeight:filterRetailer===r?700:500,color:filterRetailer===r?(m?.color||"#0f172a"):"#475569"}}>{r}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {allSizes.length>0&&(
              <div style={{marginBottom:20}}>
                <label style={{fontSize:11,color:"#94a3b8",letterSpacing:"1px",textTransform:"uppercase",display:"block",marginBottom:8}}>Size</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {["All",...allSizes].map(sz=>(
                    <button key={sz} onClick={()=>setFilterSize(sz)} style={{padding:"5px 10px",borderRadius:7,border:"1.5px solid",borderColor:filterSize===sz?"#0f172a":"#e2e8f0",background:filterSize===sz?"#0f172a":"transparent",color:filterSize===sz?"#fbbf24":"#475569",fontSize:11,fontWeight:filterSize===sz?800:500,cursor:"pointer",fontFamily:"monospace",transition:"all .15s"}}>{sz}</button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label style={{fontSize:11,color:"#94a3b8",letterSpacing:"1px",textTransform:"uppercase",display:"block",marginBottom:8}}>Max Price: <span style={{color:"#0f172a",fontWeight:800}}>€{maxPrice}</span></label>
              <input type="range" min={10} max={500} step={5} value={maxPrice} onChange={e=>setMaxPrice(Number(e.target.value))} style={{width:"100%",accentColor:"#f59e0b",cursor:"pointer"}}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><span style={{fontSize:10,color:"#94a3b8"}}>€10</span><span style={{fontSize:10,color:"#94a3b8"}}>€500</span></div>
            </div>

            {(filterRetailer!=="All"||filterSize!=="All"||maxPrice!==300)&&(
              <button onClick={()=>{setFilterRetailer("All");setFilterSize("All");setMaxPrice(300);}} style={{marginTop:16,width:"100%",padding:"9px",background:"#f1f5f9",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:12,fontWeight:700,color:"#64748b",cursor:"pointer"}}>Reset Filters</button>
            )}
          </div>

          {/* Main */}
          <div>
            {results.length>0&&<div style={{marginBottom:24}}><PriceChart products={filtered.length>0?filtered:results}/></div>}

            {/* Best deal banner */}
            {best&&bestM&&(
              <div style={{background:`linear-gradient(135deg,${bestM.color},${bestM.color}cc)`,borderRadius:20,padding:"22px 28px",marginBottom:24,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
                <div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,.65)",letterSpacing:"2px",textTransform:"uppercase",marginBottom:6}}>🏆 Best Deal Found</div>
                  <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.5px",marginBottom:4,fontFamily:"'Playfair Display',Georgia,serif"}}>{best.retailer} — {best.name}</div>
                  <div style={{fontSize:13,color:"rgba(255,255,255,.75)"}}>{best.description}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:38,fontWeight:900,color:"#fff",letterSpacing:"-2px",fontFamily:"'Playfair Display',Georgia,serif"}}>€{best.price.toFixed(2)}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,.65)",marginBottom:10}}>€{(avgPrice-best.price).toFixed(2)} cheaper than average</div>
                  <button onClick={()=>best.url&&window.open(best.url,"_blank")} style={{padding:"10px 24px",background:"rgba(255,255,255,.2)",border:"2px solid rgba(255,255,255,.5)",borderRadius:12,color:"#fff",fontSize:12,fontWeight:800,letterSpacing:"1px",textTransform:"uppercase",cursor:"pointer",backdropFilter:"blur(8px)"}}>
                    Shop Now →
                  </button>
                </div>
              </div>
            )}

            {/* Cards */}
            {sorted.length>0?(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
                {sorted.map((p,i)=><ProductCard key={`${p.retailer}-${i}`} product={p} rank={i} avgPrice={avgPrice}/>)}
              </div>
            ):(
              <div style={{background:"#fff",borderRadius:20,padding:"48px",border:"1.5px solid #e2e8f0",textAlign:"center"}}>
                <div style={{fontSize:32,marginBottom:12}}>🔍</div>
                <div style={{fontSize:16,fontWeight:700,color:"#0f172a",marginBottom:8}}>No results match your filters</div>
                <div style={{fontSize:13,color:"#64748b"}}>Try adjusting filters or increasing the max price.</div>
              </div>
            )}

            <div style={{marginTop:36,padding:"14px 20px",background:"rgba(255,255,255,.6)",border:"1.5px solid #e2e8f0",borderRadius:12,fontSize:11,color:"#94a3b8",lineHeight:1.6}}>
              ⚠️ Prices sourced via Claude AI web search. Always verify on the retailer's website before purchasing. Agent fired {searchCount} live searches.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
