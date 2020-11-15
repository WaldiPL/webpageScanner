"use strict";

let tabIcon,
	thisTabId,
	onEmptyTab,
	onViewTab,
	editId,
	modeEdit,
	modeAdd,
	prevTabId;

(async function(){
	const result=browser.storage.local.get(["sites","settings"]);
	const returnMessage=browser.runtime.sendMessage({"tabInfo":true});

	const urlParams=new URLSearchParams(window.location.search);
	onEmptyTab=urlParams.has("onEmptyTab");
	onViewTab=urlParams.has("onViewTab");
	editId=urlParams.get("editId")*1;
	modeEdit=urlParams.has("edit");
	modeAdd=urlParams.has("add");
	prevTabId=urlParams.has("tabId")?urlParams.get("tabId")*1:false;

	translate();

	const {sites,settings}=await result;
	if(settings.theme==="dark"){
		document.documentElement.className="dark";
	}
	document.body.removeAttribute("class");

	const {tab}=await returnMessage;
	tabIcon=tab.favIconUrl;
	thisTabId=tab.id;

	let url,title,charset,freq,mode,ignoreNumbers,ignoreHrefs,ignoreStyles,ignoreAllAttributes,deleteScripts,deleteComments,paritialMode,selectorCSS,saveOnlyPart;
	if(onEmptyTab&&modeAdd){
		if(prevTabId!==false){
			document.getElementById("fillForm").classList.remove("hidden");
		}
		url		="";
		title	="";
		charset	=settings.charset;
		freq	=settings.defaultFreq;
		mode	=settings.defaultMode;
		ignoreNumbers	=settings.defaultIgnoreNumbers;
		ignoreHrefs		=settings.defaultIgnoreHrefs;
		ignoreStyles	=settings.defaultIgnoreStyles;
		ignoreAllAttributes=settings.defaultIgnoreAllAttributes;
		deleteScripts	=settings.defaultDeleteScripts;
		deleteComments	=settings.defaultDeleteComments;
		paritialMode	=false;
		selectorCSS		="";
		saveOnlyPart	=settings.defaultSaveOnlyPart;
	}else if(modeEdit){
		url		=sites[editId].url;
		title	=sites[editId].title;
		charset	=sites[editId].charset;
		freq	=sites[editId].freq;
		mode	=sites[editId].mode;
		ignoreNumbers	=sites[editId].ignoreNumbers;
		ignoreHrefs		=sites[editId].ignoreHrefs;
		ignoreStyles	=sites[editId].ignoreStyles;
		ignoreAllAttributes=sites[editId].ignoreAllAttributes;
		deleteScripts	=sites[editId].deleteScripts;
		deleteComments	=sites[editId].deleteComments;
		paritialMode	=sites[editId].paritialMode;
		selectorCSS		=sites[editId].cssSelector;
		saveOnlyPart	=sites[editId].saveOnlyPart;
		const pageSettings=sites[editId].settings;
		if(pageSettings){
			document.getElementById("defaultView").value=pageSettings.defaultView;
			document.querySelector(`input[name="hideHeader"][value="${pageSettings.hideHeader}"]`).checked=true;
			document.querySelector(`input[name="showNextPrev"][value="${pageSettings.showNextPrev}"]`).checked=true;
			document.querySelector(`input[name="scrollToFirstChange"][value="${pageSettings.scrollToFirstChange}"]`).checked=true;
			document.querySelector(`input[name="skipMinorChanges"][value="${pageSettings.skipMinorChanges}"]`).checked=true;
			document.querySelector(`input[name="highlightOutsideChanges"][value="${pageSettings.highlightOutsideChanges}"]`).checked=true;
			document.querySelector(`input[name="scrollbarMarkers"][value="${pageSettings.scrollbarMarkers}"]`).checked=true;
		}
	}else{
		url		=tab.url;
		title	=tab.title;
		charset	=urlParams.get("charset");
		freq	=settings.defaultFreq;
		mode	=settings.defaultMode;
		ignoreNumbers	=settings.defaultIgnoreNumbers;
		ignoreHrefs		=settings.defaultIgnoreHrefs;
		ignoreStyles	=settings.defaultIgnoreStyles;
		ignoreAllAttributes=settings.defaultIgnoreAllAttributes;
		deleteScripts	=settings.defaultDeleteScripts;
		deleteComments	=settings.defaultDeleteComments;
		paritialMode	=false;
		selectorCSS		="";
		saveOnlyPart	=settings.defaultSaveOnlyPart;

		const duplicates=[];
		sites.forEach((v,i)=>{
			if(v.url===url){
				duplicates.push(i);
			}
		});
		if(duplicates.length){
			const messageBar=document.getElementById("messageBar");
			const messageText=document.getElementById("messageText");
			const messageButton=document.getElementById("messageButton");
			messageText.textContent=i18n("duplicateMessage2");
			messageButton.textContent=i18n("show");
			messageButton.addEventListener("click",()=>{
				duplicates.forEach(id=>{
					browser.runtime.sendMessage({"openViewPage":true,"viewId":id}).then(()=>{},err=>{console.warn(err);});
				});
			});
			messageBar.classList.remove("hidden");
		}
	}

	document.getElementById("urlInput").value=url;
	document.getElementById("titleInput").value=title;
	document.getElementById("charsetInput").value=charset||settings.charset;
	let unit;
	if(!(freq%168))
		unit=168;
	else if(!(freq%24))
		unit=24;
	else if(freq<1)
		unit=0.0166667;
	else
		unit=1;
	document.getElementById("scanFreqInput").value=parseInt(freq/unit);
	document.getElementById("unitInput").value=unit;
	document.getElementById("modeInput").value=mode;
	document.getElementById("ignoreNumbersInput").checked=ignoreNumbers;
	document.getElementById("ignoreHrefsInput").checked=ignoreHrefs;
	document.getElementById("ignoreStylesInput").checked=ignoreStyles;
	document.getElementById("ignoreAllAttributesInput").checked=ignoreAllAttributes;
	document.getElementById("deleteScriptsInput").checked=deleteScripts;
	document.getElementById("deleteCommentsInput").checked=deleteComments;
	toggleSelector(paritialMode);
	document.getElementById("paritialModeInput").checked=paritialMode;
	document.getElementById("cssSelectorInput").value=selectorCSS===undefined?"":selectorCSS;
	document.getElementById("saveOnlyPartInput").checked=saveOnlyPart;
	document.getElementById("editOk").addEventListener("click",saveSite);
	document.getElementById("editCancel").addEventListener("click",e=>{
		if(onEmptyTab){
			browser.runtime.sendMessage({"closeTab":true}).then(()=>{},err=>{console.warn(err);});
		}else{
			browser.runtime.sendMessage({"deleteWpsPopup":true}).then(()=>{},err=>{console.warn(err);});
		}
	});
	document.getElementById("paritialModeInput").addEventListener("change",e=>{
		toggleSelector(e.target.checked);
	});
	document.getElementById("inspectButtonInput").addEventListener("click",inspect);
	document.getElementById("fillForm").addEventListener("click",fillForm);
})();

