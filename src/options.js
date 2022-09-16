"use strict";

(function(){
	browser.storage.local.get('settings').then(e=>{
		document.documentElement.className=e.settings.theme?e.settings.theme:"auto";
	});
	let section=window.location.hash;
	if(!section)window.location.hash="#options";
	else changeActive(section.substr(1));
	if(window.location.search.substr(1)==="update"){
		document.getElementById("updateAlert").classList.remove("none");
	}
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
	document.getElementById("addToContextMenu").addEventListener("change",e=>{
		browser.runtime.sendMessage({"addToContextMenu":e.target.checked}).then(()=>{},err=>{console.warn(err);});
	});
	document.getElementById("theme").addEventListener("change",e=>{
		document.documentElement.className=e.target.value;
		browser.runtime.sendMessage({"changeTheme":e.target.value}).then(()=>{},err=>{console.warn(err);});
	});
	document.getElementById("import").addEventListener("click",importFolder);
	document.getElementById("export").addEventListener("click",exportFolder);
	document.getElementById("importContinue").addEventListener("click",e=>{e.preventDefault();importingStart(document.getElementById("folderList").value);});
	document.getElementById("folderList").addEventListener("change",importBookmarksList);
	document.getElementById("deleteDuplicates").addEventListener("click",deleteDuplicates);
	document.getElementById("deleteBroken").addEventListener("click",deleteBroken);
	document.getElementById("deleteDuplicatesConfirm").addEventListener("click",deleteDuplicatesConfirm);
	document.getElementById("deleteBrokenConfirm").addEventListener("click",deleteBrokenConfirm);
	document.getElementById("period").addEventListener("change",changePeriod);
	document.getElementById("autoScanPause").addEventListener("change",autoScanPause);
	document.getElementById("enableAutoScan").addEventListener("click",e=>{e.preventDefault();document.getElementById("autoScanPause").click();});
	browser.permissions.contains({permissions:["bookmarks"]}).then(granted=>{
		if(granted){
			document.getElementById("permission").textContent=i18n("permissionGranted");
			document.getElementById("revokePermission").removeAttribute("class");
			document.getElementById("ieGroup").removeAttribute("class");
		}else{
			document.getElementById("permission").textContent=i18n("permissionRevoked");
			document.getElementById("grantPermission").removeAttribute("class");
		}
	});
	document.getElementById("grantPermission").addEventListener("click",changePermission);
	document.getElementById("revokePermission").addEventListener("click",changePermission);
	document.getElementById("showSearchbar").addEventListener("change",e=>{
		browser.runtime.sendMessage({"search":e.target.checked}).then(()=>{},err=>{console.warn(err);});
	});
	document.getElementById("shortcut1").addEventListener("change",updateShortcut);
	document.getElementById("shortcut2").addEventListener("change",updateShortcut);
	document.getElementById("shortcut3").addEventListener("change",updateShortcut);
	document.getElementById("notificationSound").addEventListener("change",e=>{
		if(e.target.value){
			document.getElementById("rowExternalSound").className="row none";
		}else{
			document.getElementById("rowExternalSound").className="row";
		}
	});
	document.getElementById("playSound").addEventListener("click",()=>{
		const audioSrc=document.getElementById("notificationSound").value||document.getElementById("externalSound").value;
		let audio=new Audio(audioSrc);
			audio.volume=(document.getElementById("notificationVolume").value/100);
			audio.addEventListener("canplay",()=>{
				audio.play();
				setTimeout(()=>{audio.pause();},10000);
			});
	});
	document.getElementById("updateNow").addEventListener("click",()=>{browser.runtime.reload();});
	document.getElementById("sortButton").addEventListener("click",()=>{sortBy(document.getElementById("sortMode").value);});
	document.getElementById("audioFile").addEventListener("change",audioFileSelect);
})();

