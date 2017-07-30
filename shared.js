function rqstAdd(url,title,mode,freq,btn=false,icon){
	if(!url)return;
	if(!title)title=url;
	let xhr=new XMLHttpRequest();
	xhr.open("GET",url);
	xhr.timeout=10000;
	xhr.overrideMimeType('text/html; charset=utf-8');
	xhr.onload=function(){
		const html_data=this.responseText;
		const site={
			title:	title,
			url:	url,
			date:	date(),
			time:	time(),
			length:	html_data.length,
			md5:	md5(html_data),
			mode:	mode,
			changed:false,
			favicon:icon?icon:"https://icons.better-idea.org/icon?size=16..16..16&url="+url,
			freq:	freq,
			charset:"utf-8"
		};
		browser.storage.local.get(['sites','changes']).then(result=>{
			let sites=result.sites,
				changes=result.changes;
			sites[sites.length]=site;
			changes[changes.length]={
				oldHtml:"",
				html:	html_data
			};
			browser.storage.local.set({sites:sites,changes:changes});
			if(!btn){
				listSite();
				statusbar(i18n("addedWebpage",title));
			}else{
				browser.runtime.sendMessage({"listSite":true});
			}
		});
		if(btn){
			browser.notifications.create(`webpagesScannerAdded`,{
				"type":		"basic",
				"iconUrl":	site.favicon,
				"title":	i18n("extensionName"),
				"message":	i18n("addedWebpage",title)
			});
			setTimeout(()=>{
				browser.notifications.clear(`webpagesScannerAdded`);
			},5000);
		}
	};
	let error=function(){
		if(btn){
			browser.notifications.create(`webpagesScannerError`,{
				"type":		"basic",
				"iconUrl":	"icons/warn.svg",
				"title":	i18n("extensionName"),
				"message":	i18n("errorAdding",title)
			});
			setTimeout(()=>{
				browser.notifications.clear(`webpagesScannerError`);
			},5000);
		}else{
			statusbar(i18n("addedWebpageError"));
		}
	};
	xhr.onerror=error;
	xhr.ontimeout=error;
	xhr.send(null);
}

var tempChanges=[],
	tempTimes=[],
	numberScanned=0,
	count=0;
	
function scanCompleted(sitesLength,auto){
	numberScanned++;
	if(numberScanned===sitesLength||sitesLength===true){
		updateBase(tempChanges,tempTimes);
		if(!auto)statusbar(i18n("scanCompleted"));
		if(count){
			let audio=new Audio('notification.opus'),
				count2=count;
			getSettings().then(s=>{
				audio.volume=(s.notificationVolume/100);
				audio.play();
				if(s.autoOpen)openSite(`webpagesScanner${auto}`);
				if(s.showNotification){
					browser.notifications.create(
						`webpagesScanner${auto}`,{
							"type":		"basic",
							"iconUrl":	"icons/icon.svg",
							"title":	i18n("extensionName"),
							"message":	count2==1?i18n("oneDetected"):i18n("moreDetected",count2)
						}
					).then(()=>{
						if(!s.autoOpen){
							browser.notifications.onClicked.removeListener(openSite);
							browser.notifications.onClicked.addListener(openSite);
						}
					});
					setTimeout(()=>{
						browser.notifications.clear(`webpagesScanner${auto}`);
						if(!s.autoOpen)browser.notifications.onClicked.removeListener(openSite);
					},s.notificationTime);
				}
			});
		}
	tempChanges=[];
	tempTimes=[];
	numberScanned=0;
	count=0;
	}
}
	
