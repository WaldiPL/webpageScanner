"use strict";

browser.runtime.onInstalled.addListener(handleInstalled);
function handleInstalled(details) {
	const defaultSettings={
		"notificationVolume":60,
		"notificationTime":10000,
		"showNotification":true,
		"autoOpen":false,
		"hideHeader":false,
		"defaultView":"light",
		"openWindow":false,
		"openWindowMore":1,
		"requestTime":10000,
		"diffOld":false,
		"popupList":false,
		"theme":"auto",
		"showNextPrev":true,
		"scrollToFirstChange":true,
		"skipMinorChanges":true,
		"addToContextMenu":true,
		"changelog":true,
		"charset":"utf-8",
		"period":60,
		"paused":false,
		"search":true,
		"delay":0,
		"highlightOutsideChanges":false,
		"scrollbarMarkers":true,
		"faviconService":"native",
		"notificationSound":"notification.opus",
		"defaultFreq":8,
		"defaultMode":"m0",
		"defaultIgnoreNumbers":false,
		"defaultDeleteScripts":true,
		"defaultDeleteComments":true,
		"defaultIgnoreHrefs":false,
		"defaultIgnoreStyles":false,
		"defaultIgnoreAllAttributes":false,
		"defaultSaveOnlyPart":false,
		"warnBeforeUpdating":true,
	};
	if(details.reason==="install"){
		browser.storage.local.get(['sites','settings']).then(result=>{
			const db={};
			if(result.sites===undefined){
				Object.assign(db,{sites:[],changes:[],sort:[]});
			}
			if(result.settings===undefined){
				Object.assign(db,{settings:defaultSettings});
			}
			browser.storage.local.set(db).then(()=>{
				init();
				if(!details.temporary){
					browser.tabs.create({
						url:`${extURL}options.html#changelog`,
						active:true
					});
				}
			},err=>{
				console.error(err);
			});
		},err=>{
			console.error(err);
		});
	}else if(details.reason==="update"){
		browser.storage.local.get('settings').then(result=>{
			const settings=Object.assign({},defaultSettings,result.settings);
			browser.storage.local.set({settings}).then(()=>{
				if(!details.temporary&&settings.changelog){
					browser.tabs.create({
						url:`${extURL}options.html#changelog`,
						active:true
					});
				}
			},err=>{
				console.error(err);
			});
		},err=>{
			console.error(err);
		});
	}
}

browser.browserAction.onClicked.addListener(async (tab,e)=>{
	if(e.button===1){
		const activeAlarm=browser.alarms.get("openSitesDelay");
		const badgeNumber=browser.browserAction.getBadgeText({});
		if(await activeAlarm){
			browser.alarms.clear("openSitesDelay");
			updateTooltip("alarm");
		}else if(delayLinksId&&delayLinksId.length){
			browser.alarms.create("openSitesDelay",{delayInMinutes:0.01});
			updateTooltip("alarm");
		}else if(await badgeNumber){
			openSite();
		}
	}
});

browser.runtime.onUpdateAvailable.addListener(()=>{
	browser.storage.local.get("settings").then(result=>{
		if(result.settings.warnBeforeUpdating){
			browser.tabs.create({
				url:`${extURL}options.html?update#management`,
				active:true
			});
		}
	},err=>{
		console.error(err);
	});
});

browser.notifications.onClicked.addListener(e=>{
	switch(e){
		case "webpagesScannerScanned":
			getSettings("autoOpen").then(s=>{
				if(!s){openSite();}
			});
			break;
		case "webpagesScannerDuplicates":
			openDuplicates();
			break;
	}
});

(function(){
	browser.storage.local.get(['sites','sort','settings']).then(result=>{
		if(result.sites===undefined||result.settings===undefined){
			handleInstalled({reason:"install"});
		}else{
			init();
		}
		if(result.sort===undefined&&result.sites!==undefined){
			let sort=[];
			result.sites.forEach((value,i)=>{
				sort.push([`item${i}`,"root","item","",false]);
			});
			browser.storage.local.set({sort}).then(()=>{},err=>{console.error(err);});
		}
	},err=>{
		console.error(err);
	});
})();

