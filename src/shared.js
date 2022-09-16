"use strict";

const extURL=browser.runtime.getURL("");
let duplicates=[];

function rqstAdd(url,title,icon=false,mode,freq,bookmarkId=false,cssSelector=false,ignoreNumbers,deleteScripts,deleteComments,ignoreHrefs,charset,pageSettings,ignoreStyles,ignoreAllAttributes,saveOnlyPart,folder="root"){
	if(!url)return;
	if(!title)title=url;
	getSettings().then(s=>{
		if(ignoreNumbers===undefined){
			ignoreNumbers=s.defaultIgnoreNumbers;
		}
		if(deleteScripts===undefined){
			deleteScripts=s.defaultDeleteScripts;
		}
		if(deleteComments===undefined){
			deleteComments=s.defaultDeleteComments;
		}
		if(ignoreHrefs===undefined){
			ignoreHrefs=s.defaultIgnoreHrefs;
		}
		if(ignoreStyles===undefined){
			ignoreStyles=s.defaultIgnoreStyles;
		}
		if(ignoreAllAttributes===undefined){
			ignoreAllAttributes=s.defaultIgnoreAllAttributes;
		}
		if(charset===undefined){
			charset=s.charset;
		}
		let xhr=new XMLHttpRequest();
		xhr.open("GET",url);
		xhr.timeout=s.requestTime;
		xhr.overrideMimeType('text/html; charset='+charset);
		xhr.onload=async function(){
			const result=browser.storage.local.get(['sites','sort']);
			const contentType=this.getResponseHeader("Content-Type").split(/; *charset=/i);

			let html_data=this.responseText;
			if(contentType[0]==="text/plain"){
				html_data=html_data.replace(/(\r\n)|\n|\r/g,"<br>");
			}else{
				if(deleteScripts===true){
					html_data=html_data.replace(/< *script\b[^<]*(?:(?!< *\/ *script *>)<[^<]*)*< *\/[ ]*script *>/gi,"");
				}
				if(deleteComments===true){
					html_data=html_data.replace(/<!--(?!\s*(?:\[if [^\]]+]|<!|>))(?:(?!-->)(.|\n))*-->/gi,"");
				}
			}
			const site={
				title:	title,
				url:	url,
				date:	date(),
				time:	time(),
				mode:	mode||s.defaultMode,
				changed:false,
				favicon:icon?await favicon64(icon,"original"):await favicon64(url,s.faviconService),
				freq:	freq||s.defaultFreq,
				charset:contentType[1]||charset,
				broken:	0,
				paused:	false,
				paritialMode:(cssSelector!==false)?true:false,
				cssSelector: (cssSelector!==false)?cssSelector:"",
				mimeType:contentType[0]||"",
				oldTime:undefined,
				newTime:[date(),time()],
				ignoreNumbers:ignoreNumbers,
				deleteScripts:deleteScripts,
				deleteComments:deleteComments,
				ignoreHrefs:ignoreHrefs,
				ignoreStyles:ignoreStyles,
				ignoreAllAttributes:ignoreAllAttributes,
				saveOnlyPart:saveOnlyPart,
				uniq:uniqueId(),
			};
			Object.assign(site,{settings:pageSettings});

			if(cssSelector===false){
				Object.assign(site,length_md5(html_data,ignoreNumbers,ignoreHrefs,ignoreStyles,ignoreAllAttributes));
			}else{
				let parser=new DOMParser(),
					doc=parser.parseFromString(this.responseText,"text/html"),
					selectedElement=doc.querySelector(cssSelector);
				if(selectedElement){
					let partHTML=selectedElement.outerHTML;
					if(deleteScripts===true){
						partHTML=partHTML.replace(/< *script\b[^<]*(?:(?!< *\/ *script *>)<[^<]*)*< *\/[ ]*script *>/gi,"");
					}
					if(deleteComments===true){
						partHTML=partHTML.replace(/<!--(?!\s*(?:\[if [^\]]+]|<!|>))(?:(?!-->)(.|\n))*-->/gi,"");
					}
					Object.assign(site,length_md5(partHTML,ignoreNumbers,ignoreHrefs,ignoreStyles,ignoreAllAttributes));
					if(saveOnlyPart){
						html_data=partHTML;
					}
				}else{
					browser.notifications.create(`webpagesScannerWarningPart`,{
						"type":		"basic",
						"iconUrl":	"icons/warn.svg",
						"title":	i18n("extensionName"),
						"message":	i18n("warningPart")
					});
					Object.assign(site,length_md5(html_data,ignoreNumbers,ignoreHrefs,ignoreStyles,ignoreAllAttributes));
				}
			}

			const {sites,sort}=await result;
			sites[sites.length]=site;
			const changes={
				uniq:site.uniq,
				oldHtml:"",
				html:html_data
			};
			await setChanges(changes);
			const newSort=[`item${sites.length-1}`,folder,"item","",false];
			if(folder==="root"){
				sort.push(newSort);
			}else{
				const spliceIndex=sort.findIndex(e=>{
					return e[0]===folder;
				})+1;
				sort.splice(spliceIndex,0,newSort);
			}
			await browser.storage.local.set({sites,sort});
			browser.runtime.sendMessage({
				"statusbar":true,
				"statusbarArg":i18n("addedWebpage",title),
				"listSite":true
			}).then(()=>{},err=>{
				console.warn(err);
			});
			if(bookmarkId!==false){
				browser.runtime.sendMessage({"nextBookmark":bookmarkId+1}).then(()=>{},err=>{console.warn(err);});
			}else{
				browser.notifications.create(`webpagesScannerAdded`,{
					"type":		"basic",
					"iconUrl":	site.favicon,
					"title":	i18n("extensionName"),
					"message":	i18n("addedWebpage",title)
				});

				duplicates=[];
				sites.forEach((v,i)=>{
					if(v.url===url){
						duplicates.push(i);
					}
				});
				if(duplicates.length>1){
					browser.notifications.create(`webpagesScannerDuplicates`,{
						"type":		"basic",
						"iconUrl":	"icons/icon.svg",
						"title":	i18n("foundDuplicate"),
						"message":	i18n("duplicateMessage",title.substring(0,35))
					});
				}
				setTimeout(()=>{
					browser.notifications.clear(`webpagesScannerAdded`);
					browser.notifications.clear(`webpagesScannerDuplicates`);
					browser.notifications.clear(`webpagesScannerWarningPart`);
				},s.notificationTime);
			}
		};
		let error=function(e){
			if(bookmarkId!==false){
				browser.runtime.sendMessage({
					"nextBookmark":bookmarkId+1,
					"errorBookmark":true
				}).then(()=>{},err=>{
					console.warn(err);
				});
			}else{
				browser.notifications.create(`webpagesScannerError`,{
					"type":		"basic",
					"iconUrl":	"icons/warn.svg",
					"title":	i18n("extensionName"),
					"message":	i18n("errorAdding",title)
				});
				setTimeout(()=>{
					browser.notifications.clear(`webpagesScannerError`);
				},s.notificationTime);
				browser.runtime.sendMessage({
					"statusbar":true,
					"statusbarArg":i18n("addedWebpageError")
				}).then(()=>{},err=>{
					console.warn(err);
				});
			}
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
	
async function scanCompleted(sitesLength){
	numberScanned++;
	browser.runtime.sendMessage({
		"statusbar":true,
		"statusbarArg":[numberScanned,sitesLength]
	}).then(()=>{},err=>{
		console.warn(err);
	});
	if(numberScanned===sitesLength){
		await updateBase();
		browser.runtime.sendMessage({
			"statusbar":true,
			"statusbarArg":i18n("scanCompleted"),
			"enableButtons":true
		}).then(()=>{},err=>{
			console.warn(err);
		});
		if(count){
			await getSettings().then(s=>{
				let audio=new Audio(s.notificationSound);
				audio.volume=(s.notificationVolume/100);
				audio.addEventListener("canplay",()=>{
					audio.play();
				});
				if(s.autoOpen)openSite();
				updateBadge(false,sitesLength);
				if(s.showNotification){
					browser.notifications.create(
						`webpagesScannerScanned`,{
							"type":		"basic",
							"iconUrl":	"icons/icon.svg",
							"title":	i18n("extensionName"),
							"message":	count==1?i18n("oneDetected"):i18n("moreDetected",count)
						}
					);
					setTimeout(()=>{
						browser.notifications.clear(`webpagesScannerScanned`);
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

function scanPage(local,id,sitesLength,extraTime=false){
	getSettings().then(s=>{
		const charset=local.charset?local.charset:s.charset;
		let xhr=new XMLHttpRequest();
		xhr.open("GET",local.url);
		xhr.timeout=extraTime?s.requestTime*2:s.requestTime;
		xhr.overrideMimeType('text/html; charset='+charset);
		xhr.onload=function(){
			if(this.status<405){ //https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
				let html_data=this.responseText;
				if(local.mimeType==="text/plain"){
					html_data=html_data.replace(/(\r\n)|\n|\r/g,"<br>");
				}else{
					if(local.deleteScripts===true){
						html_data=html_data.replace(/< *script\b[^<]*(?:(?!< *\/ *script *>)<[^<]*)*< *\/[ ]*script *>/gi,"");
					}
					if(local.deleteComments===true){
						html_data=html_data.replace(/<!--(?!\s*(?:\[if [^\]]+]|<!|>))(?:(?!-->)(.|\n))*-->/gi,"");
					}
				}

				if(typeof local.ignoreHrefs==="undefined"){
					Object.assign(local,{ignoreHrefs:s.defaultIgnoreHrefs});
				}

				let scanned;
				if(!local.paritialMode||!local.cssSelector){
					scanned=length_md5(html_data,local.ignoreNumbers,local.ignoreHrefs,local.ignoreStyles,local.ignoreAllAttributes);
				}else{
					let parser=new DOMParser(),
						doc=parser.parseFromString(this.responseText,"text/html"),
						selectedElement=doc.querySelector(local.cssSelector);
					if(selectedElement){
						let partHTML=selectedElement.outerHTML;
						if(local.deleteScripts===true){
							partHTML=partHTML.replace(/< *script\b[^<]*(?:(?!< *\/ *script *>)<[^<]*)*< *\/[ ]*script *>/gi,"");
						}
						if(local.deleteComments===true){
							partHTML=partHTML.replace(/<!--(?!\s*(?:\[if [^\]]+]|<!|>))(?:(?!-->)(.|\n))*-->/gi,"");
						}
						scanned=length_md5(partHTML,local.ignoreNumbers,local.ignoreHrefs,local.ignoreStyles,local.ignoreAllAttributes);
						if(local.saveOnlyPart){
							html_data=partHTML;
						}
					}else{
						if(local.saveOnlyPart){
							error(i18n("warningPart")+": "+local.cssSelector);
							throw i18n("warningPart");
						}
						scanned=length_md5(html_data,local.ignoreNumbers,local.ignoreHrefs,local.ignoreStyles,local.ignoreAllAttributes);
					}
				}

				if((local.mode==="m0"&&(Math.abs(local.length-scanned.length)>=10))||(local.mode==="m3"&&(Math.abs(local.length-scanned.length)>=50))||(local.mode==="m4"&&(Math.abs(local.length-scanned.length)>=250))||(local.mode==="m1"&&local.length!==scanned.length)||(local.mode==="m2"&&local.md5!==scanned.md5)){
					browser.runtime.sendMessage({
						"addClass":true,
						"elementId":"item"+id,
						"classList":["changed","scanned"]
					}).then(()=>{},err=>{
						console.warn(err);
					});
					browser.runtime.sendMessage({
						"addClass":true,
						"elementId":"item"+id,
						"classList":["changedFolder"],
						"parentElement":true
					}).then(()=>{},err=>{
						console.warn(err);
					});
					count++;
					if(typeof local.deleteScripts==="undefined"||typeof local.deleteComments==="undefined"){
						let htmlReplaced=html_data;
						if(typeof local.deleteScripts==="undefined"&&s.defaultDeleteScripts===true){
							htmlReplaced=htmlReplaced.replace(/< *script\b[^<]*(?:(?!< *\/ *script *>)<[^<]*)*< *\/[ ]*script *>/gi,"");
						}
						if(typeof local.deleteComments==="undefined"&&s.defaultDeleteComments===true){
							htmlReplaced=htmlReplaced.replace(/<!--(?!\s*(?:\[if [^\]]+]|<!|>))(?:(?!-->)(.|\n))*-->/gi,"");
						}
						scanned=length_md5(htmlReplaced,local.ignoreNumbers,local.ignoreHrefs,local.ignoreStyles,local.ignoreAllAttributes);
						changesArray[id]=[htmlReplaced,scanned.md5,scanned.length,local.uniq];
					}else{
						changesArray[id]=[html_data,scanned.md5,scanned.length,local.uniq];
					}
				}else{
					timesArray[id]=true;
					if(this.status<400){
						browser.runtime.sendMessage({
							"addClass":true,
							"elementId":"item"+id,
							"classList":["scanned"]
						}).then(()=>{},err=>{
							console.warn(err);
						});
					}else{
						brokenArray[id]=local.broken+1||1;
						browser.runtime.sendMessage({
							"addClass":true,
							"elementId":"item"+id,
							"classList":["warn"]
						}).then(()=>{},err=>{
							console.warn(err);
						});
						browser.runtime.sendMessage({
							"addClass":true,
							"elementId":"item"+id,
							"classList":["errorFolder"],
							"parentElement":true
						}).then(()=>{},err=>{
							console.warn(err);
						});
						console.warn([local.url,this.status]);
					}
				}
			}else{
				brokenArray[id]=local.broken+1||1;
				browser.runtime.sendMessage({
					"addClass":true,
					"elementId":"item"+id,
					"classList":["error"]
				}).then(()=>{},err=>{
					console.warn(err);
				});
				browser.runtime.sendMessage({
					"addClass":true,
					"elementId":"item"+id,
					"classList":["errorFolder"],
					"parentElement":true
				}).then(()=>{},err=>{
					console.warn(err);
				});
				console.warn([local.url,this.status]);
			}
			scanCompleted(sitesLength);
		};
		let error=function(e){
			brokenArray[id]=local.broken+1||1;
			scanCompleted(sitesLength);
			browser.runtime.sendMessage({
				"addClass":true,
				"elementId":"item"+id,
				"classList":["error"]
			}).then(()=>{},err=>{
				console.warn(err);
			});
			console.warn([local.url,e]);
		};
		let timeout=function(e){
			if(extraTime){
				brokenArray[id]=local.broken+1||1;
				scanCompleted(sitesLength);
				browser.runtime.sendMessage({
					"addClass":true,
					"elementId":"item"+id,
					"classList":["error"]
				}).then(()=>{},err=>{
					console.warn(err);
				});
				console.warn(["2nd timeout",local.url,e]);
			}else{
				scanPage(local,id,sitesLength,true);
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

function scanSites(force=false){
	browser.storage.local.get('sites').then(result=>{
		const sites=result.sites,
			  len=sites.length;
		sites.forEach((local,ix)=>{
			if(local.changed){
				count++;
				scanCompleted(len);
			}else if((!force&&deltaTime(local.date,local.time)<local.freq)||local.paused){
				scanCompleted(len);
			}else{
				scanPage(local,ix,len);
			}
		});
	},err=>{
		console.error(err);
	});
}

function scanPagesById(idArray){
	browser.storage.local.get('sites').then(result=>{
		const sites=result.sites,
			  len=idArray.length;
		idArray.forEach(i=>{
			let local=sites[i];
			if(local.changed||(local.paused&&len>1)){
				scanCompleted(len);
			}else{
				scanPage(local,i,len);
			}
		});
	},err=>{
		console.error(err);
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
	const {sites,settings}=await browser.storage.local.get(['sites','settings']);
	let currentTime={
		date:date(),
		time:time(),
		broken:0
	};
	const allChanges=await getAllChanges();
	changesArray.forEach((value,id)=>{
		const idb=allChanges.find(e=>{return e.uniq===value[3]});
		let changes={
			uniq:idb.uniq,
			oldHtml:idb.html,
			html:value[0]
		}
		setChanges(changes);
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
			Object.assign(sites[id],{deleteScripts:settings.defaultDeleteScripts});
		}
		if(typeof sites[id].deleteComments==="undefined"){
			Object.assign(sites[id],{deleteComments:settings.defaultDeleteComments});
		}
		if(typeof sites[id].ignoreHrefs==="undefined"){
			Object.assign(sites[id],{ignoreHrefs:settings.defaultIgnoreHrefs});
		}
	});
	timesArray.forEach((value,id)=>{
		Object.assign(sites[id],currentTime);
	});
	brokenArray.forEach((value,id)=>{
		Object.assign(sites[id],{broken:value});
	});
	await browser.storage.local.set({sites});
}

function openSite(){
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
					browser.runtime.sendMessage({
						"openSitesDelay":settings.delay*1,
						"linksId":ixs,
						"openWindow":(settings.openWindow&&ixs.length>settings.openWindowMore)
					}).then(()=>{},err=>{
						console.warn(err);
					});
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
				browser.runtime.sendMessage({
					"unchangeItem":true,
					"unchangeItemId":true
				}).then(()=>{},err=>{
					console.warn(err);
				});
			}
		}
	},err=>{
		console.error(err);
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
		browser.storage.local.set({sites}).then(()=>{},err=>{console.error(err);});
	},err=>{
		console.error(err);
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
	},err=>{
		console.error(err);
	});
}

function updateBadge(minus,singleScan){
	if(singleScan===1){
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
			},err=>{
				console.error(err);
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

function length_md5(html,ignoreNumbers,ignoreHrefs,ignoreStyles,ignoreAllAttributes){
	if(ignoreStyles){
		html=html.replace(/<style[^\x05]*?<\/style>/gi,"");
	}
	if(ignoreAllAttributes){
		html=html.replace(/ *([^\t\n\f \/>"'=]+?)=(["'])(.*?)\2/gi,"");
	}
	if(ignoreNumbers){
		html=html.replace(/\d+/g,"");
	}
	if(ignoreHrefs){
		html=html.replace(/href=(["'])(.*?)\1/gi,"href=''");
	}
	return {length:html.length,md5:md5(html)};
}

function openDuplicates(){
	duplicates.forEach(id=>{
		browser.tabs.create({url:`${extURL}view.html?${id}`});
	});
	duplicates=[];
}

function uniqueId(){
  return "changes-"+Date.now().toString(16)+Math.random().toString(16).substr(2);
}
