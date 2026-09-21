const fmt = n => `${n<0?'-':''}¥${Math.abs(n).toFixed(1)}万`;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const uid=()=>Math.random().toString(36).slice(2,9);

const DIFF={
  2006:{name:'2006',label:'中等',desc:'钱还没那么难赚，但税是真的高。',tax:.33,deal:1.0,baseWin:0,opp:4,startCash:120},
  2016:{name:'2016',label:'最容易',desc:'预算更宽松，机会更多，行业还相信增长。',tax:.25,deal:1.18,baseWin:5,opp:5,startCash:160},
  2026:{name:'2026',label:'最难',desc:'钱少、要求多、Pitch多，客户也会问AI能不能先来一版。',tax:.25,deal:.86,baseWin:-5,opp:3,startCash:100}
};
const CURRENT_RULES={tax:.25,deal:1,baseWin:0,opp:4};
const START_SCALES={
 boutique6:{key:'boutique6',name:'6人创意小店',size:6,startCash:90,startRep:30,startMorale:72,opp:3,mixShift:[.15,.25],desc:'人少、现金压力低。更容易吃小单和创意型Pitch，靠作品与效率长大。',counts:{策略:1,阿康:1,文案:1,美术:1,制片:1}},
 growth20:{key:'growth20',name:'20人成长型Agency',size:20,startCash:260,startRep:45,startMorale:68,opp:4,mixShift:[0,.08],desc:'标准经营盘。已经能摸中型客户，但每次扩张都会明显增加固定成本。',counts:{策略:2,阿康:5,文案:4,美术:4,制片:4}},
 integrated40:{key:'integrated40',name:'40人中型综合Agency',size:40,startCash:620,startRep:58,startMorale:64,opp:5,mixShift:[-.08,-.02],desc:'开局就背着大团队和大客户。业务更大，工资也更像一堵墙。',counts:{策略:4,阿康:11,文案:9,美术:8,制片:7}}
};
function startScale(key=S?.scale){return START_SCALES[key]||START_SCALES.growth20}
function gameRules(){return S?.scale?{...CURRENT_RULES,opp:startScale().opp}:(DIFF[S?.diff]||CURRENT_RULES)}


// 每8年换一轮行业气候。30年模式会经历前四段；后两段保留给未来继续扩年限。
const ECON_PHASES=[
 {key:'good1',label:'景气',deal:1.12,opp:1,mix:[.20,.30],shrink:.12,renewal:.05,salary:.06,
  news:'预算相对宽松，品牌愿意做更大的年度项目。接下来大单和年框会更常见。',
  cut:['客户内部突然调整预算优先级：项目继续，但先砍一半做第一阶段。','老板拍板要做，但财务说先别做那么大。预算先收一半。']},
 {key:'bad1',label:'下行',deal:.80,opp:-1,mix:[.22,.34],shrink:.35,renewal:-.08,salary:.01,
  news:'客户财务开始收紧。项目案值会缩水，Pitch占比上升，赢了以后被砍预算也更常见。',
  cut:['财务冻结了一半预算。项目没死，只是突然瘦了一圈。','客户说方向没问题，问题是今年预算只剩一半。']},
 {key:'flat1',label:'平稳修复',deal:.96,opp:0,mix:[.24,.44],shrink:.22,renewal:.01,salary:.03,
  news:'市场不再继续往下掉，但客户更看重确定性。年框、续约和能不能稳稳落地开始变重要。',
  cut:['客户把大项目拆成两阶段，第一阶段只批了一半预算。','项目还做，但客户决定先试半套。预算同步减半。']},
 {key:'flat2',label:'平淡横盘',deal:.91,opp:0,mix:[.24,.41],shrink:.26,renewal:-.02,salary:.02,
  news:'市场没明显变好，也没继续恶化。新业务更看关系、交付记录和价格，预算增长有限。',
  cut:['采购重新算了一遍账：预算砍一半，KPI暂时没听说要砍。','客户说先做轻一点。翻译成人话：钱只批了一半。']},
 {key:'bad2',label:'再度下行',deal:.76,opp:-1,mix:[.22,.32],shrink:.38,renewal:-.10,salary:0,
  news:'又一轮收缩开始。客户更爱比稿、更爱压价，也更容易在赢稿后临时缩水。',
  cut:['大环境不好，客户直接把预算砍成半份。','赢是赢了，预算委员会又把项目切了一刀，只剩一半。']},
 {key:'good2',label:'重新景气',deal:1.15,opp:1,mix:[.19,.50],shrink:.10,renewal:.06,salary:.05,
  news:'预算重新活跃，品牌开始恢复长期投入。大项目、主动邀约和续约机会都会更友好。',
  cut:['客户想先小规模启动，预算暂时按一半批。','项目确定要做，但第一阶段只先放一半预算。']}
];
function economyPhase(year=S?.year||1){
 const idx=Math.floor((Math.max(1,year)-1)/8)%ECON_PHASES.length;
 return ECON_PHASES[idx];
}
function economyBulletin(){
 const phase=economyPhase();
 const yearInBlock=((S.year-1)%8)+1;
 if(yearInBlock===8){
   const next=ECON_PHASES[(Math.floor((S.year-1)/8)+1)%ECON_PHASES.length];
   return `行业风向 · ${phase.label}尾声：${phase.news} 业内已经开始预期下一年转入“${next.label}”。`;
 }
 return `行业风向 · ${phase.label}：${phase.news}`;
}
function projectPriceIndex(year=S?.year||1){
 return Math.pow(1.03,Math.max(0,year-1));
}
function salaryMarketIndex(year=S?.year||1){
 let idx=1;
 for(let y=1;y<Math.max(1,year);y++)idx*=1+(economyPhase(y).salary||0);
 return idx;
}
function freeWeeklyRate(){return salaryMarketIndex()}
function realProjectValue(value){return value/projectPriceIndex()}
function salaryGrowthRate(year=S?.year||1){return economyPhase(year).salary||0}

const names=['新同事A','新同事B','新同事C','新同事D','新同事E','新同事F','新同事G','新同事H','新同事I','新同事J'];
const roles=['策略','创意','阿康','制片'];

const CAPABILITY_META={
 strategy:{label:'策略力',effect:'Pitch判断'},
 creative:{label:'创意力',effect:'作品声量'},
 service:{label:'服务力',effect:'续约'},
 execution:{label:'资源执行力',effect:'复杂交付'}
};
const ROLE_AFFINITY={
 老板:{strategy:.70,creative:.90,service:.45,execution:.25},
 策略:{strategy:1,creative:.25,service:.15,execution:.10},
 阿康:{strategy:.20,creative:.10,service:1,execution:.30},
 创意:{strategy:.16,creative:1,service:.10,execution:.18},
 文案:{strategy:.20,creative:1,service:.10,execution:.10},
 美术:{strategy:.10,creative:1,service:.10,execution:.25},
 制片:{strategy:.10,creative:.10,service:.25,execution:1}
};
const CAPABILITY_TARGET={strategy:.40,creative:.36,service:.32,execution:.28};
function baseRole(role=''){
 if(role==='老板')return '老板';
 if(role.includes('策略'))return '策略';
 if(role.includes('客户')||role.includes('阿康'))return '阿康';
 if(role.includes('创意'))return '创意';
 if(role.includes('文案'))return '文案';
 if(role.includes('美术'))return '美术';
 if(role.includes('制片')||role.includes('制作'))return '制片';
 return '阿康';
}
function roleTitle(role,skill){
 if(role==='策略')return skill>=84?'策略总监':'策略';
 if(role==='阿康')return skill>=84?'客户总监':'阿康';
 if(role==='创意')return skill>=84?'创意总监':'创意';
 if(role==='文案')return skill>=84?'文案总监':'文案';
 if(role==='美术')return skill>=84?'美术总监':'美术';
 if(role==='制片')return skill>=84?'资深制片':'制片';
 return role;
}
function roleSpec(role){return role==='创意'||role==='文案'||role==='美术'?'创意':role==='策略'?'品牌':role==='阿康'?'客户':'制作'}
function starterSkill(scaleKey,role,index){
 const base={策略:73,阿康:70,创意:73,文案:73,美术:73,制片:71}[role]||72;
 const bias=scaleKey==='boutique6'?4:scaleKey==='growth20'?1:-1;
 const senior=index===0?(scaleKey==='boutique6'?5:10):(index>0&&index%6===0?6:0);
 const orgBias=
   scaleKey==='integrated40'&&(role==='阿康'||role==='制片')?10:
   scaleKey==='integrated40'&&role==='策略'?5:
   scaleKey==='growth20'&&role==='策略'?5:
   scaleKey==='growth20'&&(role==='阿康'||role==='制片')?2:0;
 return clamp(base+bias+senior-(index%4)*2+orgBias,65,92);
}
function salaryFor(role,skill){
 const seniorPremium=skill>=84?0.45:0;
 return +((0.9+(skill-60)*0.055+(role==='策略'?0.35:role==='制片'?0.15:role==='创意'?0.12:0)+seniorPremium)*salaryMarketIndex()).toFixed(1);
}
function buildStarterTeam(scaleKey){
 const profile=START_SCALES[scaleKey]||START_SCALES.growth20;
 const team=[{id:uid(),name:'老板',role:'老板',spec:'创意',salary:+(3*salaryMarketIndex()).toFixed(1),skill:88,slots:[],tenure:2}];
 for(const [role,count] of Object.entries(profile.counts)){
   for(let i=0;i<count;i++){
     const skill=starterSkill(scaleKey,role,i),label=role==='阿康'?'客户':role;
     team.push({id:uid(),name:`${label}${i+1}`,role:roleTitle(role,skill),spec:roleSpec(role),salary:salaryFor(role,skill),skill,slots:[],tenure:2});
   }
 }
 return team;
}
function companyCapabilities(team=S?.team||[]){
 const result={},size=Math.max(1,team.length);
 for(const key of Object.keys(CAPABILITY_META)){
   let sumW=0,sumSkill=0;
   for(const p of team){
     const w=(ROLE_AFFINITY[baseRole(p.role)]||ROLE_AFFINITY.阿康)[key]||0;
     sumW+=w;sumSkill+=(Number(p.skill)||65)*w;
   }
   const avg=sumW?sumSkill/sumW:60;
   const coverage=clamp(sumW/(size*CAPABILITY_TARGET[key]),0,1.15);
   const structureBias=size<=10
     ? ({strategy:3,creative:7,service:-5,execution:-12}[key]||0)
     : size>=30
       ? ({strategy:0,creative:-3,service:5,execution:8}[key]||0)
       : 0;
   result[key]=clamp(Math.round(35+(avg-60)*1.25+coverage*18+structureBias),35,98);
 }
 return result;
}
function capabilityDelta(candidate){
 const before=companyCapabilities(),after=companyCapabilities([...(S?.team||[]),candidate]),delta={};
 for(const k of Object.keys(CAPABILITY_META))delta[k]=after[k]-before[k];
 return delta;
}

function reputationLabel(score=S?.reputation||0){
 if(score>=90)return '行业顶流';
 if(score>=75)return '很有名';
 if(score>=60)return '圈内有名';
 if(score>=40)return '有些名气';
 return '还没什么人认识';
}

function reputationEffects(score=S?.reputation||0){
 const mature=(S?.year||1)>=4;
 const pitchBonus=mature?clamp(Math.round((score-50)*.12),-3,5):0;
 const oppBonus=mature?(score>=85?2:score>=60?1:score<30?-1:0):0;
 const marginBonus=mature?(score>=90?.06:score>=75?.04:score>=60?.02:score<30?-.03:score<40?-.015:0):0;
 const talentSkill=score>=90?6:score>=75?4:score>=60?2:score<25?-5:score<40?-3:0;
 const talentPay=score>=90?.70:score>=75?.78:score>=60?.88:score<25?1.15:score<40?1.10:1;
 return {pitchBonus,oppBonus,marginBonus,talentSkill,talentPay,mature};
}
function reputationImpactText(){
 const e=reputationEffects();
 const later=e.mature
   ? `新业务 ${e.oppBonus>=0?'+':''}${e.oppBonus} · 毛利 ${e.marginBonus>=0?'+':''}${Math.round(e.marginBonus*100)}pt`
   : '第4年起影响新业务与毛利';
 const talent=e.talentSkill
   ? `人才池 ${e.talentSkill>0?'+':''}${e.talentSkill}能力 · 薪资×${e.talentPay.toFixed(2)}`
   : '人才市场正常';
 return `${later} · ${talent} · 主动邀约 ${Math.round(inboundChance()*100)}%`;
}
function agencyType(){
 const caps=companyCapabilities();
 const entries=Object.entries(caps).sort((a,b)=>b[1]-a[1]);
 if(entries[0][1]-entries[3][1]<=5)return '综合型Agency';
 const map={strategy:'策略型Agency',creative:'创意热店',service:'客户服务型Agency',execution:'整合执行型Agency'};
 return map[entries[0][0]]||'综合型Agency';
}

function openingProjects(scaleKey){
 const defs={
   boutique6:[
     ['老客户 · 品牌日常顾问','retainer',90,.36,24,2,74,'service','creative'],
     ['在做 · 产品内容项目','small',35,.50,12,1,78,'creative','execution']
   ],
   growth20:[
     ['老客户 · 年度品牌服务','retainer',380,.31,48,5,75,'service','strategy'],
     ['老客户 · 社媒与内容','retainer',220,.34,36,4,73,'creative','service'],
     ['在做 · 新品传播项目','pitch',260,.38,24,4,77,'creative','strategy']
   ],
   integrated40:[
     ['核心客户 · 年度整合服务','retainer',1000,.28,48,8,76,'service','execution'],
     ['核心客户 · 品牌年度顾问','retainer',650,.30,48,7,74,'strategy','service'],
     ['在做 · 大型新品战役','pitch',900,.35,36,8,78,'creative','execution']
   ]
 };
 return (defs[scaleKey]||defs.growth20).map(x=>ensureProjectNeeds({
   id:uid(),name:x[0],type:x[1],value:x[2],margin:x[3],weeks:x[4],left:x[4],people:x[5],quality:x[6],
   needPrimary:x[7],needSecondary:x[8],legacy:true
 }));
}


let S=null;
let gossipTimer=null;
const STANDARD_YEARS=12;
const MAX_YEARS=30;
const SAVE_KEY='agency-cashflow-save-v1';