function init(){
	browser.storage.local.get('settings').then(result=>{
		if(!result.settings.popupList)browser.browserAction.setPopup({popup:"/popup.html"});
		else browser.browserAction.setPopup({popup:"/sidebar.html?"});
		showContext(result.settings.addToContextMenu);
		let period=result.settings.period?result.settings.period:60;
		if(!result.settings.paused){
			browser.alarms.create("webpageScanner",{periodInMinutes:period+1});
			browser.alarms.create("webpageScanner2",{delayInMinutes:1});
		}
	},err=>{
		console.error(err);
	});
}

browser.alarms.onAlarm.addListener(alarm=>{
	if(alarm.name==="webpageScanner"||alarm.name==="webpageScanner2")scanSites();
	else if(alarm.name==="openSitesDelay")openSitesDelay();
});

let delayCurrentId,
	delayTime,
	delayLinksId,
	lastWindowId;

browser.runtime.onMessage.addListener(run);
function run(m,s,r){
	if(m.addThis)rqstAdd(m.url,m.title,m.favicon,m.mode,m.freq,m.addBookmark,m.cssSelector,m.ignoreNumbers,m.deleteScripts,m.deleteComments,m.ignoreHrefs,m.charset,m.pageSettings,m.ignoreStyles,m.ignoreAllAttributes,m.saveOnlyPart,m.folder);
	if(m.scanSites)scanSites(m.force);
	if(m.openSites)openSite();
	if(m.addToContextMenu!==undefined)showContext(m.addToContextMenu);
	if(m.period)browser.alarms.create("webpageScanner",{periodInMinutes:m.period});
	if(m.openSitesDelay){delayCurrentId=0;delayTime=m.openSitesDelay;delayLinksId=m.linksId;lastWindowId=-1;openSitesDelay(m.openWindow);}
	if(m.closeTab){browser.tabs.remove(s.tab.id);}
	if(m.scanPagesById){scanPagesById(m.idArray);}
	if(m.updateBadge){updateBadge(m.updateBadgeArg);}
	if(m.unchange){unchange(m.unchangeArg);}
	if(m.tabInfo){r({tab:s.tab});}
	if(m.showWpsPopup){showPopup(m.mode,m.editId);}
	if(m.unhideWpsPopup){
		browser.tabs.executeScript(s.tab.id,{
			code:`document.getElementById("__wps_pageSettings").style.visibility="visible";`
		}).then(()=>{},err=>{
			console.error(err);
		});
	}
	if(m.deleteWpsPopup){
		browser.tabs.executeScript(s.tab.id,{
			code:`document.getElementById("__wps_pageSettings").remove();`
		}).then(()=>{},err=>{
			console.error(err);
		});
	}
	if(m.inspectTab){
		browser.tabs.create({url:`${extURL}inspectView.html`}).then(tab=>{
			browser.tabs.executeScript(tab.id,{
				file: "/inspectView.js",
				runAt:"document_start"
			}).then(()=>{
				browser.tabs.sendMessage(tab.id,{
					"inspectUrl":m.inspectUrl,
					"loadXHR":true,
					"dialogTabId":s.tab.id,
				}).then(()=>{},err=>{
					console.warn(err);
				});
			},err=>{
				console.error(err);
				browser.tabs.sendMessage(tab.id,{
					"inspectUrl":m.inspectUrl,
					"loadXHR":true,
					"dialogTabId":s.tab.id,
				}).then(()=>{},err=>{
					console.warn(err);
				});
			});
		},err=>{
			console.warn(err);
		});
	}
	if(m.inspectMe){
		browser.tabs.executeScript(s.tab.id,{
			file: "/inspect.js",
			runAt:"document_end"
		}).then(()=>{
			browser.tabs.sendMessage(s.tab.id,{
				"initInspect":true,
				"dialogTabId":m.dialogTabId
			}).then(()=>{},err=>{
				console.warn(err);
			});
		},err=>{
			console.error(err);
			browser.tabs.sendMessage(s.tab.id,{
				"initInspect":true,
				"dialogTabId":m.dialogTabId
			}).then(()=>{},err=>{
				console.warn(err);
			});
		});
		browser.tabs.insertCSS(s.tab.id,{
			file: "/inspect.css",
			runAt:"document_end"
		}).then(()=>{},err=>{
			console.error(err);
		});
	}
	if(m.returnToDialogTab){
		browser.tabs.remove(s.tab.id).then(()=>{
			browser.tabs.sendMessage(m.dialogTabId,{
				"changeSelector":true,
				"selector":m.cssSelector
			}).then(()=>{},err=>{
				console.warn(err);
			});
			browser.tabs.update(m.dialogTabId,{
				active:true
			})
		});
	}
	if(m.editThis){editSite(m.id,m.url,m.title,m.mode,m.freq,m.charset,m.cssSelector,m.ignoreNumbers,m.ignoreHrefs,m.deleteScripts,m.deleteComments,m.pageSettings,m.ignoreStyles,m.ignoreAllAttributes,m.saveOnlyPart);}
	if(m.executeCustom){
		browser.tabs.executeScript(s.tab.id,{
			file:"/custom.js"
		}).then(()=>{},err=>{
			console.error(err);
		});
	}
	if(m.byBG){
		browser.tabs.sendMessage(s.tab.id,m).then(()=>{},err=>{console.warn(err);});
	}
	if(m.openViewPage){browser.tabs.create({url:`${extURL}view.html?${m.viewId}`});}
}

