"use strict";

let localId,
	highlighted,
	prevHighlighted,
	filteredChanges,
	inspected,
	viewMode,
	iframe,
	browserVersion=0;
	
const extURL=browser.extension.getURL("");

browser.runtime.getBrowserInfo().then(e=>{
	browserVersion=+e.version.substr(0,2);
});

(function(){
	const urlString=window.location.search;
	localId=parseInt(urlString.substr(1));
	iframe=document.createElement("iframe");
	iframe.id="__wps_iframe";
	document.getElementById("content").appendChild(iframe);
	translate();
	document.getElementById("viewMode").addEventListener("change",e=>{load(e.target.value);});
	document.getElementById("deleteButton").addEventListener("click",showDelete);
	document.getElementById("deleteCancel").addEventListener("click",e=>{e.target.offsetParent.classList.add("hidden");});
	document.getElementById("editButton").addEventListener("click",showEdit);
	document.getElementById("editCancel").addEventListener("click",e=>{e.target.offsetParent.classList.add("hidden");});
	let js=document.createElement("script");
	getSettings().then(s=>{
		if(s.diffOld)js.src="diffOld.js";
		else js.src="diff.js";
		document.body.appendChild(js);
		js.onload=function(){
			load(s.defaultView);
		}
		if(s.hideHeader)toggleHeader(true);
	});
	document.getElementById("toggleHeader").addEventListener("click",()=>{toggleHeader();});
	document.getElementById("prev").addEventListener("click",()=>{nextPrev(false);});
	document.getElementById("next").addEventListener("click",()=>{nextPrev(true);});
	document.getElementById("close").addEventListener("click",toggleNextPrev);
	document.getElementById("paritialModeEdit").addEventListener("change",e=>{
		if(e.target.checked){
			document.getElementById("rowSelectorEdit").removeAttribute("class");
		}else{
			document.getElementById("rowSelectorEdit").className="notVisible";
		}
	});
	document.getElementById("inspectButtonEdit").addEventListener("click",inspect);
})();

function nextPrev(next){
	if(!filteredChanges.length||(filteredChanges.length===1&&highlighted===0))return;
	if(next){
		if(highlighted<filteredChanges.length-1){
			prevHighlighted=highlighted;
			highlighted++;
		}else{
			prevHighlighted=highlighted!==undefined?filteredChanges.length-1:undefined;
			highlighted=0;
		}
	}else{
		if(highlighted>0){
			prevHighlighted=prevHighlighted!==undefined?highlighted:0;
			highlighted=highlighted!==undefined?highlighted-1:0;
		}else{
			prevHighlighted=0;
			highlighted=filteredChanges.length-1;
		}
	}
	document.getElementById("xtext").textContent=i18n("changeOf",[highlighted+1,filteredChanges.length]);
	filteredChanges[highlighted].classList.add("hlc");
	if(prevHighlighted!==undefined)filteredChanges[prevHighlighted].classList.remove("hlc");
	if(browserVersion<58)
		filteredChanges[highlighted].scrollIntoView({behavior:"smooth",block:"end"});
	else
		filteredChanges[highlighted].scrollIntoView({behavior:"smooth",block:"center"});
}

function toggleNextPrev(show,autoScroll){
	if(show===true){
		document.getElementById("highlight").removeAttribute("class");
		if(autoScroll)setTimeout(()=>{nextPrev(true);},500);
	}else{
		document.getElementById("highlight").className="hidden";
		if(highlighted!==undefined)filteredChanges[highlighted].classList.remove("hlc");
	}
}

function showDelete(){
	document.getElementById("editPopup").classList.add("hidden");
	browser.storage.local.get('sites').then(result=>{
		const sites=result.sites;
		document.getElementById("deleteOk").addEventListener("click",deleteSite);
		document.getElementById("deletePopup").classList.remove("hidden");
		document.getElementById("deleteTitle").textContent=sites[localId].title;
	});
}