function saveOptions(){
	const rqstTime=parseInt(document.getElementById("requestTime").value*1000),
		  period=parseInt(document.getElementById("period").value),
		  freq=parseInt(document.getElementById("defaultFreq").value);
	let settings={
		notificationVolume:	parseInt(document.getElementById("notificationVolume").value),
		notificationTime:	parseInt(document.getElementById("notificationTime").value),
		showNotification:	document.getElementById("showNotification").checked,
		autoOpen:			document.getElementById("autoOpen").checked,
		hideHeader:			document.getElementById("hideHeader").checked,
		defaultView:		document.getElementById("defaultView").value,
		openWindow:			document.getElementById("openWindow").checked,
		openWindowMore:		document.getElementById("openWindowMore").checked?1:0,
		requestTime:		rqstTime>0?rqstTime:10000,
		diffOld:			document.getElementById("diffOld").checked,
		popupList:			document.getElementById("popupList").checked,
		theme:				document.getElementById("theme").value,
		showNextPrev:		document.getElementById("showNextPrev").checked,
		scrollToFirstChange:document.getElementById("scrollToFirstChange").checked,
		skipMinorChanges:	document.getElementById("skipMinorChanges").checked,
		addToContextMenu:	document.getElementById("addToContextMenu").checked,
		changelog:			document.getElementById("openChangelog").checked,
		warnBeforeUpdating:	document.getElementById("warnBeforeUpdating").checked,
		charset:			document.getElementById("defaultCharset").value?document.getElementById("defaultCharset").value:"utf-8",
		period:				period>5?period<1440?period:1440:5,
		paused:				document.getElementById("autoScanPause").checked,
		search:				document.getElementById("showSearchbar").checked,
		delay:				!(document.getElementById("delay").value>0)?0:document.getElementById("delay").value,
		highlightOutsideChanges:	document.getElementById("highlightOutsideChanges").checked,
		scrollbarMarkers:	document.getElementById("scrollbarMarkers").checked,
		faviconService:		document.getElementById("favicon").value,
		notificationSound:	document.getElementById("notificationSound").value||document.getElementById("externalSound").value,
		defaultFreq:		freq>0?freq*parseFloat(document.getElementById("defaultUnit").value):8,	
		defaultMode:		document.getElementById("defaultMode").value,
		defaultIgnoreNumbers:	document.getElementById("defaultIgnoreNumbers").checked,
		defaultDeleteScripts:	document.getElementById("defaultDeleteScripts").checked,
		defaultDeleteComments:	document.getElementById("defaultDeleteComments").checked,
		defaultIgnoreHrefs:		document.getElementById("defaultIgnoreHrefs").checked,
		defaultIgnoreStyles:	document.getElementById("defaultIgnoreStyles").checked,
		defaultIgnoreAllAttributes:	document.getElementById("defaultIgnoreAllAttributes").checked,
		defaultSaveOnlyPart:	document.getElementById("defaultSaveOnlyPart").checked,
	};
	browser.storage.local.set({settings}).then(()=>{},err=>{console.warn(err);});
	if(!settings.popupList)browser.browserAction.setPopup({popup:"/popup.html"});
	else browser.browserAction.setPopup({popup:"/sidebar.html?"});
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
		document.getElementById("requestTime").value=parseInt(s.requestTime/1000);
		document.getElementById("diffOld").checked=s.diffOld;
		document.getElementById("popupList").checked=s.popupList;
		document.getElementById("theme").value=s.theme?s.theme:"auto";
		document.getElementById("showNextPrev").checked=s.showNextPrev;
		document.getElementById("scrollToFirstChange").checked=s.scrollToFirstChange;
		document.getElementById("skipMinorChanges").checked=s.skipMinorChanges;
		document.getElementById("scrollToFirstChange").className=s.showNextPrev;
		document.getElementById("skipMinorChanges").className=s.showNextPrev;
		document.getElementById("scrollToFirstChange").disabled=!s.showNextPrev;
		document.getElementById("skipMinorChanges").disabled=!s.showNextPrev;
		document.getElementById("addToContextMenu").checked=s.addToContextMenu;
		document.getElementById("openChangelog").checked=s.changelog;
		document.getElementById("warnBeforeUpdating").checked=s.warnBeforeUpdating;
		document.getElementById("defaultCharset").value=s.charset;
		document.getElementById("period").value=s.period;
		document.getElementById("period").disabled=s.paused;
		document.getElementById("groupPeriod").className="row "+!s.paused;
		document.getElementById("autoScanPause").checked=s.paused;
		document.getElementById("alertToolbar").className=s.paused?"":"none";
		document.getElementById("showSearchbar").checked=s.search;
		document.getElementById("delay").value=s.delay;
		document.getElementById("highlightOutsideChanges").checked=s.highlightOutsideChanges;
		document.getElementById("scrollbarMarkers").checked=s.scrollbarMarkers;
		document.getElementById("favicon").value=s.faviconService;
		if(s.notificationSound==="notification.opus"||s.notificationSound==="notification2.opus"){
			document.getElementById("notificationSound").value=s.notificationSound;
		}else{
			document.getElementById("notificationSound").value="";
			document.getElementById("externalSound").value=s.notificationSound;
			document.getElementById("rowExternalSound").className="row";
		}
		const freq=s.defaultFreq||8;
		let unit;
		if(!(freq%168))
			unit=168;
		else if(!(freq%24))
			unit=24;
		else if(freq<1)
			unit=0.0166667;
		else
			unit=1;
		document.getElementById("defaultFreq").value=parseInt(freq/unit);
		document.getElementById("defaultUnit").value=unit;
		document.getElementById("defaultMode").value=s.defaultMode;
		document.getElementById("defaultIgnoreNumbers").checked=s.defaultIgnoreNumbers;
		document.getElementById("defaultDeleteScripts").checked=s.defaultDeleteScripts;
		document.getElementById("defaultDeleteComments").checked=s.defaultDeleteComments;
		document.getElementById("defaultIgnoreHrefs").checked=s.defaultIgnoreHrefs;
		document.getElementById("defaultIgnoreStyles").checked=s.defaultIgnoreStyles;
		document.getElementById("defaultIgnoreAllAttributes").checked=s.defaultIgnoreAllAttributes;
		document.getElementById("defaultSaveOnlyPart").checked=s.defaultSaveOnlyPart;
	},err=>{
		console.error(err);
	});
	restoreShortcut();
}

