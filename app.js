const INR = new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0});

let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let wallet = JSON.parse(localStorage.getItem('wallet')) || [];
let marriagePlans = JSON.parse(localStorage.getItem('marriagePlans')) || [];
let marriageExpenses = JSON.parse(localStorage.getItem('marriageExpenses')) || [];
let marriageFunding = JSON.parse(localStorage.getItem('marriageFunding')) || [];
let marriageSettings = JSON.parse(localStorage.getItem('marriageSettings')) || {stage:'proposal',budget:300000};
let marriageFilter='all';

function qs(id){return document.getElementById(id)}
function money(v){return INR.format(Number(v)||0)}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function today(){return new Date().toISOString().slice(0,10)}

function save(){
  localStorage.setItem('expenses',JSON.stringify(expenses));
  localStorage.setItem('wallet',JSON.stringify(wallet));
  localStorage.setItem('marriagePlans',JSON.stringify(marriagePlans));
  localStorage.setItem('marriageExpenses',JSON.stringify(marriageExpenses));
  localStorage.setItem('marriageFunding',JSON.stringify(marriageFunding));
  localStorage.setItem('marriageSettings',JSON.stringify(marriageSettings));
}

function addMoney(){
  const a=Number(qs('moneyAmount').value); if(!a||a<=0)return alert('Enter a valid amount.');
  wallet.push({id:uid(),amount:a,note:qs('moneyNote').value.trim(),date:new Date().toISOString()});
  qs('moneyAmount').value=''; qs('moneyNote').value=''; save(); render();
}

function addExpense(){
  const a=Number(qs('amount').value); if(!a||a<=0)return alert('Enter a valid amount.');
  expenses.push({id:uid(),amount:a,note:qs('note').value.trim(),date:new Date().toISOString()});
  qs('amount').value=''; qs('note').value=''; save(); render();
}

function setMarriageStage(stage){marriageSettings.stage=stage;save();renderMarriage()}
function saveMarriageBudget(){
  const b=Number(qs('marriageBudgetInput').value); if(!b||b<=0)return alert('Enter a valid budget ceiling.');
  marriageSettings.budget=b; save(); renderMarriage();
}

function addMarriagePlan(){
  const amount=Number(qs('marriagePlanAmount').value);if(!amount||amount<=0)return alert('Enter a valid estimate.');
  marriagePlans.push({id:uid(),category:qs('marriagePlanCategory').value,amount,note:qs('marriagePlanNote').value.trim(),createdAt:new Date().toISOString()});
  qs('marriagePlanAmount').value='';qs('marriagePlanNote').value='';save();renderMarriage();
}

function addMarriageExpense(){
  const amount=Number(qs('marriageExpenseAmount').value);
  if(!amount||amount<=0)return alert('Enter a valid marriage expense.');
  marriageExpenses.push({id:uid(),type:'expense',category:qs('marriageCategory').value,amount,note:qs('marriageExpenseNote').value.trim(),date:qs('marriageExpenseDate').value||today(),createdAt:new Date().toISOString()});
  qs('marriageExpenseAmount').value=''; qs('marriageExpenseNote').value=''; qs('marriageExpenseDate').value=today(); save(); renderMarriage();
}

function addMarriageFunding(){
  const amount=Number(qs('fundingAmount').value); if(!amount||amount<=0)return alert('Enter a valid funding amount.');
  marriageFunding.push({id:uid(),type:'funding',fundingType:qs('fundingType').value,amount,source:qs('fundingSource').value.trim(),note:qs('fundingNote').value.trim(),date:today(),createdAt:new Date().toISOString()});
  qs('fundingAmount').value='';qs('fundingSource').value='';qs('fundingNote').value='';save();renderMarriage();
}

function deleteMarriagePlan(id){if(!confirm('Delete this planned cost?'))return;marriagePlans=marriagePlans.filter(x=>x.id!==id);save();renderMarriage()}
function deleteMarriageItem(kind,id){
  if(!confirm('Delete this entry?'))return;
  if(kind==='expense')marriageExpenses=marriageExpenses.filter(x=>x.id!==id);
  else marriageFunding=marriageFunding.filter(x=>x.id!==id);
  save();renderMarriage();
}

