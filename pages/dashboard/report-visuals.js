/* Center report visuals use linked numbers, not inferred scores. */
const CENTER_MENTAL_CORE=[
 ['pressure','경기긴장도','경기 중 긴장에 대응하는 정도'],
 ['support','사회적 도움 활용','동료·지도자의 도움을 요청하고 활용하는 정도'],
 ['preparation','경기 준비 능력','경기 전 준비 행동을 실천하는 정도'],
 ['recovery','실수 후 회복력','실수 후 다음 플레이로 돌아오는 정도'],
 ['control','자기 통제력','감정과 행동을 스스로 조절하는 정도']
];
const CENTER_MENTAL_DETAIL=[
 ['stability','경기 안정성','경기 흐름 속 안정된 수행'],
 ['emotion','경기 중 감정 조절','경기 중 감정 조절'],
 ['independence','외부평가 독립성','외부 평가와 자기 목표를 구분하는 정도'],
 ['learning','자기주도 학습능력','스스로 배우고 수정하는 정도'],
 ['imagery','이미지트레이닝 활용능력','동작과 상황을 마음속으로 연습하는 정도'],
 ['adaptation','주위 적응 및 활용 능력','환경·관계에 적응하고 도움을 활용하는 정도'],
 ['resilience','실패 후 회복력','결과가 아쉬울 때 다시 시도하는 정도'],
 ['attitude','훈련 태도 지수','훈련 참여와 실천 태도']
];
const CENTER_STAGE_REFERENCE={'성장기 이전':'준비기','가속기':'가속기','급성장기':'최고성장기','감속기':'감속기','종료초기':'완성기'};
const CENTER_PHYSICAL_METRICS=[['height','신장','cm',1],['weight','체중','kg',1],['bodyFat','체지방률','%',1],['sdnn','SDNN','ms',1],['rmssd','RMSSD','ms',1],['ecw','ECW/TBW','',3]];
// Explicitly synthetic values for the existing demo roster; never fill imported results.
function centerHydrateSampleNumbers(list){
 const samples=[[4.1,5.2,4.3,4.8,4.2,4.0,4.4,4.8,4.7,4.5,5.1,4.0,5.4],[4.6,4.8,5.2,4.0,4.7,4.5,4.2,4.3,4.8,4.9,4.7,4.1,5.0]];
 const body={'성장기 이전':[145.2,37.4,15.2,72.4,63.1,.381],'가속기':[152.4,42.6,14.8,69.2,58.4,.382],'급성장기':[161.8,50.2,14.0,65.5,54.2,.381],'감속기':[167.4,58.0,14.5,71.3,60.4,.380],'종료초기':[172.2,64.3,16.2,62.5,77.3,.378],'성인':[175.3,68.2,15.8,68.1,65.2,.380]};
 for(const p of list){const seed=initialPlayers.find(x=>x.id===p.id);if(!seed||!p.report||p.report.source==='import'||p.report.examDate!==seed.report.examDate||typeof p.report.mental!=='object'||typeof p.report.physical!=='object')continue;
  const i=initialPlayers.indexOf(seed);p.report.source='sample';
  p.report.mental.scores??=Object.fromEntries([...CENTER_MENTAL_CORE,...CENTER_MENTAL_DETAIL].map(([key],j)=>[key,samples[i%2][j]]));
  const v=body[p.report.stage];if(v){p.report.height??=v[0];p.report.weight??=v[1];p.report.physical.measurements??=Object.fromEntries(CENTER_PHYSICAL_METRICS.map(([key],j)=>[key,v[j]]))}
 }
}
function centerNumber(v){return typeof v==='number'&&Number.isFinite(v)?v:null}
function centerReference(p,kind){const ref=CENTER_BENCHMARKS.stages[CENTER_STAGE_REFERENCE[getStage(p)]];return ref&&ref[kind==='mental'?'mentalN':'physicalN']>=10?ref:null}
function centerRefCaption(p,kind){const ref=CENTER_BENCHMARKS.stages[CENTER_STAGE_REFERENCE[getStage(p)]];return ref?ref[kind==='mental'?'mentalN':'physicalN']>=10?`${getStage(p)} 평균 · ${ref[kind==='mental'?'mentalN':'physicalN']}건`:`${getStage(p)} · 기준선 자료 부족 (${ref[kind==='mental'?'mentalN':'physicalN']}건)`:'성장단계 기준선 미등록'}
function centerBoneAgeLabel(months){if(centerNumber(months)===null||months<0)return '—';const total=Math.round(months);return `${Math.floor(total/12)}년 ${total%12}개월`}
function centerCompare(label,value,mean,max,unit='',digits=1,tone='physical',formatter=null){
 const v=centerNumber(value),m=centerNumber(mean),scale=Math.max(max||1,v||0,m||0),fmt=formatter||((n)=>n.toFixed(digits));
 return `<div class="metric-comparison ${tone}"><div class="metric-heading"><b>${esc(label)}</b><strong>${v===null?'—':fmt(v)}${v===null?'':`<small>${esc(unit)}</small>`}</strong></div><div class="metric-track" aria-hidden="true">${v===null?'':`<i class="metric-fill" style="width:${v/scale*100}%"></i>`}${m===null?'':`<i class="metric-reference" style="left:${m/scale*100}%"></i>`}</div><div class="metric-caption"><span>${v===null?'수치 미연결':'선수 수치'}</span><span>${m===null?'기준선 없음':`단계 평균 ${fmt(m)}${esc(unit)}`}</span></div></div>`;
}
function centerMentalRadar(p){
 const scores=p.report?.mental?.scores||{},ref=centerReference(p,'mental')?.mental;
 const point=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/5,r=92*v/6;return [180+Math.cos(a)*r,145+Math.sin(a)*r]};
 const polygon=values=>values.map((v,i)=>point(i,v).map(n=>n.toFixed(1)).join(',')).join(' ');
 const values=CENTER_MENTAL_CORE.map(([k])=>centerNumber(scores[k]));
 const rings=[1.5,3,4.5,6].map(v=>`<polygon class="radar-ring" points="${polygon(Array(5).fill(v))}"/>`).join('');
 const axes=CENTER_MENTAL_CORE.map(([,label],i)=>{const [x,y]=point(i,6),[tx,ty]=point(i,7.4);return `<line class="radar-axis" x1="180" y1="145" x2="${x}" y2="${y}"/><text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle">${esc(label)}</text>`}).join('');
 const reference=ref&&CENTER_MENTAL_CORE.every(([k])=>centerNumber(ref[k])!==null)?`<polygon class="radar-reference" points="${polygon(CENTER_MENTAL_CORE.map(([k])=>ref[k]))}"/>`:'';
 return `<svg class="center-radar" viewBox="0 0 360 285" role="img" aria-label="${esc(p.name)} 멘탈 5대 요소와 성장단계 평균 비교"><title>${esc(CENTER_MENTAL_CORE.map(([k,l])=>`${l}: ${scores[k]??'미연결'}, 평균: ${ref?.[k]??'없음'}`).join(' / '))}</title>${rings}${axes}${reference}${values.every(v=>v!==null)?`<polygon class="radar-player" points="${polygon(values)}"/>`:'<text x="180" y="145" text-anchor="middle" class="radar-empty">검사 점수 미연결</text>'}</svg>`;
}
function centerTopPercent(p,key){
 const value=centerNumber(p.report?.mental?.scores?.[key]),ref=centerReference(p,'mental'),hist=ref?.mentalDistribution?.[key];
 if(value===null||!hist)return null;
 const n=hist.reduce((sum,[,count])=>sum+count,0);if(n<10)return null;
 const greater=hist.reduce((sum,[score,count])=>sum+(score>value?count:0),0),equal=hist.reduce((sum,[score,count])=>sum+(score===value?count:0),0);
 return {percent:100*(greater+equal/2)/n,n};
}
function centerMentalScoreCard(p,[key,label]){
 const v=centerNumber(p.report?.mental?.scores?.[key]),mean=centerNumber(centerReference(p,'mental')?.mental?.[key]),rank=centerTopPercent(p,key);
 const badge=rank?`상위 ${rank.percent<1?'1% 미만':`${Math.round(rank.percent)}%`}`:'비교자료 없음';
 const status=p.report?.mental?.labels?.[key]||'선수';
 return `<article class="mental-score-card ${status==='주의'?'watch':''}"><div class="mental-card-top"><h5>${esc(label)}</h5></div><div class="mental-card-meta"><strong class="mental-card-score">${v===null?'—':v.toFixed(1)} <small>/ 6</small></strong><span class="mental-percentile ${rank&&rank.percent<=10?'top-ten':''}" title="동일 성장단계 ${rank?.n||0}건 · 동점 중간순위">${badge}</span></div><div class="mental-meter-track" aria-hidden="true">${v===null?'':`<i class="mental-meter-fill" style="width:${v/6*100}%"></i><span class="mental-end-label" style="left:${Math.min(90,Math.max(10,v/6*100))}%">${esc(status)}</span>`}${mean===null?'':`<i class="mental-average-marker" style="left:${mean/6*100}%"></i>`}</div></article>`;
}
function centerMentalDetails(p){
 const cards=items=>items.map(item=>centerMentalScoreCard(p,item)).join('');
 return `<details class="center-mental-details"><summary>멘탈 상세보기 <span>레이다 · 5대 요소 · 8개 세부지표</span></summary><div class="mental-report-header"><h3>멘탈 프로필</h3>${p.report?.source==='import'?'':'<span class="sample-mark">샘플</span>'}</div><p class="chart-legend"><i class="player-dot mental"></i>선수 <i class="reference-dot"></i>성장단계 평균</p>${centerMentalRadar(p)}<p class="chart-source">${esc(centerRefCaption(p,'mental'))} · 1–6점</p><section class="mental-metric-group"><h4>5대 요소</h4><div class="mental-score-grid">${cards(CENTER_MENTAL_CORE)}</div></section><h4 class="mental-detail-title">8개 세부지표</h4><section class="mental-metric-group"><h4>경기 관련 지표</h4><div class="mental-score-grid">${cards(CENTER_MENTAL_DETAIL.slice(0,4))}</div></section><section class="mental-metric-group"><h4>훈련과 적응 관련 지표</h4><div class="mental-score-grid">${cards(CENTER_MENTAL_DETAIL.slice(4))}</div></section><p class="chart-source">상위 %는 같은 성장단계 내 점수 위치 · 동점은 중간순위로 계산합니다. 높은 점수가 항상 좋은 멘탈을 뜻하지 않습니다.</p></details>`;
}
function centerNumericReport(p){
 if(!p.report)return '';
 const r=p.report,ref=centerReference(p,'physical'),values=r.physical?.measurements||{};
 const cards=CENTER_PHYSICAL_METRICS.map(([key,label,unit,digits])=>{const value=centerNumber(key==='height'||key==='weight'?r[key]??values[key]:values[key]);return centerCompare(label,value,ref?.physical?.[key],Math.max(value||0,ref?.physical?.[key]||0,1)*1.25,unit,digits)}).join('');
 return `<section class="center-numeric-report"><div class="mental-report-header"><h3>성장단계 수치 비교</h3>${r.source==='import'?'':'<span class="sample-mark">샘플</span>'}</div><p class="chart-legend"><i class="player-dot"></i>선수 <i class="reference-dot"></i>단계 평균 기준선</p><p class="chart-source">${esc(centerRefCaption(p,'physical'))}</p><div class="numeric-metrics">${centerCompare('골연령',r.boneAgeMonths,ref?.boneMonths,Math.max(r.boneAgeMonths||0,ref?.boneMonths||0,12)*1.25,'',0,'growth',centerBoneAgeLabel)}${cards}</div></section>`;
}
function centerIdpTrend(item,recent){
 if(!recent.length)return '<p class="chart-source">체크 기록이 없습니다.</p>';
 const status={needs_work:1,same:2,good:3},names={needs_work:'지원 필요',same:'진행 중',good:'진전 있음'},count=recent.length;
 const points=recent.map((c,i)=>({x:count===1?180:54+i*260/(count-1),y:148-(status[c.values?.[item.id]]||0)*34,c,status:c.values?.[item.id]}));
 const grids=[1,2,3].map((v,i)=>`<line class="trend-grid" x1="54" y1="${148-v*34}" x2="325" y2="${148-v*34}"/><text x="47" y="${152-v*34}" text-anchor="end">${['지원','진행','진전'][i]}</text>`).join('');
 let segments=[],segment=[];for(const pt of points){if(status[pt.status])segment.push(pt);else{if(segment.length)segments.push(segment);segment=[]}}if(segment.length)segments.push(segment);
 const lines=segments.filter(s=>s.length>1).map(s=>`<path class="trend-line" pathLength="1" d="${s.map((pt,i)=>`${i?'L':'M'}${pt.x},${pt.y}`).join(' ')}"/>`).join('');
 const marks=points.map(pt=>{const title=`${pt.c.date} · ${names[pt.status]||'미기록'}`,w=Math.min(22,210/count);return `${status[pt.status]?`<g class="trend-point" tabindex="0" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><rect class="trend-bar ${esc(pt.status)}" x="${pt.x-w/2}" y="${pt.y}" width="${w}" height="${148-pt.y}" rx="4"/><circle cx="${pt.x}" cy="${pt.y}" r="4" class="trend-dot ${esc(pt.status)}"/></g>`:''}<text x="${pt.x}" y="171" text-anchor="middle" font-size="${count>5?9:11}">${esc(pt.c.date.slice(5).replace('-','.'))}</text>`}).join('');
 return `<svg class="idp-trend-chart" viewBox="0 0 360 190" role="img" aria-label="${esc(item.label)} 최근 관찰 변화"><title>${esc(points.map(pt=>`${pt.c.date}: ${names[pt.status]||'미기록'}`).join(' / '))}</title>${grids}${marks}${lines}</svg><div class="trend-records">${points.map(pt=>`<span>${esc(pt.c.date.slice(5).replace('-','.'))} <b class="${esc(pt.status||'')}">${esc(names[pt.status]||'미기록')}</b></span>`).join('')}</div>`;
}
document.querySelector('#detail').addEventListener('click',e=>{if(!e.target.closest('[data-cycle-report]'))return;document.querySelector('[data-player-tab="lesson"]')?.click();document.querySelector('#detail .assessment-section')?.scrollIntoView({block:'start',behavior:'smooth'})});
