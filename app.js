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
].map((x,i)=>({id:`p${i}`,name:x[0],role:x[1],spec:x[2],salary:x[3],skill:x[4],busy:0}));

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
function allocateLegacy(){let n=5; for(const p of S.team){p.busy= n>0?24:0; if(n>0)n--;}}
function available(){return S.team.filter(p=>p.busy<=0)}
function payroll(){return S.team.reduce((a,p)=>a+p.salary,0)}
function unlockCap(){const n=S.team.length; return n>=40?5000:n>=30?1800:n>=20?800:480}
function makeOpportunity(forced=''){
 const d=DIFF[S.diff], cap=unlockCap();
 const r=Math.random();
 let type=forced|| (r<.24?'small':r<.43?'retainer':'pitch');
 let value;
 if(type==='small') value=pick([8,15,25,40,60]);
 else if(type==='retainer') value=pick([80,120,180,300,500,800,1200,1500]);
 else value=pick([50,80,120,200,300,500,800,1200,1800,3000,5000]);
 value=Math.min(value,cap); value=Math.round(value*d.deal);
 const people=clamp(Math.ceil(Math.log2(Math.max(16,value/12))),2,12);
 const duration= type==='retainer'?pick([24,36,48]):pick([8,12,16,24]);
 const margin= type==='retainer'?pick([.22,.28,.33,.38]):type==='small'?pick([.45,.5,.55]):pick([.28,.34,.4,.46]);
 const namesBy={small:['临时物料包','社媒快单','老板朋友的急活','产品内容小单'],retainer:['半年年框','年度社媒年框','品牌年度顾问','内容长期服务'],pitch:['新品上市Pitch','整合传播Pitch','品牌焕新Pitch','年度战役Pitch','超级整合Pitch']};
 return {id:uid(),name:pick(namesBy[type]),type,value,people,duration,margin,freeAllowed:true,boost:false};
}
function genOpp(){
 const n=DIFF[S.diff].opp + (S.reputation>=70?1:0); S.opp=[]; for(let i=0;i<n;i++) S.opp.push(makeOpportunity());
 if(S.team.length<20) S.opp=S.opp.filter(o=>o.value<500);
 if(S.team.length<30) S.opp=S.opp.filter(o=>o.value<1000);
}
function log(msg,cls=''){S.log.unshift({msg,cls}); S.log=S.log.slice(0,60)}
function freeCostFor(o,freeCount){
 return +(freeCount*1.2*Math.ceil(o.duration/4)).toFixed(1);
}
function requestProject(id){
 const o=S.opp.find(x=>x.id===id); if(!o)return;
 const lack=Math.max(0,o.people-available().length);
 if(lack>0){showFreeChoice(o,lack);return}
 takeProject(id,false);
}
function showFreeChoice(o,freeCount){
 const old=document.getElementById('freeModal'); if(old)old.remove();
 const cost=freeCostFor(o,freeCount);
 const share=freeCount/o.people;
 const host=document.createElement('div');host.className='overlay';host.id='freeModal';
 let risk;
 if(o.type==='pitch'){
   risk=share>.5
     ? `Free 占到 ${Math.round(share*100)}%，超过一半：Pitch 胜率会下降约 8 个百分点，执行质量也更难控。`
     : `Free 不超过项目人力的一半：不会直接降低 Pitch 胜率，但执行质量会有轻微风险。`;
 }else{
   risk=share>.5
     ? `Free 占到 ${Math.round(share*100)}%，项目可以直接接，但外部团队过半，执行质量和声望风险会明显增加。`
     : `项目可以直接接。Free 不超过一半，主要代价是额外成本和轻微的执行质量风险。`;
 }
 host.innerHTML=`<div class="modal">
   <div class="big">人不够。要用 Free 吗？</div>
   <p><b>${o.name}</b> 需要 ${o.people} 人，现在内部只有 ${available().length} 人可用，还差 <b>${freeCount} 人</b>。</p>
   <p>预计 Free 成本：<b>${fmt(cost)}</b></p>
   <p class="bad">${risk}</p>
   <div class="row">
     <button class="btn secondary" id="cancelFree">先不接</button>
     <button class="btn" id="confirmFree">用 ${freeCount} 个 Free ${o.type==='pitch'?'去比稿':'接下来'}</button>
   </div>
 </div>`;
 document.body.appendChild(host);
 host.querySelector('#cancelFree').onclick=()=>host.remove();
 host.querySelector('#confirmFree').onclick=()=>{host.remove();takeProject(o.id,true)};
}
function takeProject(id,useFree=false){
 const o=S.opp.find(x=>x.id===id); if(!o)return;
 const avail=available();
 const internal=Math.min(avail.length,o.people);
 const freeCount=Math.max(0,o.people-internal);
 if(freeCount>0&&!useFree){showFreeChoice(o,freeCount);return}
 const selected=[...avail].sort((a,b)=>b.skill-a.skill).slice(0,internal);
 const teamScore=selected.length?selected.reduce((a,p)=>a+p.skill,0)/selected.length:55;
 const freeShare=freeCount/o.people;
 const freeQualityPenalty=freeCount?freeShare*10:0;
 const freeCost=freeCount?freeCostFor(o,freeCount):0;
 S.route[o.type]++;
 if(freeCount){
   S.cash-=freeCost;S.yearSpend+=freeCost;S.route.free+=freeCount;
   log(`用了 ${freeCount} 个 Free，成本 ${fmt(freeCost)}。`,'muted');
 }

 // 年框和散活是直接接单，不参与 Pitch 随机开奖。
 if(o.type!=='pitch'){
   selected.forEach(p=>p.busy=Math.max(p.busy,o.duration));
   const quality=clamp(teamScore+Math.random()*12-4-freeQualityPenalty,42,98);
   S.active.push({id:uid(),name:o.name,type:o.type,value:o.value,margin:o.margin,weeks:o.duration,left:o.duration,people:o.people,quality,legacy:false});
   S.reputation=clamp(S.reputation+(quality>84?2:quality<60?-2:0),0,100);
   log(`接下：${o.name}，案值 ${fmt(o.value)}。`,'good');
   S.opp=S.opp.filter(x=>x.id!==id);
   render();
   showProjectResult({won:true,type:o.type,name:o.name,value:o.value,cost:freeCost,pWin:null});
   return;
 }

 // 只有 Pitch 才计算胜率、投入和赢输。
 const staffing=clamp((teamScore-72)*.35,-8,10);
 const boost=o.boost?pick([5,6,7,8,9,10,11,12]):0;
 const freePenalty=freeShare>.5?-8:0;
 const pWin=clamp(35+DIFF[S.diff].baseWin+staffing+boost+freePenalty+clamp((S.reputation-50)*.18,-7,8),8,92);
 const pitchCost=Math.max(1,Math.min(12,o.value*.012))+(o.boost?Math.max(1,o.value*.01):0);
 S.cash-=pitchCost;S.yearSpend+=pitchCost;S.totalPitches++;
 const won=Math.random()*100<pWin;
 if(won){
   S.wins++;S.winStreak++;S.lossStreak=0;
   selected.forEach(p=>p.busy=Math.max(p.busy,o.duration));
   const quality=clamp(teamScore+Math.random()*14-5+(o.boost?4:0)-freeQualityPenalty,42,98);
   S.active.push({id:uid(),name:o.name,type:o.type,value:o.value,margin:o.margin,weeks:o.duration,left:o.duration,people:o.people,quality,legacy:false});
   S.reputation=clamp(S.reputation+(quality>82?3:quality<62?-2:1),0,100);
   log(`赢了：${o.name}，案值 ${fmt(o.value)}，当时胜率约 ${pWin.toFixed(0)}%。`,'good');
   if(S.winStreak>=3){
     S.winStreak=0;
     const f=makeOpportunity('small');f.name='连带散活 · '+f.name;f.value=Math.max(f.value,Math.round(o.value*.12));
     S.opp.push(f);S.followups++;
     log('三连胜。客户圈开始传你的名字，掉下来一笔连带散活。','good');
   }
 }else{
   S.losses++;S.lossStreak++;S.winStreak=0;S.reputation=clamp(S.reputation-1,0,100);
   log(`输了：${o.name}。烧掉 ${fmt(pitchCost)}，提案室里只剩半瓶矿泉水。`,'bad');
   if(S.lossStreak>=3){S.lossStreak=0;maybeLeave()}
 }
 S.opp=S.opp.filter(x=>x.id!==id);
 render();
 showProjectResult({won,type:o.type,name:o.name,value:o.value,cost:pitchCost+freeCost,pWin});
}
function showProjectResult({won,type,name,value,cost,pWin}){
 const old=document.getElementById('pitchResultModal'); if(old)old.remove();

 // 年框和散活只做轻提示，不抢占操作。
 if(type!=='pitch'){
   const host=document.createElement('div');
   host.className='result-toast result-win';
   host.innerHTML=`<b>${type==='retainer'?'年框接下了':'接到了'}</b><span>${name} · ${fmt(value)}</span>`;
   document.body.appendChild(host);
   window.setTimeout(()=>host.classList.add('result-leave'),900);
   window.setTimeout(()=>host.remove(),1250);
   return;
 }

 // Pitch 必须明确看到结果，用户手动继续。
 const host=document.createElement('div');
 host.className=`overlay pitch-result-overlay ${won?'pitch-win':'pitch-loss'}`;
 host.id='pitchResultModal';
 host.setAttribute('role','dialog');
 host.setAttribute('aria-modal','true');
 const streak=won && S.winStreak>1
   ? `连续 ${S.winStreak} 次赢稿`
   : (!won && S.lossStreak>1 ? `连续 ${S.lossStreak} 次丢稿` : '');
 host.innerHTML=`<div class="pitch-result-card">
   <div class="pitch-result-kicker">PITCH RESULT</div>
   <div class="pitch-result-title">${won?'赢稿！':'丢稿。'}</div>
   <div class="pitch-result-project">${name}</div>
   <div class="pitch-result-amount">${won?`拿下 ${fmt(value)}`:`投入损失 ${fmt(cost)}`}</div>
   <div class="pitch-result-meta">当时胜率约 ${pWin.toFixed(0)}%${streak?` · ${streak}`:''}</div>
   <button class="btn pitch-result-button" id="closePitchResult">${won?'收下，继续经营':'认了，继续经营'}</button>
 </div>`;
 document.body.appendChild(host);
 host.querySelector('#closePitchResult').focus();
 host.querySelector('#closePitchResult').onclick=()=>host.remove();
}
function maybeLeave(){
 let risk=.42-clamp((S.morale-50)/130,0,.25); if(Math.random()>risk){log('三连败之后团队情绪低，但这次没人辞职。','muted');return}
 const candidates=S.team.filter(p=>p.role!=='老板'); if(!candidates.length)return; const gone=pick(candidates);S.team=S.team.filter(p=>p.id!==gone.id);log(`${gone.name} 提了离职。离职本身不花钱，重新招人才花。`,'bad');
}
function boost(id){const o=S.opp.find(x=>x.id===id);if(o){o.boost=!o.boost;render()}}
function progressQuarter(){
 if(S.ended)return;
 let gross=0,margin=0;
 for(const p of S.active){
   const weeks=Math.min(12,p.left); const share=weeks/p.weeks; gross+=p.value*share; margin+=p.value*p.margin*share; p.left-=12;
 }
 const salary=payroll()*3; const office=Math.max(4,S.team.length*.45)*3;
 S.cash += margin - salary - office; S.revenue+=gross; S.profit += margin - salary - office; S.taxable += Math.max(0,margin - salary - office); S.yearSpend+=salary+office;
 S.team.forEach(p=>p.busy=Math.max(0,p.busy-12));
 const done=S.active.filter(p=>p.left<=0); done.forEach(p=>{if(p.quality>84)S.reputation=clamp(S.reputation+2,0,100);}); S.active=S.active.filter(p=>p.left>0);
 for(const h of S.pendingHires){S.team.push(h.person);log(`${h.person.name} 到岗。招聘费已经在上季度付过。`,'good')} S.pendingHires=[];
 log(`Q${S.quarter} 结算：确认毛利 ${fmt(margin)}，工资+办公 ${fmt(salary+office)}。`,margin-salary-office>=0?'good':'bad');
 if(S.quarter===4){yearEnd();return}
 S.quarter++;S.week+=12;genOpp();render();
}
function yearEnd(){showYearModal()}
function closeYear(bonus,party){
 const bonusCost=payroll()*bonus; const partyCost=party===0?0:party===1?S.team.length*.3:S.team.length*.8;
 S.cash-=bonusCost+partyCost; S.profit-=bonusCost+partyCost; S.morale=clamp(S.morale + (bonus===0?-5:bonus===1?0:bonus===2?4:6)+(party===0?0:party===1?2:4),0,100);
 const tax=Math.max(0,S.taxable)*DIFF[S.diff].tax;S.cash-=tax;S.profit-=tax;log(`年末：奖金 ${bonus} 个月，年会 ${party===0?'不办':party===1?'标准':'体面'}，纳税 ${fmt(tax)}。`,'muted');
 S.team.forEach(p=>p.salary*=1.10); S.taxable=0;S.yearSpend=0;
 if(S.year>=3){endGame();return}
 S.year++;S.quarter=1;S.week+=12;genOpp();render();
}
function hire(){
 const role=pick(roles),skill=Math.round(62+Math.random()*27),salary=+(0.9+(skill-60)*.055+(role==='策略'?0.4:0)).toFixed(1),person={id:uid(),name:pick(names),role,spec:role==='文案'||role==='美术'?'创意':role==='阿康'?'客户':role,salary,skill,busy:0};
 const fee=salary*.5;S.cash-=fee;S.pendingHires.push({person});log(`签下 ${person.name}（${role}），月薪 ${fmt(salary)}。招聘费 ${fmt(fee)}，下季度到岗。`,'muted');render();
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
 const avail=available().length;app.innerHTML=`<div class="shell"><div class="mast"><div class="brand"><h1>广告公司模拟器</h1><p>${S.diff} · 第${S.year}年 Q${S.quarter} · 144周都在后台跑，你只做12次大决定</p></div><div class="row"><button class="btn secondary" onclick="hire()">招一个人</button><button class="btn warn" onclick="bankrupt()">宣布破产</button></div></div>
 <div class="stats"><div class="stat"><b>${fmt(S.cash)}</b><span>公司现金</span></div><div class="stat"><b>${fmt(S.profit)}</b><span>累计利润</span></div><div class="stat"><b>${S.team.length}</b><span>正式员工</span></div><div class="stat"><b>${avail}</b><span>可用人手</span></div><div class="stat"><b>${S.reputation}</b><span>行业声望</span></div><div class="stat"><b>${S.morale}</b><span>团队士气</span></div></div>
 <div class="grid"><main class="panel"><h2>这季度，生意自己不会长出来</h2><div class="cards">${S.opp.map(o=>cardHTML(o)).join('')||'<p class="muted">机会用完了。推进一季度，市场再刷新。</p>'}</div><div style="margin-top:14px" class="row"><button class="btn" onclick="progressQuarter()">推进一季度 →</button><span class="muted">季度工资约 ${fmt(payroll()*3)} · 大单解锁上限 ${fmt(unlockCap())}</span></div>
 <h3>正在执行</h3>${activeHTML()}</main><aside><section class="panel"><h2>流水</h2><div class="log">${S.log.map(x=>`<div class="${x.cls}">${x.msg}</div>`).join('')}</div></section><section class="panel" style="margin-top:18px"><h2>团队</h2><table class="team"><thead><tr><th>人</th><th>职位</th><th>月薪</th><th>状态</th></tr></thead><tbody>${S.team.map(p=>`<tr><td>${p.name}</td><td>${p.role}</td><td>${fmt(p.salary)}</td><td><span class="pill">${p.busy>0?`忙 ${p.busy}周`:'空闲'}</span></td></tr>`).join('')}</tbody></table>${S.pendingHires.length?`<p class="muted">待到岗：${S.pendingHires.map(x=>x.person.name).join('、')}</p>`:''}</section></aside></div><div class="footer">规则核心：没有唯一正确路线。小公司、年框、Pitch、Free、大公司都能活，但都要付代价。</div></div>`
}
function cardHTML(o){
 const lack=Math.max(0,o.people-available().length);
 const isPitch=o.type==='pitch';
 const staffingNote=lack?` · 缺 ${lack} 人`:'';
 const secondLine=isPitch
   ? `基础赢率约 ${35+DIFF[S.diff].baseWin}%${staffingNote}`
   : `无需比稿 · 直接接单${staffingNote}`;
 return `<div class="card"><span class="tag">${o.type==='small'?'散活':o.type==='retainer'?'年框':'Pitch'}</span><h4>${o.name}</h4><div class="money">${fmt(o.value)}</div><div class="meta">毛利 ${(o.margin*100).toFixed(0)}% · ${o.people}人 · ${o.duration}周<br>${secondLine}</div><div class="row" style="margin-top:10px"><button class="btn" onclick="requestProject('${o.id}')">${isPitch?'去比稿':'接下来'}</button>${isPitch?`<button class="btn secondary" onclick="boost('${o.id}')">${o.boost?'取消加码':'加人力成本 +5~12%'}</button>`:''}</div></div>`
}
function activeHTML(){if(!S.active.length)return '<p class="muted">没有。全公司此刻理论上可以去喝咖啡。</p>';return `<table class="team"><thead><tr><th>项目</th><th>案值</th><th>剩余</th><th>质量</th></tr></thead><tbody>${S.active.map(p=>`<tr><td>${p.name}${p.legacy?' · 老客户':''}</td><td>${fmt(p.value)}</td><td>${Math.max(0,p.left)}周</td><td>${p.quality.toFixed(0)}</td></tr>`).join('')}</tbody></table>`}
function startHTML(){return `<div class="start"><div class="startbox"><h1>广告公司模拟器</h1><p>你有三年。客户不保证续约，Pitch不保证赢，员工不保证不跑。唯一保证的是工资每年涨10%。</p><div class="difficulty">${Object.entries(DIFF).map(([k,d])=>`<div class="diff" onclick="start('${k}')"><strong>${d.name} · ${d.label}</strong><small>${d.desc}</small></div>`).join('')}</div><p class="footer">一局约 5–8 分钟。目标不是找到最优解，而是看看你会把公司经营成什么东西。</p></div></div>`}
render();