function setMarriageFilter(filter,btn){marriageFilter=filter;document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');renderMarriageHistory()}

function render(){
  const av=wallet.reduce((a,b)=>a+Number(b.amount||0),0),sp=expenses.reduce((a,b)=>a+Number(b.amount||0),0);
  qs('moneyAvailable').textContent=money(av);qs('totalSpent').textContent=money(sp);qs('remainingMoney').textContent=money(av-sp);qs('transactionCount').textContent=wallet.length+expenses.length;
  const combined=[...wallet.map(x=>({...x,kind:'money'})),...expenses.map(x=>({...x,kind:'expense'}))].sort((a,b)=>new Date(b.date)-new Date(a.date));
  qs('history').innerHTML=combined.length?combined.map(x=>`<div class="ledger-row"><div><strong>${x.kind==='money'?'Money added':'Expense'}</strong><small>${escapeHtml(x.note||'No note')} • ${new Date(x.date).toLocaleString()}</small></div><strong class="${x.kind==='money'?'positive':'negative'}">${x.kind==='money'?'+':'-'}${money(x.amount)}</strong></div>`).join(''):'<div class="empty">No vacation entries yet.</div>';
  renderTripDay();renderMarriage();
}

function renderTripDay(){
  const start=new Date('2026-09-17T00:00:00');const end=new Date('2026-10-20T23:59:59');const now=new Date();let text='';
  if(now<start){const d=Math.ceil((start-now)/86400000);text=`${d} day${d===1?'':'s'} to Kerala ✈️`;}
  else if(now<=end){const d=Math.floor((now-start)/86400000)+1;text=`Vacation Day ${d} 🌴`;}
  else text='Kerala Vacation completed ❤️';
  qs('tripDay').textContent=text;
}

function renderMarriage(){
  const budget=Number(marriageSettings.budget)||300000;
  const estimated=marriagePlans.reduce((a,b)=>a+Number(b.amount||0),0);
  const spent=marriageExpenses.reduce((a,b)=>a+Number(b.amount||0),0);
  const funded=marriageFunding.reduce((a,b)=>a+Number(b.amount||0),0);
  const borrowed=marriageFunding.filter(x=>x.fundingType==='borrowed').reduce((a,b)=>a+Number(b.amount||0),0);
  const fundingGap=Math.max(0,Math.max(estimated,spent)-funded);
  const actualPct=budget?Math.min(100,(spent/budget)*100):0;const estimatedPct=budget?Math.min(100,(estimated/budget)*100):0;const remaining=budget-spent;
  qs('marriageBudget').textContent=money(budget);qs('marriageEstimated').textContent=money(estimated);qs('marriageSpent').textContent=money(spent);qs('marriageFunded').textContent=money(funded);qs('marriageBorrowed').textContent=money(borrowed);qs('marriageFundingGap').textContent=money(fundingGap);
  qs('marriagePercent').textContent=(spent/budget*100||0).toFixed(spent?1:0)+'%';qs('marriageEstimatedPercent').textContent=(estimated/budget*100||0).toFixed(estimated?1:0)+'%';qs('marriageRemaining').textContent=money(remaining);
  qs('marriageProgress').style.width=actualPct+'%';qs('marriageEstimatedProgress').style.width=estimatedPct+'%';qs('marriageMiniProgress').style.width=actualPct+'%';qs('marriageBudgetSummary').textContent=`${money(spent)} / ${money(budget)}`;qs('marriageBudgetInput').value=budget;qs('marriageStage').value=marriageSettings.stage;
  const confirmed=marriageSettings.stage==='confirmed';['marriageStatusBadge','marriageStatusBadge2'].forEach(id=>{const e=qs(id);e.textContent=confirmed?'Marriage Confirmed':'Proposal Stage';e.className='badge '+(confirmed?'confirmed':'planning')});
  qs('proposalNotice').innerHTML=confirmed?'Marriage mode is active. Record only real commitments and actual spending.':'Nothing is confirmed yet. Planning mode lets you prepare without treating possible costs as committed spending.';
  renderMarriagePlans();renderMarriageCategories();renderMarriageHistory();renderReports();
}

function renderMarriagePlans(){
  const sorted=[...marriagePlans].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  qs('marriagePlanList').innerHTML=sorted.length?sorted.map(x=>`<div class="ledger-row"><div><strong>${escapeHtml(x.category)}</strong><small>${escapeHtml(x.note||'Planned cost')}</small></div><div class="ledger-actions"><strong>${money(x.amount)}</strong><button class="icon-btn" onclick="deleteMarriagePlan('${x.id}')">×</button></div></div>`).join(''):'<div class="empty">No estimates yet. Add costs only when you have a realistic idea or quote.</div>';
}

function renderMarriageCategories(){
  const categories=['Gold','Clothes','Nikah / Function','Documents','Travel','Gifts','Home Setup','Other'];const totals={};marriageExpenses.forEach(x=>totals[x.category]=(totals[x.category]||0)+Number(x.amount||0));const total=marriageExpenses.reduce((a,b)=>a+Number(b.amount||0),0);
  qs('marriageCategories').innerHTML=categories.map(c=>{const v=totals[c]||0;const p=total?v/total*100:0;return `<div class="break-row"><div class="status-line small"><span>${c}</span><strong>${money(v)}</strong></div><div class="progress thin"><div class="progress-bar" style="width:${p}%"></div></div></div>`}).join('');
}

function renderMarriageHistory(){
  let all=[...marriageExpenses,...marriageFunding].sort((a,b)=>new Date(b.createdAt||b.date)-new Date(a.createdAt||a.date));
  if(marriageFilter==='expense')all=all.filter(x=>x.type==='expense');if(marriageFilter==='funding')all=all.filter(x=>x.type==='funding');
  qs('marriageHistory').innerHTML=all.length?all.map(x=>{
    if(x.type==='expense')return `<div class="ledger-row"><div><strong>${escapeHtml(x.category)}</strong><small>${escapeHtml(x.note||'No note')} • ${x.date}</small></div><div class="ledger-actions"><strong class="negative">-${money(x.amount)}</strong><button class="icon-btn" onclick="deleteMarriageItem('expense','${x.id}')">×</button></div></div>`;
    const label={cash:'Own Cash / Savings',borrowed:'Borrowed',family:'Family Contribution',other:'Other Funding'}[x.fundingType]||'Funding';
    return `<div class="ledger-row"><div><strong>${label}</strong><small>${escapeHtml(x.source||'No source')}${x.note?' • '+escapeHtml(x.note):''} • ${x.date}</small></div><div class="ledger-actions"><strong class="positive">+${money(x.amount)}</strong><button class="icon-btn" onclick="deleteMarriageItem('funding','${x.id}')">×</button></div></div>`;
  }).join(''):'<div class="empty">No marriage entries yet — exactly right while it is still only a proposal.</div>';
}

function renderReports(){
  const av=wallet.reduce((a,b)=>a+Number(b.amount||0),0),sp=expenses.reduce((a,b)=>a+Number(b.amount||0),0);
  qs('vacationReport').innerHTML=`<div class="report-grid"><div><span>Money added</span><strong>${money(av)}</strong></div><div><span>Spent</span><strong>${money(sp)}</strong></div><div><span>Remaining</span><strong>${money(av-sp)}</strong></div></div>`;
  const budget=Number(marriageSettings.budget)||300000,me=marriagePlans.reduce((a,b)=>a+Number(b.amount||0),0),ms=marriageExpenses.reduce((a,b)=>a+Number(b.amount||0),0),mf=marriageFunding.reduce((a,b)=>a+Number(b.amount||0),0),mb=marriageFunding.filter(x=>x.fundingType==='borrowed').reduce((a,b)=>a+Number(b.amount||0),0);
  qs('marriageReport').innerHTML=`<div class="report-grid"><div><span>Status</span><strong>${marriageSettings.stage==='confirmed'?'Confirmed':'Proposal'}</strong></div><div><span>Estimated</span><strong>${money(me)}</strong></div><div><span>Actual spent</span><strong>${money(ms)}</strong></div><div><span>Budget left</span><strong>${money(budget-ms)}</strong></div><div><span>Total funding</span><strong>${money(mf)}</strong></div><div><span>Borrowed</span><strong>${money(mb)}</strong></div></div>`;
}

function exportData(){
  const data={exportedAt:new Date().toISOString(),vacation:{wallet,expenses},marriage:{settings:marriageSettings,plans:marriagePlans,expenses:marriageExpenses,funding:marriageFunding}};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Abdulla-Kerala-Vacation-Tracker-Backup.json';a.click();URL.revokeObjectURL(url);
}

function escapeHtml(s){return String(s).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}

if(qs('marriageExpenseDate'))qs('marriageExpenseDate').value=today();
render();