function createBackup(e){
	e.preventDefault();
	browser.storage.local.get().then(async result=>{
		result.changes=await getAllChanges();
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
		document.getElementById("updateNow").removeAttribute("class");
	},err=>{
		console.error(err);
	});
}

function translate(){
	document.getElementById("optionsA").textContent=i18n("options");
	document.getElementById("optionsA").title=i18n("options");
	document.getElementById("managementA").textContent=i18n("management");
	document.getElementById("managementA").title=i18n("management");
	document.getElementById("changelogA").textContent=i18n("changelog");
	document.getElementById("changelogA").title=i18n("changelog");
	document.getElementById("supportA").textContent=i18n("support");
	document.getElementById("supportA").title=i18n("support");
	document.getElementById("scanListA").textContent=i18n("scanList");
	document.getElementById("scanListA").title=i18n("scanList");
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
		defaultViewSelect[5].text=i18n("rawData");
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
		theme[2].text=i18n("autoTheme");
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
	document.getElementById("labelWarnBeforeUpdating").textContent=i18n("warnBeforeUpdating");
	document.getElementById("labelDefaultCharset").textContent=i18n("defaultCharset");
	document.getElementById("thImport").textContent=i18n("importExport");
	document.getElementById("import").textContent=i18n("importBtn");
	document.getElementById("importFolder").placeholder=i18n("folderName");
	document.getElementById("importAlertH4").textContent=i18n("importAlertH4");
	document.getElementById("importAlertP").textContent=i18n("importAlertP");
	document.getElementById("importContinue").textContent=i18n("continue");
	document.getElementById("export").textContent=i18n("exportBtn");
	document.getElementById("h2management").textContent=i18n("management");
	document.getElementById("h3management").textContent=i18n("general");
	document.getElementById("deleteDuplicates").textContent=i18n("deleteDuplicates");
	document.getElementById("deleteBroken").textContent=i18n("deleteBroken");
	document.getElementById("deleteDuplicatesConfirm").textContent=i18n("delete");
	document.getElementById("deleteBrokenConfirm").textContent=i18n("delete");
	document.getElementById("labelPeriod").textContent=i18n("labelPeriod");
	document.getElementById("sublabelPeriod").textContent=i18n("sublabelPeriod");
	document.getElementById("labelAutoScanPause").textContent=i18n("labelAutoScanPause");
	document.getElementById("scanningAlert").textContent=i18n("scanningAlert");
	document.getElementById("enableAutoScan").textContent=i18n("enable");
	document.getElementById("grantPermission").textContent=i18n("grant");
	document.getElementById("revokePermission").textContent=i18n("revoke");
	document.getElementById("labelShowSearchbar").textContent=i18n("showSearchbar");
	document.getElementById("labelDelay").textContent=i18n("delay");
	document.getElementById("sublabelDelay").textContent=i18n("subDelay");
	document.getElementById("labelShortcut").textContent=i18n("shortcutLabel");
	document.getElementById("labelHighlightOutsideChanges").textContent=i18n("highlightOutsideChanges");
	document.getElementById("sublabelOutside").textContent=i18n("subHighlightOutside");
	document.getElementById("labelScrollbarMarkers").textContent=i18n("scrollbarMarkers");
	document.getElementById("labelFavicon").textContent=i18n("faviconService");
	document.getElementById("favicon").options[0].text=i18n("native");
	document.getElementById("labelNotificationSound").textContent=i18n("notificationSound");
	let sound=document.getElementById("notificationSound").options;
		sound[0].text=i18n("sound")+"1";
		sound[1].text=i18n("sound")+"2";
		sound[2].text=i18n("externalSound");
	document.getElementById("externalSound").placeholder=i18n("soundUrl");
	document.getElementById("h3sidebar").textContent=i18n("h3sidebar");
	document.getElementById("h3defaultValues").textContent=i18n("h3defaultValues");
	document.getElementById("labelDefaultInterval").textContent=i18n("defaultInterval");
	document.getElementById("labelDefaultMode").textContent=i18n("defaultMode");
	let selectFreq=document.getElementById("defaultUnit").options;
		selectFreq[0].text=i18n("minutes");
		selectFreq[1].text=i18n("hours");
		selectFreq[2].text=i18n("days");
		selectFreq[3].text=i18n("weeks");
	let selectMode=document.getElementById("defaultMode").options;
		selectMode[0].text=i18n("modeM0");
		selectMode[1].text=i18n("modeM3");
		selectMode[2].text=i18n("modeM4");
		selectMode[3].text=i18n("modeM1");
		selectMode[4].text=i18n("modeM2");
	document.getElementById("labelDefaultIgnoreNumbers").textContent=i18n("defaultIgnoreNumbers");
	document.getElementById("labelDefaultDeleteScripts").textContent=i18n("defaultDeleteScripts");
	document.getElementById("labelDefaultDeleteComments").textContent=i18n("defaultDeleteComments");
	document.getElementById("labelDefaultIgnoreHrefs").textContent=i18n("defaultIgnoreHrefs");
	document.getElementById("labelDefaultIgnoreStyles").textContent=i18n("defaultIgnoreStyles");
	document.getElementById("labelDefaultIgnoreAllAttributes").textContent=i18n("defaultIgnoreAllAttributes");
	document.getElementById("updateAlertH4").textContent=i18n("updateAlertH4");
	document.getElementById("updateAlertP").textContent=i18n("updateAlertP");
	document.getElementById("updateNow").textContent=i18n("updateNow");
	document.getElementById("labelDefaultSaveOnlyPart").textContent=i18n("defaultSaveOnlyPart");
	document.getElementById("extensionName").textContent=i18n("extensionName");
	document.getElementById("h3sort").textContent=i18n("h3sort");
	document.getElementById("sortButton").textContent=i18n("sort");
	let sortMode=document.getElementById("sortMode").options;
		sortMode[0].text=i18n("ascDate");
		sortMode[1].text=i18n("descDate");
		sortMode[2].text=i18n("az");
		sortMode[3].text=i18n("za");
	document.getElementById("audioFileText").textContent=i18n("chooseFile");

	document.body.removeAttribute("class");
}

