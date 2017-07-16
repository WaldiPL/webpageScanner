const extURL=browser.extension.getURL("");

(function(){
	if(!document.getElementById("scanSite"))return;
	translate();
	document.getElementById("scanSite").addEventListener("click",scanSite);
	document.getElementById("addSite").addEventListener("click",addSite);
	document.getElementById("openSite").addEventListener("click",openSite);
	document.getElementById("showAdd").addEventListener("click",showAdd);
	document.getElementById("editCancel").addEventListener("click",hideAll);
	document.getElementById("addCancel").addEventListener("click",hideAll);
	document.getElementById("deleteCancel").addEventListener("click",hideAll);
	document.getElementById("options").addEventListener("click",()=>{browser.runtime.openOptionsPage();});
	window.addEventListener('contextmenu',e=>{e.preventDefault();});
	document.getElementById("lista").addEventListener('contextmenu',e=>{context(e);});
	listSite();
})();

function context(e){
	const a=e.target.parentElement;
	const id=parseInt(a.getAttribute("id").substr(4));
	const c=document.getElementById(`edititem${id}`);
	if(!c){
		let eInput=document.createElement('input');
			eInput.className="editSite";
			eInput.id=`edititem${id}`;
			eInput.type="image";
			eInput.src="icons/edit.svg";
			eInput.title=i18n("edit");
			eInput.addEventListener('click',()=>{
				showEdit(id);
			});
		let dInput=document.createElement('input');
			dInput.className="deleteSite";
			dInput.id=`deleteitem${id}`;
			dInput.type="image";
			dInput.src="icons/delete.svg";
			dInput.title=i18n("delete");
			dInput.addEventListener('click',()=>{
				showDelete(id);
			});
		a.insertBefore(dInput,a.firstChild);
		a.insertBefore(eInput,dInput);
	}
}

function listSite(){
	browser.storage.local.get('sites').then(result=>{
		document.getElementById("lista").textContent="";
		const sites=result.sites;
		const list = document.getElementById("lista");
		sites.forEach((value,i)=>{
			let iLi=document.createElement('li');
				iLi.id=`item${i}`;
				if(value.changed)iLi.className="changed";
			let iA=document.createElement('a');
				iA.textContent=value.title;
				iA.addEventListener('mouseup',e=>{
					if(e.button!=2){
						browser.tabs.create({
							url:`${extURL}view.html?${i}`,
							active:(e.button===1||(e.button===0&&e.ctrlKey===true))?false:true
						});
					}
					unchange([i]);
					iLi.classList.remove("changed");
				});
			let iImg=document.createElement('img');
				iImg.className="favicon";
				iImg.src=value.favicon;
			iA.insertBefore(iImg,iA.firstChild);
			iLi.appendChild(iA);
			list.appendChild(iLi);
		});
	});
}

function showEdit(e){
	hideAll("edit");
	browser.storage.local.get('sites').then(result=>{
		const table=result.sites;
		document.getElementById("editSite").addEventListener("click",()=>{editSite(e);});
		document.getElementById("editingSite").classList.remove("hidden");
		document.getElementById("eUrl").value=table[e].url;
		document.getElementById("eTitle").value=table[e].title;
		document.getElementById("eCharset").value=table[e].charset?table[e].charset:"utf-8";
		document.getElementById("eFreq").value=table[e].freq;
		document.getElementById("eMode").value=table[e].mode;
	});
}

function editSite(e){
	document.getElementById("editingSite").classList.add("hidden");
	browser.storage.local.get('sites').then(result=>{
		let sites=result.sites;
		let obj={
			title:  document.getElementById("eTitle").value,
			url:    document.getElementById("eUrl").value,
			mode:   document.getElementById("eMode").value,
			favicon:"https://icons.better-idea.org/icon?size=16..16..16&url="+document.getElementById("eUrl").value,
			freq:   parseInt(document.getElementById("eFreq").value),
			charset:document.getElementById("eCharset").value?document.getElementById("eCharset").value:"utf-8"
		}
		sites[e] = Object.assign(sites[e],obj);
		browser.storage.local.set({sites});
		statusbar(i18n("savedWebpage",sites[e].title));
		listSite();
	});
}

function showDelete(e){
	hideAll("delete");
	browser.storage.local.get('sites').then(result=>{
		const table=result.sites;
		document.getElementById("deleteSite").addEventListener("click",()=>{deleteSite(e);});
		document.getElementById("deletingSite").classList.remove("hidden");
		document.getElementById("deleteTitle").textContent=table[e].title;
		document.getElementById("deleteUrl").textContent=table[e].url;
	});
}

function deleteSite(e){
	document.getElementById("deletingSite").classList.add("hidden");
	browser.storage.local.get().then(result=>{
		let sites=result.sites;
		let changes=result.changes;
		statusbar(i18n("deletedWebpage",sites[e].title));
		sites.splice(e,1);
		changes.splice(e,1);
		browser.storage.local.set({sites:sites,changes:changes});
		listSite();
	}).then(()=>{
		browser.runtime.sendMessage({"deletedSite":true,"id":e});
	});
}

