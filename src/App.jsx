import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gauge, Users, Megaphone, Layers, GitBranch, TrendingUp, DollarSign, Target,
  BarChart3, Calendar, Settings, Zap, ChevronRight, ArrowUpRight, ArrowDownRight,
  Minus, Activity, Clock, Shield, Heart, PieChart as PieIcon, Split
} from 'lucide-react';
import {
  AreaChart, Area, ComposedChart, BarChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { computeModel, DEFAULT_INPUTS, MONTHS, QUARTERS } from './engine';

// ─── TOKENS ───
const C = {
  bg:"#0A0E17", bgAlt:"#0d1117", card:"#111827", border:"#1e293b", borderL:"#334155",
  accent:"#22d3ee", accentD:"rgba(34,211,238,0.12)",
  green:"#10b981", greenD:"rgba(16,185,129,0.12)",
  amber:"#f59e0b", amberD:"rgba(245,158,11,0.12)",
  rose:"#f43f5e", roseD:"rgba(244,63,94,0.12)",
  violet:"#8b5cf6", violetD:"rgba(139,92,246,0.12)",
  blue:"#3b82f6", blueD:"rgba(59,130,246,0.12)",
  text:"#f1f5f9", muted:"#94a3b8", dim:"#64748b",
  ch:["#22d3ee","#10b981","#f59e0b","#f43f5e","#8b5cf6","#3b82f6","#ec4899","#14b8a6"],
};

const fmt=(n,d=0)=>{if(n==null||isNaN(n))return"$0";const s=n<0?"-":"",a=Math.abs(n);if(a>=1e6)return`${s}$${(a/1e6).toFixed(1)}M`;if(a>=1e3)return`${s}$${(a/1e3).toFixed(d>0?d:0)}K`;return`${s}$${a.toFixed(d)}`;};
const fN=(n)=>n==null||isNaN(n)?"0":Math.round(n).toLocaleString();
const fP=(n)=>`${(n*100).toFixed(1)}%`;

const Card=({children,style={}})=><div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24,...style}}>{children}</div>;

const Metric=({label,value,sub,color=C.accent,icon:I,delay=0})=>(
  <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:delay*0.04,duration:0.3}}
    style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 22px",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${color},${color}66)`}}/>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
      <span style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</span>
      {I&&<I size={14} style={{color:C.dim}}/>}
    </div>
    <div style={{fontSize:24,fontWeight:700,color:C.text,lineHeight:1.1}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:C.muted,marginTop:5}}>{sub}</div>}
  </motion.div>
);

const Input=({label,value,onChange,prefix="",suffix="",min,max,step=1,compact})=>(
  <div style={{marginBottom:compact?8:13}}>
    <label style={{display:"block",fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{label}</label>
    <div style={{display:"flex",alignItems:"center",background:C.bg,border:`1px solid ${C.border}`,borderRadius:7,padding:compact?"5px 9px":"7px 11px",gap:4}}>
      {prefix&&<span style={{color:C.dim,fontSize:13}}>{prefix}</span>}
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={e=>onChange(parseFloat(e.target.value)||0)}
        style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.text,fontSize:13,fontFamily:"'DM Mono',monospace",width:"100%"}}/>
      {suffix&&<span style={{color:C.dim,fontSize:11}}>{suffix}</span>}
    </div>
  </div>
);

const Header=({title,sub,icon:I})=>(
  <motion.div initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} style={{marginBottom:24}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      {I&&<div style={{width:30,height:30,borderRadius:8,background:C.accentD,display:"flex",alignItems:"center",justifyContent:"center"}}><I size={15} style={{color:C.accent}}/></div>}
      <div><h2 style={{fontSize:21,fontWeight:700,color:C.text,margin:0}}>{title}</h2>
        {sub&&<p style={{fontSize:12,color:C.muted,margin:0,marginTop:2}}>{sub}</p>}</div>
    </div>
  </motion.div>
);

const TT=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return(<div style={{background:"#1e293b",border:`1px solid ${C.borderL}`,borderRadius:10,padding:"10px 14px",boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
    <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:6}}>{label}</div>
    {payload.map((p,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:C.muted,marginBottom:2}}>
      <div style={{width:7,height:7,borderRadius:"50%",background:p.color}}/>{p.name}: <span style={{color:C.text,fontWeight:600,fontFamily:"'DM Mono',monospace"}}>{typeof p.value==="number"&&Math.abs(p.value)>100?fmt(p.value):fN(p.value)}</span>
    </div>))}
  </div>);
};

const Badge=({label,status="neutral"})=>{
  const m={good:{bg:C.greenD,c:C.green},great:{bg:C.greenD,c:C.green},warning:{bg:C.amberD,c:C.amber},bad:{bg:C.roseD,c:C.rose},neutral:{bg:C.accentD,c:C.accent}};
  const s=m[status]||m.neutral;
  return <span style={{padding:"3px 9px",borderRadius:20,fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.04em",background:s.bg,color:s.c,border:`1px solid ${s.c}33`}}>{label}</span>;
};

const SegmentToggle=({options,value,onChange})=>(
  <div style={{display:"flex",gap:2,padding:3,background:C.bg,borderRadius:8,border:`1px solid ${C.border}`}}>
    {options.map(o=>(
      <button key={o.value} onClick={()=>onChange(o.value)} style={{padding:"6px 14px",borderRadius:6,border:"none",background:value===o.value?C.accentD:"transparent",color:value===o.value?C.accent:C.dim,cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:"0.04em",transition:"all 0.15s"}}>{o.label}</button>
    ))}
  </div>
);

const NAV_SECTIONS=[
  { section: null, items: [
    {id:"dashboard",label:"Command Center",icon:Gauge},
  ]},
  { section: "Revenue", items: [
    {id:"targets",label:"Target Tracker",icon:Target},
    {id:"glideslope",label:"Glideslope",icon:Target},
    {id:"qbr",label:"QBR Metrics",icon:BarChart3},
    {id:"weekly",label:"Weekly Tracker",icon:Calendar},
  ]},
  { section: "Pipeline", items: [
    {id:"funnelHealth",label:"Funnel Health",icon:Heart},
    {id:"pipeline",label:"Pipeline",icon:GitBranch},
    {id:"marketing",label:"Marketing Funnel",icon:Megaphone},
    {id:"velocity",label:"Velocity",icon:Clock},
  ]},
  { section: "GTM Economics", items: [
    {id:"sandmBudget",label:"S&M Budget",icon:DollarSign},
    {id:"mktgBudget",label:"Mktg Budget",icon:DollarSign},
    {id:"channels",label:"Channel Mix",icon:Layers},
    {id:"cacBreakdown",label:"CAC Breakdown",icon:PieIcon},
    {id:"sales",label:"Sales Model",icon:Users},
    {id:"sellerRamp",label:"Seller Ramp",icon:TrendingUp},
  ]},
  { section: "Finance", items: [
    {id:"pnl",label:"P&L",icon:DollarSign},
  ]},
];

const LOGO_URL = "https://images.squarespace-cdn.com/content/v1/63d155fa93aba8529a061c8c/14b364ab-fc95-4c2d-ba6c-bca81e58a50f/HERETICS-LO.png?format=300w";

// ════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════
function DashboardPage({model,inputs}){
  const{summary:s,monthly,glideslope,funnelHealth}=model;
  const isSplit = inputs.revenueMode === "split";
  return(<div>
    <Header title="Command Center" sub="Every metric derived from your model inputs" icon={Gauge}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:24}}>
      <Metric label="Target ARR" value={fmt(s.targetARR)} sub={inputs.targetMode==="growthRate"?`${inputs.targetGrowthRate}% growth`:""} icon={Target} color={C.accent} delay={0}/>
      <Metric label="Starting ARR" value={fmt(s.startingARR)} sub={`NRR retained: ${fmt(s.retainedARR)}`} icon={DollarSign} color={C.green} delay={1}/>
      <Metric label="New ARR Gap" value={fmt(s.newARRNeeded)} sub={isSplit?`${fN(s.dealsNeeded)} logo + ${fN(s.expansionDeals)} exp`:`${fN(s.dealsNeeded)} deals`} icon={TrendingUp} color={C.amber} delay={2}/>
      <Metric label="Projected Revenue" value={fmt(s.totalRevenue)} sub={`Op margin: ${(s.opMargin*100).toFixed(1)}%`} icon={DollarSign} color={C.violet} delay={3}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(165px,1fr))",gap:12,marginBottom:24}}>
      <Metric label="LTV:CAC" value={`${s.ltvCac.toFixed(1)}x`} color={s.ltvCac>3?C.green:C.amber} delay={4}/>
      <Metric label="CAC Payback" value={`${s.cacPayback.toFixed(1)} mo`} color={s.cacPayback<18?C.green:C.rose} delay={5}/>
      <Metric label="Magic Number" value={s.magicNumber.toFixed(2)} color={s.magicNumber>0.75?C.green:C.amber} delay={6}/>
      <Metric label="Rule of 40" value={s.rule40.toFixed(0)} icon={Gauge} color={s.rule40>=40?C.green:C.rose} delay={7}/>
      <Metric label="Funnel Grade" value={s.funnelGrade} sub={`${s.overallFunnelScore}/${s.maxFunnelScore}`} icon={Heart} color={s.funnelGrade==="A"?C.green:s.funnelGrade==="B"?C.accent:C.amber} delay={8}/>
      <Metric label="Funnel Yield" value={`${(s.effectiveFunnelYield*100).toFixed(2)}%`} sub={`${Math.round(1/s.effectiveFunnelYield)} inq/deal`} color={C.blue} delay={9}/>
    </div>
    <Card style={{marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0}}>Funnel Health</h3>
        <Badge label={`Grade ${s.funnelGrade}`} status={s.funnelGrade==="A"||s.funnelGrade==="B"?"good":s.funnelGrade==="C"?"warning":"bad"}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
        {funnelHealth.map((f)=>(
          <div key={f.stage} style={{padding:"12px 10px",background:C.bg,borderRadius:10,border:`1px solid ${f.status==="great"?C.green:f.status==="good"?C.accent:C.rose}22`,textAlign:"center"}}>
            <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:6}}>{f.stage}</div>
            <div style={{fontSize:22,fontWeight:700,color:f.status==="great"?C.green:f.status==="good"?C.accent:C.rose}}>{f.rate}%</div>
            <Badge label={f.status} status={f.status}/>
          </div>
        ))}
      </div>
    </Card>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <Card><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>ARR Trajectory</h3>
        <ResponsiveContainer width="100%" height={260}><AreaChart data={monthly}>
          <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent} stopOpacity={0.25}/><stop offset="95%" stopColor={C.accent} stopOpacity={0}/></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="month" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickFormatter={v=>fmt(v)} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
          <Area type="monotone" dataKey="totalARR" stroke={C.accent} fill="url(#ag)" strokeWidth={2.5} name="Total ARR"/>
        </AreaChart></ResponsiveContainer></Card>
      <Card><div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0}}>Glideslope</h3><Badge label={glideslope[11]?.gapToTarget>=0?"On track":"Behind"} status={glideslope[11]?.gapToTarget>=0?"good":"bad"}/></div>
        <ResponsiveContainer width="100%" height={260}><ComposedChart data={glideslope}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="month" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickFormatter={v=>fmt(v)} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
          <Area type="monotone" dataKey="totalARR" stroke={C.accent} fill={C.accentD} strokeWidth={2} name="Projected"/><Line type="monotone" dataKey="targetARR" stroke={C.amber} strokeWidth={2} strokeDasharray="8 4" dot={false} name="Target"/>
        </ComposedChart></ResponsiveContainer></Card>
    </div>
  </div>);
}

// ════════════════════════════════════════════════════════════
// FUNNEL HEALTH
// ════════════════════════════════════════════════════════════
function FunnelHealthPage({model,inputs,setInputs}){
  const{funnelHealth,summary:s}=model;
  const bk=["inquiryToMqlRate","mqlToSqlRate","sqlToMeetingRate","meetingToSqoRate","sqoToWonRate"];
  const bl=["Inquiry→MQL","MQL→SQL","SQL→Meeting","Meeting→SQO","SQO→Won"];
  return(<div>
    <Header title="Funnel Health" sub="Conversion benchmarks, coverage settings, and stage-level diagnostics" icon={Heart}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:24}}>
      <Metric label="Overall Grade" value={s.funnelGrade} sub={`Score: ${s.overallFunnelScore}/${s.maxFunnelScore}`} color={s.funnelGrade==="A"?C.green:s.funnelGrade==="B"?C.accent:C.amber}/>
      <Metric label="Pipeline Coverage" value={`${inputs.pipelineCoverage}%`} sub={s.coverageHealth==="good"?"Healthy":"Needs attention"} color={s.coverageHealth==="good"?C.green:s.coverageHealth==="warning"?C.amber:C.rose}/>
      <Metric label="Funnel Yield" value={`${(s.effectiveFunnelYield*100).toFixed(2)}%`} sub={`1 deal per ${Math.round(1/s.effectiveFunnelYield)} inquiries`} color={C.accent}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:16}}>Stage Conversion Health</h3>
        {funnelHealth.map((f,i)=>{const pct=f.bench.great>0?Math.min(100,f.rate/f.bench.great*100):100;return(
          <div key={f.stage} style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:12,fontWeight:600,color:C.text}}>{f.stage}</span><Badge label={f.status} status={f.status}/></div>
              <span style={{fontSize:14,fontWeight:700,color:f.status==="great"?C.green:f.status==="good"?C.accent:C.rose,fontFamily:"'DM Mono',monospace"}}>{f.rate}%</span>
            </div>
            <div style={{position:"relative",height:20,background:C.bg,borderRadius:6,overflow:"hidden"}}>
              <div style={{position:"absolute",left:`${f.bench.good/f.bench.great*100}%`,top:0,bottom:0,width:1,background:C.amber,zIndex:2}}/>
              <motion.div initial={{width:0}} animate={{width:`${Math.min(pct,100)}%`}} transition={{duration:0.5,delay:i*0.06}}
                style={{height:"100%",background:f.status==="great"?C.green:f.status==="good"?C.accent:C.rose,borderRadius:6,opacity:0.7}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
              <span style={{fontSize:8,color:C.dim}}>0%</span>
              <span style={{fontSize:8,color:C.amber}}>Good: {f.bench.good}%</span>
              <span style={{fontSize:8,color:C.green}}>Great: {f.bench.great}%</span>
            </div>
          </div>);})}
      </Card>
      <div>
        <Card style={{marginBottom:16}}>
          <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:16}}>Pipeline Coverage Settings</h3>
          <Input label="Coverage Ratio" value={inputs.pipelineCoverage} onChange={v=>setInputs(p=>({...p,pipelineCoverage:v}))} suffix="%" step={10}/>
          <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:8,marginTop:8}}>Health Thresholds</div>
          <Input compact label="Green" value={inputs.coverageGreen} onChange={v=>setInputs(p=>({...p,coverageGreen:v}))} suffix="%" step={10}/>
          <Input compact label="Yellow" value={inputs.coverageYellow} onChange={v=>setInputs(p=>({...p,coverageYellow:v}))} suffix="%" step={10}/>
          <Input compact label="Red" value={inputs.coverageRed} onChange={v=>setInputs(p=>({...p,coverageRed:v}))} suffix="%" step={10}/>
          <div style={{marginTop:10,padding:10,background:C.bg,borderRadius:8,display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:12,height:12,borderRadius:"50%",background:s.coverageHealth==="good"?C.green:s.coverageHealth==="warning"?C.amber:C.rose}}/>
            <span style={{fontSize:13,fontWeight:700,color:C.text}}>{inputs.pipelineCoverage}%</span>
            <Badge label={s.coverageHealth} status={s.coverageHealth}/>
          </div>
        </Card>
        <Card>
          <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:12}}>Benchmark Thresholds</h3>
          {bk.map((key,i)=>(
            <div key={key} style={{display:"grid",gridTemplateColumns:"100px 1fr 1fr",gap:6,marginBottom:6,alignItems:"center"}}>
              <span style={{fontSize:10,color:C.muted}}>{bl[i]}</span>
              <div style={{display:"flex",alignItems:"center",gap:3,background:C.bg,borderRadius:5,padding:"3px 6px"}}>
                <span style={{fontSize:8,color:C.amber}}>G</span>
                <input type="number" value={inputs.funnelBenchmarks[key].good} onChange={e=>setInputs(p=>({...p,funnelBenchmarks:{...p.funnelBenchmarks,[key]:{...p.funnelBenchmarks[key],good:parseInt(e.target.value)||0}}}))}
                  style={{width:35,background:"transparent",border:"none",color:C.text,fontSize:11,fontFamily:"'DM Mono',monospace",outline:"none"}}/><span style={{fontSize:8,color:C.dim}}>%</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:3,background:C.bg,borderRadius:5,padding:"3px 6px"}}>
                <span style={{fontSize:8,color:C.green}}>★</span>
                <input type="number" value={inputs.funnelBenchmarks[key].great} onChange={e=>setInputs(p=>({...p,funnelBenchmarks:{...p.funnelBenchmarks,[key]:{...p.funnelBenchmarks[key],great:parseInt(e.target.value)||0}}}))}
                  style={{width:35,background:"transparent",border:"none",color:C.text,fontSize:11,fontFamily:"'DM Mono',monospace",outline:"none"}}/><span style={{fontSize:8,color:C.dim}}>%</span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  </div>);
}

