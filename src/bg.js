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
					"paused":false
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
				result.settings=Object.assign(result.settings,{
					"showNextPrev":true,
					"scrollToFirstChange":true,
					"skipMinorChanges":true,
					"addToContextMenu":true,
					"changelog":true,
					"charset":"utf-8",
					"period":60,
					"paused":false
				});
				browser.storage.local.set({settings:result.settings});
			}else if(result.settings.addToContextMenu===undefined){
				result.settings=Object.assign(result.settings,{
					"addToContextMenu":true,
					"changelog":true,
					"charset":"utf-8",
					"period":60,
					"paused":false
				});
				browser.storage.local.set({settings:result.settings});
			}else if(result.settings.charset===undefined){
				result.settings=Object.assign(result.settings,{
					"charset":"utf-8",
					"period":60,
					"paused":false
				});
				browser.storage.local.set({settings:result.settings});
			}else if(result.settings.period===undefined){
				result.settings=Object.assign(result.settings,{
					"period":60,
					"paused":false
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
			else browser.browserAction.setPopup({popup:"/sidebar.html"});
			showContext(result.settings.addToContextMenu);
			convertFavicons();
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
	scanSites(0,true);
});

browser.runtime.onMessage.addListener(run);
function run(m){
	if(m.addThis)rqstAdd(m.url,m.title,"m0",8,m.btn,m.favicon,m.addBookmark);
	if(m.scanSites)scanSites(0,true,true);
	if(m.openSites)openSite("webpagesScannertrue");
	if(m.addToContextMenu!=undefined)showContext(m.addToContextMenu);
	if(m.period)browser.alarms.create("webpageScanner",{periodInMinutes:m.period});
}

function showContext(e){
	if(e){
		browser.contextMenus.create({
			id:			"addThis",
			title:		i18n("addThis"),
			contexts:	["page","tab"],
			onclick:	contextAdd
		});
	}else
		browser.contextMenus.remove("addThis");
}

function contextAdd(e){
	browser.tabs.query({
		url:e.pageUrl,
		currentWindow:true
	}).then(tabs=>{
		const tab=tabs[0];
		rqstAdd(tab.url,tab.title,"m0",8,2,tab.favicon);
	});
}

let faviconCount=0;

function convertFavicons(){
	browser.storage.local.get("sites").then(result=>{
		let sites=result.sites,
			len=sites.length;
		for(let i=0;i<sites.length;i++){
			if(sites[i].favicon[0]==="d"){
				len--;
				if(faviconCount===len){
					browser.storage.local.set({sites:sites}).then(()=>{
						browser.runtime.sendMessage({"listSite":true});
					});
				}
			}else{
				favicon64(sites[i].url,(b64,fc)=>{
					sites[i]=Object.assign(sites[i],{favicon:b64});
					if(fc===len){
						browser.storage.local.set({sites:sites}).then(()=>{
							browser.runtime.sendMessage({"listSite":true});
						});
					}
				});
			}
		}
	});
}

function favicon64(url,callback){
	let img=new Image(),
		letter2=url.split("/")[2].split("."),
		letter=letter2[letter2.length-2][0].toUpperCase();
	img.onload=e=>{
		faviconCount++;
		let canvas=document.createElement('canvas'),
			ctx=canvas.getContext('2d');
		canvas.width=16;
		canvas.height=16;
		ctx.drawImage(e.target,0,0,16,16);
		let dataURL=canvas.toDataURL();
		if(dataURL==="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACFElEQVQ4ja2TP2vbYBDGs+ZDeMqnyOIhg2dbTbbIqrM08h9oauPaVTFq2hpDaTZTPIQkeJCd4YVYJpVolYARuCUitIOEQWAkQ1KIBUKQkCEWT4cg1U7cqT246b3nx929zy0s/K9YXttZjMbqkTLfpfKvO8pGru2tMgf+KnPgp7JtL891lCLfpaKxemR5bWfxkXgl3ljKFUktlW4Z7z98cZrkHLvtMzTJOVTNRqUqO0lWMHIFUluJN5ZmINFYPZIrkNpG9nD0sdEDkXTIPRNj9xbWhQcAuLy6gdwzwbDCKFMgtWisHgkBRb5LJVnBUDUbRNJBJB2iMoCoDELAxAdO+kOc9oegWcEo8l0qBOS5jlKpys7ERwgI0ru+AwB413cgko4fxi9w7yRniztSQkAq2/ZUzQ6LHoqDDnRzDCLpUDUbTLrlhYAnyX3ftFwAgNwzoZvjGXEQJ/0hiKTDtFxQ63v+DODy6iZsNVjgPICoDGBaLhLTgKeZlqdq9kyxqtlhBnAAGLu3UDUbSVb4M0Ke6yh8VXamAQ/38f3nRfj2ku86z8tTSyy9ERPBN/4NQCQdE/++M3pTMEoVMfHISAwrjKYhpuWGYtNy78XP5hgpsHKmQGo0Kxjl7WNH1Wyc9ofYbZ/hU/MbytufHXpTMDLzrDx9TKWKmNjijhQm3fIoet9PrO/5SVbwXrzqfC2/PY7PPaZ/id9i4TQ7pxqOTwAAAABJRU5ErkJggg=="){
			ctx.fillStyle="#0a84ff";
			ctx.fillRect(0,0,16,16); 
			ctx.font="11px Segoe UI,Tahoma,Helvetica Neue,Lucida Grande,Ubuntu,sans-serif";
			ctx.fillStyle="#fff";
			ctx.textAlign="center";
			ctx.fillText(letter,8,12); 
			ctx.drawImage(canvas,0,0,16,16);
			dataURL=canvas.toDataURL();
		}
		callback(dataURL,faviconCount);
	};
	img.onerror=()=>{
		faviconCount++;
		let canvas=document.createElement('canvas'),
			ctx=canvas.getContext('2d');
		canvas.width=16;
		canvas.height=16;
		ctx.fillStyle="#0a84ff";
		ctx.fillRect(0,0,16,16); 
		ctx.font="13px Segoe UI,Tahoma,Helvetica Neue,Lucida Grande,Ubuntu,sans-serif";
		ctx.fillStyle="#fff";
		ctx.textAlign="center";
		ctx.fillText(letter,8,12); 
		ctx.drawImage(canvas,0,0,16,16);
		let dataURL=canvas.toDataURL();
		callback(dataURL,faviconCount);
	}
	img.src="https://www.google.com/s2/favicons?domain="+url.split("://")[1];
}
