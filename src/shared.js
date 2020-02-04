"use strict";

const extURL=browser.extension.getURL("");

function rqstAdd(url,title,mode,freq,btn=false,icon,bookmarkId=false,cssSelector=false,ignoreNumbers=false,deleteScripts=true){
	if(!url)return;
	if(!title)title=url;
	getSettings().then(s=>{
		let xhr=new XMLHttpRequest();
		xhr.open("GET",url);
		xhr.timeout=s.requestTime;
		xhr.overrideMimeType('text/html; charset='+s.charset);
		xhr.onload=async function(){
			const result=browser.storage.local.get(['sites','changes','sort']);
			const contentType=this.getResponseHeader("Content-Type").split(/; *charset=/i);
			const html_data=(contentType[0]==="text/plain")?this.responseText.replace(/(\r\n)|\n|\r/g,"<br>"):deleteScripts?this.responseText.replace(/< *script\b[^<]*(?:(?!< *\/ *script *>)<[^<]*)*< *\/[ ]*script *>/gi,""):this.responseText;
			const site={
				title:	title,
				url:	url,
				date:	date(),
				time:	time(),
				mode:	mode,
				changed:false,
				favicon:icon?await favicon64(icon,"original"):await favicon64(url,s.faviconService),
				freq:	freq||8,
				charset:contentType[1]||s.charset,
				broken:	0,
				paused:	false,
				paritialMode:(cssSelector!==false)?true:false,
				cssSelector: (cssSelector!==false)?cssSelector:"",
				mimeType:contentType[0]||"",
				oldTime:undefined,
				newTime:[date(),time()],
				ignoreNumbers:ignoreNumbers,
				deleteScripts:deleteScripts
			};
			Object.assign(site,length_md5(html_data,ignoreNumbers));
			
			const {sites,changes,sort}=await result;			
			sites[sites.length]=site;
			changes[changes.length]={
				oldHtml:"",
				html:	html_data
			};
			sort[sort.length]=[`item${sites.length-1}`,"root","item","",false];
			await browser.storage.local.set({sites,changes,sort});
			if(!btn){
				listSite(true);
				statusbar(i18n("addedWebpage",title));
			}else{
				if(bookmarkId!==false)browser.runtime.sendMessage({"nextBookmark":bookmarkId+1});
				browser.runtime.sendMessage({"listSite":true});
			}
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

var changesArray=[],
	timesArray=[],
	brokenArray=[],
	numberScanned=0,
	count=0;
	
async function scanCompleted(sitesLength,auto){
	numberScanned++;
	if(!auto)statusbar([numberScanned,sitesLength]);
	if(numberScanned===sitesLength||sitesLength===true){
		await updateBase();
		if(!auto){
			document.getElementById("scanSites").disabled=false;
			document.getElementById("openSite").disabled=false;
			document.getElementById("showAdd").disabled=false;
			document.getElementById("addFolder").disabled=false;
			statusbar(i18n("scanCompleted"));
		}
		if(count){
			await getSettings().then(s=>{
				let audio=new Audio(s.notificationSound);
				audio.volume=(s.notificationVolume/100);
				audio.addEventListener("canplay",()=>{
					audio.play();
				});
				if(s.autoOpen)openSite(`webpagesScanner${auto}`);
				updateBadge(false,sitesLength);
				if(s.showNotification){
					browser.notifications.create(
						`webpagesScanner${auto}`,{
							"type":		"basic",
							"iconUrl":	"icons/icon.svg",
							"title":	i18n("extensionName"),
							"message":	count==1?i18n("oneDetected"):i18n("moreDetected",count)
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
		changesArray=[];
		timesArray=[];
		brokenArray=[];
		numberScanned=0;
		count=0;
	}
}

function scanPage(local,id,auto,sitesLength,extraTime=false){
	getSettings().then(s=>{
		const charset=local.charset?local.charset:s.charset;
		const itemId=document.getElementById("item"+id);
		let xhr=new XMLHttpRequest();
		xhr.open("GET",local.url);
		xhr.timeout=extraTime?s.requestTime*2:s.requestTime;
		xhr.overrideMimeType('text/html; charset='+charset);
		xhr.onload=function(){
			if(this.status<405){ //https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
				const html_data=(local.mimeType==="text/plain")?this.responseText.replace(/(\r\n)|\n|\r/g,"<br>"):(local.deleteScripts===true)?this.responseText.replace(/< *script\b[^<]*(?:(?!< *\/ *script *>)<[^<]*)*< *\/[ ]*script *>/gi,""):this.responseText;
				let scanned;
				if(!local.paritialMode||!local.cssSelector){
					scanned=length_md5(html_data,local.ignoreNumbers);
				}else{
					let parser=new DOMParser(),
						doc=parser.parseFromString(html_data,"text/html"),
						selectedElement=doc.querySelector(local.cssSelector);
					if(selectedElement){
						let partHTML=selectedElement.outerHTML;
						scanned=length_md5(partHTML,local.ignoreNumbers);
					}else{
						scanned=length_md5(html_data,local.ignoreNumbers);
					}
				}
				
				if((local.mode==="m0"&&(Math.abs(local.length-scanned.length)>=10))||(local.mode==="m3"&&(Math.abs(local.length-scanned.length)>=50))||(local.mode==="m4"&&(Math.abs(local.length-scanned.length)>=250))||(local.mode==="m1"&&local.length!==scanned.length)||(local.mode==="m2"&&local.md5!==scanned.md5)){
					if(!auto){
						itemId.classList.add("changed","scanned");
						itemId.parentElement.classList.add("changedFolder");
					}
					count++;
					if(typeof local.deleteScripts==="undefined"){
						const htmlWithoutScripts=html_data.replace(/< *script\b[^<]*(?:(?!< *\/ *script *>)<[^<]*)*< *\/[ ]*script *>/gi,"");
						scanned=length_md5(htmlWithoutScripts,local.ignoreNumbers);
						changesArray[id]=[htmlWithoutScripts,scanned.md5,scanned.length];
					}else{
						changesArray[id]=[html_data,scanned.md5,scanned.length];
					}
				}else{
					timesArray[id]=true;
					if(this.status>=400)brokenArray[id]=local.broken+1||1;
					if(!auto){
						if(this.status<400)itemId.classList.add("scanned");
						else{
							itemId.classList.add("warn");
							itemId.parentElement.classList.add("errorFolder");
							console.warn([local.url,this.status]);
						}
					}
				}
			}else{
				brokenArray[id]=local.broken+1||1;
				if(!auto){
					itemId.classList.add("error");
					itemId.parentElement.classList.add("errorFolder");
				}
				console.warn([local.url,this.status]);
			}
			scanCompleted(sitesLength,auto);
		};
		let error=function(e){
			brokenArray[id]=local.broken+1||1;
			scanCompleted(sitesLength,auto);
			if(!auto)itemId.classList.add("error");
			console.warn([local.url,e]);
		};
		let timeout=function(e){
			if(extraTime){
				brokenArray[id]=local.broken+1||1;
				scanCompleted(sitesLength,auto);
				if(!auto)itemId.classList.add("error");
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
		document.getElementById("openSite").disabled=true;
		document.getElementById("showAdd").disabled=true;
		document.getElementById("addFolder").disabled=true;
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


async function updateBase(){
	const {sites,changes}=await browser.storage.local.get(['sites','changes']);
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
			broken:	0,
			oldTime:sites[id].newTime||[sites[id].date,sites[id].time],
			newTime:[date(),time()]
		};
		Object.assign(sites[id],obj);
		if(typeof sites[id].deleteScripts==="undefined"){
			Object.assign(sites[id],{deleteScripts:true});
		}
	});
	timesArray.forEach((value,id)=>{
		Object.assign(sites[id],currentTime);
	});
	brokenArray.forEach((value,id)=>{
		Object.assign(sites[id],{broken:value});
	});
	await browser.storage.local.set({sites,changes});
}

function openSite(ev){
	const auto=(ev==="webpagesScannertrue");
	let ixs=[],
		links=[];
	browser.storage.local.get(['sites','settings']).then(result=>{
		const sites=result.sites,
			  settings=result.settings;
		sites.forEach((value,i)=>{
			if(value.changed===true){
				ixs.push(i);
				links.push(`${extURL}view.html?${i}`);
			}
		});
		if(ixs.length){
			if(settings.delay){
				try{
					delayCurrentId=0;
					delayTime=settings.delay*1;
					delayLinksId=ixs;
					lastWindowId=-1;
					openSitesDelay(settings.openWindow&&ixs.length>settings.openWindowMore);
				}catch(error){
					browser.runtime.sendMessage({"openSitesDelay":settings.delay*1,"linksId":ixs,"openWindow":(settings.openWindow&&ixs.length>settings.openWindowMore)});
				}
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
				updateBadge();
				unchange(ixs);
				if(!auto){
					unchangeItem(true);
				}
			}
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
			Object.assign(sites[value],obj);
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

function updateBadge(minus,singleScan){
	if(singleScan===true){
		browser.browserAction.getBadgeText({}).then(e=>{
			let count2=parseInt(e?e:0)+1;
			browser.browserAction.setBadgeText({
				text:count2+""
			});
			updateTooltip(true);
		});
	}else if(minus){
		browser.browserAction.getBadgeText({}).then(e=>{
			let count2=parseInt(e)-1;
			browser.browserAction.setBadgeText({
				text:count2?count2+"":""
			});
			updateTooltip(count2);
		});
	}else{
		if(count){
			browser.storage.local.get("sites").then(({sites})=>{
				let i=0;
				sites.forEach(e=>{
					if(e.changed)i++;
				});
				browser.browserAction.setBadgeText({
					text:i+""
				});
			});
			updateTooltip(true);
		}else{
			browser.browserAction.setBadgeText({
				text:""
			});
			updateTooltip();
		}
	}
}

async function updateTooltip(alarm){
	if(alarm){
		const activeAlarm=browser.alarms.get("openSitesDelay");
		browser.browserAction.setTitle({title: i18n("extensionName")+i18n("tooltipOpenPages")});
		if(await activeAlarm){
			browser.browserAction.setTitle({title: i18n("extensionName")+i18n("tooltipStopOpening")});
		}
	}else{
		browser.browserAction.setTitle({title:i18n("extensionName")});
	}
}

function length_md5(html,ignoreNumbers){
	const htmlNumber=ignoreNumbers?html.replace(/\d+/g,''):html;
	return {length:htmlNumber.length,md5:md5(htmlNumber)};
}