function saveSite(){
	const url=document.getElementById("urlInput").value,
		  title=document.getElementById("titleInput").value,
		  charset=document.getElementById("charsetInput").value,
		  favicon=tabIcon||false,
		  mode=document.getElementById("modeInput").value,
		  aFreq=parseInt(document.getElementById("scanFreqInput").value),
		  freq=aFreq>0?aFreq*parseFloat(document.getElementById("unitInput").value):8,
		  cssSelector=(document.getElementById("paritialModeInput").checked&&document.getElementById("cssSelectorInput").value.length)?document.getElementById("cssSelectorInput").value:false,
		  saveOnlyPart=(document.getElementById("paritialModeInput").checked&&document.getElementById("cssSelectorInput").value.length)?document.getElementById("saveOnlyPartInput").checked:false,
		  ignoreNumbers=document.getElementById("ignoreNumbersInput").checked,
		  deleteScripts=document.getElementById("deleteScriptsInput").checked,
		  deleteComments=document.getElementById("deleteCommentsInput").checked,
		  ignoreHrefs=document.getElementById("ignoreHrefsInput").checked,
		  ignoreStyles=document.getElementById("ignoreStylesInput").checked,
		  ignoreAllAttributes=document.getElementById("ignoreAllAttributesInput").checked;
	const pageSettings={
		  defaultView:				document.getElementById("defaultView").value,
		  hideHeader:				getRadioValue("hideHeader"),
		  showNextPrev:				getRadioValue("showNextPrev"),
		  scrollToFirstChange:		getRadioValue("scrollToFirstChange"),
		  skipMinorChanges:			getRadioValue("skipMinorChanges"),
		  highlightOutsideChanges:	getRadioValue("highlightOutsideChanges"),
		  scrollbarMarkers:			getRadioValue("scrollbarMarkers"),
	}

	let message;
	if(modeEdit){
		message={"editThis":true,"id":editId,url,title,mode,freq,cssSelector,ignoreNumbers,deleteScripts,deleteComments,ignoreHrefs,charset,pageSettings,ignoreStyles,ignoreAllAttributes,saveOnlyPart};
	}else{
		message={"addThis":true,url,title,favicon,mode,freq,cssSelector,ignoreNumbers,deleteScripts,deleteComments,ignoreHrefs,charset,pageSettings,ignoreStyles,ignoreAllAttributes,saveOnlyPart};
	}
	browser.runtime.sendMessage(message).then(()=>{
		if(onEmptyTab){
			browser.runtime.sendMessage({"closeTab":true}).then(()=>{},err=>{console.warn(err);});
		}else{
			browser.runtime.sendMessage({"deleteWpsPopup":true}).then(()=>{},err=>{console.warn(err);});
		}
	},err=>{
		console.warn(err);
	});
}

