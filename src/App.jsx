// ══════════════════════════════════════════════════════════════════════════
//  FOUNDER FINANCE DASHBOARD v2.0
//  Smart Bank Import · Claude AI Insights · Mobile-First
// ══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from "recharts";
import * as XLSX from "xlsx";

// ─── MASK CONTEXT ─────────────────────────────────────────────────────────────
const MaskCtx = createContext(false);
const useMask = () => useContext(MaskCtx);

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SB_URL  = "https://wlghcxfrdbbbjldfepks.supabase.co";
const SB_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZ2hjeGZyZGJiYmpsZGZlcGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTQ0NTQsImV4cCI6MjA5MDc5MDQ1NH0.g5USyRfhcKA31_6ia7B2QyAuUMBbWbANacFDGLhXZZo";
const APP_PWD = "founder2026";
const sb = createClient(SB_URL, SB_KEY);

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const ACCOUNTS = [
  { id:"lrf",      label:"LiveRightFit LLP",  cur:"INR", clr:"#F59E0B" },
  { id:"grownmind",label:"Grownmind",          cur:"INR", clr:"#6366F1" },
  { id:"jeet",     label:"Jeet UK Account",    cur:"GBP", clr:"#06B6D4" },
];
const BUSINESSES = ["Migrizo","Nutrolis","Assignment"];
const BIZ_CLR   = { Migrizo:"#6366F1", Nutrolis:"#F59E0B", Assignment:"#06B6D4" };
const MONTHS    = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const COLORS    = ["#6366F1","#F59E0B","#EF4444","#10B981","#3B82F6","#8B5CF6","#EC4899","#14B8A6","#F97316","#84CC16","#06B6D4","#A855F7","#F43F5E","#0EA5E9","#22C55E"];

const OP_CATS  = ["Amazon Revenue","Flipkart Revenue","Migrizo Revenue","Direct Sales","Consultation","Services","Assignment Payment","Website Revenue","Offline Revenue","Other Income","Misc Income","Miscellaneous Income"];
const CAP_CATS = ["Capital Injection","Business Loan Received","Investment / Loan Received","Internal Transfer"];
const INC_CATS = [...OP_CATS, ...CAP_CATS];
const EXP_CATS = ["Meta Ads","Migrizo Expenses","Credit Card Payment","Salaries","Freelancer","Procurement","Equipment & Office","Professional Services","Software","Shipping","Marketplace Fees","GST & Tax","Loan / EMI","Telecom & Internet","Food & Entertainment","Misc Expense","Owner Drawings","Founder Travel","Inter-company Transfer","Amazon Ads Spend","Flipkart Ads Spend"];

const DEFAULT_CHANNELS = [
  { id:1, name:"Amazon",     biz:"Nutrolis",   clr:"#F97316", bg:"#FFF7ED", cats:["Amazon Revenue"] },
  { id:2, name:"Flipkart",   biz:"Nutrolis",   clr:"#6366F1", bg:"#EEF2FF", cats:["Flipkart Revenue"] },
  { id:3, name:"Migrizo",    biz:"Migrizo",    clr:"#8B5CF6", bg:"#F5F3FF", cats:["Migrizo Revenue","Consultation","Services"] },
  { id:4, name:"Offline",    biz:"Nutrolis",   clr:"#10B981", bg:"#F0FDF4", cats:["Offline Revenue","Direct Sales"] },
  { id:5, name:"Website",    biz:"Nutrolis",   clr:"#3B82F6", bg:"#EFF6FF", cats:["Website Revenue"] },
  { id:6, name:"Assignment", biz:"Assignment", clr:"#06B6D4", bg:"#ECFEFF", cats:["Assignment Payment"] },
];

// ─── AUTO-CATEGORISATION RULES ───────────────────────────────────────────────
const CAT_RULES = [
  // Income
  { kw:["amazon seller","amazon payment","amz seller"],         type:"Income",  cat:"Amazon Revenue",        biz:"Nutrolis" },
  { kw:["flipkart","fk nodal"],                                 type:"Income",  cat:"Flipkart Revenue",      biz:"Nutrolis" },
  { kw:["migrizo","migration consult","visa consult"],          type:"Income",  cat:"Migrizo Revenue",       biz:"Migrizo" },
  { kw:["consultation","gkv kickstart","gkv consult","era paid","abhishek bharne","sukhdeep"], type:"Income", cat:"Consultation", biz:"Migrizo" },
  { kw:["assignment revenue","assignment payment","assignment"], type:"Income",  cat:"Assignment Payment",    biz:"Assignment" },
  // Expenses
  { kw:["facebook","meta ads","fb ads","instagram ads"],        type:"Expense", cat:"Meta Ads" },
  { kw:["shiprocket","bigfoot","xpressbees","delhivery","ekart","bluedart","rising star","courier"], type:"Expense", cat:"Shipping" },
  { kw:["salary","sal ","payroll","mansi behal","bhaskar manish"], type:"Expense", cat:"Salaries" },
  { kw:["credit card","icici credit","idfc credit","cc pay"],   type:"Expense", cat:"Credit Card Payment" },
  { kw:["amazon india","amazon fee","marketplace fee","amazon ads"], type:"Expense", cat:"Marketplace Fees" },
  { kw:["gst","tax payment","gst payment","apob"],              type:"Expense", cat:"GST & Tax" },
  { kw:["zoho","notion","godaddy","tata stars","business card yearly"], type:"Expense", cat:"Software" },
  { kw:["airtel","jio","vi ","vodafone","bsnl","mobile bill"],  type:"Expense", cat:"Telecom & Internet" },
  { kw:["oribite","nutra science","procurement","raw material"], type:"Expense", cat:"Procurement" },
  { kw:["ca fee","chartered","shashank","mohd a"],              type:"Expense", cat:"Professional Services" },
  { kw:["croma","blue star","equipment","ac ","electronics"],   type:"Expense", cat:"Equipment & Office" },
  { kw:["food","restaurant","swiggy","zomato","chaayos","cafe"], type:"Expense", cat:"Food & Entertainment" },
  { kw:["flight","hotel","accommodation","irctc","makemytrip"], type:"Expense", cat:"Founder Travel" },
  { kw:["loan emi","emi payment","neelam"],                     type:"Expense", cat:"Loan / EMI" },
  { kw:["freelancer","akash verma","solanki","ayushi","vishakha","sapna"],type:"Expense",cat:"Freelancer" },
  { kw:["grownmind","intercompany","inter-company"],            type:"Expense", cat:"Inter-company Transfer" },
  { kw:["ficci"],                                               type:"Expense", cat:"Professional Services" },
];