function showContext(e){
	if(e){
		browser.contextMenus.create({
			id:			"addThis",
			title:		i18n("addThis"),
			contexts:	["page","tab"],
			onclick:	contextAdd,
			documentUrlPatterns: ["<all_urls>"]
		});
	}else
		browser.contextMenus.remove("addThis");
}

function contextAdd(e,tab){
	if(e.viewType==="tab"){
		showPopup();
	}else{
		browser.tabs.update(tab.id,{
			active:true
		}).then(()=>{
			showPopup();
		});
	}
}

function openSitesDelay(openWindow){
	if(delayCurrentId<delayLinksId.length){
		if(openWindow){
			browser.windows.create({
				url:"view.html?"+delayLinksId[delayCurrentId]
			}).then(win=>{
				lastWindowId=win.id;
				delayCurrentId++;
				browser.alarms.create("openSitesDelay",{delayInMinutes:delayTime/60});
			});
		}else if(lastWindowId>=0){
			browser.tabs.create({
				url:`${extURL}view.html?${delayLinksId[delayCurrentId]}`,
				active:false,
				windowId:lastWindowId
			}).then(tab=>{
				delayCurrentId++;
				browser.alarms.create("openSitesDelay",{delayInMinutes:delayTime/60});
			},err=>{
				openSitesDelay(true);
			});
		}else{
			browser.tabs.create({
				url:`${extURL}view.html?${delayLinksId[delayCurrentId]}`,
				active:false
			}).then(tab=>{
				delayCurrentId++;
				browser.alarms.create("openSitesDelay",{delayInMinutes:delayTime/60});
			});
		}
		updateBadge(-1);
		unchange([delayLinksId[delayCurrentId]]);
		browser.runtime.sendMessage({
			"unchangeItem":true,
			"unchangeItemId":[delayLinksId[delayCurrentId]]
		}).then(()=>{},err=>{
			console.warn(err);
		});
	}else{
		delayLinksId=[];
		lastWindowId=-1;
	}
}

