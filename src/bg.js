"use strict";

browser.runtime.onInstalled.addListener(handleInstalled);
function handleInstalled(details) {
	if(details.reason==="install"){
		browser.storage.local.get('sites').then(result=>{
			if(result.sites===undefined){
				browser.storage.local.set({sites:[],changes:[],sort:[]});
			}
		});
		browser.storage.local.get('settings').then(result=>{
			if(result.settings===undefined){
				browser.storage.local.set({settings:{
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
					"theme":"light",
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
					"faviconService":"native"
				}});
			}
			if(!details.temporary){
				browser.tabs.create({
					url:"options.html#changelog",
					active:true
				});
			}
		});
	}else if(details.reason==="update"){
		browser.storage.local.get('settings').then(result=>{
			if(result.settings.showNextPrev===undefined){
				Object.assign(result.settings,{
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
					"faviconService":"native"
				});
				browser.storage.local.set({settings:result.settings});
			}else if(result.settings.addToContextMenu===undefined){
				Object.assign(result.settings,{
					"addToContextMenu":true,
					"changelog":true,
					"charset":"utf-8",
					"period":60,
					"paused":false,
					"search":true,
					"delay":0,
					"highlightOutsideChanges":false,
					"scrollbarMarkers":true,
					"faviconService":"native"
				});
				browser.storage.local.set({settings:result.settings});
			}else if(result.settings.charset===undefined){
				Object.assign(result.settings,{
					"charset":"utf-8",
					"period":60,
					"paused":false,
					"search":true,
					"delay":0,
					"highlightOutsideChanges":false,
					"scrollbarMarkers":true,
					"faviconService":"native"
				});
				browser.storage.local.set({settings:result.settings});
			}else if(result.settings.period===undefined){
				Object.assign(result.settings,{
					"period":60,
					"paused":false,
					"search":true,
					"delay":0,
					"highlightOutsideChanges":false,
					"scrollbarMarkers":true,
					"faviconService":"native"
				});
				browser.storage.local.set({settings:result.settings});
			}else if(result.settings.highlightOutsideChanges===undefined){
				Object.assign(result.settings,{
					"highlightOutsideChanges":false,
					"scrollbarMarkers":true,
					"faviconService":"native"
				});
				browser.storage.local.set({settings:result.settings});
			}else if(result.settings.scrollbarMarkers===undefined){
				Object.assign(result.settings,{
					"scrollbarMarkers":true,
					"faviconService":"native"
				});
				browser.storage.local.set({settings:result.settings});
			}
			
			if(!details.temporary&&result.settings.changelog!==false){
				browser.tabs.create({
					url:"options.html#changelog",
					active:true
				});
			}
		});
	}
}

(function(){
	browser.storage.local.get(['sites','sort','settings']).then(result=>{
		init();
		if(result.sort===undefined&&result.sites!==undefined){
			let sort=[];
			result.sites.forEach((value,i)=>{
				sort.push([`item${i}`,"root","item","",false]);
			});
			browser.storage.local.set({sort:sort});
		}
	});
})();

function init(){
	browser.storage.local.get('settings').then(result=>{
		if(result.settings){
			if(!result.settings.popupList)browser.browserAction.setPopup({popup:"/popup.html"});
			else browser.browserAction.setPopup({popup:"/sidebar.html?"});
			showContext(result.settings.addToContextMenu);
			let period=result.settings.period?result.settings.period:60;
			if(!result.settings.paused){
				browser.alarms.create("webpageScanner",{periodInMinutes:period+1});
				browser.alarms.create("webpageScanner2",{delayInMinutes:1});
			}
		}else
			setTimeout(init,100);
	});
}

browser.alarms.onAlarm.addListener(alarm=>{
	if(alarm.name==="webpageScanner"||alarm.name==="webpageScanner2")scanSites(0,true);
	else if(alarm.name==="openSitesDelay")openSitesDelay();
});

let delayCurrentId,
	delayTime,
	delayLinksId,
	lastWindowId;

browser.runtime.onMessage.addListener(run);
function run(m,s){
	if(m.addThis)rqstAdd(m.url,m.title,"m0",8,m.btn,m.favicon,m.addBookmark,m.cssSelector);
	if(m.scanSites)scanSites(0,true,true);
	if(m.openSites)openSite("webpagesScannertrue");
	if(m.addToContextMenu!==undefined)showContext(m.addToContextMenu);
	if(m.period)browser.alarms.create("webpageScanner",{periodInMinutes:m.period});
	if(m.openSitesDelay){delayCurrentId=0;delayTime=m.openSitesDelay;delayLinksId=m.linksId;lastWindowId=-1;openSitesDelay(m.openWindow);}
	if(m.closeTab){browser.tabs.remove(s.tab.id);}
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

function contextAdd(e){
	browser.tabs.query({
		url:e.pageUrl.split("#")[0],
		currentWindow:true
	}).then(tabs=>{
		const tab=tabs[0];
		rqstAdd(e.pageUrl,tab.title,"m0",8,2,tab.favIconUrl);
	});
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
				url:"view.html?"+delayLinksId[delayCurrentId],
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
				url:"view.html?"+delayLinksId[delayCurrentId],
				active:false
			}).then(tab=>{
				delayCurrentId++;
				browser.alarms.create("openSitesDelay",{delayInMinutes:delayTime/60});
			});
		}
	}else{
		delayLinksId=[];
		lastWindowId=-1;
	}
}
