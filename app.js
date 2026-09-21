const fmt = n => `${n<0?'-':''}¥${Math.abs(n).toFixed(1)}万`;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const uid=()=>Math.random().toString(36).slice(2,9);

const DIFF={
  2006:{name:'2006',label:'中等',desc:'钱还没那么难赚，但税是真的高。',tax:.33,deal:1.0,baseWin:0,opp:4,startCash:120},
  2016:{name:'2016',label:'最容易',desc:'预算更宽松，机会更多，行业还相信增长。',tax:.25,deal:1.18,baseWin:5,opp:5,startCash:160},
  2026:{name:'2026',label:'最难',desc:'钱少、要求多、Pitch多，客户也会问AI能不能先来一版。',tax:.25,deal:.86,baseWin:-5,opp:3,startCash:100}
};

const baseTeam=[
 ['老板','老板','创意',3.0,88],['策略A','策略','品牌',2.5,82],['客户A','阿康','客户',1.2,67],['客户B','阿康','客户',1.5,72],['客户总监','资深阿康','客户',3.0,84],['文案A','文案','创意',1.1,70],['文案总监','文案总监','创意',3.0,86],['美术A','美术','创意',1.2,73],['美术总监','美术总监','创意',3.0,87],['制片A','制片','制作',2.0,80]
].map((x,i)=>({id:`p${i}`,name:x[0],role:x[1],spec:x[2],salary:x[3],skill:x[4],slots:[],tenure:2}));

const names=['新同事A','新同事B','新同事C','新同事D','新同事E','新同事F','新同事G','新同事H','新同事I','新同事J'];
const roles=['阿康','文案','美术','策略','制片'];

