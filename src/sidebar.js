var prevContext;

(function(){
	if(!document.getElementById("scanSites"))return;
	translate();
	document.getElementById("scanSites").addEventListener("click",scanSites);
	document.getElementById("addSite").addEventListener("click",addSite);
	getSettings().then(s=>{
		let openSiteBtn=document.getElementById("openSite");
		if(!s.autoOpen){
			openSiteBtn.removeAttribute("class");
			openSiteBtn.addEventListener("click",openSite);
		}
		if(s.theme==="dark")document.documentElement.className="dark";
	});
	document.getElementById("showAdd").addEventListener("click",showAdd);
	document.getElementById("addFolder").addEventListener("click",showAddFolder);
	document.getElementById("addSaveF").addEventListener("click",e=>{addFolder(document.getElementById("nameFolderA").value);document.getElementById("addingFolder").classList.add("hidden");});
	document.getElementById("editCancel").addEventListener("click",hideAll);
	document.getElementById("addCancel").addEventListener("click",hideAll);
	document.getElementById("addCancelF").addEventListener("click",hideAll);
	document.getElementById("deleteCancel").addEventListener("click",hideAll);
	document.getElementById("editCancelF").addEventListener("click",hideAll);
	document.getElementById("deleteCancelF").addEventListener("click",hideAll);
	document.getElementById("options").addEventListener("click",()=>{browser.runtime.openOptionsPage();});
	window.addEventListener('contextmenu',e=>{if(!(e.target.tagName==="INPUT"&&(e.target.type==="text"||e.target.type==="number")))e.preventDefault();});
	document.addEventListener('selectstart',e=>{if(!(e.target.tagName==="INPUT"&&(e.target.type==="text"||e.target.type==="number")))e.preventDefault();});
	document.getElementById("lista").addEventListener('contextmenu',context);
	document.getElementById("fillForm").addEventListener("click",fillForm);
	document.getElementById("statusbar").addEventListener("mousemove",e=>{e.target.removeAttribute("class");});
	document.getElementById("editSite").addEventListener("click",e=>{editSite(e.target.dataset.id);});
	document.getElementById("deleteSite").addEventListener("click",e=>{deleteSite(parseInt(e.target.dataset.id));});
	document.getElementById("editSaveF").addEventListener("click",e=>{editFolder(e.target.dataset.id);});
	document.getElementById("deleteSaveF").addEventListener("click",e=>{deleteFolder(e.target.dataset.id);});
	listSite();
})();

function context(e){
	const a=e.target.parentElement;
	if(a.tagName==="A")return;
	if(a.classList.contains("folder")){
		const id=parseInt(a.getAttribute("id").substr(6)),
			  c=document.getElementById(`editFolder${id}`);
		if(!c){
			hideAll();
			removeContext();
			let dInput=document.createElement('img');
				dInput.className="deleteFolder";
				dInput.id=`deleteFolder${id}`;
				dInput.src="icons/delete.svg";
				dInput.title=i18n("delete");
				dInput.addEventListener('click',()=>{
					showDeleteFolder(`folder${id}`,e.target.childNodes[1].textContent);
				});
			let eInput=document.createElement('img');
				eInput.className="editFolder";
				eInput.id=`editFolder${id}`;
				eInput.src="icons/edit.svg";
				eInput.title=i18n("edit");
				eInput.addEventListener('click',()=>{
					showEditFolder(`folder${id}`,e.target.childNodes[1].textContent);
				});
			e.target.appendChild(dInput);
			e.target.appendChild(eInput);
			prevContext=id;
		}
	}else{
		const id=parseInt(a.getAttribute("id").substr(4)),
			  c=document.getElementById(`edititem${id}`);
		if(!c){
			hideAll();
			removeContext();
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
			let sInput=document.createElement('input');
				sInput.className="scanPage";
				sInput.id=`scanitem${id}`;
				sInput.type="image";
				sInput.src="icons/scan2.svg";
				sInput.title=i18n("scanWebpage");
				browser.storage.local.get('sites').then(result=>{
					let local=result.sites[id];
					sInput.addEventListener('click',()=>{
						scanPage(local,id,false,true);
					});
				});
			a.insertBefore(dInput,a.firstChild);
			a.insertBefore(eInput,dInput);
			a.insertBefore(sInput,eInput);
			prevContext=id;
		}
	}
}