function readSavedGame(){
 try{
   const raw=localStorage.getItem(SAVE_KEY);
   if(!raw)return null;
   const data=JSON.parse(raw);
   if(!data||!DIFF[data.diff]||!Number.isFinite(data.year))return null;
   return data;
 }catch(e){return null}
}
function normalizeLoadedGame(data){
 const defaults={
   pendingHires:[],pendingRenewals:[],awaitingYearEnd:false,lastBudgetShrinkYear:0,evergreen:false,sevenYearCelebrated:false,qualityMomentum:0,gossip:[],log:[],opp:[],active:[],
   route:{pitch:0,retainer:0,small:0,free:0},yearStartProfit:0,scale:'growth20',
   records:{maxDeal:0,maxQuarterProfit:null,maxWinStreak:0,maxTeam:0,projects:0,inboundOffers:0}
 };
 const loaded=Object.assign(defaults,data);
 if(!data.scale||!START_SCALES[data.scale]){
   const n=(loaded.team||[]).length;
   loaded.scale=n<=10?'boutique6':n>=32?'integrated40':'growth20';
 }
 loaded.route=Object.assign({pitch:0,retainer:0,small:0,free:0},loaded.route||{});
 loaded.records=Object.assign({maxDeal:0,maxQuarterProfit:null,maxWinStreak:0,maxTeam:0,projects:0,inboundOffers:0},loaded.records||{});
 if(!Number.isFinite(loaded.records.maxQuarterProfit))loaded.records.maxQuarterProfit=-Infinity;
 loaded.awaitingYearEnd=!!loaded.awaitingYearEnd;
 loaded.lastBudgetShrinkYear=Number(loaded.lastBudgetShrinkYear)||0;
 loaded.evergreen=!!loaded.evergreen||loaded.year>STANDARD_YEARS;
 loaded.sevenYearCelebrated=typeof data.sevenYearCelebrated==='boolean'?data.sevenYearCelebrated:loaded.year>7;
 loaded.yearStartProfit=Number.isFinite(loaded.yearStartProfit)
   ? loaded.yearStartProfit
   : (Number(loaded.profit)||0)-(Number(loaded.taxable)||0);
 loaded.team=(loaded.team||[]).map(p=>normalizePerson(p));
 loaded.opp=(loaded.opp||[]).map(o=>ensureProjectNeeds(o));
 loaded.pendingRenewals=(loaded.pendingRenewals||[]).map(o=>ensureProjectNeeds(o));
 loaded.year=clamp(Number(loaded.year)||1,1,MAX_YEARS);
 loaded.quarter=clamp(Number(loaded.quarter)||1,1,4);
 loaded.ended=false;
 return loaded;
}
function saveGame(showFeedback=false){
 if(!S||S.ended)return;
 try{
   const payload=JSON.stringify(S,(k,v)=>typeof v==='number'&&!Number.isFinite(v)?null:v);
   localStorage.setItem(SAVE_KEY,payload);
   if(showFeedback)showSaveToast('已存档',`第 ${S.year} 年 Q${S.quarter} · ${fmt(S.profit)}`);
 }catch(e){
   if(showFeedback)showSaveToast('存档失败','浏览器没有允许本地存储。',true);
 }
}
function manualSave(){saveGame(true)}
function clearSave(){
 try{localStorage.removeItem(SAVE_KEY)}catch(e){}
}
function deleteSaveFromStart(){
 clearSave();S=null;render();
}
function loadSavedGame(){
 const data=readSavedGame();
 if(!data)return;
 S=normalizeLoadedGame(data);
 render();
 showSaveToast('存档已读取',`继续第 ${S.year} 年 Q${S.quarter}`);
 if(S.awaitingYearEnd)setTimeout(()=>yearEnd(),250);
 else if(S.year===7&&!S.sevenYearCelebrated)setTimeout(()=>showSevenYearCongrats(),300);
}
function showSaveToast(title,copy,bad=false){
 const old=document.querySelector('.save-toast');if(old)old.remove();
 const host=document.createElement('div');
 host.className=`save-toast ${bad?'save-toast-bad':''}`;
 host.innerHTML=`<b>${title}</b><span>${copy}</span>`;
 document.body.appendChild(host);
 setTimeout(()=>host.classList.add('result-leave'),1600);
 setTimeout(()=>host.remove(),2100);
}
function start(scaleKey){
 const profile=START_SCALES[scaleKey]||START_SCALES.growth20;
 const team=buildStarterTeam(profile.key);
 S={diff:'2026',scale:profile.key,year:1,quarter:1,week:1,cash:profile.startCash,profit:0,revenue:0,taxable:0,reputation:profile.startRep,morale:profile.startMorale,team,opp:[],active:openingProjects(profile.key),log:[],gossip:[],wins:0,losses:0,winStreak:0,lossStreak:0,totalPitches:0,bonusMonths:1,party:0,followups:0,ended:false,pendingHires:[],pendingRenewals:[],awaitingYearEnd:false,lastBudgetShrinkYear:0,evergreen:false,sevenYearCelebrated:false,qualityMomentum:0,route:{pitch:0,retainer:0,small:0,free:0},yearSpend:0,yearStartProfit:0,records:{maxDeal:0,maxQuarterProfit:-Infinity,maxWinStreak:0,maxTeam:team.length,projects:0,inboundOffers:0}};
 allocateLegacy();
 genOpp();
 log(`接手 ${profile.name}。利润和声望是两条路，四项能力决定你更擅长哪种生意。`,'');
 render();
 saveGame(false);
}
function isSenior(p){
 return p.role==='老板'||p.role.includes('总监')||p.role.includes('资深')||p.skill>=84;
}
function capacity(p){
 return isSenior(p)?2:1;
}
function seniorCount(){return S.team.filter(isSenior).length}
function seniorRatio(){return S.team.length?seniorCount()/S.team.length:0}
function moralePerformanceModifier(){
 return clamp((S.morale-70)*.12,-5,4);
}
function moraleQualityModifier(){
 return clamp((S.morale-70)*.10,-4,3);
}

function normalizePerson(p){
 if(!Array.isArray(p.slots))p.slots=p.busy>0?[p.busy]:[];
 delete p.busy;
 return p;
}
function activeLoads(p){normalizePerson(p);return p.slots.filter(w=>w>0)}
function freeSlots(p){return Math.max(0,capacity(p)-activeLoads(p).length)}
function assignPerson(p,weeks){
 normalizePerson(p);
 if(freeSlots(p)<=0)return false;
 p.slots.push(weeks);
 return true;
}
function allocateLegacy(){
 let cursor=0;
 for(const project of S.active){
   let need=Math.min(project.people||0,S.team.length);
   while(need>0&&cursor<S.team.length){
     if(assignPerson(S.team[cursor],project.left||project.weeks||12))need--;
     cursor++;
   }
 }
}
function available(){return S.team.filter(p=>freeSlots(p)>0)}
function totalFreeSlots(){return S.team.reduce((a,p)=>a+freeSlots(p),0)}
function statusText(p){
 const loads=activeLoads(p),cap=capacity(p);
 if(!loads.length)return cap===2?'空闲 · 可双开':'空闲';
 const longest=Math.max(...loads);
 if(cap===2)return `${loads.length}/2 项目 · 最长${longest}周`;
 return `忙 ${longest}周`;
}
function payroll(){return S.team.reduce((a,p)=>a+p.salary,0)}
function totalCapacity(){return S.team.reduce((a,p)=>a+capacity(p),0)}
function usedCapacity(){return S.team.reduce((a,p)=>a+activeLoads(p).length,0)}
function businessScaleStep(n=S.team.length){return Math.max(0,Math.floor((n-10)/5))}
function businessScaleBand(n=S.team.length){return n<10?6:Math.max(10,Math.floor(n/5)*5)}
function nextScaleAt(n=S.team.length){return (Math.floor(n/5)+1)*5}
function scaleValueTier(values,step){
 const baseIndex=Math.floor(Math.random()*values.length);
 return values[Math.min(values.length-1,baseIndex+step)];
}
function unlockCap(){
 const n=S.team.length;
 let base=480;
 if(n>=40)base=5000;
 else if(n>=35)base=3000;
 else if(n>=30)base=1800;
 else if(n>=25)base=1200;
 else if(n>=20)base=800;
 else if(n>=15)base=600;
 return Math.round(base*projectPriceIndex()/10)*10;
}
function showScaleUpgrade(before,after){
 const oldBand=businessScaleBand(before),newBand=businessScaleBand(after);
 if(newBand<=oldBand)return;
 const gained=businessScaleStep(after)-businessScaleStep(before);
 log(`公司跨进 ${newBand} 人档：之后新刷新的业务整体上升 ${gained} 个案值档位。毛利率区间基本不变，更大的单不等于更高利润。`,'good');
 const old=document.querySelector('.scale-toast');if(old)old.remove();
 const host=document.createElement('div');host.className='scale-toast';
 host.innerHTML=`<b>公司规模扩大，可以接更大的单了</b><span>${newBand} 人档 · 新业务案值 +${gained} 档 · 毛利率不自动变高</span>`;
 document.body.appendChild(host);
 setTimeout(()=>host.classList.add('result-leave'),2200);
 setTimeout(()=>host.remove(),2700);
}
function showManpowerDelta(before,after,reason=''){
 if(before===after)return;
 const old=document.querySelector('.manpower-toast');if(old)old.remove();
 const delta=after-before;
 const host=document.createElement('div');
 host.className=`manpower-toast ${delta>0?'manpower-up':'manpower-down'}`;
 host.innerHTML=`<div class="manpower-toast-label">人力变化</div><b>${before} → ${after}</b><strong>${delta>0?'+':''}${delta}</strong><span>${reason}</span>`;
 document.body.appendChild(host);
 setTimeout(()=>host.classList.add('result-leave'),1800);
 setTimeout(()=>host.remove(),2300);
}
function trackProject(o){
 if(!S.records)return;
 S.records.projects++;
 S.records.maxDeal=Math.max(S.records.maxDeal,o.value||0);
}

function projectReputationDelta(p){
 ensureProjectNeeds(p);
 const q=Number(p.quality)||0;
 const potential=Number(p.reputationValue)||calculateProjectReputationValue(p);
 const continuityPenalty=Number(p.reputationContinuityPenalty)||0;
 let delta=0;
 if(q>=94)delta=potential;
 else if(q>=88)delta=Math.max(1,Math.ceil(potential*.65));
 else if(q>=82&&potential>=4)delta=Math.max(1,Math.ceil(potential*.3));
 else if(q<52)delta=-Math.max(2,Math.ceil(potential*.45));
 else if(q<60)delta=-1;
 if(delta>0)delta=Math.max(0,delta-continuityPenalty);
 return delta;
}
function applyProjectReputation(p){
 const delta=projectReputationDelta(p);
 if(!delta)return;
 S.reputation=clamp(S.reputation+delta,0,100);
 const title=delta>=4?'代表作级项目':delta>0?'作品开始被看见':'这次交付伤了口碑';
 log(`${title}：${p.name} 完成，质量 ${Math.round(p.quality)}，行业声望 ${delta>0?'+':''}${delta}。`,delta>0?'good':'bad');
}
function updateTeamRecord(){
 if(S&&S.records)S.records.maxTeam=Math.max(S.records.maxTeam,S.team.length);
}
function bigWinTier(value){
 const real=realProjectValue(value);
 if(real>=3000)return {level:'legend',kicker:'MEGA WIN',title:'超级大单，拿下了',note:'这已经不是一单生意，是公司履历上的一道划痕。'};
 if(real>=1000)return {level:'million',kicker:'BIG WIN',title:'千万级客户，进门了',note:'从这一单开始，别人会重新判断你们是什么体量的公司。'};
 if(real>=500)return {level:'big',kicker:'BIG PITCH',title:'大单拿下',note:'这一单够让财务表和朋友圈同时好看一点。'};
 return null;
}
function showComboFeedback(streak){
 if(streak<2)return;
 const old=document.querySelector('.combo-toast');if(old)old.remove();
 const host=document.createElement('div');
 host.className=`combo-toast combo-${streak>=5?'hot':streak>=3?'warm':'start'}`;
 const copy=streak>=5
   ? '五连胜。新业务手感已经热得不讲道理。'
   : streak>=3
     ? '三连胜。手感起来了，但稿赢下来还得做出来。'
     : '两连胜。手感起来了。';
 host.innerHTML=`<span>PITCH COMBO</span><b>×${streak}</b><small>${copy}</small>`;
 document.body.appendChild(host);
 setTimeout(()=>host.classList.add('result-leave'),2200);
 setTimeout(()=>host.remove(),2700);
}
function inboundChance(){
 let chance=.02;
 const mature=(S?.year||1)>=4;
 if(mature){
   if(S.reputation>=40)chance+=.04;
   if(S.reputation>=55)chance+=.06;
   if(S.reputation>=70)chance+=.08;
   if(S.reputation>=85)chance+=.10;
   if(S.reputation>=95)chance+=.08;
 }
 chance+=Math.min(mature?.12:.04,(S.qualityMomentum||0)*(mature?.04:.02));
 return clamp(chance,0,.52);
}
function createInboundOpportunity(){
 const base=makeOpportunity('pitch');
 base.inbound=true;
 base.inboundBonus=12;
 base.name='主动邀约 · '+pick(['年度品牌战役','新品整合传播','品牌焕新项目','下一年度核心战役']);
 delete base.needPrimary;delete base.needSecondary;ensureProjectNeeds(base);
 base.fameMarginBonus=base.reputationMarginBonus||0;
 base.margin=Math.min(.60,+(base.margin+.02).toFixed(2));
 base.people=requiredPeople('pitch',base.value,base.duration);
 if(S.records)S.records.inboundOffers++;
 return base;
}
function maybeAddInbound(){
 const chance=inboundChance();
 if(Math.random()>=chance)return;
 const inbound=createInboundOpportunity();
 S.opp.unshift(inbound);
 log(`有客户主动找上门：${inbound.name}，案值 ${fmt(inbound.value)}。最近的项目和口碑开始替你做新业务了。`,'good');
}

const GOSSIP_COMMON=[
 'A社创意总监跳去D公司，据说带走了半个组。',
 'B广告的创意和阿康在客户楼下吵起来，十分钟后一起回去改稿。',
 'C公司内部在传一段桃色八卦。没人承认，但所有人都知道。',
 'D公司某客户被曝暗示要回扣，内部两天后悄悄换了接口人。',
 'E广告今年到现在一个奖都没拿，老板说：奖不重要。',
 'F社刚赢下大Pitch，第二天客户就说预算先砍30%。',
 'G公司新来的ECD第一周把三条在做的片子全部推翻。',
 'H广告有人连夜辞职，第二天又以Free身份回来了。',
 'A公司某总监据说同时在谈三家，HR群里已经互相通气。',
 'B社老板在全员会上说今年不裁员，大家默默看了一眼财务。',
 'C创意刚拿了一个奖，客户问：能不能把获奖版改得再卖货一点。',
 'D广告某阿康连续三晚住公司，第四天客户说项目延期。',
 'E公司新业务负责人来了两个月，LinkedIn已经开始更新。',
 'F社有个项目改了27轮，最后客户选回了第一版。',
 'G广告有人把内部吐槽错发进客户群，撤回速度创下公司纪录。',
 'H公司老板说要做精品小公司，第二周开始疯狂招人。',
 'A社某组连续赢了三个Pitch，隔壁组开始研究他们到底用了什么模板。',
 'B广告今年营收涨了，利润没涨，老板讲话明显短了。',
 'C公司刚搬进新办公室，传闻房租比一个年框还贵。',
 'D社某创意拿着竞品奖杯照片开会，说大家先别聊洞察了。',
 'E广告的策略总监突然离职，所有项目一夜之间都变成“先凭感觉来”。',
 'F公司某客户总监据说谈回了一个大单，条件是全员周末待命。',
 'G社有个Free连续干了半年，大家已经忘了他不是正式员工。',
 'H广告某老板在朋友圈发“做难而正确的事”，公司群里没人点赞。'
];

