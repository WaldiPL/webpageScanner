"use strict";

const extURL=browser.extension.getURL("");

function rqstAdd(url,title,mode,freq,btn=false,icon,bookmarkId=false){
	if(!url)return;
	if(!title)title=url;
	getSettings().then(s=>{
		let xhr=new XMLHttpRequest();
		xhr.open("GET",url);
		xhr.timeout=s.requestTime;
		xhr.overrideMimeType('text/html; charset='+s.charset);
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
				favicon:icon?icon:"https://www.google.com/s2/favicons?domain="+url,
				freq:	freq?freq:8,
				charset:s.charset,
				broken:	0,
				paused:	false
			};
			browser.storage.local.get(['sites','changes','sort']).then(result=>{
				let sites=result.sites,
					changes=result.changes,
					sort=result.sort;
				sites[sites.length]=site;
				changes[changes.length]={
					oldHtml:"",
					html:	html_data
				};
				sort[sort.length]=[`item${sites.length-1}`,"root","item","",false];
				browser.storage.local.set({sites:sites,changes:changes,sort:sort}).then(()=>{
					if(!btn){
						listSite(true);
						statusbar(i18n("addedWebpage",title));
					}else{
						if(bookmarkId!==false)browser.runtime.sendMessage({"nextBookmark":bookmarkId+1});
						browser.runtime.sendMessage({"listSite":true});
					}
				});
			});
			if(btn>1){
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
		let error=function(e){
			if(bookmarkId!==false)browser.runtime.sendMessage({"nextBookmark":bookmarkId+1,"errorBookmark":true});
			if(btn>1){
				browser.notifications.create(`webpagesScannerError`,{
					"type":		"basic",
					"iconUrl":	"icons/warn.svg",
					"title":	i18n("extensionName"),
					"message":	i18n("errorAdding",title)
				});
				setTimeout(()=>{
					browser.notifications.clear(`webpagesScannerError`);
				},5000);
			}else if(!btn)statusbar(i18n("addedWebpageError"));
			console.warn([url,e]);
		};
		xhr.onerror=error;
		xhr.ontimeout=error;
		xhr.send(null);
	});
}

var tempChanges=[],
	tempTimes=[],
	tempBroken=[],
	numberScanned=0,
	count=0;
	
function scanCompleted(sitesLength,auto){
	numberScanned++;
	if(numberScanned===sitesLength||sitesLength===true){
		updateBase(tempChanges,tempTimes,tempBroken);
		if(!auto){
			document.getElementById("scanSites").disabled=false;
			statusbar(i18n("scanCompleted"));
		}
		if(count){
			let audio=new Audio('notification.opus'),
				count2=count;
			getSettings().then(s=>{
				audio.volume=(s.notificationVolume/100);
				audio.play();
				if(s.autoOpen)openSite(`webpagesScanner${auto}`);
				else updateBadge(count2,sitesLength);
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
	tempBroken=[];
	numberScanned=0;
	count=0;
	}
}
	
function scanPage(local,id,auto,sitesLength,extraTime=false){
	getSettings().then(s=>{
		const charset=local.charset?local.charset:s.charset;
		let xhr=new XMLHttpRequest();
		xhr.open("GET",local.url);
		xhr.timeout=extraTime?s.requestTime*2:s.requestTime;
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
					if(this.status>=400)tempBroken[id]=local.broken+1||1;
					if(!auto){
						if(this.status<400)document.getElementById("item"+id).classList.add("scanned");
						else{
							document.getElementById("item"+id).classList.add("warn");
							console.warn([local.url,this.status]);
						}
					}
				}
			}else{
				tempBroken[id]=local.broken+1||1;
				if(!auto)document.getElementById("item"+id).classList.add("error");
				console.warn([local.url,this.status]);
			}
			scanCompleted(sitesLength,auto);
		};
		let error=function(e){
			tempBroken[id]=local.broken+1||1;
			scanCompleted(sitesLength,auto);
			if(!auto)document.getElementById("item"+id).classList.add("error");
			console.warn([local.url,e]);
		};
		let timeout=function(e){
			if(extraTime){
				tempBroken[id]=local.broken+1||1;
				scanCompleted(sitesLength,auto);
				if(!auto)document.getElementById("item"+id).classList.add("error");
				console.warn(["2nd timeout",local.url,e]);
			}else{
				scanPage(local,id,auto,sitesLength,true);
				console.warn(["1st timeout",local.url,e]);
			}
		};
		xhr.onerror=error;
		xhr.ontimeout=timeout;
		try{
			xhr.send(null);
		}catch(e){
			console.warn(e);
		}
	});
}