function removeContext(){
	if(prevContext!=undefined){
		if(prevContext<10000){
			let aParent=document.getElementById(`item${prevContext}`),
				e1=document.getElementById(`edititem${prevContext}`),
				e2=document.getElementById(`deleteitem${prevContext}`),
				e3=document.getElementById(`scanitem${prevContext}`);
			aParent.removeChild(e1);
			aParent.removeChild(e2);
			aParent.removeChild(e3);
		}else{
			let aParent=document.getElementById(`folder${prevContext}`).firstElementChild,
				e1=document.getElementById(`editFolder${prevContext}`),
				e2=document.getElementById(`deleteFolder${prevContext}`);
			aParent.removeChild(e1);
			aParent.removeChild(e2);
		}
	}
}

function listSite(send){
	if(send)browser.runtime.sendMessage({"listSite":true});
	browser.storage.local.get(['sites','sort']).then(result=>{
		prevContext=undefined;
		document.getElementById("lista").textContent="";
		const sites=result.sites,
			  sort=result.sort,
			  list=document.getElementById("lista");
		let lastFolder;
		sort.forEach((value,i)=>{
			if(value[2]==="item"){
				let id=parseInt(value[0].substr(4));
				let iLi=document.createElement('li');
					iLi.id=value[0];
					iLi.dataset.row="a"+i;
					iLi.dataset.folder=value[1];
					iLi.draggable=true;
					if(sites[id].changed)iLi.className="changed";
					iLi.addEventListener('dragstart',dragStart);
				let iA=document.createElement('a');
				iA.textContent=sites[id].title;
				iA.addEventListener('mouseup',e=>{
					if(e.button!=2){
						if(e.target.parentNode.classList.contains("changed"))updateBadge(-1);
						browser.tabs.create({
							url:`${extURL}view.html?${id}`,
							active:(e.button===1||(e.button===0&&e.ctrlKey===true))?false:true
						});
						unchange([id]);
						iLi.classList.remove("changed");
					}
				});
				let iImg=document.createElement('img');
					iImg.className="favicon";
					iImg.src=sites[id].favicon;
					iImg.draggable=false;
				iA.insertBefore(iImg,iA.firstChild);
				iLi.appendChild(iA);
				if(value[1]==="root"){
					list.appendChild(iLi);
				}else
					lastFolder.appendChild(iLi);
			}else{
				let iUl=document.createElement('ul');
					iUl.id=value[0];
					iUl.dataset.row="a"+i;
					iUl.dataset.folder="root";
					iUl.draggable=true;
					iUl.addEventListener('dragstart',dragStart);
					iUl.className=value[4]?"folder collapsed":"folder";
				let iA=document.createElement('a');
					iA.textContent=value[3];
				let iImg=document.createElement('img');
					iImg.className="folderIcon";
					iImg.src="icons/blank.svg";
					iImg.draggable=false;
				iUl.addEventListener("click",e=>{
					e.target.parentElement.classList.toggle("collapsed");
					saveSort();
				});
				iImg.addEventListener("click",e=>{
					e.target.parentElement.parentElement.classList.toggle("collapsed");
					saveSort();
				});
				iA.insertBefore(iImg,iA.firstChild);
				iUl.appendChild(iA);
				list.appendChild(iUl);
				lastFolder=iUl;
			}
		});
	});
}

function showAddFolder(){
	hideAll("addFolder");
	document.getElementById("addFolderTitle").textContent=i18n("addFolder");
	document.getElementById("nameFolderA").value="";
	document.getElementById("addingFolder").classList.remove("hidden");
}

function showEditFolder(id,name){
	hideAll("editFolder");
	document.getElementById("editSaveF").dataset.id=id;
	document.getElementById("nameFolder").value=name;
	document.getElementById("editingFolder").classList.remove("hidden");
}

function editFolder(id){
	let newName=document.getElementById("nameFolder").value;
	newName=newName?newName:i18n("newFolder");
	document.getElementById("editingFolder").classList.add("hidden");
	document.getElementById(id).firstElementChild.childNodes[1].textContent=newName;
	saveSort();
	statusbar(i18n("savedWebpage",newName));
}

function showDeleteFolder(id,name){
	hideAll("deleteFolder");
	document.getElementById("deleteSaveF").dataset.id=id;
	document.getElementById("deleteFolderName").textContent=name;
	document.getElementById("deletingFolder").classList.remove("hidden");
}