// ─── SELF-LEARNING TAG ENGINE ─────────────────────────────────────────────────
let LEARNED_RULES = [];
function applyLearnedTags(desc="", type="") {
  const d = desc.toLowerCase();
  for (const r of LEARNED_RULES) {
    if (r.type===type && r.kw.some(k=>d.includes(k.toLowerCase())))
      return { category:r.cat, business:r.biz||"Nutrolis" };
  }
  return null;
}
function learnRule(desc="", category="", type="", business="Nutrolis") {
  const words = desc.toLowerCase()
    .replace(/upi\/[a-z]+\/\d+\//gi,"").replace(/neft\/\w+\//gi,"").replace(/imps\/\w+\//gi,"")
    .split(/[\/\-\s,]+/).map(w=>w.trim())
    .filter(w=>w.length>3&&!/^\d+$/.test(w)&&!["sent","from","paid","debit","credit","bank","upi"].includes(w));
  const kw=[...new Set(words)].slice(0,3);
  if (kw.length===0) return;
  const exists=LEARNED_RULES.find(r=>r.cat===category&&r.type===type&&r.kw.some(k=>kw.includes(k)));
  if (!exists) LEARNED_RULES=[...LEARNED_RULES,{kw,cat:category,type,biz:business}];
}

// ─── EXPORT UTILITIES ────────────────────────────────────────────────────────
const acctLabel = id => (ACCOUNTS.find(a=>a.id===id)||{label:id}).label;
function exportCSV(rows, filename="export.csv") {
  const header=["Date","Business","Account","Type","Category","Description","Amount"];
  const lines=[header.join(","),...rows.map(r=>[r.date,r.business,acctLabel(r.account),r.type,r.category,`"${(r.description||"").replace(/"/g,"''")}"`  ,r.amount].join(","))];
  const blob=new Blob([lines.join("\n")],{type:"text/csv"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;a.click();
}
function exportXLSX(rows, filename="export.xlsx") {
  const data=[["Date","Business","Account","Type","Category","Description","Amount"],...rows.map(r=>[r.date,r.business,acctLabel(r.account),r.type,r.category,r.description||"",r.amount])];
  const ws=XLSX.utils.aoa_to_sheet(data);
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Entries");
  XLSX.writeFile(wb,filename);
}

function autoCategorize(desc = "", type = "") {
  const d = desc.toLowerCase();
  for (const rule of CAT_RULES) {
    if (rule.type === type && rule.kw.some(k => d.includes(k))) {
      return { category: rule.cat, business: rule.biz || (type === "Income" ? "Nutrolis" : "Nutrolis") };
    }
  }
  return {
    category: type === "Income" ? "Other Income" : "Misc Expense",
    business: "Nutrolis",
  };
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────
const acct  = (id) => ACCOUNTS.find(a => a.id === id) || { label:id, cur:"INR", clr:"#94A3B8" };
const fxAmt = (e, rate) => e.account === "jeet" ? e.amount * rate : e.amount;
const getMonth = (d) => d ? parseInt(d.split("-")[1]) - 1 : -1;
const getYear  = (d) => d ? d.split("-")[0] : "";

const fmt = (n, masked=false) => {
  if (masked) return "₹ ••••";
  const abs = Math.abs(n), pfx = n < 0 ? "-₹" : "₹";
  if (abs >= 1e5) return pfx + (abs/1e5).toFixed(2) + "L";
  return pfx + Math.round(abs).toLocaleString("en-IN");
};
const fmtCur = (n, cur, masked=false) => {
  if (masked) return cur==="GBP" ? "£ ••••" : "₹ ••••";
  if (cur==="GBP") return (n<0?"-£":"£")+Math.abs(n).toLocaleString("en-GB",{minimumFractionDigits:0});
  return fmt(n);
};
const fmtK = (n, masked=false) => {
  if (masked) return "••••";
  const abs = Math.abs(n);
  if (abs >= 1e5) return (n < 0 ? "-₹" : "₹") + (abs/1e5).toFixed(1) + "L";
  if (abs >= 1e3) return (n < 0 ? "-₹" : "₹") + (abs/1e3).toFixed(0) + "k";
  return fmt(n);
};
const pct = (v, t) => t > 0 ? Math.round(v/t*100) + "%" : "0%";

function parseDate(s = "") {
  if (!s) return null;
  s = s.toString().trim().replace(/['"` ]/g,"");
  if (!s) return null;
  const MO = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
  let m;
  // YYYY-MM-DD
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) return s;
  // DD/MM/YYYY or DD-MM-YYYY (all numeric)
  if ((m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)))
    return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  // DD-Mon-YYYY  e.g. 01-Apr-2026  ← IDFC format
  if ((m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/i))) {
    const n = MO[m[2].toLowerCase()];
    if (n) return `${m[3]}-${String(n).padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  }
  // DD/Mon/YYYY  e.g. 01/Apr/2026
  if ((m = s.match(/^(\d{1,2})\/([A-Za-z]{3})\/(\d{4})$/i))) {
    const n = MO[m[2].toLowerCase()];
    if (n) return `${m[3]}-${String(n).padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  }
  // DD Mon YYYY  e.g. 01 Apr 2026
  if ((m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/i))) {
    const n = MO[m[2].toLowerCase()];
    if (n) return `${m[3]}-${String(n).padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  }
  // DD-Mon-YY  e.g. 01-Apr-26
  if ((m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/i))) {
    const n = MO[m[2].toLowerCase()];
    const yr = parseInt(m[3]) + (parseInt(m[3]) < 50 ? 2000 : 1900);
    if (n) return `${yr}-${String(n).padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  }
  // DD/MM/YY
  if ((m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/))) {
    const yr = parseInt(m[3]) + (parseInt(m[3]) < 50 ? 2000 : 1900);
    return `${yr}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  }
  // Excel serial
  if (/^\d{5}$/.test(s)) {
    try { const d = XLSX.SSF.parse_date_code(parseInt(s)); if (d) return `${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`; } catch(e){}
  }
  return null;
}

function parseAmount(s = "") {
  if (!s && s !== 0) return 0;
  const v = parseFloat(String(s).replace(/[₹£$,\s]/g,"")) || 0;
  return isNaN(v) ? 0 : Math.abs(v);
}

function parseCSV(text) {
  const lines = text.replace(/\r\n/g,"\n").replace(/\r/g,"\n").split("\n").filter(l => l.trim());
  if (lines.length < 2) return null;
  const parseRow = (line) => {
    const res = []; let inQ = false, cur = "";
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQ = !inQ; }
      else if (line[i] === "," && !inQ) { res.push(cur.trim()); cur = ""; }
      else cur += line[i];
    }
    res.push(cur.trim());
    return res;
  };
  return { headers: parseRow(lines[0]), rows: lines.slice(1).map(parseRow) };
}

function detectCols(headers) {
  const map = { date:-1, desc:-1, debit:-1, credit:-1, amount:-1, balance:-1 };
  headers.forEach((h, i) => {
    const l = h.toLowerCase().trim().replace(/\s+/g," ");
    if (map.date<0   && /date/.test(l) && !/update|mandate/.test(l)) map.date=i;
    if (map.desc<0   && /narrat|remark|description|particular|detail|reference|transaction\s*remarks?/.test(l)) map.desc=i;
    if (map.debit<0  && /debit|withdrawal|dr$|dr\s|paid.?out|outflow/.test(l)) map.debit=i;
    if (map.credit<0 && /credit|deposit|cr$|cr\s|paid.?in|inflow/.test(l)) map.credit=i;
    if (map.amount<0 && /^(amount|amt)$/.test(l)) map.amount=i;
    if (map.balance<0&& /balance|bal$|bal\s/.test(l)) map.balance=i;
  });
  return map;
}

// Combine header-based + data-driven column detection
function detectColsFromData(headers, dataRows) {
  let map = detectCols(headers);
  const sample = dataRows.filter(r=>r.some(c=>c!=="")).slice(0,10);
  if (sample.length === 0) return map;
  const nCols = Math.max(headers.length, ...sample.map(r=>r.length));

  // Fill missing date col: find column where most values parse as dates
  if (map.date < 0) {
    let best=-1, bestScore=0;
    for (let c=0; c<nCols; c++) {
      const score = sample.filter(r=>parseDate(String(r[c]||""))!==null).length;
      if (score>bestScore){bestScore=score;best=c;}
    }
    if (bestScore>=2) map.date=best;
  }

  // Fill missing desc col: longest average text column (not date, not balance)
  if (map.desc < 0) {
    let best=-1, bestLen=0;
    for (let c=0; c<nCols; c++) {
      if (c===map.date||c===map.balance) continue;
      const avgLen = sample.reduce((s,r)=>s+String(r[c]||"").length,0)/sample.length;
      if (avgLen>bestLen&&avgLen>8){bestLen=avgLen;best=c;}
    }
    if (best>=0) map.desc=best;
  }

  // Fill missing amount cols: find columns that are empty-or-numeric across all sample rows
  if (map.debit<0 && map.credit<0 && map.amount<0) {
    const numCols=[];
    for (let c=0; c<nCols; c++) {
      if (c===map.date||c===map.desc) continue;
      const allEmptyOrNum = sample.every(r=>{
        const v=String(r[c]||"").replace(/[,₹£$\s]/g,"");
        return v===""||(!isNaN(parseFloat(v))&&isFinite(parseFloat(v)));
      });
      if (allEmptyOrNum) numCols.push(c);
    }
    // Convention: last col = balance, second-last = credit, third-last = debit
    if (numCols.length>=3){map.debit=numCols[numCols.length-3];map.credit=numCols[numCols.length-2];map.balance=numCols[numCols.length-1];}
    else if (numCols.length===2){map.debit=numCols[0];map.credit=numCols[1];}
    else if (numCols.length===1){map.amount=numCols[0];}
  }
  return map;
}

// Find the REAL header row — scans up to 50 rows, works for IDFC/ICICI/HDFC/any bank
function findHeaderRow(allRows) {
  const limit = Math.min(allRows.length, 50);
  // Pass 1: row contains a "date"-like word AND a "debit"/"credit"-like word
  for (let i = 0; i < limit; i++) {
    const row = (allRows[i]||[]).map(c=>String(c||"").toLowerCase().trim());
    const hasDate = row.some(c => /date/.test(c) && !/update|mandate|birth/.test(c));
    const hasAmt  = row.some(c => /debit|credit|withdrawal|deposit|amount/.test(c));
    if (hasDate && hasAmt) return i;
  }
  // Pass 2: row contains "particular" or "narration" or "remarks" — common in Indian banks
  for (let i = 0; i < limit; i++) {
    const row = (allRows[i]||[]).map(c=>String(c||"").toLowerCase().trim());
    if (row.some(c=>/particular|narration|narrat|remarks/.test(c)) && row.some(c=>/debit|credit|amount/.test(c))) return i;
  }
  // Pass 3: find the row where actual date-like values START appearing in the NEXT row
  for (let i = 0; i < limit - 1; i++) {
    const nextRow = (allRows[i+1]||[]).map(c=>String(c||"").trim());
    const hasDateVal = nextRow.some(c=>parseDate(c)!==null);
    const hasNumVal  = nextRow.some(c=>!isNaN(parseFloat(c.replace(/[,₹\s]/g,""))) && parseFloat(c.replace(/[,₹\s]/g,""))>0);
    if (hasDateVal && hasNumVal) return i; // row i is the header, i+1 is first data row
  }
  return 0;
}

// ─── SUPABASE HELPERS ─────────────────────────────────────────────────────────
const dbAdd    = async (e)  => sb.from("ffd_entries").insert([e]);
const dbUpdate = async (e)  => sb.from("ffd_entries").update(e).eq("id",e.id);
const dbDelete = async (id) => sb.from("ffd_entries").delete().eq("id",id);
const dbAddChannel = async(c)  => sb.from("ffd_channels").upsert([c]);
const dbDelChannel = async(id) => sb.from("ffd_channels").delete().eq("id",id);
const dbSetting    = async(k,v)=> sb.from("ffd_settings").upsert({key:k,value:v});

// ═══════════════════════════════════════════════════════════════════════════════
//  SMART IMPORT MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function SmartImport({ accountId, entries, onDone, onClose }) {
  const [step,      setStep]     = useState(1); // 1=upload 2=preview 3=done
  const [preview,   setPreview]  = useState([]);
  const [selected,  setSelected] = useState(new Set());
  const [editRow,   setEditRow]  = useState(null);
  const [dragging,  setDragging] = useState(false);
  const [loading,   setLoading]  = useState(false);
  const [progress,  setProgress] = useState(0);
  const [summary,   setSummary]  = useState(null);
  const [filterDup, setFilterDup]= useState(false);
  const [detected,  setDetected] = useState("");
  const fileRef = useRef();

  const processRows = useCallback((allRows, filename) => {
    // allRows are already string-converted — find real header row
    const hdrIdx  = findHeaderRow(allRows);
    const headers = (allRows[hdrIdx]||[]);
    const dataRows= allRows.slice(hdrIdx+1).filter(r=>r.some(c=>c!==""));
    const map     = detectColsFromData(headers, dataRows);
    const detectedStr = `Found ${dataRows.length} rows · Date col: ${headers[map.date]||"auto"} | Debit/Credit auto-detected`;
    setDetected(detectedStr);
    const existSet = new Set(entries.map(e=>`${e.date}||${e.amount}||${(e.description||"").toLowerCase().slice(0,20)}`));
    const rows = dataRows.map((row,i)=>{
      const dateStr  = map.date  >= 0 ? parseDate(row[map.date])    : null;
      const desc     = map.desc  >= 0 ? (row[map.desc]||"").trim()  : `Row ${i+1}`;
      const debitAmt = map.debit >= 0 ? parseAmount(row[map.debit]) : 0;
      const creditAmt= map.credit>= 0 ? parseAmount(row[map.credit]): 0;
      const singleAmt= map.amount>= 0 ? parseFloat(String(row[map.amount]||"0").replace(/[₹£$,\s]/g,""))||0 : 0;
      if (!dateStr) return null;
      let type, amount;
      if      (debitAmt>0 && creditAmt===0)  { type="Expense"; amount=debitAmt; }
      else if (creditAmt>0 && debitAmt===0)  { type="Income";  amount=creditAmt; }
      else if (debitAmt>0 && creditAmt>0)    { type="Expense"; amount=debitAmt; } // both filled — treat debit
      else if (singleAmt!==0)                { type=singleAmt<0?"Expense":"Income"; amount=Math.abs(singleAmt); }
      else return null;
      if (!amount||amount<=0) return null;
      const {category,business}=autoCategorize(desc,type);
      const dupKey=`${dateStr}||${amount}||${desc.toLowerCase().slice(0,20)}`;
      return {_id:i,date:dateStr,description:desc,type,amount,category,business,account:accountId,isDuplicate:existSet.has(dupKey)};
    }).filter(Boolean);
    setPreview(rows);
    setSelected(new Set(rows.filter(r=>!r.isDuplicate).map(r=>r._id)));
    setStep(2);
    setLoading(false);
  }, [entries, accountId]);

  const handleFile = useCallback((file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    setLoading(true);
    if (["xlsx","xls","ods"].includes(ext)) {
      const r = new FileReader();
      r.onload = e => {
        try {
          const wb = XLSX.read(new Uint8Array(e.target.result), {type:"array"});
          const ws = wb.Sheets[wb.SheetNames[0]];
          const allRows = XLSX.utils.sheet_to_json(ws, {header:1, defval:"", raw:false});
          processRows(allRows, file.name);
        } catch(err) { alert("Could not read file: "+err.message); setLoading(false); }
      };
      r.readAsArrayBuffer(file);
    } else {
      const r = new FileReader();
      r.onload = e => {
        try {
          const raw = parseCSV(e.target.result);
          if (!raw) { alert("Could not parse CSV."); setLoading(false); return; }
          processRows([raw.headers,...raw.rows], file.name);
        } catch(err) { alert("Could not read file: "+err.message); setLoading(false); }
      };
      r.readAsText(file);
    }
  }, [processRows]);

  const onDrop = useCallback((e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }, [handleFile]);

  const doImport = async () => {
    setLoading(true);
    const toImport = preview.filter(r=>selected.has(r._id));
    const chunks=[];
    for (let i=0;i<toImport.length;i+=50) chunks.push(toImport.slice(i,i+50));
    let done=0;
    for (const chunk of chunks) {
      const rows=chunk.map(r=>({id:Date.now()+Math.floor(Math.random()*99999),date:r.date,business:r.business,account:r.account,type:r.type,category:r.category,description:r.description,amount:r.amount,source:"import"}));
      await sb.from("ffd_entries").insert(rows);
      done+=chunk.length;
      setProgress(Math.round(done/toImport.length*100));
    }
    setSummary({imported:toImport.length,skipped:preview.filter(r=>r.isDuplicate).length,total:preview.length});
    onDone(toImport);
    setStep(3);
    setLoading(false);
  };

  const toggleRow = (id) => setSelected(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleAll = () => {
    const vis=filterDup?preview.filter(r=>!r.isDuplicate):preview;
    const allSel=vis.every(r=>selected.has(r._id));
    setSelected(s=>{const n=new Set(s);vis.forEach(r=>allSel?n.delete(r._id):n.add(r._id));return n;});
  };
  const displayed = filterDup ? preview.filter(r=>!r.isDuplicate) : preview;

  return (
    <div style={styles.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={styles.importModal}>
        <div style={styles.importHeader}>
          <div>
            <p style={{margin:0,fontWeight:800,fontSize:18,color:"#111827"}}>📥 Smart Bank Import</p>
            <p style={{margin:"2px 0 0",fontSize:13,color:"#6B7280"}}>{acct(accountId).label} · CSV, Excel, XLSX — columns auto-detected</p>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Step pills */}
        <div style={{display:"flex",gap:0,borderBottom:"1px solid #E5E7EB"}}>
          {["Upload","Preview & Select","Done"].map((s,i)=>(
            <div key={s} style={{flex:1,padding:"10px 4px",textAlign:"center",fontSize:12,fontWeight:step>i?700:400,color:step>i?"#4F46E5":"#9CA3AF",borderBottom:step===i+1?"2px solid #4F46E5":"2px solid transparent"}}>
              {i+1}. {s}
            </div>
          ))}
        </div>

        <div style={{padding:"20px",overflowY:"auto",maxHeight:"calc(92vh - 130px)"}}>

          {/* STEP 1 */}
          {step===1 && (
            <div>
              <div
                style={{...styles.dropZone,...(dragging?styles.dropZoneActive:{})}}
                onDragOver={e=>{e.preventDefault();setDragging(true)}}
                onDragLeave={()=>setDragging(false)}
                onDrop={onDrop}
                onClick={()=>fileRef.current?.click()}
              >
                <div style={{fontSize:52,marginBottom:12}}>📂</div>
                <p style={{fontWeight:800,fontSize:17,margin:"0 0 6px",color:"#374151"}}>Drop your bank statement here</p>
                <p style={{fontSize:14,color:"#6B7280",margin:"0 0 16px"}}>or tap to browse · columns auto-detected instantly</p>
                <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                  {["CSV","XLS","XLSX","ODS"].map(t=>(
                    <span key={t} style={{padding:"4px 12px",background:"#EEF2FF",borderRadius:8,fontSize:13,fontWeight:600,color:"#4F46E5"}}>{t}</span>
                  ))}
                </div>
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.ods" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])} />
              </div>
              {loading && (
                <div style={{textAlign:"center",marginTop:24}}>
                  <div style={{width:40,height:40,border:"4px solid #E5E7EB",borderTop:"4px solid #4F46E5",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 12px"}}/>
                  <p style={{color:"#6B7280",fontSize:14}}>Reading file & detecting columns…</p>
                </div>
              )}
              <div style={{marginTop:20,padding:"12px 16px",background:"#FFFBEB",borderRadius:12,border:"1px solid #FDE68A"}}>
                <p style={{margin:"0 0 6px",fontWeight:700,fontSize:13,color:"#92400E"}}>💡 How to export from your bank</p>
                <p style={{margin:0,fontSize:13,color:"#78350F",lineHeight:1.7}}>
                  <b>IDFC:</b> NetBanking → Accounts → Statement → Download Excel<br/>
                  <b>ICICI:</b> NetBanking → Accounts → View/Download Statement → Excel<br/>
                  <b>HDFC:</b> NetBanking → Statement of Account → Download<br/>
                  <b>Any bank:</b> Download CSV or Excel — everything auto-detected ✅
                </p>
              </div>
            </div>
          )}

          {/* STEP 2 — Preview */}
          {step===2 && (
            <div>
              <div style={{background:"#EEF2FF",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#4F46E5",marginBottom:12,fontWeight:500}}>
                ✅ {detected}
              </div>
              <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{...styles.badge,background:"#DCFCE7",color:"#166534"}}>✅ {preview.filter(r=>!r.isDuplicate).length} new</span>
                <span style={{...styles.badge,background:"#FEF9C3",color:"#713F12"}}>🔁 {preview.filter(r=>r.isDuplicate).length} already exist</span>
                <span style={{...styles.badge,background:"#EEF2FF",color:"#4F46E5"}}>☑ {selected.size} selected</span>
                <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#374151",marginLeft:"auto",cursor:"pointer"}}>
                  <input type="checkbox" checked={filterDup} onChange={e=>setFilterDup(e.target.checked)}/>
                  Hide existing
                </label>
              </div>
              <div style={{overflowX:"auto",maxHeight:"48vh",overflowY:"auto",border:"1px solid #E5E7EB",borderRadius:10}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:600}}>
                  <thead style={{position:"sticky",top:0,background:"#F9FAFB",zIndex:1}}>
                    <tr>
                      <th style={styles.th}><input type="checkbox" onChange={toggleAll} checked={displayed.length>0&&displayed.every(r=>selected.has(r._id))}/></th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Description</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Category</th>
                      <th style={{...styles.th,textAlign:"right"}}>Amount</th>
                      <th style={styles.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((row,i)=>(
                      <tr key={row._id} style={{background:row.isDuplicate?"#FFFBEB":i%2===0?"#fff":"#FAFAFA",opacity:row.isDuplicate?0.6:1}}>
                        <td style={styles.td}><input type="checkbox" checked={selected.has(row._id)} onChange={()=>toggleRow(row._id)}/></td>
                        <td style={{...styles.td,whiteSpace:"nowrap"}}>{row.date}</td>
                        <td style={{...styles.td,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={row.description}>{row.description}</td>
                        <td style={styles.td}><span style={{...styles.badge,background:row.type==="Income"?"#DCFCE7":"#FEE2E2",color:row.type==="Income"?"#166534":"#7F1D1D",fontSize:11}}>{row.type}</span></td>
                        <td style={{...styles.td,fontSize:11,color:"#374151"}}>{row.category}</td>
                        <td style={{...styles.td,fontWeight:700,color:row.type==="Income"?"#059669":"#DC2626",textAlign:"right",whiteSpace:"nowrap"}}>
                          {row.isDuplicate&&<span title="Already exists" style={{marginRight:4}}>🔁</span>}
                          {fmt(row.amount)}
                        </td>
                        <td style={styles.td}><button onClick={()=>setEditRow({...row})} style={{padding:"3px 8px",fontSize:11,background:"#EEF2FF",border:"none",borderRadius:6,cursor:"pointer",color:"#4F46E5"}}>Edit</button></td>
                      </tr>
                    ))}
                    {displayed.length===0&&<tr><td colSpan={7} style={{...styles.td,textAlign:"center",padding:40,color:"#9CA3AF"}}>No entries to show.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div style={{display:"flex",gap:10,marginTop:16}}>
                <button onClick={()=>setStep(1)} style={styles.btnGhost}>← Back</button>
                <button onClick={doImport} style={{...styles.btnPrimary,flex:1}} disabled={selected.size===0||loading}>
                  {loading?`Importing… ${progress}%`:`Import ${selected.size} entries →`}
                </button>
              </div>
              {loading&&<div style={{marginTop:10,height:6,background:"#E5E7EB",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${progress}%`,background:"#4F46E5",borderRadius:4,transition:"width 0.3s"}}/></div>}
            </div>
          )}

          {/* STEP 3 — Done */}
          {step===3&&summary&&(
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:64,marginBottom:16}}>🎉</div>
              <p style={{fontSize:22,fontWeight:800,color:"#111827",margin:"0 0 20px"}}>Import Complete!</p>
              <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:24,flexWrap:"wrap"}}>
                <div style={{padding:"14px 28px",background:"#DCFCE7",borderRadius:12}}>
                  <div style={{fontSize:32,fontWeight:800,color:"#059669"}}>{summary.imported}</div>
                  <div style={{fontSize:13,color:"#166534"}}>imported</div>
                </div>
                <div style={{padding:"14px 28px",background:"#FEF9C3",borderRadius:12}}>
                  <div style={{fontSize:32,fontWeight:800,color:"#B45309"}}>{summary.skipped}</div>
                  <div style={{fontSize:13,color:"#78350F"}}>skipped (already existed)</div>
                </div>
              </div>
              <button onClick={onClose} style={{...styles.btnPrimary,padding:"12px 40px",fontSize:15}}>Done ✓</button>
            </div>
          )}
        </div>
      </div>

      {/* Edit row inline */}
      {editRow&&(
        <div style={{...styles.overlay,zIndex:1100}} onClick={e=>e.target===e.currentTarget&&setEditRow(null)}>
          <div style={{background:"#fff",borderRadius:16,padding:20,width:"90%",maxWidth:400,boxShadow:"0 25px 60px rgba(0,0,0,0.25)"}}>
            <p style={{fontWeight:700,fontSize:15,margin:"0 0 14px"}}>Edit Before Import</p>
            {[["Type","type",["Income","Expense"]],["Category","category",editRow.type==="Income"?INC_CATS:EXP_CATS],["Business","business",BUSINESSES]].map(([lbl,key,opts])=>(
              <div key={key} style={{marginBottom:12}}>
                <label style={styles.formLabel}>{lbl}</label>
                <select style={styles.select} value={editRow[key]} onChange={e=>setEditRow(r=>({...r,[key]:e.target.value}))}>
                  {opts.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setEditRow(null)} style={styles.btnGhost}>Cancel</button>
              <button onClick={()=>{setPreview(p=>p.map(r=>r._id===editRow._id?{...editRow}:r));setEditRow(null);}} style={styles.btnPrimary}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  AI CFO — 3 modes: Quick Check · Weekly Review · Monthly Analysis
// ═══════════════════════════════════════════════════════════════════════════════
function AIInsightsTab({ entries, channels, fxRate, apiKey, onSetApiKey }) {
  const masked = useMask();
  const [mode,setMode]       = useState("weekly");
  const [loading,setLoading] = useState(false);
  const [result,setResult]   = useState(null);
  const [error,setError]     = useState(null);
  const [keyInput,setKI]     = useState(apiKey||"");
  const [saving,setSaving]   = useState(false);
  const fe = useCallback(e=>fxAmt(e,fxRate),[fxRate]);

  const MODES = {
    quick:  {label:"⚡ Quick Check",      desc:"Daily 30-sec brief",         clr:"#059669"},
    weekly: {label:"📊 Weekly Review",    desc:"Trends & what to focus on",  clr:"#4F46E5"},
    monthly:{label:"🧠 Monthly Analysis", desc:"Full CFO strategic report",  clr:"#7C3AED"},
  };

  const buildPrompt = useCallback(()=>{
    const inc   = entries.filter(e=>e.type==="Income").reduce((s,e)=>s+fe(e),0);
    const exp   = entries.filter(e=>e.type==="Expense").reduce((s,e)=>s+fe(e),0);
    const opRev = entries.filter(e=>e.type==="Income"&&OP_CATS.includes(e.category)).reduce((s,e)=>s+fe(e),0);
    const loans = entries.filter(e=>["Business Loan Received","Investment / Loan Received"].includes(e.category)).reduce((s,e)=>s+fe(e),0);
    const monthly=MONTHS.map((m,i)=>({month:m,inc:entries.filter(e=>e.type==="Income"&&getMonth(e.date)===i).reduce((s,e)=>s+fe(e),0),exp:entries.filter(e=>e.type==="Expense"&&getMonth(e.date)===i).reduce((s,e)=>s+fe(e),0)})).filter(m=>m.inc>0||m.exp>0);
    const ec={}; entries.filter(e=>e.type==="Expense").forEach(e=>{ec[e.category]=(ec[e.category]||0)+fe(e);});
    const topExp=Object.entries(ec).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>`${k}:Rs${Math.round(v/1000)}k`).join(", ");
    const base=`Founder:Shailen. Nutrolis(supplements D2C), Migrizo(UK immigration consulting), Assignment consulting.
In=Rs${Math.round(inc/1000)}k|Exp=Rs${Math.round(exp/1000)}k|Net=Rs${Math.round((inc-exp)/1000)}k|OpRev=Rs${Math.round(opRev/1000)}k|Debt=Rs${Math.round(loans/1000)}k
Monthly:${monthly.map(m=>`${m.month}(In:Rs${Math.round(m.inc/1000)}k,Exp:Rs${Math.round(m.exp/1000)}k)`).join(" ")}
TopExp:${topExp}`;
    if(mode==="quick") return `${base}
CFO quick daily brief. SHORT. Return ONLY valid JSON no markdown:
{"status":"green|yellow|red","headline":"under 10 words","focus":["point","point","point"],"watch":["risk","risk"],"win":"one positive"}`;
    if(mode==="weekly") return `${base}
CFO weekly review. Specific numbers. Return ONLY valid JSON:
{"headline":"punchy","trend":"improving|stable|declining","highlights":["insight with #s","insight","insight"],"actions":["this week","this week","this week"],"metric":{"label":"key metric","value":"X","target":"Y"}}`;
    return `${base}
CFO monthly strategic analysis. Return ONLY valid JSON:
{"score":72,"grade":"B+","headline":"one sentence","insights":[{"title":"t","body":"b with numbers","type":"warning|success|info"}],"recommendations":[{"title":"t","action":"specific step","priority":"high|medium|low"}],"plan":[{"week":"Week 1-2","action":"a","goal":"g"},{"week":"Month 2","action":"a","goal":"g"},{"week":"Month 3","action":"a","goal":"g"}]}`;
  },[entries,fxRate,fe,mode]);

  const generate=async()=>{
    const key=keyInput.trim();
    if(!key){setError("Please enter your Claude API key first.");return;}
    setLoading(true);setError(null);setResult(null);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:1500,messages:[{role:"user",content:buildPrompt()}]})});
      if(!res.ok){const e=await res.json();throw new Error(e.error?.message||"API error");}
      const data=await res.json();
      const text=data.content[0].text.replace(/```json[\n]?|```/g,"").trim();
      setResult({mode,data:JSON.parse(text)});
      if(key!==apiKey)onSetApiKey(key);
    }catch(e){setError(e.message.includes("parse")?"Unexpected format — try again.":e.message);}
    finally{setLoading(false);}
  };
  const saveKey=async()=>{setSaving(true);await dbSetting("claude_key",keyInput.trim());onSetApiKey(keyInput.trim());setSaving(false);};

  const sClr={green:"#059669",yellow:"#B45309",red:"#DC2626"};
  const pClr={high:"#EF4444",medium:"#F59E0B",low:"#10B981"};
  const iClr={warning:["#FFFBEB","#FDE68A","#92400E"],success:["#F0FDF4","#BBF7D0","#166534"],info:["#EFF6FF","#BFDBFE","#1e40af"]};

  return (
    <div style={{padding:"0 0 40px"}}>
      {/* Mode selector */}
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {Object.entries(MODES).map(([k,v])=>(
          <button key={k} onClick={()=>{setMode(k);setResult(null);}} style={{padding:"10px 18px",borderRadius:10,border:mode===k?`2px solid ${v.clr}`:"1px solid #E2E8F0",background:mode===k?v.clr+"18":"#fff",color:mode===k?v.clr:"#64748B",fontWeight:mode===k?700:500,cursor:"pointer",fontSize:13,textAlign:"left"}}>
            <div>{v.label}</div><div style={{fontSize:11,opacity:0.65,marginTop:2}}>{v.desc}</div>
          </button>
        ))}
      </div>

      {!apiKey&&(
        <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:12,padding:16,marginBottom:20}}>
          <p style={{fontWeight:700,fontSize:14,color:"#92400E",margin:"0 0 8px"}}>🔑 Enter Claude API Key</p>
          <p style={{fontSize:13,color:"#78350F",margin:"0 0 12px"}}>Get free key at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{color:"#4F46E5"}}>console.anthropic.com</a> → API Keys → Create Key</p>
          <div style={{display:"flex",gap:8}}>
            <input value={keyInput} onChange={e=>setKI(e.target.value)} placeholder="sk-ant-api03-…" style={{flex:1,padding:"9px 11px",border:"1px solid #CBD5E1",borderRadius:8,fontSize:12,outline:"none",background:"#F8FAFC",fontFamily:"monospace"}} type="password"/>
            <button onClick={saveKey} disabled={saving||!keyInput} style={{padding:"9px 18px",background:"#4F46E5",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{saving?"Saving…":"Save Key"}</button>
          </div>
        </div>
      )}

      {!result&&(
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"50px 24px",textAlign:"center"}}>
          <div style={{fontSize:44,marginBottom:16}}>{Object.values(MODES).find((_,i)=>Object.keys(MODES)[i]===mode)?.label.split(" ")[0]||"✦"}</div>
          <p style={{fontSize:20,fontWeight:800,color:"#0F172A",margin:"0 0 8px"}}>{MODES[mode].label}</p>
          <p style={{fontSize:14,color:"#64748B",margin:"0 0 28px",lineHeight:1.6,maxWidth:400,marginLeft:"auto",marginRight:"auto"}}>{MODES[mode].desc} · {entries.length} transactions across 3 businesses</p>
          {error&&<p style={{color:"#EF4444",fontSize:13,marginBottom:16}}>{error}</p>}
          {loading?(
            <div><div style={{width:40,height:40,border:"4px solid #E2E8F0",borderTop:`4px solid ${MODES[mode].clr}`,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 12px"}}/><p style={{color:"#64748B",fontSize:14}}>Thinking like your CFO…</p></div>
          ):(
            <button onClick={generate} disabled={!apiKey&&!keyInput} style={{padding:"14px 36px",background:MODES[mode].clr,color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer"}}>
              Generate {MODES[mode].label}
            </button>
          )}
          {apiKey&&<div style={{marginTop:20,display:"flex",gap:8,maxWidth:380,margin:"20px auto 0"}}>
            <input value={keyInput} onChange={e=>setKI(e.target.value)} placeholder="Update API key…" style={{flex:1,padding:"8px 10px",border:"1px solid #CBD5E1",borderRadius:8,fontSize:12,outline:"none",fontFamily:"monospace"}} type="password"/>
            <button onClick={saveKey} style={{padding:"8px 14px",background:"#F1F5F9",border:"none",borderRadius:8,fontSize:12,cursor:"pointer"}}>Update</button>
          </div>}
        </div>
      )}

      {result&&result.mode==="quick"&&(
        <div>
          <div style={{background:sClr[result.data.status]+"12",border:`1px solid ${sClr[result.data.status]}40`,borderRadius:14,padding:"16px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:28}}>{result.data.status==="green"?"🟢":result.data.status==="yellow"?"🟡":"🔴"}</span>
            <p style={{fontWeight:800,fontSize:17,color:"#0F172A",margin:0}}>{result.data.headline}</p>
          </div>
          {result.data.win&&<div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#166534",fontWeight:600}}>🏆 {result.data.win}</div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12,marginBottom:16}}>
            <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"14px 16px"}}><p style={{fontWeight:700,color:"#166534",margin:"0 0 10px",fontSize:13}}>✅ Focus Today</p>{result.data.focus?.map((f,i)=><p key={i} style={{fontSize:13,color:"#374151",margin:"0 0 8px",paddingLeft:12,borderLeft:"3px solid #22C55E",lineHeight:1.4}}>→ {f}</p>)}</div>
            <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"14px 16px"}}><p style={{fontWeight:700,color:"#7F1D1D",margin:"0 0 10px",fontSize:13}}>👀 Watch</p>{result.data.watch?.map((f,i)=><p key={i} style={{fontSize:13,color:"#374151",margin:"0 0 8px",paddingLeft:12,borderLeft:"3px solid #EF4444",lineHeight:1.4}}>⚠ {f}</p>)}</div>
          </div>
          <button onClick={()=>setResult(null)} style={{padding:"8px 18px",background:"#F1F5F9",border:"none",borderRadius:8,fontSize:13,cursor:"pointer",width:"100%"}}>↻ Regenerate</button>
        </div>
      )}

      {result&&result.mode==="weekly"&&(
        <div>
          <div style={{background:result.data.trend==="improving"?"#F0FDF4":result.data.trend==="declining"?"#FFF1F2":"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:14,padding:"14px 18px",marginBottom:16}}>
            <p style={{fontWeight:800,fontSize:16,color:"#0F172A",margin:"0 0 6px"}}>{result.data.headline}</p>
            <span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,background:result.data.trend==="improving"?"#DCFCE7":result.data.trend==="declining"?"#FEE2E2":"#EEF2FF",color:result.data.trend==="improving"?"#166534":result.data.trend==="declining"?"#7F1D1D":"#4F46E5"}}>
              Trend: {result.data.trend}
            </span>
          </div>
          {result.data.metric&&<div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"14px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
            <div><p style={{fontSize:11,color:"#64748B",fontWeight:700,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:1}}>{result.data.metric.label}</p><p style={{fontSize:28,fontWeight:900,color:"#4F46E5",margin:0}}>{masked?"••••":result.data.metric.value}</p></div>
            <div style={{fontSize:13,color:"#64748B"}}>Target: <b>{result.data.metric.target}</b></div>
          </div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12,marginBottom:16}}>
            <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"14px 16px"}}><p style={{fontWeight:700,color:"#1E293B",margin:"0 0 12px",fontSize:13}}>📊 Highlights</p>{result.data.highlights?.map((h,i)=><p key={i} style={{fontSize:13,color:"#374151",margin:"0 0 10px",lineHeight:1.5,paddingLeft:12,borderLeft:"3px solid #6366F1"}}>→ {h}</p>)}</div>
            <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"14px 16px"}}><p style={{fontWeight:700,color:"#1E293B",margin:"0 0 12px",fontSize:13}}>⚡ This Week</p>{result.data.actions?.map((a,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:10,alignItems:"flex-start"}}><span style={{display:"inline-block",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600,background:["#EEF2FF","#F0FDF4","#FFFBEB"][i%3],color:["#4F46E5","#059669","#B45309"][i%3],flexShrink:0}}>{i+1}</span><p style={{fontSize:13,color:"#374151",margin:0,lineHeight:1.5}}>{a}</p></div>)}</div>
          </div>
          <button onClick={()=>setResult(null)} style={{padding:"8px 18px",background:"#F1F5F9",border:"none",borderRadius:8,fontSize:13,cursor:"pointer",width:"100%"}}>↻ Regenerate</button>
        </div>
      )}

      {result&&result.mode==="monthly"&&(
        <div>
          <div style={{background:"linear-gradient(135deg,#1e1b4b,#312e81)",borderRadius:16,padding:"24px 28px",marginBottom:20,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
            <div style={{textAlign:"center"}}>
              <svg width={100} height={100} viewBox="0 0 100 100">
                <circle cx={50} cy={50} r={42} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={8}/>
                <circle cx={50} cy={50} r={42} fill="none" stroke={result.data.score>=70?"#22C55E":result.data.score>=50?"#F59E0B":"#EF4444"} strokeWidth={8} strokeDasharray={`${(result.data.score/100)*264} 264`} strokeLinecap="round" transform="rotate(-90 50 50)"/>
                <text x={50} y={46} textAnchor="middle" fill="#fff" fontSize={24} fontWeight={800}>{result.data.score}</text>
                <text x={50} y={62} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={11}>/100</text>
              </svg>
            </div>
            <div style={{flex:1}}>
              <p style={{color:"rgba(255,255,255,0.5)",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,margin:"0 0 4px"}}>Financial Health</p>
              <p style={{color:"#fff",fontSize:24,fontWeight:900,margin:"0 0 6px"}}>{result.data.grade}</p>
              <p style={{color:"rgba(255,255,255,0.75)",fontSize:14,margin:0,lineHeight:1.5}}>{result.data.headline}</p>
            </div>
            <button onClick={()=>setResult(null)} disabled={loading} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:8,padding:"8px 14px",color:"#fff",fontSize:12,cursor:"pointer"}}>↻ Refresh</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12,marginBottom:20}}>
            {result.data.insights?.map((ins,i)=>{const [bg,bdr,txt]=iClr[ins.type]||iClr.info;return(<div key={i} style={{background:bg,border:`1px solid ${bdr}`,borderRadius:12,padding:"14px 16px"}}><p style={{fontWeight:700,fontSize:14,color:txt,margin:"0 0 6px"}}>{ins.title}</p><p style={{fontSize:13,color:txt,margin:0,lineHeight:1.5,opacity:0.85}}>{ins.body}</p></div>);})}
          </div>
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:0,overflow:"hidden",marginBottom:20}}>
            <p style={{fontSize:15,fontWeight:700,color:"#0F172A",padding:"14px 16px 0",margin:0}}>Action Items</p>
            {result.data.recommendations?.map((r,i)=>(
              <div key={i} style={{display:"flex",gap:12,padding:"12px 16px",borderTop:"1px solid #F1F5F9",alignItems:"flex-start"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:pClr[r.priority]||"#94A3B8",marginTop:5,flexShrink:0}}/>
                <div style={{flex:1}}><p style={{fontWeight:700,fontSize:14,color:"#0F172A",margin:"0 0 3px"}}>{r.title}</p><p style={{fontSize:13,color:"#475569",margin:0,lineHeight:1.5}}>{r.action}</p></div>
                <span style={{fontSize:11,fontWeight:700,color:pClr[r.priority]||"#94A3B8",textTransform:"uppercase",flexShrink:0}}>{r.priority}</span>
              </div>
            ))}
          </div>
          {result.data.plan&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
              {result.data.plan.map((step,i)=>(
                <div key={i} style={{background:"#fff",borderRadius:12,border:"1px solid #E2E8F0",padding:"14px 16px",borderLeft:`4px solid ${COLORS[i%COLORS.length]}`}}>
                  <p style={{fontWeight:700,fontSize:13,color:COLORS[i%COLORS.length],margin:"0 0 6px"}}>{step.week}</p>
                  <p style={{fontWeight:600,fontSize:14,color:"#0F172A",margin:"0 0 4px"}}>{step.action}</p>
                  <p style={{fontSize:12,color:"#64748B",margin:0,lineHeight:1.4}}>🎯 {step.goal}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SMALL REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
function StatCard({ label, val, sub, color, bg, bdr }) {
  return (
    <div style={{ background:bg, borderRadius:14, border:`1px solid ${bdr}`, padding:"16px 18px" }}>
      <p style={{ fontSize:11, fontWeight:700, color:"#6B7280", textTransform:"uppercase", letterSpacing:"0.7px", margin:"0 0 6px" }}>{label}</p>
      <p style={{ fontSize:22, fontWeight:800, color, margin:"0 0 4px", lineHeight:1 }}>{val}</p>
      <p style={{ fontSize:12, color:"#6B7280", margin:0 }}>{sub}</p>
    </div>
  );
}

function Pill({ label, active, color="#4F46E5", bg, onClick }) {
  return (
    <button onClick={onClick} style={{ padding:"6px 14px", borderRadius:20, fontSize:13, fontWeight:active?700:500, cursor:"pointer", border:active?`2px solid ${color}`:"1px solid #E5E7EB", background:active?(bg||color+"18"):"#fff", color:active?color:"#4B5563", whiteSpace:"nowrap" }}>
      {label}
    </button>
  );
}

function Modal({ children, onClose, maxWidth=560 }) {
  return (
    <div style={styles.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"#fff", borderRadius:16, padding:24, width:"calc(100% - 32px)", maxWidth, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 25px 60px rgba(0,0,0,0.2)" }}>
        {children}
      </div>
    </div>
  );
}

function AddEntry({ onAdd, onClose }) {
  const today = new Date().toISOString().split("T")[0];
  const [d,   setD]   = useState(today);
  const [biz, setBiz] = useState("Nutrolis");
  const [acc, setAcc] = useState("lrf");
  const [typ, setTyp] = useState("Income");
  const [cat, setCat] = useState(INC_CATS[0]);
  const [dsc, setDsc] = useState("");
  const [amt, setAmt] = useState("");
  const cats = typ==="Income"?INC_CATS:EXP_CATS;
  const save = async () => {
    if (!amt||!d||!dsc.trim()) return;
    const e = { id:Date.now(), date:d, business:biz, account:acc, type:typ, category:cat, description:dsc, amount:parseFloat(amt) };
    await dbAdd(e); onAdd(e);
  };
  return (
    <Modal onClose={onClose}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <p style={{ fontWeight:800, fontSize:16, margin:0 }}>+ New Transaction</p>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {[["Date","date","date",d,setD],["Business","select","",biz,setBiz,BUSINESSES],["Account","select","",acc,setAcc],["Type","select","",typ,(v)=>{setTyp(v);setCat(v==="Income"?INC_CATS[0]:EXP_CATS[0])},["Income","Expense"]],["Category","select","",cat,setCat]].map(([lbl,t,tp,v,fn,opts])=>(
          <div key={lbl}>
            <label style={styles.formLabel}>{lbl}</label>
            {t==="select"
              ? <select style={styles.select} value={v} onChange={e=>fn(e.target.value)}>
                  {(opts||(lbl==="Account"?ACCOUNTS.map(a=>({id:a.id,l:a.label})):lbl==="Category"?cats:[])).map(o=>typeof o==="string"?<option key={o}>{o}</option>:<option key={o.id||o} value={o.id||o}>{o.label||o.l||o}</option>)}
                </select>
              : <input type="date" style={styles.input} value={v} onChange={e=>fn(e.target.value)} />}
          </div>
        ))}
        <div style={{ gridColumn:"span 2" }}>
          <label style={styles.formLabel}>Description</label>
          <input style={styles.input} value={dsc} onChange={e=>setDsc(e.target.value)} onKeyDown={e=>e.key==="Enter"&&save()} placeholder="e.g. Amazon payout week 1" />
        </div>
        <div>
          <label style={styles.formLabel}>Amount ({acct(acc).cur==="GBP"?"£":"₹"})</label>
          <input type="number" style={styles.input} value={amt} onChange={e=>setAmt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&save()} placeholder="5000" />
        </div>
        <div style={{ display:"flex", alignItems:"flex-end" }}>
          <button onClick={save} style={{ ...styles.btnPrimary, width:"100%" }}>Add Entry</button>
        </div>
      </div>
    </Modal>
  );
}

function EditModal({ entry, onSave, onClose }) {
  const [e, setE] = useState({...entry, amount:String(entry.amount)});
  const cats = e.type==="Income"?INC_CATS:EXP_CATS;
  const s = (k,v) => setE(p=>({...p,[k]:v}));
  return (
    <Modal onClose={onClose}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <p style={{ fontWeight:800, fontSize:16, margin:0 }}>Edit Entry</p>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
        <div><label style={styles.formLabel}>Date</label><input type="date" style={styles.input} value={e.date} onChange={ev=>s("date",ev.target.value)} /></div>
        <div><label style={styles.formLabel}>Business</label><select style={styles.select} value={e.business} onChange={ev=>s("business",ev.target.value)}>{BUSINESSES.map(b=><option key={b}>{b}</option>)}</select></div>
        <div><label style={styles.formLabel}>Account</label><select style={styles.select} value={e.account} onChange={ev=>s("account",ev.target.value)}>{ACCOUNTS.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}</select></div>
        <div><label style={styles.formLabel}>Type</label><select style={styles.select} value={e.type} onChange={ev=>{s("type",ev.target.value);s("category",ev.target.value==="Income"?INC_CATS[0]:EXP_CATS[0])}}><option>Income</option><option>Expense</option></select></div>
        <div><label style={styles.formLabel}>Category</label><select style={styles.select} value={e.category} onChange={ev=>s("category",ev.target.value)}>{cats.map(c=><option key={c}>{c}</option>)}</select></div>
        <div><label style={styles.formLabel}>Amount</label><input type="number" style={styles.input} value={e.amount} onChange={ev=>s("amount",ev.target.value)} /></div>
        <div style={{ gridColumn:"span 2" }}><label style={styles.formLabel}>Description</label><input style={styles.input} value={e.description} onChange={ev=>s("description",ev.target.value)} /></div>
      </div>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button onClick={onClose} style={styles.btnGhost}>Cancel</button>
        <button onClick={()=>onSave({...e,amount:parseFloat(e.amount)})} style={styles.btnPrimary}>Save</button>
      </div>
    </Modal>
  );
}

function ChannelModal({ ch, onSave, onClose }) {
  const [d,setD] = useState(ch ? {...ch,cstr:(ch.cats||[]).join(", ")} : {name:"",biz:"Nutrolis",clr:"#6366F1",bg:"#EEF2FF",cstr:""});
  return (
    <Modal onClose={onClose} maxWidth={480}>
      <p style={{ fontWeight:800, fontSize:16, margin:"0 0 18px" }}>{ch?"Edit":"Add"} Income Channel</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
        <div style={{ gridColumn:"span 2" }}><label style={styles.formLabel}>Name</label><input style={styles.input} value={d.name} onChange={e=>setD(p=>({...p,name:e.target.value}))} placeholder="e.g. Migrizo UK" /></div>
        <div><label style={styles.formLabel}>Business</label><select style={styles.select} value={d.biz} onChange={e=>setD(p=>({...p,biz:e.target.value}))}>{BUSINESSES.map(b=><option key={b}>{b}</option>)}</select></div>
        <div><label style={styles.formLabel}>Color</label><input type="color" value={d.clr} onChange={e=>setD(p=>({...p,clr:e.target.value}))} style={{ ...styles.input, padding:4, height:40 }} /></div>
        <div style={{ gridColumn:"span 2" }}><label style={styles.formLabel}>Categories (comma-separated)</label><input style={styles.input} value={d.cstr} onChange={e=>setD(p=>({...p,cstr:e.target.value}))} placeholder="Amazon Revenue, Direct Sales" /><p style={{ fontSize:12,color:"#6B7280",marginTop:4 }}>Entry categories that count as revenue for this channel.</p></div>
      </div>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button onClick={onClose} style={styles.btnGhost}>Cancel</button>
        <button onClick={()=>onSave({...(ch||{}),id:(ch?.id||Date.now()),name:d.name,biz:d.biz,clr:d.clr,bg:d.bg||"#EEF2FF",cats:d.cstr.split(",").map(s=>s.trim()).filter(Boolean)})} style={styles.btnPrimary}>{ch?"Save":"Add Channel"}</button>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DECISION DASHBOARD — understand everything in 5 seconds
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardTab({ entries, channels, fxRate }) {
  const masked = useMask();
  const fe = useCallback(e => fxAmt(e,fxRate), [fxRate]);
  const inc    = useMemo(()=>entries.filter(e=>e.type==="Income").reduce((s,e)=>s+fe(e),0),[entries,fe]);
  const exp    = useMemo(()=>entries.filter(e=>e.type==="Expense").reduce((s,e)=>s+fe(e),0),[entries,fe]);
  const net    = inc - exp;
  const opRev  = useMemo(()=>entries.filter(e=>e.type==="Income"&&OP_CATS.includes(e.category)).reduce((s,e)=>s+fe(e),0),[entries,fe]);
  const loans  = useMemo(()=>entries.filter(e=>["Business Loan Received","Investment / Loan Received"].includes(e.category)).reduce((s,e)=>s+fe(e),0),[entries,fe]);

  const monthly = useMemo(()=>MONTHS.map((m,i)=>({
    month:m,
    inc: entries.filter(e=>e.type==="Income"&&getMonth(e.date)===i).reduce((s,e)=>s+fe(e),0),
    exp: entries.filter(e=>e.type==="Expense"&&getMonth(e.date)===i).reduce((s,e)=>s+fe(e),0),
    opR: entries.filter(e=>e.type==="Income"&&OP_CATS.includes(e.category)&&getMonth(e.date)===i).reduce((s,e)=>s+fe(e),0),
  })).filter(m=>m.inc>0||m.exp>0),[entries,fe]);

  const bizBreak = useMemo(()=>BUSINESSES.map(b=>({
    name:b,
    inc:entries.filter(e=>e.business===b&&e.type==="Income").reduce((s,e)=>s+fe(e),0),
    exp:entries.filter(e=>e.business===b&&e.type==="Expense").reduce((s,e)=>s+fe(e),0),
  })),[entries,fe]);

  const expCats = useMemo(()=>{
    const m={};entries.filter(e=>e.type==="Expense").forEach(e=>{m[e.category]=(m[e.category]||0)+fe(e);});
    return Object.entries(m).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,6);
  },[entries,fe]);

  const flags = useMemo(()=>{
    const green=[],red=[];
    if (monthly.length>=2){
      const last=monthly[monthly.length-1],prev=monthly[monthly.length-2];
      if(last.inc>prev.inc)    green.push(`Revenue up ${Math.round((last.inc-prev.inc)/prev.inc*100)}% vs previous month`);
      if(last.exp<prev.exp)    green.push(`Expenses down ${Math.round((prev.exp-last.exp)/prev.exp*100)}% vs previous month`);
      if(last.inc<prev.inc*0.8) red.push(`Revenue dropped ${Math.round((prev.inc-last.inc)/prev.inc*100)}% vs previous month`);
      if(last.exp>prev.exp*1.3) red.push(`Expenses spiked ${Math.round((last.exp-prev.exp)/prev.exp*100)}% vs previous month`);
    }
    if(loans>0){const dr=loans/inc;if(dr>0.35)red.push(`Debt is ${Math.round(dr*100)}% of inflow — high repayment pressure`);else green.push("Debt-to-income ratio is manageable");}
    if(opRev>0&&opRev/inc>0.22)green.push(`Operating revenue is ${Math.round(opRev/inc*100)}% of inflow — solid`);
    else if(opRev>0&&opRev/inc<0.12)red.push(`Only ${Math.round(opRev/inc*100)}% op. revenue — heavy reliance on capital`);
    const avgBurn=exp/(monthly.length||1);const runway=net/avgBurn;
    if(runway>6)green.push(`~${Math.round(runway)} months runway at current burn rate`);
    else if(runway<3&&runway>0)red.push(`Only ~${Math.round(runway)} months runway — review burn now`);
    const feb=monthly.find(m=>m.month==="Feb");if(feb&&feb.inc<feb.exp)red.push("February cashflow was negative — watch seasonal dip");
    const miz=bizBreak.find(b=>b.name==="Migrizo");if(miz&&opRev>0&&miz.inc/opRev>0.45)green.push(`Migrizo driving ${Math.round(miz.inc/opRev*100)}% of operating revenue`);
    return{green:green.slice(0,4),red:red.slice(0,4)};
  },[monthly,opRev,inc,exp,net,loans,bizBreak]);

  const runway = Math.max(0, Math.round(net/(exp/(monthly.length||1))));

  return (
    <div>
      {/* ── Hero ── */}
      <div style={{background:"linear-gradient(135deg,#1e1b4b 0%,#312e81 60%,#4338ca 100%)",borderRadius:20,padding:28,marginBottom:20,color:"#fff"}}>
        <p style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,0.5)",margin:"0 0 8px"}}>NET POSITION · {new Date().getFullYear()}</p>
        <p style={{fontSize:52,fontWeight:900,margin:"0 0 4px",letterSpacing:-2,lineHeight:1}}>{masked?"₹ ••••••":fmt(net)}</p>
        <p style={{fontSize:14,color:net>=0?"#86EFAC":"#FCA5A5",margin:"0 0 24px",fontWeight:500}}>{net>=0?"↑ Positive":"↓ Negative"} · {entries.length} entries</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {[["💰 Total In",inc,"#86EFAC"],["💸 Total Out",exp,"#FCA5A5"],["🏪 Op. Revenue",opRev,"#FDE68A"]].map(([lbl,val,clr])=>(
            <div key={lbl} style={{background:"rgba(255,255,255,0.08)",borderRadius:12,padding:"12px 14px"}}>
              <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:"0 0 4px",fontWeight:600}}>{lbl}</p>
              <p style={{fontSize:18,fontWeight:800,color:clr,margin:0}}>{masked?"₹ ••••":fmt(val)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12,marginBottom:20}}>
        {[
          ["⏱ Runway",`~${runway} months`,"at current burn","#0EA5E9","#F0F9FF"],
          ["🔥 Burn/mo",fmt(exp/(monthly.length||1),masked),"avg","#EF4444","#FFF1F2"],
          ["🏦 Debt",fmt(loans,masked),"to repay","#8B5CF6","#F5F3FF"],
          ["📈 Best Month",monthly.length?monthly.reduce((a,b)=>b.inc>a.inc?b:a,{inc:0,month:"—"}).month:"—","by inflow","#059669","#F0FDF4"],
        ].map(([lbl,val,sub,clr,bg])=>(
          <div key={lbl} style={{background:bg,borderRadius:14,border:`1px solid ${clr}22`,padding:"14px 16px"}}>
            <p style={{fontSize:11,color:"#64748B",fontWeight:700,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:"0.5px"}}>{lbl}</p>
            <p style={{fontSize:20,fontWeight:800,color:clr,margin:"0 0 2px"}}>{val}</p>
            <p style={{fontSize:11,color:"#94A3B8",margin:0}}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Flags ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12,marginBottom:20}}>
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #BBF7D0",padding:"16px 18px"}}>
          <p style={{fontWeight:700,fontSize:14,color:"#166534",margin:"0 0 12px"}}>🟢 Green Flags</p>
          {flags.green.length===0?<p style={{fontSize:13,color:"#94A3B8"}}>Add more data to see flags</p>:flags.green.map((f,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
              <span style={{color:"#22C55E",flexShrink:0}}>✓</span>
              <p style={{fontSize:13,color:"#166534",margin:0,lineHeight:1.5}}>{f}</p>
            </div>
          ))}
        </div>
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #FECACA",padding:"16px 18px"}}>
          <p style={{fontWeight:700,fontSize:14,color:"#7F1D1D",margin:"0 0 12px"}}>🔴 Risk Signals</p>
          {flags.red.length===0?<p style={{fontSize:13,color:"#94A3B8"}}>No risk signals — looking good!</p>:flags.red.map((f,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
              <span style={{color:"#EF4444",flexShrink:0}}>⚠</span>
              <p style={{fontSize:13,color:"#7F1D1D",margin:0,lineHeight:1.5}}>{f}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Chart ── */}
      <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"16px 18px",marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
          <p style={{fontSize:15,fontWeight:700,color:"#0F172A",margin:0}}>Cash Flow Trend</p>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>exportCSV(entries,"cashflow.csv")} style={{padding:"6px 12px",background:"#F1F5F9",border:"none",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:500}}>↓ CSV</button>
            <button onClick={()=>exportXLSX(entries,"founder-finance.xlsx")} style={{padding:"6px 14px",background:"#4F46E5",color:"#fff",border:"none",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:600}}>↓ Excel</button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthly} margin={{top:5,right:5,left:-15,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
            <XAxis dataKey="month" tick={{fontSize:11,fill:"#94A3B8"}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:10,fill:"#94A3B8"}} tickFormatter={v=>masked?"":fmtK(v)} axisLine={false} tickLine={false}/>
            <Tooltip formatter={v=>[masked?"₹ ••••":fmt(v)]} contentStyle={{fontSize:13,borderRadius:10,border:"1px solid #E2E8F0"}}/>
            <Legend wrapperStyle={{fontSize:12}}/>
            <Bar dataKey="inc" fill="#6EE7B7" radius={[4,4,0,0]} name="Income"/>
            <Bar dataKey="exp" fill="#FCA5A5" radius={[4,4,0,0]} name="Expense"/>
            <Bar dataKey="opR" fill="#FDE68A" radius={[4,4,0,0]} name="Op.Rev"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Business + Expenses ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16,marginBottom:20}}>
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"16px 18px"}}>
          <p style={{fontSize:15,fontWeight:700,color:"#0F172A",margin:"0 0 14px"}}>Business Performance</p>
          {bizBreak.map((b,i)=>{
            const bNet=b.inc-b.exp;
            return(
              <div key={b.name} style={{marginBottom:12,paddingBottom:12,borderBottom:i<bizBreak.length-1?"1px solid #F1F5F9":"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{width:10,height:10,borderRadius:3,background:BIZ_CLR[b.name]||"#94A3B8",display:"inline-block"}}/>
                    <span style={{fontWeight:700,fontSize:14,color:"#1E293B"}}>{b.name}</span>
                  </div>
                  <span style={{fontWeight:700,fontSize:14,color:bNet>=0?"#059669":"#DC2626"}}>{bNet>=0?"+":""}{masked?"••••":fmt(bNet)}</span>
                </div>
                <div style={{height:6,background:"#F1F5F9",borderRadius:4,overflow:"hidden",marginBottom:4}}>
                  <div style={{height:"100%",width:inc>0?pct(b.inc,inc):"0%",background:BIZ_CLR[b.name]||"#94A3B8",borderRadius:4}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#64748B"}}>
                  <span>In: {masked?"••••":fmt(b.inc)}</span><span>Out: {masked?"••••":fmt(b.exp)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"16px 18px"}}>
          <p style={{fontSize:15,fontWeight:700,color:"#0F172A",margin:"0 0 14px"}}>Top Expenses</p>
          {expCats.map((e,i)=>(
            <div key={e.name} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <span style={{width:8,height:8,borderRadius:2,background:COLORS[i%COLORS.length],flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:13,color:"#374151",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.name}</span>
                  <span style={{fontSize:13,fontWeight:700,color:"#DC2626",flexShrink:0,marginLeft:8}}>{masked?"••••":fmt(e.value)}</span>
                </div>
                <div style={{height:4,background:"#F1F5F9",borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:pct(e.value,exp),background:COLORS[i%COLORS.length],borderRadius:2}}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Monthly table ── */}
      <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"16px 18px"}}>
        <p style={{fontSize:15,fontWeight:700,color:"#0F172A",margin:"0 0 14px"}}>Monthly Summary</p>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:400}}>
            <thead><tr><th style={styles.th}>Month</th><th style={{...styles.th,textAlign:"right"}}>In</th><th style={{...styles.th,textAlign:"right"}}>Out</th><th style={{...styles.th,textAlign:"right"}}>Net</th></tr></thead>
            <tbody>
              {monthly.map((m,i)=>{const n=m.inc-m.exp;return(
                <tr key={m.month} style={{background:i%2===0?"#fff":"#FAFAFA"}}>
                  <td style={{...styles.td,fontWeight:600}}>{m.month}</td>
                  <td style={{...styles.td,textAlign:"right",color:"#059669",fontWeight:600}}>{masked?"••••":fmt(m.inc)}</td>
                  <td style={{...styles.td,textAlign:"right",color:"#DC2626",fontWeight:600}}>{masked?"••••":fmt(m.exp)}</td>
                  <td style={{...styles.td,textAlign:"right"}}><span style={{...styles.badge,background:n>=0?"#DCFCE7":"#FEE2E2",color:n>=0?"#166534":"#7F1D1D"}}>{n>=0?"+":""}{masked?"••••":fmt(n)}</span></td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </div>
      {pageCount>1&&(
        <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:14,alignItems:"center",flexWrap:"wrap"}}>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{padding:"6px 12px",background:"#F1F5F9",border:"none",borderRadius:6,cursor:"pointer",fontSize:13,color:page===1?"#CBD5E1":"#4F46E5"}}>←</button>
          {Array.from({length:Math.min(pageCount,7)},(_,i)=>{
            const p=pageCount<=7?i+1:page<=4?i+1:page>=pageCount-3?pageCount-6+i:page-3+i;
            return <button key={p} onClick={()=>setPage(p)} style={{padding:"6px 12px",background:page===p?"#4F46E5":"#F1F5F9",color:page===p?"#fff":"#374151",border:"none",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:page===p?700:400}}>{p}</button>;
          })}
          <button onClick={()=>setPage(p=>Math.min(pageCount,p+1))} disabled={page===pageCount} style={{padding:"6px 12px",background:"#F1F5F9",border:"none",borderRadius:6,cursor:"pointer",fontSize:13,color:page===pageCount?"#CBD5E1":"#4F46E5"}}>→</button>
          <span style={{fontSize:12,color:"#94A3B8",marginLeft:6}}>Page {page} of {pageCount} · {rows.length} total</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ACCOUNTS TAB// ═══════════════════════════════════════════════════════════════════════════════
//  ACCOUNTS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function AccountsTab({ entries, fxRate, onEdit, onDelete, onImport }) {
  const [acctId, setAcctId] = useState("lrf");
  const rows = useMemo(()=>entries.filter(e=>e.account===acctId).sort((a,b)=>b.date.localeCompare(a.date)),[entries,acctId]);
  const cur  = acct(acctId).cur;
  const inc  = rows.filter(e=>e.type==="Income").reduce((s,e)=>s+e.amount,0);
  const exp  = rows.filter(e=>e.type==="Expense").reduce((s,e)=>s+e.amount,0);
  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
        {ACCOUNTS.map(a=>(
          <button key={a.id} onClick={()=>setAcctId(a.id)} style={{ padding:"9px 18px", borderRadius:10, fontSize:13, fontWeight:acctId===a.id?700:500, cursor:"pointer", border:acctId===a.id?`2px solid ${a.clr}`:"1px solid #E5E7EB", background:acctId===a.id?a.clr+"18":"#fff", color:acctId===a.id?a.clr:"#4B5563" }}>
            {a.label}{a.cur==="GBP"&&<span style={{ fontSize:12,color:"#6B7280",marginLeft:4 }}>£</span>}
          </button>
        ))}
      </div>
      <div className="ffd-grid-3" style={{ marginBottom:20 }}>
        <StatCard label="Total In"    val={fmtCur(inc,cur)} sub=""        color="#059669" bg="#F0FDF4" bdr="#6EE7B7" />
        <StatCard label="Total Out"   val={fmtCur(exp,cur)} sub=""        color="#DC2626" bg="#FEF2F2" bdr="#FCA5A5" />
        <StatCard label="Net Balance" val={fmtCur(inc-exp,cur)} sub=""    color="#4338CA" bg="#EEF2FF" bdr="#A5B4FC" />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>
        <p style={{ ...styles.sectionTitle, margin:0 }}>{acct(acctId).label} — {rows.length} entries</p>
        <button onClick={()=>onImport(acctId)} style={{ ...styles.btnPrimary, padding:"10px 16px", fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
          📥 Import Bank Statement
        </button>
      </div>
      <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#78350F", marginBottom:14 }}>
        💡 Download CSV or Excel from your bank portal → click Import Bank Statement → columns auto-detected
      </div>
      <div style={{ ...styles.card, overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth:560 }}>
          <thead>
            <tr><th style={styles.th}>#</th><th style={styles.th}>Date</th><th style={styles.th}>Business</th><th style={styles.th}>Type</th><th style={styles.th}>Category</th><th style={styles.th}>Description</th><th style={{ ...styles.th, textAlign:"right" }}>Amt</th><th style={styles.th}/></tr>
          </thead>
          <tbody>
            {rows.map((e,i)=>(
              <tr key={e.id} style={{ background:i%2===0?"#fff":"#FAFAFA" }}>
                <td style={{ ...styles.td, color:"#9CA3AF", fontSize:12 }}>—</td>
                <td style={{ ...styles.td, whiteSpace:"nowrap", color:"#4B5563" }}>{new Date(e.date+"T12:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"2-digit"})}</td>
                <td style={styles.td}><span style={{ ...styles.badge, background:(BIZ_CLR[e.business]||"#64748B")+"22", color:BIZ_CLR[e.business]||"#64748B" }}>{e.business}</span></td>
                <td style={styles.td}><span style={{ ...styles.badge, background:e.type==="Income"?"#DCFCE7":"#FEE2E2", color:e.type==="Income"?"#166534":"#7F1D1D" }}>{e.type}</span></td>
                <td style={{ ...styles.td, fontSize:12 }}>{e.category}</td>
                <td style={{ ...styles.td, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.description}</td>
                <td style={{ ...styles.td, fontWeight:700, color:e.type==="Income"?"#059669":"#DC2626", textAlign:"right", whiteSpace:"nowrap" }}>{e.type==="Income"?"+":"-"}{cur==="GBP"?`£${e.amount.toLocaleString()}`:`₹${e.amount.toLocaleString("en-IN")}`}</td>
                <td style={{ ...styles.td, whiteSpace:"nowrap" }}>
                  <button onClick={()=>onEdit(e)} style={{ ...styles.smBtn, color:"#4F46E5", marginRight:4 }}>Edit</button>
                  <button onClick={()=>onDelete(e.id)} style={{ ...styles.smBtn, color:"#EF4444", background:"#FEF2F2" }}>Del</button>
                </td>
              </tr>
            ))}
            {rows.length===0 && <tr><td colSpan={8} style={{ ...styles.td, textAlign:"center", padding:48, color:"#6B7280" }}>No entries yet. Import a bank statement or add manually.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CHANNELS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function ChannelsTab({ entries, channels, fxRate, onEditCh, onDelCh, onAddCh }) {
  const fe = useCallback(e=>fxAmt(e,fxRate),[fxRate]);
  const opRev = useMemo(()=>entries.filter(e=>e.type==="Income"&&OP_CATS.includes(e.category)).reduce((s,e)=>s+fe(e),0),[entries,fe]);
  const chData = useMemo(()=>channels.map(ch=>({
    ...ch, total:entries.filter(e=>e.type==="Income"&&ch.cats.includes(e.category)).reduce((s,e)=>s+fe(e),0),
    count:entries.filter(e=>e.type==="Income"&&ch.cats.includes(e.category)).length,
  })),[channels,entries,fe]);
  const incCats = useMemo(()=>{
    const m={};
    entries.filter(e=>e.type==="Income").forEach(e=>{m[e.category]=(m[e.category]||0)+fe(e);});
    return Object.entries(m).map(([n,v])=>({name:n,value:v})).sort((a,b)=>b.value-a.value);
  },[entries,fe]);
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div>
          <p style={{ fontWeight:700, fontSize:16, margin:"0 0 2px", color:"#111827" }}>Income Channels</p>
          <p style={{ fontSize:13, color:"#4B5563", margin:0 }}>Revenue by source · auto-totals from entry categories</p>
        </div>
        <button onClick={onAddCh} style={styles.btnPrimary}>+ Add Channel</button>
      </div>
      <div className="ffd-grid-4" style={{ marginBottom:24 }}>
        {chData.map(ch=>(
          <div key={ch.id} style={{ ...styles.card, borderTop:`3px solid ${ch.clr}`, background:ch.bg }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div>
                <p style={{ fontWeight:700, fontSize:15, color:ch.clr, margin:"0 0 2px" }}>{ch.name}</p>
                <span style={{ ...styles.badge, fontSize:11 }}>{ch.biz}</span>
              </div>
              <div style={{ display:"flex", gap:4 }}>
                <button onClick={()=>onEditCh(ch)} style={{ ...styles.smBtn, color:"#4F46E5" }}>Edit</button>
                <button onClick={()=>onDelCh(ch.id)} style={{ ...styles.smBtn, color:"#EF4444", background:"#FEF2F2" }}>Del</button>
              </div>
            </div>
            <p style={{ fontSize:26, fontWeight:800, color:ch.clr, margin:"0 0 4px" }}>{fmt(ch.total)}</p>
            <p style={{ fontSize:12, color:"#6B7280", margin:"0 0 8px" }}>{ch.count} transactions · {pct(ch.total,opRev)} of op. revenue</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
              {(ch.cats||[]).map(c=><span key={c} style={{ fontSize:11, background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"2px 8px", color:"#4B5563" }}>{c}</span>)}
            </div>
          </div>
        ))}
      </div>
      <div style={styles.card}>
        <p style={styles.sectionTitle}>Income by Category</p>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr><th style={styles.th}>Category</th><th style={{ ...styles.th, textAlign:"right" }}>Total</th><th style={{ ...styles.th, textAlign:"center" }}>Type</th></tr></thead>
          <tbody>
            {incCats.map((c,i)=>{
              const isOp=OP_CATS.includes(c.name), isCap=["Capital Injection","Business Loan Received","Investment / Loan Received"].includes(c.name);
              return (
                <tr key={c.name} style={{ background:i%2===0?"#fff":"#FAFAFA" }}>
                  <td style={{ ...styles.td, display:"flex", alignItems:"center", gap:8 }}><span style={{ width:8,height:8,borderRadius:2,background:COLORS[i%COLORS.length],flexShrink:0 }} />{c.name}</td>
                  <td style={{ ...styles.td, textAlign:"right", color:"#059669", fontWeight:700 }}>{fmt(c.value)}</td>
                  <td style={{ ...styles.td, textAlign:"center" }}><span style={{ ...styles.badge, background:isOp?"#DCFCE7":isCap?"#DBEAFE":"#F3F4F6", color:isOp?"#166534":isCap?"#1e3a8a":"#374151" }}>{isOp?"Operating":isCap?"Capital/Loan":"Transfer"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ENTRIES TAB
// ═══════════════════════════════════════════════════════════════════════════════
function EntriesTab({ entries, fxRate, onEdit, onDelete }) {
  const masked = useMask();
  const [bizF,  setBizF]  = useState("All");
  const [typF,  setTypF]  = useState("All");
  const [accF,  setAccF]  = useState("All");
  const [yearF, setYearF] = useState("All");
  const [monF,  setMonF]  = useState("All");
  const [search,setSearch]= useState("");
  const [dateFrom,setDateFrom]=useState("");
  const [dateTo,  setDateTo  ]=useState("");

  const fe = useCallback(e=>fxAmt(e,fxRate),[fxRate]);
  const years = useMemo(()=>[...new Set(entries.map(e=>getYear(e.date)))].sort().reverse(),[entries]);
  const rows  = useMemo(()=>entries.filter(e=>
    (bizF==="All"||e.business===bizF)&&
    (typF==="All"||e.type===typF)&&
    (accF==="All"||e.account===accF)&&
    (yearF==="All"||getYear(e.date)===yearF)&&
    (monF==="All"||MONTHS[getMonth(e.date)]===monF)&&
    (!search||e.description?.toLowerCase().includes(search.toLowerCase())||e.category?.toLowerCase().includes(search.toLowerCase()))&&
    (!dateFrom||e.date>=dateFrom)&&
    (!dateTo||e.date<=dateTo)
  ).sort((a,b)=>b.date.localeCompare(a.date)),[entries,bizF,typF,accF,yearF,monF,search,dateFrom,dateTo]);
  const totIn  = rows.filter(r=>r.type==="Income").reduce((s,e)=>s+fe(e),0);
  const totOut = rows.filter(r=>r.type==="Expense").reduce((s,e)=>s+fe(e),0);
  const pageCount = Math.ceil(rows.length / PER_PAGE);
  const pageRows  = rows.slice((page-1)*PER_PAGE, page*PER_PAGE);
  return (
    <div>
      {/* Search + Date Range */}
      <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search description or category…" style={{flex:1,minWidth:180,padding:"8px 12px",border:"1px solid #CBD5E1",borderRadius:8,fontSize:13,outline:"none",background:"#F8FAFC"}}/>
        <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1);}} style={{padding:"8px 10px",border:"1px solid #CBD5E1",borderRadius:8,fontSize:13,outline:"none",background:"#F8FAFC"}} title="From"/>
        <input type="date" value={dateTo}   onChange={e=>{setDateTo(e.target.value);setPage(1);}}   style={{padding:"8px 10px",border:"1px solid #CBD5E1",borderRadius:8,fontSize:13,outline:"none",background:"#F8FAFC"}} title="To"/>
        {(search||dateFrom||dateTo)&&<button onClick={()=>{setSearch("");setDateFrom("");setDateTo("");}} style={{padding:"8px 12px",background:"#FEE2E2",border:"none",borderRadius:8,fontSize:12,color:"#DC2626",cursor:"pointer",fontWeight:600}}>✕ Clear</button>}
      </div>
      {/* Filters */}
      <div style={{ display:"flex", gap:7, marginBottom:10, alignItems:"center", flexWrap:"wrap" }}>
        <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>Business:</span>
        {["All",...BUSINESSES].map(b=><Pill key={b} label={b} active={bizF===b} color={BIZ_CLR[b]||"#4F46E5"} bg={(BIZ_CLR[b]||"#4F46E5")+"18"} onClick={()=>setBizF(b)} />)}
        <div style={{ width:1, height:20, background:"#E5E7EB", margin:"0 4px" }} />
        <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>Type:</span>
        {["All","Income","Expense"].map(t=><Pill key={t} label={t} active={typF===t} color={t==="Income"?"#059669":t==="Expense"?"#DC2626":"#4F46E5"} onClick={()=>setTypF(t)} />)}
      </div>
      <div style={{ display:"flex", gap:7, marginBottom:14, alignItems:"center", flexWrap:"wrap" }}>
        <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>Account:</span>
        <Pill label="All" active={accF==="All"} onClick={()=>setAccF("All")} />
        {ACCOUNTS.map(a=><Pill key={a.id} label={a.label} active={accF===a.id} color={a.clr} bg={a.clr+"18"} onClick={()=>setAccF(accF===a.id?"All":a.id)} />)}
        <div style={{ width:1, height:20, background:"#E5E7EB", margin:"0 4px" }} />
        <select value={yearF} onChange={e=>setYearF(e.target.value)} style={{ ...styles.select, width:"auto", padding:"6px 11px" }}>
          <option value="All">All Years</option>
          {years.map(y=><option key={y}>{y}</option>)}
        </select>
        <select value={monF} onChange={e=>setMonF(e.target.value)} style={{ ...styles.select, width:"auto", padding:"6px 11px" }}>
          <option value="All">All Months</option>
          {MONTHS.map(m=><option key={m}>{m}</option>)}
        </select>
        <span style={{ marginLeft:"auto", fontSize:13, color:"#4B5563", fontWeight:600, whiteSpace:"nowrap" }}>
          {rows.length} entries · In: {masked?"••••":fmt(totIn)} · Out: {masked?"••••":fmt(totOut)}
        </span>
        <button onClick={()=>exportCSV(rows,"entries.csv")} style={{padding:"6px 12px",background:"#F1F5F9",border:"none",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:500,marginLeft:8}}>↓ CSV</button>
        <button onClick={()=>exportXLSX(rows,"entries.xlsx")} style={{padding:"6px 12px",background:"#4F46E5",color:"#fff",border:"none",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:600}}>↓ Excel</button>
      </div>
      <div style={{ ...styles.card, overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
          <thead>
            <tr><th style={styles.th}>#</th><th style={styles.th}>Date</th><th style={styles.th}>Business</th><th style={styles.th}>Account</th><th style={styles.th}>Type</th><th style={styles.th}>Category</th><th style={styles.th}>Description</th><th style={{ ...styles.th, textAlign:"right" }}>Amount</th><th style={styles.th}/></tr>
          </thead>
          <tbody>
            {pageRows.map((e,i)=>{
              const a = acct(e.account);
              return (
                <tr key={e.id} style={{ background:i%2===0?"#fff":"#FAFAFA" }}>
                  <td style={{ ...styles.td, color:"#9CA3AF", fontSize:12 }}>—</td>
                  <td style={{ ...styles.td, whiteSpace:"nowrap", color:"#4B5563" }}>{new Date(e.date+"T12:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"2-digit"})}</td>
                  <td style={styles.td}><span style={{ ...styles.badge, background:(BIZ_CLR[e.business]||"#64748B")+"22", color:BIZ_CLR[e.business]||"#64748B" }}>{e.business}</span></td>
                  <td style={styles.td}><span style={{ ...styles.badge, background:a.clr+"22", color:a.clr }}>{a.label}</span></td>
                  <td style={styles.td}><span style={{ ...styles.badge, background:e.type==="Income"?"#DCFCE7":"#FEE2E2", color:e.type==="Income"?"#166534":"#7F1D1D" }}>{e.type}</span></td>
                  <td style={{ ...styles.td, fontSize:12, maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.category}</td>
                  <td style={{ ...styles.td, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.description}</td>
                  <td style={{ ...styles.td, fontWeight:700, color:e.type==="Income"?"#059669":"#DC2626", textAlign:"right", whiteSpace:"nowrap" }}>
                    {e.type==="Income"?"+":"-"}{a.cur==="GBP"?`£${e.amount.toLocaleString()}`:`₹${e.amount.toLocaleString("en-IN")}`}
                  </td>
                  <td style={{ ...styles.td, whiteSpace:"nowrap" }}>
                    <button onClick={()=>onEdit(e)} style={{ ...styles.smBtn, color:"#4F46E5", marginRight:4 }}>Edit</button>
                    <button onClick={()=>onDelete(e.id)} style={{ ...styles.smBtn, color:"#EF4444", background:"#FEF2F2" }}>Del</button>
                  </td>
                </tr>
              );
            })}
            {pageRows.length===0 && <tr><td colSpan={9} style={{ ...styles.td, textAlign:"center", padding:48, color:"#6B7280", fontSize:14 }}>No entries match the filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const styles = {
  overlay:    { position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16, overflowY:"auto" },
  card:       { background:"#fff", borderRadius:14, border:"1px solid #E5E7EB", padding:"16px 18px", marginBottom:0 },
  sectionTitle:{ fontSize:15, fontWeight:700, color:"#111827", margin:"0 0 4px" },
  th:         { padding:"10px 12px", textAlign:"left", fontSize:12, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.4px", background:"#F9FAFB", borderBottom:"1px solid #E5E7EB", whiteSpace:"nowrap" },
  td:         { padding:"10px 12px", fontSize:13, color:"#374151", borderBottom:"1px solid #F3F4F6" },
  badge:      { display:"inline-block", padding:"3px 8px", borderRadius:20, fontSize:12, fontWeight:600, background:"#F3F4F6", color:"#374151" },
  btnPrimary: { background:"#4F46E5", color:"#fff", border:"none", borderRadius:9, padding:"10px 18px", fontSize:14, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" },
  btnGhost:   { background:"#F3F4F6", color:"#374151", border:"none", borderRadius:9, padding:"10px 18px", fontSize:14, fontWeight:500, cursor:"pointer", whiteSpace:"nowrap" },
  smBtn:      { padding:"4px 10px", fontSize:12, fontWeight:600, background:"#EEF2FF", border:"none", borderRadius:6, cursor:"pointer" },
  closeBtn:   { background:"#F3F4F6", border:"none", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:14, color:"#374151" },
  input:      { width:"100%", padding:"9px 11px", border:"1px solid #D1D5DB", borderRadius:8, fontSize:14, outline:"none", background:"#F9FAFB", color:"#111827", boxSizing:"border-box" },
  select:     { width:"100%", padding:"9px 11px", border:"1px solid #D1D5DB", borderRadius:8, fontSize:14, outline:"none", background:"#F9FAFB", color:"#111827", boxSizing:"border-box", appearance:"auto" },
  formLabel:  { fontSize:11, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.5px", display:"block", marginBottom:4 },
  importModal:{ background:"#fff", borderRadius:16, width:"calc(100% - 32px)", maxWidth:860, maxHeight:"92vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 25px 60px rgba(0,0,0,0.25)" },
  importHeader:{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", borderBottom:"1px solid #E5E7EB" },
  dropZone:   { border:"2px dashed #C7D2FE", borderRadius:16, padding:"40px 24px", textAlign:"center", cursor:"pointer", transition:"all 0.2s", background:"#F8F9FF" },
  dropZoneActive:{ border:"2px dashed #4F46E5", background:"#EEF2FF", transform:"scale(1.01)" },
};

// ═══════════════════════════════════════════════════════════════════════════════
//  SEED DATA (original 205 transactions)
// ═══════════════════════════════════════════════════════════════════════════════
const SEED = [{id:1,date:"2026-01-01",business:"Nutrolis",type:"Income",category:"Internal Transfer",description:"IMPS - LiveRightFit LLP (Self)",amount:7000,account:"lrf"},{id:2,date:"2026-01-01",business:"Nutrolis",type:"Income",category:"Capital Injection",description:"IFT - Shailendra Kumar (Fund to Nutrolis)",amount:50000,account:"lrf"},{id:3,date:"2026-01-01",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - Facebook Ads",amount:10000,account:"lrf"},{id:4,date:"2026-01-01",business:"Nutrolis",type:"Income",category:"Direct Sales",description:"UPI - Kailash (Customer Payment)",amount:1400,account:"lrf"},{id:5,date:"2026-01-02",business:"Nutrolis",type:"Expense",category:"Credit Card Payment",description:"UPI - ICICI Credit Card Payment",amount:10000,account:"lrf"},{id:6,date:"2026-01-02",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:312.27,account:"lrf"},{id:7,date:"2026-01-02",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:1753.76,account:"lrf"},{id:8,date:"2026-01-02",business:"Nutrolis",type:"Expense",category:"Shipping",description:"UPI - Bigfoot Shiprocket",amount:2000,account:"lrf"},{id:10,date:"2026-01-03",business:"Nutrolis",type:"Income",category:"Amazon Revenue",description:"IMPS - Amazon Seller",amount:2138.76,account:"lrf"},{id:11,date:"2026-01-03",business:"Nutrolis",type:"Income",category:"Amazon Revenue",description:"NEFT - Amazon Seller",amount:2261.12,account:"lrf"},{id:12,date:"2026-01-03",business:"Nutrolis",type:"Income",category:"Direct Sales",description:"UPI - Sumit (Payment)",amount:1900,account:"lrf"},{id:13,date:"2026-01-04",business:"Nutrolis",type:"Expense",category:"Freelancer",description:"UPI - Akash Verma (Freelancer)",amount:2520,account:"lrf"},{id:14,date:"2026-01-04",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - Facebook Ads",amount:5000,account:"lrf"},{id:15,date:"2026-01-05",business:"Nutrolis",type:"Expense",category:"Shipping",description:"UPI - Rising Star (Courier)",amount:707,account:"lrf"},{id:16,date:"2026-01-05",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart Nodal",amount:710.55,account:"lrf"},{id:17,date:"2026-01-05",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:287.55,account:"lrf"},{id:18,date:"2026-01-05",business:"Nutrolis",type:"Expense",category:"Shipping",description:"UPI - Bigfoot Shiprocket",amount:2000,account:"lrf"},{id:19,date:"2026-01-05",business:"Nutrolis",type:"Income",category:"Capital Injection",description:"IFT - Shailendra Kumar (Business Funding)",amount:150000,account:"lrf"},{id:20,date:"2026-01-05",business:"Nutrolis",type:"Expense",category:"Procurement",description:"IMPS - Oribite Nutra Science (Omega Restock)",amount:75000,account:"lrf"},{id:22,date:"2026-01-06",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - Facebook Ads",amount:5000,account:"lrf"},{id:23,date:"2026-01-06",business:"Nutrolis",type:"Expense",category:"Professional Services",description:"UPI - Shashank (CA Fee)",amount:20000,account:"lrf"},{id:25,date:"2026-01-07",business:"Nutrolis",type:"Expense",category:"Credit Card Payment",description:"UPI - ICICI Credit Card Payment",amount:7000,account:"lrf"},{id:26,date:"2026-01-07",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:2281.35,account:"lrf"},{id:27,date:"2026-01-07",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:688.68,account:"lrf"},{id:28,date:"2026-01-07",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - Facebook Ads",amount:5000,account:"lrf"},{id:31,date:"2026-01-07",business:"Nutrolis",type:"Expense",category:"Salaries",description:"UPI - Mansi Behal (Salary)",amount:9667,account:"lrf"},{id:32,date:"2026-01-07",business:"Nutrolis",type:"Expense",category:"Loan / EMI",description:"UPI - Neelam B (Loan EMI)",amount:3750,account:"lrf"},{id:33,date:"2026-01-08",business:"Nutrolis",type:"Expense",category:"Freelancer",description:"UPI - Solanki (Marketing)",amount:5000,account:"lrf"},{id:36,date:"2026-01-08",business:"Nutrolis",type:"Expense",category:"Software",description:"UPI - Notion (Annual Plan)",amount:10416,account:"lrf"},{id:37,date:"2026-01-09",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:793.57,account:"lrf"},{id:38,date:"2026-01-09",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:1491.69,account:"lrf"},{id:39,date:"2026-01-10",business:"Nutrolis",type:"Income",category:"Amazon Revenue",description:"IMPS - Amazon Seller",amount:1485.7,account:"lrf"},{id:40,date:"2026-01-10",business:"Nutrolis",type:"Income",category:"Amazon Revenue",description:"NEFT - Amazon Seller",amount:1631.17,account:"lrf"},{id:41,date:"2026-01-12",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:928.79,account:"lrf"},{id:44,date:"2026-01-12",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - Meta Ads",amount:3000,account:"lrf"},{id:46,date:"2026-01-12",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - Facebook Ads",amount:5000,account:"lrf"},{id:48,date:"2026-01-13",business:"Nutrolis",type:"Expense",category:"Freelancer",description:"UPI - Ayushi J (Freelancer)",amount:12000,account:"lrf"},{id:50,date:"2026-01-14",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:1363.5,account:"lrf"},{id:51,date:"2026-01-14",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:919.42,account:"lrf"},{id:53,date:"2026-01-14",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - Facebook Ads",amount:5000,account:"lrf"},{id:54,date:"2026-01-14",business:"Nutrolis",type:"Expense",category:"Shipping",description:"UPI - XpressBees (Courier)",amount:2199,account:"lrf"},{id:55,date:"2026-01-14",business:"Nutrolis",type:"Expense",category:"Credit Card Payment",description:"UPI - ICICI Credit Card Payment",amount:10000,account:"lrf"},{id:57,date:"2026-01-15",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - Facebook Ads",amount:3000,account:"lrf"},{id:59,date:"2026-01-16",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:1735.36,account:"lrf"},{id:60,date:"2026-01-16",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:1382.25,account:"lrf"},{id:62,date:"2026-01-17",business:"Nutrolis",type:"Income",category:"Amazon Revenue",description:"IMPS - Amazon Seller",amount:5045.83,account:"lrf"},{id:63,date:"2026-01-19",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:1730.32,account:"lrf"},{id:64,date:"2026-01-19",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:1213.23,account:"lrf"},{id:66,date:"2026-01-20",business:"Nutrolis",type:"Expense",category:"Credit Card Payment",description:"UPI - ICICI Credit Card Payment",amount:10000,account:"lrf"},{id:70,date:"2026-01-21",business:"Nutrolis",type:"Income",category:"Capital Injection",description:"IFT - Shailendra Kumar (Funding)",amount:20000,account:"lrf"},{id:72,date:"2026-01-23",business:"Nutrolis",type:"Income",category:"Capital Injection",description:"CASH DEPOSIT BY SELF",amount:400000,account:"lrf"},{id:75,date:"2026-01-24",business:"Nutrolis",type:"Income",category:"Amazon Revenue",description:"IMPS - Amazon Seller",amount:2947.83,account:"lrf"},{id:76,date:"2026-01-24",business:"Nutrolis",type:"Income",category:"Amazon Revenue",description:"NEFT - Amazon Seller",amount:3571.94,account:"lrf"},{id:77,date:"2026-01-24",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - Facebook Ads",amount:3000,account:"lrf"},{id:80,date:"2026-01-27",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - Facebook Ads",amount:3000,account:"lrf"},{id:81,date:"2026-01-27",business:"Nutrolis",type:"Expense",category:"Salaries",description:"IMPS - Bhaskar Manish Jani (Salary)",amount:35000,account:"lrf"},{id:82,date:"2026-01-27",business:"Nutrolis",type:"Expense",category:"Owner Drawings",description:"IFT - Shailendra Kumar (Advance Salary)",amount:200000,account:"lrf"},{id:86,date:"2026-01-30",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - Meta Ads",amount:3000,account:"lrf"},{id:87,date:"2026-01-30",business:"Nutrolis",type:"Expense",category:"Software",description:"IFT - Business Card Yearly Cost",amount:4000,account:"lrf"},{id:88,date:"2026-01-31",business:"Nutrolis",type:"Income",category:"Amazon Revenue",description:"IMPS - Amazon Seller",amount:2911.36,account:"lrf"},{id:89,date:"2026-01-31",business:"Nutrolis",type:"Income",category:"Amazon Revenue",description:"NEFT - Amazon Seller",amount:8373.76,account:"lrf"},{id:90,date:"2026-01-31",business:"Nutrolis",type:"Expense",category:"Software",description:"UPI - Zoho (Subscription)",amount:685.04,account:"lrf"},{id:91,date:"2026-02-01",business:"Nutrolis",type:"Expense",category:"Shipping",description:"UPI - Bigfoot Shiprocket",amount:1500,account:"lrf"},{id:92,date:"2026-02-02",business:"Nutrolis",type:"Expense",category:"Salaries",description:"UPI - Mansi Behal (Salary)",amount:24000,account:"lrf"},{id:94,date:"2026-02-02",business:"Nutrolis",type:"Expense",category:"Procurement",description:"IMPS - Oribite Nutra Science (Omega Payment)",amount:40000,account:"lrf"},{id:96,date:"2026-02-02",business:"Nutrolis",type:"Expense",category:"Credit Card Payment",description:"UPI - ICICI Credit Card Payment",amount:10000,account:"lrf"},{id:97,date:"2026-02-03",business:"Nutrolis",type:"Expense",category:"Freelancer",description:"UPI - Solanki (Marketing)",amount:5000,account:"lrf"},{id:99,date:"2026-02-04",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - Meta Ads",amount:2000,account:"lrf"},{id:102,date:"2026-02-07",business:"Nutrolis",type:"Income",category:"Amazon Revenue",description:"IMPS - Amazon Seller",amount:1884.84,account:"lrf"},{id:103,date:"2026-02-07",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - Facebook Ads",amount:3000,account:"lrf"},{id:104,date:"2026-02-08",business:"Nutrolis",type:"Income",category:"Amazon Revenue",description:"NEFT - Amazon Seller",amount:886.73,account:"lrf"},{id:105,date:"2026-02-09",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:9044.93,account:"lrf"},{id:107,date:"2026-02-11",business:"Nutrolis",type:"Expense",category:"Inter-company Transfer",description:"IMPS - Grownmind (ShopEMI)",amount:23000,account:"lrf"},{id:109,date:"2026-02-13",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:2544.99,account:"lrf"},{id:111,date:"2026-02-14",business:"Nutrolis",type:"Income",category:"Amazon Revenue",description:"NEFT - Amazon Seller",amount:5104.35,account:"lrf"},{id:112,date:"2026-02-14",business:"Nutrolis",type:"Expense",category:"Salaries",description:"UPI - Mansi Behal (Salary)",amount:9667,account:"lrf"},{id:113,date:"2026-02-15",business:"Nutrolis",type:"Expense",category:"Software",description:"UPI - Zoho (Subscription)",amount:2124,account:"lrf"},{id:115,date:"2026-02-16",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:1753.02,account:"lrf"},{id:117,date:"2026-02-18",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:1228.4,account:"lrf"},{id:118,date:"2026-02-18",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:1881.61,account:"lrf"},{id:119,date:"2026-02-18",business:"Nutrolis",type:"Expense",category:"Credit Card Payment",description:"UPI - ICICI Credit Card Payment",amount:11360,account:"lrf"},{id:121,date:"2026-02-20",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:399.77,account:"lrf"},{id:123,date:"2026-02-21",business:"Nutrolis",type:"Income",category:"Amazon Revenue",description:"IMPS - Amazon Seller",amount:3790.21,account:"lrf"},{id:125,date:"2026-02-23",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:684.1,account:"lrf"},{id:126,date:"2026-02-23",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:2103,account:"lrf"},{id:127,date:"2026-02-24",business:"Nutrolis",type:"Income",category:"Internal Transfer",description:"IMPS - Grownmind (Own Account)",amount:35000,account:"lrf"},{id:129,date:"2026-02-26",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - Facebook Ads",amount:2500,account:"lrf"},{id:130,date:"2026-02-27",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:4259.43,account:"lrf"},{id:131,date:"2026-02-27",business:"Nutrolis",type:"Expense",category:"Salaries",description:"IMPS - Bhaskar Manish Jani (Salary)",amount:35000,account:"lrf"},{id:132,date:"2026-02-28",business:"Nutrolis",type:"Expense",category:"Credit Card Payment",description:"UPI - ICICI Credit Card Payment",amount:5000,account:"lrf"},{id:133,date:"2026-02-28",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - META Ads",amount:2500,account:"lrf"},{id:135,date:"2026-03-01",business:"Nutrolis",type:"Expense",category:"Shipping",description:"UPI - Bigfoot Shiprocket",amount:1000,account:"lrf"},{id:136,date:"2026-03-03",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - Facebook Ads",amount:2000,account:"lrf"},{id:137,date:"2026-03-03",business:"Nutrolis",type:"Income",category:"Internal Transfer",description:"IMPS - Grownmind (Own)",amount:15000,account:"lrf"},{id:138,date:"2026-03-04",business:"Nutrolis",type:"Expense",category:"Freelancer",description:"UPI - Sapna (Prateek - Staff)",amount:15000,account:"lrf"},{id:139,date:"2026-03-06",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - META Ads",amount:2500,account:"lrf"},{id:140,date:"2026-03-06",business:"Nutrolis",type:"Expense",category:"Credit Card Payment",description:"UPI - ICICI Credit Card Payment",amount:7000,account:"lrf"},{id:143,date:"2026-03-08",business:"Nutrolis",type:"Income",category:"Investment / Loan Received",description:"RTGS - Anurag Mankhand & Mansi Behal",amount:500000,account:"lrf"},{id:144,date:"2026-03-08",business:"Nutrolis",type:"Expense",category:"Freelancer",description:"UPI - Akash Verma (Freelancer)",amount:5580,account:"lrf"},{id:145,date:"2026-03-08",business:"Nutrolis",type:"Expense",category:"Freelancer",description:"UPI - Pinky (Nutrolis Payment)",amount:20000,account:"lrf"},{id:146,date:"2026-03-08",business:"Nutrolis",type:"Expense",category:"Equipment & Office",description:"UPI - Blue Star (Equipment/AC)",amount:43468,account:"lrf"},{id:147,date:"2026-03-08",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - META Ads",amount:2000,account:"lrf"},{id:148,date:"2026-03-09",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:3103.54,account:"lrf"},{id:149,date:"2026-03-09",business:"Nutrolis",type:"Expense",category:"Professional Services",description:"UPI - Shashank (CA Fee)",amount:16000,account:"lrf"},{id:151,date:"2026-03-09",business:"Nutrolis",type:"Expense",category:"Misc Expense",description:"UPI - Amjad A",amount:1788,account:"lrf"},{id:152,date:"2026-03-09",business:"Nutrolis",type:"Expense",category:"Inter-company Transfer",description:"IMPS - Grownmind (Return of Loan)",amount:200000,account:"lrf"},{id:153,date:"2026-03-11",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:336.33,account:"lrf"},{id:154,date:"2026-03-11",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:1470.62,account:"lrf"},{id:155,date:"2026-03-12",business:"Nutrolis",type:"Expense",category:"Credit Card Payment",description:"UPI - ICICI Credit Card Payment",amount:12000,account:"lrf"},{id:156,date:"2026-03-12",business:"Nutrolis",type:"Expense",category:"Credit Card Payment",description:"UPI - ICICI Credit Card Payment",amount:10000,account:"lrf"},{id:157,date:"2026-03-12",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - META Ads",amount:2000,account:"lrf"},{id:160,date:"2026-03-13",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:601.07,account:"lrf"},{id:161,date:"2026-03-13",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:431.78,account:"lrf"},{id:163,date:"2026-03-16",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:704.86,account:"lrf"},{id:164,date:"2026-03-16",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:642.83,account:"lrf"},{id:166,date:"2026-03-16",business:"Nutrolis",type:"Income",category:"Business Loan Received",description:"NEFT - Hemlata (GAUR CITY - Real Estate)",amount:1160000,account:"lrf"},{id:167,date:"2026-03-16",business:"Nutrolis",type:"Expense",category:"Software",description:"UPI - Zoho (Subscription)",amount:1145.2,account:"lrf"},{id:168,date:"2026-03-16",business:"Nutrolis",type:"Expense",category:"Credit Card Payment",description:"UPI - ICICI Credit Card Payment",amount:95403.64,account:"lrf"},{id:169,date:"2026-03-16",business:"Nutrolis",type:"Expense",category:"Credit Card Payment",description:"UPI - IDFC Credit Card Payment",amount:42693.89,account:"lrf"},{id:170,date:"2026-03-18",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:1704.56,account:"lrf"},{id:171,date:"2026-03-18",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:2175.19,account:"lrf"},{id:172,date:"2026-03-18",business:"Nutrolis",type:"Expense",category:"Credit Card Payment",description:"UPI - ICICI Credit Card Payment",amount:5000,account:"lrf"},{id:173,date:"2026-03-18",business:"Nutrolis",type:"Expense",category:"Shipping",description:"UPI - Bigfoot Shiprocket",amount:400,account:"lrf"},{id:174,date:"2026-03-18",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - Facebook Ads",amount:2000,account:"lrf"},{id:175,date:"2026-03-20",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:600.84,account:"lrf"},{id:177,date:"2026-03-20",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart Nodal",amount:651.17,account:"lrf"},{id:178,date:"2026-03-21",business:"Nutrolis",type:"Income",category:"Amazon Revenue",description:"NEFT - Amazon Seller",amount:3122.85,account:"lrf"},{id:179,date:"2026-03-22",business:"Nutrolis",type:"Expense",category:"Freelancer",description:"UPI - Sapna (Staff)",amount:15000,account:"lrf"},{id:180,date:"2026-03-23",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:937.79,account:"lrf"},{id:181,date:"2026-03-23",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:1470,account:"lrf"},{id:182,date:"2026-03-23",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - Facebook Ads",amount:2000,account:"lrf"},{id:184,date:"2026-03-23",business:"Nutrolis",type:"Expense",category:"Telecom & Internet",description:"UPI - Airtel (Mobile Bill)",amount:200.8,account:"lrf"},{id:185,date:"2026-03-24",business:"Nutrolis",type:"Expense",category:"Software",description:"UPI - GoDaddy (Domain)",amount:1617.4,account:"lrf"},{id:186,date:"2026-03-25",business:"Nutrolis",type:"Expense",category:"Software",description:"UPI - Tata Stars (Subscription)",amount:483,account:"lrf"},{id:188,date:"2026-03-25",business:"Nutrolis",type:"Expense",category:"Credit Card Payment",description:"UPI - ICICI Credit Card Payment",amount:20560.89,account:"lrf"},{id:189,date:"2026-03-26",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - Facebook Ads",amount:2000,account:"lrf"},{id:190,date:"2026-03-26",business:"Nutrolis",type:"Expense",category:"Equipment & Office",description:"UPI - Croma (Electronics Purchase)",amount:58110,account:"lrf"},{id:192,date:"2026-03-28",business:"Nutrolis",type:"Income",category:"Amazon Revenue",description:"IMPS - Amazon Seller",amount:312.44,account:"lrf"},{id:193,date:"2026-03-28",business:"Nutrolis",type:"Expense",category:"Salaries",description:"UPI - Bhaskar Manish Jani (Salary)",amount:35000,account:"lrf"},{id:194,date:"2026-03-29",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - Facebook Ads",amount:2000,account:"lrf"},{id:196,date:"2026-03-29",business:"Nutrolis",type:"Expense",category:"Food & Entertainment",description:"UPI - Chaayos (Food)",amount:481,account:"lrf"},{id:198,date:"2026-03-29",business:"Nutrolis",type:"Expense",category:"Misc Expense",description:"UPI - Jitendra (Payment)",amount:25000,account:"lrf"},{id:200,date:"2026-03-30",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart Nodal",amount:3490.96,account:"lrf"},{id:201,date:"2026-03-30",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:8531.64,account:"lrf"},{id:202,date:"2026-03-31",business:"Nutrolis",type:"Expense",category:"Freelancer",description:"UPI - Akash Verma (Freelancer)",amount:550,account:"lrf"},{id:203,date:"2026-03-31",business:"Nutrolis",type:"Expense",category:"Freelancer",description:"UPI - Vishakha (Staff Payment)",amount:14980,account:"lrf"},{id:205,date:"2026-03-31",business:"Nutrolis",type:"Expense",category:"Inter-company Transfer",description:"UPI - Grownmind (Transfer)",amount:20000,account:"lrf"}];

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [authed,   setAuthed]   = useState(false);
  const [pwd,      setPwd]      = useState("");
  const [pwdErr,   setPwdErr]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [dbReady,  setDbReady]  = useState(false);
  const [masked,   setMasked]   = useState(false);
  const [entries,  setEntries]  = useState([]);
  const [channels, setChannels] = useState([]);
  const [fxRate,   setFxRate]   = useState(107);
  const [fxInput,  setFxInput]  = useState("107");
  const [apiKey,   setApiKey]   = useState("");
  const [tab,      setTab]      = useState("dashboard");
  const [showAdd,  setShowAdd]  = useState(false);
  const [editE,    setEditE]    = useState(null);
  const [editCh,   setEditCh]   = useState(null);
  const [showChModal,setShowChModal]= useState(false);
  const [importAcct,setImportAcct]  = useState(null);
  const [mobileMenuOpen,setMobileMenuOpen] = useState(false);

  // ── Load data ──
  useEffect(()=>{
    if (!authed) return;
    (async()=>{
      setLoading(true);
      try {
        // Check if tables exist
        const { error:chk } = await sb.from("ffd_entries").select("id").limit(1);
        if (chk?.code==="42P01") { setDbReady(false); setLoading(false); return; }
        setDbReady(true);
        // Load entries
        const { data:ents } = await sb.from("ffd_entries").select("*").order("date",{ascending:false});
        if (ents?.length) setEntries(ents);
        else {
          const chunks=[];
          for(let i=0;i<SEED.length;i+=50) chunks.push(SEED.slice(i,i+50));
          for(const c of chunks) await sb.from("ffd_entries").insert(c);
          setEntries(SEED);
        }
        // Load channels
        const { data:chs } = await sb.from("ffd_channels").select("*").order("id");
        if (chs?.length) setChannels(chs);
        else {
          await sb.from("ffd_channels").insert(DEFAULT_CHANNELS);
          setChannels(DEFAULT_CHANNELS);
        }
        // Load settings
        const { data:settings } = await sb.from("ffd_settings").select("key,value");
        if (settings) {
          const fx  = settings.find(s=>s.key==="fx");
          const ck  = settings.find(s=>s.key==="claude_key");
          const tr  = settings.find(s=>s.key==="tag_rules");
          const mk  = settings.find(s=>s.key==="masked");
          if (fx?.value)  { setFxRate(parseFloat(fx.value)); setFxInput(String(parseFloat(fx.value))); }
          if (ck?.value)  setApiKey(ck.value);
          if (tr?.value)  try{LEARNED_RULES=JSON.parse(JSON.stringify(tr.value));}catch(e){}
          if (mk?.value)  setMasked(!!mk.value);
        }
      } catch(e) { console.error(e); }
      setLoading(false);
    })();
  },[authed]);

  const netFlow = useMemo(()=>entries.reduce((s,e)=>s+(e.type==="Income"?1:-1)*fxAmt(e,fxRate),0),[entries,fxRate]);

  // ── CRUD ──
  const onAdd    = (e)  => setEntries(p=>[e,...p]);
  const onEdit   = async(e)  => { await dbUpdate(e); setEntries(p=>p.map(r=>r.id===e.id?e:r)); setEditE(null); };
  const onDelete = async(id) => { if(!confirm("Delete this entry?")) return; await dbDelete(id); setEntries(p=>p.filter(r=>r.id!==id)); };
  const onSaveCh = async(ch) => { await dbAddChannel(ch); ch.id&&channels.find(c=>c.id===ch.id)?setChannels(p=>p.map(c=>c.id===ch.id?ch:c)):setChannels(p=>[...p,ch]); setEditCh(null); setShowChModal(false); };
  const onDelCh  = async(id) => { if(!confirm("Delete channel?")) return; await dbDelChannel(id); setChannels(p=>p.filter(c=>c.id!==id)); };
  const onImported = (rows) => { setEntries(p=>[...rows.map(r=>({id:r.id||Date.now(),date:r.date,business:r.business,account:r.account,type:r.type,category:r.category,description:r.description,amount:r.amount})),...p]); setImportAcct(null); };
  const onFxBlur = async() => { const v=parseFloat(fxInput); if(v>0){setFxRate(v);await dbSetting("fx",v);}else setFxInput(String(fxRate)); };
  const onSetApiKey = async(k) => { setApiKey(k); await dbSetting("claude_key",k); };
  const toggleMask  = async()  => { const nm=!masked; setMasked(nm); await dbSetting("masked",nm); };
  const onLearn     = async(rules) => { await dbSetting("tag_rules", rules); };

  // ── Login ──
  if (!authed) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#667eea 0%,#764ba2 100%)", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:20, padding:40, width:"100%", maxWidth:380, boxShadow:"0 25px 60px rgba(0,0,0,0.2)", textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:12 }}>📊</div>
        <p style={{ fontSize:24, fontWeight:800, color:"#111827", margin:"0 0 4px" }}>Founder Finance</p>
        <p style={{ fontSize:14, color:"#6B7280", margin:"0 0 28px" }}>Private Dashboard</p>
        <input type="password" placeholder="Password" value={pwd} onChange={e=>{setPwd(e.target.value);setPwdErr(false);}} onKeyDown={e=>e.key==="Enter"&&(pwd===APP_PWD?setAuthed(true):setPwdErr(true))} style={{ ...styles.input, textAlign:"center", letterSpacing:6, fontSize:16, marginBottom:8 }} autoFocus />
        {pwdErr&&<p style={{ color:"#EF4444", fontSize:13, margin:"0 0 10px" }}>Incorrect password</p>}
        <button onClick={()=>pwd===APP_PWD?setAuthed(true):setPwdErr(true)} style={{ ...styles.btnPrimary, width:"100%", padding:14, fontSize:15 }}>Unlock Dashboard</button>
      </div>
    </div>
  );

  // ── DB setup needed ──
  if (!dbReady&&!loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ maxWidth:560, background:"#fff", borderRadius:16, padding:32, boxShadow:"0 4px 30px rgba(0,0,0,0.1)" }}>
        <p style={{ fontSize:20, fontWeight:800, color:"#111827", marginBottom:16 }}>⚙️ One-Time Supabase Setup</p>
        <p style={{ color:"#4B5563", marginBottom:16 }}>Run this SQL in your Supabase dashboard → SQL Editor:</p>
        <pre style={{ background:"#1e1b4b", color:"#e0e7ff", padding:16, borderRadius:10, fontSize:12, overflow:"auto", marginBottom:16 }}>{`CREATE TABLE IF NOT EXISTS ffd_entries (id bigint PRIMARY KEY, date text NOT NULL, business text NOT NULL, account text DEFAULT 'lrf', type text NOT NULL, category text NOT NULL, description text, amount numeric NOT NULL, source text DEFAULT 'manual', created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS ffd_channels (id bigint PRIMARY KEY, name text NOT NULL, biz text, clr text DEFAULT '#6366F1', bg text DEFAULT '#EEF2FF', cats jsonb DEFAULT '[]', created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS ffd_settings (key text PRIMARY KEY, value jsonb);
ALTER TABLE ffd_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ffd_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ffd_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON ffd_entries  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON ffd_channels FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON ffd_settings FOR ALL TO anon USING (true) WITH CHECK (true);`}</pre>
        <button onClick={()=>window.location.reload()} style={{ ...styles.btnPrimary, padding:"12px 24px" }}>Reload after running SQL</button>
      </div>
    </div>
  );

  // ── Loading ──
  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
      <div style={{ width:48, height:48, border:"4px solid #E5E7EB", borderTop:"4px solid #4F46E5", borderRadius:"50%", animation:"spin 1s linear infinite" }} />
      <p style={{ color:"#6B7280", fontSize:15 }}>Loading your financial data…</p>

    </div>
  );

  const TABS = [["dashboard","📊 Dashboard"],["accounts","🏦 Accounts"],["channels","📈 Channels"],["entries",`📋 Entries (${entries.length})`],["ai","✦ AI Insights"]];

  return (
    <MaskCtx.Provider value={masked}>
    <div style={{ minHeight:"100vh", background:"#F8FAFC", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color:"#0F172A" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .ffd-tabs{display:flex;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;}
        .ffd-tabs::-webkit-scrollbar{display:none;}
        .ffd-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
        .ffd-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
        .ffd-grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}
        .ffd-bottom-nav{display:none;}
        @media(max-width:1100px){.ffd-grid-4{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:768px){
          .ffd-grid-4{grid-template-columns:repeat(2,1fr);}
          .ffd-grid-3{grid-template-columns:repeat(2,1fr);}
          .ffd-grid-2{grid-template-columns:1fr;}
          .ffd-desktop-tabs{display:none!important;}
          .ffd-bottom-nav{display:flex!important;}
          .ffd-fx-label{display:none!important;}
          .ffd-content{padding:16px 12px 80px!important;}
        }
        @media(max-width:480px){
          .ffd-grid-4{grid-template-columns:1fr 1fr;}
          .ffd-grid-3{grid-template-columns:1fr 1fr;}
        }
      `}</style>

      {/* ── Top Bar ── */}
      <div style={{ background:"#fff", borderBottom:"1px solid #E5E7EB", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:1440, margin:"0 auto", padding:"0 16px", display:"flex", alignItems:"center", gap:12, height:56 }}>
          <div style={{ fontSize:26, flexShrink:0 }}>📊</div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontWeight:800, fontSize:15, margin:0, lineHeight:1 }}>Founder Finance</p>
            <p style={{ fontSize:12, color:"#6B7280", margin:0 }}>{entries.length} entries · Net: <span style={{ color:netFlow>=0?"#059669":"#DC2626",fontWeight:700 }}>{fmt(netFlow)}</span></p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:"#6B7280", flexShrink:0 }}>
            <span className="ffd-fx-label" style={{ fontSize:12 }}>GBP→INR:</span>
            <input value={fxInput} onChange={e=>setFxInput(e.target.value)} onBlur={onFxBlur} style={{ width:60, padding:"4px 7px", border:"1px solid #BFDBFE", borderRadius:6, fontSize:13, outline:"none", background:"#EFF6FF", color:"#1D4ED8", fontWeight:600 }} />
          </div>
          <button onClick={toggleMask} title={masked?"Show numbers":"Hide numbers"} style={{padding:"7px 12px",border:`1.5px solid ${masked?"#374151":"#CBD5E1"}`,borderRadius:8,background:masked?"#1E293B":"#F8FAFC",color:masked?"#fff":"#64748B",cursor:"pointer",fontSize:13,fontWeight:600,flexShrink:0,display:"flex",alignItems:"center",gap:5}}>
            {masked?"🙈 Masked":"👁 Visible"}
          </button>
          <button onClick={()=>setShowAdd(true)} style={{ ...styles.btnPrimary, padding:"8px 14px", fontSize:13, flexShrink:0 }}>+ Add</button>
        </div>

        {/* ── Tab Nav (desktop + tablet) ── */}
        <div className="ffd-tabs ffd-desktop-tabs" style={{ maxWidth:1440, margin:"0 auto", padding:"0 8px" }}>
          {TABS.map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)} style={{ padding:"11px 18px", fontSize:13, fontWeight:tab===id?700:500, color:tab===id?"#4F46E5":"#4B5563", border:"none", borderBottom:tab===id?"3px solid #4F46E5":"3px solid transparent", marginBottom:-1, background:"none", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="ffd-content" style={{ maxWidth:1440, margin:"0 auto", padding:"20px 20px 40px" }}>
        {tab==="dashboard" && <DashboardTab entries={entries} channels={channels} fxRate={fxRate} />}
        {tab==="accounts"  && <AccountsTab  entries={entries} fxRate={fxRate} onEdit={setEditE} onDelete={onDelete} onImport={setImportAcct} />}
        {tab==="channels"  && <ChannelsTab  entries={entries} channels={channels} fxRate={fxRate} onEditCh={ch=>{setEditCh(ch);setShowChModal(true);}} onDelCh={onDelCh} onAddCh={()=>{setEditCh(null);setShowChModal(true);}} />}
        {tab==="entries"   && <EntriesTab   entries={entries} fxRate={fxRate} onEdit={setEditE} onDelete={onDelete} />}
        {tab==="ai"        && <AIInsightsTab entries={entries} channels={channels} fxRate={fxRate} apiKey={apiKey} onSetApiKey={onSetApiKey} />}
      </div>

      {/* ── Mobile Bottom Nav (hidden on desktop via CSS) ── */}
      <div className="ffd-bottom-nav" style={{ position:"fixed", bottom:0, left:0, right:0, background:"#fff", borderTop:"1px solid #E5E7EB", zIndex:100, paddingBottom:"env(safe-area-inset-bottom)" }}>
        {[["dashboard","📊","Home"],["accounts","🏦","Accounts"],["channels","📈","Revenue"],["entries","📋","Entries"],["ai","✦","AI"]].map(([id,icon,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ flex:1, padding:"8px 4px", background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, color:tab===id?"#4F46E5":"#9CA3AF" }}>
            <span style={{ fontSize:18 }}>{icon}</span>
            <span style={{ fontSize:10, fontWeight:tab===id?700:500 }}>{lbl}</span>
          </button>
        ))}
      </div>

      {/* ── Modals ── */}
      {showAdd    && <AddEntry onAdd={e=>{onAdd(e);setShowAdd(false);}} onClose={()=>setShowAdd(false)} />}
      {editE      && <EditModal entry={editE} onSave={onEdit} onClose={()=>setEditE(null)} />}
      {showChModal&& <ChannelModal ch={editCh} onSave={onSaveCh} onClose={()=>{setShowChModal(false);setEditCh(null);}} />}
      {importAcct && <SmartImport accountId={importAcct} entries={entries} onDone={onImported} onClose={()=>setImportAcct(null)} onLearn={onLearn}/>}
    </div>
    </MaskCtx.Provider>
  );
}