const GOSSIP_BY_ERA={
 '2006':[
   'A公司传出创意总监被外资4A挖走，薪水据说直接翻倍。',
   'B广告为了一个电视广告Pitch，整整打印了六本厚提案。',
   'C社老板说互联网广告还早，先把电视TVC做好。',
   'D公司某客户坚持传真改稿，创意部第一次集体沉默。',
   'E广告刚买了一整面奖杯柜，今年还空着一半。'
 ],
 '2016':[
   'A社开始高薪抢Social人才，传统创意组突然有点坐不住了。',
   'B公司拿下互联网大客户，全员朋友圈统一发“新伙伴”。',
   'C广告有人说短视频会改变行业，会议室里一半人不信。',
   'D社某项目一晚上出了80张社交海报，第二天只发了3张。',
   'E公司在讨论要不要成立内容实验室，名字已经想了六版。'
 ],
 '2026':[
   'A公司宣布全面AI化，第一件事是开了三场会讨论怎么AI化。',
   'B广告客户要求先用AI出50版，再从里面“找感觉”。',
   'C社某创意总监因为一句“这AI也能做”当场沉默了七秒。',
   'D公司刚裁完一轮，又开始招“懂AI的新型创意”。',
   'E广告今年没报几个奖，老板说先把现金流做好。'
 ]
};

function refreshGossip(){
 const pool=[...GOSSIP_COMMON,...(GOSSIP_BY_ERA[S.diff]||[])];
 const shuffled=[...pool].sort(()=>Math.random()-.5);
 S.gossip=[economyBulletin(),...shuffled.slice(0,7)];
 S.gossipIndex=0;
}
function gossipHTML(){
 if(!S.gossip||!S.gossip.length)refreshGossip();
 const index=Number.isFinite(S.gossipIndex)?S.gossipIndex%S.gossip.length:0;
 return `<div class="gossip-strip">
   <div class="gossip-label">圈内小报 · ${economyPhase().label}</div>
   <div class="gossip-single" id="gossipSingle">${S.gossip[index]}</div>
 </div>`;
}
function gossipReadTime(text){
 // 中文以完整阅读为主：短消息约3秒，长消息最高约7秒。
 return clamp(2000+String(text||'').length*110,3000,7000);
}
function scheduleGossipRotation(){
 if(gossipTimer){clearTimeout(gossipTimer);gossipTimer=null}
 if(!S||!S.gossip||S.gossip.length<2)return;
 const el=document.getElementById('gossipSingle');
 if(!el)return;
 const current=S.gossip[Number.isFinite(S.gossipIndex)?S.gossipIndex%S.gossip.length:0];
 gossipTimer=setTimeout(()=>{
   const live=document.getElementById('gossipSingle');
   if(!live)return;
   live.classList.add('gossip-fade');
   setTimeout(()=>{
     if(!S||!S.gossip||!S.gossip.length)return;
     S.gossipIndex=((Number.isFinite(S.gossipIndex)?S.gossipIndex:0)+1)%S.gossip.length;
     const next=document.getElementById('gossipSingle');
     if(!next)return;
     next.textContent=S.gossip[S.gossipIndex];
     next.classList.remove('gossip-fade');
     scheduleGossipRotation();
   },220);
 },gossipReadTime(current));
}

function needProfileFor(type,name=''){
 if(name.includes('品牌焕新')||name.includes('品牌顾问'))return ['strategy','creative'];
 if(name.includes('新品'))return ['creative','strategy'];
 if(name.includes('超级')||name.includes('大型')||name.includes('整合'))return ['execution','service'];
 if(name.includes('年度战役')||name.includes('核心战役'))return ['creative','service'];
 if(name.includes('社媒')||name.includes('内容'))return ['service','creative'];
 if(type==='retainer')return ['service','strategy'];
 if(type==='small')return ['creative','execution'];
 return ['creative','strategy'];
}
function projectFlavor(o){
 const needs=[o.needPrimary,o.needSecondary];
 const prestige=needs.filter(k=>k==='strategy'||k==='creative').length;
 const delivery=needs.filter(k=>k==='service'||k==='execution').length;
 if(prestige===2)return 'prestige';
 if(delivery===2)return 'delivery';
 return 'mixed';
}
function calculateProjectReputationValue(o){
 const real=realProjectValue(o.value||0);
 const sizeBase=real>=3000?5:real>=1000?4:real>=500?3:real>=150?2:1;
 const needs=[o.needPrimary,o.needSecondary];
 const prestige=needs.filter(k=>k==='strategy'||k==='creative').length;
 const delivery=needs.filter(k=>k==='service'||k==='execution').length;
 let value=sizeBase+prestige*2-(delivery===2?1:0)-(o.type==='retainer'?1:0);
 return clamp(Math.round(value),1,9);
}
function ensureProjectNeeds(o){
 if(!o)return o;
 if(!o.needPrimary||!o.needSecondary){
   const [primary,secondary]=needProfileFor(o.type,o.name||'');
   o.needPrimary=primary;o.needSecondary=secondary;
 }
 if(!Number.isFinite(o.reputationValue))o.reputationValue=calculateProjectReputationValue(o);
 return o;
}
function applyProjectEconomics(o){
 ensureProjectNeeds(o);
 if(o.economicsApplied)return o;
 const flavor=projectFlavor(o);
 if(flavor==='delivery'){
   o.value=Math.min(unlockCap(),Math.max(1,Math.round(o.value*1.15)));
   o.margin=+(Math.max(.16,o.margin-.04)).toFixed(2);
 }else if(flavor==='prestige'){
   o.value=Math.max(1,Math.round(o.value*.88));
   o.margin=+(Math.min(.58,o.margin+.05)).toFixed(2);
 }
 const repMargin=reputationEffects().marginBonus;
 o.reputationMarginBonus=repMargin;
 o.margin=+clamp(o.margin+repMargin,.14,.60).toFixed(2);
 o.people=requiredPeople(o.type,o.value,o.duration);
 o.reputationValue=calculateProjectReputationValue(o);
 o.economicsApplied=true;
 return o;
}
function pitchSupportStrength(o){
 const people=o?.pitchSupportPeople||[];
 if(!o?.pitchSupport||!people.length)return 0;
 const avg=people.reduce((a,p)=>a+(Number(p.skill)||70),0)/people.length;
 return clamp(Math.round((avg-62)*.35),5,10);
}
function projectMatch(o){
 ensureProjectNeeds(o);
 const caps=companyCapabilities();
 const basePrimary=caps[o.needPrimary]||60,baseSecondary=caps[o.needSecondary]||60;
 const support=pitchSupportStrength(o);
 const primary=clamp(basePrimary+(o.pitchSupport?support:0),35,99);
 const secondary=clamp(baseSecondary+(o.pitchSupport?Math.round(support*.7):0),35,99);
 const baseScore=Math.round(basePrimary*.65+baseSecondary*.35);
 const score=Math.round(primary*.65+secondary*.35);
 const basePitchBonus=clamp(Math.round((baseScore-72)*1.10),-22,22);
 const pitchBonus=clamp(Math.round((score-72)*1.10),-22,22);
 const qualityBonus=clamp(Math.round((score-72)*.50),-8,10);
 const label=score>=84?'强项':score>=76?'有优势':score>=67?'一般':'短板';
 return {score,bonus:pitchBonus,pitchBonus,qualityBonus,label,primary,secondary,caps,supportBonus:pitchBonus-basePitchBonus};
}
function projectMatchDetail(o){
 const m=projectMatch(o);
 const p=CAPABILITY_META[o.needPrimary].label.replace('力','');
 const s=CAPABILITY_META[o.needSecondary].label.replace('力','');
 return `${p} ${m.primary} · ${s} ${m.secondary}`;
}
function projectNeedLabel(o){
 ensureProjectNeeds(o);
 return `${CAPABILITY_META[o.needPrimary].label} + ${CAPABILITY_META[o.needSecondary].label}`;
}
function rolesForCapability(key){
 if(key==='strategy')return ['策略'];
 if(key==='creative')return ['创意'];
 if(key==='service')return ['阿康'];
 return ['制片'];
}
function projectHireRoles(o,count){
 ensureProjectNeeds(o);
 const primary=rolesForCapability(o.needPrimary),secondary=rolesForCapability(o.needSecondary);
 const result=[];
 for(let i=0;i<count;i++){
   const pool=i%2===0?primary:secondary;
   result.push(pool[i%pool.length]);
 }
 return result;
}

function pitchSupportCost(o){
 const count=(o.pitchSupportPeople||[]).length;
 return +(count*freeWeeklyRate()*(o.pitchWeeks||2)).toFixed(1);
}
function togglePitchSupport(id){
 const o=S.opp.find(x=>x.id===id);if(!o||o.type!=='pitch')return;
 if(o.pitchSupport){
   o.pitchSupport=false;
   o.pitchSupportPeople=[];
 }else{
   o.pitchSupport=true;
   o.pitchSupportPeople=projectHireRoles(o,2).map(role=>createHireCandidate(role));
 }
 render();saveGame(false);
}
function showPitchSupportRetentionChoice(o,onChoice){
 const people=o.pitchSupportPeople||[];
 if(!people.length){onChoice('none');return}
 const host=document.createElement('div');
 host.className='overlay';host.id='pitchSupportRetentionModal';
 const monthly=people.reduce((a,p)=>a+p.salary,0);
 const fee=+(monthly*.5).toFixed(1);
 const execCost=+(people.length*freeWeeklyRate()*o.duration).toFixed(1);
 host.innerHTML=`<div class="modal staffing-modal">
   <div class="big">这批 Pitch Free，留不留？</div>
   <p><b>${o.name}</b> 已经赢了。这 ${people.length} 位外部同事分别补的是 ${projectNeedLabel(o)}。</p>
   <div class="staffing-options">
     <div class="staffing-option">
       <h3>转成正式员工</h3>
       <p>${people.map(p=>`${p.role} · 能力 ${p.skill}`).join('<br>')}</p>
       <p><b>转正成本约 ${fmt(fee)}</b><br>以后每月固定工资 +${fmt(monthly)}</p>
       <button class="btn" id="retainPitchFree">留下他们</button>
     </div>
     <div class="staffing-option">
       <h3>继续按 Free 合作</h3>
       <p>不增加正式编制，执行期继续按项目合作。</p>
       <p><b>执行合作成本约 ${fmt(execCost)}</b></p>
       <button class="btn secondary" id="keepPitchFreeExternal">继续用 Free</button>
     </div>
   </div>
 </div>`;
 document.body.appendChild(host);
 host.querySelector('#retainPitchFree').onclick=()=>{
   host.remove();
   const before=S.team.length;
   S.cash-=fee;S.profit-=fee;S.yearSpend+=fee;
   people.forEach(p=>{S.team.push(p);assignPerson(p,o.duration)});
   showScaleUpgrade(before,S.team.length);
   log(`把 ${people.length} 位 Pitch Free 留进正式团队。招聘成本 ${fmt(fee)}，每月固定工资 +${fmt(monthly)}。`,'good');
   onChoice('converted');
 };
 host.querySelector('#keepPitchFreeExternal').onclick=()=>{host.remove();onChoice('external')};
}

function requiredPeople(type,value,duration){
 const real=realProjectValue(value);
 if(type==='small'){
   if(real<=15)return 1;
   if(real<=40)return 2;
   return 3;
 }
 if(type==='retainer'){
   let n=real<120?3:real<300?4:real<600?5:real<1000?6:real<1600?8:real<2500?10:12;
   if(duration>=48)n+=1;
   return clamp(n,3,12);
 }
 let n=real<100?3:real<300?4:real<600?5:real<1000?6:real<1800?8:real<3000?10:12;
 return clamp(n,3,12);
}