let S=null;
function start(diff){
 const d=DIFF[diff];
 S={diff,year:1,quarter:1,week:1,cash:d.startCash,profit:0,revenue:0,taxable:0,reputation:50,morale:60,team:structuredClone(baseTeam),opp:[],active:[],log:[],wins:0,losses:0,winStreak:0,lossStreak:0,totalPitches:0,bonusMonths:1,party:0,followups:0,ended:false,pendingHires:[],route:{pitch:0,retainer:0,small:0,free:0},yearSpend:0};
 S.active.push({id:uid(),name:'老客户A · 日常品牌服务',type:'retainer',value:72,margin:.42,weeks:24,left:24,people:3,quality:70,legacy:true});
 S.active.push({id:uid(),name:'老客户B · 社媒与内容',type:'retainer',value:48,margin:.38,weeks:24,left:24,people:2,quality:66,legacy:true});
 allocateLegacy(); genOpp(); log('公司开门。先别谈理想，先活下来。',''); render();
}
function capacity(p){
 return (p.role==='老板'||p.role.includes('总监')||p.role.includes('资深')||p.skill>=84)?2:1;
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
 let n=5;
 for(const p of S.team){
   if(n<=0)break;
   assignPerson(p,24);
   n--;
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
function businessScaleBand(n=S.team.length){return Math.max(10,Math.floor(n/5)*5)}
function nextScaleAt(n=S.team.length){return (Math.floor(n/5)+1)*5}
function scaleValueTier(values,step){
 const baseIndex=Math.floor(Math.random()*values.length);
 return values[Math.min(values.length-1,baseIndex+step)];
}
function unlockCap(){
 const n=S.team.length;
 if(n>=40)return 5000;
 if(n>=35)return 3000;
 if(n>=30)return 1800;
 if(n>=25)return 1200;
 if(n>=20)return 800;
 if(n>=15)return 600;
 return 480;
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
function makeOpportunity(forced=''){
 const d=DIFF[S.diff], cap=unlockCap();
 const r=Math.random();
 let type=forced|| (r<.24?'small':r<.43?'retainer':'pitch');
 const scaleStep=businessScaleStep();
 let value;
 if(type==='small') value=scaleValueTier([8,15,25,40,60,80,120],scaleStep);
 else if(type==='retainer') value=scaleValueTier([80,120,180,300,500,800,1200,1500,2200,3000],scaleStep);
 else value=scaleValueTier([50,80,120,200,300,500,800,1200,1800,3000,5000],scaleStep);
 value=Math.round(value*d.deal);
 value=Math.min(value,cap);
 const people=clamp(Math.ceil(Math.log2(Math.max(16,value/12))),2,12);
 let duration;
 if(type==='small') duration=pick([4,8,12]);
 else if(type==='retainer') duration=pick([24,36,48,48]);
 else if(value<100) duration=pick([8,12]);
 else if(value<300) duration=pick([12,24,24]);
 else if(value<800) duration=pick([24,36,36]);
 else duration=pick([36,48,48]);
 const margin= type==='retainer'?pick([.22,.28,.33,.38]):type==='small'?pick([.45,.5,.55]):pick([.28,.34,.4,.46]);
 const namesBy={small:['临时物料包','社媒快单','老板朋友的急活','产品内容小单'],retainer:['半年年框','年度社媒年框','品牌年度顾问','内容长期服务'],pitch:['新品上市Pitch','整合传播Pitch','品牌焕新Pitch','年度战役Pitch','超级整合Pitch']};
 const pitchWeeks=type==='pitch'?pick([2,2,2,3]):0;
 const pitchFee=(type==='pitch'&&S.diff==='2016')?pick([2,3,4,5]):0;
 return {id:uid(),name:pick(namesBy[type]),type,value,people,duration,margin,pitchWeeks,pitchFee,freeAllowed:true,boost:false};
}
function genOpp(){
 const n=DIFF[S.diff].opp + (S.reputation>=70?1:0);
 S.opp=[];
 for(let i=0;i<n;i++)S.opp.push(makeOpportunity());
}
function log(msg,cls=''){S.log.unshift({msg,cls}); S.log=S.log.slice(0,60)}
function executionFreeCostFor(o,freeCount){
 return +(freeCount*1.2*Math.ceil(o.duration/4)).toFixed(1);
}
function pitchFreeCostFor(o,freeCount){
 const weeks=o.pitchWeeks||2;
 return +(freeCount*1.2*(weeks/4)).toFixed(1);
}
function requestProject(id){
 const o=S.opp.find(x=>x.id===id); if(!o)return;
 const lack=Math.max(0,o.people-available().length);
 if(lack>0){showStaffingChoice(o,lack);return}
 takeProject(id,false);
}
function createHireCandidate(){
 const role=pick(roles);
 const skill=Math.round(62+Math.random()*27);
 const salary=+(0.9+(skill-60)*.055+(role==='策略'?0.4:0)).toFixed(1);
 return {id:uid(),name:pick(names),role,spec:role==='文案'||role==='美术'?'创意':role==='阿康'?'客户':role,salary,skill,slots:[],tenure:0};
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
 const candidates=Array.from({length:freeCount},()=>createHireCandidate());
 const hireFee=candidates.reduce((a,p)=>a+p.salary,0);
 const newPayroll=candidates.reduce((a,p)=>a+p.salary,0);
 const host=document.createElement('div');host.className='overlay';host.id='freeModal';

 const freeRisk=isPitch
   ? (share>.5
      ? `Free 占到 ${Math.round(share*100)}%，超过一半：Pitch 胜率约再降 8 个百分点。这里只签 ${o.pitchWeeks} 周比稿期，不包含后续执行。`
      : `Free 只覆盖 ${o.pitchWeeks} 周比稿期。赢稿后，再决定让他们转正还是继续以 Free 身份执行。`)
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
       <p><b>这阶段 Free 成本 ${fmt(freeCost)}</b></p>
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
 const quality=clamp(teamScore+Math.random()*12-4-(freeCount?freeShare*10:0),42,98);
 if(freeCount){
   S.cash-=freeCost;S.yearSpend+=freeCost;S.profit-=freeCost;S.route.free+=freeCount;
   log(`执行期用了 ${freeCount} 个 Free，成本 ${fmt(freeCost)}。`,'muted');
 }
 S.active.push({id:uid(),name:o.name,type:o.type,value:o.value,margin:o.margin,weeks:o.duration,left:o.duration,people:o.people,quality,legacy:false});
 S.reputation=clamp(S.reputation+(quality>84?2:quality<60?-2:0),0,100);
 log(`接下：${o.name}，案值 ${fmt(o.value)}。`,'good');
 S.opp=S.opp.filter(x=>x.id!==o.id);
 const manpowerAfter=totalFreeSlots();
 render();
 showManpowerDelta(manpowerBefore,manpowerAfter,`${o.name} 进入执行`);
 showProjectResult({won:true,type:o.type,name:o.name,value:o.value,cost:freeCost,pWin:null});
}
function finalizePitchExecution(o,selected,freeCount,mode,teamScore){
 const manpowerBefore=totalFreeSlots();
 const freeShare=freeCount/o.people;
 let qualityPenalty=0;

 if(mode==='convert'){
   const converts=Array.from({length:freeCount},()=>createHireCandidate());
   const monthly=converts.reduce((a,p)=>a+p.salary,0);
   const conversionFee=+(monthly*.5).toFixed(1);
   S.cash-=conversionFee;S.yearSpend+=conversionFee;S.profit-=conversionFee;
   converts.forEach(p=>{S.team.push(p);assignPerson(p,o.duration)});
   selected.forEach(p=>assignPerson(p,o.duration));
   log(`赢稿后把 ${freeCount} 个 Free 转成正式员工。转正成本 ${fmt(conversionFee)}，每月固定工资 +${fmt(monthly)}。`,'good');
 }else if(mode==='free'){
   const executionFreeCost=executionFreeCostFor(o,freeCount);
   S.cash-=executionFreeCost;S.yearSpend+=executionFreeCost;S.profit-=executionFreeCost;S.route.free+=freeCount;
   selected.forEach(p=>assignPerson(p,o.duration));
   qualityPenalty=freeShare*10;
   log(`赢稿后继续用 ${freeCount} 个 Free 执行 ${durationLabel(o.duration)}，执行期成本 ${fmt(executionFreeCost)}。`,'muted');
 }else{
   selected.forEach(p=>assignPerson(p,o.duration));
 }

 const quality=clamp(teamScore+Math.random()*14-5+(o.boost?4:0)-qualityPenalty,42,98);
 S.active.push({id:uid(),name:o.name,type:o.type,value:o.value,margin:o.margin,weeks:o.duration,left:o.duration,people:o.people,quality,legacy:false});
 S.reputation=clamp(S.reputation+(quality>82?3:quality<62?-2:1),0,100);
 const manpowerAfter=totalFreeSlots();
 render();
 showManpowerDelta(manpowerBefore,manpowerAfter,`${o.name} 开始执行`);
}
function showPostPitchExecutionChoice(o,selected,freeCount,teamScore){
 const host=document.createElement('div');host.className='overlay';host.id='executionStaffingModal';
 const converts=Array.from({length:freeCount},()=>createHireCandidate());
 const monthly=converts.reduce((a,p)=>a+p.salary,0);
 const conversionFee=+(monthly*.5).toFixed(1);
 const executionFreeCost=executionFreeCostFor(o,freeCount);

 host.innerHTML=`<div class="modal staffing-modal">
   <div class="big">稿赢了，Free 怎么办？</div>
   <p><b>${o.name}</b> 接下来要执行 ${durationLabel(o.duration)}。刚才参与 Pitch 的 ${freeCount} 个 Free，合同只到比稿结束。</p>
   <div class="staffing-options">
     <div class="staffing-option">
       <h3>把 Free 转正</h3>
       <p>熟悉项目的人直接留下，进入正式编制。</p>
       <p><b>转正成本约 ${fmt(conversionFee)}</b><br>以后每月固定工资 +${fmt(monthly)}</p>
       <p class="muted">执行更稳定，但从这一刻开始背长期人力成本。</p>
       <button class="btn" id="convertFree">转正 ${freeCount} 人</button>
     </div>
     <div class="staffing-option">
       <h3>继续用 Free</h3>
       <p>不增加正式编制，让他们继续跟完整个执行周期。</p>
       <p><b>执行期 Free 成本 ${fmt(executionFreeCost)}</b></p>
       <p class="bad">Free 占比 ${Math.round((freeCount/o.people)*100)}%，长期执行会带来一定质量风险。</p>
       <button class="btn secondary" id="continueFree">继续用 Free</button>
     </div>
   </div>
 </div>`;
 document.body.appendChild(host);
 host.querySelector('#convertFree').onclick=()=>{
   host.remove();
   const manpowerBefore=totalFreeSlots();
   // Recreate equivalent converted staff at commit time to keep the choice deterministic enough for play.
   const actual=converts;
   const before=S.team.length;
   const actualMonthly=actual.reduce((a,p)=>a+p.salary,0);
   const actualFee=+(actualMonthly*.5).toFixed(1);
   S.cash-=actualFee;S.yearSpend+=actualFee;S.profit-=actualFee;
   actual.forEach(p=>{S.team.push(p);assignPerson(p,o.duration)});
   showScaleUpgrade(before,S.team.length);
   selected.forEach(p=>assignPerson(p,o.duration));
   const quality=clamp(teamScore+Math.random()*14-5+(o.boost?4:0),42,98);
   S.active.push({id:uid(),name:o.name,type:o.type,value:o.value,margin:o.margin,weeks:o.duration,left:o.duration,people:o.people,quality,legacy:false});
   S.reputation=clamp(S.reputation+(quality>82?3:quality<62?-2:1),0,100);
   log(`赢稿后把 ${freeCount} 个 Free 转正。转正成本 ${fmt(actualFee)}，每月固定工资 +${fmt(actualMonthly)}。`,'good');
   const manpowerAfter=totalFreeSlots();
   render();
   showManpowerDelta(manpowerBefore,manpowerAfter,`Free 转正并投入 ${o.name}`);
 };
 host.querySelector('#continueFree').onclick=()=>{
   host.remove();
   finalizePitchExecution(o,selected,freeCount,'free',teamScore);
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
 const staffing=clamp((teamScore-72)*.35,-8,10);
 const boost=o.boost?pick(Array.from({length:45},(_,i)=>i+5)):0;
 const freePenalty=freeShare>.5?-8:0;
 const pWin=clamp(35+DIFF[S.diff].baseWin+staffing+boost+freePenalty+clamp((S.reputation-50)*.18,-7,8),8,92);
 // 自有员工参与比稿不产生额外现金成本。只有 Free 和主动加码才产生增量费用。
 const boostCost=o.boost?Math.max(1,Math.min(18,o.value*.01)):0;
 const grossPitchCost=+(boostCost+pitchFreeCost).toFixed(1);

 if(grossPitchCost>0){
   S.cash-=grossPitchCost;S.yearSpend+=grossPitchCost;S.profit-=grossPitchCost;
 }
 if(freeCount){S.route.free+=freeCount;log(`比稿期用了 ${freeCount} 个 Free，共 ${o.pitchWeeks} 周，成本 ${fmt(pitchFreeCost)}。`,'muted')}

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
   log(`赢了：${o.name}，案值 ${fmt(o.value)}，当时胜率约 ${pWin.toFixed(0)}%。`,'good');
   if(S.winStreak>=3){
     S.winStreak=0;
     const f=makeOpportunity('small');f.name='连带散活 · '+f.name;f.value=Math.max(f.value,Math.round(o.value*.12));
     S.opp.push(f);S.followups++;
     log('三连胜。客户圈开始传你的名字，掉下来一笔连带散活。','good');
   }
 }else{
   S.losses++;S.lossStreak++;S.winStreak=0;S.reputation=clamp(S.reputation-1,0,100);
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

 showPitchSuspense(o,()=>showProjectResult({
   won,type:o.type,name:o.name,value:o.value,
   cost:netPitchCost,grossCost:grossPitchCost,pitchFee,pWin,boost,
   afterClose:()=>{
     if(!won)return;
     if(freeCount>0&&useFree)showPostPitchExecutionChoice(o,selected,freeCount,teamScore);
     else finalizePitchExecution(o,selected,0,'internal',teamScore);
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

function pitchResultFeedback(won){
 const winCopy=[
   '客户说方向很清楚。翻译成人话：这次真选你。',
   '群里突然开始讨论执行细节。好消息，这通常意味着你赢了。',
   '提案结束时没人鼓掌。第二天合同来了。',
   '客户终于不说“我们内部再看看”了。',
   '这次不是陪跑。会议室里的空气都贵了一点。',
   '大老板点了头。前面那些改到凌晨的页，突然都有了名字。',
   '客户开始问什么时候能开工。比一句“不错”值钱多了。',
   '竞品还在等反馈，你已经开始排执行人力。'
 ];
 const loseCopy=[
   '客户说两个方向都很好。通常这句话后面就没你了。',
   '谢谢参与。四个字，足够让几十页PPT瞬间失重。',
   '客户说不是创意的问题。至于是什么问题，没有人知道。',
   '方案留在了客户电脑里，项目没有留在公司里。',
   '群里最后一句是“辛苦大家”。没有然后了。',
   '客户选择了另一家。你的PPT获得了完整阅读，但没有收入。',
   '大老板觉得都不错，然后选了别人。',
   '这次陪跑结束。至少内部员工的工资本来就要发。'
 ];
 return pick(won?winCopy:loseCopy);
}

function showProjectResult({won,type,name,value,cost,pWin,grossCost=0,pitchFee=0,boost=0,afterClose=null}){
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
 host.className=`overlay pitch-result-overlay ${won?'pitch-win':'pitch-loss'}`;
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
 const boostLine=boost>0?` · 本次加码胜率 +${boost}%`:'';
 host.innerHTML=`<div class="pitch-result-card">
   <div class="pitch-result-kicker">PITCH RESULT</div>
   <div class="pitch-result-title">${won?'赢稿！':'丢稿。'}</div>
   <div class="pitch-result-project">${name}</div>
   <div class="pitch-result-amount">${won?`拿下 ${fmt(value)}`:(cost>0?`额外成本 ${fmt(cost)}`:cost<0?`比稿净收入 ${fmt(Math.abs(cost))}`:'没有额外现金损失')}</div>
   <div class="pitch-result-comment">${pitchResultFeedback(won)}</div>
   <div class="pitch-result-meta">${feeLine}<br>当时胜率约 ${pWin.toFixed(0)}%${boostLine}${streak?` · ${streak}`:''}</div>
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
function boost(id){const o=S.opp.find(x=>x.id===id);if(o){o.boost=!o.boost;render()}}
function progressQuarter(){
 if(S.ended||document.getElementById('quarterTransition'))return;
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
function resolveQuarter(){
 if(S.ended)return;
 const manpowerBefore=totalFreeSlots();
 let gross=0,margin=0;
 for(const p of S.active){
   const weeks=Math.min(12,p.left); const share=weeks/p.weeks; gross+=p.value*share; margin+=p.value*p.margin*share; p.left-=12;
 }
 const salary=payroll()*3; const office=Math.max(4,S.team.length*.45)*3;
 S.cash += margin - salary - office; S.revenue+=gross; S.profit += margin - salary - office; S.taxable += Math.max(0,margin - salary - office); S.yearSpend+=salary+office;
 S.team.forEach(p=>{
   normalizePerson(p);
   p.slots=p.slots.map(w=>Math.max(0,w-12)).filter(w=>w>0);
 });
 const done=S.active.filter(p=>p.left<=0); done.forEach(p=>{if(p.quality>84)S.reputation=clamp(S.reputation+2,0,100);}); S.active=S.active.filter(p=>p.left>0);
 if(S.pendingHires.length){
   const before=S.team.length;
   for(const h of S.pendingHires){S.team.push(h.person);log(`${h.person.name} 到岗。招聘费已经在上季度付过。`,'good')}
   S.pendingHires=[];
   showScaleUpgrade(before,S.team.length);
 }
 log(`Q${S.quarter} 结算：确认毛利 ${fmt(margin)}，工资+办公 ${fmt(salary+office)}。`,margin-salary-office>=0?'good':'bad');
 const manpowerAfter=totalFreeSlots();
 if(S.quarter===4){
   render();
   showManpowerDelta(manpowerBefore,manpowerAfter,'季度结束，人力释放 / 新人到岗');
   yearEnd();
   return
 }
 S.quarter++;S.week+=12;genOpp();render();
 showManpowerDelta(manpowerBefore,manpowerAfter,'季度推进，人力释放 / 新人到岗');
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
function showYearFeedback({bonus,party,bonusCost,partyCost,tax,feedback,onContinue}){
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
     <span>纳税 <b>${fmt(tax)}</b></span>
   </div>
   <button class="btn" id="continueAfterYear">${S.year>=3?'看三年结算':'进入下一年 →'}</button>
 </div>`;
 document.body.appendChild(host);
 host.querySelector('#continueAfterYear').onclick=()=>{host.remove();onContinue()};
}
function closeYear(bonus,party){
 const bonusCost=payroll()*bonus;
 const partyCost=party===0?0:party===1?S.team.length*.3:S.team.length*.8;
 S.cash-=bonusCost+partyCost;
 S.profit-=bonusCost+partyCost;
 S.morale=clamp(S.morale + (bonus===0?-5:bonus===1?0:bonus===2?4:6)+(party===0?0:party===1?2:4),0,100);
 const tax=Math.max(0,S.taxable)*DIFF[S.diff].tax;
 S.cash-=tax;S.profit-=tax;
 const feedback=yearEndFeedback(bonus,party);
 log(`年末：奖金 ${bonus} 个月，年会 ${party===0?'不办':party===1?'标准':'体面'}，纳税 ${fmt(tax)}。`,'muted');
 log(feedback,bonus===0?'bad':'good');
 S.team.forEach(p=>{p.salary*=1.10;p.tenure=(Number.isFinite(p.tenure)?p.tenure:2)+1});
 S.taxable=0;S.yearSpend=0;
 showYearFeedback({
   bonus,party,bonusCost,partyCost,tax,feedback,
   onContinue:()=>{
     if(S.year>=3){endGame();return}
     S.year++;S.quarter=1;S.week+=12;genOpp();render();
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
 const host=document.createElement('div');host.className='overlay';host.id='layoffModal';
 host.innerHTML=`<div class="modal layoff-modal">
   <div class="big">裁员</div>
   <p class="muted">初始团队默认已有 2 年工龄，每过一年工龄 +1。赔偿按工龄折算月薪，最低 1 个月。可以一次裁多人。</p>
   <div class="layoff-list">
     ${candidates.map(p=>`<label class="layoff-row">
       <input type="checkbox" value="${p.id}">
       <span><b>${p.name}</b><small>${p.role} · 工龄 ${Number.isFinite(p.tenure)?p.tenure:2} 年 · 月薪 ${fmt(p.salary)}${activeLoads(p).length?' · 正在项目中':''}</small></span>
       <strong>${fmt(severanceCost(p))}</strong>
     </label>`).join('')}
   </div>
   <div class="layoff-summary" id="layoffSummary">请选择要裁掉的人。</div>
   <div class="row">
     <button class="btn secondary" id="cancelLayoff">取消</button>
     <button class="btn warn" id="confirmLayoff" disabled>确认裁员</button>
   </div>
 </div>`;
 document.body.appendChild(host);
 const boxes=[...host.querySelectorAll('input[type="checkbox"]')];
 const summary=host.querySelector('#layoffSummary');
 const confirm=host.querySelector('#confirmLayoff');
 function sync(){
   const ids=boxes.filter(x=>x.checked).map(x=>x.value);
   const people=candidates.filter(p=>ids.includes(p.id));
   const total=people.reduce((a,p)=>a+severanceCost(p),0);
   const busy=people.filter(p=>activeLoads(p).length).length;
   summary.innerHTML=ids.length
     ? `裁 ${ids.length} 人 · 赔偿 ${fmt(total)}${busy?` · 其中 ${busy} 人正在项目上，团队士气和声望会受影响`:''}`
     : '请选择要裁掉的人。';
   confirm.disabled=!ids.length;
   confirm.onclick=ids.length?()=>executeLayoffs(ids):null;
 }
 boxes.forEach(x=>x.onchange=sync);
 host.querySelector('#cancelLayoff').onclick=()=>host.remove();
}
function executeLayoffs(ids){
 const host=document.getElementById('layoffModal');
 const people=S.team.filter(p=>ids.includes(p.id)&&p.role!=='老板');
 if(!people.length){if(host)host.remove();return}
 const before=S.team.length;
 const cost=people.reduce((a,p)=>a+severanceCost(p),0);
 const busy=people.filter(p=>activeLoads(p).length).length;
 S.cash-=cost;S.profit-=cost;S.yearSpend+=cost;
 S.team=S.team.filter(p=>!ids.includes(p.id)||p.role==='老板');
 S.morale=clamp(S.morale-people.length*3-busy*2,0,100);
 if(busy)S.reputation=clamp(S.reputation-busy,0,100);
 log(`裁掉 ${people.length} 人，赔偿 ${fmt(cost)}。${busy?`其中 ${busy} 人仍在项目上，士气和声望受损。`:''}`,'bad');
 if(host)host.remove();
 render();
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
function hire(){
 const person=createHireCandidate(),role=person.role,salary=person.salary;
 const fee=salary*.5;
 S.cash-=fee;S.profit-=fee;S.yearSpend+=fee;
 S.pendingHires.push({person});
 log(`签下 ${person.name}（${role}），月薪 ${fmt(salary)}。招聘费 ${fmt(fee)}，下季度到岗。公司每多 5 个正式员工，之后新刷的业务案值整体上一个档位。`,'good');
 render();
 showHireIncentive(1);
}
function bankrupt(){S.ended=true;showEnding(true)}
function endGame(){S.ended=true;showEnding(false)}
function endingText(bankrupt){
 if(bankrupt)return ['现金流艺术家','你把“无限负债也是一种路线”执行到了最后。银行没被说服。'];
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
 const host=document.createElement('div');host.className='overlay';host.id='modal';host.innerHTML=`<div class="modal"><div class="big">第 ${S.year} 年，分钱还是画饼？</div><p class="muted">奖金和年会会影响下一年的士气与离职风险。工资明年自动上涨10%。</p><h3>年终奖</h3><div class="choices">${[0,1,2,3].map(x=>`<div class="choice" data-bonus="${x}"><b>${x}个月</b><div class="meta">成本 ${fmt(payroll()*x)}</div></div>`).join('')}</div><h3>年会</h3><div class="choices">${[[0,'不办'],[1,'标准'],[2,'体面']].map(x=>`<div class="choice" data-party="${x[0]}"><b>${x[1]}</b><div class="meta">成本 ${fmt(x[0]===0?0:x[0]===1?S.team.length*.3:S.team.length*.8)}</div></div>`).join('')}</div><p id="yearChoice" class="muted">请选择奖金和年会。</p><button class="btn" id="confirmYear" disabled>结算这一年</button></div>`;document.body.appendChild(host);
 let b=null,p=null;host.querySelectorAll('[data-bonus]').forEach(el=>el.onclick=()=>{b=+el.dataset.bonus;host.querySelectorAll('[data-bonus]').forEach(x=>x.style.outline='');el.style.outline='2px solid #111';sync()});host.querySelectorAll('[data-party]').forEach(el=>el.onclick=()=>{p=+el.dataset.party;host.querySelectorAll('[data-party]').forEach(x=>x.style.outline='');el.style.outline='2px solid #111';sync()});function sync(){const btn=host.querySelector('#confirmYear');btn.disabled=b===null||p===null;if(!btn.disabled)btn.onclick=()=>{host.remove();closeYear(b,p)}}
}
function showEnding(bankrupt){
 const [title,desc]=endingText(bankrupt),roi=S.revenue?S.profit/S.revenue*100:0;const host=document.createElement('div');host.className='overlay';host.innerHTML=`<div class="modal ending"><div class="big">${title}</div><p>${desc}</p><p>三年收入：<b>${fmt(S.revenue)}</b><br>最终累计利润：<b>${fmt(S.profit)}</b><br>最终现金：<b>${fmt(S.cash)}</b><br>团队规模：<b>${S.team.length}人</b><br>Pitch：<b>${S.wins}赢 / ${S.losses}输</b><br>利润率：<b>${roi.toFixed(1)}%</b></p><button class="btn" onclick="location.reload()">换一种活法，再来一局</button></div>`;document.body.appendChild(host)
}
function render(){
 const app=document.getElementById('app');if(!S){app.innerHTML=startHTML();return}
 const avail=available().length;
 const freeSlotsNow=totalFreeSlots(),capacityNow=totalCapacity(),usedNow=usedCapacity();
 const scaleStep=businessScaleStep(),band=businessScaleBand(),nextBand=nextScaleAt();
 app.innerHTML=`<div class="shell"><div class="mast"><div class="brand"><h1>广告公司模拟器</h1><p>${S.diff} · 第${S.year}年 Q${S.quarter} · 144周都在后台跑，你只做12次大决定</p></div><div class="mast-actions"><div class="creator-mark">@洪流的广告流言</div><div class="row"><button class="btn secondary" onclick="hire()">招一个人</button><button class="btn secondary" onclick="showLayoffModal()">裁员</button><button class="btn warn" onclick="bankrupt()">宣布破产</button></div></div></div>
 <div class="core-stats">
   <div class="core-stat profit-core ${S.profit<0?'negative-profit':''}">
     <span>累计利润</span>
     <b>${fmt(S.profit)}</b>
     <small>收入 ${fmt(S.revenue)} · 现金 ${fmt(S.cash)}</small>
   </div>
   <div class="core-stat manpower-core">
     <span>可用人力</span>
     <b>${freeSlotsNow}<em>/ ${capacityNow}</em></b>
     <div class="manpower-meter"><i style="width:${capacityNow?Math.round((freeSlotsNow/capacityNow)*100):0}%"></i></div>
     <small>${usedNow} 槽正在被项目占用 · 资深可双开</small>
   </div>
 </div>
 <div class="stats secondary-stats"><div class="stat"><b>${fmt(S.cash)}</b><span>公司现金</span></div><div class="stat"><b>${S.team.length}</b><span>正式员工</span></div><div class="stat scale-stat"><b>${band}人档 · +${scaleStep}档</b><span>业务案值等级</span><small>到 ${nextBand} 人再升 1 档 · 毛利率不自动提高</small></div><div class="stat"><b>${S.reputation}</b><span>行业声望</span></div><div class="stat"><b>${S.morale}</b><span>团队士气</span></div></div>
 <div class="grid"><main class="panel"><h2>这季度，生意自己不会长出来</h2><div class="cards">${S.opp.map(o=>cardHTML(o)).join('')||'<p class="muted">机会用完了。推进一季度，市场再刷新。</p>'}</div><div style="margin-top:14px" class="row"><button class="btn quarter-btn ${S.profit<0?'quarter-btn-loss':'quarter-btn-profit'}" onclick="progressQuarter()">推进一季度 →</button><span class="muted">季度工资约 ${fmt(payroll()*3)} · 大单解锁上限 ${fmt(unlockCap())}</span></div>
 <h3>正在执行</h3>${activeHTML()}</main><aside><section class="panel"><h2>流水</h2><div class="log">${S.log.map(x=>`<div class="${x.cls}">${x.msg}</div>`).join('')}</div></section><section class="panel" style="margin-top:18px"><h2>团队</h2><table class="team"><thead><tr><th>人</th><th>职位</th><th>工龄</th><th>月薪</th><th>状态</th></tr></thead><tbody>${S.team.map(p=>`<tr><td>${p.name}</td><td>${p.role}</td><td>${Number.isFinite(p.tenure)?p.tenure:2}年</td><td>${fmt(p.salary)}</td><td><span class="pill">${statusText(p)}</span></td></tr>`).join('')}</tbody></table>${S.pendingHires.length?`<p class="muted">待到岗：${S.pendingHires.map(x=>x.person.name).join('、')}</p>`:''}</section></aside></div><div class="footer">规则核心：没有唯一正确路线。小公司、年框、Pitch、Free、大公司都能活，但都要付代价。</div></div>`
}
function durationLabel(weeks){
 if(weeks>=48)return '1年';
 if(weeks>=36)return '9个月';
 if(weeks>=24)return '2个季度';
 if(weeks>=12)return '1个季度';
 if(weeks>=8)return '2个月';
 return '1个月';
}
function cardHTML(o){
 const lack=Math.max(0,o.people-available().length);
 const isPitch=o.type==='pitch';
 const staffingNote=lack?` · 缺 ${lack} 人`:'';
 const secondLine=isPitch
   ? `比稿期 ${o.pitchWeeks}周 · 基础赢率约 ${35+DIFF[S.diff].baseWin}%${staffingNote}`
   : `无需比稿 · 直接接单${staffingNote}`;
 const feeLine=isPitch&&o.pitchFee>0?`<br>2016 比稿费 ${fmt(o.pitchFee)} · 无论输赢`:'';
 const durationLine=isPitch
   ? `执行期 ${durationLabel(o.duration)}（赢稿后才占用）`
   : `周期 ${durationLabel(o.duration)}（${o.duration}周）`;
 const internalUse=Math.min(o.people,available().length);
 const remaining=Math.max(0,totalFreeSlots()-internalUse);
 const manpowerPreview=isPitch
   ? `赢稿执行将占用约 ${internalUse} 人力槽`
   : `接下后约剩 ${remaining} 人力槽`;
 return `<div class="card"><div class="card-topline"><span class="tag">${o.type==='small'?'散活':o.type==='retainer'?'年框':'Pitch'}</span><span class="people-need ${lack?'people-short':''}">需 ${o.people} 人力${lack?` · 缺 ${lack}`:''}</span></div><h4>${o.name}</h4><div class="money">${fmt(o.value)}</div><div class="meta">毛利 ${(o.margin*100).toFixed(0)}% · ${durationLine}<br>${secondLine}${feeLine}</div><div class="manpower-preview">${manpowerPreview}</div><div class="row" style="margin-top:10px"><button class="btn" onclick="requestProject('${o.id}')">${isPitch?'去比稿':'接下来'}</button>${isPitch?`<button class="btn secondary" onclick="boost('${o.id}')">${o.boost?'取消加码':'加码人力 · 胜率随机 +5~49%'}</button>`:''}</div></div>`
}
function activeHTML(){if(!S.active.length)return '<p class="muted">没有。全公司此刻理论上可以去喝咖啡。</p>';return `<table class="team"><thead><tr><th>项目</th><th>案值</th><th>剩余</th><th>质量</th></tr></thead><tbody>${S.active.map(p=>`<tr><td>${p.name}${p.legacy?' · 老客户':''}</td><td>${fmt(p.value)}</td><td>${Math.max(0,p.left)}周</td><td>${p.quality.toFixed(0)}</td></tr>`).join('')}</tbody></table>`}
function startHTML(){return `<div class="start"><div class="startbox"><div class="creator-mark start-creator">@洪流的广告流言</div><h1>广告公司模拟器</h1><p>你有三年。客户不保证续约，Pitch不保证赢，员工不保证不跑。唯一保证的是工资每年涨10%。</p><div class="difficulty">${Object.entries(DIFF).map(([k,d])=>`<div class="diff" onclick="start('${k}')"><strong>${d.name} · ${d.label}</strong><small>${d.desc}</small></div>`).join('')}</div><p class="footer">一局约 5–8 分钟。目标不是找到最优解，而是看看你会把公司经营成什么东西。</p></div></div>`}
render();