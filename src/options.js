(function(){
	let section=window.location.hash;
	if(!section)window.location.hash="#options";
	else changeActive(section.substr(1));
	translate();
	document.getElementById("notificationVolume").addEventListener("change",e=>{document.getElementById("oVolume").value=e.target.value;});
	document.getElementById("notificationTime").addEventListener("change",e=>{document.getElementById("oTime").value=parseInt(e.target.value/1000);});
	document.getElementById("openWindow").addEventListener("change",e=>{
		let checked=e.target.checked,
			more=document.getElementById("openWindowMore"),
			moreLabel=document.getElementById("labelOpenWindowMore");
		more.className=checked;
		more.disabled=!checked;
		moreLabel.className=checked;
	});
	document.getElementById("showNotification").addEventListener("change",e=>{
		let checked=e.target.checked;
		document.getElementById("trTime").className="row "+checked;
		document.getElementById("notificationTime").disabled=!checked;
	});
	document.getElementById("showNextPrev").addEventListener("change",e=>{
		let checked=e.target.checked,
			autoScroll=document.getElementById("scrollToFirstChange"),
			autoScrollLabel=document.getElementById("labelScrollToFirstChange"),
			skip=document.getElementById("skipMinorChanges"),
			skipLabel=document.getElementById("labelSkipMinorChanges");
		autoScroll.className=checked;
		autoScroll.disabled=!checked;
		autoScrollLabel.className=checked;
		skip.className=checked;
		skip.disabled=!checked;
		skipLabel.className=checked;
	});
	document.addEventListener("DOMContentLoaded",restoreOptions);
	document.getElementById("optionsForm").addEventListener("change",saveOptions);
	document.getElementById("backup").addEventListener("click",createBackup);
	document.getElementById("file").addEventListener("change",handleFileSelect);
	document.getElementById("restore").addEventListener("click",restoreBackup);
	window.addEventListener("hashchange",e=>{changeActive(e.newURL.split("#")[1]);});
	document.getElementById("addToContextMenu").addEventListener("change",e=>{browser.runtime.sendMessage({"addToContextMenu":e.target.checked});});
	document.getElementById("theme").addEventListener("change",e=>{browser.runtime.sendMessage({"changeTheme":e.target.value});});
})();

function saveOptions(){
	let settings={
		notificationVolume:	parseInt(document.getElementById("notificationVolume").value),
		notificationTime:	parseInt(document.getElementById("notificationTime").value),
		showNotification:	document.getElementById("showNotification").checked,
		autoOpen:			document.getElementById("autoOpen").checked,
		hideHeader:			document.getElementById("hideHeader").checked,
		defaultView:		document.getElementById("defaultView").value,
		openWindow:			document.getElementById("openWindow").checked,
		openWindowMore:		document.getElementById("openWindowMore").checked?1:0,
		requestTime:		parseInt(document.getElementById("requestTime").value*1000),
		diffOld:			document.getElementById("diffOld").checked,
		popupList:			document.getElementById("popupList").checked,
		theme:				document.getElementById("theme").value,
		showNextPrev:		document.getElementById("showNextPrev").checked,
		scrollToFirstChange:document.getElementById("scrollToFirstChange").checked,
		skipMinorChanges:	document.getElementById("skipMinorChanges").checked,
		addToContextMenu:	document.getElementById("addToContextMenu").checked,
		changelog:			document.getElementById("openChangelog").checked
	};
	browser.storage.local.set({settings:settings});
	if(!settings.popupList)browser.browserAction.setPopup({popup:"/popup.html"});
	else browser.browserAction.setPopup({popup:"/sidebar.html"});
}