function makeOpportunity(forced=''){
 const d=gameRules(), cap=unlockCap(), econ=economyPhase();
 const r=Math.random();
 let type=forced;
 if(!type){
   let [smallCut,retainerCut]=econ.mix;
   if(S.scale){
     const shift=startScale().mixShift||[0,0];
     smallCut=clamp(smallCut+shift[0],.06,.60);
     retainerCut=clamp(retainerCut+shift[1],smallCut+.04,.82);
   }
   type=r<smallCut?'small':r<retainerCut?'retainer':'pitch';
 }
 const scaleStep=businessScaleStep();
 let value;
 if(type==='small') value=scaleValueTier([8,15,25,40,60,80,120],scaleStep);
 else if(type==='retainer') value=scaleValueTier([80,120,180,300,500,800,1200,1500,2200,3000],scaleStep);
 else value=scaleValueTier([50,80,120,200,300,500,800,1200,1800,3000,5000],scaleStep);
 value=Math.round(value*d.deal*econ.deal*projectPriceIndex());
 value=Math.min(value,cap);
 const realValue=realProjectValue(value);
 // 实际规模达到千万级的业务一律需要比稿；名义价格上涨不改变业务等级。
 if(realValue>=1000&&type!=='pitch')type='pitch';
 let people=2;
 let duration;
 if(type==='small') duration=pick([4,8,12]);
 else if(type==='retainer') duration=pick([24,36,48,48]);
 else if(realValue<100) duration=pick([8,12]);
 else if(realValue<300) duration=pick([12,24,24]);
 else if(realValue<800) duration=pick([24,36,36]);
 else duration=pick([36,48,48]);
 people=requiredPeople(type,value,duration);
 const margin= type==='retainer'?pick([.22,.28,.33,.38]):type==='small'?pick([.45,.5,.55]):pick([.28,.34,.4,.46]);
 const namesBy={small:['临时物料包','社媒快单','老板朋友的急活','产品内容小单'],retainer:['半年年框','年度社媒年框','品牌年度顾问','内容长期服务'],pitch:realValue>=1000?['大型整合Pitch','年度核心战役Pitch','超级整合Pitch','品牌焕新Pitch']:['新品上市Pitch','整合传播Pitch','品牌焕新Pitch','年度战役Pitch']};
 const pitchWeeks=type==='pitch'?pick([2,2,2,3]):0;
 const pitchFee=(type==='pitch'&&!S.scale&&S.diff==='2016')?+(pick([2,3,4,5])*projectPriceIndex()).toFixed(1):0;
 const opportunity={id:uid(),name:pick(namesBy[type]),type,value,people,duration,margin,pitchWeeks,pitchFee,freeAllowed:true,pitchSupport:false};
 ensureProjectNeeds(opportunity);
 return applyProjectEconomics(opportunity);
}
function renewalChance(morale){
 let base=morale<75?0:morale<85?.25:morale<95?.45:.65;
 const service=companyCapabilities().service;
 const serviceBonus=clamp((service-70)*.008,-.08,.14);
 return clamp(base+economyPhase().renewal+serviceBonus,0,.78);
}
function maybeCreateRenewal(p){
 if(!p||p.type!=='retainer')return;
 const chance=renewalChance(S.morale);
 if(!chance||Math.random()>=chance)return;

 let value=Math.round(p.value*pick([.95,1,1,1.05]));
 value=Math.min(value,unlockCap());
 const drop=pick([.02,.03,.04]);
 const margin=Math.max(.15,+((p.margin||.28)-drop).toFixed(2));
 const duration=p.weeks||pick([24,36,48]);
 const isBig=realProjectValue(value)>=1000;
 const type=isBig?'pitch':'retainer';
 const baseName=String(p.name||'老客户').replace(/^续约机会 · |^续约比稿 · /,'');
 const repMargin=reputationEffects().marginBonus;
 const renewal={
   id:uid(),
   name:`${isBig?'续约比稿':'续约机会'} · ${baseName}`,
   type,
   value,
   people:requiredPeople(type,value,duration),
   duration,
   margin:+clamp(margin+repMargin,.14,.60).toFixed(2),
   pitchWeeks:isBig?pick([2,2,3]):0,
   pitchFee:(isBig&&S.diff==='2016')?+(pick([2,3,4,5])*projectPriceIndex()).toFixed(1):0,
   freeAllowed:true,
   pitchSupport:false,
   renewal:true,
   reputationMarginBonus:repMargin,
   previousMargin:p.margin
 };
 ensureProjectNeeds(renewal);
 S.pendingRenewals.push(renewal);
 log(`${baseName} 想续约。团队士气 ${S.morale}，客户愿意继续谈，但毛利从 ${Math.round((p.margin||0)*100)}% 压到 ${Math.round(margin*100)}%。`,'good');
}
function genOpp(){
 const econ=economyPhase();
 const n=Math.max(2,gameRules().opp + econ.opp + reputationEffects().oppBonus);
 S.opp=[];
 for(let i=0;i<n;i++)S.opp.push(makeOpportunity());
 if(S.pendingRenewals&&S.pendingRenewals.length){
   S.opp=[...S.pendingRenewals,...S.opp];
   S.pendingRenewals=[];
 }
 maybeAddInbound();
 refreshGossip();
}
function log(msg,cls=''){S.log.unshift({msg,cls}); S.log=S.log.slice(0,60)}
function executionFreeCostFor(o,freeCount){
 return +(freeCount*freeWeeklyRate()*o.duration).toFixed(1);
}
function pitchFreeCostFor(o,freeCount){
 const weeks=o.pitchWeeks||2;
 return +(freeCount*freeWeeklyRate()*weeks).toFixed(1);
}
function requestProject(id){
 const o=S.opp.find(x=>x.id===id); if(!o)return;
 const lack=Math.max(0,o.people-available().length);
 if(lack>0){showStaffingChoice(o,lack);return}
 takeProject(id,false);
}
function createHireCandidate(requestedRole=''){
 const role=requestedRole||pick(roles);
 const market=reputationEffects();
 const skill=clamp(Math.round(68+Math.random()*23+market.talentSkill),60,96);
 const salary=+(salaryFor(role,skill)*market.talentPay).toFixed(1);
 return {id:uid(),name:pick(names),role:roleTitle(role,skill),spec:roleSpec(role),salary,skill,slots:[],tenure:0};
}
function candidateImpactHTML(person){
 const delta=capabilityDelta(person);
 const changes=Object.entries(delta).filter(([,v])=>v!==0).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]));
 if(!changes.length)return '<span>四维基本不变，主要增加人力容量</span>';
 return changes.slice(0,3).map(([k,v])=>`<span class="${v<0?'impact-down':''}">${CAPABILITY_META[k].label} <b>${v>0?'+':''}${v}</b></span>`).join('');
}
function commitHire(person,host=null){
 const before=S.team.length,fee=person.salary*.5;
 S.cash-=fee;S.profit-=fee;S.yearSpend+=fee;
 S.pendingHires.push({person});
 log(`签下 ${person.name}（${person.role}），月薪 ${fmt(person.salary)}。招聘费 ${fmt(fee)}，${isAnnualMode()?'明年':'下季度'}到岗。`,'good');
 if(host)host.remove();
 render();saveGame(false);showHireIncentive(1);
 if(businessScaleBand(before+S.pendingHires.length)>businessScaleBand(before))log('这次扩编会把公司推入更高业务规模档。','muted');
}
function hire(){
 const old=document.getElementById('hireModal');if(old)old.remove();
 const candidates=roles.map(role=>createHireCandidate(role));
 const market=reputationEffects();
 const talentCopy=market.talentSkill===0
   ? '人才市场正常'
   : `声望带来的招聘条件：候选能力 ${market.talentSkill>0?'+':''}${market.talentSkill} · 薪资市场 ×${market.talentPay.toFixed(2)}`;
 const host=document.createElement('div');host.className='overlay';host.id='hireModal';
 host.innerHTML=`<div class="modal hire-modal">
   <div class="big">这次想补哪种能力？</div>
   <p class="muted">行业声望 ${S.reputation} · ${talentCopy}。不同岗位会改变四维能力；小团队扩张时，普通新人也可能暂时稀释原来的能力密度。</p>
   <div class="hire-candidates">
     ${candidates.map((p,i)=>`<div class="hire-card">
       <div class="hire-role">${p.role}</div>
       <div class="hire-skill">能力 ${p.skill}</div>
       <div class="hire-pay">月薪 ${fmt(p.salary)} · 招聘费 ${fmt(p.salary*.5)}</div>
       <div class="hire-impact">${candidateImpactHTML(p)}</div>
       <button class="btn" data-hire-index="${i}">招进来</button>
     </div>`).join('')}
   </div>
   <button class="btn secondary" id="cancelHire">再看看</button>
 </div>`;
 document.body.appendChild(host);
 host.querySelector('#cancelHire').onclick=()=>host.remove();
 host.querySelectorAll('[data-hire-index]').forEach(btn=>btn.onclick=()=>commitHire(candidates[+btn.dataset.hireIndex],host));
}
function hireForProject(o,candidates){
 const before=S.team.length;
 const fee=candidates.reduce((a,p)=>a+p.salary,0);
 const monthly=candidates.reduce((a,p)=>a+p.salary,0);
 S.cash-=fee;S.yearSpend+=fee;S.profit-=fee;
 candidates.forEach(p=>S.team.push(p));
 log(`为 ${o.name} 先扩了 ${candidates.length} 个正式编制，招聘费 ${fmt(fee)}；每月固定工资 +${fmt(monthly)}。`,'muted');
 showScaleUpgrade(before,S.team.length);
 render();
 takeProject(o.id,false);
}
function showStaffingChoice(o,freeCount){
 const old=document.getElementById('freeModal'); if(old)old.remove();
 const isPitch=o.type==='pitch';
 const freeCost=isPitch?pitchFreeCostFor(o,freeCount):executionFreeCostFor(o,freeCount);
 const share=freeCount/o.people;
 const candidates=projectHireRoles(o,freeCount).map(role=>createHireCandidate(role));
 const hireFee=candidates.reduce((a,p)=>a+p.salary,0);
 const newPayroll=candidates.reduce((a,p)=>a+p.salary,0);
 const host=document.createElement('div');host.className='overlay';host.id='freeModal';

 const freeRisk=isPitch
   ? (share>.5
      ? `Free 占到 ${Math.round(share*100)}%，超过一半：Pitch 胜率约再降 8 个百分点。这里只签 ${o.pitchWeeks} 周比稿期，不包含后续执行。`
      : `Free 只覆盖 ${o.pitchWeeks} 周比稿期。赢稿后如果继续执行，Free 仍按外部资源结算，不进入正式编制。`)
   : (share>.5
      ? `Free 占到 ${Math.round(share*100)}%，执行可以接，但外部团队过半，质量和声望风险更高。`
      : `Free 覆盖整个执行周期，代价是项目成本和轻微执行质量风险。`);

 host.innerHTML=`<div class="modal staffing-modal">
   <div class="big">人手不够，怎么补？</div>
   <p><b>${o.name}</b> 需要 ${o.people} 人，现在只有 ${available().length} 名可承担新项目的人，还差 <b>${freeCount} 人</b>。</p>
   <div class="staffing-options">
     <div class="staffing-option">
       <h3>先招正式员工</h3>
       <p>补 ${freeCount} 个正式编制，直接进入团队。</p>
       <p><b>招聘费约 ${fmt(hireFee)}</b><br>以后每月固定工资 +${fmt(newPayroll)}</p>
       <p class="muted">${isPitch?'Pitch 输了，人也已经招进来了。':'长期成本更高，但不承担 Free 的执行风险。'}</p>
       <button class="btn" id="confirmHire">招 ${freeCount} 人再${isPitch?'去比稿':'接下来'}</button>
     </div>
     <div class="staffing-option">
       <h3>${isPitch?'只在比稿期用 Free':'用 Free 执行'}</h3>
       <p>${isPitch?`合同只算 ${o.pitchWeeks} 周，不把执行周期提前算进去。`:'不扩正式编制，只覆盖这个项目。'}</p>
       <p><b>这阶段 Free 成本 ${fmt(freeCost)}</b><br><span class="muted">当前市场 Free 约 ${freeWeeklyRate().toFixed(1)}万 / 人 / 周（首年1万，随市场工资变化）</span></p>
       <p class="bad">${freeRisk}</p>
       <button class="btn secondary" id="confirmFree">用 ${freeCount} 个 Free ${isPitch?'去比稿':'接下来'}</button>
     </div>
   </div>
   <button class="btn secondary staffing-cancel" id="cancelFree">先不接</button>
 </div>`;
 document.body.appendChild(host);
 host.querySelector('#cancelFree').onclick=()=>host.remove();
 host.querySelector('#confirmFree').onclick=()=>{host.remove();takeProject(o.id,true)};
 host.querySelector('#confirmHire').onclick=()=>{host.remove();hireForProject(o,candidates)};
}
function startDirectExecution(o,selected,freeCount,freeCost,teamScore){
 const manpowerBefore=totalFreeSlots();
 selected.forEach(p=>assignPerson(p,o.duration));
 const freeShare=freeCount/o.people;
 const match=projectMatch(o);
 const execution=companyCapabilities().execution;
 const freePenalty=freeCount?freeShare*clamp(12-(execution-60)*.12,5,12):0;
 const quality=clamp(teamScore+match.qualityBonus+moraleQualityModifier()+Math.random()*12-6-freePenalty,42,98);
 if(freeCount){
   S.cash-=freeCost;S.yearSpend+=freeCost;S.profit-=freeCost;S.route.free+=freeCount;
   log(`执行期用了 ${freeCount} 个 Free，成本 ${fmt(freeCost)}。`,'muted');
 }
 S.active.push({id:uid(),name:o.name,type:o.type,value:o.value,margin:o.margin,weeks:o.duration,left:o.duration,people:o.people,quality,needPrimary:o.needPrimary,needSecondary:o.needSecondary,reputationValue:o.reputationValue,legacy:false,inbound:!!o.inbound,renewal:!!o.renewal});
 trackProject(o);
 log(`接下：${o.name}，案值 ${fmt(o.value)}。`,'good');
 S.opp=S.opp.filter(x=>x.id!==o.id);
 const manpowerAfter=totalFreeSlots();
 render();
 saveGame(false);
 showManpowerDelta(manpowerBefore,manpowerAfter,`${o.name} 进入执行`);
 showProjectResult({won:true,type:o.type,name:o.name,value:o.value,cost:freeCost,pWin:null});
}
function finalizePitchExecution(o,selected,freeCount,mode,teamScore,supportMode='none'){
 const manpowerBefore=totalFreeSlots();
 const freeShare=freeCount/o.people;
 let qualityPenalty=0;
 let reputationContinuityPenalty=0;

 if(mode==='free'){
   const executionFreeCost=executionFreeCostFor(o,freeCount);
   S.cash-=executionFreeCost;S.yearSpend+=executionFreeCost;S.profit-=executionFreeCost;S.route.free+=freeCount;
   selected.forEach(p=>assignPerson(p,o.duration));
   qualityPenalty+=freeShare*10;
   log(`赢稿后继续用 ${freeCount} 个 Free 执行 ${durationLabel(o.duration)}，执行期成本 ${fmt(executionFreeCost)}。`,'muted');
 }else{
   selected.forEach(p=>assignPerson(p,o.duration));
 }

 if(supportMode==='external'&&o.pitchSupportPeople?.length){
   const supportCost=+(o.pitchSupportPeople.length*freeWeeklyRate()*o.duration).toFixed(1);
   S.cash-=supportCost;S.yearSpend+=supportCost;S.profit-=supportCost;S.route.free+=o.pitchSupportPeople.length;
   qualityPenalty+=2.5;
   reputationContinuityPenalty=1;
   log(`Pitch Free 继续参与执行，合作成本 ${fmt(supportCost)}。`,'muted');
 }

 const match=projectMatch(o);
 const execution=companyCapabilities().execution;
 const executionRelief=freeCount?clamp((execution-65)*.08,0,3):0;
 const quality=clamp(teamScore+match.qualityBonus+moraleQualityModifier()+Math.random()*14-7-Math.max(0,qualityPenalty-executionRelief),42,98);
 S.active.push({id:uid(),name:o.name,type:o.type,value:o.value,margin:o.margin,weeks:o.duration,left:o.duration,people:o.people,quality,needPrimary:o.needPrimary,needSecondary:o.needSecondary,reputationValue:o.reputationValue,reputationContinuityPenalty,legacy:false,inbound:!!o.inbound,renewal:!!o.renewal});
 trackProject(o);
 const manpowerAfter=totalFreeSlots();
 render();
 saveGame(false);
 showManpowerDelta(manpowerBefore,manpowerAfter,`${o.name} 开始执行`);
}
function budgetShrinkChance(){
 return economyPhase().shrink;
}
function maybeShowBudgetShrink(o,onContinue){
 if(!o||o.type!=='pitch'||S.lastBudgetShrinkYear===S.year||Math.random()>=budgetShrinkChance()){
   onContinue();return;
 }
 S.lastBudgetShrinkYear=S.year;
 const oldValue=o.value;
 const newValue=Math.max(1,Math.round(oldValue*.5));
 const oldGross=oldValue*o.margin;
 const newGross=newValue*o.margin;
 const phase=economyPhase();
 const host=document.createElement('div');
 host.className='overlay budget-cut-overlay';
 host.id='budgetCutModal';
 host.innerHTML=`<div class="modal budget-cut-modal">
   <div class="budget-cut-kicker">BUDGET CUT · ${phase.label}</div>
   <div class="big">赢了，但预算缩水了。</div>
   <p>${pick(phase.cut)}</p>
   <div class="budget-cut-numbers">
     <span>原案值 <b>${fmt(oldValue)}</b></span>
     <strong>→</strong>
     <span>现在只剩 <b>${fmt(newValue)}</b></span>
   </div>
   <p class="muted">毛利率不变，但预计项目毛利从 <b>${fmt(oldGross)}</b> 降到 <b>${fmt(newGross)}</b>。人力需求和周期不自动减半。</p>
   <div class="row budget-cut-actions">
     <button class="btn" id="acceptBudgetCut">继续做缩水版</button>
     <button class="btn secondary" id="rejectBudgetCut">算了，不接</button>
   </div>
 </div>`;
 document.body.appendChild(host);
 host.querySelector('#acceptBudgetCut').onclick=()=>{
   host.remove();
   o.value=newValue;
   o.budgetShrunk=true;
   log(`赢稿后客户把 ${o.name} 从 ${fmt(oldValue)} 砍到 ${fmt(newValue)}。你决定继续做。`,'bad');
   saveGame(false);
   onContinue();
 };
 host.querySelector('#rejectBudgetCut').onclick=()=>{
   host.remove();
   log(`赢稿后 ${o.name} 预算从 ${fmt(oldValue)} 砍到 ${fmt(newValue)}。你决定不接这个缩水项目。`,'muted');
   saveGame(false);
   render();
 };
}