function deleteFolder(id){
	let name=document.getElementById("deleteFolderName").textContent;
	document.getElementById("deletingFolder").classList.add("hidden");
	browser.storage.local.get('sort').then(result=>{
		let sort=result.sort;
		sort.forEach((value,i)=>{
			if(value[0]===id)
				sort.splice(i,1);
		});	
		sort.forEach((value,i)=>{
			if(value[1]===id)
				sort[i][1]="root";
		});
		browser.storage.local.set({sort});
		statusbar(i18n("deletedWebpage",name));
		listSite(true);
	});
}

function showEdit(e){
	hideAll("edit");
	browser.storage.local.get('sites').then(result=>{
		const table=result.sites;
		document.getElementById("editSite").dataset.id=e;
		document.getElementById("editingSite").classList.remove("hidden");
		document.getElementById("eUrl").value=table[e].url;
		document.getElementById("eTitle").value=table[e].title;
		document.getElementById("eCharset").value=table[e].charset?table[e].charset:"utf-8";
		const freq=table[e].freq;
		let multi;
		if(freq>=168)
			multi=168;
		else if(freq>=24)
			multi=24;
		else
			multi=1;
		document.getElementById("eFreq").value=parseInt(freq/multi);
		document.getElementById("eMulti").value=multi;		
		document.getElementById("eMode").value=table[e].mode;
	});
}

function editSite(e){
	document.getElementById("editingSite").classList.add("hidden");
	browser.storage.local.get('sites').then(result=>{
		let sites=result.sites,
			freq=parseInt(document.getElementById("eFreq").value);
		let obj={
			title:	document.getElementById("eTitle").value,
			url:	document.getElementById("eUrl").value,
			mode:	document.getElementById("eMode").value,
			favicon:"https://icons.better-idea.org/icon?size=16..16..16&url="+document.getElementById("eUrl").value,
			freq:	freq>0?freq*parseInt(document.getElementById("eMulti").value):8,
			charset:document.getElementById("eCharset").value?document.getElementById("eCharset").value:"utf-8"
		}
		sites[e]=Object.assign(sites[e],obj);
		browser.storage.local.set({sites});
		statusbar(i18n("savedWebpage",sites[e].title));
		listSite(true);
	});
}

function showDelete(e){
	hideAll("delete");
	browser.storage.local.get('sites').then(result=>{
		const sites=result.sites;
		document.getElementById("deleteSite").dataset.id=e;
		document.getElementById("deleteTitle").textContent=sites[e].title;
		document.getElementById("deleteUrl").textContent=sites[e].url;
		document.getElementById("deletingSite").classList.remove("hidden");
	});
}

