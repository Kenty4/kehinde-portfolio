require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, "data.json");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function load() {
  if (!fs.existsSync(DATA)) return { cycles: [], prospects: [], approvals: [] };
  return JSON.parse(fs.readFileSync(DATA, "utf8"));
}
function save(db) { fs.writeFileSync(DATA, JSON.stringify(db, null, 2)); }
function id(prefix) { return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

async function anthropic(prompt, system, max_tokens=800) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{
      "x-api-key":process.env.ANTHROPIC_API_KEY,
      "anthropic-version":"2023-06-01",
      "content-type":"application/json"
    },
    body:JSON.stringify({
      model:"claude-sonnet-4-6",
      max_tokens,
      system,
      messages:[{role:"user",content:prompt}]
    })
  });
  if (!r.ok) throw new Error("Anthropic API error: " + r.status);
  const j = await r.json();
  return j.content?.[0]?.text || "";
}

async function research(query) {
  if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX) {
    const u = "https://www.googleapis.com/customsearch/v1?q=" +
      encodeURIComponent(query) + "&key=" +
      encodeURIComponent(process.env.GOOGLE_SEARCH_API_KEY) +
      "&cx=" + encodeURIComponent(process.env.GOOGLE_SEARCH_CX);
    const r = await fetch(u);
    if (!r.ok) throw new Error("Google Search API error: " + r.status);
    const j = await r.json();
    return (j.items || []).slice(0,8).map(x => ({
      name:x.title, url:x.link, note:x.snippet || ""
    }));
  }
  return [
    {name:"Demo Prospect — Operations Agency", url:"https://example.com", note:"Growing operations team with repetitive lead qualification and reporting."},
    {name:"Demo Prospect — SaaS Company", url:"https://example.com", note:"B2B SaaS business with customer support and sales workflows."},
    {name:"Demo Prospect — E-commerce Brand", url:"https://example.com", note:"Online retailer handling manual customer and marketing operations."},
    {name:"Demo Prospect — Professional Services", url:"https://example.com", note:"Service company that could benefit from automated lead follow-up."}
  ];
}

function demoPlan(objective, adjustment) {
  return {
    target_market:"SMBs with repetitive sales and operations workflows",
    budget_note:"Start lean; validate before increasing spend.",
    research_query:"small business automation services companies lead generation operations",
    steps:[
      {agent:"research",task:"Find businesses with repetitive sales or operations workflows"},
      {agent:"qualify",task:"Score prospects for automation-service fit"},
      {agent:"outreach",task:"Create specific audit outreach drafts"},
      {agent:"sales",task:"Review replies and identify sales opportunities"},
      {agent:"delivery",task:"Prepare an automation audit and implementation plan"},
      {agent:"analytics",task:"Measure qualified leads, replies, conversions and revenue"}
    ]
  };
}

async function createPlan(objective, adjustment="") {
  const system = `You are the AI Manager in an autonomous business-operations system.
Given a business objective and carry-over adjustment, decompose it into:
research, qualify, outreach, sales, delivery, analytics.
Return ONLY strict JSON:
{"target_market":"...","budget_note":"...","research_query":"...","steps":[{"agent":"research|qualify|outreach|sales|delivery|analytics","task":"..."}]}
Keep tasks under 18 words. research_query must be a real Google-search query.`;
  const text = await anthropic(objective + (adjustment ? "\nCarry-over adjustment: "+adjustment : ""), system, 900);
  if (!text) return demoPlan(objective, adjustment);
  const cleaned = text.replace(/```json|```/g,"").trim();
  return JSON.parse(cleaned);
}

async function scoreProspect(p) {
  const text = await anthropic(
    `${p.name} — ${p.note}`,
    "Score this prospect 0-100 for AI automation-service fit. Respond ONLY as JSON: {\"score\":number}.",
    200
  );
  if (!text) {
    const s = /automation|operations|sales|support|workflow|manual/i.test(p.note) ? 78 : 52;
    return s;
  }
  return Number(JSON.parse(text.replace(/```json|```/g,"").trim()).score);
}