function getRadioValue(e){
	if(document.getElementById(e+"True").checked)return true;
	else if(document.getElementById(e+"False").checked)return false;
	return "global";
}

function fillForm(){
	browser.tabs.get(prevTabId).then(tab=>{
		document.getElementById("urlInput").value=tab.url;
		document.getElementById("titleInput").value=tab.title;
		tabIcon=tab.favIconUrl;
	});
}

function toggleSelector(paritial){
	if(paritial){
		document.getElementById("cssSelectorLabel").removeAttribute("class");
		document.getElementById("spanSelectorInput").removeAttribute("class");
		document.getElementById("saveOnlyPartInput").removeAttribute("class");
		document.getElementById("saveOnlyPartLabel").removeAttribute("class");
	}else{
		document.getElementById("cssSelectorLabel").className="disabled";
		document.getElementById("spanSelectorInput").className="disabled";
		document.getElementById("saveOnlyPartInput").className="disabled";
		document.getElementById("saveOnlyPartLabel").className="disabled";
	}
	document.getElementById("cssSelectorInput").disabled=!paritial;
	document.getElementById("inspectButtonInput").disabled=!paritial;
	document.getElementById("saveOnlyPartInput").disabled=!paritial;
	document.getElementById("saveOnlyPartLabel").disabled=!paritial;
}

function i18n(e,s1){
	return browser.i18n.getMessage(e,s1);
}

function translate(){
	if(modeAdd){
		document.title=i18n("extensionName")+" - "+i18n("addWebpage");
		document.getElementById("pageSettingsH2").textContent=i18n("addWebpage");
		document.getElementById("editOk").textContent=i18n("add");
	}else{
		document.title=i18n("extensionName")+" - "+i18n("editWebpage");
		document.getElementById("pageSettingsH2").textContent=i18n("editWebpage");
		document.getElementById("editOk").textContent=i18n("save");
	}
	document.getElementById("titlebarH1").textContent=i18n("extensionName");
	document.getElementById("urlLabel").textContent=i18n("address");
	document.getElementById("titleLabel").textContent=i18n("title");
	document.getElementById("charsetLabel").textContent=i18n("charset");
	document.getElementById("scanFreqLabel").textContent=i18n("scanFreq");
	document.getElementById("modeLabel").textContent=i18n("modeTitle");
	let selectFreq=document.getElementById("unitInput").options;
		selectFreq[0].text=i18n("minutes");
		selectFreq[1].text=i18n("hours");
		selectFreq[2].text=i18n("days");
		selectFreq[3].text=i18n("weeks");
	let selectMode=document.getElementById("modeInput").options;
		selectMode[0].text=i18n("modeM0");
		selectMode[1].text=i18n("modeM3");
		selectMode[2].text=i18n("modeM4");
		selectMode[3].text=i18n("modeM1");
		selectMode[4].text=i18n("modeM2");
	document.getElementById("ignoreNumbersLabel").textContent=i18n("ignoreNumbers");
	document.getElementById("ignoreHrefsLabel").textContent=i18n("ignoreHrefs");
	document.getElementById("ignoreStylesLabel").textContent=i18n("ignoreStyles");
	document.getElementById("ignoreAllAttributesLabel").textContent=i18n("ignoreAllAttributes");
	document.getElementById("deleteScriptsLabel").textContent=i18n("deleteScripts");
	document.getElementById("deleteCommentsLabel").textContent=i18n("deleteComments");
	document.getElementById("paritialModeLabel").textContent=i18n("paritialMode");
	document.getElementById("cssSelectorLabel").textContent=i18n("selectorCSS");
	document.getElementById("inspectButtonInput").title=i18n("inspectElement");
	document.getElementById("editCancel").textContent=i18n("cancel");
	document.getElementById("optionsH2").textContent=i18n("options");
	document.getElementById("labelDefaultView").textContent=i18n("defaultView");
	let defaultViewSelect=document.getElementById("defaultView").options;
		defaultViewSelect[0].text=i18n("highlight");
		defaultViewSelect[1].text=i18n("newElements");
		defaultViewSelect[2].text=i18n("deletedElements");
		defaultViewSelect[3].text=i18n("newVersion");
		defaultViewSelect[4].text=i18n("oldVersion");
		defaultViewSelect[5].text=i18n("rawData");
		defaultViewSelect[6].text=i18n("global");
	document.getElementById("labelHideHeader").textContent=i18n("hideHeader");
	document.getElementById("hideHeaderTrue").nextSibling.textContent=i18n("yes");
	document.getElementById("hideHeaderFalse").nextSibling.textContent=i18n("no");
	document.getElementById("hideHeaderGlobal").nextSibling.textContent=i18n("global");
	document.getElementById("labelShowNextPrev").textContent=i18n("showNextPrev");
	document.getElementById("showNextPrevTrue").nextSibling.textContent=i18n("yes");
	document.getElementById("showNextPrevFalse").nextSibling.textContent=i18n("no");
	document.getElementById("showNextPrevGlobal").nextSibling.textContent=i18n("global");
	document.getElementById("labelScrollToFirstChange").textContent=i18n("scrollToFirstChange");
	document.getElementById("scrollToFirstChangeTrue").nextSibling.textContent=i18n("yes");
	document.getElementById("scrollToFirstChangeFalse").nextSibling.textContent=i18n("no");
	document.getElementById("scrollToFirstChangeGlobal").nextSibling.textContent=i18n("global");
	document.getElementById("labelSkipMinorChanges").textContent=i18n("skipMinorChanges");
	document.getElementById("skipMinorChangesTrue").nextSibling.textContent=i18n("yes");
	document.getElementById("skipMinorChangesFalse").nextSibling.textContent=i18n("no");
	document.getElementById("skipMinorChangesGlobal").nextSibling.textContent=i18n("global");
	document.getElementById("labelHighlightOutsideChanges").textContent=i18n("highlightOutsideChanges");
	document.getElementById("highlightOutsideChangesTrue").nextSibling.textContent=i18n("yes");
	document.getElementById("highlightOutsideChangesFalse").nextSibling.textContent=i18n("no");
	document.getElementById("highlightOutsideChangesGlobal").nextSibling.textContent=i18n("global");
	document.getElementById("labelScrollbarMarkers").textContent=i18n("scrollbarMarkers");
	document.getElementById("scrollbarMarkersTrue").nextSibling.textContent=i18n("yes");
	document.getElementById("scrollbarMarkersFalse").nextSibling.textContent=i18n("no");
	document.getElementById("scrollbarMarkersGlobal").nextSibling.textContent=i18n("global");
	document.getElementById("fillForm").textContent=i18n("fillForm");
	document.getElementById("saveOnlyPartLabel").textContent=i18n("saveOnlyPart");
}

