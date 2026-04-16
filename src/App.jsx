// ═══════════════════════════════════════════════════════════════
//  FOUNDER FINANCE OS  v4.0
//  Premium · Decision-First · AI-Powered · Self-Learning
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from "react";
import { createClient } from "@supabase/supabase-js";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import * as XLSX from "xlsx";

const MaskCtx = createContext(false);
const useMask = () => useContext(MaskCtx);

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SB_URL  = "https://wlghcxfrdbbbjldfepks.supabase.co";
const SB_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZ2hjeGZyZGJiYmpsZGZlcGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTQ0NTQsImV4cCI6MjA5MDc5MDQ1NH0.g5USyRfhcKA31_6ia7B2QyAuUMBbWbANacFDGLhXZZo";
const APP_PWD = "founder2026";
const sb      = createClient(SB_URL, SB_KEY);
const NAMES   = ["Shailen","Mansi"];
const PER_PAGE = 25;

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const ACCOUNTS = [
  {id:"lrf",       label:"LiveRightFit LLP", short:"LRF",      cur:"INR",clr:"#F59E0B"},
  {id:"grownmind", label:"Grownmind",         short:"Grownmind",cur:"INR",clr:"#6366F1"},
  {id:"jeet",      label:"Jeet UK",           short:"Jeet UK",  cur:"GBP",clr:"#06B6D4"},
];
const BUSINESSES = ["Migrizo","Nutrolis","Assignment"];
const BIZ_CLR    = {Migrizo:"#8B5CF6",Nutrolis:"#F59E0B",Assignment:"#06B6D4"};
const MONTHS     = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const COLORS     = ["#6366F1","#F59E0B","#EF4444","#10B981","#3B82F6","#8B5CF6","#EC4899","#14B8A6","#F97316","#84CC16","#06B6D4","#A855F7"];

const OP_CATS  = ["Amazon Revenue","Flipkart Revenue","Migrizo Revenue","Direct Sales","Consultation","Services","Assignment Payment","Website Revenue","Offline Revenue","Other Income","Misc Income"];
const CAP_CATS = ["Capital Injection","Business Loan Received","Investment / Loan Received","Internal Transfer"];
const INC_CATS = [...OP_CATS,...CAP_CATS];
const EXP_CATS = ["Meta Ads","Migrizo Expenses","Credit Card Payment","Salaries","Freelancer","Procurement","Equipment & Office","Professional Services","Software","Shipping","Marketplace Fees","GST & Tax","Loan / EMI","Telecom & Internet","Food & Entertainment","Misc Expense","Owner Drawings","Founder Travel","Inter-company Transfer"];

const DEFAULT_CHANNELS = [
  {id:1,name:"Amazon",    biz:"Nutrolis",  clr:"#F97316",bg:"#FFF7ED",cats:["Amazon Revenue"]},
  {id:2,name:"Flipkart",  biz:"Nutrolis",  clr:"#6366F1",bg:"#EEF2FF",cats:["Flipkart Revenue"]},
  {id:3,name:"Migrizo",   biz:"Migrizo",   clr:"#8B5CF6",bg:"#F5F3FF",cats:["Migrizo Revenue","Consultation","Services"]},
  {id:4,name:"Offline",   biz:"Nutrolis",  clr:"#10B981",bg:"#F0FDF4",cats:["Offline Revenue","Direct Sales"]},
  {id:5,name:"Website",   biz:"Nutrolis",  clr:"#3B82F6",bg:"#EFF6FF",cats:["Website Revenue"]},
  {id:6,name:"Assignment",biz:"Assignment",clr:"#06B6D4",bg:"#ECFEFF",cats:["Assignment Payment"]},
];

const CAT_RULES = [
  {kw:["amazon seller","amazon payment","amz seller"],type:"Income", cat:"Amazon Revenue",    biz:"Nutrolis"},
  {kw:["flipkart","fk nodal"],                        type:"Income", cat:"Flipkart Revenue",  biz:"Nutrolis"},
  {kw:["migrizo","migration consult","visa consult"],  type:"Income", cat:"Migrizo Revenue",   biz:"Migrizo"},
  {kw:["consultation","gkv kickstart","era paid","abhishek","sukhdeep"],type:"Income",cat:"Consultation",biz:"Migrizo"},
  {kw:["assignment revenue","assignment payment"],     type:"Income", cat:"Assignment Payment",biz:"Assignment"},
  {kw:["facebook","meta ads","fb ads","instagram ads"],type:"Expense",cat:"Meta Ads"},
  {kw:["shiprocket","bigfoot","xpressbees","delhivery","rising star"],type:"Expense",cat:"Shipping"},
  {kw:["salary","payroll","mansi behal","bhaskar"],    type:"Expense",cat:"Salaries"},
  {kw:["credit card","icici credit","idfc credit"],    type:"Expense",cat:"Credit Card Payment"},
  {kw:["gst","tax payment"],                           type:"Expense",cat:"GST & Tax"},
  {kw:["zoho","notion","godaddy","tata stars"],        type:"Expense",cat:"Software"},
  {kw:["airtel","jio","vodafone","bsnl"],              type:"Expense",cat:"Telecom & Internet"},
  {kw:["oribite","nutra science","procurement"],       type:"Expense",cat:"Procurement"},
  {kw:["ca fee","chartered","shashank"],               type:"Expense",cat:"Professional Services"},
  {kw:["croma","blue star","equipment"],               type:"Expense",cat:"Equipment & Office"},
  {kw:["food","restaurant","swiggy","zomato","chaayos"],type:"Expense",cat:"Food & Entertainment"},
  {kw:["flight","hotel","accommodation","irctc"],       type:"Expense",cat:"Founder Travel"},
  {kw:["loan emi","emi payment","neelam"],             type:"Expense",cat:"Loan / EMI"},
  {kw:["freelancer","akash verma","solanki","ayushi","vishakha","sapna"],type:"Expense",cat:"Freelancer"},
  {kw:["grownmind","intercompany","inter-company"],    type:"Expense",cat:"Inter-company Transfer"},
];

