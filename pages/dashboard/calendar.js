const BOOKING_KEY = 'mps-centers2-bookings-v1';

const calendarDialog = document.querySelector('#calendar-dialog');
const bookingForm = document.querySelector('#booking-form');
const todaySeoul = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function addDays(date, count){const d=new Date(`${date}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10)}
const sampleBookings = () => [
  {id:'sample-1',playerId:'demo-1',date:todaySeoul(),time:'16:00',type:'레슨',memo:'첫 터치 관찰'},
  {id:'sample-2',playerId:'demo-2',date:addDays(todaySeoul(),3),time:'17:30',type:'상담',memo:'다음 목표 점검'}
];
function readBookings(){try{const snapshot=JSON.parse(localStorage.getItem(STATE_KEY)||'{}');const data=snapshot.bookings||JSON.parse(localStorage.getItem(BOOKING_KEY));return Array.isArray(data)?data:sampleBookings()}catch{return sampleBookings()}}
function saveBookings(){try{localStorage.setItem(STATE_KEY,JSON.stringify({players,bookings}));window.dispatchEvent(new Event('mps-state-change'));return true}catch{alert('저장하지 못했습니다. 다시 시도해 주세요.');return false}}
function readPlayers(){return players}
function transitionBooking(id,status){
 const b=bookings.find(x=>x.id===id),p=players.find(x=>x.id===b?.playerId);
 if(!b||!p||b.status===status)return false;
 if(status==='completed'&&b.date>todaySeoul()){alert('미래 예약은 완료할 수 없습니다.');return false}
 if(status==='completed'&&b.type==='레슨'&&p.used>=p.paid){alert(`${p.name}: 남은 회차가 없습니다. 회차를 추가한 뒤 완료하세요.`);return false}
 const beforePlayers=copy(players),beforeBookings=copy(bookings);
 if(b.status==='completed'&&b.type==='레슨'){
  const linked=p.lessonHistory?.find(x=>x.bookingId===id);
  if(linked){p.used=Math.max(0,p.used-1);p.lessonHistory=p.lessonHistory.filter(x=>x.bookingId!==id)}
 }
 b.status=status;
 if(status==='completed'){
  b.completedAt=todaySeoul();
  if(b.type==='레슨'){p.used++;(p.lessonHistory??=[]).push({bookingId:id,date:b.date,focus:p.todayFocus||'',goal:p.goal||'',memo:b.memo||''})}
 }else delete b.completedAt;
 if(!saveBookings()){players=beforePlayers;bookings=beforeBookings;return false}
 render();renderCalendar();return true;
}
window.mpsTransitionBooking=transitionBooking;
const escapeCalendar = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let calendarPlayerId='';let returnPlayerId=null;
let bookings=readBookings();let selectedDate=todaySeoul();let viewMonth=selectedDate.slice(0,7);
function playerName(id){return readPlayers().find(p=>p.id===id)?.name||'삭제된 선수'}
function googleCalendarUrl(booking){
  const [hour,minute]=booking.time.split(':').map(Number),endMinutes=hour*60+minute+60;
  const endDate=addDays(booking.date,Math.floor(endMinutes/1440));
  const endTime=`${String(Math.floor(endMinutes%1440/60)).padStart(2,'0')}${String(endMinutes%60).padStart(2,'0')}00`;
  const start=`${booking.date.replaceAll('-','')}T${booking.time.replace(':','')}00`;
  const end=`${endDate.replaceAll('-','')}T${endTime}`;
  const url=new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action','TEMPLATE');url.searchParams.set('text',`MPS ${booking.type} · ${playerName(booking.playerId)}`);
  url.searchParams.set('dates',`${start}/${end}`);url.searchParams.set('ctz','Asia/Seoul');
  url.searchParams.set('details','MPS Center 예약 샘플');
  return url.toString();
}
function renderBookingSessionSummary(){
 const p=readPlayers().find(player=>player.id===bookingForm.elements.playerId.value);
 document.querySelector('#booking-session-summary').textContent=p?`총 ${p.paid}회 · 진행 ${p.used}회 · 남은 ${Math.max(0,p.paid-p.used)}회`:'선수를 선택하면 회차가 표시됩니다.';
}
function renderPlayerOptions(selected=''){
  const players=[...readPlayers()].sort(playerNameOrder);
  document.querySelector('#booking-player').innerHTML='<option value="">선수 선택</option>'+players.map(p=>`<option value="${escapeCalendar(p.id)}" ${p.id===selected?'selected':''}>${escapeCalendar(p.name)} · ${escapeCalendar(p.group||'반 미정')} · 남은 ${Math.max(0,p.paid-p.used)}회</option>`).join('');
}
function clearBookingForm(){bookingForm.reset();bookingForm.elements.bookingId.value='';bookingForm.elements.date.value=selectedDate;bookingForm.elements.time.value='16:00';document.querySelector('#booking-submit').textContent='예약 추가';document.querySelector('#booking-cancel').hidden=true;renderPlayerOptions(calendarPlayerId);bookingForm.elements.playerId.value=calendarPlayerId}
function renderCalendar(){
  renderPlayerOptions(bookingForm.elements.playerId.value);renderBookingSessionSummary();
  const [year,month]=viewMonth.split('-').map(Number);
  document.querySelector('#month-label').textContent=`${year}년 ${month}월`;
  document.querySelector('#selected-date-label').textContent=`${selectedDate.replaceAll('-','.')} 예약`;
  const first=new Date(Date.UTC(year,month-1,1)).getUTCDay();
  const days=new Date(Date.UTC(year,month,0)).getUTCDate();
  const counts=new Map();for(const b of bookings)counts.set(b.date,(counts.get(b.date)||0)+1);
  let html=Array.from({length:first},()=>'<span class="blank" aria-hidden="true"></span>').join('');
  for(let day=1;day<=days;day++){
    const date=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const count=counts.get(date)||0;
    html+=`<button type="button" data-date="${date}" class="${date===selectedDate?'selected ':''}${date===todaySeoul()?'today ':''}${count?'has-bookings':''}" aria-label="${month}월 ${day}일, 예약 ${count}건" aria-pressed="${date===selectedDate}">${day}${count?`<small>${count}건</small>`:''}</button>`;
  }
  document.querySelector('#day-grid').innerHTML=html;
  const dayBookings=bookings.filter(b=>b.date===selectedDate).sort((a,b)=>a.time.localeCompare(b.time));
  document.querySelector('#booking-list').innerHTML=dayBookings.length?dayBookings.map(b=>`<div class="booking-row"><div><b>${escapeCalendar(b.time)} · ${escapeCalendar(playerName(b.playerId))}</b><span> ${escapeCalendar(b.type)} · ${b.status==='completed'?'완료':b.status==='cancelled'?'취소':b.status==='no_show'?'미방문':'예약'}</span></div><div class="booking-actions">${b.status==='completed'?`<button type="button" data-status="scheduled" data-booking="${escapeCalendar(b.id)}">완료 취소 · 복원</button>`:`<button type="button" data-status="completed" data-booking="${escapeCalendar(b.id)}" ${b.date>todaySeoul()?'disabled':''}>완료${b.type==='레슨'?' · 1회 차감':''}</button><button type="button" data-status="no_show" data-booking="${escapeCalendar(b.id)}">미방문</button><button type="button" data-status="cancelled" data-booking="${escapeCalendar(b.id)}">예약 취소</button>`}<button type="button" ${b.status==='completed'?'disabled':''} data-edit="${escapeCalendar(b.id)}" aria-label="예약 수정">수정</button><button type="button" ${b.status==='completed'?'disabled':''} data-delete="${escapeCalendar(b.id)}" aria-label="예약 삭제">삭제</button></div>${b.memo?`<small>${escapeCalendar(b.memo)}</small>`:''}<a class="google-event" href="${escapeCalendar(googleCalendarUrl(b))}" target="_blank" rel="noopener noreferrer">Google에 추가 ↗</a></div>`).join(''):'<p class="empty">이날 예약이 없습니다.</p>';
  document.querySelector('#upcoming-count').textContent=bookings.filter(b=>b.date>=todaySeoul()&&(!b.status||b.status==='scheduled')).length;
}
document.querySelector('#calendar-open').addEventListener('click',()=>{calendarPlayerId='';returnPlayerId=null;selectedDate=todaySeoul();viewMonth=selectedDate.slice(0,7);clearBookingForm();renderCalendar();calendarDialog.showModal()});
window.mpsCalendarOpenForPlayer = playerId => {calendarPlayerId=playerId;returnPlayerId=playerId;selectedDate=todaySeoul();viewMonth=selectedDate.slice(0,7);clearBookingForm();bookingForm.elements.playerId.value=playerId;renderCalendar();calendarDialog.showModal()};
document.querySelector('#calendar-close').addEventListener('click',()=>calendarDialog.close());
calendarDialog.addEventListener('click',event=>{if(event.target===calendarDialog)calendarDialog.close()});
calendarDialog.addEventListener('close',()=>{const playerId=returnPlayerId;returnPlayerId=null;if(playerId)window.mpsReturnToPlayer?.(playerId)});
document.querySelector('#booking-player').addEventListener('change',event=>{calendarPlayerId=event.target.value;renderBookingSessionSummary()});
function moveMonth(delta){const [y,m]=viewMonth.split('-').map(Number);const d=new Date(Date.UTC(y,m-1+delta,1));viewMonth=d.toISOString().slice(0,7);selectedDate=`${viewMonth}-01`;clearBookingForm();renderCalendar()}
document.querySelector('#month-prev').addEventListener('click',()=>moveMonth(-1));
document.querySelector('#month-next').addEventListener('click',()=>moveMonth(1));
document.querySelector('#day-grid').addEventListener('click',e=>{const day=e.target.closest('[data-date]');if(!day)return;selectedDate=day.dataset.date;clearBookingForm();renderCalendar()});
document.querySelector('#booking-list').addEventListener('click',e=>{
  const status=e.target.closest('[data-status]');if(status){transitionBooking(status.dataset.booking,status.dataset.status);return}
  const edit=e.target.closest('[data-edit]');const remove=e.target.closest('[data-delete]');
  if(edit){const b=bookings.find(x=>x.id===edit.dataset.edit);if(!b||b.status==='completed')return;renderPlayerOptions(b.playerId);bookingForm.elements.bookingId.value=b.id;bookingForm.elements.playerId.value=b.playerId;renderBookingSessionSummary();bookingForm.elements.date.value=b.date;bookingForm.elements.time.value=b.time;bookingForm.elements.type.value=b.type;bookingForm.elements.memo.value=b.memo;document.querySelector('#booking-submit').textContent='수정 저장';document.querySelector('#booking-cancel').hidden=false;bookingForm.elements.playerId.focus()}
  if(remove){const b=bookings.find(x=>x.id===remove.dataset.delete);if(b&&b.status!=='completed'&&confirm(`${b.date} ${b.time} 예약을 삭제할까요?`)){bookings=bookings.filter(x=>x.id!==b.id);saveBookings();clearBookingForm();renderCalendar()}}
});
document.querySelector('#booking-cancel').addEventListener('click',clearBookingForm);
bookingForm.addEventListener('submit',e=>{
  e.preventDefault();const data=new FormData(bookingForm);const playerId=String(data.get('playerId')||'');const date=String(data.get('date')||'');const time=String(data.get('time')||'');
  if(!readPlayers().some(p=>p.id===playerId)||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time)){alert('선수, 날짜, 시간을 확인해 주세요.');return}
  const booking={id:String(data.get('bookingId')||`booking-${Date.now()}`),playerId,date,time,type:String(data.get('type')||'레슨'),memo:String(data.get('memo')||'').trim().slice(0,100)};
  const index=bookings.findIndex(x=>x.id===booking.id);if(index>=0){if(bookings[index].status==='completed'){alert('완료 취소 후 수정하세요.');return}booking.status=bookings[index].status;bookings[index]=booking}else{booking.status='scheduled';bookings.push(booking)}
  saveBookings();calendarPlayerId=playerId;selectedDate=date;viewMonth=date.slice(0,7);clearBookingForm();renderCalendar();
});
window.addEventListener('mps-demo-reset',()=>{bookings=sampleBookings();saveBookings();renderCalendar()});
window.addEventListener('mps-player-deleted',e=>{bookings=bookings.filter(b=>b.playerId!==e.detail.id);saveBookings();renderCalendar()});
renderCalendar();

document.querySelector('#complete-day').addEventListener('click',()=>{
 const pending=bookings.filter(b=>b.date===selectedDate&&b.type==='레슨'&&(!b.status||b.status==='scheduled'));
 if(!pending.length){alert('완료할 레슨 예약이 없습니다.');return}
 if(selectedDate>todaySeoul()){alert('미래 예약은 완료할 수 없습니다.');return}
 if(confirm(`${selectedDate}의 레슨 ${pending.length}건을 완료할까요? 실제 방문한 예약인지 확인하세요.`))pending.forEach(b=>transitionBooking(b.id,'completed'));
});

window.addEventListener('mps-state-change',()=>{renderPlayerOptions(bookingForm.elements.playerId.value);renderBookingSessionSummary()});