function deleteSite(e){
	document.getElementById("deletingSite").classList.add("hidden");
	browser.storage.local.get(['sites','changes','sort']).then(result=>{
		let sites=result.sites,
			changes=result.changes,
			sort=result.sort,
			sSort;
		statusbar(i18n("deletedWebpage",sites[e].title));
		sites.splice(e,1);
		changes.splice(e,1);
		if(sort){
			sort.forEach((value,i)=>{
				id=parseInt(value[0].substr(4));
				if(id===e)sSort=i;
				else if(id>e)sort[i][0]=`item${id-1}`;
			});
			sort.splice(sSort,1);
		}
		browser.storage.local.set({sites:sites,changes:changes,sort:sort});
		listSite(true);
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
	document.getElementById("aFreq").value=8;
	document.getElementById("aMulti").value=1;
	document.getElementById("aMode").value="m0";
}

function addSite(){
	const url=document.getElementById("aUrl").value,
		  title=document.getElementById("aTitle").value,
		  mode=document.getElementById("aMode").value,
		  aFreq=parseInt(document.getElementById("aFreq").value);
		  freq=aFreq>0?aFreq*parseInt(document.getElementById("aMulti").value):8;
	rqstAdd(url,title,mode,freq);
	document.getElementById("addingSite").classList.add("hidden");
	document.getElementById("showAdd").classList.remove("open");
}

function fillForm(){
	browser.tabs.query({currentWindow:true,active:true}).then(tabs=>{
		let tab=tabs[0];
		document.getElementById("aUrl").value=tab.url;
		document.getElementById("aTitle").value=tab.title;
	});
}

function hideAll(e){
	if(e!="add"){
		document.getElementById("addingSite").classList.add("hidden");
		document.getElementById("aUrl").value="";
		document.getElementById("aTitle").value="";
		document.getElementById("aFreq").value=8;
		document.getElementById("aMulti").value=1;
		document.getElementById("aMode").value="m0";
		document.getElementById("showAdd").classList.remove("open");
	}
	if(e!="edit"){
		document.getElementById("editingSite").classList.add("hidden");
		document.getElementById("eUrl").value="";
		document.getElementById("eTitle").value="";
		document.getElementById("eCharset").value="";
		document.getElementById("eFreq").value=8;
		document.getElementById("eMulti").value=1;
		document.getElementById("eMode").value="m0";
	}
	if(e!="delete"){
		document.getElementById("deletingSite").classList.add("hidden");
		document.getElementById("deleteTitle").textContent="";
		document.getElementById("deleteUrl").textContent="";
	}
	if(e!="addFolder"){
		document.getElementById("addingFolder").classList.add("hidden");
		document.getElementById("nameFolderA").value="";
	}
	if(e!="editFolder"){
		document.getElementById("editingFolder").classList.add("hidden");
		document.getElementById("nameFolder").value="";
	}
	if(e!="deleteFolder"){
		document.getElementById("deletingFolder").classList.add("hidden");
		document.getElementById("deleteFolderName").textContent="";
	}
}

function statusbar(e){
	let statusbar=document.getElementById("statusbar");
	statusbar.textContent=e;
	statusbar.className="visible"
	setTimeout(()=>{if(statusbar.textContent===e)statusbar.removeAttribute("class");},5000);
}

browser.runtime.onMessage.addListener(run);
function run(m){
	if(m.listSite)listSite();
}

function translate(){
	document.title=i18n("extensionName");
	document.getElementById("addCancel").textContent=i18n("cancel");
	document.getElementById("addSite").textContent=i18n("add");
	document.getElementById("addSaveF").textContent=i18n("add");
	document.getElementById("fillForm").textContent=i18n("fillForm");
	document.getElementById("editCancel").textContent=i18n("cancel");
	document.getElementById("editSite").textContent=i18n("save");
	document.getElementById("deleteCancel").textContent=i18n("cancel");
	document.getElementById("deleteSite").textContent=i18n("delete");
	document.getElementById("scanSites").title=i18n("scanWebpage");
	document.getElementById("openSite").title=i18n("openWebpage");
	document.getElementById("showAdd").title=i18n("addWebpage");
	document.getElementById("addFolder").title=i18n("addFolder");
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
	document.getElementById("editFolder").textContent=i18n("editFolder");
	document.getElementById("nFolder").textContent=i18n("name");
	document.getElementById("nFolderA").textContent=i18n("name");
	document.getElementById("addCancelF").textContent=i18n("cancel");
	document.getElementById("editCancelF").textContent=i18n("cancel");
	document.getElementById("editSaveF").textContent=i18n("save");
	document.getElementById("deleteFolder").textContent=i18n("deleteFolder");
	document.getElementById("deleteFolderDesc").textContent=i18n("deleteFolderDesc");
	document.getElementById("deleteCancelF").textContent=i18n("cancel");
	document.getElementById("deleteSaveF").textContent=i18n("delete");
	let selectMultiA=document.getElementById("aMulti").options;
		selectMultiA[0].text=i18n("hours");
		selectMultiA[1].text=i18n("days");
		selectMultiA[2].text=i18n("weeks");
	let selectModeA=document.getElementById("aMode").options;
		selectModeA[0].text=i18n("modeM0");
		selectModeA[1].text=i18n("modeM3");
		selectModeA[2].text=i18n("modeM4");
		selectModeA[3].text=i18n("modeM1");
		selectModeA[4].text=i18n("modeM2");
	let selectMultiE=document.getElementById("eMulti").options;
		selectMultiE[0].text=i18n("hours");
		selectMultiE[1].text=i18n("days");
		selectMultiE[2].text=i18n("weeks");
	let selectModeE=document.getElementById("eMode").options;
		selectModeE[0].text=i18n("modeM0");
		selectModeE[1].text=i18n("modeM3");
		selectModeE[2].text=i18n("modeM4");
		selectModeE[3].text=i18n("modeM1");
		selectModeE[4].text=i18n("modeM2");
}
