export interface Env { STORE: KVNamespace; DB: D1Database; SERVICE_NAME: string; VERSION: string; }
const SVC = "carpool";
function json(d: unknown, s = 200) { return new Response(JSON.stringify(d,null,2),{status:s,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","X-BlackRoad-Service":SVC}}); }
async function track(env: Env, req: Request, path: string) { const cf=(req as any).cf||{}; env.DB.prepare("INSERT INTO analytics(subdomain,path,country,ua,ts)VALUES(?,?,?,?,?)").bind(SVC,path,cf.country||"",req.headers.get("User-Agent")?.slice(0,150)||"",Date.now()).run().catch(()=>{}); }

const AGENTS=[
  {name:"Roadie",specialty:"General assistant, platform navigation, convoy mood",route:["what","how","help","who","tell","explain","overview"]},
  {name:"Lucidia",specialty:"Memory, persistence, PS-SHA journal, truth state",route:["remember","memory","journal","history","store","recall"]},
  {name:"Cecilia",specialty:"Workflow orchestration, task routing, agent coordination",route:["task","workflow","route","assign","coordinate","deploy"]},
  {name:"Alexandria",specialty:"Research, documentation, archives, deep knowledge",route:["research","document","archive","paper","study","source"]},
  {name:"Sophia",specialty:"Math, Amundson sequence, Riemann hypothesis, zeta",route:["math","G(","zeta","riemann","sequence","amundson","σ","N-identity"]},
  {name:"Gaia",specialty:"Infrastructure, Cloudflare, K3s, Pi fleet, deployments",route:["deploy","worker","cloudflare","k3s","pi","infrastructure","cluster"]},
  {name:"Aria",specialty:"Creative, voice, content, social, backroad",route:["write","create","content","social","post","creative","voice"]},
  {name:"Atticus",specialty:"Legal, compliance, contracts, policy, FINRA",route:["legal","compliance","contract","policy","finra","series","license"]},
];

function routeQuery(q: string): typeof AGENTS[0] {
  const lower=q.toLowerCase();
  let best=AGENTS[0];let bestScore=0;
  for(const a of AGENTS){
    const score=a.route.filter(kw=>lower.includes(kw)).length;
    if(score>bestScore){bestScore=score;best=a;}
  }
  return best;
}

function page(): Response {
  const html=`<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><title>CarPool — Agent Router</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#030303;--card:#0a0a0a;--border:#111;--text:#f0f0f0;--sub:#444;--teal:#00D6FF;--grad:linear-gradient(135deg,#00D6FF,#3E84FF,#FF00D4)}
html,body{min-height:100vh;background:var(--bg);color:var(--text);font-family:'Space Grotesk',sans-serif}
.grad-bar{height:2px;background:var(--grad)}
.wrap{max-width:900px;margin:0 auto;padding:32px 20px}
h1{font-size:2rem;font-weight:700;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px}
.sub{font-size:.75rem;color:var(--sub);font-family:'JetBrains Mono',monospace;margin-bottom:28px}
.query-box{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:20px}
.ct{font-size:.65rem;color:var(--sub);text-transform:uppercase;letter-spacing:.08em;font-family:'JetBrains Mono',monospace;margin-bottom:12px}
.input-row{display:flex;gap:8px}
input{flex:1;padding:12px 16px;background:#0d0d0d;border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:'Space Grotesk',sans-serif;font-size:.9rem;outline:none}
input:focus{border-color:var(--teal)}
.btn{padding:12px 22px;background:var(--teal);color:#000;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:.85rem}
.result{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:20px;margin-bottom:20px;display:none}
.result.show{display:block}
.routed-to{font-size:.68rem;font-family:'JetBrains Mono',monospace;color:var(--teal);text-transform:uppercase;margin-bottom:6px}
.agent-name{font-size:1.4rem;font-weight:700;margin-bottom:4px}
.agent-spec{font-size:.8rem;color:var(--sub);margin-bottom:12px}
.conf-bar{height:4px;background:#0d0d0d;border-radius:2px;margin-bottom:12px}
.conf-fill{height:4px;border-radius:2px;background:var(--grad)}
.agent-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}
.agent-card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px;cursor:pointer;transition:border-color .15s}
.agent-card:hover{border-color:#1a1a1a}
.ac-name{font-size:.82rem;font-weight:700;margin-bottom:3px}
.ac-spec{font-size:.68rem;color:var(--sub);line-height:1.4}
.ac-kw{display:flex;flex-wrap:wrap;gap:3px;margin-top:6px}
.kw{padding:1px 6px;background:#111;border:1px solid #1a1a1a;border-radius:3px;font-size:.6rem;font-family:'JetBrains Mono',monospace;color:#444}
.suggest{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}
.sug{padding:5px 12px;background:#0d0d0d;border:1px solid var(--border);border-radius:20px;font-size:.72rem;cursor:pointer;color:var(--sub);transition:all .15s}
.sug:hover{border-color:var(--teal);color:var(--text)}
</style></head><body>
<div class="grad-bar"></div>
<div class="wrap">
<h1>CarPool</h1>
<div class="sub">carpool.blackroad.io · intelligent agent router · 8 specialists</div>
<div class="query-box">
  <div class="ct">What do you need?</div>
  <div class="input-row">
    <input type="text" id="q" placeholder="Type your question or task..." autocomplete="off">
    <button class="btn" onclick="route()">Route</button>
  </div>
  <div class="suggest">
    ${["compute G(42)","deploy a worker","remember this","research zeta function","write a tweet","legal compliance check"].map(s=>`<div class="sug" onclick="routeQ('${s}')">${s}</div>`).join("")}
  </div>
</div>
<div class="result" id="result">
  <div class="routed-to">Best Agent</div>
  <div class="agent-name" id="r-name">—</div>
  <div class="agent-spec" id="r-spec">—</div>
  <div class="conf-bar"><div class="conf-fill" id="r-conf" style="width:0%"></div></div>
  <div style="font-size:.75rem;color:var(--sub)" id="r-reason">—</div>
</div>
<div class="ct" style="margin-top:8px">All 8 Specialists</div>
<div class="agent-grid">
${AGENTS.map(a=>`<div class="agent-card" onclick="document.getElementById('q').value='${a.route[0]}';route()">
  <div class="ac-name">${a.name}</div>
  <div class="ac-spec">${a.specialty.slice(0,60)}</div>
  <div class="ac-kw">${a.route.slice(0,4).map(k=>`<span class="kw">${k}</span>`).join("")}</div>
</div>`).join("")}
</div>
</div>
<script src="https://cdn.blackroad.io/br.js"></script>
<script>
function routeQ(q){document.getElementById('q').value=q;route();}
async function route(){
  var q=document.getElementById('q').value.trim();if(!q)return;
  var r=await fetch('/api/route',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q})});
  var d=await r.json();
  document.getElementById('r-name').textContent=d.agent.name;
  document.getElementById('r-spec').textContent=d.agent.specialty;
  document.getElementById('r-conf').style.width=(d.confidence*100)+'%';
  document.getElementById('r-reason').textContent='Matched on: '+d.matched_keywords.join(', ')+(d.matched_keywords.length?'':' (default routing)');
  document.getElementById('result').className='result show';
}
document.getElementById('q').addEventListener('keydown',function(e){if(e.key==='Enter')route();});
</script>
</body></html>`;
  return new Response(html,{headers:{"Content-Type":"text/html;charset=UTF-8"}});
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":"*"}});
    const url=new URL(req.url);const path=url.pathname;
    track(env,req,path);
    if(path==="/health")return json({service:SVC,status:"ok",version:env.VERSION,ts:Date.now()});
    if(path==="/api/agents")return json({agents:AGENTS.map(a=>({name:a.name,specialty:a.specialty,keywords:a.route}))});
    if(path==="/api/route"&&req.method==="POST"){
      const {query}=await req.json() as {query:string};
      const agent=routeQuery(query);
      const lower=query.toLowerCase();
      const matched=agent.route.filter(kw=>lower.includes(kw));
      const confidence=matched.length>0?Math.min(0.95,0.5+matched.length*0.15):0.3;
      await env.STORE.put(`route:${Date.now()}`,JSON.stringify({query,agent:agent.name,confidence,ts:Date.now()}),{expirationTtl:86400});
      return json({query,agent:{name:agent.name,specialty:agent.specialty},confidence,matched_keywords:matched});
    }
    if(path==="/api/history"){
      const list=await env.STORE.list({prefix:"route:"});
      const hist=await Promise.all(list.keys.slice(0,20).map(async k=>{const v=await env.STORE.get(k.name);return v?JSON.parse(v):null;}));
      return json({history:hist.filter(Boolean).sort((a:any,b:any)=>b.ts-a.ts)});
    }
    return page();
  }
};