function takeProject(id,useFree=false){
 const o=S.opp.find(x=>x.id===id); if(!o)return;
 const avail=available();
 const internal=Math.min(avail.length,o.people);
 const freeCount=Math.max(0,o.people-internal);
 if(freeCount>0&&!useFree){showStaffingChoice(o,freeCount);return}
 const selected=[...avail].sort((a,b)=>b.skill-a.skill).slice(0,internal);
 const teamScore=selected.length?selected.reduce((a,p)=>a+p.skill,0)/selected.length:55;
 S.route[o.type]++;

 // 年框和散活直接进入执行，因此 Free 成本按完整执行周期计算。
 if(o.type!=='pitch'){
   const freeCost=freeCount?executionFreeCostFor(o,freeCount):0;
   startDirectExecution(o,selected,freeCount,freeCost,teamScore);
   return;
 }

 // Pitch 阶段独立计算：Free 只签 2–3 周，不占用完整执行周期。
 const freeShare=freeCount/o.people;
 const pitchFreeCost=freeCount?pitchFreeCostFor(o,freeCount):0;
 const match=projectMatch(o);
 const staffing=clamp((teamScore-72)*.25,-6,7);
 const supportBonus=match.supportBonus||0;
 const supportCost=o.pitchSupport?pitchSupportCost(o):0;
 const freePenalty=freeShare>.5?-8:0;
 const inboundBonus=o.inbound?(o.inboundBonus||12):0;
 const reputationBonus=reputationEffects().pitchBonus;
 const moraleBonus=moralePerformanceModifier();
 const pWin=clamp(34+gameRules().baseWin+match.bonus+staffing+freePenalty+inboundBonus+reputationBonus+moraleBonus,8,92);
 // 自有员工参与比稿不产生额外现金成本。Pitch Free 和缺口 Free 才产生增量费用。
 const grossPitchCost=+(supportCost+pitchFreeCost).toFixed(1);

 if(grossPitchCost>0){
   S.cash-=grossPitchCost;S.yearSpend+=grossPitchCost;S.profit-=grossPitchCost;
 }
 if(freeCount){S.route.free+=freeCount;log(`比稿期用了 ${freeCount} 个补位 Free，共 ${o.pitchWeeks} 周，成本 ${fmt(pitchFreeCost)}。`,'muted')}
 if(o.pitchSupport&&o.pitchSupportPeople?.length){
   S.route.free+=o.pitchSupportPeople.length;
   log(`另外补了 ${o.pitchSupportPeople.length} 位模块 Free（${projectNeedLabel(o)}），比稿成本 ${fmt(supportCost)}。`,'muted');
 }

 const pitchFee=o.pitchFee||0;
 if(pitchFee>0){
   S.cash+=pitchFee;S.revenue+=pitchFee;S.profit+=pitchFee;S.taxable+=pitchFee;
   log(`2016 比稿费到账：${fmt(pitchFee)}，无论输赢都收。`,'good');
 }

 S.totalPitches++;
 const won=Math.random()*100<pWin;
 const netPitchCost=+(grossPitchCost-pitchFee).toFixed(1);

 if(won){
   S.wins++;S.winStreak++;S.lossStreak=0;
   if(S.records)S.records.maxWinStreak=Math.max(S.records.maxWinStreak,S.winStreak);
   log(`赢了：${o.name}，案值 ${fmt(o.value)}，当时胜率约 ${pWin.toFixed(0)}%。`,'good');
   showComboFeedback(S.winStreak);
   if(S.winStreak===3){
     const f=makeOpportunity('small');f.name='连带散活 · '+f.name;f.value=Math.max(f.value,Math.round(o.value*.12));
     S.opp.push(f);S.followups++;
     log('三连胜。现有客户顺手追加了一笔连带散活。','good');
   }
   if(S.winStreak===5){
     log('五连胜。新业务手感热得发烫，但声望还是要靠最后做出来的作品。','good');
   }
 }else{
   S.losses++;S.lossStreak++;S.winStreak=0;
   const lossText=pitchFee>0
     ? (grossPitchCost>0
        ? `输了：${o.name}。额外比稿投入 ${fmt(grossPitchCost)}，收到比稿费 ${fmt(pitchFee)}，净结果 ${netPitchCost>0?'-'+fmt(netPitchCost).replace('-',''):'+'+fmt(Math.abs(netPitchCost))}。`
        : `输了：${o.name}。全用内部员工，没有额外比稿成本；另收到比稿费 ${fmt(pitchFee)}。`)
     : (grossPitchCost>0
        ? `输了：${o.name}。额外比稿投入 ${fmt(grossPitchCost)}。`
        : `输了：${o.name}。全用内部员工，没有额外现金损失。`);
   log(lossText,'bad');
   if(S.lossStreak>=3){S.lossStreak=0;maybeLeave()}
 }

 S.opp=S.opp.filter(x=>x.id!==id);
 render();
 if(!won)saveGame(false);

 showPitchSuspense(o,()=>showProjectResult({
   won,type:o.type,name:o.name,value:o.value,
   cost:netPitchCost,grossCost:grossPitchCost,pitchFee,pWin,boost:supportBonus,inboundBonus,matchBonus:match.pitchBonus,reputationBonus,moraleBonus,staffing,freePenalty,
   afterClose:()=>{
     if(!won)return;
     const continueExecution=()=>{
       const run=(supportMode='none')=>{
         if(freeCount>0&&useFree)finalizePitchExecution(o,selected,freeCount,'free',teamScore,supportMode);
         else finalizePitchExecution(o,selected,0,'internal',teamScore,supportMode);
       };
       if(o.pitchSupport&&o.pitchSupportPeople?.length)showPitchSupportRetentionChoice(o,run);
       else run('none');
     };
     maybeShowBudgetShrink(o,continueExecution);
   }
 }));
}
function showPitchSuspense(o,onDone){
 const existing=document.getElementById('pitchSuspenseModal'); if(existing)existing.remove();
 const common=[
   '客户反馈中…','激烈比稿中…','客户内部讨论中…','老板正在看第三版…',
   '策略被追问中…','创意总监正在硬撑…','采购还没说话…','客户突然拉了个大群…',
   '方案正在被转发给大老板…','客户说再内部对一下…','最后一页又被翻回去了…',
   '有人开始问预算了…','会议室里还没有结论…','客户在比较两家方案…',
   '大老板刚刚进会议室…','提案群突然安静了…','客户说：我们先内部讨论一下…',
   '方案已经讲完，空气还没恢复流动…'
 ];
 const byEra={
   '2006':['客户把方案打印出来了…','老板还在翻那本厚厚的提案…','电话那头说晚点给消息…'],
   '2016':['客户微信群正在刷屏…','采购在确认比稿费…','客户说这个方向挺有意思…'],
   '2026':['客户问：AI还能不能再出一版…','群里正在@更多人…','客户说先别急着定…']
 };
 const pool=[...common,...(byEra[S.diff]||[])];
 const first=pick(pool);
 let second=pick(pool.filter(x=>x!==first));
 const total=o.value>=1000?3200:o.value>=500?2900:o.value>=200?2600:2400;
 const switchAt=Math.round(total*.48);
 const host=document.createElement('div');
 host.className='overlay pitch-suspense-overlay';
 host.id='pitchSuspenseModal';
 host.innerHTML=`<div class="pitch-suspense-card">
   <div class="pitch-suspense-kicker">PITCHING</div>
   <div class="pitch-suspense-project">${o.name}</div>
   <div class="pitch-suspense-copy" id="pitchSuspenseCopy">${first}</div>
   <div class="pitch-suspense-dots"><i></i><i></i><i></i></div>
 </div>`;
 document.body.appendChild(host);
 const copy=host.querySelector('#pitchSuspenseCopy');
 setTimeout(()=>{copy.classList.add('copy-swap');setTimeout(()=>{copy.textContent=second;copy.classList.remove('copy-swap')},150)},switchAt);
 setTimeout(()=>{host.remove();onDone()},total);
}

function weightedPick(items){
 const total=items.reduce((a,x)=>a+x.w,0);
 let r=Math.random()*total;
 for(const item of items){r-=item.w;if(r<=0)return item.text}
 return items[items.length-1].text;
}
function pitchResultFeedback(won){
 if(won){
   return pick([
     '客户说方向很清楚。翻译成人话：这次真选你。',
     '群里突然开始讨论执行细节。好消息，这通常意味着你赢了。',
     '提案结束时没人鼓掌。第二天合同来了。',
     '客户终于不说“我们内部再看看”了。',
     '这次不是陪跑。会议室里的空气都贵了一点。',
     '大老板点了头。前面那些改到凌晨的页，突然都有了名字。',
     '客户开始问什么时候能开工。比一句“不错”值钱多了。',
     '竞品还在等反馈，你已经开始排执行人力。'
   ]);
 }
 // 游戏化权重，不冒充行业统计。常见的“创意/落地不匹配、商务标”更高频。
 return weightedPick([
   {w:6,text:'被骗稿了。你的方向很受欢迎，只是最后执行它的人不是你。'},
   {w:8,text:'资质审核没过。所有人只剩一个问题：为什么不早说？'},
   {w:18,text:'技术标第一，商务标没过。创意赢了，价格没赢。'},
   {w:14,text:'项目取消。不是输给对手，是客户自己把项目关了。'},
   {w:8,text:'客户反馈非常直接：“这是提的啥啊？” 会议室里短暂失去语言。'},
   {w:23,text:'客户说创意很好，但落地性不够。翻译：喜欢，但不敢买。'},
   {w:23,text:'客户说落地性很好，但创意不够。翻译：能做，但不想买。'}
 ]);
}

