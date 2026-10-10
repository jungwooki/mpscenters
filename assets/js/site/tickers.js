(function(){
  var F='https://framerusercontent.com/images/';
  // 현장 사진 (롤링)
  var photos=['1jpwi8qGb9LY1Enb8synPCT4To.jpg','w4rmmMJsEOLeDihKPlicKiIrs.jpg','qH5RS0MhiDDX9AjejyqfWgV0QgM.jpg','Hs4nlPNhql31lYEcOnNuwk5udo.jpg','7LVyuAus4qANa1UQkDizrxzLg24.jpg','uww2lJ7dKG3CLY5H5VsJ4SSGM8.jpg','nr3GWCPs8Sm9DmJwDAZ9kbZiIE.jpg'];
  // 팀 로고 (롤링) [파일, 크기(s/l), 원형]
  var logos=[['GqEcLOWEaKsUAis24WUFVM.jpg','s'],['rZLts5y71D0tBDqsf2BHZHlkY.jpg','l'],['JYH64jpHVCoh3jTM9pkhkqr1kc.jpg','s','r'],['eBszhPsQq9ub5z8LA1exQe3wS5c.jpg','l'],['hwoFicIZg8vL9TBcOukuDnQdan0.png','s'],['wBRs03vLpWlLnaBVZqKtuJeQ.png','l'],['0EhoZMgB7qt9Y745LqGUFEglk.png','s']];
  function fill(id,items,make){
    var t=document.getElementById(id),html='';
    for(var k=0;k<2;k++) items.forEach(function(it){html+=make(it,k)});
    t.innerHTML=html;
  }
  fill('photoTrack',photos,function(p,k){return '<img src="'+F+p+'?scale-down-to=1024" alt="'+(k?'':'현장 트레이닝 모습')+'"'+(k?' aria-hidden="true"':'')+' loading="lazy">'});
  fill('logoTrack',logos,function(l,k){return '<img class="'+l[1]+(l[2]?' r':'')+'" src="'+F+l[0]+'?scale-down-to=512" alt=""'+(k?' aria-hidden="true"':'')+' loading="lazy">'});
})();