function deleteSite(){
	browser.storage.local.get(['sites','changes','sort']).then(result=>{
		let sites=result.sites,
			changes=result.changes,
			sort=result.sort,
			sSort;
		sites.splice(localId,1);
		changes.splice(localId,1);
		if(sort){
			sort.forEach((value,i)=>{
				const id=parseInt(value[0].substr(4));
				if(id===localId)sSort=i;
				else if(id>localId)sort[i][0]=`item${id-1}`;
			});
			sort.splice(sSort,1);
		}
		browser.storage.local.set({sites:sites,changes:changes,sort:sort}).then(()=>{
			browser.runtime.sendMessage({"listSite":true,"deletedSite":true,"id":localId});
			browser.tabs.getCurrent().then(tab=>{browser.tabs.remove(tab.id);});
		});
	});
}

function showEdit(){
	document.getElementById("deletePopup").classList.add("hidden");
	browser.storage.local.get(['sites','settings']).then(result=>{
		const sites=result.sites;
		document.getElementById("editOk").addEventListener("click",editSite);
		document.getElementById("editPopup").classList.remove("hidden");
		document.getElementById("urlEdit").value=sites[localId].url;
		document.getElementById("titleEdit").value=sites[localId].title;
		document.getElementById("charsetEdit").value=sites[localId].charset?sites[localId].charset:result.settings.charset;
		const freq=sites[localId].freq;
		let unit;
		if(!(freq%168))
			unit=168;
		else if(!(freq%24))
			unit=24;
		else if(freq<1)
			unit=0.0166667;
		else
			unit=1;
		document.getElementById("scanFreqEdit").value=parseInt(freq/unit);
		document.getElementById("unitEdit").value=unit;
		document.getElementById("modeEdit").value=sites[localId].mode;
		document.getElementById("rowSelectorEdit").className=sites[localId].paritialMode?"":"notVisible";
		document.getElementById("paritialModeEdit").checked=sites[localId].paritialMode;
		document.getElementById("cssSelectorEdit").value=(sites[localId].cssSelector===undefined)?"":sites[localId].cssSelector;
	});
}

function editSite(){
	document.getElementById("editPopup").classList.add("hidden");
	browser.storage.local.get(['sites','settings']).then(result=>{
		let sites=result.sites,
			freq=parseInt(document.getElementById("scanFreqEdit").value);
		let obj={
			title:	document.getElementById("titleEdit").value,
			url:	document.getElementById("urlEdit").value,
			mode:	document.getElementById("modeEdit").value,
			favicon:"https://www.google.com/s2/favicons?domain="+document.getElementById("urlEdit").value,
			freq:	freq>0?freq*parseFloat(document.getElementById("unitEdit").value):8,
			charset:document.getElementById("charsetEdit").value?document.getElementById("charsetEdit").value:result.settings.charset,
			paritialMode:document.getElementById("paritialModeEdit").checked,
			cssSelector:document.getElementById("cssSelectorEdit").value
		}
		document.getElementById("title").textContent=obj.title;
		document.title=obj.title;
		sites[localId]=Object.assign(sites[localId],obj);
		browser.storage.local.set({sites}).then(()=>{
			browser.runtime.sendMessage({"listSite":true});
		});
	});
}