async function draftOutreach(p) {
  const text = await anthropic(
    `${p.name} — ${p.note}`,
    "Write a short, specific, non-generic outreach email offering an AI automation audit. Plain text, under 120 words, no subject line.",
    350
  );
  if (text) return text.trim();
  return `Hi ${p.name},\n\nI noticed your business appears to be handling workflows that may involve repetitive operations and follow-up. I’m building AI automation systems that can reduce manual work and improve lead handling.\n\nWould you be open to a quick automation audit? I can identify a few workflows worth automating and show what the implementation could look like.\n\nBest,\nAI Business Operator`;
}

async function runCycle() {
  const db = load();
  const open = db.cycles.find(c => !["done","failed"].includes(c.status));
  if (open) return {cycle:open, skipped:true};

  const last = [...db.cycles].reverse().find(c=>c.status==="done");
  const objective = process.env.BUSINESS_OBJECTIVE || "Build an AI automation service that finds qualified prospects and creates outreach drafts.";
  const plan = await createPlan(objective, last?.adjustment || "");

  const cycle = {
    id:id("cyc"), objective, target_market:plan.target_market,
    budget_note:plan.budget_note, research_query:plan.research_query,
    steps:plan.steps, status:"researching",
    started_at:new Date().toISOString(), prospects:0, qualified:0
  };
  db.cycles.push(cycle); save(db);

  const found = await research(plan.research_query);
  cycle.status="qualifying";
  for (const p of found) {
    const prospect = {...p, id:id("pro"), cycle_id:cycle.id, stage:"researched"};
    prospect.score = await scoreProspect(prospect);
    prospect.stage = prospect.score >= 70 ? "qualified" : "discarded";
    if (prospect.stage==="qualified") prospect.outreach = await draftOutreach(prospect);
    db.prospects.push(prospect);
  }
  cycle.prospects=found.length;
  cycle.qualified=db.prospects.filter(p=>p.cycle_id===cycle.id && p.stage==="qualified").length;

  if (cycle.qualified > 0) {
    cycle.status="awaiting_approval";
    db.approvals.push({
      id:id("apr"), cycle_id:cycle.id, agent:"outreach",
      text:`Approve outreach batch to ${cycle.qualified} qualified prospects before sending.`,
      status:"pending", created_at:new Date().toISOString()
    });
  } else {
    cycle.status="done";
    cycle.completed_at=new Date().toISOString();
  }
  save(db);
  return {cycle, skipped:false};
}

app.get("/api/status",(req,res)=>{
  const db=load();
  const latest=[...db.cycles].reverse()[0];
  res.json({
    latest, cycles:db.cycles.slice(-10).reverse(),
    prospects:db.prospects.slice(-50).reverse(),
    approvals:db.approvals.filter(a=>a.status==="pending")
  });
});

app.post("/api/cycles",(req,res)=>{
  const db=load();
  const objective=String(req.body.objective||"").trim();
  if(!objective) return res.status(400).json({error:"Objective is required"});
  process.env.BUSINESS_OBJECTIVE=objective;
  res.json({ok:true, objective});
});

app.post("/api/run", async (req,res)=>{
  try { res.json(await runCycle()); }
  catch(e) { console.error(e); res.status(500).json({error:e.message}); }
});

app.post("/api/approvals/:id", async (req,res)=>{
  const db=load();
  const a=db.approvals.find(x=>x.id===req.params.id);
  if(!a) return res.status(404).json({error:"Approval not found"});
  a.status=req.body.approved ? "approved" : "rejected";
  a.decided_at=new Date().toISOString();
  const c=db.cycles.find(x=>x.id===a.cycle_id);
  if(c) {
    c.status=req.body.approved ? "approved_for_sending" : "done";
    c.completed_at=new Date().toISOString();
    c.adjustment=req.body.approved
      ? "Outreach batch approved; evaluate replies and conversion results."
      : "Outreach rejected; improve targeting and messaging before the next cycle.";
  }
  save(db);
  res.json({ok:true, approval:a, cycle:c});
});

app.post("/api/reset",(req,res)=>{
  save({cycles:[],prospects:[],approvals:[]});
  res.json({ok:true});
});

app.listen(PORT,()=>console.log(`AI Business Operator running at http://localhost:${PORT}`));
