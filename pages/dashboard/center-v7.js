/* Center operations: one persisted snapshot for athletes, bookings and attendance. */
const stageContext={
 '성장기 이전':'기술과 협응을 쌓는 시기입니다. 절대 근력·파워는 성장 이후 선수보다 낮을 수 있어, 현재 체격만으로 평가하지 않습니다.',
 '가속기':'몸의 길이와 무게가 달라지며 착지·감속과 움직임 조절이 흔들릴 수 있습니다. 수행 변화와 피로를 함께 관찰하세요.',
 '급성장기':'빠르게 달라지는 몸에 적응하면서 균형·협응·가동성이 일시적으로 흔들릴 수 있습니다. 개인차가 있으며 모든 약점을 성장 탓으로 단정하지 않습니다.',
 '감속기':'성장 속도가 줄어도 움직임과 좌우 균형의 적응은 이어질 수 있습니다. 회복 반응을 확인하며 근력·파워 과제를 조정하세요.',
 '종료초기':'성장이 마무리되는 과정입니다. 근력과 파워의 발달 속도는 개인마다 달라, 훈련 경험과 회복 상태를 함께 봅니다.',
 '성인':'성장단계보다 훈련 이력·부하·회복과 개인 검사 결과를 중심으로 과제를 정합니다.',
 '검사 전':'검사 결과가 연결되면 성장 시기와 개인 보강 포인트를 함께 확인할 수 있습니다.'
};
const priorityStages=['가속기','급성장기','감속기'];
function duePlayers(){return players.filter(p=>p.report?.examDate&&shiftMonths(p.report.examDate,3)<=localDate()).sort((a,b)=>Number(priorityStages.includes(getStage(b)))-Number(priorityStages.includes(getStage(a)))||a.report.examDate.localeCompare(b.report.examDate))}
function centerOverview(){
 const todays=bookings.filter(b=>b.date===localDate()),done=todays.filter(b=>b.status==='completed');
 $('#center-overview').innerHTML=`<article class="overview-welcome"><span class="eyebrow">MPS CENTER · PLAYER DEVELOPMENT</span><h2>검사에서 목표로.<br> 레슨에서 성장으로.</h2><p>${displayDate(localDate())} · 오늘의 센터</p></article><article><span>관리 선수</span><strong>${players.length}<small>명</small></strong><p>기술 · 몸 · 마음의 균형</p></article><article><span>오늘 예약 / 완료</span><strong>${todays.filter(b=>!['cancelled','no_show'].includes(b.status)).length}<small> / ${done.length}건</small></strong><button data-center-nav="calendar">출석 관리 →</button></article>`;
 $('#review-section').innerHTML=`<div class="review-list">${duePlayers().map(p=>`<button data-open-athlete="${esc(p.id)}"><span class="athlete-avatar">${esc(p.name.slice(0,1))}</span><span><b>${esc(p.name)}</b><small>${esc(getStage(p))} · 최근 ${displayDate(p.report.examDate)}</small></span><em>${priorityStages.includes(getStage(p))?'우선 추천':'검사 점검'}</em><span>→</span></button>`).join('')||'<p class="empty">3개월이 경과한 선수가 없습니다.</p>'}</div><div class="report-import"><label class="button soft">MPS 리포트 가져오기<input id="mps-import" type="file" accept="application/json,.json" hidden></label><small>선수 고유코드로 연결 · JSON 파일</small><p id="import-result" role="status"></p></div>`;
 $('#due-count').textContent=`${duePlayers().length}명`;
}
function monthlyReport(){
 const month=$('#report-month').value;if(!month)return;
 const visits=bookings.filter(b=>b.date.slice(0,7)===month&&b.status==='completed');
 const ids=[...new Set(visits.map(b=>b.playerId))];
 const lastDay=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).getUTCDate();
 $('#monthly-content').innerHTML=`<p class="month-range">${month.replace('-','년 ')}월 1일 ~ ${lastDay}일 · 완료한 방문 기준</p><div class="month-stats"><div><strong>${ids.length}</strong><span>방문 선수</span></div><div><strong>${visits.length}</strong><span>완료 방문</span></div><div><strong>${visits.filter(b=>b.type==='레슨').length}</strong><span>차감 레슨</span></div></div>${ids.map(id=>{
 const p=players.find(x=>x.id===id);if(!p)return '';
 const records=visits.filter(b=>b.playerId===id),notes=(p.notes||[]).filter(n=>n.date.replaceAll('.','-').slice(0,7)===month);
 const familyReviews=(p.developmentHistory?.length?p.developmentHistory:p.development?[p.development]:[]).filter(r=>r.updatedAt?.slice(0,7)===month);
 const checks=[...(p.idpHistory||[]),p.idp].filter(Boolean).flatMap(plan=>(plan.checks||[]).filter(c=>c.date.slice(0,7)===month).map(c=>({...c,priorities:plan.priorities})));
 return `<article class="monthly-athlete"><div class="panel-head"><div><h3>${esc(p.name)} <small>${esc(getStage(p))}</small></h3><p>방문 ${records.length}회 · 레슨 ${records.filter(b=>b.type==='레슨').length}회 · 남은 ${Math.max(0,p.paid-p.used)}회</p></div><button class="button soft" data-open-athlete="${esc(id)}">선수 차트 →</button></div>${p.development?.voice?`<p><b>선수의 바람</b> ${esc(p.development.voice)}</p>`:''}${familyReviews.filter(r=>r.family).map(r=>`<p><b>보호자 리뷰 · ${displayDate(r.updatedAt)}</b> ${esc(r.family)}</p>`).join('')}<p><b>현재 성장플랜</b> ${p.idp?.priorities?.map(x=>esc(x.label)).join(' · ')||'설정 전'}</p><div class="monthly-notes">${notes.map(n=>`<p><time>${esc(n.date)}</time> ${esc(n.text)}</p>`).join('')||'<p>이 달의 선수 메모가 없습니다.</p>'}${records.filter(b=>b.memo).map(b=>`<p><time>${displayDate(b.date)}</time> ${esc(b.type)} · ${esc(b.memo)}</p>`).join('')}</div><p><b>IDP 관찰</b> ${checks.length}회 체크${checks.length?checks.map(c=>`<span class="monthly-check">${displayDate(c.date)} · ${esc(idpLabel(IDP_CONDITIONS,c.condition))} · ${c.priorities.map(x=>`${esc(x.label)}: ${esc(idpLabel(IDP_CHECKS,c.values?.[x.id]))}`).join(' / ')}${c.feedback?`<br>코치 관찰: ${esc(c.feedback)}`:''}${c.playerVoice?`<br>선수 의견: ${esc(c.playerVoice)}`:''}${c.rpe!==undefined&&c.rpe!==''?`<br>체감 강도: ${esc(c.rpe)} / 10`:''}</span>`).join(''): ' · 관찰 기록을 남기면 이곳에 모입니다.'}</p></article>`;
 }).join('')||'<div class="empty monthly-empty">이 달의 완료 방문이 없습니다.<br>예약 캘린더에서 출석을 완료하면 선수별 기록이 모입니다.</div>'}`;
}
function openCenterMenu(menu){
 document.querySelectorAll('.center-nav button').forEach(b=>b.classList.toggle('active',b.dataset.centerNav===menu));
 if(menu==='calendar')$('#calendar-open').click();
 else if(menu==='monthly'){$('#report-month').value=localDate().slice(0,7);monthlyReport();$('#monthly-dialog').showModal()}
 else if(menu==='review')$('#review-dialog').showModal();
 else $('#roster-section').scrollIntoView({behavior:'smooth',block:'start'});
}
document.addEventListener('click',e=>{
 const nav=e.target.closest('[data-center-nav]');if(nav)openCenterMenu(nav.dataset.centerNav);
 const athlete=e.target.closest('[data-open-athlete]');if(athlete){if($('#review-dialog').open)$('#review-dialog').close();if($('#monthly-dialog').open)$('#monthly-dialog').close();window.mpsReturnToPlayer(athlete.dataset.openAthlete)}
});
$('#review-close').addEventListener('click',()=>$('#review-dialog').close());
$('#monthly-close').addEventListener('click',()=>$('#monthly-dialog').close());
$('#report-month').addEventListener('change',monthlyReport);
window.addEventListener('mps-state-change',()=>{centerOverview();if($('#monthly-dialog').open)monthlyReport()});
// Extend the existing player chart; all content comes from the linked player's report.
const originalDetail=renderDetail;
renderDetail=function(){
 originalDetail();const p=players.find(x=>x.id===selected);if(!p)return;
 const report=p.report,assessment=$('#detail .assessment-section');
 const mentalPanel=$('#detail .insight-strip.mental');if(mentalPanel)mentalPanel.insertAdjacentHTML('beforeend',centerMentalDetails(p));
 if(assessment){assessment.insertAdjacentHTML('beforeend',`${centerNumericReport(p)}<section class="stage-context"><h3>지금의 몸에서 이해할 점</h3><p>${esc(stageContext[getStage(p)]||stageContext['검사 전'])}</p><small>성장단계 안내와 개인 검사 보완점을 함께 확인하세요.</small></section>${report?`<details class="linked-report"><summary>MPS Report · 검사 상세 보기 <span>${report.source==='import'?'연결된 리포트':'가상 리포트'}</span></summary><div class="report-facts">${[['검사일',displayDate(report.examDate)],['성장단계',report.stage],['신장',report.height?`${report.height} cm`:'미입력'],['체중',report.weight?`${report.weight} kg`:'미입력'],['성장속도',report.velocity?`${report.velocity} cm/년`:'측정 이력 필요'],['검사기관',report.examCenter||'샘플 측정센터']].map(([key,val])=>`<div><small>${key}</small><b>${esc(val)}</b></div>`).join('')}</div>${report.metrics?`<div class="report-facts">${Object.entries(report.metrics).map(([k,v])=>`<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div>`:''}<p class="hint">${report.source==='import'?'고유코드로 연결된 검사 결과':'기능 확인을 위한 가상 데이터'}</p></details>`:''}`)}
 const lessonView=$('#detail .detail-actions');
 if(lessonView)lessonView.insertAdjacentHTML('beforebegin',`<section class="academy-intro"><h3>선수 상담</h3><p>선수의 생각을 먼저 듣고, 코치·보호자와 도움 방법을 정합니다. 체격의 우위나 열세를 기술의 가능성과 같은 뜻으로 읽지 않습니다.</p><label>선수의 바람 / 좋아하는 플레이<input id="development-voice" maxlength="240" value="${esc(p.development?.voice||'')}" placeholder="예: 동료가 공을 편하게 받을 수 있는 패스를 하고 싶어요"></label><label>이번 블록에서 지킬 강점<input id="development-strength" maxlength="160" value="${esc(p.development?.strength||'')}" placeholder="예: 실수 후에도 다시 공을 요청하는 태도"></label><label>보호자와 함께 확인한 내용<textarea id="development-family" maxlength="600" placeholder="훈련·회복·학교생활과 지원 방법">${esc(p.development?.family||'')}</textarea></label><label>다음 선수 / 보호자 리뷰<input id="development-review" type="date" value="${esc(p.development?.reviewDate||'')}"></label><button id="save-development" class="button soft" type="button">면담 기록 저장</button><span id="development-save-state" class="save-state" role="status"></span></section>`);
 const note=$('#detail #save-state');if(note&&p.notes?.length)note.textContent='메모는 날짜별로 저장되어 월간 리포트에 모입니다.';
};
function validDate(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+'T00:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===v}
function validateReport(r){
 if(!r||!validDate(r.examDate)||r.examDate>localDate()||!STAGES.includes(r.stage)||r.stage==='검사 전')throw Error('검사일과 성장단계를 확인하세요.');
 if(r.boneAgeMonths!=null&&(!Number.isInteger(r.boneAgeMonths)||r.boneAgeMonths<0||r.boneAgeMonths>1200))throw Error('뼈나이 개월 값이 올바르지 않습니다.');
 for(const [key,fields] of [['mental',['strengths','needs']],['physical',['focus','recommendations','strengths','needs']]]){
  const obj=r[key];if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error(`${key} 요약이 필요합니다.`);
  for(const f of fields)if(obj[f]!=null&&(!Array.isArray(obj[f])||obj[f].some(x=>typeof x!=='string')))throw Error(`${key}.${f}는 문자열 목록이어야 합니다.`);
 }
 if(typeof r.mental.type!=='string')throw Error('멘탈 유형이 필요합니다.');
 const scores=r.mental.scores;
 if(scores!=null){if(typeof scores!=='object'||Array.isArray(scores))throw Error('멘탈 scores는 지표별 점수 객체여야 합니다.');for(const [key,value] of Object.entries(scores)){if(![...CENTER_MENTAL_CORE,...CENTER_MENTAL_DETAIL].some(([k])=>k===key)||value!==null&&(centerNumber(value)===null||value<1||value>6))throw Error('멘탈 지표는 1~6점 또는 null이어야 합니다.')}}
 const labels=r.mental.labels;
 if(labels!=null){if(typeof labels!=='object'||Array.isArray(labels))throw Error('멘탈 labels는 지표별 표시 객체여야 합니다.');for(const [key,value] of Object.entries(labels)){if(![...CENTER_MENTAL_CORE,...CENTER_MENTAL_DETAIL].some(([k])=>k===key)||!['강점','양호','주의','관찰'].includes(value))throw Error('멘탈 표시값을 확인하세요.')}}
 const measurements=r.physical.measurements;
 if(measurements!=null){if(typeof measurements!=='object'||Array.isArray(measurements))throw Error('피지컬 measurements는 수치 객체여야 합니다.');for(const [key,value] of Object.entries(measurements)){if(!CENTER_PHYSICAL_METRICS.some(([k])=>k===key)||value!==null&&(centerNumber(value)===null||value<0||(key==='ecw'&&value>1)||(key==='bodyFat'&&value>100)))throw Error('피지컬 검사 수치를 확인하세요.')}}
 for(const key of ['height','weight'])if(r[key]!=null&&(centerNumber(r[key])===null||r[key]<0))throw Error('신장과 체중은 0 이상 수치여야 합니다.');
 return {...r,mental:{...r.mental,strengths:r.mental.strengths||[],needs:r.mental.needs||[]},physical:{...r.physical,focus:r.physical.focus||[],recommendations:r.physical.recommendations||[],strengths:r.physical.strengths||[],needs:r.physical.needs||r.physical.focus||[]},source:'import'};
}
document.addEventListener('change',async e=>{
 if(e.target.id!=='mps-import')return;const file=e.target.files[0];if(!file)return;
 try{
  const data=JSON.parse(await file.text()),rows=Array.isArray(data)?data:data.reports;
  if(!Array.isArray(rows)||!rows.length)throw Error('reports 배열이 필요합니다.');
  const seen=new Set();const changes=rows.map(row=>{
   if(seen.has(row.code))throw Error('중복 선수 고유코드가 있습니다.');seen.add(row.code);
   const p=players.find(x=>x.code===row.code);if(!p)throw Error(`센터에 없는 선수 코드: ${row.code}`);
   const r=validateReport(row.report);if(r.examDate<p.dob)throw Error('검사일이 생년월일 이전입니다.');
   if(p.report&&r.examDate<p.report.examDate)throw Error(`${p.name}: 최근 검사보다 이전 결과입니다.`);
   return {p,r};
  });
  const previous=copy(players);changes.forEach(({p,r})=>{if(p.report&&p.report.examDate!==r.examDate)p.previousReport=copy(p.report);p.report=r});
  if(!save()){players=previous;return}render();$('#import-result').textContent=`${changes.length}명의 리포트를 연결했습니다.`;
 }catch(err){$('#import-result').textContent=`가져오기 실패: ${err.message}`}
});
centerOverview();renderDetail();

document.querySelector('#detail').addEventListener('click',e=>{
 if(e.target.id!=='save-development')return;const p=players.find(x=>x.id===selected);if(!p)return;
 p.development={voice:$('#development-voice').value.trim(),strength:$('#development-strength').value.trim(),family:$('#development-family').value.trim(),reviewDate:$('#development-review').value,updatedAt:localDate()};
 (p.developmentHistory??=[]).push(copy(p.development));
 if(save())$('#development-save-state').textContent='선수와 함께 정한 내용을 저장했습니다.';
});