function showProjectResult({won,type,name,value,cost,pWin,grossCost=0,pitchFee=0,boost=0,inboundBonus=0,matchBonus=0,reputationBonus=0,moraleBonus=0,staffing=0,freePenalty=0,afterClose=null}){
 const old=document.getElementById('pitchResultModal'); if(old)old.remove();

 if(type!=='pitch'){
   const host=document.createElement('div');
   host.className='result-toast result-win';
   host.innerHTML=`<b>${type==='retainer'?'年框接下了':'接到了'}</b><span>${name} · ${fmt(value)}</span>`;
   document.body.appendChild(host);
   window.setTimeout(()=>host.classList.add('result-leave'),900);
   window.setTimeout(()=>host.remove(),1250);
   return;
 }

 const host=document.createElement('div');
 const tier=won?bigWinTier(value):null;
 const isRecord=won&&S.records&&value>S.records.maxDeal;
 host.className=`overlay pitch-result-overlay ${won?'pitch-win':'pitch-loss'} ${tier?'pitch-'+tier.level:''}`;
 host.id='pitchResultModal';
 host.setAttribute('role','dialog');
 host.setAttribute('aria-modal','true');
 const streak=won && S.winStreak>1
   ? `连续 ${S.winStreak} 次赢稿`
   : (!won && S.lossStreak>1 ? `连续 ${S.lossStreak} 次丢稿` : '');
 const feeLine=pitchFee>0
   ? (grossCost>0
      ? `额外投入 ${fmt(grossCost)} · 比稿费 +${fmt(pitchFee)} · 净结果 ${cost>0?'-'+fmt(cost).replace('-',''):'+'+fmt(Math.abs(cost))}`
      : `全用内部员工 · 无额外比稿成本 · 比稿费 +${fmt(pitchFee)}`)
   : (grossCost>0?`本次额外投入 ${fmt(grossCost)}`:'全用内部员工 · 无额外比稿成本');
 const boostLine=boost>0?` · Pitch Free +${boost}%`:'';
 const capabilityLine=`四维匹配 ${matchBonus>=0?'+':''}${matchBonus}% · 声望信任 ${reputationBonus>=0?'+':''}${reputationBonus}% · 团队 ${staffing>=0?'+':''}${staffing.toFixed(0)}%${moraleBonus?` · 士气 ${moraleBonus>=0?'+':''}${moraleBonus.toFixed(0)}%`:''}${freePenalty?` · Free ${freePenalty}%`:''}`;
 host.innerHTML=`<div class="pitch-result-card">
   <div class="pitch-result-kicker">${tier?tier.kicker:'PITCH RESULT'}</div>
   <div class="pitch-result-title">${tier?tier.title:(won?'赢稿！':'丢稿。')}</div>
   ${tier?`<div class="pitch-tier-note">${tier.note}${isRecord?' · 刷新公司最大单纪录。':''}</div>`:''}
   <div class="pitch-result-project">${name}</div>
   <div class="pitch-result-amount">${won?`拿下 ${fmt(value)}`:(cost>0?`额外成本 ${fmt(cost)}`:cost<0?`比稿净收入 ${fmt(Math.abs(cost))}`:'没有额外现金损失')}</div>
   <div class="pitch-result-comment">${pitchResultFeedback(won)}</div>
   ${won?'<div class="pitch-fame-note">赢稿本身不增加声望。项目交付后，才按作品质量与项目体量结算。</div>':''}
   <div class="pitch-result-meta">${feeLine}<br><b>最终胜率 ${pWin.toFixed(0)}%</b> · ${capabilityLine}${inboundBonus?` · 主动邀约 +${inboundBonus}%`:''}${boostLine}${streak?` · ${streak}`:''}</div>
   <button class="btn pitch-result-button" id="closePitchResult">${won?'安排执行人力':'认了，继续经营'}</button>
 </div>`;
 document.body.appendChild(host);
 host.querySelector('#closePitchResult').focus();
 host.querySelector('#closePitchResult').onclick=()=>{host.remove();if(afterClose)afterClose()};
}
function maybeLeave(){
 let risk=.42-clamp((S.morale-50)/130,0,.25); if(Math.random()>risk){log('三连败之后团队情绪低，但这次没人辞职。','muted');return}
 const candidates=S.team.filter(p=>p.role!=='老板'); if(!candidates.length)return; const gone=pick(candidates);S.team=S.team.filter(p=>p.id!==gone.id);log(`${gone.name} 提了离职。离职本身不花钱，重新招人才花。`,'bad');
}
function boost(id){togglePitchSupport(id)}
function quarterStatusCopy(){
 if(S.profit>=300)return '账面很绿。现在最危险的是觉得自己不会犯错。';
 if(S.profit>=0)return '还在盈利。下一季度，继续决定钱该花在哪。';
 if(S.cash>0)return `已经累计亏损 ${fmt(S.profit)}，但账上还有现金。还能撑，只是每一季都更贵。`;
 return `利润和现金都已经变红。再推进，就是拿未来换时间。`;
}
function isAnnualMode(){return S.year>=8&&S.quarter===1}
function progressQuarter(){
 if(S.ended||document.getElementById('quarterTransition'))return;
 if(isAnnualMode()){progressYear();return}
 const positive=S.profit>=0;
 const profitCopy=positive
   ? ['财务还算得过来…','客户回款中…','这一季至少还没白忙…','工资照发，项目照跑…']
   : ['财务表开始变红…','现金流正在冒烟…','工资日又快到了…','有人开始问：下季度会好吗？'];
 const neutral=['项目往前推了十二周…','客户群还在响…','有人交付，有人改第八版…','时间从方案里穿过去了…','这一季度也没有暂停键…'];
 const host=document.createElement('div');
 host.className=`overlay quarter-transition ${positive?'quarter-positive':'quarter-negative'}`;
 host.id='quarterTransition';
 host.innerHTML=`<div class="quarter-transition-card">
   <div class="quarter-transition-kicker">Q${S.quarter} →</div>
   <div class="quarter-transition-copy">${pick([...profitCopy,...neutral])}</div>
   <div class="quarter-transition-sub">正在结算这一季度</div>
 </div>`;
 document.body.appendChild(host);
 setTimeout(()=>{host.remove();resolveQuarter()},1500);
}
function progressYear(){
 if(S.ended||document.getElementById('quarterTransition'))return;
 const positive=S.profit>=0;
 const host=document.createElement('div');
 host.className=`overlay quarter-transition ${positive?'quarter-positive':'quarter-negative'}`;
 host.id='quarterTransition';
 host.innerHTML=`<div class="quarter-transition-card">
   <div class="quarter-transition-kicker">YEAR ${S.year} →</div>
   <div class="quarter-transition-copy">${pick([
     '这一年的项目一起往前滚…','客户、工资和回款一起跑了一年…','公司又老了一岁…',
     '一年过去，几个项目终于能一起算账了…','这一年没有四次暂停键了…'
   ])}</div>
   <div class="quarter-transition-sub">第8年起按年度经营结算</div>
 </div>`;
 document.body.appendChild(host);
 setTimeout(()=>{host.remove();resolveYear()},1500);
}
function resolveYear(){
 if(S.ended)return;
 const manpowerBefore=totalFreeSlots();
 let gross=0,margin=0;
 for(const p of S.active){
   const weeks=Math.min(48,p.left);
   const share=weeks/p.weeks;
   gross+=p.value*share;
   margin+=p.value*p.margin*share;
   p.left-=48;
 }
 const salary=payroll()*12;
 const office=Math.max(4,S.team.length*.45)*12*projectPriceIndex();
 const yearNet=margin-salary-office;
 S.cash+=yearNet;
 S.revenue+=gross;
 S.profit+=yearNet;
 S.taxable+=Math.max(0,yearNet);
 S.yearSpend+=salary+office;

 S.team.forEach(p=>{
   normalizePerson(p);
   p.slots=p.slots.map(w=>Math.max(0,w-48)).filter(w=>w>0);
 });
 const done=S.active.filter(p=>p.left<=0);
 done.forEach(p=>{
   applyProjectReputation(p);
   if(p.quality>84)S.qualityMomentum=(S.qualityMomentum||0)+1;
   maybeCreateRenewal(p);
 });
 S.qualityMomentum=Math.max(0,(S.qualityMomentum||0)-1);
 S.active=S.active.filter(p=>p.left>0);

 if(S.pendingHires.length){
   const before=S.team.length;
   for(const h of S.pendingHires){
     S.team.push(h.person);
     log(`${h.person.name} 到岗。招聘费已经提前付过。`,'good');
   }
   S.pendingHires=[];
   showScaleUpgrade(before,S.team.length);
 }
 log(`第${S.year}年经营结算：确认毛利 ${fmt(margin)}，全年工资+办公 ${fmt(salary+office)}。`,yearNet>=0?'good':'bad');
 const manpowerAfter=totalFreeSlots();
 S.awaitingYearEnd=true;
 render();
 saveGame(false);
 showManpowerDelta(manpowerBefore,manpowerAfter,'年度结束，人力释放 / 新人到岗');
 yearEnd();
}
function resolveQuarter(){
 if(S.ended)return;
 const manpowerBefore=totalFreeSlots();
 let gross=0,margin=0;
 for(const p of S.active){
   const weeks=Math.min(12,p.left); const share=weeks/p.weeks; gross+=p.value*share; margin+=p.value*p.margin*share; p.left-=12;
 }
 const salary=payroll()*3; const office=Math.max(4,S.team.length*.45)*3*projectPriceIndex();
 const quarterNet=margin-salary-office;
 if(S.records)S.records.maxQuarterProfit=Math.max(S.records.maxQuarterProfit,quarterNet);
 S.cash += quarterNet; S.revenue+=gross; S.profit += quarterNet; S.taxable += Math.max(0,margin - salary - office); S.yearSpend+=salary+office;
 S.team.forEach(p=>{
   normalizePerson(p);
   p.slots=p.slots.map(w=>Math.max(0,w-12)).filter(w=>w>0);
 });
 const done=S.active.filter(p=>p.left<=0);
 done.forEach(p=>{
   applyProjectReputation(p);
   if(p.quality>84)S.qualityMomentum=(S.qualityMomentum||0)+1;
   maybeCreateRenewal(p);
 });
 S.qualityMomentum=Math.max(0,(S.qualityMomentum||0)-1);
 S.active=S.active.filter(p=>p.left>0);
 if(S.pendingHires.length){
   const before=S.team.length;
   for(const h of S.pendingHires){S.team.push(h.person);log(`${h.person.name} 到岗。招聘费已经在上季度付过。`,'good')}
   S.pendingHires=[];
   showScaleUpgrade(before,S.team.length);
 }
 log(`Q${S.quarter} 结算：确认毛利 ${fmt(margin)}，工资+办公 ${fmt(salary+office)}。`,margin-salary-office>=0?'good':'bad');
 const manpowerAfter=totalFreeSlots();
 const atYearEnd=S.quarter===4;
 const continueAfterReview=()=>{
   if(atYearEnd){
     S.awaitingYearEnd=true;
     render();
     saveGame(false);
     yearEnd();
     return;
   }
   S.quarter++;S.week+=12;genOpp();render();saveGame(false);
 };
 render();
 showManpowerDelta(manpowerBefore,manpowerAfter,atYearEnd?'季度结束，人力释放 / 新人到岗':'季度推进，人力释放 / 新人到岗');
 continueAfterReview();
}
function yearEnd(){showYearModal()}
function yearEndFeedback(bonus,party){
 if(bonus===0&&party===0)return pick([
   '钱没发，饭也没吃。团队开始认真研究招聘软件。',
   '这一年，公司省下了钱，也省掉了一部分感情。',
   '老板成功守住现金流。员工成功记住了这件事。'
 ]);
 if(bonus===0&&party>0)return pick([
   '年会办得挺热闹。散场之后，大家还是会问：奖金呢？',
   '有酒有菜，没有奖金。朋友圈有照片，工资卡没有惊喜。',
   '团队吃得不错，但没人会把年会抽奖当成年终奖。'
 ]);
 if(bonus===1&&party===0)return pick([
   '一个月奖金到账，年会省了。大家接受这是一个务实的冬天。',
   '钱比节目单有用。团队没有聚餐，但至少账户里有一点年味。',
   '不办年会，直接发钱。有人会觉得你冷静，也有人会觉得你懂事。'
 ]);
 if(bonus>=2&&party===0)return pick([
   '年会没办，但奖金够厚。没人要求老板一定会唱歌。',
   '没有舞台，没有抽奖，钱直接到账。团队情绪相当稳定。',
   '你取消了年会，但把预算放进奖金里。这个解释很好懂。'
 ]);
 if(bonus===1&&party>0)return pick([
   '有奖金，也有一顿饭。称不上豪横，但至少不像画饼。',
   '这一年正常收尾。大家吃完饭，第二天还能继续做稿。',
   '钱和仪式都有一点。团队没有沸腾，也没有冷掉。'
 ]);
 if(bonus===2&&party===1)return pick([
   '两个月奖金，加一场正常年会。团队开始觉得公司今年确实赚到钱了。',
   '奖金有分量，年会不过度。财务肉疼，团队心情不错。',
   '大家吃完饭开始讨论明年，而不是讨论要不要更新简历。'
 ]);
 if(bonus===2&&party===2)return pick([
   '两个月奖金，年会也办得体面。公司文化突然有了预算。',
   '这一晚看起来像一家发展不错的公司。前提是明年别突然裁员。',
   '钱发了，场面也有了。团队士气明显比PPT里的价值观可靠。'
 ]);
 if(bonus>=3&&party===1)return pick([
   '三个月奖金到账。年会已经不重要了，但大家还是去了。',
   '奖金足够有说服力。老板上台讲话时，台下真的有人在听。',
   '这一年结束得很漂亮。代价也真实地写在现金流里。'
 ]);
 return pick([
   '三个月奖金，年会也拉满。今晚没人聊离职，财务除外。',
   '公司把“辛苦大家”翻译成了现金和一顿好饭。',
   '这一年收尾很体面。团队士气高涨，账户余额负责保持冷静。'
 ]);
}
function showYearFeedback({bonus,party,bonusCost,partyCost,tax,feedback,salaryGrowth=0,preTaxYearProfit=0,onContinue}){
 const host=document.createElement('div');
 host.className='overlay';
 host.id='yearFeedbackModal';
 const partyName=party===0?'不办年会':party===1?'标准年会':'体面年会';
 host.innerHTML=`<div class="modal year-feedback">
   <div class="year-feedback-kicker">YEAR END</div>
   <div class="big">这一年，团队记住了什么</div>
   <div class="year-feedback-copy">${feedback}</div>
   <div class="year-feedback-numbers">
     <span>年终奖 <b>${bonus}个月 · ${fmt(bonusCost)}</b></span>
     <span>${partyName} <b>${fmt(partyCost)}</b></span>
     <span>税前年度利润 <b>${fmt(preTaxYearProfit)}</b></span>
     <span>纳税 <b>${fmt(tax)}</b></span>
     <span>明年工资涨幅 <b>${Math.round(salaryGrowth*100)}%</b></span>
   </div>
   <button class="btn" id="continueAfterYear">${S.evergreen&&S.year>=MAX_YEARS?`看${MAX_YEARS}年长青结算`:!S.evergreen&&S.year===STANDARD_YEARS?'进入12年退休结算':S.year%3===0?`看第${S.year}年阶段结算`:'进入下一年 →'}</button>
 </div>`;
 document.body.appendChild(host);
 host.querySelector('#continueAfterYear').onclick=()=>{host.remove();onContinue()};
}
function showSevenYearCongrats(){
 if(!S||S.sevenYearCelebrated||S.year!==7)return;
 S.sevenYearCelebrated=true;
 saveGame(false);
 const host=document.createElement('div');
 host.className='overlay survival-overlay';
 host.id='survivalModal';
 host.innerHTML=`<div class="modal survival-card">
   <div class="survival-kicker">7 YEARS SURVIVED</div>
   <div class="big">恭喜。你已经把公司开过了第7年。</div>
   <p>按一项美国 Census 历史样本对单体广告公司的研究，平均存续时间大约就是 <b>7年</b>。</p>
   <p class="muted">你现在已经不是“新公司”了。第8年开始，经营节奏会自动加速为一年一个回合。</p>
   <button class="btn" id="survivalContinue">知道了，继续开</button>
 </div>`;
 document.body.appendChild(host);
 host.querySelector('#survivalContinue').onclick=()=>host.remove();
}

function showTwelveYearRetirement(){
 const host=document.createElement('div');
 host.className='overlay retirement-overlay';
 host.id='retirementModal';
 const roi=S.revenue?S.profit/S.revenue*100:0;
 const q=Number.isFinite(S.records?.maxQuarterProfit)?S.records.maxQuarterProfit:0;
 host.innerHTML=`<div class="modal retirement-card">
   <div class="retirement-kicker">12 YEARS · STANDARD ENDING</div>
   <div class="big">十二年了。可以退休了。</div>
   <p>标准模式到这里正式结算。你可以把这家公司留在第12年，也可以进入长青模式，继续经营到第${MAX_YEARS}年。</p>
   <div class="personal-records">
     <div><span>累计利润</span><b>${fmt(S.profit)}</b></div>
     <div><span>行业声望</span><b>${S.reputation}分</b></div>
     <div><span>最大单</span><b>${fmt(S.records?.maxDeal||0)}</b></div>
     <div><span>最高单季利润</span><b>${fmt(q)}</b></div>
     <div><span>最长连胜</span><b>×${S.records?.maxWinStreak||0}</b></div>
     <div><span>利润率</span><b>${roi.toFixed(1)}%</b></div>
   </div>
   <div class="retirement-actions">
     <button class="btn" id="retireAtTwelve">退休，结算这12年</button>
     <button class="btn secondary" id="enterEvergreen">进入长青模式 →</button>
   </div>
   <p class="muted retirement-note">长青模式不再属于标准12年一局，最多继续到第${MAX_YEARS}年。</p>
 </div>`;
 document.body.appendChild(host);
 host.querySelector('#retireAtTwelve').onclick=()=>{
   host.remove();
   S.ended=true;
   clearSave();
   showEnding('retired12');
 };
 host.querySelector('#enterEvergreen').onclick=()=>{
   host.remove();
   S.evergreen=true;
   log('第12年标准结算完成。公司进入长青模式。','good');
   advanceToNextYear();
 };
}