function i18n(e,s1){
	return browser.i18n.getMessage(e,s1);
}

function changeActive(e){
	document.getElementById("optionsA").removeAttribute("class");
	document.getElementById("managementA").removeAttribute("class");
	document.getElementById("changelogA").removeAttribute("class");
	document.getElementById("supportA").removeAttribute("class");
	document.getElementById(e+"A").className="active";
	document.title=i18n("extensionName")+" | "+i18n(e);	
	if(e==="changelog"){
		generateChangelog();
	}
}

let uploaded;

function handleFileSelect(e){
	let file=e.target.files[0];
	if(file.type==="application/json"||file.type==="application/x-javascript"){
		let reader=new FileReader();
		reader.onload=function(event){
			try{
				uploaded=JSON.parse(event.target.result);
				document.getElementById("restoreError").classList.add("none");
				document.getElementById("restoreAlert").classList.remove("none");
			}catch(e){
				document.getElementById("restoreAlert").classList.add("none");
				document.getElementById("restoreError").classList.remove("none");
			}
			document.getElementById("restoreOk").classList.add("none");
		};
		reader.onerror=function(event){
			document.getElementById("restoreAlert").classList.add("none");
			document.getElementById("restoreOk").classList.add("none");
			document.getElementById("restoreError").classList.remove("none");
		};
		reader.readAsText(file);
	}
}

function restoreBackup(){
	if(uploaded.dbVersion===1){
		browser.storage.local.set({sites:uploaded.sites,sort:uploaded.sort,dbVersion:uploaded.dbVersion}).then(async ()=>{
			document.getElementById("restoreAlert").classList.add("none");
			document.getElementById("restoreOk").classList.remove("none");
			await clearChanges();
			uploaded.changes.forEach(async e=>{
				await setChanges(e);
			});
			browser.runtime.sendMessage({"listSite":true}).then(()=>{},err=>{console.warn(err);});
		},err=>{
			document.getElementById("restoreAlert").classList.add("none");
			document.getElementById("restoreError").classList.remove("none");
			console.error(err);
		});
	}else{
		browser.storage.local.set({sites:uploaded.sites,changes:uploaded.changes,sort:uploaded.sort,dbVersion:0}).then(async ()=>{
			document.getElementById("restoreAlert").classList.add("none");
			document.getElementById("restoreOk").classList.remove("none");
			await clearChanges();
			browser.runtime.sendMessage({"listSite":true,"convertDB":true}).then(()=>{},err=>{console.warn(err);});
		},err=>{
			document.getElementById("restoreAlert").classList.add("none");
			document.getElementById("restoreError").classList.remove("none");
			console.error(err);
		});
	}
}

async function importFolder(e){
	e.preventDefault();
	const rootFolders=await browser.bookmarks.get(["menu________","toolbar_____","unfiled_____","mobile______"]);
	let folderName=document.getElementById("importFolder").value.trim()||i18n("extensionName"),
		folders=0,
		folderNum=0,
		folderList=document.getElementById("folderList");
	folderList.textContent="";
	document.getElementById("bookmarksList").textContent="";

	switch (folderName){
		case rootFolders[0].title:
			importingStart("menu________");
			break;
		case rootFolders[1].title:
			importingStart("toolbar_____");
			break;
		case rootFolders[2].title:
			importingStart("unfiled_____");
			break;
		case rootFolders[3].title:
			importingStart("mobile______");
			break;
		default:
			browser.bookmarks.search({title:folderName}).then(q=>{
				let empty=document.createElement("option");
				empty.hidden=true;
				folderList.add(empty); 
				q.forEach((v,i)=>{
					if(v.type==="folder"){
						folders++;
						let option=document.createElement("option");
						option.text=`${folderName} [${i}]`;
						option.value=v.id;
						folderList.add(option);
						folderNum=i;
					}	
				});
				switch(folders){
					case 0:
						document.getElementById("importOK").classList.add("none");
						document.getElementById("importAlert").classList.add("none");
						document.getElementById("importAlert2").classList.add("none");
						document.getElementById("importError").classList.remove("none");
						document.getElementById("importError").textContent=i18n("importError",folderName);
						break;
					case 1:
						importingStart(q[folderNum].id);
						break;
					default:
						document.getElementById("importError").classList.add("none");
						document.getElementById("importOK").classList.add("none");
						document.getElementById("importAlert2").classList.add("none");
						document.getElementById("importAlert").classList.remove("none");
				}
				document.getElementById("management").scrollIntoView(false);
			});
	}
}