function load(type){
	document.getElementById("viewMode").value=type;
	browser.storage.local.get(['sites','changes','settings']).then(result=>{
		const sites=result.sites,
			  changes=result.changes,
			  settings=result.settings,
			  sId=sites[localId],
			  cId=changes[localId],
			  newHtml=cId.html,
			  oldHtml=cId?cId.oldHtml:"",
			  diffString=diffString2(oldHtml,newHtml),
			  light=cId?diffString.n:newHtml,
			  news=cId?diffString.c:"",
			  deleted=cId?diffString.o:"",
			  url=sId.url.split("/"),
			  url2=url[0]+"//"+url[2]+"/",
			  lastScan=[realDate(sId.date),realTime(sId.time)],
			  oldTime=sId.oldTime?[realDate(sId.oldTime[0])," "+realTime(sId.oldTime[1])]:"",
			  newTime=sId.newTime?[realDate(sId.newTime[0])," "+realTime(sId.newTime[1])]:"";
		let parser=new DOMParser(),
			doc;
		if(oldHtml)enableBtn("oldHtml");
		if(news)enableBtn("news");
		if(deleted)enableBtn("deleted");
		document.getElementById("current").href=sId.url;
		document.getElementById("title").textContent=sId.title;
		document.title=sId.title;
		document.getElementById("favicon").href=sId.favicon;
		toggleNextPrev();
		highlighted=undefined;
		prevHighlighted=undefined;
		let css=document.createElement("link");
			css.rel="stylesheet";
			css.href=extURL+"viewIframe.css";
		
		switch(type){
			case "light":
				doc=parser.parseFromString(light,"text/html");
				doc.head.appendChild(css);
				toggleNextPrev(settings.showNextPrev,settings.scrollToFirstChange);
				document.getElementById("versionTime").textContent=newTime?i18n("newVersion")+": "+newTime:i18n("lastScan",lastScan);
				break;
			case "news":
				doc=parser.parseFromString(news,"text/html");
				document.getElementById("versionTime").textContent=newTime?i18n("newVersion")+": "+newTime:i18n("lastScan",lastScan);
				break;
			case "deleted":
				doc=parser.parseFromString(deleted,"text/html");
				document.getElementById("versionTime").textContent=oldTime?i18n("oldVersion")+": "+oldTime:i18n("lastScan",lastScan);
				break;
			case "newHtml":
				doc=parser.parseFromString(newHtml,"text/html");
				document.getElementById("versionTime").textContent=newTime?i18n("newVersion")+": "+newTime:i18n("lastScan",lastScan);
				break;
			case "oldHtml":
				doc=parser.parseFromString(oldHtml,"text/html");
				document.getElementById("versionTime").textContent=oldTime?i18n("oldVersion")+": "+oldTime:i18n("lastScan",lastScan);
				break;
			case "raw":
				let divNews=document.createElement("div"),
					divDeleted=document.createElement("div");
				divNews.id="__wps_rawNews";
				divDeleted.id="__wps_rawDeleted";
				divNews.textContent=news;
				divDeleted.textContent=deleted.replace(/<del>|<\/del>/g,"");
				doc=document.implementation.createHTMLDocument();
				doc.body.id="__wps_raw";
				doc.body.appendChild(divDeleted);
				doc.body.appendChild(divNews);
				doc.head.appendChild(css);
				document.getElementById("versionTime").textContent=newTime?i18n("oldVersion")+": "+oldTime+" | "+i18n("newVersion")+": "+newTime:i18n("lastScan",lastScan);
				break;
		}
		let base=doc.getElementsByTagName("base")[0];
		if(base){
			if(base.getAttribute("href")=="/"){
				base.href=url2;
			}else if(!base.href.startsWith("http")){
				base.href=sId.url;
			}
		}else{
			base=document.createElement("base");
			base.href=sId.url;
			if(doc.head)doc.head.insertBefore(base,doc.head.firstElementChild);
		}
		base.target="_top";
		iframe.contentDocument.documentElement.remove();
		iframe.contentDocument.appendChild(doc.documentElement);
		viewMode=type;
		if(type==="light"){
			const allChanges=iframe.contentDocument.getElementsByClassName("changes10153");
			if(settings.skipMinorChanges){
				filteredChanges=[...allChanges].filter((element,index,array)=>{
					return (element.childNodes[0].length>1||element.children.length);
				});
			}else{
				filteredChanges=allChanges;
			}
			document.getElementById("xtext").textContent=i18n("numberOfChanges",filteredChanges.length);
		}
		document.getElementById("versionTime").title=i18n("lastScan",lastScan)+"\u000d"+i18n("newVersion")+": "+newTime+"\u000d"+i18n("oldVersion")+": "+oldTime;
	});
}

function realDate(e){
	const m=Math.trunc(e),
		  month=i18n("monthList").split(","),
		  d=Math.round((e-m)*100);
	return `${d} ${month[m]}`;
}

function realTime(e){
	e+="";
	let h=e.split(".")[0],
		m=e.split(".")[1];
	m=m?m:"00";
	h=h.length===1?"0"+h:h;
	m=m.length===1?m+"0":m.substr(0,2);
	return `${h}:${m}`;
}