function scanPage(local,id,auto,sitesLength){
	const charset=local.charset?local.charset:"uft-8";
	let xhr=new XMLHttpRequest();
	xhr.open("GET",local.url);
	xhr.timeout=10000;
	xhr.overrideMimeType('text/html; charset='+charset);
	xhr.onload=function(){
		if(this.status<405){ //https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
			const html_data=this.responseText;
			const scanned={
				length:	html_data.length,
				md5:	md5(html_data)
			};
			if((local.mode=="m0"&&(local.length<=scanned.length-10||local.length>=scanned.length+10))||(local.mode=="m3"&&(local.length<=scanned.length-50||local.length>=scanned.length+50))||(local.mode=="m4"&&(local.length<=scanned.length-250||local.length>=scanned.length+250))||(local.mode=="m1"&&local.length!=scanned.length)||(local.mode=="m2"&&local.md5!=scanned.md5)){
				if(!auto){
					document.getElementById("item"+id).classList.add("changed","scanned");
				}
				count++;
				tempChanges[id]=[html_data,scanned.md5,scanned.length];
			}else{
				tempTimes[id]=true;
				if(!auto){
					if(this.status<400)document.getElementById("item"+id).classList.add("scanned");
					else document.getElementById("item"+id).classList.add("warn");
				}
			}
		}else{
			if(!auto)document.getElementById("item"+id).classList.add("error");
		}
		scanCompleted(sitesLength,auto);
	};
	let error=function(){
		scanCompleted(sitesLength,auto);
		if(!auto)document.getElementById("item"+id).classList.add("error");
	};
	xhr.onerror=error;
	xhr.ontimeout=error;
	try{
		xhr.send(null);
	}catch(e){
		console.warn(e);
	}
}

function scanSites(ev,auto=false,force=false){
	if(!auto)hideAll();
	browser.storage.local.get('sites').then(result=>{
		const sites=result.sites,
			  len=sites.length;
		sites.forEach((local,ix)=>{
			if(local.changed){
				numberScanned++;
				count++;
				return;
			}
			if(!force&&auto&&((date()==local.date&&time()<local.time+local.freq)||(date()>local.date&&24-local.time+time()<local.freq))){
				numberScanned++;
				return;
			}
			scanPage(local,ix,auto,len);
		});
	});
}

function updateBase(changesArray,timesArray){
	browser.storage.local.get(['sites','changes']).then(result=>{
		let changes=result.changes,
			sites=result.sites;
		let currentTime={
			date:date(),
			time:time()
		};
		changesArray.forEach((value,id)=>{
			changes[id]={
				oldHtml:changes[id].html,
				html:	value[0]
			};
			let obj={
				date:	date(),
				time:	time(),
				length:	value[2],
				md5:	value[1],
				changed:true
			};
			sites[id]=Object.assign(sites[id],obj);
		});
		timesArray.forEach((value,id)=>{
			sites[id]=Object.assign(sites[id],currentTime);
		});
		browser.storage.local.set({sites:sites,changes:changes});
	});
}

function openSite(ev){
	const auto=(ev==="webpagesScannertrue")?true:false;
	let ixs=[];
	browser.storage.local.get('sites').then(result=>{
		const sites=result.sites;
		sites.forEach((value,i)=>{
			if(value.changed===true){
				ixs.push(i);
				browser.tabs.create({
					url:`view.html?${i}`,
					active:false
				});
				if(!auto){
					document.getElementsByTagName("li")[i].classList.remove("changed");
				}
			}
		});
		unchange(ixs);
	});
}

function unchange(ixo){
	browser.storage.local.get('sites').then(result=>{
		let sites=result.sites;
		ixo.forEach(function(value){
			let obj={
				changed:false
			}
			sites[value]=Object.assign(sites[value],obj);
		});
		browser.storage.local.set({sites});
	});
}

function scanLater(x){
	let d=new Date(),
		a=Date.parse(d),
		b=a+x*60*1000;
	browser.alarms.clearAll();
	browser.alarms.create("webpageScanner",{when:b});
}

function time(){
	let d=new Date(),
		h=d.getHours(),
		m=d.getMinutes()/100;
	return h+m;
}

function date(){
	let d=new Date(),
		mo=d.getMonth()+1,
		da=d.getDate()/100; 
	return mo+da;
};

function i18n(e,s1){
	return browser.i18n.getMessage(e,s1);
}

function getSettings(name){
	return browser.storage.local.get('settings').then(result=>{
		return name?result.settings[name]:result.settings;
	});
}
