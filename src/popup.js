"use strict";

(async function(){
	document.getElementById("addThis").textContent=i18n("addThis");
	document.getElementById("scanNow").textContent=i18n("scanNow");
	document.getElementById("showList").textContent=i18n("showList");
	document.getElementById("addThis").addEventListener("click",addThis);
	document.getElementById("scanNow").addEventListener("click",scanNow);
	document.getElementById("showList").addEventListener("click",showList);
	const result=browser.storage.local.get('settings');
	const activeAlarm=browser.alarms.get("openSitesDelay");
	const badgeText=browser.browserAction.getBadgeText({});
	const {settings}=await result;
	if(settings.theme==="dark")document.documentElement.className="dark";
	let openSitesBtn=document.getElementById("openSites");
	if(await badgeText&&!(await activeAlarm)){
		openSitesBtn.textContent=i18n("openWebpage");
		openSitesBtn.removeAttribute("class");
		if(settings.autoOpen){
			openSitesBtn.addEventListener("click",()=>{
				browser.alarms.create("openSitesDelay",{delayInMinutes:0.01});
				openSitesBtn.className="none";
			});
		}else{
			openSitesBtn.addEventListener("click",openSites);
		}
	}
})();

function addThis(){
	browser.tabs.query({currentWindow:true,active:true}).then(tabs=>{
		let tab=tabs[0];
		browser.runtime.sendMessage({"addThis":true,"url":tab.url,"title":tab.title,"favicon":tab.favIconUrl});
	});
}

function scanNow(){
	browser.runtime.sendMessage({"scanSites":true,"force":true});
}

function openSites(){
	browser.runtime.sendMessage({"openSites":true});
	openSitesBtn.className="none";
}

function showList(){
	browser.sidebarAction.open();
}

function i18n(e){
	return browser.i18n.getMessage(e);
}