function advanceToNextYear(){
 if(S.year>=MAX_YEARS){endGame();return}
 S.yearStartProfit=S.profit;
 const finishedYear=S.year;
 S.year++;
 S.quarter=1;
 S.week+=finishedYear>=8?48:12;
 genOpp();
 render();
 saveGame(false);
 if(S.year===7&&!S.sevenYearCelebrated)setTimeout(()=>showSevenYearCongrats(),250);
}
function showMilestoneSummary(){
 const host=document.createElement('div');
 host.className='overlay milestone-overlay';
 host.id='milestoneModal';
 const roi=S.revenue?S.profit/S.revenue*100:0;
 const q=Number.isFinite(S.records?.maxQuarterProfit)?S.records.maxQuarterProfit:0;
 host.innerHTML=`<div class="modal milestone-card">
   <div class="milestone-kicker">第 ${S.year} 年 · 阶段结算</div>
   <div class="big">${S.year} 年了，公司还在。</div>
   <p class="muted">${S.evergreen?'长青模式继续经营中。':'标准模式第12年退休结算之前，每3年看一次公司变成了什么。'}</p>
   <div class="personal-records">
     <div><span>累计利润</span><b>${fmt(S.profit)}</b></div>
     <div><span>行业声望</span><b>${S.reputation}分</b></div>
     <div><span>最大单</span><b>${fmt(S.records?.maxDeal||0)}</b></div>
     <div><span>最高单季利润</span><b>${fmt(q)}</b></div>
     <div><span>最长连胜</span><b>×${S.records?.maxWinStreak||0}</b></div>
     <div><span>最大团队</span><b>${S.records?.maxTeam||S.team.length}人</b></div>
     <div><span>利润率</span><b>${roi.toFixed(1)}%</b></div>
   </div>
   <div class="milestone-actions">
     <button class="btn" id="continueMilestone">继续开下去 →</button>
     <button class="btn secondary" id="finishMilestone">就到这里，结算成绩</button>
   </div>
 </div>`;
 document.body.appendChild(host);
 host.querySelector('#continueMilestone').onclick=()=>{host.remove();advanceToNextYear()};
 host.querySelector('#finishMilestone').onclick=()=>{host.remove();S.ended=true;clearSave();showEnding('retired')};
}

function closeYear(bonus,party){
 S.awaitingYearEnd=false;
 const bonusCost=payroll()*bonus;
 const partyBase=party===0?0:party===1?S.team.length*.3:S.team.length*.8;
 const partyCost=partyBase*projectPriceIndex();
 S.cash-=bonusCost+partyCost;
 S.profit-=bonusCost+partyCost;
 S.morale=clamp(S.morale + (bonus===0?-5:bonus===1?0:bonus===2?4:6)+(party===0?0:party===1?2:4),0,100);
 const preTaxYearProfit=S.profit-(Number.isFinite(S.yearStartProfit)?S.yearStartProfit:0);
 const tax=Math.max(0,preTaxYearProfit)*gameRules().tax;
 S.cash-=tax;S.profit-=tax;
 const feedback=yearEndFeedback(bonus,party);
 const salaryGrowth=salaryGrowthRate();
 log(`年末：奖金 ${bonus} 个月，年会 ${party===0?'不办':party===1?'标准':'体面'}，税前年度利润 ${fmt(preTaxYearProfit)}，纳税 ${fmt(tax)}。`,'muted');
 log(feedback,bonus===0?'bad':'good');
 S.team.forEach(p=>{p.salary*=1+salaryGrowth;p.tenure=(Number.isFinite(p.tenure)?p.tenure:2)+1});
 S.taxable=0;S.yearSpend=0;
 showYearFeedback({
   bonus,party,bonusCost,partyCost,tax,feedback,salaryGrowth,preTaxYearProfit,
   onContinue:()=>{
     if(S.evergreen&&S.year>=MAX_YEARS){endGame();return}
     if(!S.evergreen&&S.year===STANDARD_YEARS){showTwelveYearRetirement();return}
     if(S.year%3===0){showMilestoneSummary();return}
     advanceToNextYear();
   }
 });
}
function severanceMonths(p){
 const tenure=Number.isFinite(p.tenure)?p.tenure:2;
 return Math.max(1,Math.ceil(tenure));
}
function severanceCost(p){return +(p.salary*severanceMonths(p)).toFixed(1)}
function layoffCandidates(){return S.team.filter(p=>p.role!=='老板')}
function showLayoffModal(){
 const candidates=layoffCandidates();
 if(!candidates.length)return;
 const protectedCount=candidates.filter(p=>activeLoads(p).length>0).length;
 const host=document.createElement('div');host.className='overlay';host.id='layoffModal';
 host.innerHTML=`<div class="modal layoff-modal">
   <div class="big">裁员</div>
   <p class="muted">初始团队默认已有 2 年工龄，每过一年工龄 +1。赔偿按工龄折算月薪，最低 1 个月。<b>正在项目上的人必须保留到项目结束，不能裁。</b></p>
   ${protectedCount?`<div class="layoff-protected-note">当前有 ${protectedCount} 人在项目上，被锁定。项目结束、人力释放后才能进入裁员名单。</div>`:''}
   <div class="layoff-list">
     ${candidates.map(p=>{
       const protectedByProject=activeLoads(p).length>0;
       return `<label class="layoff-row ${protectedByProject?'layoff-row-protected':''}">
         <input type="checkbox" value="${p.id}" ${protectedByProject?'disabled':''}>
         <span><b>${p.name}</b><small>${p.role} · 工龄 ${Number.isFinite(p.tenure)?p.tenure:2} 年 · 月薪 ${fmt(p.salary)}${protectedByProject?` · 项目中，需保留（${activeLoads(p).length}个负载）`:''}</small></span>
         <strong>${protectedByProject?'不可裁':fmt(severanceCost(p))}</strong>
       </label>`;
     }).join('')}
   </div>
   <div class="layoff-summary" id="layoffSummary">只能选择当前空闲员工。</div>
   <div class="row">
     <button class="btn secondary" id="cancelLayoff">取消</button>
     <button class="btn warn" id="confirmLayoff" disabled>确认裁员</button>
   </div>
 </div>`;
 document.body.appendChild(host);
 const boxes=[...host.querySelectorAll('input[type="checkbox"]:not(:disabled)')];
 const summary=host.querySelector('#layoffSummary');
 const confirm=host.querySelector('#confirmLayoff');
 function sync(){
   const ids=boxes.filter(x=>x.checked).map(x=>x.value);
   const people=candidates.filter(p=>ids.includes(p.id)&&activeLoads(p).length===0);
   const total=people.reduce((a,p)=>a+severanceCost(p),0);
   summary.innerHTML=ids.length
     ? `裁 ${people.length} 人 · 赔偿 ${fmt(total)} · 在做项目的人已自动保留`
     : '只能选择当前空闲员工。';
   confirm.disabled=!people.length;
   confirm.onclick=people.length?()=>executeLayoffs(people.map(p=>p.id)):null;
 }
 boxes.forEach(x=>x.onchange=sync);
 host.querySelector('#cancelLayoff').onclick=()=>host.remove();
}
function executeLayoffs(ids){
 const host=document.getElementById('layoffModal');
 const requested=S.team.filter(p=>ids.includes(p.id)&&p.role!=='老板');
 const protectedPeople=requested.filter(p=>activeLoads(p).length>0);
 const people=requested.filter(p=>activeLoads(p).length===0);
 if(protectedPeople.length){
   log(`裁员被拦住：${protectedPeople.length} 人仍在执行项目，必须保留到项目结束。`,'muted');
 }
 if(!people.length){if(host)host.remove();render();return}
 const before=S.team.length;
 const cost=people.reduce((a,p)=>a+severanceCost(p),0);
 S.cash-=cost;S.profit-=cost;S.yearSpend+=cost;
 const removable=new Set(people.map(p=>p.id));
 S.team=S.team.filter(p=>!removable.has(p.id));
 S.morale=clamp(S.morale-people.length*3,0,100);
 log(`裁掉 ${people.length} 个当前空闲员工，赔偿 ${fmt(cost)}。项目执行人力全部保留。`,'bad');
 if(host)host.remove();
 render();
 saveGame(false);
 const afterBand=businessScaleBand(S.team.length);
 if(afterBand<businessScaleBand(before))log(`公司缩到 ${afterBand} 人档，之后新刷新的业务规模也会随之下降。`,'muted');
}
function showHireIncentive(signedCount=1){
 const projected=S.team.length+S.pendingHires.length;
 const next=nextScaleAt(projected);
 const currentBand=businessScaleBand(projected);
 const host=document.createElement('div');host.className='growth-toast';
 if(projected%5===0&&projected>=15){
   host.innerHTML=`<b>规模要上一个台阶了</b><span>新人到岗后进入 ${currentBand} 人档，之后新刷业务案值整体 +1 档。毛利率不会自动变高。</span>`;
 }else{
   host.innerHTML=`<b>团队继续扩张</b><span>签下 ${signedCount} 人。预计到岗后 ${projected} 人，再到 ${next} 人，业务案值会再上一个档位。</span>`;
 }
 document.body.appendChild(host);
 setTimeout(()=>host.classList.add('result-leave'),2200);
 setTimeout(()=>host.remove(),2700);
}

const PROFIT_BUCKETS=[-1000,-500,-300,-200,-100,-50,0,50,100,200,300,500,800,1200,1800,2500,3500,5000,7500,10000,Infinity];
const LEADERBOARD_NS='agency-cashflow-game-hongliu-v1';

function profitBucketIndex(p){
 for(let i=0;i<PROFIT_BUCKETS.length;i++)if(p<PROFIT_BUCKETS[i])return i;
 return PROFIT_BUCKETS.length-1;
}
function benchmarkUrl(action,key,readOnly=false){
 const base=`https://counterapi.com/api/${LEADERBOARD_NS}/${encodeURIComponent(action)}/${encodeURIComponent(key)}`;
 return readOnly?`${base}?readOnly=true`:base;
}
async function benchmarkRead(action,key){
 try{
   const r=await fetch(benchmarkUrl(action,key,true),{cache:'no-store'});
   if(!r.ok)return 0;
   const j=await r.json();
   return Number(j.value)||0;
 }catch(e){return 0}
}
async function benchmarkHit(action,key){
 try{
   const r=await fetch(benchmarkUrl(action,key,false),{cache:'no-store'});
   if(!r.ok)return false;
   await r.json();
   return true;
 }catch(e){return false}
}
async function getPeerBenchmark(){
 const cohort=S.scale||S.diff;
 const action=`result-${cohort}-y${S.year}`;
 const bucket=profitBucketIndex(S.profit);
 const storageKey=`agencyBenchmarkSubmitted-${cohort}-y${S.year}-v3`;
 let submitted=false;
 try{submitted=localStorage.getItem(storageKey)==='1'}catch(e){}
 if(!submitted){
   const ok=await benchmarkHit(action,`b${bucket}`);
   if(ok){
     try{localStorage.setItem(storageKey,'1')}catch(e){}
   }
 }
 const counts=await Promise.all(PROFIT_BUCKETS.map((_,i)=>benchmarkRead(action,`b${i}`)));
 const total=counts.reduce((a,b)=>a+b,0);
 if(total<=0)return null;
 const below=counts.slice(0,bucket).reduce((a,b)=>a+b,0);
 const here=counts[bucket]||0;
 const upper=PROFIT_BUCKETS[bucket];
 const lower=bucket===0?-1500:PROFIT_BUCKETS[bucket-1];
 let within=.5;
 if(Number.isFinite(upper)&&Number.isFinite(lower)&&upper>lower){
   within=clamp((S.profit-lower)/(upper-lower),0,1);
 }
 const pct=clamp(Math.round(((below+here*within)/total)*100),0,100);
 return {pct,total};
}