function i18n(e,s1){
	return browser.i18n.getMessage(e,s1);
}

browser.runtime.onMessage.addListener(run);
function run(m){
	if(m.deletedSite){
		let dId=parseInt(m.id);
		if(dId===localId){
			browser.tabs.getCurrent().then(tab=>{browser.tabs.remove(tab.id);});
		}else if(dId<localId){
			window.location=browser.runtime.getURL("view.html")+"?"+(localId-1);
		}
	}
}

function translate(){
	document.getElementById("editButton").textContent=i18n("edit");
	document.getElementById("deleteButton").textContent=i18n("delete");
	document.getElementById("oldHtml").textContent=i18n("oldVersion");
	document.getElementById("newHtml").textContent=i18n("newVersion");
	document.getElementById("news").textContent=i18n("newElements");
	document.getElementById("deleted").textContent=i18n("deletedElements");
	document.getElementById("light").textContent=i18n("highlight");
	document.getElementById("raw").textContent=i18n("rawData");
	document.getElementById("current").title=i18n("currentWebpage");
	document.getElementById("deleteCancel").textContent=i18n("cancel");
	document.getElementById("deleteOk").textContent=i18n("delete");
	document.getElementById("editCancel").textContent=i18n("cancel");
	document.getElementById("editOk").textContent=i18n("save");
	document.getElementById("deleteHeader").textContent=i18n("deleteWebpage");
	document.getElementById("editHeader").textContent=i18n("editWebpage");
	document.getElementById("urlLabelEdit").textContent=i18n("address");
	document.getElementById("titleLabelEdit").textContent=i18n("title");
	document.getElementById("charsetLabelEdit").textContent=i18n("charset");
	document.getElementById("scanFreqLabelEdit").textContent=i18n("scanFreq");
	document.getElementById("modeLabelEdit").textContent=i18n("modeTitle");
	let selectFreq=document.getElementById("unitEdit").options;
		selectFreq[0].text=i18n("minutes");
		selectFreq[1].text=i18n("hours");
		selectFreq[2].text=i18n("days");
		selectFreq[3].text=i18n("weeks");
	let selectMode=document.getElementById("modeEdit").options;
		selectMode[0].text=i18n("modeM0");
		selectMode[1].text=i18n("modeM3");
		selectMode[2].text=i18n("modeM4");
		selectMode[3].text=i18n("modeM1");
		selectMode[4].text=i18n("modeM2");
	document.getElementById("toggleHeader").title=i18n("hideInterface");
	document.getElementById("prev").title=i18n("scrollPrev");
	document.getElementById("next").title=i18n("scrollNext");
	document.getElementById("close").title=i18n("close");
	document.getElementById("paritialModeLabelEdit").textContent=i18n("paritialMode");
	document.getElementById("cssSelectorLabelEdit").textContent=i18n("selectorCSS");
	document.getElementById("inspectButtonEdit").title=i18n("inspectElement");
}

function getSettings(name){
	return browser.storage.local.get('settings').then(result=>{
		return name?result.settings[name]:result.settings;
	});
}

function toggleHeader(auto){
	let body=document.body,
		arrow=document.getElementById("toggleHeader"),
		hidd=body.classList.contains("hiddenHeader");
	if(!hidd||auto){
		body.className=auto?"hiddenHeader autoHidden":"hiddenHeader";
		arrow.title=i18n("showInterface");
	}else{
		body.className="";
		arrow.title=i18n("hideInterface");
	}
}

function enableBtn(name){
	document.getElementById(name).disabled=false;
}

function inspect(){
	if(viewMode==="newHtml"){
		document.getElementById("editPopup").classList.add("hidden");
		if(!inspected){
			inspected=true;
			let js=document.createElement("script");
				js.src=extURL+"inspect.js";
			iframe.contentWindow.browser=browser;
			iframe.contentDocument.body.appendChild(js);
			
			let css=document.createElement("link");
				css.rel="stylesheet";
				css.href=extURL+"inspect.css";
			iframe.contentDocument.head.appendChild(css);
		}else{
			iframe.contentWindow.init();
		}
	}else{
		load("newHtml");
		setTimeout(inspect,250);
	}
}