let inspected;
function inspect(){
	if(onEmptyTab||onViewTab){
		let wpsURL=document.getElementById("urlInput").value;
		if(wpsURL.startsWith("http")){
			browser.tabs.create({url:wpsURL}).then(tab=>{
				browser.tabs.executeScript(tab.id,{
					file: "/inspect.js",
					runAt:"document_end"
				}).then(()=>{
					browser.tabs.sendMessage(tab.id,{
						"initInspect":true,
						"inspectMode":"onEmptyTab",
						"dialogTabId":thisTabId
					}).then(()=>{},err=>{
						console.warn(err);
					});
				},err=>{
					console.error(err);
					browser.tabs.sendMessage(tab.id,{
						"initInspect":true,
						"inspectMode":"onEmptyTab",
						"dialogTabId":thisTabId
					}).then(()=>{},err=>{
						console.warn(err);
					});
				});
				browser.tabs.insertCSS(tab.id,{
					file: "/inspect.css",
					runAt:"document_end"
				}).then(()=>{},err=>{
					console.error(err);
				});
			  
			});
		}
	}else{
		browser.runtime.sendMessage({
			"inspectTab":true,
			"fadeOut":true,
			"again":inspected
		}).then(()=>{
			inspected=true;
		},err=>{
			console.warn(err);
		});
	}
}

browser.runtime.onMessage.addListener(run);
function run(m,s){
	if(m.changeSelector){
		document.getElementById("cssSelectorInput").value=m.selector;
	}
	if(m.unhideWpsPopup){
		document.body.removeAttribute("class");
	}
	if(m.fadeOut){
		document.body.className="fade";
	}
	if(m.deletedSite){
		if(modeEdit&&editId){
			let dId=m.id*1;
			if(dId===editId){
				browser.tabs.getCurrent().then(tab=>{browser.tabs.remove(tab.id);});
			}else if(dId<editId){
				const urlParams=new URLSearchParams(window.location.search);
				urlParams.set("editId",editId-1);
				window.location=browser.runtime.getURL("dialog.html")+"?"+urlParams.toString();
			}
		}
	}
}
