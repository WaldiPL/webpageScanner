"use strict";

let localId,
	highlighted,
	prevHighlighted,
	filteredChanges,
	viewMode,
	iframe;
	
const extURL=browser.runtime.getURL("");

(function(){
		console.time("Foo");
	const urlString=window.location.search;
	localId=parseInt(urlString.substr(1));
	iframe=document.createElement("iframe");
	iframe.id="__wps_iframe";
	document.getElementById("content").appendChild(iframe);
	browser.storage.local.get(["sites","settings"]).then(result=>{
		let sites=result.sites,
			settings=result.settings;
		let site=sites[localId];

		document.documentElement.className=settings.theme?settings.theme:"auto";
		document.getElementById("title").textContent=site.title;
		if(settings.hideHeader)toggleHeader(true);
		document.getElementById("viewMode").value=settings.defaultView;
		document.getElementById("header").removeAttribute("class");
		document.title=site.title;
		document.getElementById("favicon").href=site.favicon;
		document.getElementById("current").href=site.url;
	},err=>{
		console.error(err);
	});
	load();
	translate();
	document.getElementById("viewMode").addEventListener("change",e=>{load(e.target.value);});
	document.getElementById("deleteButton").addEventListener("click",showDelete);
	document.getElementById("deleteCancel").addEventListener("click",e=>{e.target.offsetParent.classList.add("fade");});
	document.getElementById("editButton").addEventListener("click",showEdit);
	document.getElementById("toggleHeader").addEventListener("click",()=>{toggleHeader();});
	document.getElementById("prev").addEventListener("click",()=>{nextPrev(false);});
	document.getElementById("next").addEventListener("click",()=>{nextPrev(true);});
	document.getElementById("close").addEventListener("click",toggleNextPrev);
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
	browser.storage.local.get('sites').then(result=>{
		const sites=result.sites;
		document.getElementById("deleteOk").addEventListener("click",deleteSite);
		document.getElementById("deletePopup").classList.remove("fade");
		document.getElementById("deleteTitle").textContent=sites[localId].title;
	},err=>{
		console.error(err);
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
		browser.storage.local.set({sites,changes,sort}).then(()=>{
			browser.runtime.sendMessage({
				"listSite":true,
				"deletedSite":true,
				"id":localId
			}).then(()=>{},err=>{
				console.warn(err);
			});
			browser.tabs.getCurrent().then(tab=>{browser.tabs.remove(tab.id);});
		},err=>{
			console.error(err);
		});
	},err=>{
		console.error(err);
	});
}

function showEdit(){
	document.getElementById("deletePopup").classList.add("fade");
	browser.runtime.sendMessage({
		"showWpsPopup":true,
		"mode":"edit",
		"editId":localId
	}).then(()=>{},err=>{
		console.warn(err);
	});
}

function partHtml(html,selectorCss){
	let parser=new DOMParser(),
		doc=parser.parseFromString(html,"text/html"),
		selectedElement=doc.querySelector(selectorCss);
	if(selectedElement){
		return selectedElement.outerHTML;
	}else{
		return html;
	}
}

function load(type){
	browser.storage.local.get(['sites','changes','settings']).then(result=>{
		const sites=result.sites,
			  changes=result.changes,
			  settings=result.settings,
			  sId=sites[localId],
			  cId=changes[localId],
			  newHtml=cId.html,
			  oldHtml=cId?cId.oldHtml:"",
			  diffStringX=settings.diffOld?diffString2old:diffString2;

		const pageSettings={
			defaultView:0,
			highlightOutsideChanges:0,
			showNextPrev:0,
			scrollToFirstChange:0,
			skipMinorChanges:0,
			scrollbarMarkers:0,
			hideHeader:0
		};
		Object.entries(pageSettings).forEach(e=>{
			if(typeof sId.settings==="undefined"||typeof sId.settings[e[0]]==="undefined"||sId.settings[e[0]]==="global"){
				pageSettings[e[0]]=settings[e[0]];
			}else{
				pageSettings[e[0]]=sId.settings[e[0]]
			}
		});
		type=type||pageSettings.defaultView;

		let diffString;
		if((type==="raw"||type==="news"||type==="deleted")&&sId.paritialMode&&sId.cssSelector&&!pageSettings.highlightOutsideChanges){
			diffString=diffStringX(partHtml(oldHtml,sId.cssSelector),partHtml(newHtml,sId.cssSelector));
		}else{
			diffString=diffStringX(oldHtml,newHtml);
		}

		const light=cId?diffString.n:newHtml,
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
		toggleNextPrev();
		toggleScrollbarMarkers();
		highlighted=undefined;
		prevHighlighted=undefined;

		if(pageSettings.hideHeader){
			toggleHeader(true);
		}else if(document.body.classList.contains("hiddenHeader")){
			toggleHeader();
		}
		document.getElementById("viewMode").value=type;
		switch(type){
			case "light":
				doc=parser.parseFromString(light,"text/html");
				let style=document.createElement("style");
				let cssSelector=(!pageSettings.highlightOutsideChanges&&sId.paritialMode&&sId.cssSelector&&!sId.saveOnlyPart)?sId.cssSelector:"";
				if(sId.saveOnlyPart&&sId.settings.highlightOutsideChanges===false)cssSelector=sId.cssSelector;
				style.textContent=`
					${cssSelector} .__wps_changes a{
						background:#ffa !important;
					}
					${cssSelector} .__wps_changes.hlc a,
					${cssSelector} .__wps_changes.hlc a .__wps_changes{
						background:#00feff !important;
						color:#000 !important;
					}
					${cssSelector} .__wps_changes{
						background:#ffe900 !important;
						color:#000 !important;
						border:0 !important;
						padding:0 !important;
						margin:0 !important;
						opacity:1 !important;
						overflow:visible !important;
						outline:none !important;
					}
					${cssSelector} .__wps_changes a,
					${cssSelector} a .__wps_changes{
						color:#006abc !important;
					}
					${cssSelector} .__wps_changes:hover a,
					${cssSelector} a .__wps_changes:hover{
						color:#00f !important;
						background:#ffe100 !important;
					}
					${cssSelector} .__wps_changes.hlc{
						background-color:#00feff !important;
						color:#000 !important;
					}
				`;
				doc.head.appendChild(style);
				toggleNextPrev(pageSettings.showNextPrev,pageSettings.scrollToFirstChange);
				if(pageSettings.scrollbarMarkers){
					setTimeout(()=>{toggleScrollbarMarkers(true)},300);
					setTimeout(()=>{toggleScrollbarMarkers(true)},2000);
				}
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
				let css=document.createElement("link");
					css.rel="stylesheet";
					css.href=extURL+"viewIframe.css";
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
		if(doc.head){
			const metaRefresh=doc.head.querySelector("meta[http-equiv=refresh]");
			if(metaRefresh)metaRefresh.remove();
		}
		iframe.contentDocument.documentElement.remove();
		iframe.contentDocument.appendChild(doc.documentElement);

		let selectedElement;
		if(sId.paritialMode&&sId.cssSelector&&(type==="light"||type==="newHtml"||type==="oldHtml")&&sId.saveOnlyPart!==true&&sId.deleteScripts!==true){
			selectedElement=iframe.contentDocument.querySelector(sId.cssSelector);
			if(!selectedElement){
				let notification=document.getElementById("messageBar");
				notification.textContent=i18n("warningPart");
				notification.className="warning";
			}else{
				document.getElementById("messageBar").className="hidden";
			}
		}else{
			document.getElementById("messageBar").className="hidden";
		}
		if(sId.broken>1){
			let notification=document.getElementById("messageBar");
			notification.textContent=i18n("warningBroken",sId.broken);
			notification.className="warning";
		}

		viewMode=type;
		if(type==="light"){
			const allChanges=iframe.contentDocument.getElementsByClassName("__wps_changes");		
			if(pageSettings.skipMinorChanges){
				filteredChanges=[...allChanges].filter((element,index,array)=>{
					return ((element.childNodes.length&&element.childNodes[0].length>1)||element.children.length);
				});
			}else{
				filteredChanges=allChanges;
			}
			if(!pageSettings.highlightOutsideChanges&&selectedElement){
				filteredChanges=[...filteredChanges].filter((element,index,array)=>{
					return (selectedElement.contains(element));
				});
			}
			document.getElementById("xtext").textContent=i18n("numberOfChanges",filteredChanges.length);
		}
		document.getElementById("versionTime").title=i18n("lastScan",lastScan)+"\u000d"+i18n("newVersion")+": "+newTime+"\u000d"+i18n("oldVersion")+": "+oldTime;
		document.getElementById("title").textContent=sId.title;
		document.title=sId.title;
				console.timeEnd("Foo");
	},err=>{
		console.error(err);
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
	if(m.changeTheme)document.documentElement.className=m.changeTheme;
	if(m.reload&&m.reloadId===localId)load(viewMode);
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
	document.getElementById("deleteHeader").textContent=i18n("deleteWebpage");
	document.getElementById("toggleHeader").title=i18n("hideInterface");
	document.getElementById("prev").title=i18n("scrollPrev");
	document.getElementById("next").title=i18n("scrollNext");
	document.getElementById("close").title=i18n("close");
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

function toggleScrollbarMarkers(show){
	if(show&&iframe.contentDocument.body.scrollHeight>iframe.contentDocument.body.clientHeight&&filteredChanges&&filteredChanges.length){
		let canvas=document.getElementById("__wps_scrollbarMarkers");
		if(!canvas){
			canvas=document.createElement("canvas");
			canvas.width=16;
			canvas.id="__wps_scrollbarMarkers";
			document.body.appendChild(canvas);
		}
		const ctx=canvas.getContext('2d');
		ctx.clearRect(0,0,canvas.width,canvas.height);
		canvas.height=iframe.contentDocument.body.scrollHeight;
		ctx.fillStyle="rgb(0,144,255)";
		[...filteredChanges].forEach(e=>{
		  const elm=e.getBoundingClientRect();
		  const top=elm.top+iframe.contentWindow.scrollY;
		  const height=elm.height;
		  ctx.fillRect(0,top,16,height);
		});
	}else{
		if(document.getElementById("__wps_scrollbarMarkers")){
			document.getElementById("__wps_scrollbarMarkers").remove();
		}
	}
}