function showAdd(){
	hideAll("add");
	document.getElementById("addingSite").classList.toggle("hidden");
	document.getElementById("showAdd").classList.toggle("open");
	document.getElementById("aUrl").value="";
	document.getElementById("aTitle").value="";
	document.getElementById("aFreq").value="8";
	document.getElementById("aMode").value="m0";
}

function addSite(){
	const url=document.getElementById("aUrl").value;
	const title=document.getElementById("aTitle").value;
	const mode=document.getElementById("aMode").value;
	const freq=parseInt(document.getElementById("aFreq").value);
	rqstAdd(url,title,mode,freq);
	document.getElementById("addingSite").classList.add("hidden");
	document.getElementById("showAdd").classList.remove("open");
}

function hideAll(e){
	if(e!="add"){
		document.getElementById("addingSite").classList.add("hidden");
		document.getElementById("aUrl").value="";
		document.getElementById("aTitle").value="";
		document.getElementById("aFreq").value="8";
		document.getElementById("aMode").value="m0";
		document.getElementById("showAdd").classList.remove("open");
	}
	if(e!="edit"){
		document.getElementById("editingSite").classList.add("hidden");
		document.getElementById("eUrl").value="";
		document.getElementById("eTitle").value="";
		document.getElementById("eCharset").value="";
		document.getElementById("eFreq").value="8";
		document.getElementById("eMode").value="m0";
	}
	if(e!="delete"){
		document.getElementById("deletingSite").classList.add("hidden");
		document.getElementById("deleteTitle").textContent="";
		document.getElementById("deleteUrl").textContent="";
	}
}

function statusbar(e,aHide){
	document.getElementById("statusbar").innerHTML=e;
	if(!aHide){
		setTimeout(()=>{document.getElementById("statusbar").textContent="";},5000);
	}
}

browser.runtime.onMessage.addListener(run);
function run(m){
  if(m.listSite)listSite();
}

function translate(){
	document.title=i18n("extensionName");
	document.getElementById("addCancel").textContent=i18n("cancel");
	document.getElementById("addSite").textContent=i18n("add");
	document.getElementById("editCancel").textContent=i18n("cancel");
	document.getElementById("editSite").textContent=i18n("save");
	document.getElementById("deleteCancel").textContent=i18n("cancel");
	document.getElementById("deleteSite").textContent=i18n("delete");
	document.getElementById("scanSite").title=i18n("scanWebpage");
	document.getElementById("openSite").title=i18n("openWebpage");
	document.getElementById("showAdd").title=i18n("addWebpage");
	document.getElementById("options").title=i18n("options");
	document.getElementById("addWebpage").textContent=i18n("addWebpage");
	document.getElementById("addressA").textContent=i18n("address");
	document.getElementById("titleA").textContent=i18n("title");
	document.getElementById("scanFreqA").textContent=i18n("scanFreq");
	document.getElementById("addressE").textContent=i18n("address");
	document.getElementById("titleE").textContent=i18n("title");
	document.getElementById("scanFreqE").textContent=i18n("scanFreq");
	document.getElementById("charsetE").textContent=i18n("charset");
	document.getElementById("editWebpage").textContent=i18n("editWebpage");
	document.getElementById("modeTitleA").textContent=i18n("modeTitle");
	document.getElementById("modeTitleE").textContent=i18n("modeTitle");
	document.getElementById("deleteWebpage").textContent=i18n("deleteWebpage");
	let selectFreqA=document.getElementById("aFreq").options;
	selectFreqA[0].text=i18n("1Hour");
	selectFreqA[1].text=i18n("4Hours");
	selectFreqA[2].text=i18n("8Hours");
	selectFreqA[3].text=i18n("12Hours");
	selectFreqA[4].text=i18n("24Hours");
	let selectModeA=document.getElementById("aMode").options;
	selectModeA[0].text=i18n("modeM0");
	selectModeA[1].text=i18n("modeM3");
	selectModeA[2].text=i18n("modeM4");
	selectModeA[3].text=i18n("modeM1");
	selectModeA[4].text=i18n("modeM2");
	let selectFreqE=document.getElementById("eFreq").options;
	selectFreqE[0].text=i18n("1Hour");
	selectFreqE[1].text=i18n("4Hours");
	selectFreqE[2].text=i18n("8Hours");
	selectFreqE[3].text=i18n("12Hours");
	selectFreqE[4].text=i18n("24Hours");
	let selectModeE=document.getElementById("eMode").options;
	selectModeE[0].text=i18n("modeM0");
	selectModeE[1].text=i18n("modeM3");
	selectModeE[2].text=i18n("modeM4");
	selectModeE[3].text=i18n("modeM1");
	selectModeE[4].text=i18n("modeM2");
}