function restoreOptions(){
	browser.storage.local.get('settings').then(result=>{
		let s=result.settings,
			openWindowMore=s.openWindowMore?true:false;
		document.getElementById("notificationVolume").value=s.notificationVolume;
		document.getElementById("oVolume").value=s.notificationVolume;
		document.getElementById("notificationTime").value=s.notificationTime;
		document.getElementById("oTime").value=parseInt(s.notificationTime/1000);
		document.getElementById("autoOpen").checked=s.autoOpen;
		document.getElementById("hideHeader").checked=s.hideHeader;
		document.getElementById("showNotification").checked=s.showNotification;
		document.getElementById("defaultView").value=s.defaultView;
		document.getElementById("trTime").className="row "+s.showNotification;
		document.getElementById("notificationTime").disabled=!s.showNotification;
		document.getElementById("openWindow").checked=s.openWindow;
		document.getElementById("openWindowMore").checked=openWindowMore;
		document.getElementById("openWindowMore").disabled=!s.openWindow;
		document.getElementById("openWindowMore").className=s.openWindow;
		document.getElementById("labelOpenWindowMore").className=s.openWindow;
		document.getElementById("requestTime").value=parseInt(s.requestTime/1000);
		document.getElementById("diffOld").checked=s.diffOld;
		document.getElementById("popupList").checked=s.popupList;
		document.getElementById("theme").value=s.theme?s.theme:"light";
		document.getElementById("showNextPrev").checked=s.showNextPrev;
		document.getElementById("scrollToFirstChange").checked=s.scrollToFirstChange;
		document.getElementById("skipMinorChanges").checked=s.skipMinorChanges;
		document.getElementById("scrollToFirstChange").className=s.showNextPrev;
		document.getElementById("skipMinorChanges").className=s.showNextPrev;
		document.getElementById("scrollToFirstChange").disabled=!s.showNextPrev;
		document.getElementById("skipMinorChanges").disabled=!s.showNextPrev;
		document.getElementById("labelScrollToFirstChange").className=s.showNextPrev;
		document.getElementById("labelSkipMinorChanges").className=s.showNextPrev;
		document.getElementById("addToContextMenu").checked=s.addToContextMenu;
		document.getElementById("openChangelog").checked=s.changelog;
	});
}