function closeCompanyAtYearEnd(){S.ended=true;clearSave();showEnding('closed')}
function bankrupt(){S.ended=true;clearSave();showEnding('bankrupt')}
function endGame(){S.ended=true;clearSave();showEnding('complete')}
function endingText(reason){
 if(reason==='bankrupt')return ['现金流艺术家','你把“无限负债也是一种路线”执行到了最后。银行没被说服。'];
 if(reason==='closed')return S.profit<0
   ? ['及时止损者','年关到了，你决定把门关上。至少亏损没有继续长大。']
   : ['见好就收','公司还能开，但你决定在这一年结束时收手。'];
 if(reason==='retired')return ['阶段毕业','公司还可以继续，但你决定把这一段经营史定格在这里。'];
 if(reason==='retired12')return ['十二年退休','你把一家广告公司完整地开了十二年。标准模式到这里，账本合上，灯也可以关了。'];
 const n=S.team.length,p=S.profit;
 if(n<=14&&p>800)return ['精品店老板','人没怎么长，利润倒长得很快。你相信少开会，多收钱。'];
 if(S.route.retainer>S.route.pitch*1.3)return ['年框地主','别人追热点，你收租。最大的创意，是让客户每年都续。'];
 if(S.route.pitch>S.route.retainer*1.6)return ['Pitch永动机','你把公司开成了提案赌场。赢的时候全员封神，输的时候PPT继续加页。'];
 if(n>=35&&p>2500)return ['集团预备役','你已经不是在管项目，是在管一座会自动生成会议的城市。'];
 if(S.route.free>S.team.length*2)return ['Free调度大师','组织架构很轻，微信联系人很重。'];
 if(p<0)return ['理想主义财务事故','作品也许不错，账本很有实验性。'];
 return ['正常经营者','你没有把公司做成传奇，也没有做成刑事案件。对广告公司来说，这已经不错。'];
}
function showYearModal(){
 const host=document.createElement('div');host.className='overlay';host.id='modal';
 host.innerHTML=`<div class="modal">
   <div class="big">第 ${S.year} 年，分钱还是画饼？</div>
   <p class="muted">奖金和年会会影响下一年的士气与离职风险。当前行业气候下，明年工资约上涨 ${Math.round(salaryGrowthRate()*100)}%。</p>
   <h3>年终奖</h3>
   <div class="choices">${[0,1,2,3].map(x=>`<div class="choice" data-bonus="${x}"><b>${x}个月</b><div class="meta">成本 ${fmt(payroll()*x)}</div></div>`).join('')}</div>
   <h3>年会</h3>
   <div class="choices">${[[0,'不办'],[1,'标准'],[2,'体面']].map(x=>`<div class="choice" data-party="${x[0]}"><b>${x[1]}</b><div class="meta">成本 ${fmt((x[0]===0?0:x[0]===1?S.team.length*.3:S.team.length*.8)*projectPriceIndex())}</div></div>`).join('')}</div>
   <p id="yearChoice" class="muted">请选择奖金和年会。</p>
   <button class="btn" id="confirmYear" disabled>结算这一年</button>
   <div class="year-close-zone"><span>这一年到这里。还要再开下去吗？</span><button class="btn secondary" id="closeAtYearEnd">关掉公司，直接结算</button></div>
 </div>`;
 document.body.appendChild(host);
 let b=null,p=null;
 host.querySelectorAll('[data-bonus]').forEach(el=>el.onclick=()=>{b=+el.dataset.bonus;host.querySelectorAll('[data-bonus]').forEach(x=>x.style.outline='');el.style.outline='2px solid #111';sync()});
 host.querySelectorAll('[data-party]').forEach(el=>el.onclick=()=>{p=+el.dataset.party;host.querySelectorAll('[data-party]').forEach(x=>x.style.outline='');el.style.outline='2px solid #111';sync()});
 function sync(){const btn=host.querySelector('#confirmYear');btn.disabled=b===null||p===null;if(!btn.disabled)btn.onclick=()=>{host.remove();closeYear(b,p)}}
 host.querySelector('#closeAtYearEnd').onclick=()=>{host.remove();closeCompanyAtYearEnd()};
}
function showEnding(reason){
 const [title,desc]=endingText(reason),roi=S.revenue?S.profit/S.revenue*100:0;
 const host=document.createElement('div');host.className='overlay';
 host.innerHTML=`<div class="modal ending">
   <div class="big">${title}</div>
   <p>${desc}</p>
   <div class="ending-dual"><div><span>经营成绩</span><b>${fmt(S.profit)}</b><small>累计利润</small></div><div><span>行业位置</span><b>${S.reputation}分</b><small>${reputationLabel()} · ${agencyType()}</small></div></div>
   <div class="peer-benchmark" id="peerBenchmark"><span>利润同行战绩</span><b>正在读取实际玩家样本…</b></div>
   <div class="personal-records">
     <div><span>最大单</span><b>${fmt(S.records?.maxDeal||0)}</b></div>
     <div><span>最高单季经营利润</span><b>${fmt(Number.isFinite(S.records?.maxQuarterProfit)?S.records.maxQuarterProfit:0)}</b></div>
     <div><span>最长连胜</span><b>×${S.records?.maxWinStreak||0}</b></div>
     <div><span>最大团队</span><b>${S.records?.maxTeam||S.team.length}人</b></div>
     <div><span>完成项目</span><b>${S.records?.projects||0}个</b></div>
     <div><span>主动邀约</span><b>${S.records?.inboundOffers||0}次</b></div>
   </div>
   <p>累计收入：<b>${fmt(S.revenue)}</b><br>最终累计利润：<b>${fmt(S.profit)}</b><br>最终现金：<b>${fmt(S.cash)}</b><br>最终团队：<b>${S.team.length}人</b><br>Pitch：<b>${S.wins}赢 / ${S.losses}输</b><br>利润率：<b>${roi.toFixed(1)}%</b></p>
   <button class="btn" onclick="location.reload()">换一种活法，再来一局</button>
 </div>`;
 document.body.appendChild(host);
 getPeerBenchmark().then(r=>{
   const el=document.getElementById('peerBenchmark');if(!el)return;
   if(!r){el.innerHTML='<span>同行战绩</span><b>实际玩家样本暂时读取失败</b>';return}
   el.innerHTML=`<span>利润同行战绩 · ${startScale().name} · ${S.year}年</span><b>利润打败了 ${r.pct}% 的同规模玩家</b><small>基于 ${r.total} 位相同经营年数的实际玩家匿名成绩</small>`;
 });
}

function render(){
 const app=document.getElementById('app');if(!S){app.innerHTML=startHTML();return}
 updateTeamRecord();
 const avail=available().length;
 const freeSlotsNow=totalFreeSlots(),capacityNow=totalCapacity(),usedNow=usedCapacity();
 const scaleStep=businessScaleStep(),band=businessScaleBand(),nextBand=nextScaleAt();
 const caps=companyCapabilities(),profitRate=S.revenue?S.profit/S.revenue*100:0;
 const emptyOpportunityCopy=isAnnualMode()?'机会用完了。推进这一年，市场再刷新。':'机会用完了。推进一季度，市场再刷新。';
 app.innerHTML=`<div class="shell"><div class="mast"><div class="brand"><h1>广告公司模拟器</h1><p>${startScale().name} · 第${S.year}年${isAnnualMode()?' · 年度经营':` Q${S.quarter}`} · ${S.evergreen?`长青模式 / 最多${MAX_YEARS}年`:`标准模式 / ${STANDARD_YEARS}年退休`}</p></div><div class="mast-actions"><div class="creator-mark">@洪流的广告流言</div><div class="row"><button class="btn secondary" onclick="manualSave()">存档</button><button class="btn secondary" onclick="hire()">招聘</button><button class="btn secondary" onclick="showLayoffModal()">裁员</button><button class="btn warn" onclick="bankrupt()">宣布破产</button></div></div></div>
 <div class="core-stats">
   <div class="core-stat profit-core ${S.profit<0?'negative-profit':''}">
     <span>累计利润</span>
     <b>${fmt(S.profit)}</b>
     <small>利润率 ${profitRate.toFixed(1)}% · 累计收入 ${fmt(S.revenue)}</small>
   </div>
   <div class="core-stat reputation-core" title="高质量的大项目最能提升声望；低质量项目会伤声望。">
     <span>行业声望</span>
     <b>${S.reputation}<em>分</em></b>
     <small>${reputationLabel()} · ${reputationImpactText()}</small>
     <div class="reputation-source">声望在交付后结算：项目声誉值 × 最终质量</div>
   </div>
 </div>
 <div class="capability-strip">
   ${Object.entries(CAPABILITY_META).map(([k,m])=>`<div class="capability"><span>${m.label}</span><b>${caps[k]}</b><small>${m.effect}</small><i><u style="width:${caps[k]}%"></u></i></div>`).join('')}
 </div>
 <div class="stats secondary-stats">
   <div class="stat"><b>${fmt(S.cash)}</b><span>现金</span></div>
   <div class="stat"><b>${S.team.length}人</b><span>团队</span><small>${band}人档</small></div>
   <div class="stat"><b>${freeSlotsNow}/${capacityNow}</b><span>可用人力</span><small>${usedNow}槽占用</small></div>
   <div class="stat" title="士气影响Pitch发挥、项目质量、续约和离职，但不会限制接单。"><b>${S.morale}</b><span>士气</span></div>
   <div class="stat economy-stat"><b>${economyPhase().label}</b><span>行业气候</span><small>价格 ×${projectPriceIndex().toFixed(2)}</small></div>
 </div>
 <div class="grid"><main class="panel"><h2>${isAnnualMode()?'这一年，生意自己不会长出来':'这季度，生意自己不会长出来'}</h2>${gossipHTML()}<div class="cards">${S.opp.map(o=>cardHTML(o)).join('')||'<p class="muted">'+emptyOpportunityCopy+'</p>'}</div><div class="quarter-action ${S.profit<0?'quarter-action-loss':'quarter-action-profit'}">
   <button class="btn quarter-btn ${S.profit<0?'quarter-btn-loss':'quarter-btn-profit'}" onclick="progressQuarter()">${isAnnualMode()?'推进这一年 →':'推进一季度 →'}</button>
   <div class="quarter-action-copy">
     <div class="quarter-status-copy">${quarterStatusCopy()}</div>
     <small>${isAnnualMode()?'年度':'季度'}工资约 ${fmt(payroll()*(isAnnualMode()?12:3))} · 当前名义大单上限 ${fmt(unlockCap())}</small>
   </div>
 </div>
 <h3>正在执行</h3>${activeHTML()}</main><aside><section class="panel"><h2>流水</h2><div class="log">${S.log.map(x=>`<div class="${x.cls}">${x.msg}</div>`).join('')}</div></section><section class="panel" style="margin-top:18px"><h2>团队</h2><table class="team"><thead><tr><th>人</th><th>职位</th><th>工龄</th><th>月薪</th><th>状态</th></tr></thead><tbody>${S.team.map(p=>`<tr><td>${p.name}</td><td>${p.role}</td><td>${Number.isFinite(p.tenure)?p.tenure:2}年</td><td>${fmt(p.salary)}</td><td><span class="pill">${statusText(p)}</span></td></tr>`).join('')}</tbody></table>${S.pendingHires.length?`<p class="muted">待到岗：${S.pendingHires.map(x=>x.person.name).join('、')}</p>`:''}</section></aside></div><div class="footer">规则核心：没有唯一正确路线。小公司、年框、Pitch、Free、大公司都能活，但都要付代价。</div></div>`
 scheduleGossipRotation();
}
function durationLabel(weeks){
 if(weeks>=48)return '1年';
 if(weeks>=36)return '9个月';
 if(weeks>=24)return '6个月';
 if(weeks>=12)return '3个月';
 if(weeks>=8)return '2个月';
 return '1个月';
}
function cardHTML(o){
 const lack=Math.max(0,o.people-available().length);
 const isPitch=o.type==='pitch';
 const staffingNote=lack?` · 缺 ${lack} 人`:'';
 const match=projectMatch(o);
 const secondLine=isPitch
   ? `${o.inbound?'主动邀约 · ':o.renewal?'续约也需重新比稿 · ':''}比稿期 ${o.pitchWeeks}周${staffingNote}`
   : `${o.renewal?'老客户续约 · 毛利被压低 · ':''}无需比稿 · 直接接单${staffingNote}`;
 const feeLine=isPitch&&o.pitchFee>0?`<br>2016 比稿费 ${fmt(o.pitchFee)} · 无论输赢`:'';
 const durationLine=isPitch
   ? `执行期 ${durationLabel(o.duration)}（赢稿后才占用）`
   : `周期 ${durationLabel(o.duration)}（${o.duration}周）`;
 const internalUse=Math.min(o.people,available().length);
 const remaining=Math.max(0,totalFreeSlots()-internalUse);
 const repMargin=o.reputationMarginBonus||0;
 const fameLine=repMargin
   ? `<span class="fame-benefit ${repMargin<0?'fame-cost':''}">声望影响毛利：${repMargin>0?'+':''}${Math.round(repMargin*100)}pt</span>`
   : '';
 const expectedMargin=o.value*o.margin;
 return `<div class="card ${o.inbound?'inbound-card':''}"><div class="card-topline"><span class="tag">${o.inbound?'客户主动找上门':o.renewal?(o.type==='pitch'?'续约Pitch':'续约'):o.type==='small'?'散活':o.type==='retainer'?'年框':'Pitch'}</span><span class="people-need ${lack?'people-short':''}">需 ${o.people} 人力${lack?` · 缺 ${lack}`:''}</span></div><h4>${o.name}</h4><div class="money">${fmt(o.value)}</div><div class="project-facts"><div class="project-fact project-fact-profit"><span>项目毛利率</span><b>${(o.margin*100).toFixed(0)}%</b><small>预计毛利 ${fmt(expectedMargin)}</small></div><div class="project-fact project-fact-cycle"><span>${isPitch?'赢稿后执行周期':'项目周期'}</span><b>${durationLabel(o.duration)}</b><small>${o.duration} 周</small></div><div class="project-fact project-fact-reputation"><span>项目声誉值</span><b>${o.reputationValue}</b><small>${projectFlavor(o)==='prestige'?'偏声望':projectFlavor(o)==='delivery'?'偏赚钱':'均衡'}</small></div></div><div class="project-fit ${match.score>=76?'fit-good':match.score<67?'fit-bad':''}"><span>${projectNeedLabel(o)}</span><b>${projectMatchDetail(o)}</b><strong>${isPitch?`Pitch ${match.pitchBonus>=0?'+':''}${match.pitchBonus}%`:`质量 ${match.qualityBonus>=0?'+':''}${match.qualityBonus}`}</strong></div><div class="meta">${secondLine}${feeLine}${fameLine}</div><div class="row" style="margin-top:10px"><button class="btn" onclick="requestProject('${o.id}')">${isPitch?'去比稿':'接下来'}</button>${isPitch?`<button class="btn secondary" onclick="boost('${o.id}')">${o.pitchSupport?`取消Pitch Free · +${match.supportBonus}%`:`补对应Free · ${fmt(2*freeWeeklyRate()*(o.pitchWeeks||2))}起`}</button>`:''}</div></div>`
}
function activeHTML(){if(!S.active.length)return '<p class="muted">没有。全公司此刻理论上可以去喝咖啡。</p>';return `<table class="team"><thead><tr><th>项目</th><th>案值</th><th>剩余</th><th>质量</th></tr></thead><tbody>${S.active.map(p=>`<tr><td>${p.name}${p.legacy?' · 老客户':''}</td><td>${fmt(p.value)}</td><td>${Math.max(0,p.left)}周</td><td>${p.quality.toFixed(0)}</td></tr>`).join('')}</tbody></table>`}
function startHTML(){
 const save=readSavedGame();
 const saveScale=save&&START_SCALES[save.scale]?START_SCALES[save.scale].name:(save?((save.team||[]).length+'人旧版公司'):'');
 const saveBlock=save?`<div class="continue-save">
   <div><span>本机存档</span><b>第 ${save.year} 年${save.year>=8&&save.quarter===1?' · 年度经营':` Q${save.quarter}`} · ${saveScale}</b><small>累计利润 ${fmt(Number(save.profit)||0)} · 声望 ${Number(save.reputation)||0}</small></div>
   <div class="row"><button class="btn" onclick="loadSavedGame()">继续经营 →</button><button class="btn secondary" onclick="deleteSaveFromStart()">删除存档</button></div>
 </div>`:'';
 const projectHints={boutique6:'小单与300万级以内机会更多',growth20:'中型年框与Pitch最均衡',integrated40:'大客户、大Pitch出现更频繁'};
 return `<div class="start"><div class="startbox"><div class="creator-mark start-creator">@洪流的广告流言</div><h1>广告公司模拟器</h1><p>选一个你要接手的公司。规模不同，初始团队、现金、老客户和市场喂给你的项目都会不同。</p>${saveBlock}<div class="scale-start">
   ${Object.values(START_SCALES).map(p=>`<div class="scale-choice" onclick="start('${p.key}')"><span>START WITH</span><strong>${p.name}</strong><small>${p.desc}</small><div class="scale-choice-meta"><b>初始声望 ${p.startRep}</b><b>现金 ${fmt(p.startCash)}</b><b>${projectHints[p.key]}</b></div></div>`).join('')}
 </div><p class="footer">利润和声望是两条独立成绩线。前7年按季度经营，第8年起按年度经营，第12年标准退休。</p></div></div>`;
}
render();