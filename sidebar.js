(function(){
	if(!document.getElementById("scanSite"))return;
	document.getElementById("scanSite").addEventListener("click",scanSite);
	document.getElementById("addSite").addEventListener("click",addSite);
	document.getElementById("openSite").addEventListener("click",openSite);
	document.getElementById("showAdd").addEventListener("click",showAdd);
	document.getElementById("editCancel").addEventListener("click",hideAll);
	document.getElementById("addCancel").addEventListener("click",hideAll);
	document.getElementById("deleteCancel").addEventListener("click",hideAll);
	window.addEventListener('contextmenu', function(e){
		context(e);
		e.preventDefault();
	});
	listSite();
})();

function context(e){
	const a=e.target.parentElement;
	const id=a.getAttribute("id");
	const b=`<input class='editSite' id='edit${id}' type='image' src='icons/edit.png' title='${i18n("edit")}'><input class='deleteSite' id='delete${id}' type='image' src='icons/delete.png' title='${i18n("delete")}'>`;
	const c=document.getElementById("edit"+id);
	const d=e.target.toString().substr(0, 13)
	if(!c&&d=="moz-extension"){a.innerHTML=b+a.innerHTML;
		document.getElementById("edit"+id).addEventListener('click',function(){
			const j=this.getAttribute("id").substr(8);
			showEdit(j);
		});
		document.getElementById("delete"+id).addEventListener('click',function(){
			const k=this.getAttribute("id").substr(10);
			showDelete(k);
		});
	}
}

function listSite(){
	browser.storage.local.get('sites').then(result=>{
		document.getElementById("lista").innerHTML="";
		const sites=result.sites;
		const list = document.getElementById("lista");
		sites.forEach((value,i)=>{
			let changed=value.changed;
			let changeds=changed?"class='changed'":"";
			list.innerHTML+=`<li id='item${i}' ${changeds}><a href='view.html?${i}' target='_blank'><img class='favicon' src='${value.favicon}'/>${value.title}</a></li>`;
		});
	}).then(()=>{
		const aElm=document.getElementsByTagName("a");
		[...aElm].forEach(value=>{
		  value.addEventListener('mouseup',e=>{
			  if(e.button===2)return;
			  let elm=e.target.parentElement;
			  let id=elm.id.substr(4);
			  unchange([id]);
			  elm.classList.remove("changed");
		  });
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
		document.getElementById("deleteTitle").innerHTML=table[e].title;
		document.getElementById("deleteUrl").innerHTML=table[e].url;
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
		document.getElementById("deleteTitle").innerHTML="";
		document.getElementById("deleteUrl").innerHTML="";
	}
}

function statusbar(e,aHide){
	document.getElementById("statusbar").innerHTML=e;
	if(!aHide){
		setTimeout(()=>{document.getElementById("statusbar").innerHTML="";},5000);
	}
}

browser.runtime.onMessage.addListener(run);
function run(m){
  if(m.listSite)listSite();
}