function showPopup(mode="add",editId){
	const code=`
		(function(){
			if(!document.getElementById("__wps_pageSettings")&&(("${mode}"==="add"&&this.location.protocol.startsWith("http"))||("${mode}"==="edit"&&this.location.protocol==="moz-extension:"))){
				let popup=document.createElement("wps-popup");
					popup.id="__wps_pageSettings";
					popup.setAttribute("editId","${editId}");
					popup.setAttribute("mode","${mode}");
					document.documentElement.appendChild(popup);	
			}
		})();	
	`;
	browser.tabs.executeScript({
		file:"/custom.js"
	}).then(()=>{
		browser.tabs.executeScript({
			code:code
		}).then(()=>{},err=>{
			console.error(err);
			if(mode!=="edit"){
				browser.tabs.query({active:true}).then(tab=>{
					rqstAdd(tab.url,tab.title,tab.favIconUrl);
				});
			}
		});
	},err=>{
		console.error(err);
		if(mode==="add"){
			browser.tabs.query({currentWindow:true,active:true}).then(tabs=>{
				const tab=tabs[0];
				if(tab.url.startsWith("http")){
					browser.tabs.create({url:`${extURL}dialog.html?onEmptyTab&add&tabId=${tab.id}`});
				}else{
					browser.tabs.create({url:`${extURL}dialog.html?onEmptyTab&add`});
				}
			});
		}else{
			browser.tabs.create({url:`${extURL}dialog.html?onEmptyTab&edit&editId=${editId}`});
		}
	});
}

function editSite(id,url,title,mode,freq,charset,cssSelector,ignoreNumbers,ignoreHrefs,deleteScripts,deleteComments,pageSettings,ignoreStyles,ignoreAllAttributes,saveOnlyPart){
	browser.storage.local.get("sites").then(async result=>{
		let sites=result.sites;
		let obj={
			url,
			title,
			mode,
			freq,
			charset,
			paritialMode:(cssSelector!==false)?true:false,
			cssSelector:(cssSelector!==false)?cssSelector:"",
			ignoreNumbers,
			ignoreHrefs,
			ignoreStyles,
			ignoreAllAttributes,
			deleteScripts,
			deleteComments,
			saveOnlyPart,
		};
		const old={
			paritialMode:sites[id].paritialMode,
			cssSelector :sites[id].cssSelector,
			ignoreNumbers:sites[id].ignoreNumbers,
			ignoreHrefs	 :sites[id].ignoreHrefs,
			ignoreStyles :sites[id].ignoreStyles,
			ignoreAllAttributes:sites[id].ignoreAllAttributes,
		};
		if(old.paritialMode!==obj.paritialMode||old.cssSelector!==obj.cssSelector||old.ignoreNumbers!==ignoreNumbers||old.ignoreHrefs!==ignoreHrefs||old.ignoreStyles!==ignoreStyles||old.ignoreAllAttributes!==ignoreAllAttributes){
			const {changes}=await browser.storage.local.get("changes");
			const html_data=changes[id].html;
			if(cssSelector===false){
				Object.assign(obj,length_md5(html_data,ignoreNumbers,ignoreHrefs,ignoreStyles,ignoreAllAttributes));
			}else{
				let parser=new DOMParser(),
					doc=parser.parseFromString(html_data,"text/html"),
					selectedElement=doc.querySelector(cssSelector);
				if(selectedElement){
					let partHTML=selectedElement.outerHTML;
					Object.assign(obj,length_md5(partHTML,ignoreNumbers,ignoreHrefs,ignoreStyles,ignoreAllAttributes));
				}else{
					Object.assign(obj,length_md5(html_data,ignoreNumbers,ignoreHrefs,ignoreStyles,ignoreAllAttributes));
				}
			}
		}
		Object.assign(obj,{settings:pageSettings});
		Object.assign(sites[id],obj);
		browser.storage.local.set({sites}).then(()=>{
			browser.runtime.sendMessage({
				"statusbar":true,
				"statusbarArg":i18n("savedWebpage",sites[id].title),
				"listSite":true,
				"reload":true,
				"reloadId":id,
			}).then(()=>{},err=>{
				console.warn(err);
			});
		},err=>{
			console.error(err);
		});
	},err=>{
		console.error(err);
	});
}