let bookmarksToAdd=[],
	bookmarksNotAdded,
	bookmarkSecondTry=false;

browser.runtime.onMessage.addListener(run);
function run(m){
	if(m.nextBookmark){
		let bookmarkId=m.nextBookmark;
		if(m.errorBookmark)bookmarksNotAdded.push(bookmarksToAdd[bookmarkId-1]);
		if(bookmarkId<bookmarksToAdd.length){
			browser.runtime.sendMessage({
				"addThis":true,
				"url":bookmarksToAdd[bookmarkId].url,
				"title":bookmarksToAdd[bookmarkId].title,
				"folder":bookmarksToAdd[bookmarkId].folder,
				"addBookmark":bookmarkId
			}).then(()=>{},err=>{
				console.warn(err);
			});
			document.getElementById("importOK").textContent=i18n("importing",[bookmarkId+1,bookmarksToAdd.length,bookmarksToAdd[bookmarkId].title]);
		}else{
			document.getElementById("importOK").textContent=i18n("checking");
			if(bookmarksNotAdded.length){
				if(bookmarkSecondTry){
					importFailedList();
				}else{
					bookmarkSecondTry=true;
					bookmarksToAdd=bookmarksNotAdded;
					bookmarksNotAdded=[];
					browser.runtime.sendMessage({
						"addThis":true,
						"url":bookmarksToAdd[0].url,
						"title":bookmarksToAdd[0].title,
						"folder":bookmarksToAdd[0].folder||undefined,
						"addBookmark":0
					}).then(()=>{},err=>{
						console.warn(err);
					});
					document.getElementById("importOK").textContent=i18n("importing",[1,bookmarksToAdd.length,bookmarksToAdd[0].title]);
				}
			}else{
				document.getElementById("importOK").textContent=i18n("importOK");
			}
		}
	}
}

function createFolders(folders){
	browser.storage.local.get('sort').then(result=>{
		let sort=result.sort;
		folders.forEach(e=>{
			sort.push([e[1],"root","folder",e[0],false]);
		});
		browser.storage.local.set({sort}).then(()=>{},err=>{console.error(err);});
	},err=>{
		console.error(err);
	});
}

function importingStart(folderId){
	bookmarkSecondTry=false;
	bookmarksNotAdded=[];
	document.getElementById("importError").classList.add("none");
	document.getElementById("importAlert").classList.add("none");
	document.getElementById("importAlert2").classList.add("none");
	browser.bookmarks.getSubTree(folderId).then(bookmarksTree=>{
		let sortFolders=[];
		let bookmarks=bookmarksTree[0].children.map((e,i)=>{
			if(e.type==="bookmark"){
				return e;
			}else if(e.type==="folder"){
				let sortFolderId=`folder${new Date().getTime()+i}`;
				let flat=flatBookmarks(e,sortFolderId);
				sortFolders.push([e.title,sortFolderId]);
				return flat;
			}
		});
		if(bookmarks.length){
			if(sortFolders.length){
				createFolders(sortFolders);
			}
			let urlList=[],
				listFolder=[];
			browser.storage.local.get("sites").then(result=>{
				let sites=result.sites;
				urlList=sites.map(v=>{
					return v.url;
				});
				listFolder=bookmarks.flat().map(v=>{
					return {url:v.url,title:v.title||v.url,folder:v.parent};
				});
				bookmarksToAdd=listFolder.filter(v=>{
					return urlList.indexOf(v.url)<0;
				});
				if(bookmarksToAdd.length){
					browser.runtime.sendMessage({
						"addThis":true,
						"url":bookmarksToAdd[0].url,
						"title":bookmarksToAdd[0].title,
						"folder":bookmarksToAdd[0].folder||undefined,
						"addBookmark":0
					}).then(()=>{},err=>{
						console.warn(err);
					});
					document.getElementById("importOK").textContent=i18n("importing",[1,bookmarksToAdd.length,bookmarksToAdd[0].title]);
					document.getElementById("importOK").classList.remove("none");
				}else{
					document.getElementById("importOK").textContent=i18n("importOK");
					document.getElementById("importOK").classList.remove("none");
				}
				document.getElementById("management").scrollIntoView(false);
			},err=>{
				console.error(err);
			});
		}else{
			document.getElementById("importError").textContent=i18n("emptyFolder");
			document.getElementById("importError").classList.remove("none");
		}
	});
}

function flatBookmarks(folder,parent="root"){
	let arr=[];
	folder.children.forEach(e=>{
		if(e.type==="bookmark"){
			e.parent=parent;
			arr.push(e);
		}else if(e.type==="folder"){
			let flat=flatBookmarks(e,parent);
			arr.push(flat);
		}
	});
	return arr.flat(Infinity);
}