function scanSites(ev,auto=false,force=false){
	if(!auto){
		document.getElementById("scanSites").disabled=true;
		hideAll();
	}
	browser.storage.local.get('sites').then(result=>{
		const sites=result.sites,
			  len=sites.length;
		sites.forEach((local,ix)=>{
			if(local.changed){
				count++;
				scanCompleted(len,auto);
			}else if((auto&&!force&&deltaTime(local.date,local.time)<local.freq)||local.paused){
				scanCompleted(len,auto);
			}else{
				scanPage(local,ix,auto,len);
			}
		});
	});
}

function deltaTime(oldDate,oldTime){
	const oMonth=Math.trunc(oldDate),
		  oDay=Math.round((oldDate-oMonth)*100),
		  oHour=Math.trunc(oldTime),
		  oMinute=Math.round((oldTime-oHour)*100),
		  year=new Date().getFullYear();
	let delta=Date.now()-Date.parse(`${year}-${oMonth}-${oDay} ${oHour}:${oMinute}`);
		delta=delta>0?delta:Date.now()-Date.parse(`${year-1}-${oMonth}-${oDay} ${oHour}:${oMinute}`);
	return delta/60/60/1000;
}

function updateBase(changesArray,timesArray,brokenArray){
	browser.storage.local.get(['sites','changes']).then(result=>{
		let changes=result.changes,
			sites=result.sites;
		let currentTime={
			date:date(),
			time:time(),
			broken:0
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
				changed:true,
				broken:	0
			};
			sites[id]=Object.assign(sites[id],obj);
		});
		timesArray.forEach((value,id)=>{
			sites[id]=Object.assign(sites[id],currentTime);
		});
		brokenArray.forEach((value,id)=>{
			sites[id]=Object.assign(sites[id],{broken:value});
		});
		browser.storage.local.set({sites:sites,changes:changes});
	});
}

function openSite(ev){
	const auto=(ev==="webpagesScannertrue")?true:false;
	let ixs=[],
		links=[];
	browser.storage.local.get(['sites','settings']).then(result=>{
		const sites=result.sites,
			  settings=result.settings;
		sites.forEach((value,i)=>{
			if(value.changed===true){
				ixs.push(i);
				links.push(`${extURL}view.html?${i}`);
				if(!auto){
					document.getElementById(`item${i}`).classList.remove("changed");
				}
			}
		});
		if(ixs.length){
			if(settings.delay){
				browser.runtime.sendMessage({"openSitesDelay":settings.delay*1,"linksId":ixs,"openWindow":(settings.openWindow&&ixs.length>settings.openWindowMore)}).then(()=>{},()=>{
					delayCurrentId=0;
					delayTime=settings.delay*1;
					delayLinksId=ixs;
					lastWindowId=-1;
					openSitesDelay(settings.openWindow&&ixs.length>settings.openWindowMore);
				});
			}else{
				if(settings.openWindow&&ixs.length>settings.openWindowMore){
					browser.windows.create({
						url: links
					});
				}else{
					links.forEach(value=>{
						browser.tabs.create({
							url:value,
							active:false
						});
					});
				}
			}
			updateBadge();
			unchange(ixs);
		}
	});
}

function unchange(ixo){
	browser.storage.local.get('sites').then(result=>{
		let sites=result.sites;
		ixo.forEach(value=>{
			let obj={
				changed:false
			};
			sites[value]=Object.assign(sites[value],obj);
		});
		browser.storage.local.set({sites});
	});
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
}

function i18n(e,s1){
	return browser.i18n.getMessage(e,s1);
}

function getSettings(name){
	return browser.storage.local.get('settings').then(result=>{
		return name?result.settings[name]:result.settings;
	});
}

function updateBadge(count=0,singleScan){
	if(singleScan===true){
		browser.browserAction.getBadgeText({}).then(e=>{
			let count2=parseInt(e?e:0)+1;
			browser.browserAction.setBadgeText({
				text:count2?count2+"":""
			});
		});
	}else if(count<0){
		browser.browserAction.getBadgeText({}).then(e=>{
			let count2=parseInt(e)-1;
			browser.browserAction.setBadgeText({
				text:count2?count2+"":""
			});
		});
	}else{
		browser.browserAction.setBadgeText({
			text:count?count+"":""
		});
	}
}