function createBackup(){
	browser.storage.local.get().then(result=>{
		let a=document.createElement("a");
		document.body.appendChild(a);
		let json=JSON.stringify(result),
			blob=new Blob([json],{type:"octet/stream"}),
			url=window.URL.createObjectURL(blob),
			d=new Date(),
			date=`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
		a.href=url;
		a.download=`${i18n("extensionName")} - ${date}.json`;
		a.style.display="none";
		a.click();
		window.URL.revokeObjectURL(url);
	});
}

function translate(){
	document.title=i18n("extensionName");
	document.getElementById("optionsA").textContent=i18n("options");
	document.getElementById("changelogA").textContent=i18n("changelog");
	document.getElementById("supportA").textContent=i18n("support");
	document.getElementById("h2options").textContent=i18n("options");
	document.getElementById("thGeneral").textContent=i18n("general");
	document.getElementById("labelAutoOpen").textContent=i18n("autoOpen");
	document.getElementById("labelHideHeader").textContent=i18n("hideHeader");
	document.getElementById("labelDefaultView").textContent=i18n("defaultView");
	let defaultViewSelect=document.getElementById("defaultView").options;
		defaultViewSelect[0].text=i18n("highlight");
		defaultViewSelect[1].text=i18n("newElements");
		defaultViewSelect[2].text=i18n("deletedElements");
		defaultViewSelect[3].text=i18n("newVersion");
		defaultViewSelect[4].text=i18n("oldVersion");
	document.getElementById("thNotifications").textContent=i18n("notifications");
	document.getElementById("labelShow").textContent=i18n("showNotification");
	document.getElementById("volumeLabel").textContent=i18n("volume");
	document.getElementById("timeLabel").textContent=i18n("notificationTime");
	document.getElementById("labelRequestTime").textContent=i18n("maxRequestTime");
	document.getElementById("thChangedPages").textContent=i18n("changedPages");
	document.getElementById("labelOpenWindow").textContent=i18n("openNewWindow");
	document.getElementById("labelOpenWindowMore").textContent=i18n("openNewWindowMore");
	document.getElementById("labelDiffOld").textContent=i18n("diffOld");
	document.getElementById("labelPopupList").textContent=i18n("popupList");	
	document.getElementById("labelTheme").textContent=i18n("theme");
	let theme=document.getElementById("theme").options;
		theme[0].text=i18n("lightTheme");
		theme[1].text=i18n("darkTheme");
	document.getElementById("h3pageView").textContent=i18n("h3PageView");
	document.getElementById("labelShowNextPrev").textContent=i18n("showNextPrev");
	document.getElementById("labelScrollToFirstChange").textContent=i18n("scrollToFirstChange");
	document.getElementById("labelSkipMinorChanges").textContent=i18n("skipMinorChanges");
	document.getElementById("thBackup").textContent=i18n("thBackup");
	document.getElementById("backup").textContent=i18n("backup");
	document.getElementById("fileText").textContent=i18n("restoreBackup");
	document.getElementById("restoreAlertH4").textContent=i18n("restoreAlertH4");
	document.getElementById("restoreAlertP").textContent=i18n("restoreAlertP");
	document.getElementById("restore").textContent=i18n("restoreButton");
	document.getElementById("restoreError").textContent=i18n("restoreError");
	document.getElementById("restoreOk").textContent=i18n("restoreOk");
	document.getElementById("h2changelog").textContent=i18n("changelog");
	document.getElementById("h2support").textContent=i18n("support");
	document.getElementById("h3bugReport").textContent=i18n("bugReport");
	document.getElementById("spanBugReport").textContent=i18n("spanBugReport");
	document.getElementById("h3translation").textContent=i18n("translation");
	document.getElementById("spanTranslation1").textContent=i18n("spanTranslation1");
	document.getElementById("spanTranslation2").textContent=i18n("spanTranslation2");
	document.getElementById("spanTranslation3").textContent=i18n("spanTranslation3");
	document.getElementById("h3share").textContent=i18n("share");
	document.getElementById("spanShare").textContent=i18n("spanShare");
	document.getElementById("labelAddToContextMenu").textContent=i18n("addToContextMenu");
	document.getElementById("labelOpenChangelog").textContent=i18n("openChangelog");
}

function i18n(e,s1){
	return browser.i18n.getMessage(e,s1);
}

function changeActive(e){
	document.getElementById("optionsA").removeAttribute("class");
	document.getElementById("changelogA").removeAttribute("class");
	document.getElementById("supportA").removeAttribute("class");
	document.getElementById(e+"A").className="active";
}

let uploaded;

function handleFileSelect(e){
	let file=e.target.files[0];
	if(file.type==="application/json"||file.type==="application/x-javascript"){
		let reader=new FileReader();
		reader.onload=function(event){
			try{
				uploaded=JSON.parse(event.target.result);
				document.getElementById("restoreError").className="none";
				document.getElementById("restoreAlert").removeAttribute("class");
			}catch(e){
				document.getElementById("restoreAlert").className="none";
				document.getElementById("restoreError").removeAttribute("class");
			}
			document.getElementById("restoreOk").className="none";
		};
		reader.onerror=function(event){
			document.getElementById("restoreAlert").className="none";
			document.getElementById("restoreOk").className="none";
			document.getElementById("restoreError").removeAttribute("class");
		}
		reader.readAsText(file);
	}
}

function restoreBackup(){
	browser.storage.local.set({sites:uploaded.sites,changes:uploaded.changes,sort:uploaded.sort}).then(()=>{
		document.getElementById("restoreAlert").className="none";
		document.getElementById("restoreOk").removeAttribute("class");
		browser.runtime.sendMessage({"listSite":true});
	},()=>{
		document.getElementById("restoreAlert").className="none";
		document.getElementById("restoreError").removeAttribute("class");
	});
}