function importBookmarksList(e){
	browser.bookmarks.getChildren(e.target.value).then(bookmarks=>{
		let ul=document.getElementById("bookmarksList");
		document.getElementById("bookmarksList").textContent="";
		bookmarks=bookmarks.map(e=>{
			if(e.type==="bookmark"){
				return e;
			}else if(e.type==="folder"){
				return e.title;
			}
		});
		if(!bookmarks.length){
			document.getElementById("importContinue").classList.add("none");
			document.getElementById("bookmarksList").textContent=i18n("emptyFolder");
		}else{
			document.getElementById("importContinue").classList.remove("none");
			for(let i=0;(i<bookmarks.length&&i<10);i++){
				let li=document.createElement("li");
				if(typeof bookmarks[i]==="string"){
					li.appendChild(document.createTextNode("📁 "+bookmarks[i]));
				}else{
					li.appendChild(document.createTextNode(bookmarks[i].title||bookmarks[i].url));
				}
				ul.appendChild(li);
			}
		}
	});
}

function importFailedList(){
	document.getElementById("importOK").textContent=i18n("importOK");
	document.getElementById("importAlert2H4").textContent=i18n("importAlert2H4",bookmarksNotAdded.length);
	document.getElementById("importAlert2").classList.remove("none");
	let ul=document.getElementById("notAdded");
	document.getElementById("notAdded").textContent="";
	bookmarksNotAdded.forEach(v=>{
		let li=document.createElement("li"),
			a=document.createElement("a");
		a.appendChild(document.createTextNode(v.title));
		a.href=v.url;
		a.target="_blank";
		li.appendChild(a);
		ul.appendChild(li);
	});
	document.getElementById("management").scrollIntoView(false);
}

function exportFolder(e){
	e.preventDefault();
	browser.bookmarks.search({
		title:i18n("extensionName")
	}).then(search=>{
		if(search.length){
			let folderId;
			search.forEach(v=>{
				if(v.type==="folder")folderId=v.id;
			});
			if(!folderId){
				browser.bookmarks.create({
					title:i18n("extensionName"),
					type:"folder",
					index:0
				}).then(folder=>{
					exportAddBookmarks(folder.id);
				});
			}else exportAddBookmarks(folderId);
		}else{
			browser.bookmarks.create({
				title:i18n("extensionName"),
				type:"folder",
				index:0
			}).then(folder=>{
				exportAddBookmarks(folder.id);
			});
		}
	});
}

function exportAddBookmarks(folderId){
	browser.storage.local.get(['sites','sort']).then(result=>{
		let {sites,sort}=result,
			bookmarksList=[],
			bookmarksFolders=[]; 
		browser.bookmarks.getSubTree(folderId).then(async bookmarksTree=>{
			bookmarksTree[0].children.forEach(b=>{
				if(b.type==="folder"){
					bookmarksFolders.push([b.title,b.id]);
				}
			});
			let bookmarks=flatBookmarks(bookmarksTree[0]);
			bookmarks.forEach(v=>{
				bookmarksList.push(v.url);
			});
			document.getElementById("exportOK").classList.remove("none");
			for(const e of sort){
				if(e[2]==="folder"){
					document.getElementById("exportOK").textContent=i18n("exporting",e[3]);
					let folderIndex=bookmarksFolders.findIndex(f=>{
						return f[0]===e[3];
					});
					if(folderIndex>=0&&bookmarksFolders[folderIndex][2]===undefined){
						bookmarksFolders[folderIndex][2]=e[0];
					}else{
						if(folderIndex>=0){
							folderIndex=bookmarksFolders.findIndex(f=>{
								return (f[0]===e[3]&&f[2]===undefined);
							});
						}
						if(folderIndex>=0){
							bookmarksFolders[folderIndex][2]=e[0];
						}else{
							let newFolder=await browser.bookmarks.create({
								parentId:folderId,
								title:e[3],
								type:"folder"
							});
							bookmarksFolders.push([e[3],newFolder.id,e[0]]);
						}
					}
				}else{
					let siteId=e[0].substring(4)*1;
					let site=sites[siteId];
					document.getElementById("exportOK").textContent=i18n("exporting",site.title);
					if(bookmarksList.indexOf(site.url)<0){
						let subFolder;
						if(e[1]==="root"){
							subFolder=folderId;
						}else{
							subFolder=bookmarksFolders.find(f=>{
								return f[2]===e[1];
							})[1];
						}
						await browser.bookmarks.create({
							parentId:subFolder,
							title:site.title,
							url:site.url
						});
					}
				}
			}
			document.getElementById("exportOK").textContent=i18n("exportOK");
			document.getElementById("management").scrollIntoView(false);
		});
	},err=>{
		console.error(err);
	});
}

let duplicatedSites,
	brokenSites;

