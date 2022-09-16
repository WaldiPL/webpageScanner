"use strict";

let db,mode;

function getDB(){
	if(mode!==undefined)return mode;
	const request=indexedDB.open("WPS");
	return new Promise((resolve,reject)=>{
		request.onerror=(e)=>{
			console.warn(e.target.error);
			mode=false;
			resolve(false);
		};
		request.onsuccess=(e)=>{
			db=e.target.result;
			mode=true;
			resolve(true);
		};
		request.onupgradeneeded=(e)=>{
		  db=e.target.result;
		  db.createObjectStore("changes",{keyPath:"uniq"});
		};
	});
}

async function getChanges(index){
	if(await getDB()){
		const tx=db.transaction("changes","readonly");
		const store=tx.objectStore("changes");
		const request=store.get(index);
		return new Promise((resolve,reject)=>{
			tx.onerror=(e)=>{
				console.error(e.target.error);
			};
			request.onsuccess=(e)=>{
				resolve(e.target.result);
			};
		});
	}else{
		return await browser.runtime.sendMessage({
			"getChanges":true,
			"index":index
		});
	}
}

async function getAllChanges(){
	if(await getDB()){
		const tx=db.transaction("changes","readonly");
		const store=tx.objectStore("changes");
		const request=store.getAll();
		return new Promise((resolve,reject)=>{
			tx.onerror=(e)=>{
				console.error(e.target.error);
			};
			request.onsuccess=(e)=>{
				resolve(e.target.result);
			};
		});
	}else{
		return await browser.runtime.sendMessage({
			"getAllChanges":true
		});
	}
}

async function setChanges(data){
	if(await getDB()){
		const tx=db.transaction("changes","readwrite");
		const store=tx.objectStore("changes");
		store.put(data);
		return new Promise((resolve,reject)=>{
			tx.onerror=(e)=>{
				console.error(e.target.error);
			};
			tx.oncomplete=(e)=>{
				resolve(true);
			};
		});
	}else{
		return await browser.runtime.sendMessage({
			"setChanges":true,
			"record":data
		});
	}
}

async function deleteChanges(index){
	if(await getDB()){
		const tx=db.transaction("changes","readwrite");
		const store=tx.objectStore("changes");
		store.delete(index);
		return new Promise((resolve,reject)=>{
			tx.onerror=(e)=>{
				console.error(e.target.error);
			};
			tx.oncomplete=(e)=>{
				resolve(true);
			};
		});
	}else{
		return await browser.runtime.sendMessage({
			"deleteChanges":true,
			"index":index
		});
	}
}

async function clearChanges(){
	if(await getDB()){
		const tx=db.transaction("changes","readwrite");
		const store=tx.objectStore("changes");
		store.clear();
		return new Promise((resolve,reject)=>{
			tx.onerror=(e)=>{
				console.error(e.target.error);
				resolve(false);
			};
			tx.oncomplete=(e)=>{
				resolve(true);
			};
		});
	}else{
		return await browser.runtime.sendMessage({
			"clearChanges":true
		});
	}
}