// ════════════════════════════════════════════════════════════
// CAC BREAKDOWN
// ════════════════════════════════════════════════════════════
function CACBreakdownPage({model,inputs}){
  const{cacBreakdown,channels,summary:s}=model;
  const isSplit=inputs.revenueMode==="split";
  const pieData=Object.entries(cacBreakdown).map(([k,v],i)=>({name:v.label,value:v.spend,fill:C.ch[i]}));
  return(<div>
    <Header title="CAC Breakdown" sub="Acquisition cost decomposed by spend category and channel" icon={PieIcon}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:24}}>
      <Metric label="Blended CAC" value={fmt(s.blendedCAC)} sub="New logo only" color={C.accent}/>
      {isSplit&&<Metric label="Fully Loaded CAC" value={fmt(s.fullyLoadedCAC)} sub="All motions" color={C.violet}/>}
      <Metric label="Total Acq Cost" value={fmt(s.totalAcquisitionCost)} sub="Mktg + SDR" color={C.amber}/>
      <Metric label="LTV:CAC" value={`${s.ltvCac.toFixed(1)}x`} color={s.ltvCac>3?C.green:C.amber}/>
      <Metric label="CAC Payback" value={`${s.cacPayback.toFixed(1)} mo`} color={s.cacPayback<18?C.green:C.rose}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"380px 1fr",gap:20}}>
      <Card>
        <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:16}}>Spend Composition</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={2}>
            {pieData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
          </Pie><Tooltip formatter={v=>fmt(v)}/></PieChart>
        </ResponsiveContainer>
        {Object.entries(cacBreakdown).map(([k,v],i)=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:C.ch[i]}}/><span style={{fontSize:11,color:C.text}}>{v.label}</span></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:11,fontWeight:600,color:C.text,fontFamily:"'DM Mono',monospace"}}>{fmt(v.spend)}</div><div style={{fontSize:9,color:C.dim}}>{v.pctOfTotal.toFixed(0)}% • {fmt(v.perDeal)}/deal</div></div>
          </div>
        ))}
      </Card>
      <Card>
        <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:16}}>Channel-Level CAC Economics</h3>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
          <thead><tr>{["Channel","Spend","Deals","CAC","$/MQL","$/SQL","$/SQO","Payback","LTV:CAC"].map(h=><th key={h} style={{textAlign:"right",padding:"7px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",borderBottom:`1px solid ${C.border}`}}>{h}</th>)}</tr></thead>
          <tbody>{channels.map((c,i)=><tr key={c.name}>
            <td style={{padding:"7px",textAlign:"right"}}><div style={{display:"flex",alignItems:"center",gap:5,justifyContent:"flex-end"}}><div style={{width:5,height:5,borderRadius:"50%",background:C.ch[i]}}/><span style={{color:C.text,fontWeight:600}}>{c.name}</span></div></td>
            <td style={{padding:"7px",color:C.muted,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>{fmt(c.spend)}</td>
            <td style={{padding:"7px",color:C.muted,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>{fN(c.deals)}</td>
            <td style={{padding:"7px",color:c.cac<s.blendedCAC?C.green:C.rose,fontWeight:700,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>{fmt(c.cac)}</td>
            <td style={{padding:"7px",color:C.muted,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>{fmt(c.costPerMql)}</td>
            <td style={{padding:"7px",color:C.muted,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>{fmt(c.costPerSql)}</td>
            <td style={{padding:"7px",color:C.muted,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>{fmt(c.costPerSqo)}</td>
            <td style={{padding:"7px",color:c.cacPayback<18?C.green:C.rose,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>{c.cacPayback.toFixed(1)}mo</td>
            <td style={{padding:"7px",color:c.ltvCac>3?C.green:C.amber,fontWeight:700,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>{c.ltvCac.toFixed(1)}x</td>
          </tr>)}</tbody>
        </table></div>
      </Card>
    </div>
  </div>);
}

// ════════════════════════════════════════════════════════════
// S&M BUDGET (CFO VIEW)
// ════════════════════════════════════════════════════════════
function SandMBudgetPage({model,inputs,setInputs}){
  const{pnl:p,summary:s}=model;
  const salesItems = p.salesBudgetItems || [];
  const mktgItems = p.fixedMktgItems || [];

  // Combined S&M
  const totalSales = p.salesBudgetActual || p.salesOpex;
  const totalMktg = p.totalMktgBudget;
  const totalSandM = totalSales + totalMktg;
  const sandMPctRev = p.totalRevenue > 0 ? totalSandM / p.totalRevenue * 100 : 0;
  const salesPctRev = p.totalRevenue > 0 ? totalSales / p.totalRevenue * 100 : 0;
  const mktgPctRev = p.totalRevenue > 0 ? totalMktg / p.totalRevenue * 100 : 0;

  // Total headcount
  const salesHeads = (p.aeCount||0) + (p.sdrCount||0) + (p.seCount||0);
  const revPerSalesHead = salesHeads > 0 ? p.totalRevenue / salesHeads : 0;
  const costPerDeal = s.dealsNeeded > 0 ? totalSandM / s.dealsNeeded : 0;

  // Health
  const healthColor = sandMPctRev > 60 ? C.rose : sandMPctRev < 30 ? C.amber : C.green;
  const healthLabel = sandMPctRev > 60 ? "BURN RISK" : sandMPctRev < 30 ? "UNDERINVEST" : "HEALTHY";

  // Pie data for S vs M split
  const splitData = [
    {name:"Sales", value:totalSales, fill:C.accent},
    {name:"Marketing", value:totalMktg, fill:C.violet},
  ];

  return(<div>
    <Header title="S&M Budget" sub="Combined Sales & Marketing — the CFO view" icon={DollarSign}/>

    {/* Health banner */}
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",borderRadius:10,marginBottom:20,
      background:`${healthColor}08`,border:`1px solid ${healthColor}20`}}>
      <div style={{padding:"6px 14px",borderRadius:6,background:healthColor,color:"#fff",fontSize:11,fontWeight:700}}>{healthLabel}</div>
      <div style={{fontSize:13,color:C.text}}>Total S&M: <strong style={{fontFamily:"'DM Mono',monospace"}}>{fmt(totalSandM)}</strong> = <strong>{sandMPctRev.toFixed(1)}%</strong> of revenue</div>
      <div style={{marginLeft:"auto",fontSize:10,color:C.dim}}>Benchmark: 35-55% growth stage • &gt;60% = burn risk</div>
    </div>

    {/* Top metrics */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:20}}>
      <Metric label="Total S&M" value={fmt(totalSandM)} sub={`${sandMPctRev.toFixed(1)}% of rev`} color={healthColor}/>
      <Metric label="Sales Budget" value={fmt(totalSales)} sub={`${salesPctRev.toFixed(1)}% of rev`} color={C.accent}/>
      <Metric label="Mktg Budget" value={fmt(totalMktg)} sub={`${mktgPctRev.toFixed(1)}% of rev`} color={C.violet}/>
      <Metric label="S&M per Deal" value={fmt(costPerDeal)} sub={`${fN(s.dealsNeeded)} deals`} color={C.amber}/>
      <Metric label="Rev / Sales HC" value={fmt(revPerSalesHead)} sub={`${salesHeads} heads`} color={C.green}/>
      <Metric label="Sales:Mktg Ratio" value={`${(totalSales/Math.max(totalMktg,1)).toFixed(1)}:1`} sub="spend ratio" color={C.blue}/>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
      {/* Sales Budget Breakdown */}
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{fontSize:11,fontWeight:700,color:C.accent,margin:0,textTransform:"uppercase",letterSpacing:"0.04em"}}>Sales Budget</h3>
          {p.salesIsFloorBound && <div style={{padding:"3px 8px",borderRadius:4,background:`${C.rose}15`,fontSize:9,fontWeight:700,color:C.rose}}>FLOOR-BOUND +{fmt(p.salesFloorDelta)}</div>}
        </div>
        {salesItems.map((si,i)=>{
          const barW = p.salesBudgetActual > 0 ? si.amount / p.salesBudgetActual * 100 : 0;
          return(<div key={si.name} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:12,fontWeight:600,color:C.text}}>{si.name}</span>
                {si.isFloorBound && <span style={{fontSize:8,color:C.amber,fontWeight:700}}>▲ FLOOR</span>}
                {si.headcount && <span style={{fontSize:9,color:C.dim}}>({si.headcount} × {fmt(si.perHead)})</span>}
              </div>
              <span style={{fontSize:13,fontWeight:700,color:C.accent,fontFamily:"'DM Mono',monospace"}}>{fmt(si.amount)}</span>
            </div>
            <div style={{height:16,background:C.bg,borderRadius:4,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${barW}%`,background:si.isFloorBound?`linear-gradient(90deg,${C.accent},${C.amber})`:C.accent,borderRadius:4,opacity:0.7}}/>
            </div>
            <div style={{fontSize:9,color:C.dim,marginTop:2}}>{si.desc}</div>
          </div>);
        })}
        <div style={{height:1,background:C.border,margin:"10px 0"}}/>
        <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0"}}>
          <span style={{fontSize:11,fontWeight:600,color:C.text}}>Total Sales</span>
          <span style={{fontSize:13,fontWeight:700,color:C.accent,fontFamily:"'DM Mono',monospace"}}>{fmt(totalSales)}</span>
        </div>
        <div style={{fontSize:9,color:C.dim}}>Formula ({inputs.salesOpexPct}% of rev): {fmt(p.salesOpex)} • Actual: {fmt(totalSales)}{p.salesIsFloorBound?" — headcount exceeds formula":""}</div>
      </Card>

      {/* Marketing Budget Summary */}
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{fontSize:11,fontWeight:700,color:C.violet,margin:0,textTransform:"uppercase",letterSpacing:"0.04em"}}>Marketing Budget</h3>
          {p.fixedMktgIsFloorBound && <div style={{padding:"3px 8px",borderRadius:4,background:`${C.rose}15`,fontSize:9,fontWeight:700,color:C.rose}}>FLOOR-BOUND</div>}
        </div>
        {[
          {name:"Programmatic (Channel)", amount:p.programmaticBudget, color:C.green, desc:"Paid media, events — buys inquiries"},
          {name:"Martech (Variable)", amount:p.martechSpend, color:C.blue, desc:"Intent data, enrichment, MAP overage"},
          ...mktgItems.map(fi=>({name:fi.name, amount:fi.amount, color:C.violet, desc:fi.desc, isFloor:fi.isFloorBound})),
        ].map((item,i)=>{
          const barW = totalMktg > 0 ? item.amount / totalMktg * 100 : 0;
          return(<div key={item.name} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:item.color}}/>
                <span style={{fontSize:11,fontWeight:600,color:C.text}}>{item.name}</span>
                {item.isFloor && <span style={{fontSize:8,color:C.amber,fontWeight:700}}>▲ FLOOR</span>}
              </div>
              <span style={{fontSize:12,fontWeight:600,color:item.color,fontFamily:"'DM Mono',monospace"}}>{fmt(item.amount)}</span>
            </div>
            <div style={{height:12,background:C.bg,borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${barW}%`,background:item.color,borderRadius:3,opacity:0.6}}/>
            </div>
          </div>);
        })}
        <div style={{height:1,background:C.border,margin:"10px 0"}}/>
        <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0"}}>
          <span style={{fontSize:11,fontWeight:600,color:C.text}}>Total Marketing</span>
          <span style={{fontSize:13,fontWeight:700,color:C.violet,fontFamily:"'DM Mono',monospace"}}>{fmt(totalMktg)}</span>
        </div>
      </Card>
    </div>

    {/* Combined S&M waterfall */}
    <Card style={{marginBottom:18}}>
      <h3 style={{fontSize:11,fontWeight:700,color:C.dim,margin:0,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.04em"}}>S&M P&L Waterfall</h3>
      <div style={{display:"flex",gap:4,alignItems:"flex-end",height:200,padding:"0 20px"}}>
        {[
          {label:"Revenue", value:p.totalRevenue, color:C.green, full:true},
          {label:"COGS", value:p.cogsAmount, color:C.rose, neg:true},
          {label:"Gross Profit", value:p.grossProfit, color:C.green, full:true},
          {label:"Sales", value:totalSales, color:C.accent, neg:true},
          {label:"Marketing", value:totalMktg, color:C.violet, neg:true},
          {label:"G&A", value:p.gAndA, color:C.dim, neg:true},
          {label:"R&D", value:p.rAndD, color:C.dim, neg:true},
          {label:"Op Income", value:p.operatingIncome, color:p.operatingIncome>=0?C.green:C.rose, full:true},
        ].map((bar,i)=>{
          const maxVal = p.totalRevenue;
          const h = maxVal > 0 ? Math.abs(bar.value) / maxVal * 160 : 0;
          return(<div key={bar.label} style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:10,fontWeight:700,color:bar.color,fontFamily:"'DM Mono',monospace",marginBottom:4}}>{fmt(bar.value)}</div>
            <div style={{height:h,background:bar.neg?`${bar.color}40`:bar.color,borderRadius:"4px 4px 0 0",marginBottom:2,opacity:bar.full?1:0.7}}/>
            <div style={{fontSize:8,color:C.dim,marginTop:4,lineHeight:1.2}}>{bar.label}</div>
          </div>);
        })}
      </div>
    </Card>

    {/* Leadership Cost Layer */}
    <Card style={{marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div>
          <h3 style={{fontSize:11,fontWeight:700,color:C.rose,margin:0,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>Leadership Cost Layer</h3>
          <div style={{fontSize:10,color:C.muted}}>Step function — driven by funding stage, not revenue. Board-mandated comp bands.</div>
        </div>
        <div style={{padding:"6px 12px",borderRadius:6,background:`${C.rose}12`,border:`1px solid ${C.rose}30`}}>
          <div style={{fontSize:14,fontWeight:700,color:C.rose,fontFamily:"'DM Mono',monospace"}}>{(p.leadershipPctOfRev||0).toFixed(1)}%</div>
          <div style={{fontSize:8,color:C.dim}}>of revenue</div>
        </div>
      </div>

      {/* Funding stage selector */}
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        {["bootstrapped","seed","seriesA","seriesB","seriesC"].map(fs=>{
          const isActive = (inputs.fundingStage||"seriesB") === fs;
          const labels = {bootstrapped:"Bootstrapped",seed:"Seed",seriesA:"Series A",seriesB:"Series B",seriesC:"Series C+"};
          return(<button key={fs} onClick={()=>setInputs(prev=>({...prev,fundingStage:fs}))}
            style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${isActive?C.accent:C.border}`,
              background:isActive?C.accentD:"transparent",color:isActive?C.accent:C.muted,
              cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
            {labels[fs]}
          </button>);
        })}
      </div>

      {/* Leadership table */}
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
        <thead><tr>{["Role","OTE","Loaded","Sits In","% of Rev","Status"].map(h=>
          <th key={h} style={{textAlign:"right",padding:"8px 10px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",borderBottom:`2px solid ${C.border}`}}>{h}</th>
        )}</tr></thead>
        <tbody>
          {(p.leadershipDetail||[]).map(l=>{
            const pctRev = p.totalRevenue > 0 ? l.loaded / p.totalRevenue * 100 : 0;
            const sitsColor = l.sitsIn==="Sales"?C.accent:l.sitsIn==="Marketing"?C.violet:l.sitsIn==="R&D"?C.blue:C.dim;
            return(<tr key={l.role} style={{opacity:l.enabled?1:0.35}}>
              <td style={{padding:"10px",textAlign:"right",fontWeight:600,color:l.enabled?C.text:C.dim}}>{l.role}</td>
              <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace"}}>{fmt(l.ote)}</td>
              <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontWeight:700,color:l.enabled?C.text:C.dim}}>{fmt(l.loaded)}</td>
              <td style={{padding:"10px",textAlign:"right"}}><span style={{padding:"2px 8px",borderRadius:4,background:`${sitsColor}15`,color:sitsColor,fontSize:9,fontWeight:600}}>{l.sitsIn}</span></td>
              <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:pctRev>5?C.rose:C.text}}>{l.enabled?pctRev.toFixed(1)+"%":"—"}</td>
              <td style={{padding:"10px",textAlign:"right"}}>
                <button onClick={()=>setInputs(prev=>{
                  const roles = {...(prev.leadershipRoles||{vpSales:true,vpMarketing:true,vpCS:true,vpOps:false,vpProduct:false})};
                  const key = l.role.includes("Sales")?"vpSales":l.role.includes("Marketing")?"vpMarketing":l.role.includes("CS")?"vpCS":l.role.includes("Ops")?"vpOps":"vpProduct";
                  roles[key] = !roles[key];
                  return {...prev, leadershipRoles: roles};
                })} style={{padding:"3px 10px",borderRadius:4,border:`1px solid ${l.enabled?C.green:C.border}`,
                  background:l.enabled?`${C.green}15`:"transparent",color:l.enabled?C.green:C.dim,
                  cursor:"pointer",fontSize:9,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
                  {l.enabled?"Active":"Add"}
                </button>
              </td>
            </tr>);
          })}
          <tr style={{borderTop:`2px solid ${C.border}`}}>
            <td style={{padding:"10px",textAlign:"right",fontWeight:700,color:C.text}}>Total Leadership</td>
            <td style={{padding:"10px"}}/>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontWeight:700,color:C.rose}}>{fmt(p.totalLeadershipCost)}</td>
            <td style={{padding:"10px"}}/>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontWeight:700,color:(p.leadershipPctOfRev||0)>15?C.rose:C.text}}>{(p.leadershipPctOfRev||0).toFixed(1)}%</td>
            <td style={{padding:"10px"}}/>
          </tr>
        </tbody>
      </table></div>
      <div style={{marginTop:10,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        {[
          {label:"In Sales", value:p.leadershipInSales, color:C.accent},
          {label:"In Marketing", value:p.leadershipInMktg, color:C.violet},
          {label:"In G&A", value:p.leadershipInGA, color:C.dim},
          {label:"In R&D", value:p.leadershipInRD, color:C.blue},
        ].map(b=>(<div key={b.label} style={{padding:8,background:C.bg,borderRadius:6,textAlign:"center"}}>
          <div style={{fontSize:9,color:C.dim}}>{b.label}</div>
          <div style={{fontSize:14,fontWeight:700,color:b.color,fontFamily:"'DM Mono',monospace"}}>{fmt(b.value)}</div>
        </div>))}
      </div>
    </Card>

    {/* Headcount & Comp Detail */}
    <Card style={{marginBottom:18}}>
      <h3 style={{fontSize:11,fontWeight:700,color:C.accent,margin:0,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.04em"}}>GTM Headcount & Comp</h3>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
        <thead><tr>{["Role","Count","Per Head","Total Comp","Base (Fixed)","Variable","% of Rev"].map(h=>
          <th key={h} style={{textAlign:"right",padding:"8px 10px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",borderBottom:`2px solid ${C.border}`}}>{h}</th>
        )}</tr></thead>
        <tbody>
          <tr>
            <td style={{padding:"10px",textAlign:"right",fontWeight:600,color:C.accent}}>AEs</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace"}}>{p.aeCount}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace"}}>{fmt(p.aeFullyLoaded)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontWeight:700}}>{fmt(p.aeCompFloor)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:C.muted}}>{fmt(p.aeCompFloor * (1 - inputs.salesVariablePct/100))}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:C.amber}}>{fmt(p.aeCompFloor * (inputs.salesVariablePct/100))}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:p.aeCompFloor/p.totalRevenue>0.3?C.rose:C.text}}>{(p.aeCompFloor/p.totalRevenue*100).toFixed(1)}%</td>
          </tr>
          <tr>
            <td style={{padding:"10px",textAlign:"right",fontWeight:600,color:C.blue}}>SDRs/BDRs</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace"}}>{p.sdrCount}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace"}}>{fmt(p.sdrFullyLoaded)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontWeight:700}}>{fmt(p.sdrCompFloor)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:C.muted}}>{fmt(p.sdrCompFloor * 0.7)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:C.amber}}>{fmt(p.sdrCompFloor * 0.3)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace"}}>{(p.sdrCompFloor/p.totalRevenue*100).toFixed(1)}%</td>
          </tr>
          <tr>
            <td style={{padding:"10px",textAlign:"right",fontWeight:600,color:C.green}}>SEs</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace"}}>{p.seCount}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace"}}>{fmt(p.seFullyLoaded)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontWeight:700}}>{fmt(p.seCompFloor)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:C.muted}}>{fmt(p.seCompFloor)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:C.dim}}>—</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace"}}>{(p.seCompFloor/p.totalRevenue*100).toFixed(1)}%</td>
          </tr>
          <tr style={{borderTop:`2px solid ${C.border}`}}>
            <td style={{padding:"10px",textAlign:"right",fontWeight:700,color:C.text}}>Total GTM</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontWeight:700}}>{salesHeads}</td>
            <td style={{padding:"10px"}}/>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontWeight:700,color:C.accent}}>{fmt(p.salesHeadcountFloor)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontWeight:700}}>{fmt(p.totalSalesFixedComp)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontWeight:700,color:C.amber}}>{fmt(p.totalSalesVariableComp)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontWeight:700,color:p.salesHeadcountFloor/p.totalRevenue>0.4?C.rose:C.text}}>{(p.salesHeadcountFloor/p.totalRevenue*100).toFixed(1)}%</td>
          </tr>
        </tbody>
      </table></div>
      {p.salesIsFloorBound && (
        <div style={{marginTop:12,padding:10,background:`${C.amber}08`,borderRadius:6,border:`1px solid ${C.amber}15`}}>
          <span style={{fontSize:10,color:C.amber,fontWeight:600}}>⚠ Headcount floor exceeds formula:</span>
          <span style={{fontSize:10,color:C.muted,marginLeft:6}}>
            {inputs.salesOpexPct}% of revenue = {fmt(p.salesOpex)}, but {salesHeads} heads cost {fmt(p.salesHeadcountFloor)} in comp alone before tools/enablement/travel.
            Either raise salesOpexPct or reduce headcount.
          </span>
        </div>
      )}
    </Card>

    {/* Fixed vs Variable Split */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <Card>
        <h3 style={{fontSize:11,fontWeight:700,color:C.dim,margin:0,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.04em"}}>Sales:Marketing Split</h3>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart><Pie data={splitData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
            {splitData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
          </Pie><Tooltip formatter={v=>fmt(v)}/></PieChart>
        </ResponsiveContainer>
        <div style={{textAlign:"center",marginTop:8}}>
          {splitData.map(d=>(
            <span key={d.name} style={{fontSize:10,color:d.fill,fontWeight:600,marginRight:16}}>
              <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:d.fill,marginRight:4}}/>
              {d.name}: {fmt(d.value)} ({(d.value/totalSandM*100).toFixed(0)}%)
            </span>
          ))}
        </div>
      </Card>
      <Card>
        <h3 style={{fontSize:11,fontWeight:700,color:C.dim,margin:0,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.04em"}}>Fixed vs Variable (All S&M)</h3>
        {[
          {label:"Fixed Sales Comp", value:p.totalSalesFixedComp, color:C.accent},
          {label:"Variable Sales Comp", value:p.totalSalesVariableComp, color:C.amber},
          {label:"Sales Non-Comp", value:Math.max(0, totalSales - p.salesHeadcountFloor), color:C.dim},
          {label:"Fixed Marketing", value:p.fixedMktg, color:C.violet},
          {label:"Variable Marketing", value:p.variableMktg, color:C.green},
        ].map(item=>{
          const barW = totalSandM > 0 ? item.value / totalSandM * 100 : 0;
          return(<div key={item.label} style={{marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
              <span style={{fontSize:10,color:C.text}}>{item.label}</span>
              <span style={{fontSize:11,fontWeight:600,color:item.color,fontFamily:"'DM Mono',monospace"}}>{fmt(item.value)}</span>
            </div>
            <div style={{height:10,background:C.bg,borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${barW}%`,background:item.color,borderRadius:3,opacity:0.6}}/>
            </div>
          </div>);
        })}
      </Card>
    </div>
  </div>);
}

// ════════════════════════════════════════════════════════════
// MARKETING BUDGET (DETAIL)
// ════════════════════════════════════════════════════════════
const STRESS_MODES = [
  { id:"lean", label:"Lean Execution", fixedPct:30, color:"#22c55e",
    desc:"Limited GTM change. Minimal RevOps remediation. Stable brand narrative. No major platform migrations." },
  { id:"normal", label:"Normal Operating", fixedPct:38, color:"#f59e0b",
    desc:"Active GTM optimization. RevOps remediation in progress. Brand refresh underway. Standard tooling lifecycle." },
  { id:"transform", label:"Transformation", fixedPct:45, color:"#ef4444",
    desc:"Full GTM rebuild. Heavy RevOps investment. New positioning/messaging. Platform migration. Analyst relations." },
];

function MarketingBudgetPage({model,inputs,setInputs}){
  const{pnl:p,summary:s}=model;
  const[debtTax,setDebtTax]=useState(0); // tactical debt tax slider (0-20%)
  const currentMode = STRESS_MODES.find(m => m.fixedPct <= inputs.fixedMktgPct) || STRESS_MODES[0];
  const activeMode = STRESS_MODES.find(m => m.fixedPct === inputs.fixedMktgPct);

  // Base values from engine
  const totalBudget = p.totalMktgBudget;
  const variableBudget = p.variableMktg;
  const fixedBudget = p.fixedMktg;
  const programmatic = p.programmaticBudget;
  const martech = p.martechSpend;
  const fixedItems = p.fixedMktgItems || [];

  // Tactical debt tax: adds % on top of fixed overhead
  const debtTaxAmount = fixedBudget * (debtTax / 100);
  const adjustedFixedBudget = fixedBudget + debtTaxAmount;
  const adjustedTotalBudget = variableBudget + adjustedFixedBudget;
  const adjustedBurdenedCAC = s.dealsNeeded > 0 ? adjustedTotalBudget / s.dealsNeeded : 0;
  const adjustedPayback = adjustedBurdenedCAC > 0 ? adjustedBurdenedCAC / (inputs.avgDealSize / 12) : 0;

  // Sensitivity: what breaks at 30%, 38%, 45% fixed overhead
  const sensitivity = STRESS_MODES.map(mode => {
    const modeVariable = variableBudget; // variable stays constant
    const modeTotalMktg = modeVariable / (1 - mode.fixedPct / 100);
    const modeFixed = modeTotalMktg - modeVariable;
    const modeFixedWithDebt = modeFixed * (1 + debtTax / 100);
    const modeTotalWithDebt = modeVariable + modeFixedWithDebt;
    const modeCAC = s.dealsNeeded > 0 ? modeTotalWithDebt / s.dealsNeeded : 0;
    const modePayback = modeCAC > 0 ? modeCAC / (inputs.avgDealSize / 12) : 0;
    const modeOpex = p.gAndA + p.rAndD + p.salesOpex + modeTotalWithDebt;
    const modeOpIncome = p.grossProfit - modeOpex;
    const modeOpMargin = p.totalRevenue > 0 ? modeOpIncome / p.totalRevenue * 100 : 0;
    const modeSandM = p.salesOpex + modeTotalWithDebt;
    const modeSandMPct = p.totalRevenue > 0 ? modeSandM / p.totalRevenue * 100 : 0;
    // Required pipeline efficiency: if overhead is higher, you need better conversion to maintain payback
    const requiredSqoWin = modeCAC > 0 && inputs.avgDealSize > 0 ? Math.min(100, (inputs.avgDealSize / modeCAC) * (inputs.sqoToWonRate / 100) * 100) : 0;
    return { ...mode, totalMktg: modeTotalWithDebt, fixedAmount: modeFixedWithDebt, cac: modeCAC, payback: modePayback,
      opMargin: modeOpMargin, sandMPct: modeSandMPct, requiredSqoWin, isActive: mode.fixedPct === inputs.fixedMktgPct };
  });

  // Budget waterfall
  const waterfallData = [
    {name:"Total Mktg Budget", value: adjustedTotalBudget, fill: C.accent},
    {name:"Variable (Demand)", value: variableBudget, fill: C.amber},
    {name:"  Programmatic", value: programmatic, fill: C.green},
    {name:"  Martech", value: martech, fill: C.blue},
    {name:"Fixed (Overhead)", value: fixedBudget, fill: C.violet},
    ...fixedItems.map(fi => ({name:`  ${fi.name}`, value: fi.amount, fill: C.violet})),
    ...(debtTax > 0 ? [{name:"Tactical Debt Tax", value: debtTaxAmount, fill: C.rose}] : []),
  ];

  // CAC layers
  const cacLayers = [
    {label:"Programmatic CAC", value: p.programmaticCAC, desc:"Channel spend ÷ deals", color: C.green},
    {label:"+ Martech CAC", value: p.martechLoadedCAC, desc:"Channel + martech ÷ deals", color: C.blue},
    {label:"Fully Burdened CAC", value: adjustedBurdenedCAC, desc:`All marketing${debtTax>0?" + debt tax":""} ÷ deals`, color: C.violet},
    {label:"All-In Blended", value: (s.dealsNeeded+s.expansionDeals)>0?adjustedTotalBudget/(s.dealsNeeded+s.expansionDeals):0, desc:"All marketing ÷ all deals (incl expansion)", color: C.amber},
  ];

  return(<div>
    <Header title="Marketing Budget" sub="Budget decomposition — stress testing, tactical debt, CAC layers" icon={DollarSign}/>

    {/* Fixed Marketing Stress Toggle */}
    <Card style={{marginBottom:18}}>
      <h3 style={{fontSize:11,fontWeight:700,color:C.accent,margin:0,marginBottom:12,textTransform:"uppercase",letterSpacing:"0.04em"}}>Fixed Overhead Stress Mode</h3>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:14}}>
        {STRESS_MODES.map(mode=>{
          const isActive = inputs.fixedMktgPct === mode.fixedPct;
          return(<div key={mode.id} onClick={()=>setInputs(p=>({...p,fixedMktgPct:mode.fixedPct}))}
            style={{padding:16,borderRadius:10,cursor:"pointer",transition:"all 0.2s",
              background:isActive?`${mode.color}12`:"transparent",
              border:`2px solid ${isActive?mode.color:C.border}`,
            }}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:13,fontWeight:700,color:isActive?mode.color:C.muted}}>{mode.label}</span>
              <span style={{fontSize:18,fontWeight:700,color:mode.color,fontFamily:"'DM Mono',monospace"}}>{mode.fixedPct}%</span>
            </div>
            <div style={{fontSize:10,color:C.muted,lineHeight:1.5}}>{mode.desc}</div>
          </div>);
        })}
      </div>
    </Card>

    {/* Top metrics */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
      <Metric label="Total Marketing" value={fmt(adjustedTotalBudget)} sub={`${(adjustedTotalBudget/p.totalRevenue*100).toFixed(1)}% of rev`} color={C.accent}/>
      <Metric label="Variable (Demand)" value={fmt(variableBudget)} sub={`${inputs.variableMktgPct}% of rev`} color={C.amber}/>
      <Metric label="Programmatic" value={fmt(programmatic)} sub="Channel spend" color={C.green}/>
      <Metric label="Martech" value={fmt(martech)} sub={`${inputs.martechPctOfVariable||25}% of variable`} color={C.blue}/>
      <Metric label="Fixed Overhead" value={fmt(adjustedFixedBudget)} sub={debtTax>0?`${inputs.fixedMktgPct}% + ${debtTax}% debt`:`${inputs.fixedMktgPct}% of total mktg`} color={C.violet}/>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
      {/* Budget breakdown */}
      <Card>
        <h3 style={{fontSize:11,fontWeight:700,color:C.accent,margin:0,marginBottom:12,textTransform:"uppercase",letterSpacing:"0.04em"}}>Marketing Budget Waterfall</h3>
        {waterfallData.map((item,i)=>{
          const indent = item.name.startsWith("  ");
          const pctOfTotal = adjustedTotalBudget > 0 ? item.value / adjustedTotalBudget * 100 : 0;
          return(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",borderRadius:5,background:!indent&&i<5?C.bg:"transparent"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {indent&&<div style={{width:16}}/>}
              <div style={{width:8,height:8,borderRadius:"50%",background:item.fill}}/>
              <span style={{fontSize:indent?11:12,fontWeight:indent?400:600,color:indent?C.muted:C.text}}>{item.name.trim()}</span>
            </div>
            <div style={{textAlign:"right"}}>
              <span style={{fontSize:12,fontWeight:600,color:item.fill,fontFamily:"'DM Mono',monospace"}}>{fmt(item.value)}</span>
              <span style={{fontSize:9,color:C.dim,marginLeft:8}}>{pctOfTotal.toFixed(0)}%</span>
            </div>
          </div>);
        })}
        <div style={{height:1,background:C.border,margin:"10px 0"}}/>
        <div style={{padding:"6px 10px"}}>
          <div style={{fontSize:9,color:C.dim,marginBottom:4}}>DRIVERS</div>
          <Input compact label="Variable Mktg % Rev" value={inputs.variableMktgPct} onChange={v=>setInputs(p=>({...p,variableMktgPct:v}))} suffix="%" step={1}/>
          <Input compact label="Martech % of Variable" value={inputs.martechPctOfVariable} onChange={v=>setInputs(p=>({...p,martechPctOfVariable:v}))} suffix="%" step={5}/>
          <Input compact label="Fixed Mktg % of Total" value={inputs.fixedMktgPct} onChange={v=>setInputs(p=>({...p,fixedMktgPct:v}))} suffix="%" step={1}/>
        </div>
      </Card>

      {/* CAC Layers */}
      <Card>
        <h3 style={{fontSize:11,fontWeight:700,color:C.violet,margin:0,marginBottom:12,textTransform:"uppercase",letterSpacing:"0.04em"}}>CAC Layers (Increasing Burden)</h3>
        <div style={{fontSize:10,color:C.muted,marginBottom:14}}>Same deals, different cost denominators. Shows true acquisition cost at each burden level.</div>
        {cacLayers.map((cac,i)=>{
          const maxVal = Math.max(...cacLayers.map(c=>c.value));
          const barW = maxVal > 0 ? cac.value / maxVal * 100 : 0;
          return(<div key={cac.label} style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,fontWeight:600,color:C.text}}>{cac.label}</span>
              <span style={{fontSize:14,fontWeight:700,color:cac.color,fontFamily:"'DM Mono',monospace"}}>{fmt(cac.value)}</span>
            </div>
            <div style={{height:20,background:C.bg,borderRadius:6,overflow:"hidden",position:"relative"}}>
              <div style={{height:"100%",width:`${barW}%`,background:cac.color,borderRadius:6,opacity:0.7}}/>
            </div>
            <div style={{fontSize:9,color:C.dim,marginTop:2}}>{cac.desc}</div>
          </div>);
        })}
        <div style={{height:1,background:C.border,margin:"12px 0"}}/>
        <div style={{padding:10,background:C.bg,borderRadius:8}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:10,color:C.dim}}>CAC Payback (Programmatic)</span>
            <span style={{fontSize:12,fontWeight:700,color:s.cacPayback<18?C.green:C.rose,fontFamily:"'DM Mono',monospace"}}>{s.cacPayback.toFixed(1)} mo</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:10,color:C.dim}}>CAC Payback (Fully Burdened)</span>
            <span style={{fontSize:12,fontWeight:700,color:adjustedPayback<24?C.green:C.rose,fontFamily:"'DM Mono',monospace"}}>{adjustedPayback.toFixed(1)} mo</span>
          </div>
        </div>
      </Card>
    </div>

    {/* Tactical Debt Tax */}
    <Card style={{marginBottom:18,borderLeft:`3px solid ${C.rose}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div>
          <h3 style={{fontSize:11,fontWeight:700,color:C.rose,margin:0,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>Tactical Debt Tax</h3>
          <div style={{fontSize:10,color:C.muted,maxWidth:500}}>
            Hidden cost of accumulated GTM shortcuts — patched processes, legacy integrations, 
            manual workarounds, undocumented tribal knowledge. Applied as a surcharge on fixed overhead.
          </div>
        </div>
        <div style={{fontSize:28,fontWeight:700,color:debtTax>0?C.rose:C.dim,fontFamily:"'DM Mono',monospace"}}>{debtTax}%</div>
      </div>
      <div style={{marginBottom:14}}>
        <input type="range" min={0} max={20} step={2} value={debtTax} onChange={e=>setDebtTax(Number(e.target.value))}
          style={{width:"100%",accentColor:C.rose,height:6,cursor:"pointer"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
          <span style={{fontSize:9,color:C.dim}}>0% — Clean ops</span>
          <span style={{fontSize:9,color:C.dim}}>10% — Normal tech debt</span>
          <span style={{fontSize:9,color:C.dim}}>20% — Legacy rebuild</span>
        </div>
      </div>
      {debtTax > 0 && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          <div style={{padding:10,background:`${C.rose}08`,borderRadius:8}}>
            <div style={{fontSize:9,color:C.dim}}>Debt Tax Cost</div>
            <div style={{fontSize:16,fontWeight:700,color:C.rose,fontFamily:"'DM Mono',monospace"}}>{fmt(debtTaxAmount)}</div>
          </div>
          <div style={{padding:10,background:`${C.rose}08`,borderRadius:8}}>
            <div style={{fontSize:9,color:C.dim}}>Burdened CAC Impact</div>
            <div style={{fontSize:16,fontWeight:700,color:C.rose,fontFamily:"'DM Mono',monospace"}}>+{fmt(adjustedBurdenedCAC - p.fullyBurdenedCAC)}</div>
          </div>
          <div style={{padding:10,background:`${C.rose}08`,borderRadius:8}}>
            <div style={{fontSize:9,color:C.dim}}>Payback Impact</div>
            <div style={{fontSize:16,fontWeight:700,color:C.rose,fontFamily:"'DM Mono',monospace"}}>+{(adjustedPayback - (p.fullyBurdenedCAC/(inputs.avgDealSize/12))).toFixed(1)} mo</div>
          </div>
        </div>
      )}
    </Card>

    {/* Sensitivity: What Breaks First */}
    <Card style={{marginBottom:18}}>
      <h3 style={{fontSize:11,fontWeight:700,color:C.amber,margin:0,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>Sensitivity: What Breaks First?</h3>
      <div style={{fontSize:10,color:C.muted,marginBottom:14}}>Same variable spend, different fixed overhead assumptions{debtTax>0?` + ${debtTax}% debt tax`:""}.  Shows downstream impact on CAC, payback, margins, and required pipeline efficiency.</div>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
        <thead><tr>{["Mode","Fixed OH","Total Mktg","Burdened CAC","Payback","Op Margin","S&M %","Status"].map(h=>
          <th key={h} style={{textAlign:"right",padding:"8px 10px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",borderBottom:`2px solid ${C.border}`}}>{h}</th>
        )}</tr></thead>
        <tbody>{sensitivity.map(row=>{
          const paybackOk = row.payback < 24;
          const marginOk = row.opMargin > 0;
          const sandMOk = row.sandMPct < 60;
          const status = !marginOk ? "☠️ Negative margin" : !sandMOk ? "🔥 Burn risk" : !paybackOk ? "⚠️ Long payback" : "✅ Sustainable";
          const statusColor = !marginOk ? C.rose : !sandMOk ? C.rose : !paybackOk ? C.amber : C.green;
          return(<tr key={row.id} style={{background:row.isActive?`${row.color}08`:"transparent"}}>
            <td style={{padding:"10px",textAlign:"right"}}><span style={{fontWeight:700,color:row.color}}>{row.label}</span>{row.isActive&&<span style={{fontSize:8,color:C.dim,marginLeft:4}}>●</span>}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:C.text}}>{row.fixedPct}%</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontWeight:600,color:C.text}}>{fmt(row.totalMktg)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",fontWeight:700,color:row.cac<p.programmaticCAC*2?C.text:C.rose}}>{fmt(row.cac)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:paybackOk?C.green:C.rose}}>{row.payback.toFixed(1)} mo</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:marginOk?C.green:C.rose}}>{row.opMargin.toFixed(1)}%</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:sandMOk?C.text:C.rose}}>{row.sandMPct.toFixed(0)}%</td>
            <td style={{padding:"10px",textAlign:"right",fontSize:10,color:statusColor,fontWeight:600}}>{status}</td>
          </tr>);
        })}</tbody>
      </table></div>
    </Card>

    {/* Fixed Marketing Overhead Detail */}
    <Card style={{marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div>
          <h3 style={{fontSize:11,fontWeight:700,color:C.violet,margin:0,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>Fixed Marketing Overhead (Not in G&A)</h3>
          <div style={{fontSize:10,color:C.muted}}>Marketing-specific fixed costs — leadership, ops, staff, baseline tools. Separate from G&A (Finance, Legal, HR, IT).</div>
        </div>
        {p.fixedMktgIsFloorBound && (
          <div style={{padding:"6px 12px",borderRadius:6,background:`${C.rose}12`,border:`1px solid ${C.rose}30`}}>
            <div style={{fontSize:9,fontWeight:700,color:C.rose,textTransform:"uppercase"}}>Floor-Bound</div>
            <div style={{fontSize:10,color:C.muted}}>{p.mktgHeadcountFloor?.label}</div>
          </div>
        )}
      </div>

      {/* Compression warning */}
      {p.fixedMktgIsFloorBound && (
        <div style={{padding:14,background:`${C.amber}08`,borderRadius:10,border:`1px solid ${C.amber}20`,marginBottom:16}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{fontSize:20}}>⚠️</div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:C.amber,marginBottom:4}}>Fixed Cost Compression Active</div>
              <div style={{fontSize:10,color:C.muted,lineHeight:1.6}}>
                Headcount floor ({fmt(p.floorTotal)}) exceeds the formula-based overhead ({fmt(p.fixedMktg > p.floorTotal ? p.fixedMktg : Math.round(variableBudget * (inputs.fixedMktgPct / 100) / (1 - inputs.fixedMktgPct / 100)))}).
                At {fmt(s.targetARR)} ARR, fixed marketing consumes <strong style={{color:C.rose}}>{p.floorPctOfRev?.toFixed(1)}% of revenue</strong> — 
                the VP alone is {((p.leadershipInMktg||455000) / p.totalRevenue * 100).toFixed(1)}%.
                Effective fixed overhead is {p.effectiveFixedMktgPct?.toFixed(0)}%, not the {inputs.fixedMktgPct}% set in the stress mode.
              </div>
              <div style={{marginTop:8,fontSize:10,color:C.muted}}>
                This compression resolves around $15-20M ARR where leadership comp drops below 3% of revenue. Until then, every demand gen dollar carries disproportionate overhead burden.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scaling curve */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:8}}>VP Marketing as % of Revenue — Fully Loaded ({fmt(p.leadershipInMktg||455000)})</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
          {[{arr:3},{arr:5},{arr:10},{arr:20},{arr:40}].map(pt=>{
            const vpLoaded = p.leadershipInMktg || 455000;
            const pct = (vpLoaded / (pt.arr * 1000000) * 100).toFixed(1);
            const isClose = Math.abs(s.targetARR / 1000000 - pt.arr) < pt.arr * 0.3;
            return(<div key={pt.arr} style={{padding:8,background:isClose?`${C.accent}12`:C.bg,borderRadius:6,textAlign:"center",border:isClose?`1px solid ${C.accent}30`:"1px solid transparent"}}>
              <div style={{fontSize:9,color:C.dim}}>${pt.arr}M ARR</div>
              <div style={{fontSize:16,fontWeight:700,color:parseFloat(pct)>5?C.rose:parseFloat(pct)>2?C.amber:C.green,fontFamily:"'DM Mono',monospace"}}>{pct}%</div>
              <div style={{fontSize:8,color:C.dim}}>of revenue</div>
            </div>);
          })}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:`repeat(${fixedItems.length},1fr)`,gap:12}}>
        {fixedItems.map((fi,i)=>(
          <div key={fi.name} style={{padding:14,background:C.bg,borderRadius:10,borderLeft:`3px solid ${C.violet}`}}>
            <div style={{fontSize:12,fontWeight:700,color:C.violet,marginBottom:4}}>{fi.name}</div>
            <div style={{fontSize:18,fontWeight:700,color:C.text,fontFamily:"'DM Mono',monospace"}}>{fmt(fi.amount)}</div>
            <div style={{fontSize:9,color:C.dim,marginTop:4}}>{fi.pct}% of fixed mktg • {fi.desc}</div>
            {fi.isFloorBound && <div style={{marginTop:4,fontSize:8,color:C.amber,fontWeight:600}}>▲ FLOOR — comp doesn't compress</div>}
          </div>
        ))}
      </div>
      <div style={{marginTop:12,padding:10,background:`${C.violet}08`,borderRadius:8,border:`1px solid ${C.violet}15`}}>
        <div style={{fontSize:10,color:C.muted}}>
          <strong style={{color:C.violet}}>Why separate from G&A?</strong> G&A covers Finance, Legal, HR, Exec, IT — shared services that exist regardless of GTM motion. 
          Fixed marketing overhead is marketing-specific infrastructure that enables demand gen but doesn't scale per-lead. 
          Cutting fixed marketing impairs pipeline generation capability even if variable spend is maintained.
        </div>
      </div>
    </Card>
  </div>);
}

// ════════════════════════════════════════════════════════════
// TARGET TRACKER
// ════════════════════════════════════════════════════════════
function TargetTrackerPage({model,inputs}){
  const[view,setView]=useState("quarterly");
  const{summary:s,quarterlyTargets,glideslope,monthly}=model;
  const annT=s.newARRNeeded,annP=monthly[11]?.cumulativeNewARR||0,annG=annP-annT;
  const isSplit=inputs.revenueMode==="split";
  const mktgPct=inputs.mktgSourcedPct;
  return(<div>
    <Header title="Target Tracker" sub="ARR targets + pipeline targets by source and stage" icon={Target}/>
    {isSplit&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
      <Card style={{borderLeft:`3px solid ${C.accent}`}}><div style={{fontSize:10,color:C.dim,textTransform:"uppercase",fontWeight:700,marginBottom:6}}>New Logo</div><div style={{fontSize:22,fontWeight:700,color:C.accent,fontFamily:"'DM Mono',monospace"}}>{fmt(s.newLogoARR)}</div><div style={{fontSize:10,color:C.muted,marginTop:4}}>{fN(s.dealsNeeded)} deals × {fmt(inputs.avgDealSize)}</div></Card>
      <Card style={{borderLeft:`3px solid ${C.violet}`}}><div style={{fontSize:10,color:C.dim,textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Expansion</div><div style={{fontSize:22,fontWeight:700,color:C.violet,fontFamily:"'DM Mono',monospace"}}>{fmt(s.expansionARR)}</div><div style={{fontSize:10,color:C.muted,marginTop:4}}>{fN(s.expansionDeals)} deals × {fmt(inputs.expansionAvgDeal)} • {inputs.expansionSqoToWon}% close</div></Card>
    </div>}
    <div style={{display:"flex",gap:8,marginBottom:24}}>
      {["quarterly","pipeline","annual"].map(v=>(<button key={v} onClick={()=>setView(v)} style={{padding:"8px 18px",borderRadius:8,border:`1px solid ${view===v?C.accent:C.border}`,background:view===v?C.accentD:"transparent",color:view===v?C.accent:C.muted,cursor:"pointer",fontSize:12,fontWeight:600,textTransform:"capitalize",fontFamily:"'DM Sans',sans-serif"}}>{v}</button>))}
    </div>

    {/* ── PIPELINE VIEW ── */}
    {view==="pipeline"&&(<div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14,marginBottom:20}}>
        <Metric label="Annual Pipe Target" value={fmt(s.pipelineRequired)} sub={`${inputs.pipelineCoverage}% coverage`} color={C.accent}/>
        <Metric label="Mktg-Sourced" value={`${mktgPct}%`} sub={fmt(s.pipelineRequired*(mktgPct/100))} color={C.green}/>
        <Metric label="AE-Sourced" value={`${100-mktgPct}%`} sub={fmt(s.pipelineRequired*((100-mktgPct)/100))} color={C.violet}/>
        <Metric label="Stage 2 (Forecastable)" value={fmt(s.stage2Pipeline)} sub={`${fN(s.sqosNeeded)} SQOs`} color={C.amber}/>
      </div>

      {/* Quarterly pipeline targets table */}
      <Card style={{marginBottom:18}}>
        <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Quarterly Pipeline Targets by Source</h3>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
          <thead><tr>{["","Deals","SQOs","Mktg SQOs","AE SQOs","Stage 2 Pipe","Stage 1 Pipe","Total Pipe","Mktg Pipe","AE Pipe","Coverage"].map(h=><th key={h} style={{textAlign:"right",padding:"8px 10px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",borderBottom:`2px solid ${C.border}`}}>{h}</th>)}</tr></thead>
          <tbody>{quarterlyTargets.map((q,i)=>(
            <tr key={q.quarter}>
              <td style={{padding:"10px",fontWeight:700,color:C.ch[i],fontSize:13,textAlign:"right"}}>{q.quarter}</td>
              <td style={{padding:"10px",color:C.text,fontFamily:"'DM Mono',monospace",textAlign:"right",fontWeight:600}}>{fN(q.dealsTarget)}</td>
              <td style={{padding:"10px",color:C.text,fontFamily:"'DM Mono',monospace",textAlign:"right",fontWeight:600}}>{fN(q.sqoTarget)}</td>
              <td style={{padding:"10px",color:C.green,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>{fN(q.mktgSqoTarget)}</td>
              <td style={{padding:"10px",color:C.violet,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>{fN(q.aeSqoTarget)}</td>
              <td style={{padding:"10px",color:C.green,fontFamily:"'DM Mono',monospace",textAlign:"right",fontWeight:600}}>{fmt(q.stage2Target)}</td>
              <td style={{padding:"10px",color:C.amber,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>{fmt(q.stage1Target)}</td>
              <td style={{padding:"10px",color:C.accent,fontFamily:"'DM Mono',monospace",textAlign:"right",fontWeight:700}}>{fmt(q.pipeTarget)}</td>
              <td style={{padding:"10px",color:C.green,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>{fmt(q.mktgPipeTarget)}</td>
              <td style={{padding:"10px",color:C.violet,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>{fmt(q.aePipeTarget)}</td>
              <td style={{padding:"10px",textAlign:"right"}}><span style={{padding:"3px 8px",borderRadius:12,fontSize:10,fontWeight:700,background:q.coverageActual>=inputs.coverageGreen?C.greenD:q.coverageActual>=inputs.coverageYellow?C.amberD:C.roseD,color:q.coverageActual>=inputs.coverageGreen?C.green:q.coverageActual>=inputs.coverageYellow?C.amber:C.rose}}>{q.coverageActual.toFixed(0)}%</span></td>
            </tr>
          ))}</tbody>
        </table></div>
      </Card>

      {/* Pipeline charts */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card>
          <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Pipeline by Source (Quarterly)</h3>
          <ResponsiveContainer width="100%" height={280}><BarChart data={quarterlyTargets}><CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="quarter" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickFormatter={v=>fmt(v)} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
            <Bar dataKey="mktgPipeTarget" stackId="pipe" fill={C.green} radius={[0,0,0,0]} name="Marketing Sourced" opacity={0.8}/>
            <Bar dataKey="aePipeTarget" stackId="pipe" fill={C.violet} radius={[4,4,0,0]} name="AE Sourced" opacity={0.8}/>
          </BarChart></ResponsiveContainer>
        </Card>
        <Card>
          <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Stage 1 vs Stage 2 Targets</h3>
          <ResponsiveContainer width="100%" height={280}><BarChart data={quarterlyTargets}><CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="quarter" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickFormatter={v=>fmt(v)} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
            <Bar dataKey="stage1Target" fill={C.amberD} stroke={C.amber} strokeWidth={1} radius={[4,4,0,0]} name="Stage 1 (Discovery)"/>
            <Bar dataKey="stage2Target" fill={C.greenD} stroke={C.green} strokeWidth={1} radius={[4,4,0,0]} name="Stage 2 (Forecastable)"/>
          </BarChart></ResponsiveContainer>
        </Card>
      </div>

      {/* SQO sourcing breakdown */}
      <Card style={{marginTop:16}}>
        <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Quarterly SQO Targets by Source</h3>
        <ResponsiveContainer width="100%" height={240}><BarChart data={quarterlyTargets}><CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="quarter" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
          <Bar dataKey="mktgSqoTarget" stackId="sqo" fill={C.green} name="Mktg SQOs" opacity={0.85}/>
          <Bar dataKey="aeSqoTarget" stackId="sqo" fill={C.violet} radius={[4,4,0,0]} name="AE SQOs" opacity={0.85}/>
        </BarChart></ResponsiveContainer>
      </Card>
    </div>)}

    {/* ── ANNUAL VIEW ── */}
    {view==="annual"&&(<div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14,marginBottom:24}}>
        <Metric label="Annual Target" value={fmt(annT)} color={C.amber}/><Metric label="Projected" value={fmt(annP)} color={C.accent}/><Metric label="Gap" value={fmt(annG)} color={annG>=0?C.green:C.rose}/><Metric label="Attainment" value={`${(annP/annT*100).toFixed(0)}%`} color={annP>=annT?C.green:C.rose}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Stage 1 vs Stage 2 Pipeline</h3>
          <ResponsiveContainer width="100%" height={280}><ComposedChart data={monthly}><CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="month" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickFormatter={v=>fmt(v)} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
            <Bar dataKey="stage1Pipe" fill={C.amberD} stroke={C.amber} strokeWidth={1} radius={[4,4,0,0]} name="Stage 1"/><Bar dataKey="stage2Pipe" fill={C.greenD} stroke={C.green} strokeWidth={1} radius={[4,4,0,0]} name="Stage 2"/>
          </ComposedChart></ResponsiveContainer></Card>
        <Card><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Cumulative New ARR vs Target</h3>
          <ResponsiveContainer width="100%" height={280}><ComposedChart data={glideslope}><CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="month" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickFormatter={v=>fmt(v)} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
            <Area type="monotone" dataKey="cumulativeNewARR" stroke={C.green} fill={C.greenD} strokeWidth={2} name="Cumulative"/><Line type="monotone" dataKey="targetARR" stroke={C.amber} strokeWidth={2} strokeDasharray="8 4" dot={false} name="Target"/>
          </ComposedChart></ResponsiveContainer></Card>
      </div>
    </div>)}

    {/* ── QUARTERLY VIEW ── */}
    {view==="quarterly"&&(<div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
        {quarterlyTargets.map((q,i)=>(<Card key={q.quarter} style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:C.ch[i],marginBottom:4}}>{q.quarter}</div><div style={{fontSize:9,color:C.dim,marginBottom:6}}>{q.seasonalPct}% of annual</div><div style={{fontSize:10,color:C.dim,textTransform:"uppercase",marginBottom:4}}>Target</div><div style={{fontSize:16,fontWeight:700,color:C.text,fontFamily:"'DM Mono',monospace"}}>{fmt(q.target)}</div><div style={{height:1,background:C.border,margin:"10px 0"}}/><div style={{fontSize:10,color:C.dim,textTransform:"uppercase",marginBottom:4}}>Projected</div><div style={{fontSize:16,fontWeight:700,color:q.actual>=q.target?C.green:C.amber,fontFamily:"'DM Mono',monospace"}}>{fmt(q.actual)}</div><div style={{marginTop:8,padding:"4px 12px",borderRadius:20,display:"inline-block",fontSize:10,fontWeight:700,background:q.gap>=0?C.greenD:C.roseD,color:q.gap>=0?C.green:C.rose}}>{q.pctOfTarget.toFixed(0)}%</div></Card>))}
      </div>
      <Card><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Quarterly: Target vs Projected</h3>
        <ResponsiveContainer width="100%" height={280}><BarChart data={quarterlyTargets}><CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="quarter" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickFormatter={v=>fmt(v)} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
          <Bar dataKey="target" fill={C.amberD} stroke={C.amber} strokeWidth={1} radius={[4,4,0,0]} name="Target"/><Bar dataKey="actual" fill={C.greenD} stroke={C.green} strokeWidth={1} radius={[4,4,0,0]} name="Projected"/>
        </BarChart></ResponsiveContainer></Card>
    </div>)}

    <Card style={{marginTop:18}}>
      <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:12}}>Pipeline Quality Rules</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{padding:16,background:C.bg,borderRadius:10,border:`1px solid ${C.amber}22`}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><Shield size={14} style={{color:C.amber}}/><span style={{fontSize:12,fontWeight:700,color:C.amber}}>Stage 1 — Discovery</span></div><div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>Non-forecastable. Amount ≥ {inputs.stage1MinPct}% of ADS ({fmt(model.summary.stage1MinAmount)}). Tracks early engagement without inflating forecast.</div></div>
        <div style={{padding:16,background:C.bg,borderRadius:10,border:`1px solid ${C.green}22`}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><Shield size={14} style={{color:C.green}}/><span style={{fontSize:12,fontWeight:700,color:C.green}}>Stage 2 — SQO (Forecastable)</span></div><div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>Board-safe pipeline. AE manually promoted. Discovery held, buyer confirmed, realistic amount. No auto-promotion.</div></div>
      </div>
    </Card>
  </div>);
}

// ════════════════════════════════════════════════════════════
// REMAINING PAGES (Sales, Funnel, Channels, Pipeline, Velocity, Ramp, P&L, Glideslope, QBR, Weekly)
// ════════════════════════════════════════════════════════════
function SalesPage({model,inputs,setInputs}){
  const{summary:s,monthly}=model;
  return(<div><Header title="Sales Model" sub="AE capacity, quota, attrition, and pipeline sourcing" icon={Users}/>
    <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:24}}>
      <Card><h3 style={{fontSize:12,fontWeight:700,color:C.accent,margin:0,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.06em"}}>Drivers</h3>
        <Input label="AEs" value={inputs.aeCount} onChange={v=>setInputs(p=>({...p,aeCount:v}))} min={1}/><Input label="Quota / AE" value={inputs.aeQuota} onChange={v=>setInputs(p=>({...p,aeQuota:v}))} prefix="$" step={25000}/><Input label="Ramp" value={inputs.aeRampMonths} onChange={v=>setInputs(p=>({...p,aeRampMonths:v}))} suffix="mo" min={1} max={12}/><Input label="Attrition" value={inputs.aeAttritionRate} onChange={v=>setInputs(p=>({...p,aeAttritionRate:v}))} suffix="% yr" step={5}/><Input label="SDRs/AE" value={inputs.sdrsPerAe} onChange={v=>setInputs(p=>({...p,sdrsPerAe:v}))} step={0.5}/><div style={{height:1,background:C.border,margin:"10px 0"}}/><Input label="SQO→Won" value={inputs.sqoToWonRate} onChange={v=>setInputs(p=>({...p,sqoToWonRate:v}))} suffix="%" min={1} max={100}/><Input label="Avg Deal" value={inputs.avgDealSize} onChange={v=>setInputs(p=>({...p,avgDealSize:v}))} prefix="$" step={5000}/><Input label="Mktg Sourced" value={inputs.mktgSourcedPct} onChange={v=>setInputs(p=>({...p,mktgSourcedPct:v}))} suffix="%" min={10} max={100} step={5}/>
      </Card>
      <div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
          <Metric label="AE Capacity" value={fmt(inputs.aeCount*inputs.aeQuota)} sub={`${inputs.aeCount} AEs`} color={C.accent}/>
          <Metric label="Attrition Loss" value={fmt(s.totalAttrLoss)} sub={`${inputs.aeAttritionRate}% annual`} color={s.totalAttrLoss>0?C.rose:C.green}/>
          <Metric label="Deals to Close" value={fN(s.dealsNeeded)} sub={`${fN(s.mktgSQOs)} mktg + ${fN(s.aeSelfSourcedSQOs)} AE SQOs`} color={C.green}/>
          <Metric label="Attainment Req'd" value={`${s.attainmentRequired.toFixed(0)}%`} color={s.attainmentRequired<=100?C.green:C.rose}/>
        </div>
        {/* Pipeline Sourcing Split */}
        <Card style={{marginBottom:16}}>
          <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:12}}>Pipeline Sourcing</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{padding:14,background:C.bg,borderRadius:10,textAlign:"center"}}>
              <div style={{fontSize:9,fontWeight:700,color:C.accent,textTransform:"uppercase",letterSpacing:"0.04em"}}>Marketing Sourced</div>
              <div style={{fontSize:26,fontWeight:700,color:C.text,marginTop:4}}>{inputs.mktgSourcedPct}%</div>
              <div style={{fontSize:10,color:C.muted,marginTop:4}}>{fN(s.mktgSQOs)} SQOs → {fN(s.mktgInquiriesNeeded)} inquiries</div>
            </div>
            <div style={{padding:14,background:C.bg,borderRadius:10,textAlign:"center"}}>
              <div style={{fontSize:9,fontWeight:700,color:C.violet,textTransform:"uppercase",letterSpacing:"0.04em"}}>AE Self-Sourced</div>
              <div style={{fontSize:26,fontWeight:700,color:C.text,marginTop:4}}>{100-inputs.mktgSourcedPct}%</div>
              <div style={{fontSize:10,color:C.muted,marginTop:4}}>{fN(s.aeSelfSourcedSQOs)} SQOs (outbound, referral, partner)</div>
            </div>
          </div>
        </Card>
        <Card><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Capacity vs New ARR</h3>
          <ResponsiveContainer width="100%" height={300}><ComposedChart data={monthly}><CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="month" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickFormatter={v=>fmt(v)} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
            <Bar dataKey="fullCapacity" fill={C.blueD} stroke={C.blue} strokeWidth={1} radius={[4,4,0,0]} name="Capacity"/><Bar dataKey="monthlyNewARR" fill={C.greenD} stroke={C.green} strokeWidth={1} radius={[4,4,0,0]} name="New ARR"/><Line type="monotone" dataKey="pipeline" stroke={C.amber} strokeWidth={2} dot={false} name="SQO Pipeline"/>
          </ComposedChart></ResponsiveContainer></Card>
      </div>
    </div>
  </div>);
}

function FunnelPage({model,inputs,setInputs}){
  const{stages,monthly,phaseShiftedFunnel,summary:s}=model;
  return(<div><Header title="Marketing Funnel" sub="Inverse model — marketing-sourced pipeline with phase-shifted timeline" icon={Megaphone}/>
    <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:24}}>
      <Card><h3 style={{fontSize:12,fontWeight:700,color:C.accent,margin:0,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.06em"}}>Lifecycle Gates</h3>
        <Input label="Inquiry → MQL" value={inputs.inquiryToMqlRate} onChange={v=>setInputs(p=>({...p,inquiryToMqlRate:v}))} suffix="%"/><Input label="MQL → SQL" value={inputs.mqlToSqlRate} onChange={v=>setInputs(p=>({...p,mqlToSqlRate:v}))} suffix="%"/><Input label="SQL → Meeting" value={inputs.sqlToMeetingRate} onChange={v=>setInputs(p=>({...p,sqlToMeetingRate:v}))} suffix="%"/><Input label="Meeting → SQO" value={inputs.meetingToSqoRate} onChange={v=>setInputs(p=>({...p,meetingToSqoRate:v}))} suffix="%"/><Input label="SQO → Won" value={inputs.sqoToWonRate} onChange={v=>setInputs(p=>({...p,sqoToWonRate:v}))} suffix="%"/>
        <div style={{height:1,background:C.border,margin:"10px 0"}}/>
        <Input label="Mktg Sourced %" value={inputs.mktgSourcedPct} onChange={v=>setInputs(p=>({...p,mktgSourcedPct:v}))} suffix="%" min={10} max={100} step={5}/>
        <Input label="SQO Lead Time" value={inputs.sqoLeadQuarters} onChange={v=>setInputs(p=>({...p,sqoLeadQuarters:v}))} suffix="Qtrs" min={1} max={4}/>
        <Input label="MQL Lead Time" value={inputs.mqlLeadQuarters} onChange={v=>setInputs(p=>({...p,mqlLeadQuarters:v}))} suffix="Qtrs" min={1} max={3}/>
        <div style={{marginTop:12,padding:12,background:C.bg,borderRadius:8,textAlign:"center"}}><div style={{fontSize:10,color:C.dim,textTransform:"uppercase"}}>Mktg Inquiry-to-Close</div><div style={{fontSize:28,fontWeight:700,color:C.accent}}>{fP(s.effectiveFunnelYield)}</div><div style={{fontSize:10,color:C.dim,marginTop:4}}>{fN(s.mktgInquiriesNeeded)} mktg inquiries needed</div></div>
      </Card>
      <div>
        {/* Funnel waterfall — now shows mktg-sourced counts */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8,marginBottom:20}}>
          {stages.map((st,i)=>(<div key={st.name} style={{position:"relative"}}><div style={{background:`${C.ch[i]}10`,border:`1px solid ${C.ch[i]}25`,borderRadius:10,padding:"14px 8px",textAlign:"center"}}><div style={{fontSize:8,fontWeight:700,color:C.ch[i],textTransform:"uppercase",letterSpacing:"0.04em"}}>{st.name}</div><div style={{fontSize:20,fontWeight:700,color:C.text,marginTop:5}}>{fN(st.count)}</div>{st.mktgCount!=null&&st.mktgCount!==st.count&&<div style={{fontSize:9,color:C.accent,marginTop:2}}>mktg: {fN(st.mktgCount)}</div>}<div style={{fontSize:8,color:C.dim,marginTop:2}}>{st.owner}</div>{i<stages.length-1&&<div style={{fontSize:9,color:C.muted,marginTop:3}}>{st.nextRate}%→</div>}</div>{i<stages.length-1&&<div style={{position:"absolute",right:-6,top:"50%",transform:"translateY(-50%)",zIndex:2}}><ChevronRight size={12} style={{color:C.dim}}/></div>}</div>))}
        </div>

        {/* Phase-Shifted Funnel Timeline */}
        {phaseShiftedFunnel && phaseShiftedFunnel.length > 0 && (
          <Card style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0}}>Phase-Shifted Pipeline Timeline</h3>
              <Badge label={`${inputs.sqoLeadQuarters}Q SQO + ${inputs.mqlLeadQuarters}Q MQL lead`} status="neutral"/>
            </div>
            <div style={{fontSize:10,color:C.dim,marginBottom:12}}>
              When activities must happen to support quarterly deal targets. SQOs needed {inputs.sqoLeadQuarters}Q before close; MQLs needed {inputs.mqlLeadQuarters}Q before SQO creation.
            </div>
            <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
              <thead><tr>{["Quarter","Deals Close","SQOs Needed","Mktg SQOs","AE SQOs","MQLs Needed"].map(h=><th key={h} style={{textAlign:"right",padding:"8px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",borderBottom:`1px solid ${C.border}`}}>{h}</th>)}</tr></thead>
              <tbody>{phaseShiftedFunnel.map((q,i)=>(
                <tr key={q.quarter} style={{background:q.isCurrentYear?"transparent":C.bg}}>
                  <td style={{padding:"8px",fontWeight:700,color:q.isCurrentYear?C.accent:C.dim,textAlign:"right"}}>{q.quarter}</td>
                  <td style={{padding:"8px",color:q.closingDeals>0?C.green:C.dim,fontWeight:700,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>{q.closingDeals>0?fN(q.closingDeals):"-"}</td>
                  <td style={{padding:"8px",color:q.sqosNeeded>0?C.amber:C.dim,fontWeight:600,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>{q.sqosNeeded>0?fN(q.sqosNeeded):"-"}</td>
                  <td style={{padding:"8px",color:q.mktgSqos>0?C.accent:C.dim,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>{q.mktgSqos>0?fN(q.mktgSqos):"-"}</td>
                  <td style={{padding:"8px",color:q.aeSqos>0?C.violet:C.dim,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>{q.aeSqos>0?fN(q.aeSqos):"-"}</td>
                  <td style={{padding:"8px",color:q.mqlsNeeded>0?C.rose:C.dim,fontWeight:600,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>{q.mqlsNeeded>0?fN(q.mqlsNeeded):"-"}</td>
                </tr>
              ))}</tbody>
            </table></div>
          </Card>
        )}

        <Card><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Monthly Volume</h3>
          <ResponsiveContainer width="100%" height={280}><BarChart data={monthly}><CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="month" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
            <Bar dataKey="monthlyInquiries" fill={C.ch[0]} radius={[3,3,0,0]} name="Inquiries" opacity={0.85}/><Bar dataKey="monthlyMQLs" fill={C.ch[1]} radius={[3,3,0,0]} name="MQLs" opacity={0.85}/><Bar dataKey="monthlySQLs" fill={C.ch[2]} radius={[3,3,0,0]} name="SQLs" opacity={0.85}/><Bar dataKey="monthlyMeetings" fill={C.ch[3]} radius={[3,3,0,0]} name="Meetings" opacity={0.85}/><Bar dataKey="monthlySQOs" fill={C.ch[4]} radius={[3,3,0,0]} name="SQOs" opacity={0.85}/><Bar dataKey="monthlyDeals" fill={C.ch[5]} radius={[3,3,0,0]} name="Won" opacity={0.85}/>
          </BarChart></ResponsiveContainer></Card>
      </div>
    </div>
  </div>);
}

function ChannelsPage({model,inputs,setInputs}){
  const{channels}=model;const uM=(ch,v)=>setInputs(p=>({...p,channelMix:{...p.channelMix,[ch]:v}}));const uC=(ch,v)=>setInputs(p=>({...p,channelCPL:{...p.channelCPL,[ch]:v}}));
  return(<div><Header title="Channel Mix" sub="Inquiry-to-revenue ROI by channel" icon={Layers}/>
    <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:24}}>
      <Card>{Object.entries(inputs.channelMix).map(([ch,pct],i)=>(<div key={ch} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:7,height:7,borderRadius:"50%",background:C.ch[i]}}/><span style={{fontSize:11,fontWeight:600,color:C.text}}>{ch}</span></div><span style={{fontSize:11,color:C.accent,fontFamily:"'DM Mono',monospace"}}>{pct}%</span></div>
        <input type="range" min={0} max={60} value={pct} onChange={e=>uM(ch,parseInt(e.target.value))} style={{width:"100%",accentColor:C.ch[i]}}/><div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}><span style={{fontSize:9,color:C.dim}}>CPL $</span><input type="number" value={inputs.channelCPL[ch]||0} onChange={e=>uC(ch,parseInt(e.target.value))} style={{width:55,background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,padding:"2px 5px",color:C.text,fontSize:10,fontFamily:"'DM Mono',monospace"}}/></div></div>))}</Card>
      <Card><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:12}}>Full Lifecycle by Channel</h3>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
          <thead><tr>{["Channel","Inq","CPL","Spend","MQLs","SQLs","Mtgs","SQOs","Won","Rev","ROI"].map(h=><th key={h} style={{textAlign:"right",padding:"7px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",borderBottom:`1px solid ${C.border}`}}>{h}</th>)}</tr></thead>
          <tbody>{channels.map((c,i)=><tr key={c.name}><td style={{padding:"7px",textAlign:"right"}}><div style={{display:"flex",alignItems:"center",gap:5,justifyContent:"flex-end"}}><div style={{width:5,height:5,borderRadius:"50%",background:C.ch[i]}}/><span style={{color:C.text,fontWeight:600}}>{c.name}</span></div></td>
            {[fN(c.channelInquiries),fmt(c.cpl),fmt(c.spend),fN(c.mqls),fN(c.sqls),fN(c.meetings),fN(c.sqos),fN(c.deals)].map((v,j)=><td key={j} style={{padding:"7px",color:C.muted,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>{v}</td>)}<td style={{padding:"7px",color:C.green,fontWeight:600,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>{fmt(c.revenue)}</td><td style={{padding:"7px",fontWeight:700,fontFamily:"'DM Mono',monospace",textAlign:"right",color:c.roi>5?C.green:c.roi>2?C.amber:C.rose}}>{c.roi.toFixed(1)}x</td></tr>)}</tbody>
        </table></div></Card>
    </div>
  </div>);
}

function PipelinePage({model,inputs}){
  const{stages,summary:s,pnl:p,channels}=model;
  const totalChannelSpend = channels.reduce((sum,c) => sum + c.spend, 0);
  const blendedCPL = s.inquiriesNeeded > 0 ? totalChannelSpend / s.inquiriesNeeded : 0;
  // Cost to generate each stage volume from demand gen spend
  const stageCosts = stages.map((st,i) => {
    const costPer = st.count > 0 ? totalChannelSpend / st.count : 0;
    return { ...st, costPer, totalCost: i === 0 ? totalChannelSpend : costPer * st.count };
  });
  // Budget context
  const demandGenBudget = p.variableMktg;
  const afterFixed = p.totalMktgBudget - p.fixedMktg;
  const fixedPctActual = p.totalMktgBudget > 0 ? p.fixedMktg / p.totalMktgBudget * 100 : 0;

  return(<div><Header title="Pipeline" sub="Lifecycle waterfall — volume, cost per stage, budget context" icon={GitBranch}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:12,marginBottom:20}}>
      <Metric label="SQO Pipeline" value={fmt(s.stage2Pipeline)} sub="Forecastable" color={C.green}/>
      <Metric label="Stage 1 Pipeline" value={fmt(s.stage1Pipeline)} sub="Non-forecastable" color={C.amber}/>
      <Metric label="Funnel Yield" value={`${(s.effectiveFunnelYield*100).toFixed(2)}%`} sub={`${Math.round(1/s.effectiveFunnelYield)}:1 inq/deal`} color={C.accent}/>
      <Metric label="Demand Gen Budget" value={fmt(demandGenBudget)} sub={`${inputs.variableMktgPct}% of rev`} color={C.blue}/>
      <Metric label="Blended CPL" value={fmt(blendedCPL)} sub="Channel spend ÷ inquiries" color={C.ch[0]}/>
    </div>

    {/* Budget flow: total → fixed absorbed → demand gen → what it buys */}
    <Card style={{marginBottom:18}}>
      <h3 style={{fontSize:11,fontWeight:700,color:C.accent,margin:0,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.04em"}}>Budget → Pipeline Flow</h3>
      <div style={{display:"flex",alignItems:"center",gap:0}}>
        {[
          {label:"Total Mktg", value:p.totalMktgBudget, color:C.accent, sub:`${(p.totalMktgBudget/p.totalRevenue*100).toFixed(0)}% rev`},
          {label:"Fixed Absorbed", value:p.fixedMktg, color:C.violet, sub:`${fixedPctActual.toFixed(0)}% overhead`, negative:true},
          {label:"Demand Gen", value:afterFixed, color:C.amber, sub:"variable budget"},
          {label:"Martech Tax", value:p.martechSpend, color:C.blue, sub:`${inputs.martechPctOfVariable||25}%`, negative:true},
          {label:"Channel Spend", value:p.programmaticBudget, color:C.green, sub:"buys inquiries"},
        ].map((step,i,arr)=>(
          <div key={step.label} style={{display:"flex",alignItems:"center",flex:1,gap:0}}>
            <div style={{flex:1,padding:12,background:`${step.color}08`,borderRadius:10,border:`1px solid ${step.color}20`,textAlign:"center",position:"relative"}}>
              {step.negative && <div style={{position:"absolute",top:4,right:8,fontSize:9,color:C.rose,fontWeight:700}}>−</div>}
              <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",fontWeight:700}}>{step.label}</div>
              <div style={{fontSize:16,fontWeight:700,color:step.color,fontFamily:"'DM Mono',monospace",marginTop:4}}>{fmt(step.value)}</div>
              <div style={{fontSize:9,color:C.muted,marginTop:2}}>{step.sub}</div>
            </div>
            {i<arr.length-1 && <div style={{padding:"0 4px",color:C.dim,fontSize:14}}>→</div>}
          </div>
        ))}
      </div>
      {p.fixedMktgIsFloorBound && (
        <div style={{marginTop:10,padding:8,background:`${C.amber}08`,borderRadius:6,border:`1px solid ${C.amber}15`}}>
          <span style={{fontSize:10,color:C.amber,fontWeight:600}}>⚠ Floor-bound:</span>
          <span style={{fontSize:10,color:C.muted,marginLeft:6}}>
            Headcount floor ({fmt(p.floorTotal)}) exceeds formula overhead. VP alone = {((p.leadershipInMktg||455000)/p.totalRevenue*100).toFixed(1)}% of revenue. 
            Only {fmt(p.programmaticBudget)} reaches channel spend — {(p.programmaticBudget/p.totalMktgBudget*100).toFixed(0)}% of total marketing budget actually buys pipeline.
          </span>
        </div>
      )}
    </Card>

    {/* Funnel waterfall with cost per stage */}
    <Card style={{marginBottom:18}}>
      <h3 style={{fontSize:11,fontWeight:700,color:C.dim,margin:0,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.04em"}}>Funnel Waterfall — Volume & Unit Economics</h3>
      {stageCosts.map((st,i)=>{
        const w = stages[0].count > 0 ? (st.count/stages[0].count)*100 : 0;
        return(<div key={st.name} style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:4}}>
            <div>
              <span style={{fontSize:13,fontWeight:700,color:C.text}}>{st.name}</span>
              <span style={{fontSize:9,color:C.dim,marginLeft:8}}>{st.question} • {st.owner}</span>
            </div>
            <div style={{textAlign:"right"}}>
              <span style={{fontSize:14,fontWeight:700,color:C.ch[i],fontFamily:"'DM Mono',monospace"}}>{fN(st.count)}</span>
              <span style={{fontSize:10,color:C.muted,marginLeft:10}}>{fmt(st.costPer)}/ea</span>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{flex:1,height:28,background:C.bg,borderRadius:6,overflow:"hidden",position:"relative"}}>
              <motion.div initial={{width:0}} animate={{width:`${Math.max(w,2)}%`}} transition={{duration:0.6,delay:i*0.08}}
                style={{height:"100%",background:`linear-gradient(90deg,${C.ch[i]},${C.ch[i]}66)`,borderRadius:6,display:"flex",alignItems:"center",paddingLeft:10}}>
                <span style={{fontSize:9,fontWeight:700,color:"#fff"}}>{w.toFixed(0)}%</span>
              </motion.div>
            </div>
            <div style={{width:80,textAlign:"right",fontSize:10,color:C.dim,fontFamily:"'DM Mono',monospace"}}>
              {i===0 ? fmt(totalChannelSpend) : ""}
            </div>
          </div>
          {i<stages.length-1&&<div style={{fontSize:9,color:C.dim,textAlign:"right",marginTop:2}}>{st.nextRate}% → {stages[i+1].name}</div>}
        </div>);
      })}
    </Card>

    {/* Unit economics summary */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
      <Card>
        <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Cost to Generate Pipeline</div>
        {[
          {label:"Per Inquiry", value: blendedCPL, bench:"$80-150 cyber"},
          {label:"Per MQL", value: s.mqlsNeeded > 0 ? totalChannelSpend / s.mqlsNeeded : 0, bench:"$250-500 mid-market"},
          {label:"Per SQL", value: s.sqlsNeeded > 0 ? totalChannelSpend / s.sqlsNeeded : 0, bench:"$600-1200"},
          {label:"Per Meeting", value: s.meetingsNeeded > 0 ? totalChannelSpend / s.meetingsNeeded : 0, bench:"$800-1500"},
          {label:"Per SQO", value: s.sqosNeeded > 0 ? totalChannelSpend / s.sqosNeeded : 0, bench:"$8K-15K cyber"},
        ].map(r=>(
          <div key={r.label} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
            <div><span style={{fontSize:11,color:C.text}}>{r.label}</span><span style={{fontSize:8,color:C.dim,marginLeft:6}}>{r.bench}</span></div>
            <span style={{fontSize:12,fontWeight:700,color:C.accent,fontFamily:"'DM Mono',monospace"}}>{fmt(r.value)}</span>
          </div>
        ))}
      </Card>
      <Card>
        <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Funnel Efficiency</div>
        {[
          {label:"Inquiry → Deal", value:`${(s.effectiveFunnelYield*100).toFixed(2)}%`, desc:`${Math.round(1/s.effectiveFunnelYield)}:1 ratio`},
          {label:"MQL → Deal", value:`${((s.dealsNeeded/s.mqlsNeeded)*100).toFixed(1)}%`, desc:`${Math.round(s.mqlsNeeded/s.dealsNeeded)}:1`},
          {label:"SQO → Deal", value:`${inputs.sqoToWonRate}%`, desc:`${Math.round(100/inputs.sqoToWonRate)}:1`},
          {label:"Mktg Sourced", value:`${inputs.mktgSourcedPct}%`, desc:`${fN(s.mktgSQOs)} mktg SQOs`},
          {label:"AE Sourced", value:`${100-inputs.mktgSourcedPct}%`, desc:`${fN(s.aeSelfSourcedSQOs)} AE SQOs`},
        ].map(r=>(
          <div key={r.label} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
            <span style={{fontSize:11,color:C.text}}>{r.label}</span>
            <div style={{textAlign:"right"}}><span style={{fontSize:12,fontWeight:700,color:C.accent,fontFamily:"'DM Mono',monospace"}}>{r.value}</span><span style={{fontSize:9,color:C.dim,marginLeft:6}}>{r.desc}</span></div>
          </div>
        ))}
      </Card>
      <Card>
        <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Budget Reality Check</div>
        {[
          {label:"Total Mktg Budget", value:fmt(p.totalMktgBudget), color:C.accent},
          {label:"Absorbed by Overhead", value:fmt(p.fixedMktg), color:C.violet},
          {label:"Available for Demand", value:fmt(afterFixed), color:C.amber},
          {label:"Buys Inquiries", value:fN(s.mktgInquiriesNeeded), color:C.ch[0]},
          {label:"Yields Deals", value:fN(s.dealsNeeded), color:C.green},
        ].map(r=>(
          <div key={r.label} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
            <span style={{fontSize:11,color:C.text}}>{r.label}</span>
            <span style={{fontSize:12,fontWeight:700,color:r.color,fontFamily:"'DM Mono',monospace"}}>{r.value}</span>
          </div>
        ))}
      </Card>
    </div>
  </div>);
}

function VelocityPage({model,inputs,setInputs}){
  const{velocityStages,summary:s}=model;const totalDays=s.totalCycleDays;
  return(<div><Header title="Pipeline Velocity" sub="Stage-level time analysis" icon={Clock}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:24}}>
      <Metric label="Total Cycle" value={`${totalDays} days`} sub={`${Math.round(totalDays/7)} weeks`} color={C.accent}/><Metric label="Daily Velocity" value={fmt(s.velocityPerDay)} sub="Rev per day" color={C.green}/><Metric label="Stage 2 Pipeline" value={fmt(s.stage2Pipeline)} sub="Board-safe" color={C.violet}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:24}}>
      <Card><h3 style={{fontSize:12,fontWeight:700,color:C.accent,margin:0,marginBottom:16,textTransform:"uppercase",letterSpacing:"0.06em"}}>Stage Duration (days)</h3>
        <Input label="Stage 1→2 (Discovery→SQO)" value={inputs.velStage1to2} onChange={v=>setInputs(p=>({...p,velStage1to2:v}))} suffix="days" min={1}/><Input label="Stage 2→3 (Tech)" value={inputs.velStage2to3} onChange={v=>setInputs(p=>({...p,velStage2to3:v}))} suffix="days" min={1}/><Input label="Stage 3→4 (Biz Case)" value={inputs.velStage3to4} onChange={v=>setInputs(p=>({...p,velStage3to4:v}))} suffix="days" min={1}/><Input label="Stage 4→5 (Legal)" value={inputs.velStage4to5} onChange={v=>setInputs(p=>({...p,velStage4to5:v}))} suffix="days" min={1}/><Input label="Stage 5→Close" value={inputs.velStage5toClose} onChange={v=>setInputs(p=>({...p,velStage5toClose:v}))} suffix="days" min={1}/>
        <div style={{marginTop:12,padding:12,background:C.bg,borderRadius:8,textAlign:"center"}}><div style={{fontSize:10,color:C.dim,textTransform:"uppercase"}}>Total Cycle</div><div style={{fontSize:22,fontWeight:700,color:C.accent,marginTop:4}}>{totalDays} days</div></div>
      </Card>
      <div>
        <Card style={{marginBottom:18}}><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:16}}>Stage Duration Breakdown</h3>
          <ResponsiveContainer width="100%" height={280}><BarChart data={velocityStages} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis type="number" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis dataKey="name" type="category" stroke={C.dim} fontSize={10} width={160} tickLine={false}/><Tooltip content={<TT/>}/>
            <Bar dataKey="days" radius={[0,6,6,0]} name="Days">{velocityStages.map((_,i)=><Cell key={i} fill={C.ch[i]}/>)}</Bar>
          </BarChart></ResponsiveContainer></Card>
        <Card><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:12}}>Velocity Diagnostic</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[{label:"High conv + long time",signal:"Process friction",color:C.amber,fix:"Streamline approvals"},{label:"Short time + low conv",signal:"Premature promotion",color:C.rose,fix:"Tighten stage entry"},{label:"High conv + short time",signal:"Healthy velocity",color:C.green,fix:"Scale this motion"},{label:"Low conv + long time",signal:"Dead pipeline",color:C.rose,fix:"Kill faster"}].map(r=>(
              <div key={r.label} style={{padding:12,background:C.bg,borderRadius:8,border:`1px solid ${r.color}22`}}><div style={{fontSize:11,fontWeight:700,color:r.color,marginBottom:4}}>{r.signal}</div><div style={{fontSize:10,color:C.muted,marginBottom:4}}>{r.label}</div><div style={{fontSize:10,color:C.dim}}>→ {r.fix}</div></div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  </div>);
}

function RampPage({model,inputs,setInputs}){return(<div><Header title="Seller Ramp" sub="AE productivity curve with attrition" icon={TrendingUp}/><div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:24}}><Card><Input label="AEs" value={inputs.aeCount} onChange={v=>setInputs(p=>({...p,aeCount:v}))} min={1}/><Input label="Quota" value={inputs.aeQuota} onChange={v=>setInputs(p=>({...p,aeQuota:v}))} prefix="$" step={25000}/><Input label="Ramp" value={inputs.aeRampMonths} onChange={v=>setInputs(p=>({...p,aeRampMonths:v}))} suffix="mo" min={1} max={12}/><Input label="Attrition" value={inputs.aeAttritionRate} onChange={v=>setInputs(p=>({...p,aeAttritionRate:v}))} suffix="% yr" step={5}/>
    <div style={{height:1,background:C.border,margin:"10px 0"}}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      <div style={{padding:8,background:C.bg,borderRadius:6,textAlign:"center"}}><div style={{fontSize:8,color:C.dim}}>Ramp Loss</div><div style={{fontSize:13,fontWeight:700,color:C.amber,fontFamily:"'DM Mono',monospace"}}>{fmt(model.summary.totalRampLoss)}</div></div>
      <div style={{padding:8,background:C.bg,borderRadius:6,textAlign:"center"}}><div style={{fontSize:8,color:C.dim}}>Attrition Loss</div><div style={{fontSize:13,fontWeight:700,color:C.rose,fontFamily:"'DM Mono',monospace"}}>{fmt(model.summary.totalAttrLoss)}</div></div>
    </div>
    {inputs.aeAttritionRate > 0 && <div style={{marginTop:8,fontSize:9,color:C.muted}}>Eff. AEs by Dec: {model.sellerRamp[11]?.effectiveAEs}</div>}
  </Card>
  <Card><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Ramp Curve {inputs.aeAttritionRate > 0 ? "(incl. attrition)" : ""}</h3><ResponsiveContainer width="100%" height={300}><ComposedChart data={model.sellerRamp}><CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="month" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis yAxisId="l" stroke={C.dim} fontSize={11} tickFormatter={v=>fmt(v)} tickLine={false} axisLine={false}/><YAxis yAxisId="r" orientation="right" stroke={C.dim} fontSize={11} tickFormatter={v=>`${(v*100).toFixed(0)}%`} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/><Bar yAxisId="l" dataKey="totalCapacity" fill={C.blueD} stroke={C.blue} strokeWidth={1} radius={[4,4,0,0]} name="Capacity"/><Bar yAxisId="l" dataKey="attrLoss" fill={C.roseD} stroke={C.rose} strokeWidth={1} radius={[4,4,0,0]} name="Attrition Loss"/><Line yAxisId="r" type="monotone" dataKey="rampPct" stroke={C.accent} strokeWidth={2.5} dot={false} name="Ramp%"/></ComposedChart></ResponsiveContainer></Card></div></div>);}

// ─── P&L: Dual-Axis Cost Model ───
function PnLPage({model,inputs,setInputs}){
  const{pnl:p,summary:s}=model;

  // Functional P&L waterfall
  const funcItems=[
    {l:"Revenue",v:p.totalRevenue,c:C.accent,b:1},
    {l:"COGS",v:-p.cogsAmount,c:C.rose,i:1},
    {l:"Gross Profit",v:p.grossProfit,c:C.green,b:1},
    {l:"---"},
    {l:"G&A",v:-p.gAndA,c:C.rose,i:1,pct:inputs.gAndAPct},
    {l:"R&D",v:-p.rAndD,c:C.rose,i:1,pct:inputs.rAndDPct},
    {l:"Sales OPEX",v:-p.salesOpex,c:C.rose,i:1,pct:inputs.salesOpexPct},
    {l:"Marketing",v:-p.totalMktgBudget,c:C.rose,i:1},
    {l:"Total OpEx",v:-p.totalOpex,c:C.amber,b:1},
    {l:"---2"},
    {l:"Op Income",v:p.operatingIncome,c:p.operatingIncome>=0?C.green:C.rose,b:1}
  ];

  // Behavioral breakdown
  const behavItems=[
    {l:"Fixed Sales Comp",v:p.fixedSalesComp,c:C.violet},
    {l:"Fixed Marketing",v:p.fixedMktg,c:C.violet},
    {l:"G&A (fixed)",v:p.gAndA,c:C.violet},
    {l:"R&D (fixed)",v:p.rAndD,c:C.violet},
    {l:"---"},
    {l:"Total Fixed",v:p.totalFixedCosts,c:C.violet,b:1},
    {l:"---2"},
    {l:"Variable Sales Comp",v:p.variableSalesComp,c:C.amber},
    {l:"Variable Marketing",v:p.variableMktg,c:C.amber},
    {l:"---3"},
    {l:"Total Variable",v:p.totalVariableCosts,c:C.amber,b:1},
  ];

  const budgetPie=[
    {name:"Fixed",value:p.totalFixedCosts,fill:C.violet},
    {name:"Variable",value:p.totalVariableCosts,fill:C.amber}
  ];

  // S&M health indicator
  const sAndMColor = p.sAndMHealth === "burn_risk" ? C.rose : p.sAndMHealth === "underinvest" ? C.amber : C.green;
  const sAndMLabel = p.sAndMHealth === "burn_risk" ? "BURN RISK" : p.sAndMHealth === "underinvest" ? "UNDERINVEST" : "HEALTHY";

  return(<div><Header title="P&L" sub="Dual-axis cost model — Fixed/Variable × Functional" icon={DollarSign}/>
    <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:24}}>
      <Card>
        <div style={{fontSize:9,fontWeight:700,color:C.accent,textTransform:"uppercase",marginBottom:8}}>Functional (% of Rev)</div>
        <Input compact label="Gross Margin" value={inputs.grossMargin} onChange={v=>setInputs(p=>({...p,grossMargin:v}))} suffix="%"/>
        <Input compact label="G&A" value={inputs.gAndAPct} onChange={v=>setInputs(p=>({...p,gAndAPct:v}))} suffix="%" step={1}/>
        <Input compact label="R&D" value={inputs.rAndDPct} onChange={v=>setInputs(p=>({...p,rAndDPct:v}))} suffix="%" step={1}/>
        <Input compact label="Sales OPEX" value={inputs.salesOpexPct} onChange={v=>setInputs(p=>({...p,salesOpexPct:v}))} suffix="%" step={1}/>
        <Input compact label="Variable Mktg" value={inputs.variableMktgPct} onChange={v=>setInputs(p=>({...p,variableMktgPct:v}))} suffix="%" step={1}/>
        <div style={{height:1,background:C.border,margin:"8px 0"}}/>
        <div style={{fontSize:9,fontWeight:700,color:C.violet,textTransform:"uppercase",marginBottom:8}}>Behavioral Splits</div>
        <Input compact label="Sales Variable %" value={inputs.salesVariablePct} onChange={v=>setInputs(p=>({...p,salesVariablePct:v}))} suffix="%" step={5}/>
        <Input compact label="Fixed Mktg %" value={inputs.fixedMktgPct} onChange={v=>setInputs(p=>({...p,fixedMktgPct:v}))} suffix="%" step={5}/>
        <div style={{height:1,background:C.border,margin:"8px 0"}}/>
        <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:8}}>Retention</div>
        <Input compact label="NRR" value={inputs.nrrPercent} onChange={v=>setInputs(p=>({...p,nrrPercent:v}))} suffix="%"/>
        <Input compact label="Churn" value={inputs.churnRate} onChange={v=>setInputs(p=>({...p,churnRate:v}))} suffix="%" step={0.5}/>
      </Card>
      <div>
        {/* Top metrics */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:18}}>
          <Metric label="Op Margin" value={`${(p.opMargin*100).toFixed(1)}%`} color={p.operatingIncome>=0?C.green:C.rose}/>
          <Metric label="Contribution" value={`${(p.contributionMarginPct*100).toFixed(1)}%`} sub={fmt(p.contributionMargin)} color={C.accent}/>
          <Metric label="Breakeven Rev" value={fmt(p.breakEvenRevenue)} color={C.amber}/>
          <Metric label="Rule of 40" value={s.rule40.toFixed(0)} color={s.rule40>=40?C.green:C.rose}/>
          <Metric label="Total S&M" value={`${p.totalSAndMPct.toFixed(0)}%`} sub={<span style={{color:sAndMColor}}>{sAndMLabel}</span>} color={sAndMColor}/>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
          {/* Functional P&L */}
          <Card>
            <h3 style={{fontSize:11,fontWeight:700,color:C.accent,margin:0,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.04em"}}>Functional View</h3>
            {funcItems.map((it,i)=>{if(it.l?.startsWith("---"))return<div key={i} style={{height:1,background:C.border,margin:"3px 0"}}/>;return(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",borderRadius:5,background:it.b?C.bg:"transparent"}}>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>{it.i&&<div style={{width:14}}/>}<span style={{fontSize:12,fontWeight:it.b?700:400,color:it.b?C.text:C.muted}}>{it.l}</span>{it.pct!=null&&<span style={{fontSize:9,color:C.dim}}>({it.pct}%)</span>}</div>
              <span style={{fontSize:13,fontWeight:it.b?700:500,color:it.c,fontFamily:"'DM Mono',monospace"}}>{it.v<0?`(${fmt(Math.abs(it.v))})`:fmt(it.v)}</span>
            </div>);})}
          </Card>

          {/* Behavioral view */}
          <Card>
            <h3 style={{fontSize:11,fontWeight:700,color:C.violet,margin:0,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.04em"}}>Behavioral View (Fixed / Variable)</h3>
            {behavItems.map((it,i)=>{if(it.l?.startsWith("---"))return<div key={i} style={{height:1,background:C.border,margin:"3px 0"}}/>;return(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 10px",borderRadius:5,background:it.b?C.bg:"transparent"}}>
              <span style={{fontSize:12,fontWeight:it.b?700:400,color:it.b?C.text:C.muted}}>{it.l}</span>
              <span style={{fontSize:13,fontWeight:it.b?700:500,color:it.c,fontFamily:"'DM Mono',monospace"}}>{fmt(it.v)}</span>
            </div>);})}
            <div style={{marginTop:12}}>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart><Pie data={budgetPie} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3}>
                  {budgetPie.map((d,i)=><Cell key={i} fill={d.fill}/>)}
                </Pie><Tooltip formatter={v=>fmt(v)}/></PieChart>
              </ResponsiveContainer>
              <div style={{display:"flex",justifyContent:"center",gap:20}}>
                <div style={{textAlign:"center"}}><div style={{fontSize:9,color:C.dim}}>Fixed</div><div style={{fontSize:14,fontWeight:700,color:C.violet,fontFamily:"'DM Mono',monospace"}}>{fmt(p.totalFixedCosts)}</div></div>
                <div style={{textAlign:"center"}}><div style={{fontSize:9,color:C.dim}}>Variable</div><div style={{fontSize:14,fontWeight:700,color:C.amber,fontFamily:"'DM Mono',monospace"}}>{fmt(p.totalVariableCosts)}</div></div>
              </div>
            </div>
          </Card>
        </div>

        {/* Benchmark Deltas */}
        {p.benchDeltas && p.benchDeltas.length > 0 && (
        <Card style={{marginBottom:18}}>
          <h3 style={{fontSize:11,fontWeight:700,color:C.dim,margin:0,marginBottom:12,textTransform:"uppercase",letterSpacing:"0.04em"}}>Delta from Benchmark (B2B Cyber Mid-Market)</h3>
          {p.benchDeltas.map((b,i)=>{
            const pctPos = b.benchHigh > b.benchLow ? ((b.actual - b.benchLow) / (b.benchHigh - b.benchLow)) * 100 : 50;
            const barColor = b.position === "within" ? C.green : b.position === "above" ? C.amber : C.blue;
            return(<div key={b.key} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:11,fontWeight:600,color:C.text}}>{b.label}</span>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:12,fontWeight:700,color:barColor,fontFamily:"'DM Mono',monospace"}}>{b.actual.toFixed(1)}%</span>
                  <span style={{fontSize:9,color:C.dim}}>vs {b.benchMid}% mid</span>
                  <span style={{fontSize:10,fontWeight:600,color:b.delta>0?C.amber:C.blue,fontFamily:"'DM Mono',monospace"}}>{b.deltaLabel}</span>
                </div>
              </div>
              <div style={{position:"relative",height:16,background:C.bg,borderRadius:6,overflow:"hidden"}}>
                {/* Benchmark range */}
                <div style={{position:"absolute",left:0,right:0,top:0,bottom:0,background:`linear-gradient(90deg, ${C.blueD} 0%, ${C.greenD} 30%, ${C.greenD} 70%, ${C.amberD} 100%)`,borderRadius:6}}/>
                {/* Mid marker */}
                <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:1,background:C.dim,zIndex:2}}/>
                {/* Actual position */}
                <div style={{position:"absolute",left:`${Math.max(0,Math.min(100,pctPos))}%`,top:1,bottom:1,width:10,marginLeft:-5,background:barColor,borderRadius:4,zIndex:3,border:`1px solid ${barColor}`}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
                <span style={{fontSize:8,color:C.dim}}>{b.benchLow}%</span>
                <span style={{fontSize:8,color:C.dim}}>{b.benchHigh}%</span>
              </div>
            </div>);
          })}
          {/* CP-SQO benchmark */}
          <div style={{marginTop:8,padding:10,background:C.bg,borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:9,color:C.dim,textTransform:"uppercase"}}>CP-SQO Actual vs Benchmark</div>
              <div style={{fontSize:16,fontWeight:700,color:p.cpSqoRatio<=1?C.green:p.cpSqoRatio<=1.5?C.amber:C.rose,fontFamily:"'DM Mono',monospace"}}>{fmt(p.actualCpSqo)}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:9,color:C.dim}}>Benchmark: {fmt(inputs.cpSqoBenchmark)}</div>
              <div style={{fontSize:13,fontWeight:700,color:p.cpSqoRatio<=1?C.green:p.cpSqoRatio<=1.5?C.amber:C.rose}}>{p.cpSqoRatio.toFixed(1)}×</div></div>
          </div>
        </Card>)}
      </div>
    </div>
  </div>);
}

function GlideslopePage({model,inputs,setInputs}){
  const gs=model.glideslope;const isEven=inputs.seasonalityMode==="even";
  const ny = model.numYears || 1;
  const y1End = gs[11];
  const y2End = ny > 1 ? gs[23] : null;
  return(<div><Header title="Glideslope" sub={ny>1?`${ny}-Year Planning Horizon — ${isEven?"Linear":"Seasonal"} targets`:(isEven?"Linear target (even distribution)":"Seasonal target (NORAM B2B pattern)")} icon={Target}/>
    {/* Year summary cards */}
    <div style={{display:"grid",gridTemplateColumns:ny>1?"repeat(6,1fr)":"repeat(4,1fr)",gap:12,marginBottom:20}}>
      <Metric label="Y1 Exit" value={fmt(y1End?.totalARR)} color={C.accent}/>
      <Metric label="Y1 Target" value={fmt(y1End?.targetARR)} color={C.amber}/>
      <Metric label="Y1 Gap" value={fmt(y1End?.gapToTarget)} color={y1End?.gapToTarget>=0?C.green:C.rose}/>
      {ny>1&&y2End&&<Metric label="Y2 Exit" value={fmt(y2End?.totalARR)} color={C.violet}/>}
      {ny>1&&y2End&&<Metric label="Y2 Target" value={fmt(y2End?.targetARR)} color={C.amber}/>}
      <Metric label="Seasonality" value={inputs.seasonalityMode.toUpperCase()} sub={isEven?"Flat":"Weighted"} color={C.dim}/>
    </div>
    {/* Year targets table */}
    {ny>1&&model.yearTargets&&(
    <Card style={{marginBottom:18}}>
      <h3 style={{fontSize:11,fontWeight:700,color:C.dim,margin:0,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.04em"}}>Multi-Year Plan</h3>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${ny},1fr)`,gap:12}}>
        {model.yearTargets.map((yt,i)=>(
          <div key={yt.label} style={{padding:14,background:C.bg,borderRadius:10,borderLeft:`3px solid ${i===0?C.accent:C.violet}`}}>
            <div style={{fontSize:14,fontWeight:700,color:i===0?C.accent:C.violet,marginBottom:8}}>{yt.label}</div>
            {[{l:"Start ARR",v:fmt(yt.startARR)},{l:"Target ARR",v:fmt(yt.targetARR)},{l:"New ARR Needed",v:fmt(yt.newARRNeeded)},{l:"Growth",v:`${yt.growthRate.toFixed(0)}%`},{l:"Deals",v:fN(yt.dealsNeeded)},{l:"SQOs",v:fN(yt.sqosNeeded)}].map(r=>(
              <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:10,color:C.muted}}>{r.l}</span>
                <span style={{fontSize:11,fontWeight:600,color:C.text,fontFamily:"'DM Mono',monospace"}}>{r.v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{marginTop:12}}>
        <div style={{display:"flex",gap:12}}>
          <Input compact label="Y2 Growth %" value={inputs.y2GrowthRate} onChange={v=>setInputs(p=>({...p,y2GrowthRate:v}))} suffix="%" step={5}/>
          <Input compact label="Years" value={inputs.planningYears} onChange={v=>setInputs(p=>({...p,planningYears:v}))} suffix="" step={1} min={1} max={3}/>
        </div>
      </div>
    </Card>)}
    <Card style={{marginBottom:18}}><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:6}}>Monthly Seasonal Weights</h3>
      <div style={{display:"flex",gap:4,alignItems:"flex-end",height:60,marginBottom:14}}>
        {model.monthWeights.map((w,i)=>(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
          <span style={{fontSize:8,color:C.accent,fontFamily:"'DM Mono',monospace"}}>{(w*100).toFixed(0)}%</span>
          <div style={{width:"100%",background:C.accentD,borderRadius:3,height:`${Math.max(w*100*8,4)}px`,border:`1px solid ${C.accent}44`}}/>
          <span style={{fontSize:8,color:C.dim}}>{MONTHS[i]}</span>
        </div>))}
      </div>
    </Card>
    <Card><ResponsiveContainer width="100%" height={360}><ComposedChart data={gs}><CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="month" stroke={C.dim} fontSize={9} tickLine={false} interval={ny>1?1:0} angle={ny>1?-45:0} textAnchor={ny>1?"end":"middle"} height={ny>1?60:30}/><YAxis stroke={C.dim} fontSize={11} tickFormatter={v=>fmt(v)} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
      <Area type="monotone" dataKey="totalARR" stroke={C.accent} fill={C.accentD} strokeWidth={2} name="Projected"/>
      <Line type="monotone" dataKey="targetARR" stroke={C.amber} strokeWidth={2.5} strokeDasharray="8 4" dot={false} name="Seasonal Target"/>
      {!isEven&&<Line type="monotone" dataKey="evenTarget" stroke={C.dim} strokeWidth={1} strokeDasharray="4 4" dot={false} name="Linear Target"/>}
      {ny>1&&<ReferenceLine x="Jan Y2" stroke={C.violet} strokeWidth={2} strokeDasharray="4 4" label={{value:"Y2",position:"top",fill:C.violet,fontSize:11}}/>}
    </ComposedChart></ResponsiveContainer></Card>
  </div>);
}

function QBRPage({model,inputs}){const isSplit=inputs.revenueMode==="split";const ny=model.numYears||1;const[yr,setYr]=useState(0);
  const qbr=model.qbrData.filter(q=>q.yearIndex===yr);
  return(<div><Header title="QBR Metrics" sub={ny>1?`Quarterly operating scorecard — Y${yr+1}`:"Quarterly operating scorecard"} icon={BarChart3}/>
    {ny>1&&<div style={{display:"flex",gap:8,marginBottom:16}}>
      {Array.from({length:ny},(_,i)=>(<button key={i} onClick={()=>setYr(i)} style={{padding:"6px 16px",borderRadius:8,border:`1px solid ${yr===i?C.accent:C.border}`,background:yr===i?C.accentD:"transparent",color:yr===i?C.accent:C.muted,cursor:"pointer",fontSize:12,fontWeight:600}}>{`Y${i+1}`}</button>))}
    </div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>{qbr.map((q,i)=><Card key={q.quarter}><div style={{fontSize:16,fontWeight:700,color:C.ch[i],marginBottom:10}}>{q.quarter}</div>{[{l:"Revenue",v:fmt(q.revenue)},{l:"New ARR",v:fmt(q.newARR)},isSplit&&{l:"New Logo",v:fmt(q.newLogoARR)},isSplit&&{l:"Expansion",v:fmt(q.expansionARR)},{l:"Won",v:fN(q.deals)},{l:"Inquiries",v:fN(q.inquiries)},{l:"MQLs",v:fN(q.mqls)},{l:"SQLs",v:fN(q.sqls)},{l:"Meetings",v:fN(q.meetings)},{l:"SQOs",v:fN(q.sqos)},{l:"Pipeline",v:fmt(q.pipeline)},{l:"Stage 2",v:fmt(q.stage2Pipe)}].filter(Boolean).map(m=><div key={m.l} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:10,color:C.muted}}>{m.l}</span><span style={{fontSize:11,fontWeight:600,color:C.text,fontFamily:"'DM Mono',monospace"}}>{m.v}</span></div>)}</Card>)}</div></div>);}

function WeeklyPage({model}){const w=model.weeklySimplified;return(<div><Header title="Weekly Tracker" sub="Weekly lifecycle targets" icon={Calendar}/><div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}><Metric label="Inquiries/wk" value={fN(w[0]?.inquiries)} color={C.ch[0]}/><Metric label="MQLs/wk" value={fN(w[0]?.mqls)} color={C.ch[1]}/><Metric label="SQLs/wk" value={fN(w[0]?.sqls)} color={C.ch[2]}/><Metric label="Meetings/wk" value={fN(w[0]?.meetings)} color={C.ch[3]}/><Metric label="SQOs/wk" value={fN(w[0]?.sqos)} color={C.ch[4]}/></div>
  <Card><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Cumulative: Inquiries → SQLs → SQOs</h3><ResponsiveContainer width="100%" height={280}><AreaChart data={w}><defs><linearGradient id="wI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={0.25}/><stop offset="95%" stopColor={C.blue} stopOpacity={0}/></linearGradient><linearGradient id="wQ" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.violet} stopOpacity={0.25}/><stop offset="95%" stopColor={C.violet} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="weekLabel" stroke={C.dim} fontSize={10} interval={3} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/><Area type="monotone" dataKey="cumulativeInquiries" stroke={C.blue} fill="url(#wI)" strokeWidth={2} name="Inquiries"/><Area type="monotone" dataKey="cumulativeSQOs" stroke={C.violet} fill="url(#wQ)" strokeWidth={2} name="SQOs"/></AreaChart></ResponsiveContainer></Card></div>);}

// ════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════
// NAV SECTION (collapsible sidebar group)
// ════════════════════════════════════════════════════════════
function NavSection({section,items,page,setPage}){
  const hasActive = items.some(n=>n.id===page);
  const[open,setOpen]=useState(hasActive || !section); // auto-open if contains active page or is top-level

  // Auto-open when user navigates to an item in this section
  const prevActive = items.some(n=>n.id===page);
  if(prevActive && !open) setOpen(true);

  return(<div style={{marginBottom:section?4:0}}>
    {section && (
      <button onClick={()=>setOpen(!open)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",
        padding:"6px 10px",marginTop:8,border:"none",background:"transparent",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
        <span style={{fontSize:9,fontWeight:700,color:hasActive?C.accent:C.dim,letterSpacing:"0.08em",textTransform:"uppercase"}}>{section}</span>
        <span style={{fontSize:10,color:C.dim,transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.15s"}}>▾</span>
      </button>
    )}
    {(open || !section) && items.map(n=>{
      const I=n.icon, a=page===n.id;
      return(
        <button key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",gap:9,width:"100%",
          padding:section?"7px 10px 7px 18px":"8px 10px",marginBottom:1,border:"none",borderRadius:7,
          background:a?C.accentD:"transparent",color:a?C.accent:C.muted,cursor:"pointer",fontSize:12,
          fontWeight:a?600:400,textAlign:"left",transition:"all 0.15s",fontFamily:"'DM Sans',sans-serif"}}
          onMouseEnter={e=>{if(!a){e.currentTarget.style.background=C.card;e.currentTarget.style.color=C.text}}}
          onMouseLeave={e=>{if(!a){e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.muted}}}>
          <I size={13}/>{n.label}
        </button>
      );
    })}
  </div>);
}

export default function App(){
  const[page,setPage]=useState("dashboard");
  const[drivers,setDrivers]=useState(false);
  const[inputs,setInputs]=useState(DEFAULT_INPUTS);
  const model=useMemo(()=>computeModel(inputs),[inputs]);
  const pp={model,inputs,setInputs};
  const pages={dashboard:<DashboardPage {...pp}/>,targets:<TargetTrackerPage {...pp}/>,funnelHealth:<FunnelHealthPage {...pp}/>,sales:<SalesPage {...pp}/>,marketing:<FunnelPage {...pp}/>,channels:<ChannelsPage {...pp}/>,mktgBudget:<MarketingBudgetPage {...pp}/>,sandmBudget:<SandMBudgetPage {...pp}/>,cacBreakdown:<CACBreakdownPage {...pp}/>,pipeline:<PipelinePage {...pp}/>,velocity:<VelocityPage {...pp}/>,sellerRamp:<RampPage {...pp}/>,pnl:<PnLPage {...pp}/>,glideslope:<GlideslopePage {...pp}/>,qbr:<QBRPage {...pp}/>,weekly:<WeeklyPage {...pp}/>};

  return(<div style={{display:"flex",height:"100vh",overflow:"hidden",background:C.bg,fontFamily:"'DM Sans',sans-serif",color:C.text}}>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

    <aside style={{width:220,height:"100vh",background:C.bgAlt,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{padding:"16px 16px 20px"}}>
        <img src={LOGO_URL} alt="Heretics" style={{height:28,marginBottom:6,filter:"brightness(1.1)"}} onError={e=>{e.target.style.display='none'}}/>
        <div style={{fontSize:9,color:C.dim,letterSpacing:"0.08em",textTransform:"uppercase"}}>Revenue Physics Engine</div>
      </div>
      <nav style={{flex:1,padding:"0 6px",overflowY:"auto"}}>
        {NAV_SECTIONS.map((sec,si)=>(
          <NavSection key={si} section={sec.section} items={sec.items} page={page} setPage={setPage}/>
        ))}
      </nav>
      <div style={{padding:"8px 6px",borderTop:`1px solid ${C.border}`}}>
        <button onClick={()=>setDrivers(!drivers)} style={{display:"flex",alignItems:"center",gap:7,width:"100%",padding:"8px 10px",border:"none",borderRadius:7,background:drivers?C.violetD:"transparent",color:drivers?C.violet:C.muted,cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
          <Settings size={13}/>Global Drivers
        </button>
      </div>
    </aside>

    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      <main style={{flex:1,overflowY:"auto",padding:"24px 32px 60px"}}>
        <AnimatePresence mode="wait"><motion.div key={page} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.2}}>
          {pages[page]}
        </motion.div></AnimatePresence>
      </main>

      <AnimatePresence>{drivers&&(
        <motion.aside initial={{width:0,opacity:0}} animate={{width:280,opacity:1}} exit={{width:0,opacity:0}} transition={{duration:0.2}}
          style={{height:"100vh",borderLeft:`1px solid ${C.border}`,background:C.bgAlt,overflow:"hidden",flexShrink:0}}>
          <div style={{width:280,padding:"20px 16px",overflowY:"auto",height:"100%"}}>
            <h3 style={{fontSize:10,fontWeight:700,color:C.violet,margin:0,marginBottom:16,textTransform:"uppercase",letterSpacing:"0.08em"}}>Model Drivers</h3>

            {/* Target Mode Toggle */}
            <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:6}}>Target Mode</div>
            <SegmentToggle options={[{value:"absolute",label:"$ ARR"},{value:"growthRate",label:"% Growth"}]} value={inputs.targetMode} onChange={v=>setInputs(p=>({...p,targetMode:v}))}/>
            <div style={{marginTop:8}}/>
            {inputs.targetMode==="absolute"?(
              <Input compact label="Target ARR" value={inputs.targetARR} onChange={v=>setInputs(p=>({...p,targetARR:v}))} prefix="$" step={100000}/>
            ):(
              <Input compact label="Growth Rate" value={inputs.targetGrowthRate} onChange={v=>setInputs(p=>({...p,targetGrowthRate:v}))} suffix="%" step={5}/>
            )}
            <Input compact label="Starting ARR" value={inputs.startingARR} onChange={v=>setInputs(p=>({...p,startingARR:v}))} prefix="$" step={100000}/>
            {inputs.targetMode==="growthRate"&&<div style={{padding:8,background:C.bg,borderRadius:6,marginBottom:8}}><div style={{fontSize:9,color:C.dim}}>Implied Target</div><div style={{fontSize:14,fontWeight:700,color:C.accent,fontFamily:"'DM Mono',monospace"}}>{fmt(model.summary.targetARR)}</div></div>}
            <Input compact label="Avg Deal" value={inputs.avgDealSize} onChange={v=>setInputs(p=>({...p,avgDealSize:v}))} prefix="$" step={5000}/>
            <div style={{height:1,background:C.border,margin:"8px 0"}}/>
            <div style={{fontSize:9,fontWeight:700,color:C.violet,textTransform:"uppercase",marginBottom:6}}>Planning Horizon</div>
            <Input compact label="Years" value={inputs.planningYears} onChange={v=>setInputs(p=>({...p,planningYears:Math.min(3,Math.max(1,v))}))} suffix="yr" step={1}/>
            {inputs.planningYears>1&&<Input compact label="Y2 Growth" value={inputs.y2GrowthRate} onChange={v=>setInputs(p=>({...p,y2GrowthRate:v}))} suffix="%" step={5}/>}

            {/* Revenue Mode Toggle */}
            <div style={{height:1,background:C.border,margin:"8px 0"}}/>
            <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:6}}>Revenue Motion</div>
            <SegmentToggle options={[{value:"blended",label:"Blended"},{value:"split",label:"Logo + Expand"}]} value={inputs.revenueMode} onChange={v=>setInputs(p=>({...p,revenueMode:v}))}/>
            {inputs.revenueMode==="split"&&<div style={{marginTop:8}}>
              <Input compact label="New Logo %" value={inputs.newLogoPct} onChange={v=>setInputs(p=>({...p,newLogoPct:v}))} suffix="%" min={10} max={100} step={5}/>
              <Input compact label="Expansion ADS" value={inputs.expansionAvgDeal} onChange={v=>setInputs(p=>({...p,expansionAvgDeal:v}))} prefix="$" step={5000}/>
              <Input compact label="Expansion Close %" value={inputs.expansionSqoToWon} onChange={v=>setInputs(p=>({...p,expansionSqoToWon:v}))} suffix="%"/>
              <Input compact label="Expansion Cycle" value={inputs.expansionCycleWeeks} onChange={v=>setInputs(p=>({...p,expansionCycleWeeks:v}))} suffix="wk"/>
            </div>}

            <div style={{height:1,background:C.border,margin:"8px 0"}}/>
            <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:6}}>Lifecycle</div>
            <Input compact label="Inquiry→MQL" value={inputs.inquiryToMqlRate} onChange={v=>setInputs(p=>({...p,inquiryToMqlRate:v}))} suffix="%"/>
            <Input compact label="MQL→SQL" value={inputs.mqlToSqlRate} onChange={v=>setInputs(p=>({...p,mqlToSqlRate:v}))} suffix="%"/>
            <Input compact label="SQL→Meeting" value={inputs.sqlToMeetingRate} onChange={v=>setInputs(p=>({...p,sqlToMeetingRate:v}))} suffix="%"/>
            <Input compact label="Meeting→SQO" value={inputs.meetingToSqoRate} onChange={v=>setInputs(p=>({...p,meetingToSqoRate:v}))} suffix="%"/>
            <Input compact label="SQO→Won" value={inputs.sqoToWonRate} onChange={v=>setInputs(p=>({...p,sqoToWonRate:v}))} suffix="%"/>
            <div style={{height:1,background:C.border,margin:"8px 0"}}/>
            <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:6}}>Pipeline Lead Time</div>
            <Input compact label="SQO→Close lag" value={inputs.sqoLeadQuarters} onChange={v=>setInputs(p=>({...p,sqoLeadQuarters:v}))} suffix="Qtrs" min={1} max={4}/>
            <Input compact label="MQL→SQO lag" value={inputs.mqlLeadQuarters} onChange={v=>setInputs(p=>({...p,mqlLeadQuarters:v}))} suffix="Qtrs" min={1} max={3}/>
            <div style={{height:1,background:C.border,margin:"8px 0"}}/>
            <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:6}}>Sales</div>
            <Input compact label="AEs" value={inputs.aeCount} onChange={v=>setInputs(p=>({...p,aeCount:v}))} min={1}/>
            <Input compact label="Quota" value={inputs.aeQuota} onChange={v=>setInputs(p=>({...p,aeQuota:v}))} prefix="$" step={25000}/>
            <Input compact label="Ramp" value={inputs.aeRampMonths} onChange={v=>setInputs(p=>({...p,aeRampMonths:v}))} suffix="mo"/>
            <Input compact label="Attrition" value={inputs.aeAttritionRate} onChange={v=>setInputs(p=>({...p,aeAttritionRate:v}))} suffix="% yr" step={5}/>
            <Input compact label="Mktg-Sourced %" value={inputs.mktgSourcedPct} onChange={v=>setInputs(p=>({...p,mktgSourcedPct:v}))} suffix="%" min={10} max={100} step={5}/>
            <div style={{height:1,background:C.border,margin:"8px 0"}}/>
            <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:6}}>Economics</div>
            <Input compact label="NRR" value={inputs.nrrPercent} onChange={v=>setInputs(p=>({...p,nrrPercent:v}))} suffix="%"/>
            <Input compact label="Gross Margin" value={inputs.grossMargin} onChange={v=>setInputs(p=>({...p,grossMargin:v}))} suffix="%"/>
            <Input compact label="Churn" value={inputs.churnRate} onChange={v=>setInputs(p=>({...p,churnRate:v}))} suffix="%" step={0.5}/>
            <div style={{height:1,background:C.border,margin:"8px 0"}}/>
            <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:6}}>Cost Structure (% Rev)</div>
            <Input compact label="G&A" value={inputs.gAndAPct} onChange={v=>setInputs(p=>({...p,gAndAPct:v}))} suffix="%" step={1}/>
            <Input compact label="R&D" value={inputs.rAndDPct} onChange={v=>setInputs(p=>({...p,rAndDPct:v}))} suffix="%" step={1}/>
            <Input compact label="Sales OPEX" value={inputs.salesOpexPct} onChange={v=>setInputs(p=>({...p,salesOpexPct:v}))} suffix="%" step={1}/>
            <Input compact label="Var Mktg" value={inputs.variableMktgPct} onChange={v=>setInputs(p=>({...p,variableMktgPct:v}))} suffix="%" step={1}/>
            <Input compact label="Sales Var %" value={inputs.salesVariablePct} onChange={v=>setInputs(p=>({...p,salesVariablePct:v}))} suffix="%" step={5}/>
            <Input compact label="Fixed Mktg %" value={inputs.fixedMktgPct} onChange={v=>setInputs(p=>({...p,fixedMktgPct:v}))} suffix="%" step={5}/>
            <div style={{height:1,background:C.border,margin:"8px 0"}}/>
            <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:6}}>Seasonality</div>
            <SegmentToggle options={[{value:"even",label:"Even"},{value:"noram",label:"NORAM"},{value:"custom",label:"Custom"}]} value={inputs.seasonalityMode} onChange={v=>setInputs(p=>({...p,seasonalityMode:v}))}/>
            {inputs.seasonalityMode==="custom"&&<div style={{marginTop:8}}>
              <div style={{fontSize:8,color:C.dim,marginBottom:4}}>Monthly weights (relative — auto-normalized)</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:3}}>
                {MONTHS.map((m,i)=>(
                  <div key={m} style={{textAlign:"center"}}>
                    <div style={{fontSize:8,color:C.dim}}>{m}</div>
                    <input type="number" value={inputs.seasonalWeights[i]} min={1} max={20} step={1}
                      onChange={e=>{const nw=[...inputs.seasonalWeights];nw[i]=parseInt(e.target.value)||1;setInputs(p=>({...p,seasonalWeights:nw}));}}
                      style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,padding:"3px 2px",color:C.text,fontSize:10,fontFamily:"'DM Mono',monospace",textAlign:"center"}}/>
                  </div>
                ))}
              </div>
            </div>}
            {inputs.seasonalityMode!=="custom"&&<div style={{marginTop:6}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:2}}>
                {QUARTERS.map((q,qi)=>{const qw=model.monthWeights.slice(qi*3,qi*3+3).reduce((s,w)=>s+w,0);return(
                  <div key={q} style={{textAlign:"center",padding:"4px 0",background:C.bg,borderRadius:4}}>
                    <div style={{fontSize:8,color:C.dim}}>{q}</div>
                    <div style={{fontSize:11,fontWeight:700,color:C.accent,fontFamily:"'DM Mono',monospace"}}>{(qw*100).toFixed(0)}%</div>
                  </div>
                );})}
              </div>
            </div>}

          </div>
        </motion.aside>
      )}</AnimatePresence>
    </div>
  </div>);
}