function deleteDuplicates(e){
	e.preventDefault();
	browser.storage.local.get("sites").then(result=>{
		let sites=result.sites,
			urlList={},
			ul=document.getElementById("deletedDuplicates");
		duplicatedSites=[];
		sites.forEach((v,i)=>{
			if(urlList[v.url])
				duplicatedSites.unshift([i,v.url,v.title]);
			else
				urlList[v.url]=true;
		});
		if(duplicatedSites.length){
			document.getElementById("duplicatesAlertH4").textContent=i18n("deleteAlertH4",duplicatedSites.length);
			ul.textContent="";
			duplicatedSites.forEach(v=>{
				let li=document.createElement("li"),
					a=document.createElement("a");
				a.appendChild(document.createTextNode(v[2]));
				a.href=v[1];
				a.target="_blank";
				li.appendChild(a);
				ul.appendChild(li);
			});
			document.getElementById("duplicatesOK").classList.add("none");
			document.getElementById("duplicatesAlert").classList.remove("none");
		}else{
			document.getElementById("duplicatesOKH4").textContent=i18n("noDuplicates");
			document.getElementById("duplicatesAlert").classList.add("none");
			document.getElementById("duplicatesOK").classList.remove("none");
		}
	},err=>{
		console.error(err);
	});
}

function deleteDuplicatesConfirm(e){
	e.preventDefault();
	deleteSite(0,"duplicates");
	document.getElementById("duplicatesOKH4").textContent=i18n("deleting");
	document.getElementById("duplicatesAlert").classList.add("none");
	document.getElementById("duplicatesOK").classList.remove("none");
}

function deleteBroken(e){
	e.preventDefault();
	browser.storage.local.get("sites").then(result=>{
		let sites=result.sites,
			urlList={},
			ul=document.getElementById("deletedBroken");
		brokenSites=[];
		sites.forEach((v,i)=>{
			if(v.broken>1&&v.paused!==true)
				brokenSites.unshift([i,v.url,v.title]);
		});
		if(brokenSites.length){
			document.getElementById("brokenAlertH4").textContent=i18n("deleteAlertH4",brokenSites.length);
			ul.textContent="";
			brokenSites.forEach(v=>{
				let li=document.createElement("li"),
					a=document.createElement("a");
				a.appendChild(document.createTextNode(v[2]));
				a.href=v[1];
				a.target="_blank";
				li.appendChild(a);
				ul.appendChild(li);
			});
			document.getElementById("brokenOK").classList.add("none");
			document.getElementById("brokenAlert").classList.remove("none");
		}else{
			document.getElementById("brokenOKH4").textContent=i18n("noBroken");
			document.getElementById("brokenAlert").classList.add("none");
			document.getElementById("brokenOK").classList.remove("none");
		}
	},err=>{
		console.error(err);
	});
}

function deleteBrokenConfirm(e){
	e.preventDefault();
	deleteSite(0,"broken");
	document.getElementById("brokenOKH4").textContent=i18n("deleting");
	document.getElementById("brokenAlert").classList.add("none");
	document.getElementById("brokenOK").classList.remove("none");
}

function deleteSite(j,mode){
	let e=mode==="duplicates"?duplicatedSites[j][0]:brokenSites[j][0];
	browser.storage.local.get(['sites','sort']).then(result=>{
		let sites=result.sites,
			sort=result.sort,
			sSort,
			uniqId=sites[e].uniq;
		sites.splice(e,1);
		if(sort){
			sort.forEach((value,i)=>{
				const id=parseInt(value[0].substr(4));
				if(id===e)sSort=i;
				else if(id>e)sort[i][0]=`item${id-1}`;
			});
			sort.splice(sSort,1);
		}
		browser.storage.local.set({sites,sort}).then(()=>{
			browser.runtime.sendMessage({
				"deletedSite":true,
				"id":e,
				"listSite":true
			}).then(()=>{},err=>{
				console.warn(err);
			});
			deleteChanges(uniqId);
			if(mode==="duplicates"){
				if(j+1<duplicatedSites.length)
					deleteSite(j+1,mode);
				else
					document.getElementById("duplicatesOKH4").textContent=i18n("deletedPages",duplicatedSites.length);
			}else{
				if(j+1<brokenSites.length)
					deleteSite(j+1,mode);
				else
					document.getElementById("brokenOKH4").textContent=i18n("deletedPages",brokenSites.length);
			}
		},err=>{
			console.error(err);
		});
	},err=>{
		console.error(err);
	});
}

function changePeriod(e){
	let period=parseInt(e.target.value);
	period=period>5?period<1440?period:1440:5;
	browser.runtime.sendMessage({"period":period+1}).then(()=>{},err=>{console.warn(err);});
}

function autoScanPause(e){
	e.preventDefault();
	let checked=e.target.checked,
		period=parseInt(document.getElementById("period").value);
	document.getElementById("period").disabled=checked;
	document.getElementById("groupPeriod").className="row "+!checked;
	document.getElementById("alertToolbar").className=checked?"":"none";
	if(checked){
		browser.alarms.clearAll();
	}else{
		browser.runtime.sendMessage({"period":period+1}).then(()=>{},err=>{console.warn(err);});
	}
}