// ─── SELF-LEARNING TAG ENGINE ─────────────────────────────────────────────────
let LEARNED_RULES = [];
function applyTagRules(desc="",type=""){
  const d=desc.toLowerCase();
  for(const r of LEARNED_RULES) if(r.type===type&&r.kw.some(k=>d.includes(k.toLowerCase()))) return {category:r.cat,business:r.biz||"Nutrolis"};
  for(const r of CAT_RULES) if(r.type===type&&r.kw.some(k=>d.includes(k))) return {category:r.cat,business:r.biz||"Nutrolis"};
  return {category:type==="Income"?"Other Income":"Misc Expense",business:"Nutrolis"};
}
function learnRule(desc="",category="",type="",business="Nutrolis"){
  const words=desc.toLowerCase().replace(/upi\/[a-z]+\/\d+\//gi,"").replace(/neft\/\w+\//gi,"").split(/[\/\-\s,]+/).map(w=>w.trim()).filter(w=>w.length>3&&!/^\d+$/.test(w)&&!["sent","from","paid","debit","credit","bank"].includes(w));
  const kw=[...new Set(words)].slice(0,3);
  if(kw.length===0)return;
  if(!LEARNED_RULES.find(r=>r.cat===category&&r.type===type&&r.kw.some(k=>kw.includes(k))))
    LEARNED_RULES=[...LEARNED_RULES,{kw,cat:category,type,biz:business}];
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────
const getAcct   = id => ACCOUNTS.find(a=>a.id===id)||{label:id,cur:"INR",clr:"#94A3B8",short:id};
const fxAmt     = (e,rate) => e.account==="jeet"?e.amount*rate:e.amount;
const getMonth  = d => d?parseInt(d.split("-")[1])-1:-1;
const getYear   = d => d?d.split("-")[0]:"";
const pct       = (v,t) => t>0?Math.round(v/t*100)+"%":"0%";
const todayStr  = () => new Date().toISOString().split("T")[0];

const fmt = (n,masked=false) => {
  if(masked)return"₹ ••••";
  const abs=Math.abs(n),pfx=n<0?"-₹":"₹";
  if(abs>=1e5)return pfx+(abs/1e5).toFixed(2)+"L";
  return pfx+Math.round(abs).toLocaleString("en-IN");
};
const fmtCur = (n,cur,masked=false) => {
  if(masked)return cur==="GBP"?"£ ••••":"₹ ••••";
  if(cur==="GBP")return(n<0?"-£":"£")+Math.abs(n).toLocaleString("en-GB",{minimumFractionDigits:0});
  return fmt(n);
};
const fmtK = (n,masked=false) => {
  if(masked)return"••••";
  const abs=Math.abs(n);
  if(abs>=1e5)return(n<0?"-₹":"₹")+(abs/1e5).toFixed(1)+"L";
  if(abs>=1e3)return(n<0?"-₹":"₹")+(abs/1e3).toFixed(0)+"k";
  return fmt(n);
};

function parseDate(s=""){
  if(!s)return null;
  s=s.toString().trim().replace(/['"` ]/g,"");
  if(!s)return null;
  const MO={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
  let m;
  if((m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/)))return s;
  if((m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)))return`${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  if((m=s.match(/^(\d{1,2})-([ A-Za-z]{3})-(\d{4})$/i))){const n=MO[m[2].toLowerCase().trim()];if(n)return`${m[3]}-${String(n).padStart(2,"0")}-${m[1].padStart(2,"0")}`;}
  if((m=s.match(/^(\d{1,2})[\/\-]([A-Za-z]{3})[\/\-](\d{4})$/i))){const n=MO[m[2].toLowerCase()];if(n)return`${m[3]}-${String(n).padStart(2,"0")}-${m[1].padStart(2,"0")}`;}
  if((m=s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/i))){const n=MO[m[2].toLowerCase()];if(n)return`${m[3]}-${String(n).padStart(2,"0")}-${m[1].padStart(2,"0")}`;}
  if((m=s.match(/^(\d{1,2})-([ A-Za-z]{3})-(\d{2})$/i))){const n=MO[m[2].toLowerCase().trim()];const yr=parseInt(m[3])+(parseInt(m[3])<50?2000:1900);if(n)return`${yr}-${String(n).padStart(2,"0")}-${m[1].padStart(2,"0")}`;}
  if(/^\d{5}$/.test(s)){try{const d=XLSX.SSF.parse_date_code(parseInt(s));if(d)return`${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`;}catch(e){}}
  return null;
}
function parseAmount(s=""){if(!s&&s!==0)return 0;const v=parseFloat(String(s).replace(/[₹£$,\s]/g,""))||0;return isNaN(v)?0:Math.abs(v);}
function parseCSV(text){
  const lines=text.replace(/\r\n/g,"\n").replace(/\r/g,"\n").split("\n").filter(l=>l.trim());
  if(lines.length<2)return null;
  const pr=(line)=>{const res=[];let inQ=false,cur="";for(let i=0;i<line.length;i++){if(line[i]==='"'){inQ=!inQ;}else if(line[i]===","&&!inQ){res.push(cur.trim());cur="";}else cur+=line[i];}res.push(cur.trim());return res;};
  return{headers:pr(lines[0]),rows:lines.slice(1).map(pr)};
}

// ─── EXPORT UTILITIES ─────────────────────────────────────────────────────────
function exportCSV(rows,filename="export.csv"){
  const hdr=["Date","Business","Account","Type","Category","Description","Amount"];
  const lines=[hdr.join(","),...rows.map(r=>[r.date,r.business,getAcct(r.account).label,r.type,r.category,`"${(r.description||"").replace(/"/g,"''")}"`   ,r.amount].join(","))];
  const blob=new Blob([lines.join("\n")],{type:"text/csv"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;a.click();
}
function exportXLSX(rows,filename="export.xlsx"){
  const data=[["Date","Business","Account","Type","Category","Description","Amount"],...rows.map(r=>[r.date,r.business,getAcct(r.account).label,r.type,r.category,r.description||"",r.amount])];
  const ws=XLSX.utils.aoa_to_sheet(data);const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,"Entries");XLSX.writeFile(wb,filename);
}

// ─── COLUMN DETECTION ─────────────────────────────────────────────────────────
function findHeaderRow(allRows){
  const lim=Math.min(allRows.length,50);
  for(let i=0;i<lim;i++){const row=(allRows[i]||[]).map(c=>String(c||"").toLowerCase().trim());if(row.some(c=>/date/.test(c)&&!/update|mandate|birth/.test(c))&&row.some(c=>/debit|credit|withdrawal|deposit|amount/.test(c)))return i;}
  for(let i=0;i<lim;i++){const row=(allRows[i]||[]).map(c=>String(c||"").toLowerCase().trim());if(row.some(c=>/particular|narration|narrat|remarks/.test(c))&&row.some(c=>/debit|credit|amount/.test(c)))return i;}
  for(let i=0;i<lim-1;i++){const nr=(allRows[i+1]||[]).map(c=>String(c||"").trim());if(nr.some(c=>parseDate(c)!==null)&&nr.some(c=>!isNaN(parseFloat(c.replace(/[,₹\s]/g,"")))&&parseFloat(c.replace(/[,₹\s]/g,""))>0))return i;}
  return 0;
}
function detectCols(headers){
  const map={date:-1,desc:-1,debit:-1,credit:-1,amount:-1,balance:-1};
  headers.forEach((h,i)=>{const l=h.toLowerCase().trim().replace(/\s+/g," ");
    if(map.date<0&&/date/.test(l)&&!/update|mandate/.test(l))map.date=i;
    if(map.desc<0&&/narrat|remark|description|particular|detail|reference/.test(l))map.desc=i;
    if(map.debit<0&&/debit|withdrawal|dr$|dr\s|paid.?out|outflow/.test(l))map.debit=i;
    if(map.credit<0&&/credit|deposit|cr$|cr\s|paid.?in|inflow/.test(l))map.credit=i;
    if(map.amount<0&&/^(amount|amt)$/.test(l))map.amount=i;
    if(map.balance<0&&/balance|bal$|bal\s/.test(l))map.balance=i;
  });
  return map;
}
function detectColsFromData(headers,dataRows){
  let map=detectCols(headers);
  const sample=dataRows.filter(r=>r.some(c=>c!=="")).slice(0,10);
  if(sample.length===0)return map;
  const nC=Math.max(headers.length,...sample.map(r=>r.length));
  if(map.date<0){let best=-1,bS=0;for(let c=0;c<nC;c++){const s=sample.filter(r=>parseDate(String(r[c]||""))!==null).length;if(s>bS){bS=s;best=c;}}if(bS>=2)map.date=best;}
  if(map.desc<0){let best=-1,bL=0;for(let c=0;c<nC;c++){if(c===map.date||c===map.balance)continue;const avg=sample.reduce((s,r)=>s+String(r[c]||"").length,0)/sample.length;if(avg>bL&&avg>8){bL=avg;best=c;}}if(best>=0)map.desc=best;}
  if(map.debit<0&&map.credit<0&&map.amount<0){
    const nc=[];for(let c=0;c<nC;c++){if(c===map.date||c===map.desc)continue;const ok=sample.every(r=>{const v=String(r[c]||"").replace(/[,₹£$\s]/g,"");return v===""||(!isNaN(parseFloat(v))&&isFinite(parseFloat(v)));});if(ok)nc.push(c);}
    if(nc.length>=3){map.debit=nc[nc.length-3];map.credit=nc[nc.length-2];map.balance=nc[nc.length-1];}
    else if(nc.length===2){map.debit=nc[0];map.credit=nc[1];}
    else if(nc.length===1){map.amount=nc[0];}
  }
  return map;
}

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const dbAdd    = e   => sb.from("ffd_entries").insert([e]);
const dbUpdate = e   => sb.from("ffd_entries").update(e).eq("id",e.id);
const dbDelete = id  => sb.from("ffd_entries").delete().eq("id",id);
const dbSetting= (k,v)=> sb.from("ffd_settings").upsert({key:k,value:v});
const dbAddCh  = c   => sb.from("ffd_channels").upsert([c]);
const dbDelCh  = id  => sb.from("ffd_channels").delete().eq("id",id);

// ═══════════════════════════════════════════════════════════════════════════════
//  SMART IMPORT  —  No mapping. Fully automatic. IDFC / ICICI / HDFC / any bank.
// ═══════════════════════════════════════════════════════════════════════════════
function SmartImport({accountId,entries,onDone,onClose,onLearn}){
  const [step,setStep]=useState(1);
  const [preview,setPrev]=useState([]);
  const [selected,setSel]=useState(new Set());
  const [editRow,setEditRow]=useState(null);
  const [dragging,setDrag]=useState(false);
  const [loading,setLoading]=useState(false);
  const [progress,setProgress]=useState(0);
  const [summary,setSummary]=useState(null);
  const [filterDup,setFD]=useState(false);
  const [detected,setDet]=useState("");
  const fileRef=useRef();

  const processRows=useCallback((allRows)=>{
    const hdrIdx=findHeaderRow(allRows);
    const headers=(allRows[hdrIdx]||[]);
    const dataRows=allRows.slice(hdrIdx+1).filter(r=>r.some(c=>c!==""));
    const map=detectColsFromData(headers,dataRows);
    setDet(`✅ ${dataRows.length} rows found · Date: "${headers[map.date]||"auto"}" · Amounts auto-detected`);
    const existSet=new Set(entries.map(e=>`${e.date}||${e.amount}||${(e.description||"").toLowerCase().slice(0,20)}`));
    const rows=dataRows.map((row,i)=>{
      const dateStr=map.date>=0?parseDate(String(row[map.date]||"")):null;
      const desc=map.desc>=0?(row[map.desc]||"").trim():`Row ${i+1}`;
      const debitAmt=map.debit>=0?parseAmount(row[map.debit]):0;
      const creditAmt=map.credit>=0?parseAmount(row[map.credit]):0;
      const singleAmt=map.amount>=0?parseFloat(String(row[map.amount]||"0").replace(/[₹£$,\s]/g,""))||0:0;
      if(!dateStr)return null;
      let type,amount;
      if(debitAmt>0&&creditAmt===0){type="Expense";amount=debitAmt;}
      else if(creditAmt>0&&debitAmt===0){type="Income";amount=creditAmt;}
      else if(debitAmt>0&&creditAmt>0){type="Expense";amount=debitAmt;}
      else if(singleAmt!==0){type=singleAmt<0?"Expense":"Income";amount=Math.abs(singleAmt);}
      else return null;
      if(!amount||amount<=0)return null;
      const {category,business}=applyTagRules(desc,type);
      const dupKey=`${dateStr}||${amount}||${desc.toLowerCase().slice(0,20)}`;
      return{_id:i,date:dateStr,description:desc,type,amount,category,business,account:accountId,isDuplicate:existSet.has(dupKey)};
    }).filter(Boolean);
    setPrev(rows);setSel(new Set(rows.filter(r=>!r.isDuplicate).map(r=>r._id)));
    setStep(2);setLoading(false);
  },[entries,accountId]);

  const handleFile=useCallback((file)=>{
    if(!file)return;
    const ext=file.name.split(".").pop().toLowerCase();
    setLoading(true);
    if(["xlsx","xls","ods"].includes(ext)){
      const r=new FileReader();
      r.onload=e=>{
        try{
          const wb=XLSX.read(new Uint8Array(e.target.result),{type:"array"});
          let bestRows=[],bestCount=0;
          for(const sn of wb.SheetNames){const ws=wb.Sheets[sn];const raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:"",raw:false});const rows=raw.map(row=>row.map(c=>String(c==null?"":c).trim()));const cnt=rows.filter(r=>r.some(c=>c!=="")).length;if(cnt>bestCount){bestCount=cnt;bestRows=rows;}}
          processRows(bestRows);
        }catch(err){alert("Could not read: "+err.message);setLoading(false);}
      };
      r.readAsArrayBuffer(file);
    }else{
      const r=new FileReader();
      r.onload=e=>{try{const raw=parseCSV(e.target.result);if(!raw){alert("Could not parse CSV.");setLoading(false);return;}processRows([raw.headers,...raw.rows]);}catch(err){alert("Error: "+err.message);setLoading(false);}};
      r.readAsText(file);
    }
  },[processRows]);

  const onDrop=useCallback(e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0]);},[handleFile]);

  const doImport=async()=>{
    setLoading(true);
    const toImport=preview.filter(r=>selected.has(r._id));
    toImport.forEach(r=>learnRule(r.description,r.category,r.type,r.business));
    if(onLearn)onLearn(LEARNED_RULES);
    const chunks=[];for(let i=0;i<toImport.length;i+=50)chunks.push(toImport.slice(i,i+50));
    let done=0;
    for(const chunk of chunks){
      await sb.from("ffd_entries").insert(chunk.map(r=>({id:Date.now()+Math.floor(Math.random()*99999),date:r.date,business:r.business,account:r.account,type:r.type,category:r.category,description:r.description,amount:r.amount,source:"import"})));
      done+=chunk.length;setProgress(Math.round(done/toImport.length*100));
    }
    setSummary({imported:toImport.length,skipped:preview.filter(r=>r.isDuplicate).length});
    onDone(toImport);setStep(3);setLoading(false);
  };

  const toggleRow=id=>setSel(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleAll=()=>{const vis=filterDup?preview.filter(r=>!r.isDuplicate):preview;const all=vis.every(r=>selected.has(r._id));setSel(s=>{const n=new Set(s);vis.forEach(r=>all?n.delete(r._id):n.add(r._id));return n;});};
  const displayed=filterDup?preview.filter(r=>!r.isDuplicate):preview;

  return(
    <MaskCtx.Provider value={false}>
    <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={S.importModal}>
        <div style={S.importHeader}>
          <div>
            <p style={{margin:0,fontWeight:800,fontSize:17,color:"#0F172A"}}>📥 Smart Bank Import</p>
            <p style={{margin:"2px 0 0",fontSize:13,color:"#64748B"}}>{getAcct(accountId).label} · CSV / Excel · Any bank · Zero manual mapping</p>
          </div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>
        <div style={{display:"flex",borderBottom:"1px solid #E2E8F0"}}>
          {["Upload","Preview & Select","Done"].map((s,i)=>(
            <div key={s} style={{flex:1,padding:"10px 4px",textAlign:"center",fontSize:12,fontWeight:step===i+1?700:400,color:step===i+1?"#4F46E5":step>i?"#0F172A":"#94A3B8",borderBottom:step===i+1?"2px solid #4F46E5":"2px solid transparent"}}>
              {i+1}. {s}
            </div>
          ))}
        </div>
        <div style={{padding:20,overflowY:"auto",maxHeight:"calc(90vh - 130px)"}}>
          {step===1&&(
            <div>
              <div style={{...S.dropZone,...(dragging?S.dropZoneActive:{})}} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={onDrop} onClick={()=>fileRef.current?.click()}>
                <div style={{fontSize:48,marginBottom:12}}>📂</div>
                <p style={{fontWeight:800,fontSize:16,margin:"0 0 6px",color:"#1E293B"}}>Drop your bank statement here</p>
                <p style={{fontSize:14,color:"#64748B",margin:"0 0 16px"}}>or tap to browse · IDFC, ICICI, HDFC — all auto-detected</p>
                <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                  {["CSV","XLS","XLSX","ODS"].map(t=><span key={t} style={{padding:"4px 12px",background:"#EEF2FF",borderRadius:8,fontSize:13,fontWeight:600,color:"#4F46E5"}}>{t}</span>)}
                </div>
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.ods" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
              </div>
              {loading&&<div style={{textAlign:"center",marginTop:24}}><div style={{width:36,height:36,border:"4px solid #E2E8F0",borderTop:"4px solid #4F46E5",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 12px"}}/><p style={{color:"#64748B",fontSize:14}}>Reading & auto-detecting columns…</p></div>}
              <div style={{marginTop:16,padding:"12px 16px",background:"#FFFBEB",borderRadius:12,border:"1px solid #FDE68A",fontSize:13,color:"#78350F",lineHeight:1.7}}>
                💡 <b>IDFC:</b> NetBanking → Accounts → Statement → Excel &nbsp;|&nbsp; <b>ICICI / HDFC:</b> NetBanking → Download Statement
              </div>
            </div>
          )}
          {step===2&&(
            <div>
              <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#166534",marginBottom:12,fontWeight:500}}>{detected}</div>
              <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{...S.badge,background:"#DCFCE7",color:"#166534"}}>✅ {preview.filter(r=>!r.isDuplicate).length} new</span>
                <span style={{...S.badge,background:"#FEF9C3",color:"#713F12"}}>🔁 {preview.filter(r=>r.isDuplicate).length} already exist</span>
                <span style={{...S.badge,background:"#EEF2FF",color:"#4F46E5"}}>☑ {selected.size} selected</span>
                <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#374151",marginLeft:"auto",cursor:"pointer"}}>
                  <input type="checkbox" checked={filterDup} onChange={e=>setFD(e.target.checked)}/>Hide existing
                </label>
              </div>
              <div style={{overflowX:"auto",maxHeight:"45vh",overflowY:"auto",border:"1px solid #E2E8F0",borderRadius:10}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:600}}>
                  <thead style={{position:"sticky",top:0,background:"#F8FAFC",zIndex:1}}>
                    <tr><th style={S.th}><input type="checkbox" onChange={toggleAll} checked={displayed.length>0&&displayed.every(r=>selected.has(r._id))}/></th><th style={S.th}>Date</th><th style={S.th}>Description</th><th style={S.th}>Type</th><th style={S.th}>Category</th><th style={{...S.th,textAlign:"right"}}>Amount</th><th style={S.th}/></tr>
                  </thead>
                  <tbody>
                    {displayed.map((row,i)=>(
                      <tr key={row._id} style={{background:row.isDuplicate?"#FFFBEB":i%2===0?"#fff":"#FAFAFA",opacity:row.isDuplicate?0.65:1}}>
                        <td style={S.td}><input type="checkbox" checked={selected.has(row._id)} onChange={()=>toggleRow(row._id)}/></td>
                        <td style={{...S.td,whiteSpace:"nowrap"}}>{row.date}</td>
                        <td style={{...S.td,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={row.description}>{row.description}</td>
                        <td style={S.td}><span style={{...S.badge,background:row.type==="Income"?"#DCFCE7":"#FEE2E2",color:row.type==="Income"?"#166534":"#7F1D1D",fontSize:11}}>{row.type}</span></td>
                        <td style={{...S.td,fontSize:11}}>{row.category}</td>
                        <td style={{...S.td,fontWeight:700,color:row.type==="Income"?"#059669":"#DC2626",textAlign:"right",whiteSpace:"nowrap"}}>{row.isDuplicate&&<span style={{marginRight:4}}>🔁</span>}{fmt(row.amount)}</td>
                        <td style={S.td}><button onClick={()=>setEditRow({...row})} style={{padding:"3px 8px",fontSize:11,background:"#EEF2FF",border:"none",borderRadius:6,cursor:"pointer",color:"#4F46E5"}}>Edit</button></td>
                      </tr>
                    ))}
                    {displayed.length===0&&<tr><td colSpan={7} style={{...S.td,textAlign:"center",padding:40,color:"#94A3B8"}}>No entries to show.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div style={{display:"flex",gap:10,marginTop:16}}>
                <button onClick={()=>setStep(1)} style={S.btnGhost}>← Back</button>
                <button onClick={doImport} style={{...S.btnPrimary,flex:1}} disabled={selected.size===0||loading}>{loading?`Importing… ${progress}%`:`Import ${selected.size} entries →`}</button>
              </div>
              {loading&&<div style={{marginTop:10,height:5,background:"#E2E8F0",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${progress}%`,background:"#4F46E5",borderRadius:4,transition:"width 0.3s"}}/></div>}
            </div>
          )}
          {step===3&&summary&&(
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:60,marginBottom:16}}>🎉</div>
              <p style={{fontSize:22,fontWeight:800,color:"#0F172A",margin:"0 0 20px"}}>Import Complete!</p>
              <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:24,flexWrap:"wrap"}}>
                <div style={{padding:"14px 28px",background:"#DCFCE7",borderRadius:12}}><div style={{fontSize:30,fontWeight:800,color:"#059669"}}>{summary.imported}</div><div style={{fontSize:13,color:"#166534"}}>imported</div></div>
                <div style={{padding:"14px 28px",background:"#FEF9C3",borderRadius:12}}><div style={{fontSize:30,fontWeight:800,color:"#B45309"}}>{summary.skipped}</div><div style={{fontSize:13,color:"#78350F"}}>skipped</div></div>
              </div>
              <button onClick={onClose} style={{...S.btnPrimary,padding:"12px 40px",fontSize:15}}>Done ✓</button>
            </div>
          )}
        </div>
      </div>
      {editRow&&(
        <div style={{...S.overlay,zIndex:1100}} onClick={e=>e.target===e.currentTarget&&setEditRow(null)}>
          <div style={{background:"#fff",borderRadius:16,padding:20,width:"90%",maxWidth:380,boxShadow:"0 25px 60px rgba(0,0,0,0.25)"}}>
            <p style={{fontWeight:700,fontSize:15,margin:"0 0 14px"}}>Edit Before Import</p>
            {[["Type","type",["Income","Expense"]],["Category","category",editRow.type==="Income"?INC_CATS:EXP_CATS],["Business","business",BUSINESSES]].map(([lbl,key,opts])=>(
              <div key={key} style={{marginBottom:12}}>
                <label style={S.formLabel}>{lbl}</label>
                <select style={S.select} value={editRow[key]} onChange={e=>setEditRow(r=>({...r,[key]:e.target.value}))}>
                  {opts.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setEditRow(null)} style={S.btnGhost}>Cancel</button>
              <button onClick={()=>{setPrev(p=>p.map(r=>r._id===editRow._id?{...editRow}:r));setEditRow(null);}} style={S.btnPrimary}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </MaskCtx.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DASHBOARD TAB  —  Premium design, greeting, 4-column KPIs, flags, charts
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardTab({entries,channels,fxRate,onTabChange,onImport}){
  const masked=useMask();
  const fe=useCallback(e=>fxAmt(e,fxRate),[fxRate]);
  const [flagModal,setFlagModal]=useState(null); // {type:"green"|"red", list:[]}

  const inc   =useMemo(()=>entries.filter(e=>e.type==="Income").reduce((s,e)=>s+fe(e),0),[entries,fe]);
  const exp   =useMemo(()=>entries.filter(e=>e.type==="Expense").reduce((s,e)=>s+fe(e),0),[entries,fe]);
  const net   =inc-exp;
  const opRev =useMemo(()=>entries.filter(e=>e.type==="Income"&&OP_CATS.includes(e.category)).reduce((s,e)=>s+fe(e),0),[entries,fe]);
  const loans =useMemo(()=>entries.filter(e=>["Business Loan Received","Investment / Loan Received"].includes(e.category)).reduce((s,e)=>s+fe(e),0),[entries,fe]);

  const monthly=useMemo(()=>MONTHS.map((m,i)=>({
    month:m,
    inc:entries.filter(e=>e.type==="Income"&&getMonth(e.date)===i).reduce((s,e)=>s+fe(e),0),
    exp:entries.filter(e=>e.type==="Expense"&&getMonth(e.date)===i).reduce((s,e)=>s+fe(e),0),
    opR:entries.filter(e=>e.type==="Income"&&OP_CATS.includes(e.category)&&getMonth(e.date)===i).reduce((s,e)=>s+fe(e),0),
  })).filter(m=>m.inc>0||m.exp>0),[entries,fe]);

  const bizBreak=useMemo(()=>BUSINESSES.map(b=>({
    name:b,inc:entries.filter(e=>e.business===b&&e.type==="Income").reduce((s,e)=>s+fe(e),0),
    exp:entries.filter(e=>e.business===b&&e.type==="Expense").reduce((s,e)=>s+fe(e),0),
  })),[entries,fe]);

  const expCats=useMemo(()=>{const m={};entries.filter(e=>e.type==="Expense").forEach(e=>{m[e.category]=(m[e.category]||0)+fe(e);});return Object.entries(m).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,6);},[entries,fe]);

  const chData=useMemo(()=>channels.map(ch=>({...ch,total:entries.filter(e=>e.type==="Income"&&ch.cats.includes(e.category)).reduce((s,e)=>s+fe(e),0),count:entries.filter(e=>ch.cats.includes(e.category)).length})),[channels,entries,fe]);

  const flags=useMemo(()=>{
    const green=[],red=[];
    if(monthly.length>=2){
      const last=monthly[monthly.length-1],prev=monthly[monthly.length-2];
      if(last.inc>prev.inc)green.push(`Revenue up ${Math.round((last.inc-prev.inc)/prev.inc*100)}% vs previous month`);
      if(last.exp<prev.exp)green.push(`Expenses down ${Math.round((prev.exp-last.exp)/prev.exp*100)}% vs previous month`);
      if(last.inc<prev.inc*0.8)red.push(`Revenue dropped ${Math.round((prev.inc-last.inc)/prev.inc*100)}% vs last month`);
      if(last.exp>prev.exp*1.3)red.push(`Expenses spiked ${Math.round((last.exp-prev.exp)/prev.exp*100)}% vs last month`);
    }
    if(loans>0){const dr=loans/inc;if(dr>0.35)red.push(`Debt is ${Math.round(dr*100)}% of inflow — high repayment pressure`);else green.push("Debt-to-income ratio is manageable");}
    if(opRev>0&&opRev/inc>0.22)green.push(`Operating revenue is ${Math.round(opRev/inc*100)}% of total inflow — solid`);
    else if(opRev>0&&opRev/inc<0.12)red.push(`Only ${Math.round(opRev/inc*100)}% op. revenue — heavy reliance on capital`);
    const avgBurn=exp/(monthly.length||1);const runway=net/avgBurn;
    if(runway>6)green.push(`~${Math.round(runway)} months runway at current burn rate`);
    else if(runway<3&&runway>0)red.push(`Only ~${Math.round(runway)} months runway — review burn now`);
    const feb=monthly.find(m=>m.month==="Feb");if(feb&&feb.inc<feb.exp)red.push("February cashflow was negative — watch seasonal patterns");
    const miz=bizBreak.find(b=>b.name==="Migrizo");if(miz&&opRev>0&&miz.inc/opRev>0.45)green.push(`Migrizo driving ${Math.round(miz.inc/opRev*100)}% of operating revenue`);
    return{green:green.slice(0,5),red:red.slice(0,5)};
  },[monthly,opRev,inc,exp,net,loans,bizBreak]);

  const runway=Math.max(0,Math.round(net/(exp/(monthly.length||1))));
  const recentTxns=useMemo(()=>[...entries].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8),[entries]);

  // Time-based greeting
  const greeting=useMemo(()=>{
    const h=new Date().getHours();
    const name=NAMES[Math.floor(Math.random()*NAMES.length)];
    if(h>=5&&h<12)return`Good morning, ${name} 👋`;
    if(h>=12&&h<17)return`Good afternoon, ${name} 👋`;
    if(h>=17&&h<21)return`Good evening, ${name} 👋`;
    return`Hey ${name}, working late? 🌙`;
  },[]);

  const kpis=[
    {label:"Net Position",  value:fmt(net,masked),   sub:net>=0?"Positive cashflow":"Negative cashflow", icon:"💰",clr:net>=0?"#059669":"#DC2626",bg:net>=0?"#F0FDF4":"#FFF1F2",bdr:net>=0?"#BBF7D0":"#FECACA"},
    {label:"Total Income",  value:fmt(inc,masked),   sub:`${entries.filter(e=>e.type==="Income").length} credits`,icon:"📈",clr:"#0891B2",bg:"#ECFEFF",bdr:"#A5F3FC"},
    {label:"Total Expenses",value:fmt(exp,masked),   sub:`${entries.filter(e=>e.type==="Expense").length} debits`,icon:"📉",clr:"#DC2626",bg:"#FFF1F2",bdr:"#FECACA"},
    {label:"Operating Rev", value:fmt(opRev,masked), sub:"Actual sales revenue",                          icon:"🏪",clr:"#B45309",bg:"#FFFBEB",bdr:"#FDE68A"},
  ];

  return(
    <div>
      {/* Greeting */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div>
          <p style={{fontSize:22,fontWeight:800,color:"#0F172A",margin:"0 0 2px"}}>{greeting}</p>
          <p style={{fontSize:14,color:"#64748B",margin:0}}>Here's your financial snapshot · {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>exportCSV(entries,"dashboard.csv")} style={{...S.btnGhost,fontSize:12,padding:"8px 14px"}}>↓ CSV</button>
          <button onClick={()=>exportXLSX(entries,"founder-finance.xlsx")} style={{...S.btnPrimary,fontSize:12,padding:"8px 14px"}}>↓ Excel</button>
        </div>
      </div>

      {/* 4-column KPI cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}} className="kpi-grid">
        {kpis.map(k=>(
          <div key={k.label} style={{background:k.bg,borderRadius:16,border:`1px solid ${k.bdr}`,padding:"18px 20px",position:"relative",overflow:"hidden"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <p style={{fontSize:12,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:"0.6px",margin:0}}>{k.label}</p>
              <span style={{fontSize:22,lineHeight:1}}>{k.icon}</span>
            </div>
            <p style={{fontSize:26,fontWeight:900,color:k.clr,margin:"0 0 4px",letterSpacing:-0.5,lineHeight:1}}>{k.value}</p>
            <p style={{fontSize:12,color:"#64748B",margin:0}}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick stats row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}} className="kpi-grid">
        {[
          {label:"Runway",     val:`~${runway} months`, icon:"⏱",clr:"#0EA5E9"},
          {label:"Burn / mo",  val:fmtK(exp/(monthly.length||1),masked),icon:"🔥",clr:"#EF4444"},
          {label:"Debt load",  val:fmt(loans,masked),   icon:"🏦",clr:"#8B5CF6"},
          {label:"Best month", val:monthly.length?monthly.reduce((a,b)=>b.inc>a.inc?b:a,{inc:0,month:"—"}).month:"—",icon:"🏆",clr:"#059669"},
        ].map(k=>(
          <div key={k.label} style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:26,lineHeight:1}}>{k.icon}</span>
            <div>
              <p style={{fontSize:11,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 2px"}}>{k.label}</p>
              <p style={{fontSize:18,fontWeight:800,color:k.clr,margin:0}}>{k.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Flags row — clickable */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}} className="two-col">
        {[{type:"green",label:"🟢 Green Flags",list:flags.green,bg:"#F0FDF4",bdr:"#BBF7D0",clr:"#166534",dot:"#22C55E"},{type:"red",label:"🔴 Risk Signals",list:flags.red,bg:"#FFF1F2",bdr:"#FECACA",clr:"#7F1D1D",dot:"#EF4444"}].map(f=>(
          <div key={f.type} style={{background:f.bg,borderRadius:14,border:`1px solid ${f.bdr}`,padding:"14px 16px",cursor:"pointer"}} onClick={()=>setFlagModal(f)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <p style={{fontWeight:700,fontSize:14,color:f.clr,margin:0}}>{f.label}</p>
              <span style={{...S.badge,background:f.bdr,color:f.clr,fontSize:11}}>{f.list.length} · Click to expand</span>
            </div>
            {f.list.length===0?<p style={{fontSize:13,color:"#94A3B8",margin:0}}>No signals yet</p>:f.list.slice(0,2).map((item,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-start"}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:f.dot,flexShrink:0,marginTop:5}}/>
                <p style={{fontSize:13,color:f.clr,margin:0,lineHeight:1.5}}>{item}</p>
              </div>
            ))}
            {f.list.length>2&&<p style={{fontSize:12,color:f.clr,margin:"6px 0 0",opacity:0.65}}>+{f.list.length-2} more…</p>}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:14,marginBottom:20}} className="two-col">
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div><p style={{fontWeight:700,fontSize:15,color:"#0F172A",margin:"0 0 2px"}}>Cash Flow Timeline</p><p style={{fontSize:12,color:"#94A3B8",margin:0}}>Monthly income vs expenses</p></div>
            <button onClick={()=>exportCSV(entries,"cashflow.csv")} style={{...S.btnGhost,fontSize:11,padding:"6px 10px"}}>↓ Export</button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthly} margin={{top:5,right:5,left:-20,bottom:0}}>
              <defs>
                <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:"#94A3B8"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:"#94A3B8"}} tickFormatter={v=>masked?"":fmtK(v)} axisLine={false} tickLine={false}/>
              <Tooltip formatter={v=>[masked?"₹ ••••":fmt(v)]} contentStyle={{fontSize:12,borderRadius:10,border:"1px solid #E2E8F0",boxShadow:"0 4px 20px rgba(0,0,0,0.08)"}}/>
              <Area type="monotone" dataKey="inc" stroke="#10B981" strokeWidth={2.5} fill="url(#gInc)" name="Income"/>
              <Area type="monotone" dataKey="exp" stroke="#EF4444" strokeWidth={2.5} fill="url(#gExp)" name="Expenses"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"18px 20px"}}>
          <p style={{fontWeight:700,fontSize:15,color:"#0F172A",margin:"0 0 4px"}}>Expense Breakdown</p>
          <p style={{fontSize:12,color:"#94A3B8",margin:"0 0 12px"}}>By category</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={expCats} cx="50%" cy="50%" outerRadius={72} innerRadius={32} dataKey="value" stroke="none">
                {expCats.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie>
              <Tooltip formatter={v=>[masked?"₹ ••••":fmt(v)]} contentStyle={{fontSize:12,borderRadius:10,border:"1px solid #E2E8F0"}}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:"flex",flexWrap:"wrap",gap:"4px 10px"}}>
            {expCats.slice(0,4).map((e,i)=>(
              <span key={e.name} style={{fontSize:11,color:"#374151",display:"flex",alignItems:"center",gap:4}}>
                <span style={{width:8,height:8,borderRadius:2,background:COLORS[i%COLORS.length],display:"inline-block"}}/>{e.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Business + Channels — 4 columns */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}} className="kpi-grid">
        {bizBreak.map(b=>{const bNet=b.inc-b.exp;return(
          <div key={b.name} style={{background:"#fff",borderRadius:14,border:`1px solid ${BIZ_CLR[b.name]||"#E2E8F0"}30`,padding:"16px 18px",borderTop:`3px solid ${BIZ_CLR[b.name]||"#94A3B8"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <p style={{fontWeight:700,fontSize:14,color:BIZ_CLR[b.name]||"#374151",margin:0}}>{b.name}</p>
              <span style={{...S.badge,background:(BIZ_CLR[b.name]||"#94A3B8")+"22",color:BIZ_CLR[b.name]||"#374151",fontSize:11}}>Business</span>
            </div>
            <p style={{fontSize:20,fontWeight:800,color:bNet>=0?"#059669":"#DC2626",margin:"0 0 4px"}}>{bNet>=0?"+":""}{masked?"••••":fmt(bNet)}</p>
            <div style={{height:4,background:"#F1F5F9",borderRadius:2,overflow:"hidden",marginBottom:6}}>
              <div style={{height:"100%",width:inc>0?pct(b.inc,inc):"0%",background:BIZ_CLR[b.name]||"#94A3B8",borderRadius:2}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#64748B"}}>
              <span>↑{masked?"••":fmt(b.inc)}</span><span>↓{masked?"••":fmt(b.exp)}</span>
            </div>
          </div>
        );})}
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"16px 18px",borderTop:"3px solid #06B6D4"}}>
          <p style={{fontWeight:700,fontSize:13,color:"#64748B",margin:"0 0 10px"}}>Top Expense</p>
          {expCats.slice(0,3).map((e,i)=>(
            <div key={e.name} style={{display:"flex",justifyContent:"space-between",marginBottom:6,alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{width:8,height:8,borderRadius:2,background:COLORS[i%COLORS.length],flexShrink:0}}/>
                <span style={{fontSize:12,color:"#374151",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:100}}>{e.name}</span>
              </div>
              <span style={{fontSize:12,fontWeight:700,color:"#DC2626",flexShrink:0}}>{masked?"••••":fmt(e.value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"18px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div><p style={{fontWeight:700,fontSize:15,color:"#0F172A",margin:"0 0 2px"}}>Recent Transactions</p><p style={{fontSize:12,color:"#94A3B8",margin:0}}>Latest {recentTxns.length} entries</p></div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>exportCSV(recentTxns,"recent.csv")} style={{...S.btnGhost,fontSize:11,padding:"6px 10px"}}>↓ Export</button>
            <button onClick={()=>onTabChange("entries")} style={{...S.btnPrimary,fontSize:12,padding:"7px 14px"}}>See all →</button>
          </div>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:540}}>
            <thead><tr style={{background:"#F8FAFC",borderBottom:"1px solid #E2E8F0"}}><th style={S.th}>Date</th><th style={S.th}>Description</th><th style={S.th}>Business</th><th style={S.th}>Category</th><th style={{...S.th,textAlign:"right"}}>Amount</th><th style={S.th}>Status</th></tr></thead>
            <tbody>
              {recentTxns.map((e,i)=>(
                <tr key={e.id} style={{background:i%2===0?"#fff":"#FAFAFA",transition:"background 0.1s"}} onMouseEnter={ev=>ev.currentTarget.style.background="#F1F5F9"} onMouseLeave={ev=>ev.currentTarget.style.background=i%2===0?"#fff":"#FAFAFA"}>
                  <td style={{...S.td,whiteSpace:"nowrap",color:"#475569"}}>{new Date(e.date+"T12:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}</td>
                  <td style={{...S.td,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={e.description}>{e.description}</td>
                  <td style={S.td}><span style={{...S.badge,background:(BIZ_CLR[e.business]||"#64748B")+"22",color:BIZ_CLR[e.business]||"#64748B",fontSize:11}}>{e.business}</span></td>
                  <td style={{...S.td,fontSize:12,color:"#475569",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.category}</td>
                  <td style={{...S.td,fontWeight:700,color:e.type==="Income"?"#059669":"#DC2626",textAlign:"right",whiteSpace:"nowrap"}}>{e.type==="Income"?"+":"-"}{masked?"••••":getAcct(e.account).cur==="GBP"?`£${e.amount}`:fmt(e.amount)}</td>
                  <td style={S.td}><span style={{...S.badge,background:e.type==="Income"?"#DCFCE7":"#FEE2E2",color:e.type==="Income"?"#166534":"#7F1D1D",fontSize:11}}>{e.type==="Income"?"• Success":"• Expense"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flag detail modal */}
      {flagModal&&(
        <div style={S.overlay} onClick={()=>setFlagModal(null)}>
          <div style={{background:"#fff",borderRadius:18,padding:28,width:"calc(100% - 32px)",maxWidth:480,boxShadow:"0 25px 60px rgba(0,0,0,0.18)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
              <p style={{fontWeight:800,fontSize:18,color:"#0F172A",margin:0}}>{flagModal.label}</p>
              <button onClick={()=>setFlagModal(null)} style={S.closeBtn}>✕</button>
            </div>
            {flagModal.list.length===0?<p style={{color:"#94A3B8",fontSize:14}}>No signals at this time.</p>:flagModal.list.map((item,i)=>(
              <div key={i} style={{display:"flex",gap:12,marginBottom:14,padding:"12px 14px",background:flagModal.type==="green"?"#F0FDF4":"#FFF1F2",borderRadius:10,alignItems:"flex-start"}}>
                <span style={{fontSize:16,flexShrink:0}}>{flagModal.type==="green"?"✅":"⚠️"}</span>
                <p style={{fontSize:14,color:flagModal.type==="green"?"#166534":"#7F1D1D",margin:0,lineHeight:1.6}}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  AI CFO  —  3 modes: Quick · Weekly · Monthly
// ═══════════════════════════════════════════════════════════════════════════════
function AIInsightsTab({entries,channels,fxRate,apiKey,onSetApiKey}){
  const masked=useMask();
  const [mode,setMode]=useState("weekly");
  const [loading,setLoad]=useState(false);
  const [result,setResult]=useState(null);
  const [error,setError]=useState(null);
  const [keyInput,setKI]=useState(apiKey||"");
  const [saving,setSaving]=useState(false);
  const fe=useCallback(e=>fxAmt(e,fxRate),[fxRate]);
  const MODES={quick:{label:"⚡ Quick Check",desc:"Daily 30-sec brief",clr:"#059669"},weekly:{label:"📊 Weekly Review",desc:"Trends & focus areas",clr:"#4F46E5"},monthly:{label:"🧠 Monthly Analysis",desc:"Full CFO report",clr:"#7C3AED"}};
  const buildPrompt=useCallback(()=>{
    const inc=entries.filter(e=>e.type==="Income").reduce((s,e)=>s+fe(e),0);
    const exp=entries.filter(e=>e.type==="Expense").reduce((s,e)=>s+fe(e),0);
    const opRev=entries.filter(e=>e.type==="Income"&&OP_CATS.includes(e.category)).reduce((s,e)=>s+fe(e),0);
    const loans=entries.filter(e=>["Business Loan Received","Investment / Loan Received"].includes(e.category)).reduce((s,e)=>s+fe(e),0);
    const monthly=MONTHS.map((m,i)=>({month:m,inc:entries.filter(e=>e.type==="Income"&&getMonth(e.date)===i).reduce((s,e)=>s+fe(e),0),exp:entries.filter(e=>e.type==="Expense"&&getMonth(e.date)===i).reduce((s,e)=>s+fe(e),0)})).filter(m=>m.inc>0||m.exp>0);
    const ec={};entries.filter(e=>e.type==="Expense").forEach(e=>{ec[e.category]=(ec[e.category]||0)+fe(e);});
    const topExp=Object.entries(ec).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>`${k}:Rs${Math.round(v/1000)}k`).join(", ");
    const base=`Founder:Shailen. Businesses: Nutrolis(supplements D2C), Migrizo(UK immigration consulting), Assignment.
In=Rs${Math.round(inc/1000)}k|Exp=Rs${Math.round(exp/1000)}k|Net=Rs${Math.round((inc-exp)/1000)}k|OpRev=Rs${Math.round(opRev/1000)}k|Debt=Rs${Math.round(loans/1000)}k
Monthly:${monthly.map(m=>`${m.month}(In:Rs${Math.round(m.inc/1000)}k,Exp:Rs${Math.round(m.exp/1000)}k)`).join(" ")}|TopExp:${topExp}`;
    if(mode==="quick")return`${base}\nCFO quick daily brief. SHORT. Return ONLY valid JSON:\n{"status":"green|yellow|red","headline":"under 10 words","focus":["point","point","point"],"watch":["risk","risk"],"win":"one positive"}`;
    if(mode==="weekly")return`${base}\nCFO weekly review. Specific. Return ONLY valid JSON:\n{"headline":"punchy","trend":"improving|stable|declining","highlights":["insight with numbers","insight","insight"],"actions":["this week","this week","this week"],"metric":{"label":"key metric","value":"X","target":"Y"}}`;
    return`${base}\nCFO monthly analysis. Return ONLY valid JSON:\n{"score":72,"grade":"B+","headline":"sentence","insights":[{"title":"t","body":"b","type":"warning|success|info"}],"recommendations":[{"title":"t","action":"a","priority":"high|medium|low"}],"plan":[{"week":"Week 1-2","action":"a","goal":"g"},{"week":"Month 2","action":"a","goal":"g"},{"week":"Month 3","action":"a","goal":"g"}]}`;
  },[entries,fxRate,fe,mode]);
  const generate=async()=>{
    const key=keyInput.trim();if(!key){setError("Please enter your Claude API key first.");return;}
    setLoad(true);setError(null);setResult(null);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:1500,messages:[{role:"user",content:buildPrompt()}]})});
      if(!res.ok){const e=await res.json();throw new Error(e.error?.message||"API error");}
      const data=await res.json();
      const raw=data.content[0].text;
      const jsonMatch=raw.match(/\{[\s\S]*\}/);
      if(!jsonMatch)throw new Error("Could not parse response");
      setResult({mode,data:JSON.parse(jsonMatch[0])});
      if(key!==apiKey)onSetApiKey(key);
    }catch(e){setError(e.message);}
    finally{setLoad(false);}
  };
  const saveKey=async()=>{setSaving(true);await dbSetting("claude_key",keyInput.trim());onSetApiKey(keyInput.trim());setSaving(false);};
  const sClr={green:"#059669",yellow:"#B45309",red:"#DC2626"};
  const pClr={high:"#EF4444",medium:"#F59E0B",low:"#10B981"};
  const iClr={warning:["#FFFBEB","#FDE68A","#92400E"],success:["#F0FDF4","#BBF7D0","#166534"],info:["#EFF6FF","#BFDBFE","#1e40af"]};
  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {Object.entries(MODES).map(([k,v])=>(
          <button key={k} onClick={()=>{setMode(k);setResult(null);}} style={{padding:"10px 20px",borderRadius:12,border:mode===k?`2px solid ${v.clr}`:"1px solid #E2E8F0",background:mode===k?v.clr+"18":"#fff",color:mode===k?v.clr:"#64748B",fontWeight:mode===k?700:500,cursor:"pointer",fontSize:13}}>
            <div style={{fontWeight:700}}>{v.label}</div><div style={{fontSize:11,opacity:0.65,marginTop:1}}>{v.desc}</div>
          </button>
        ))}
      </div>
      {!apiKey&&(<div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:14,padding:18,marginBottom:20}}>
        <p style={{fontWeight:700,fontSize:14,color:"#92400E",margin:"0 0 6px"}}>🔑 Enter Claude API Key</p>
        <p style={{fontSize:13,color:"#78350F",margin:"0 0 12px"}}>Get free at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{color:"#4F46E5"}}>console.anthropic.com</a> → API Keys → Create Key</p>
        <div style={{display:"flex",gap:8}}><input value={keyInput} onChange={e=>setKI(e.target.value)} placeholder="sk-ant-api03-…" style={{...S.input,flex:1,fontFamily:"monospace",fontSize:12}} type="password"/><button onClick={saveKey} disabled={saving||!keyInput} style={S.btnPrimary}>{saving?"Saving…":"Save Key"}</button></div>
      </div>)}
      {!result&&(<div style={{background:"#fff",borderRadius:16,border:"1px solid #E2E8F0",padding:"50px 24px",textAlign:"center"}}>
        <div style={{fontSize:44,marginBottom:14}}>{MODES[mode].label.split(" ")[0]}</div>
        <p style={{fontSize:20,fontWeight:800,color:"#0F172A",margin:"0 0 8px"}}>{MODES[mode].label}</p>
        <p style={{fontSize:14,color:"#64748B",margin:"0 0 28px",lineHeight:1.6,maxWidth:400,marginLeft:"auto",marginRight:"auto"}}>{MODES[mode].desc} · {entries.length} transactions analysed</p>
        {error&&<p style={{color:"#EF4444",fontSize:13,marginBottom:16}}>{error}</p>}
        {loading?(<div><div style={{width:40,height:40,border:"4px solid #E2E8F0",borderTop:`4px solid ${MODES[mode].clr}`,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 12px"}}/><p style={{color:"#64748B",fontSize:14}}>Thinking like your CFO…</p></div>):
        (<button onClick={generate} disabled={!apiKey&&!keyInput} style={{padding:"14px 36px",background:MODES[mode].clr,color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer"}}>Generate {MODES[mode].label}</button>)}
        {apiKey&&<div style={{marginTop:20,display:"flex",gap:8,maxWidth:380,margin:"20px auto 0"}}><input value={keyInput} onChange={e=>setKI(e.target.value)} placeholder="Update API key…" style={{...S.input,flex:1,fontSize:12,fontFamily:"monospace"}} type="password"/><button onClick={saveKey} style={{...S.btnGhost,fontSize:12}}>Update</button></div>}
      </div>)}
      {result&&result.mode==="quick"&&(<div>
        <div style={{background:sClr[result.data.status]+"12",border:`1px solid ${sClr[result.data.status]}40`,borderRadius:14,padding:"16px 20px",marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:28}}>{result.data.status==="green"?"🟢":result.data.status==="yellow"?"🟡":"🔴"}</span>
          <p style={{fontWeight:800,fontSize:18,color:"#0F172A",margin:0}}>{result.data.headline}</p>
        </div>
        {result.data.win&&<div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#166534",fontWeight:600}}>🏆 {result.data.win}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}} className="two-col">
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"14px 16px"}}><p style={{fontWeight:700,color:"#166534",margin:"0 0 10px",fontSize:13}}>✅ Focus Today</p>{result.data.focus?.map((f,i)=><p key={i} style={{fontSize:13,color:"#374151",margin:"0 0 8px",paddingLeft:12,borderLeft:"3px solid #22C55E",lineHeight:1.4}}>→ {f}</p>)}</div>
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"14px 16px"}}><p style={{fontWeight:700,color:"#7F1D1D",margin:"0 0 10px",fontSize:13}}>👀 Watch</p>{result.data.watch?.map((f,i)=><p key={i} style={{fontSize:13,color:"#374151",margin:"0 0 8px",paddingLeft:12,borderLeft:"3px solid #EF4444",lineHeight:1.4}}>⚠ {f}</p>)}</div>
        </div>
        <button onClick={()=>setResult(null)} style={{...S.btnGhost,width:"100%"}}>↻ Regenerate</button>
      </div>)}
      {result&&result.mode==="weekly"&&(<div>
        <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:14,padding:"14px 18px",marginBottom:14}}>
          <p style={{fontWeight:800,fontSize:16,color:"#0F172A",margin:"0 0 6px"}}>{result.data.headline}</p>
          <span style={{...S.badge,background:result.data.trend==="improving"?"#DCFCE7":result.data.trend==="declining"?"#FEE2E2":"#EEF2FF",color:result.data.trend==="improving"?"#166534":result.data.trend==="declining"?"#7F1D1D":"#4F46E5"}}>Trend: {result.data.trend}</span>
        </div>
        {result.data.metric&&<div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"14px 18px",marginBottom:14,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
          <div><p style={{fontSize:11,color:"#64748B",fontWeight:700,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:1}}>{result.data.metric.label}</p><p style={{fontSize:28,fontWeight:900,color:"#4F46E5",margin:0}}>{masked?"••••":result.data.metric.value}</p></div>
          <div style={{fontSize:13,color:"#64748B"}}>Target: <b>{result.data.metric.target}</b></div>
        </div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}} className="two-col">
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"14px 16px"}}><p style={{fontWeight:700,color:"#1E293B",margin:"0 0 12px",fontSize:13}}>📊 Highlights</p>{result.data.highlights?.map((h,i)=><p key={i} style={{fontSize:13,color:"#374151",margin:"0 0 10px",lineHeight:1.5,paddingLeft:12,borderLeft:"3px solid #6366F1"}}>→ {h}</p>)}</div>
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"14px 16px"}}><p style={{fontWeight:700,color:"#1E293B",margin:"0 0 12px",fontSize:13}}>⚡ This Week</p>{result.data.actions?.map((a,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:10,alignItems:"flex-start"}}><span style={{...S.badge,background:["#EEF2FF","#F0FDF4","#FFFBEB"][i%3],color:["#4F46E5","#059669","#B45309"][i%3],fontSize:11,flexShrink:0}}>{i+1}</span><p style={{fontSize:13,color:"#374151",margin:0,lineHeight:1.5}}>{a}</p></div>)}</div>
        </div>
        <button onClick={()=>setResult(null)} style={{...S.btnGhost,width:"100%"}}>↻ Regenerate</button>
      </div>)}
      {result&&result.mode==="monthly"&&(<div>
        <div style={{background:"linear-gradient(135deg,#1e1b4b,#312e81)",borderRadius:16,padding:"24px 28px",marginBottom:20,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
          <svg width={100} height={100} viewBox="0 0 100 100"><circle cx={50} cy={50} r={42} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={8}/><circle cx={50} cy={50} r={42} fill="none" stroke={result.data.score>=70?"#22C55E":result.data.score>=50?"#F59E0B":"#EF4444"} strokeWidth={8} strokeDasharray={`${(result.data.score/100)*264} 264`} strokeLinecap="round" transform="rotate(-90 50 50)"/><text x={50} y={46} textAnchor="middle" fill="#fff" fontSize={24} fontWeight={800}>{result.data.score}</text><text x={50} y={62} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={11}>/100</text></svg>
          <div style={{flex:1}}><p style={{color:"rgba(255,255,255,0.5)",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,margin:"0 0 4px"}}>Financial Health</p><p style={{color:"#fff",fontSize:24,fontWeight:900,margin:"0 0 6px"}}>{result.data.grade}</p><p style={{color:"rgba(255,255,255,0.75)",fontSize:14,margin:0,lineHeight:1.5}}>{result.data.headline}</p></div>
          <button onClick={()=>setResult(null)} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:8,padding:"8px 14px",color:"#fff",fontSize:12,cursor:"pointer"}}>↻ Refresh</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}} className="two-col">
          {result.data.insights?.map((ins,i)=>{const[bg,bdr,txt]=iClr[ins.type]||iClr.info;return(<div key={i} style={{background:bg,border:`1px solid ${bdr}`,borderRadius:12,padding:"14px 16px"}}><p style={{fontWeight:700,fontSize:14,color:txt,margin:"0 0 6px"}}>{ins.title}</p><p style={{fontSize:13,color:txt,margin:0,lineHeight:1.5,opacity:0.85}}>{ins.body}</p></div>);})}
        </div>
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:0,overflow:"hidden",marginBottom:16}}>
          <p style={{fontSize:15,fontWeight:700,color:"#0F172A",padding:"14px 16px 0",margin:0}}>Action Items</p>
          {result.data.recommendations?.map((r,i)=>(<div key={i} style={{display:"flex",gap:12,padding:"12px 16px",borderTop:"1px solid #F1F5F9",alignItems:"flex-start"}}><div style={{width:8,height:8,borderRadius:"50%",background:pClr[r.priority]||"#94A3B8",marginTop:5,flexShrink:0}}/><div style={{flex:1}}><p style={{fontWeight:700,fontSize:14,color:"#0F172A",margin:"0 0 2px"}}>{r.title}</p><p style={{fontSize:13,color:"#475569",margin:0,lineHeight:1.5}}>{r.action}</p></div><span style={{fontSize:11,fontWeight:700,color:pClr[r.priority]||"#94A3B8",textTransform:"uppercase",flexShrink:0}}>{r.priority}</span></div>))}
        </div>
        {result.data.plan&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}} className="three-col">{result.data.plan.map((step,i)=>(<div key={i} style={{background:"#fff",borderRadius:12,border:"1px solid #E2E8F0",padding:"14px 16px",borderLeft:`4px solid ${COLORS[i%COLORS.length]}`}}><p style={{fontWeight:700,fontSize:12,color:COLORS[i%COLORS.length],margin:"0 0 6px"}}>{step.week}</p><p style={{fontWeight:600,fontSize:14,color:"#0F172A",margin:"0 0 4px"}}>{step.action}</p><p style={{fontSize:12,color:"#64748B",margin:0,lineHeight:1.4}}>🎯 {step.goal}</p></div>))}</div>}
      </div>)}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ENTRIES TAB  —  Search · Filters · Pagination · Export everywhere
// ═══════════════════════════════════════════════════════════════════════════════
function EntriesTab({entries,fxRate,onEdit,onDelete,filterAccount}){
  const masked=useMask();
  const fe=useCallback(e=>fxAmt(e,fxRate),[fxRate]);
  const [bizF,setBizF]=useState("All");
  const [typF,setTypF]=useState("All");
  const [accF,setAccF]=useState(filterAccount||"All");
  const [search,setSearch]=useState("");
  const [dateFrom,setDateFrom]=useState("");
  const [dateTo,setDateTo]=useState("");
  const [page,setPage]=useState(1);

  useEffect(()=>{if(filterAccount&&filterAccount!=="All"){setAccF(filterAccount);setPage(1);}},[filterAccount]);

  const rows=useMemo(()=>entries.filter(e=>
    (bizF==="All"||e.business===bizF)&&
    (typF==="All"||e.type===typF)&&
    (accF==="All"||e.account===accF)&&
    (!search||e.description?.toLowerCase().includes(search.toLowerCase())||e.category?.toLowerCase().includes(search.toLowerCase()))&&
    (!dateFrom||e.date>=dateFrom)&&(!dateTo||e.date<=dateTo)
  ).sort((a,b)=>b.date.localeCompare(a.date)),[entries,bizF,typF,accF,search,dateFrom,dateTo]);

  const totIn =rows.filter(r=>r.type==="Income").reduce((s,e)=>s+fe(e),0);
  const totOut=rows.filter(r=>r.type==="Expense").reduce((s,e)=>s+fe(e),0);
  const pageCount=Math.ceil(rows.length/PER_PAGE);
  const pageRows=rows.slice((page-1)*PER_PAGE,page*PER_PAGE);
  const resetFilters=()=>{setBizF("All");setTypF("All");setAccF("All");setSearch("");setDateFrom("");setDateTo("");setPage(1);};
  const hasFilters=bizF!=="All"||typF!=="All"||accF!=="All"||search||dateFrom||dateTo;

  return(
    <div>
      {/* Search + date row */}
      <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"14px 16px",marginBottom:12}}>
        <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="🔍 Search description, category…" style={{...S.input,flex:1,minWidth:180,padding:"9px 12px",fontSize:13}}/>
          <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1);}} style={{...S.input,width:"auto",padding:"9px 10px",fontSize:13}} title="From date"/>
          <span style={{display:"flex",alignItems:"center",color:"#94A3B8",fontSize:12}}>to</span>
          <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setPage(1);}} style={{...S.input,width:"auto",padding:"9px 10px",fontSize:13}} title="To date"/>
          {hasFilters&&<button onClick={resetFilters} style={{padding:"9px 12px",background:"#FEE2E2",border:"none",borderRadius:8,fontSize:12,color:"#DC2626",cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>✕ Clear</button>}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:12,fontWeight:600,color:"#64748B"}}>Biz:</span>
          {["All",...BUSINESSES].map(b=><button key={b} onClick={()=>{setBizF(b);setPage(1);}} style={{padding:"5px 12px",borderRadius:20,fontSize:12,cursor:"pointer",border:bizF===b?`1.5px solid ${BIZ_CLR[b]||"#4F46E5"}`:"1px solid #E2E8F0",background:bizF===b?(BIZ_CLR[b]||"#4F46E5")+"20":"#fff",color:bizF===b?BIZ_CLR[b]||"#4F46E5":"#4B5563",fontWeight:bizF===b?700:400}}>{b}</button>)}
          <div style={{width:1,height:16,background:"#E2E8F0",margin:"0 2px"}}/>
          <span style={{fontSize:12,fontWeight:600,color:"#64748B"}}>Type:</span>
          {["All","Income","Expense"].map(t=><button key={t} onClick={()=>{setTypF(t);setPage(1);}} style={{padding:"5px 12px",borderRadius:20,fontSize:12,cursor:"pointer",border:typF===t?`1.5px solid ${t==="Income"?"#059669":t==="Expense"?"#DC2626":"#4F46E5"}`:"1px solid #E2E8F0",background:typF===t?(t==="Income"?"#DCFCE7":t==="Expense"?"#FEE2E2":"#EEF2FF"):"#fff",color:typF===t?(t==="Income"?"#166534":t==="Expense"?"#7F1D1D":"#4F46E5"):"#4B5563",fontWeight:typF===t?700:400}}>{t}</button>)}
          <div style={{width:1,height:16,background:"#E2E8F0",margin:"0 2px"}}/>
          <span style={{fontSize:12,fontWeight:600,color:"#64748B"}}>Account:</span>
          {["All",...ACCOUNTS.map(a=>a.id)].map(id=>{const a=id==="All"?{id:"All",short:"All",clr:"#4F46E5"}:getAcct(id);return(<button key={id} onClick={()=>{setAccF(id);setPage(1);}} style={{padding:"5px 12px",borderRadius:20,fontSize:12,cursor:"pointer",border:accF===id?`1.5px solid ${a.clr}`:"1px solid #E2E8F0",background:accF===id?a.clr+"20":"#fff",color:accF===id?a.clr:"#4B5563",fontWeight:accF===id?700:400}}>{a.short||a.label||id}</button>);})}
        </div>
      </div>

      {/* Summary + export */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
          <span style={{fontSize:13,color:"#64748B",fontWeight:600}}>{rows.length} entries</span>
          <span style={{fontSize:13,color:"#059669",fontWeight:700}}>↑ {masked?"••••":fmt(totIn)}</span>
          <span style={{fontSize:13,color:"#DC2626",fontWeight:700}}>↓ {masked?"••••":fmt(totOut)}</span>
          <span style={{fontSize:13,color:"#4F46E5",fontWeight:700}}>Net: {masked?"••••":fmt(totIn-totOut)}</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>exportCSV(rows,`entries${dateFrom?"-"+dateFrom:""}.csv`)} style={{...S.btnGhost,fontSize:12,padding:"7px 12px"}}>↓ CSV</button>
          <button onClick={()=>exportXLSX(rows,`entries${dateFrom?"-"+dateFrom:""}.xlsx`)} style={{...S.btnPrimary,fontSize:12,padding:"7px 12px"}}>↓ Excel</button>
        </div>
      </div>

      {/* Table */}
      <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:640}}>
          <thead>
            <tr style={{background:"#F8FAFC",borderBottom:"1px solid #E2E8F0"}}>
              <th style={S.th}>Date</th><th style={S.th}>Business</th><th style={S.th}>Account</th><th style={S.th}>Type</th><th style={S.th}>Category</th><th style={S.th}>Description</th><th style={{...S.th,textAlign:"right"}}>Amount</th><th style={S.th}/>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((e,i)=>{const a=getAcct(e.account);return(
              <tr key={e.id} style={{background:i%2===0?"#fff":"#FAFAFA",transition:"background 0.1s"}} onMouseEnter={ev=>ev.currentTarget.style.background="#F1F5F9"} onMouseLeave={ev=>ev.currentTarget.style.background=i%2===0?"#fff":"#FAFAFA"}>
                <td style={{...S.td,whiteSpace:"nowrap",color:"#475569"}}>{new Date(e.date+"T12:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"2-digit"})}</td>
                <td style={S.td}><span style={{...S.badge,background:(BIZ_CLR[e.business]||"#64748B")+"22",color:BIZ_CLR[e.business]||"#64748B",fontSize:11}}>{e.business}</span></td>
                <td style={S.td}><span style={{...S.badge,background:a.clr+"22",color:a.clr,fontSize:11}}>{a.short}</span></td>
                <td style={S.td}><span style={{...S.badge,background:e.type==="Income"?"#DCFCE7":"#FEE2E2",color:e.type==="Income"?"#166534":"#7F1D1D",fontSize:11}}>{e.type}</span></td>
                <td style={{...S.td,fontSize:12,maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.category}</td>
                <td style={{...S.td,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:13}} title={e.description}>{e.description}</td>
                <td style={{...S.td,fontWeight:700,color:e.type==="Income"?"#059669":"#DC2626",textAlign:"right",whiteSpace:"nowrap"}}>{e.type==="Income"?"+":"-"}{masked?"••••":a.cur==="GBP"?`£${e.amount.toLocaleString()}`:fmt(e.amount)}</td>
                <td style={{...S.td,whiteSpace:"nowrap"}}>
                  <button onClick={()=>onEdit(e)} style={{...S.smBtn,color:"#4F46E5",marginRight:4}}>Edit</button>
                  <button onClick={()=>onDelete(e.id)} style={{...S.smBtn,color:"#EF4444",background:"#FEF2F2"}}>Del</button>
                </td>
              </tr>
            );})}
            {pageRows.length===0&&<tr><td colSpan={8} style={{...S.td,textAlign:"center",padding:48,color:"#94A3B8",fontSize:14}}>No entries match the filters.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount>1&&(
        <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:14,alignItems:"center",flexWrap:"wrap"}}>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{...S.smBtn,padding:"7px 13px",color:page===1?"#CBD5E1":"#4F46E5"}}>←</button>
          {Array.from({length:Math.min(pageCount,7)},(_,i)=>{const p=pageCount<=7?i+1:page<=4?i+1:page>=pageCount-3?pageCount-6+i:page-3+i;return(<button key={p} onClick={()=>setPage(p)} style={{...S.smBtn,padding:"7px 13px",background:page===p?"#4F46E5":"#F1F5F9",color:page===p?"#fff":"#374151",fontWeight:page===p?700:400}}>{p}</button>);}).filter(Boolean)}
          <button onClick={()=>setPage(p=>Math.min(pageCount,p+1))} disabled={page===pageCount} style={{...S.smBtn,padding:"7px 13px",color:page===pageCount?"#CBD5E1":"#4F46E5"}}>→</button>
          <span style={{fontSize:12,color:"#94A3B8",marginLeft:4}}>Page {page} of {pageCount} · {rows.length} entries</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ACCOUNTS TAB  —  Clickable cards, per-account ledger, import button
// ═══════════════════════════════════════════════════════════════════════════════
function AccountsTab({entries,fxRate,onEdit,onDelete,onImport,onViewEntries}){
  const masked=useMask();
  const [acctId,setAcctId]=useState(null); // null = show all cards

  const acctStats=useMemo(()=>ACCOUNTS.map(a=>{
    const rows=entries.filter(e=>e.account===a.id);
    const inc=rows.filter(e=>e.type==="Income").reduce((s,e)=>s+e.amount,0);
    const exp=rows.filter(e=>e.type==="Expense").reduce((s,e)=>s+e.amount,0);
    return{...a,inc,exp,net:inc-exp,count:rows.length,rows};
  }),[entries]);

  if(!acctId){
    return(
      <div>
        <p style={{fontSize:16,fontWeight:700,color:"#0F172A",margin:"0 0 6px"}}>Bank Accounts</p>
        <p style={{fontSize:13,color:"#64748B",margin:"0 0 20px"}}>Click any account to view its transactions and import statements</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}} className="three-col">
          {acctStats.map(a=>(
            <div key={a.id} onClick={()=>setAcctId(a.id)} style={{background:"#fff",borderRadius:16,border:`2px solid ${a.clr}30`,padding:"22px 24px",cursor:"pointer",transition:"all 0.15s",position:"relative",overflow:"hidden"}} onMouseEnter={e=>{e.currentTarget.style.border=`2px solid ${a.clr}`;e.currentTarget.style.boxShadow=`0 8px 24px ${a.clr}20`;}} onMouseLeave={e=>{e.currentTarget.style.border=`2px solid ${a.clr}30`;e.currentTarget.style.boxShadow="none";}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div>
                  <span style={{...S.badge,background:a.cur==="GBP"?"#DBEAFE":"#F0FDF4",color:a.cur==="GBP"?"#1e40af":"#166534",fontSize:11,marginBottom:8,display:"inline-block"}}>{a.cur}</span>
                  <p style={{fontSize:17,fontWeight:800,color:a.clr,margin:0}}>{a.label}</p>
                </div>
                <span style={{fontSize:28,lineHeight:1}}>🏦</span>
              </div>
              <p style={{fontSize:30,fontWeight:900,color:a.net>=0?"#059669":"#DC2626",margin:"0 0 4px",letterSpacing:-1}}>{fmtCur(a.net,a.cur,masked)}</p>
              <p style={{fontSize:13,color:"#64748B",margin:"0 0 16px"}}>Net Balance · {a.count} entries</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div style={{background:a.clr+"10",borderRadius:10,padding:"8px 12px"}}>
                  <p style={{fontSize:11,color:"#64748B",margin:"0 0 2px",fontWeight:600}}>IN</p>
                  <p style={{fontSize:14,fontWeight:700,color:"#059669",margin:0}}>{fmtCur(a.inc,a.cur,masked)}</p>
                </div>
                <div style={{background:"#FEE2E210",borderRadius:10,padding:"8px 12px"}}>
                  <p style={{fontSize:11,color:"#64748B",margin:"0 0 2px",fontWeight:600}}>OUT</p>
                  <p style={{fontSize:14,fontWeight:700,color:"#DC2626",margin:0}}>{fmtCur(a.exp,a.cur,masked)}</p>
                </div>
              </div>
              <div style={{marginTop:14,display:"flex",gap:8}}>
                <button onClick={e=>{e.stopPropagation();onImport(a.id);}} style={{flex:1,padding:"8px",background:a.clr,color:"#fff",border:"none",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:600}}>📥 Import</button>
                <button onClick={e=>{e.stopPropagation();onViewEntries(a.id);}} style={{flex:1,padding:"8px",background:"#F1F5F9",color:"#374151",border:"none",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:500}}>View All →</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Account detail view
  const a=acctStats.find(x=>x.id===acctId);
  return(
    <div>
      <button onClick={()=>setAcctId(null)} style={{...S.btnGhost,marginBottom:16,display:"flex",alignItems:"center",gap:6,fontSize:13}}>← All Accounts</button>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}} className="three-col">
        {[["Total In",fmtCur(a.inc,a.cur,masked),"#059669","#F0FDF4","#BBF7D0"],["Total Out",fmtCur(a.exp,a.cur,masked),"#DC2626","#FFF1F2","#FECACA"],["Net Balance",fmtCur(a.net,a.cur,masked),"#4F46E5","#EEF2FF","#C7D2FE"]].map(([l,v,c,bg,bdr])=>(
          <div key={l} style={{background:bg,borderRadius:14,border:`1px solid ${bdr}`,padding:"16px 18px"}}>
            <p style={{fontSize:11,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:"0.7px",margin:"0 0 6px"}}>{l}</p>
            <p style={{fontSize:22,fontWeight:800,color:c,margin:0}}>{v}</p>
          </div>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <p style={{fontWeight:700,fontSize:15,color:"#0F172A",margin:0}}>{a.label} — {a.rows.length} entries</p>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>exportCSV(a.rows,`${a.id}-statement.csv`)} style={{...S.btnGhost,fontSize:12,padding:"8px 12px"}}>↓ CSV</button>
          <button onClick={()=>exportXLSX(a.rows,`${a.id}-statement.xlsx`)} style={{...S.btnGhost,fontSize:12,padding:"8px 12px"}}>↓ Excel</button>
          <button onClick={()=>onImport(a.id)} style={{...S.btnPrimary,fontSize:13,padding:"9px 16px"}}>📥 Import Statement</button>
        </div>
      </div>
      <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:560}}>
          <thead><tr style={{background:"#F8FAFC",borderBottom:"1px solid #E2E8F0"}}><th style={S.th}>Date</th><th style={S.th}>Business</th><th style={S.th}>Type</th><th style={S.th}>Category</th><th style={S.th}>Description</th><th style={{...S.th,textAlign:"right"}}>Amount</th><th style={S.th}/></tr></thead>
          <tbody>
            {a.rows.slice().sort((x,y)=>y.date.localeCompare(x.date)).slice(0,100).map((e,i)=>(
              <tr key={e.id} style={{background:i%2===0?"#fff":"#FAFAFA"}}>
                <td style={{...S.td,whiteSpace:"nowrap",color:"#475569"}}>{new Date(e.date+"T12:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"2-digit"})}</td>
                <td style={S.td}><span style={{...S.badge,background:(BIZ_CLR[e.business]||"#64748B")+"22",color:BIZ_CLR[e.business]||"#64748B",fontSize:11}}>{e.business}</span></td>
                <td style={S.td}><span style={{...S.badge,background:e.type==="Income"?"#DCFCE7":"#FEE2E2",color:e.type==="Income"?"#166534":"#7F1D1D",fontSize:11}}>{e.type}</span></td>
                <td style={{...S.td,fontSize:12}}>{e.category}</td>
                <td style={{...S.td,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.description}</td>
                <td style={{...S.td,fontWeight:700,color:e.type==="Income"?"#059669":"#DC2626",textAlign:"right",whiteSpace:"nowrap"}}>{e.type==="Income"?"+":"-"}{masked?"••••":a.cur==="GBP"?`£${e.amount.toLocaleString()}`:fmt(e.amount)}</td>
                <td style={{...S.td,whiteSpace:"nowrap"}}><button onClick={()=>onEdit(e)} style={{...S.smBtn,color:"#4F46E5",marginRight:4}}>Edit</button><button onClick={()=>onDelete(e.id)} style={{...S.smBtn,color:"#EF4444",background:"#FEF2F2"}}>Del</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CHANNELS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function ChannelsTab({entries,channels,fxRate,onEditCh,onDelCh,onAddCh}){
  const masked=useMask();
  const fe=useCallback(e=>fxAmt(e,fxRate),[fxRate]);
  const opRev=useMemo(()=>entries.filter(e=>e.type==="Income"&&OP_CATS.includes(e.category)).reduce((s,e)=>s+fe(e),0),[entries,fe]);
  const chData=useMemo(()=>channels.map(ch=>({...ch,total:entries.filter(e=>e.type==="Income"&&ch.cats.includes(e.category)).reduce((s,e)=>s+fe(e),0),count:entries.filter(e=>ch.cats.includes(e.category)).length})),[channels,entries,fe]);
  const incCats=useMemo(()=>{const m={};entries.filter(e=>e.type==="Income").forEach(e=>{m[e.category]=(m[e.category]||0)+fe(e);});return Object.entries(m).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);},[entries,fe]);
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div><p style={{fontWeight:800,fontSize:16,margin:"0 0 2px",color:"#0F172A"}}>Income Channels</p><p style={{fontSize:13,color:"#64748B",margin:0}}>Revenue by source · auto-totals from entry categories</p></div>
        <button onClick={onAddCh} style={S.btnPrimary}>+ Add Channel</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}} className="three-col">
        {chData.map(ch=>(
          <div key={ch.id} style={{background:ch.bg,borderRadius:16,border:`1px solid ${ch.clr}30`,padding:"18px 20px",borderTop:`3px solid ${ch.clr}`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <div><p style={{fontWeight:700,fontSize:16,color:ch.clr,margin:"0 0 4px"}}>{ch.name}</p><span style={{...S.badge,fontSize:11}}>{ch.biz}</span></div>
              <div style={{display:"flex",gap:4}}><button onClick={()=>onEditCh(ch)} style={{...S.smBtn,color:"#4F46E5"}}>Edit</button><button onClick={()=>onDelCh(ch.id)} style={{...S.smBtn,color:"#EF4444",background:"#FEF2F2"}}>Del</button></div>
            </div>
            <p style={{fontSize:28,fontWeight:800,color:ch.clr,margin:"0 0 4px"}}>{masked?"₹ ••••":fmt(ch.total)}</p>
            <p style={{fontSize:12,color:"#64748B",margin:"0 0 10px"}}>{ch.count} txns · {pct(ch.total,opRev)} of revenue</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{(ch.cats||[]).map(c=><span key={c} style={{fontSize:11,background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:"2px 8px",color:"#475569"}}>{c}</span>)}</div>
          </div>
        ))}
      </div>
      <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"18px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <p style={{fontWeight:700,fontSize:15,color:"#0F172A",margin:0}}>Income by Category</p>
          <button onClick={()=>exportCSV(entries.filter(e=>e.type==="Income"),"income.csv")} style={{...S.btnGhost,fontSize:12,padding:"6px 12px"}}>↓ Export</button>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:360}}>
            <thead><tr style={{background:"#F8FAFC",borderBottom:"1px solid #E2E8F0"}}><th style={S.th}>Category</th><th style={{...S.th,textAlign:"right"}}>Total</th><th style={{...S.th,textAlign:"right"}}>Share</th></tr></thead>
            <tbody>
              {incCats.map((c,i)=>(
                <tr key={c.name} style={{background:i%2===0?"#fff":"#FAFAFA"}}>
                  <td style={{...S.td,display:"flex",alignItems:"center",gap:8}}><span style={{width:8,height:8,borderRadius:2,background:COLORS[i%COLORS.length],flexShrink:0}}/>{c.name}</td>
                  <td style={{...S.td,textAlign:"right",color:"#059669",fontWeight:700}}>{masked?"••••":fmt(c.value)}</td>
                  <td style={{...S.td,textAlign:"right"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end"}}>
                      <div style={{width:60,height:5,borderRadius:4,background:"#F1F5F9",overflow:"hidden"}}><div style={{width:pct(c.value,incCats.reduce((s,x)=>s+x.value,0)),height:"100%",background:COLORS[i%COLORS.length]}}/></div>
                      <span style={{fontSize:12,color:"#64748B",minWidth:34}}>{pct(c.value,incCats.reduce((s,x)=>s+x.value,0))}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MODALS
// ═══════════════════════════════════════════════════════════════════════════════
function AddEntry({onAdd,onClose}){
  const [date,setDate]=useState(todayStr());
  const [biz,setBiz]=useState("Nutrolis");
  const [acc,setAcc]=useState("lrf");
  const [typ,setTyp]=useState("Income");
  const [cat,setCat]=useState(INC_CATS[0]);
  const [dsc,setDsc]=useState("");
  const [amt,setAmt]=useState("");
  const cats=typ==="Income"?INC_CATS:EXP_CATS;
  const save=async()=>{
    if(!amt||!date||!dsc.trim())return;
    const e={id:Date.now(),date,business:biz,account:acc,type:typ,category:cat,description:dsc,amount:parseFloat(amt),source:"manual"};
    await dbAdd(e);onAdd(e);
  };
  return(
    <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:18,padding:28,width:"calc(100% - 32px)",maxWidth:520,boxShadow:"0 25px 60px rgba(0,0,0,0.18)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><p style={{fontWeight:800,fontSize:18,margin:0,color:"#0F172A"}}>+ New Entry</p><button onClick={onClose} style={S.closeBtn}>✕</button></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
          <div><label style={S.formLabel}>Date</label><input type="date" style={S.input} value={date} onChange={e=>setDate(e.target.value)}/></div>
          <div><label style={S.formLabel}>Business</label><select style={S.select} value={biz} onChange={e=>setBiz(e.target.value)}>{BUSINESSES.map(b=><option key={b}>{b}</option>)}</select></div>
          <div><label style={S.formLabel}>Account</label><select style={S.select} value={acc} onChange={e=>setAcc(e.target.value)}>{ACCOUNTS.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}</select></div>
          <div><label style={S.formLabel}>Type</label><select style={S.select} value={typ} onChange={e=>{setTyp(e.target.value);setCat(e.target.value==="Income"?INC_CATS[0]:EXP_CATS[0]);}}><option>Income</option><option>Expense</option></select></div>
          <div style={{gridColumn:"span 2"}}><label style={S.formLabel}>Category</label><select style={S.select} value={cat} onChange={e=>setCat(e.target.value)}>{cats.map(c=><option key={c}>{c}</option>)}</select></div>
          <div style={{gridColumn:"span 2"}}><label style={S.formLabel}>Description</label><input style={S.input} value={dsc} onChange={e=>setDsc(e.target.value)} onKeyDown={e=>e.key==="Enter"&&save()} placeholder="e.g. Amazon payout week 1"/></div>
          <div><label style={S.formLabel}>Amount ({getAcct(acc).cur==="GBP"?"£":"₹"})</label><input type="number" style={S.input} value={amt} onChange={e=>setAmt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&save()} placeholder="5000"/></div>
          <div style={{display:"flex",alignItems:"flex-end"}}><button onClick={save} style={{...S.btnPrimary,width:"100%",padding:"11px"}}>Add Entry</button></div>
        </div>
      </div>
    </div>
  );
}

function EditModal({entry,onSave,onClose}){
  const [e,setE]=useState({...entry,amount:String(entry.amount)});
  const cats=e.type==="Income"?INC_CATS:EXP_CATS;
  const s=(k,v)=>setE(p=>({...p,[k]:v}));
  return(
    <div style={S.overlay} onClick={ev=>ev.target===ev.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:18,padding:28,width:"calc(100% - 32px)",maxWidth:520,boxShadow:"0 25px 60px rgba(0,0,0,0.18)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><p style={{fontWeight:800,fontSize:18,margin:0,color:"#0F172A"}}>Edit Entry</p><button onClick={onClose} style={S.closeBtn}>✕</button></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
          <div><label style={S.formLabel}>Date</label><input type="date" style={S.input} value={e.date} onChange={ev=>s("date",ev.target.value)}/></div>
          <div><label style={S.formLabel}>Business</label><select style={S.select} value={e.business} onChange={ev=>s("business",ev.target.value)}>{BUSINESSES.map(b=><option key={b}>{b}</option>)}</select></div>
          <div><label style={S.formLabel}>Account</label><select style={S.select} value={e.account} onChange={ev=>s("account",ev.target.value)}>{ACCOUNTS.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}</select></div>
          <div><label style={S.formLabel}>Type</label><select style={S.select} value={e.type} onChange={ev=>{s("type",ev.target.value);s("category",ev.target.value==="Income"?INC_CATS[0]:EXP_CATS[0]);}}><option>Income</option><option>Expense</option></select></div>
          <div style={{gridColumn:"span 2"}}><label style={S.formLabel}>Category</label><select style={S.select} value={e.category} onChange={ev=>s("category",ev.target.value)}>{cats.map(c=><option key={c}>{c}</option>)}</select></div>
          <div style={{gridColumn:"span 2"}}><label style={S.formLabel}>Description</label><input style={S.input} value={e.description} onChange={ev=>s("description",ev.target.value)}/></div>
          <div><label style={S.formLabel}>Amount</label><input type="number" style={S.input} value={e.amount} onChange={ev=>s("amount",ev.target.value)}/></div>
          <div style={{display:"flex",alignItems:"flex-end",gap:8}}><button onClick={onClose} style={{...S.btnGhost,flex:1}}>Cancel</button><button onClick={()=>onSave({...e,amount:parseFloat(e.amount)})} style={{...S.btnPrimary,flex:2}}>Save Changes</button></div>
        </div>
      </div>
    </div>
  );
}

function ChannelModal({ch,onSave,onClose}){
  const [d,setD]=useState(ch?{...ch,cstr:(ch.cats||[]).join(", ")}:{name:"",biz:"Nutrolis",clr:"#6366F1",bg:"#EEF2FF",cstr:""});
  return(
    <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:18,padding:28,width:"calc(100% - 32px)",maxWidth:460,boxShadow:"0 25px 60px rgba(0,0,0,0.18)"}}>
        <p style={{fontWeight:800,fontSize:18,margin:"0 0 20px",color:"#0F172A"}}>{ch?"Edit":"Add"} Channel</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
          <div style={{gridColumn:"span 2"}}><label style={S.formLabel}>Channel Name</label><input style={S.input} value={d.name} onChange={e=>setD(p=>({...p,name:e.target.value}))} placeholder="e.g. Amazon India"/></div>
          <div><label style={S.formLabel}>Business</label><select style={S.select} value={d.biz} onChange={e=>setD(p=>({...p,biz:e.target.value}))}>{BUSINESSES.map(b=><option key={b}>{b}</option>)}</select></div>
          <div><label style={S.formLabel}>Colour</label><input type="color" value={d.clr} onChange={e=>setD(p=>({...p,clr:e.target.value}))} style={{...S.input,padding:4,height:42}}/></div>
          <div style={{gridColumn:"span 2"}}><label style={S.formLabel}>Categories (comma-separated)</label><input style={S.input} value={d.cstr} onChange={e=>setD(p=>({...p,cstr:e.target.value}))} placeholder="Amazon Revenue, Direct Sales"/><p style={{fontSize:12,color:"#94A3B8",marginTop:4}}>Entry categories that count as revenue for this channel</p></div>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={onClose} style={S.btnGhost}>Cancel</button><button onClick={()=>onSave({...(ch||{}),id:ch?.id||Date.now(),name:d.name,biz:d.biz,clr:d.clr,bg:d.bg||"#EEF2FF",cats:d.cstr.split(",").map(s=>s.trim()).filter(Boolean)})} style={S.btnPrimary}>{ch?"Save":"Add Channel"}</button></div>
      </div>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  overlay:     {position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16,overflowY:"auto"},
  badge:       {display:"inline-block",padding:"3px 8px",borderRadius:20,fontSize:12,fontWeight:600,background:"#F1F5F9",color:"#374151"},
  th:          {padding:"10px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:"0.5px",whiteSpace:"nowrap"},
  td:          {padding:"10px 12px",fontSize:13,color:"#374151",borderBottom:"1px solid #F1F5F9"},
  btnPrimary:  {background:"#4F46E5",color:"#fff",border:"none",borderRadius:9,padding:"10px 18px",fontSize:14,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"},
  btnGhost:    {background:"#F1F5F9",color:"#374151",border:"none",borderRadius:9,padding:"10px 18px",fontSize:14,fontWeight:500,cursor:"pointer",whiteSpace:"nowrap"},
  smBtn:       {padding:"4px 10px",fontSize:12,fontWeight:600,background:"#F1F5F9",border:"none",borderRadius:6,cursor:"pointer"},
  closeBtn:    {background:"#F1F5F9",border:"none",borderRadius:8,padding:"7px 13px",cursor:"pointer",fontSize:14,color:"#374151"},
  input:       {width:"100%",padding:"9px 12px",border:"1px solid #CBD5E1",borderRadius:8,fontSize:14,outline:"none",background:"#F8FAFC",color:"#0F172A",boxSizing:"border-box"},
  select:      {width:"100%",padding:"9px 12px",border:"1px solid #CBD5E1",borderRadius:8,fontSize:14,outline:"none",background:"#F8FAFC",color:"#0F172A",boxSizing:"border-box",appearance:"auto"},
  formLabel:   {fontSize:11,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:5},
  importModal: {background:"#fff",borderRadius:18,width:"calc(100% - 32px)",maxWidth:880,maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 25px 60px rgba(0,0,0,0.22)"},
  importHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",borderBottom:"1px solid #E2E8F0"},
  dropZone:    {border:"2px dashed #C7D2FE",borderRadius:16,padding:"44px 24px",textAlign:"center",cursor:"pointer",transition:"all 0.2s",background:"#F8F9FF"},
  dropZoneActive:{border:"2px dashed #4F46E5",background:"#EEF2FF",transform:"scale(1.01)"},
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
const SEED=[{id:1,date:"2026-01-01",business:"Nutrolis",type:"Income",category:"Capital Injection",description:"IFT - Shailendra Kumar",amount:50000,account:"lrf"},{id:2,date:"2026-01-02",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:1753,account:"lrf"},{id:3,date:"2026-01-03",business:"Nutrolis",type:"Income",category:"Amazon Revenue",description:"NEFT - Amazon Seller",amount:2261,account:"lrf"},{id:4,date:"2026-01-04",business:"Nutrolis",type:"Expense",category:"Meta Ads",description:"UPI - Facebook Ads",amount:5000,account:"lrf"},{id:5,date:"2026-01-05",business:"Nutrolis",type:"Income",category:"Capital Injection",description:"IFT - Business Funding",amount:150000,account:"lrf"},{id:6,date:"2026-01-05",business:"Nutrolis",type:"Expense",category:"Procurement",description:"IMPS - Oribite Nutra Science",amount:75000,account:"lrf"},{id:7,date:"2026-01-07",business:"Nutrolis",type:"Expense",category:"Salaries",description:"UPI - Mansi Behal",amount:9667,account:"lrf"},{id:8,date:"2026-01-10",business:"Nutrolis",type:"Income",category:"Amazon Revenue",description:"NEFT - Amazon Seller",amount:4892,account:"lrf"},{id:9,date:"2026-01-14",business:"Nutrolis",type:"Expense",category:"Credit Card Payment",description:"UPI - ICICI Credit Card",amount:10000,account:"lrf"},{id:10,date:"2026-01-23",business:"Nutrolis",type:"Income",category:"Capital Injection",description:"CASH DEPOSIT",amount:400000,account:"lrf"},{id:11,date:"2026-01-27",business:"Nutrolis",type:"Expense",category:"Salaries",description:"IMPS - Bhaskar Manish Jani",amount:35000,account:"lrf"},{id:12,date:"2026-01-31",business:"Nutrolis",type:"Income",category:"Amazon Revenue",description:"NEFT - Amazon Seller",amount:11285,account:"lrf"},{id:13,date:"2026-02-09",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart",amount:9044,account:"lrf"},{id:14,date:"2026-02-14",business:"Nutrolis",type:"Income",category:"Amazon Revenue",description:"NEFT - Amazon Seller",amount:5104,account:"lrf"},{id:15,date:"2026-02-27",business:"Nutrolis",type:"Expense",category:"Salaries",description:"IMPS - Bhaskar Manish Jani",amount:35000,account:"lrf"},{id:16,date:"2026-03-08",business:"Nutrolis",type:"Income",category:"Investment / Loan Received",description:"RTGS - Anurag + Mansi",amount:500000,account:"lrf"},{id:17,date:"2026-03-16",business:"Nutrolis",type:"Income",category:"Business Loan Received",description:"NEFT - Hemlata",amount:1160000,account:"lrf"},{id:18,date:"2026-03-16",business:"Nutrolis",type:"Expense",category:"Credit Card Payment",description:"ICICI Credit Card Full",amount:95403,account:"lrf"},{id:19,date:"2026-03-26",business:"Nutrolis",type:"Expense",category:"Equipment & Office",description:"Croma Electronics",amount:58110,account:"lrf"},{id:20,date:"2026-03-30",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"NEFT - Flipkart Nodal",amount:12022,account:"lrf"},{id:21,date:"2026-04-02",business:"Migrizo",type:"Income",category:"Consultation",description:"Era Paid for GTV Kickstart",amount:500,account:"jeet"},{id:22,date:"2026-04-06",business:"Nutrolis",type:"Income",category:"Flipkart Revenue",description:"FK Revenue",amount:7410,account:"lrf"},{id:23,date:"2026-04-08",business:"Migrizo",type:"Income",category:"Consultation",description:"Sukhdeep Paid for GTV",amount:122000,account:"grownmind"},{id:24,date:"2026-04-08",business:"Assignment",type:"Income",category:"Assignment Payment",description:"Assignment Revenue",amount:20817,account:"grownmind"},{id:25,date:"2026-04-08",business:"Migrizo",type:"Expense",category:"Meta Ads",description:"Migrizo meta ads",amount:2000,account:"lrf"},{id:26,date:"2026-04-10",business:"Migrizo",type:"Income",category:"Migrizo Revenue",description:"Migrizo Consulting",amount:15000,account:"grownmind"},{id:27,date:"2026-02-17",business:"Migrizo",type:"Expense",category:"Professional Services",description:"Jeet charged for services",amount:300,account:"jeet"},{id:28,date:"2026-02-11",business:"Migrizo",type:"Expense",category:"Founder Travel",description:"Jeet advance accommodation",amount:464,account:"jeet"},{id:29,date:"2026-03-17",business:"Migrizo",type:"Income",category:"Consultation",description:"Abhishek GTV consultation",amount:600,account:"jeet"},{id:30,date:"2026-04-02",business:"Migrizo",type:"Income",category:"Consultation",description:"Era paid GTV Kickstart",amount:500,account:"jeet"}];

export default function App(){
  const [authed,setAuthed]=useState(false);
  const [pwd,setPwd]=useState("");
  const [pwdErr,setPwdErr]=useState(false);
  const [loading,setLoading]=useState(false);
  const [dbReady,setDbReady]=useState(false);
  const [entries,setEntries]=useState([]);
  const [channels,setChannels]=useState([]);
  const [fxRate,setFxRate]=useState(122);
  const [fxInput,setFxInput]=useState("122");
  const [apiKey,setApiKey]=useState("");
  const [tab,setTab]=useState("dashboard");
  const [masked,setMasked]=useState(false);
  const [showAdd,setShowAdd]=useState(false);
  const [editE,setEditE]=useState(null);
  const [editCh,setEditCh]=useState(null);
  const [showChModal,setShowChModal]=useState(false);
  const [importAcct,setImportAcct]=useState(null);
  const [filterAcct,setFilterAcct]=useState(null);

  useEffect(()=>{
    if(!authed)return;
    (async()=>{
      setLoading(true);
      try{
        const{error:chk}=await sb.from("ffd_entries").select("id").limit(1);
        if(chk?.code==="42P01"){setDbReady(false);setLoading(false);return;}
        setDbReady(true);
        const{data:ents}=await sb.from("ffd_entries").select("*").order("date",{ascending:false});
        if(ents?.length)setEntries(ents);
        else{for(let i=0;i<SEED.length;i+=50)await sb.from("ffd_entries").insert(SEED.slice(i,i+50));setEntries(SEED);}
        const{data:chs}=await sb.from("ffd_channels").select("*").order("id");
        if(chs?.length)setChannels(chs);else{await sb.from("ffd_channels").insert(DEFAULT_CHANNELS);setChannels(DEFAULT_CHANNELS);}
        const{data:settings}=await sb.from("ffd_settings").select("key,value");
        if(settings){
          const fx=settings.find(s=>s.key==="fx"),ck=settings.find(s=>s.key==="claude_key"),tr=settings.find(s=>s.key==="tag_rules"),mk=settings.find(s=>s.key==="masked");
          if(fx?.value){setFxRate(parseFloat(fx.value));setFxInput(String(parseFloat(fx.value)));}
          if(ck?.value)setApiKey(ck.value);
          if(tr?.value)try{LEARNED_RULES=JSON.parse(JSON.stringify(tr.value));}catch(e){}
          if(mk?.value)setMasked(!!mk.value);
        }
      }catch(e){console.error(e);}
      setLoading(false);
    })();
  },[authed]);

  const netFlow=useMemo(()=>entries.reduce((s,e)=>s+(e.type==="Income"?1:-1)*fxAmt(e,fxRate),0),[entries,fxRate]);

  const onAdd   =e=>{setEntries(p=>[e,...p]);};
  const onEdit  =async e=>{await dbUpdate(e);setEntries(p=>p.map(r=>r.id===e.id?e:r));setEditE(null);};
  const onDelete=async id=>{if(!confirm("Delete this entry?"))return;await dbDelete(id);setEntries(p=>p.filter(r=>r.id!==id));};
  const onSaveCh=async ch=>{await dbAddCh(ch);channels.find(c=>c.id===ch.id)?setChannels(p=>p.map(c=>c.id===ch.id?ch:c)):setChannels(p=>[...p,ch]);setEditCh(null);setShowChModal(false);};
  const onDelCh =async id=>{if(!confirm("Delete channel?"))return;await dbDelCh(id);setChannels(p=>p.filter(c=>c.id!==id));};
  const onImported=rows=>{setEntries(p=>[...rows.map(r=>({id:r.id||Date.now(),date:r.date,business:r.business,account:r.account,type:r.type,category:r.category,description:r.description,amount:r.amount,source:"import"})),...p]);setImportAcct(null);};
  const onFxBlur=async()=>{const v=parseFloat(fxInput);if(v>0){setFxRate(v);await dbSetting("fx",v);}else setFxInput(String(fxRate));};
  const onSetApiKey=async k=>{setApiKey(k);await dbSetting("claude_key",k);};
  const toggleMask=async()=>{const nm=!masked;setMasked(nm);await dbSetting("masked",nm);};
  const onLearn=async rules=>{await dbSetting("tag_rules",rules);};
  const onViewEntries=id=>{setFilterAcct(id);setTab("entries");};

  // ── Login ──
  if(!authed)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#0F172A 0%,#1e1b4b 40%,#312e81 100%)",padding:16}}>
      <div style={{background:"#fff",borderRadius:24,padding:44,width:"100%",maxWidth:400,boxShadow:"0 32px 80px rgba(0,0,0,0.4)",textAlign:"center"}}>
        <div style={{width:64,height:64,background:"linear-gradient(135deg,#4F46E5,#7C3AED)",borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:28}}>📊</div>
        <p style={{fontSize:26,fontWeight:900,color:"#0F172A",margin:"0 0 4px",letterSpacing:-0.5}}>Founder Finance OS</p>
        <p style={{fontSize:14,color:"#64748B",margin:"0 0 32px"}}>Nutrolis · Migrizo · Assignment · Private</p>
        <input type="password" placeholder="Enter password" value={pwd} onChange={e=>{setPwd(e.target.value);setPwdErr(false);}} onKeyDown={e=>e.key==="Enter"&&(pwd===APP_PWD?setAuthed(true):setPwdErr(true))} style={{...S.input,textAlign:"center",letterSpacing:6,fontSize:16,marginBottom:8}} autoFocus/>
        {pwdErr&&<p style={{color:"#EF4444",fontSize:13,margin:"0 0 10px"}}>Incorrect password</p>}
        <button onClick={()=>pwd===APP_PWD?setAuthed(true):setPwdErr(true)} style={{...S.btnPrimary,width:"100%",padding:14,fontSize:15,borderRadius:12,background:"linear-gradient(135deg,#4F46E5,#7C3AED)"}}>Unlock Dashboard →</button>
      </div>
    </div>
  );

  // ── DB setup ──
  if(!dbReady&&!loading)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:"#F8FAFC"}}>
      <div style={{background:"#fff",borderRadius:16,padding:32,maxWidth:600,boxShadow:"0 4px 30px rgba(0,0,0,0.08)"}}>
        <p style={{fontSize:20,fontWeight:800,color:"#0F172A",marginBottom:12}}>⚙️ One-Time Supabase Setup</p>
        <p style={{color:"#475569",marginBottom:16}}>Run this SQL in Supabase → SQL Editor, then reload:</p>
        <pre style={{background:"#1e1b4b",color:"#e0e7ff",padding:16,borderRadius:10,fontSize:12,overflow:"auto",marginBottom:16,lineHeight:1.7}}>{`CREATE TABLE IF NOT EXISTS ffd_entries (id bigint PRIMARY KEY, date text, business text, account text DEFAULT 'lrf', type text, category text, description text, amount numeric, source text DEFAULT 'manual', created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS ffd_channels (id bigint PRIMARY KEY, name text, biz text, clr text DEFAULT '#6366F1', bg text DEFAULT '#EEF2FF', cats jsonb DEFAULT '[]');
CREATE TABLE IF NOT EXISTS ffd_settings (key text PRIMARY KEY, value jsonb);
ALTER TABLE ffd_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ffd_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ffd_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON ffd_entries FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON ffd_channels FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON ffd_settings FOR ALL TO anon USING (true) WITH CHECK (true);`}</pre>
        <button onClick={()=>window.location.reload()} style={{...S.btnPrimary,padding:"12px 24px"}}>Reload after SQL →</button>
      </div>
    </div>
  );

  // ── Loading ──
  if(loading)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"#F8FAFC"}}>
      <div style={{width:48,height:48,border:"4px solid #E2E8F0",borderTop:"4px solid #4F46E5",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <p style={{color:"#64748B",fontSize:15}}>Loading your financial data…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const TABS=[["dashboard","📊","Home"],["ai","✦","AI CFO"],["entries","📋","Entries"],["accounts","🏦","Accounts"],["channels","📈","Revenue"]];

  return(
    <MaskCtx.Provider value={masked}>
      <div style={{minHeight:"100vh",background:"#F8FAFC",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",color:"#0F172A"}}>
        <style>{`
          @keyframes spin{to{transform:rotate(360deg)}}
          *{box-sizing:border-box;}
          .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
          .two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
          .three-col{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
          @media(max-width:1200px){.kpi-grid{grid-template-columns:repeat(2,1fr);}}
          @media(max-width:768px){
            .kpi-grid{grid-template-columns:1fr 1fr;}
            .two-col{grid-template-columns:1fr;}
            .three-col{grid-template-columns:1fr 1fr;}
            .desktop-nav{display:none!important;}
            .mobile-nav{display:flex!important;}
            .content-pad{padding:12px 12px 80px!important;}
          }
          @media(max-width:480px){.kpi-grid{grid-template-columns:1fr;}.three-col{grid-template-columns:1fr;}}
          tr:hover td{background:#F8FAFC;}
        `}</style>

        {/* Top bar */}
        <div style={{background:"#fff",borderBottom:"1px solid #E2E8F0",position:"sticky",top:0,zIndex:100}}>
          <div style={{maxWidth:1440,margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center",gap:12,height:58}}>
            <div style={{width:36,height:36,background:"linear-gradient(135deg,#4F46E5,#7C3AED)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>📊</div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontWeight:900,fontSize:14,margin:0,lineHeight:1,letterSpacing:-0.3,color:"#0F172A"}}>Founder Finance OS</p>
              <p style={{fontSize:11,color:"#64748B",margin:0}}>{entries.length} entries · Net: <span style={{color:netFlow>=0?"#059669":"#DC2626",fontWeight:700}}>{masked?"₹ ••••":fmt(netFlow)}</span></p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:"#64748B",flexShrink:0}}>
              <span style={{fontSize:11}}>£→₹</span>
              <input value={fxInput} onChange={e=>setFxInput(e.target.value)} onBlur={onFxBlur} style={{width:52,padding:"4px 6px",border:"1px solid #BFDBFE",borderRadius:6,fontSize:12,outline:"none",background:"#EFF6FF",color:"#1D4ED8",fontWeight:700}}/>
            </div>
            <button onClick={toggleMask} style={{padding:"6px 12px",border:`1.5px solid ${masked?"#1E293B":"#CBD5E1"}`,borderRadius:8,background:masked?"#1E293B":"#F8FAFC",color:masked?"#fff":"#64748B",cursor:"pointer",fontSize:12,fontWeight:600,flexShrink:0}}>
              {masked?"🙈 Masked":"👁 Visible"}
            </button>
            <button onClick={()=>setShowAdd(true)} style={{...S.btnPrimary,padding:"8px 14px",fontSize:13,flexShrink:0}}>+ Add</button>
          </div>
          {/* Desktop tabs */}
          <div className="desktop-nav" style={{maxWidth:1440,margin:"0 auto",padding:"0 12px",display:"flex",overflowX:"auto"}}>
            {TABS.map(([id,icon,lbl])=>(
              <button key={id} onClick={()=>{setTab(id);if(id!=="entries")setFilterAcct(null);}} style={{padding:"10px 18px",fontSize:13,fontWeight:tab===id?700:500,color:tab===id?"#4F46E5":"#64748B",border:"none",borderBottom:tab===id?"2px solid #4F46E5":"2px solid transparent",marginBottom:-1,background:"none",cursor:"pointer",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6}}>
                <span>{icon}</span>{lbl}
                {id==="entries"&&<span style={{...S.badge,fontSize:10,background:"#EEF2FF",color:"#4F46E5",marginLeft:2}}>{entries.length}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="content-pad" style={{maxWidth:1440,margin:"0 auto",padding:"24px 20px 40px"}}>
          {tab==="dashboard"&&<DashboardTab entries={entries} channels={channels} fxRate={fxRate} onTabChange={t=>{setTab(t);}} onImport={setImportAcct}/>}
          {tab==="ai"        &&<AIInsightsTab entries={entries} channels={channels} fxRate={fxRate} apiKey={apiKey} onSetApiKey={onSetApiKey}/>}
          {tab==="entries"   &&<EntriesTab entries={entries} fxRate={fxRate} onEdit={setEditE} onDelete={onDelete} filterAccount={filterAcct}/>}
          {tab==="accounts"  &&<AccountsTab entries={entries} fxRate={fxRate} onEdit={setEditE} onDelete={onDelete} onImport={setImportAcct} onViewEntries={onViewEntries}/>}
          {tab==="channels"  &&<ChannelsTab entries={entries} channels={channels} fxRate={fxRate} onEditCh={ch=>{setEditCh(ch);setShowChModal(true);}} onDelCh={onDelCh} onAddCh={()=>{setEditCh(null);setShowChModal(true);}}/>}
        </div>

        {/* Mobile bottom nav */}
        <div className="mobile-nav" style={{display:"none",position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"1px solid #E2E8F0",zIndex:100,paddingBottom:"env(safe-area-inset-bottom)"}}>
          {TABS.map(([id,icon,lbl])=>(
            <button key={id} onClick={()=>{setTab(id);if(id!=="entries")setFilterAcct(null);}} style={{flex:1,padding:"8px 4px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,color:tab===id?"#4F46E5":"#94A3B8"}}>
              <span style={{fontSize:18}}>{icon}</span>
              <span style={{fontSize:10,fontWeight:tab===id?700:400}}>{lbl}</span>
            </button>
          ))}
        </div>

        {/* Modals */}
        {showAdd      &&<AddEntry onAdd={e=>{onAdd(e);setShowAdd(false);}} onClose={()=>setShowAdd(false)}/>}
        {editE        &&<EditModal entry={editE} onSave={onEdit} onClose={()=>setEditE(null)}/>}
        {showChModal  &&<ChannelModal ch={editCh} onSave={onSaveCh} onClose={()=>{setShowChModal(false);setEditCh(null);}}/>}
        {importAcct   &&<SmartImport accountId={importAcct} entries={entries} onDone={onImported} onClose={()=>setImportAcct(null)} onLearn={onLearn}/>}
      </div>
    </MaskCtx.Provider>
  );
}