function changePermission(e){
	e.preventDefault();
	if(e.target.id==="grantPermission"){
		browser.permissions.request({permissions:["bookmarks"]}).then(granted=>{
			if(granted){
				document.getElementById("permission").textContent=i18n("permissionGranted");
				document.getElementById("grantPermission").className="none";
				document.getElementById("revokePermission").removeAttribute("class");
				document.getElementById("ieGroup").removeAttribute("class");
			}
		});
	}else{
		browser.permissions.remove({permissions:["bookmarks"]}).then(revoked=>{
			if(revoked){
				document.getElementById("permission").textContent=i18n("permissionRevoked");
				document.getElementById("revokePermission").className="none";
				document.getElementById("grantPermission").removeAttribute("class");
				document.getElementById("ieGroup").className="none";
			}
		});
	}
}

function restoreShortcut(){
	browser.commands.getAll().then(commands=>{
		const shortcut=commands[0].shortcut.split("+");
		if(shortcut.length===2){
			document.getElementById("shortcut1").value=shortcut[0];
			document.getElementById("shortcut2").value="";
			document.getElementById("shortcut3").value=shortcut[1];
		}else{
			document.getElementById("shortcut1").value=shortcut[0];
			document.getElementById("shortcut2").value=shortcut[1];
			document.getElementById("shortcut3").value=shortcut[2];
		}
	});
}

function updateShortcut(){
	let [s1,s2,s3]=[document.getElementById("shortcut1").value,document.getElementById("shortcut2").value,document.getElementById("shortcut3").value];
	if(!s3)s3="Q";
	else if(s3.length<=2)s3=s3.toUpperCase();
	if(s1===s2){
		s2="";
		document.getElementById("shortcut2").value="";
	}
	try{
		browser.commands.update({
			name: "_execute_sidebar_action",
			shortcut: s2?`${s1}+${s2}+${s3}`:`${s1}+${s3}`
		});
	}catch(err){
		console.error(err);
	}
}

function sortBy(mode){
	browser.storage.local.get(["sort","sites"]).then(({sites,sort})=>{
		let folders=sort.filter(value=>{
			return value[2]==="folder";
		});
		let items=[],
			sorted=[];
		switch(mode){
			case "az":
				folders.sort((a,b)=>{
					return a[3].toLowerCase()>b[3].toLowerCase();
				});
				folders.push(["root"]);
				folders.forEach((e,i)=>{
					items[i]=sort.filter(value=>{
						return (value[1]===e[0]&&value[2]==="item");
					});
					items[i].sort((a,b)=>{
						return sites[a[0].substring(4)*1].title.toLowerCase()>sites[b[0].substring(4)*1].title.toLowerCase();
					});
				});
				folders.pop();
				folders.forEach((e,i)=>{
					sorted.push(e);
					sorted=sorted.concat(items[i]);
				});
				sorted=sorted.concat(items[items.length-1]);
				break;
			case "za":
				folders.sort((a,b)=>{
					return a[3].toLowerCase()<b[3].toLowerCase();
				});
				folders.push(["root"]);
				folders.forEach((e,i)=>{
					items[i]=sort.filter(value=>{
						return (value[1]===e[0]&&value[2]==="item");
					});
					items[i].sort((a,b)=>{
						return sites[a[0].substring(4)*1].title.toLowerCase()<sites[b[0].substring(4)*1].title.toLowerCase();
					});
				});
				folders.pop();
				folders.forEach((e,i)=>{
					sorted.push(e);
					sorted=sorted.concat(items[i]);
				});
				sorted=sorted.concat(items[items.length-1]);
				break;
			case "asc":
				folders.sort((a,b)=>{
					return a[0].substring(6)*1>b[0].substring(6)*1;
				});
				folders.push(["root"]);
				folders.forEach((e,i)=>{
					items[i]=sort.filter(value=>{
						return (value[1]===e[0]&&value[2]==="item");
					});
					items[i].sort((a,b)=>{
						return a[0].substring(4)*1>b[0].substring(4)*1;
					});
				});
				folders.pop();
				folders.forEach((e,i)=>{
					sorted.push(e);
					sorted=sorted.concat(items[i]);
				});
				sorted=sorted.concat(items[items.length-1]);
				break;
			case "desc":
				folders.sort((a,b)=>{
					return a[0].substring(6)*1<b[0].substring(6)*1;
				});
				folders.push(["root"]);
				folders.forEach((e,i)=>{
					items[i]=sort.filter(value=>{
						return (value[1]===e[0]&&value[2]==="item");
					});
					items[i].sort((a,b)=>{
						return a[0].substring(4)*1<b[0].substring(4)*1;
					});
				});
				folders.pop();
				folders.forEach((e,i)=>{
					sorted.push(e);
					sorted=sorted.concat(items[i]);
				});
				sorted=sorted.concat(items[items.length-1]);
				break;
		}
		browser.storage.local.set({sort:sorted}).then(e=>{
			browser.runtime.sendMessage({"listSite":true}).then(()=>{},err=>{console.warn(err);});
		});
	});
}

function audioFileSelect(e){
	e.stopPropagation();
	let file=e.target.files[0];
	if(file.type.split("/")[0]==="audio"){
		let reader=new FileReader();
		reader.onload=function(event){
			try{
				document.getElementById("externalSound").value=event.target.result;
				saveOptions();
			}catch(e){
				console.warn(e);
			}
		};
		reader.onerror=function(event){
			console.error(event);
		};
		reader.readAsDataURL(file);
	}
}
