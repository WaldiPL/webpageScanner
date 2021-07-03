"use strict";

let bookmarksToAdd=[],
	bookmarksNotAdded,
	bookmarkSecondTry=false,
	folderListId,
	overlayText=document.getElementById("dropArea");

browser.runtime.onMessage.addListener(run);
function run(m){
	if(m.nextBookmark&&bookmarksToAdd.length){
		let bookmarkId=m.nextBookmark;
		if(m.errorBookmark)bookmarksNotAdded.push(bookmarksToAdd[bookmarkId-1]);
		if(bookmarkId<bookmarksToAdd.length){
			browser.runtime.sendMessage({
				"addThis":true,
				"url":bookmarksToAdd[bookmarkId].url,
				"title":bookmarksToAdd[bookmarkId].title,
				"folder":folderListId,
				"addBookmark":bookmarkId
			}).then(()=>{},err=>{
				console.warn(err);
			});
			dropOverlay.classList.remove("none");
			overlayText.textContent=i18n("importing",[bookmarkId+1,bookmarksToAdd.length,bookmarksToAdd[bookmarkId].title])
		}else{
			if(bookmarksNotAdded.length){
				if(bookmarkSecondTry){
					dropOverlay.classList.add("none");
					statusbar(i18n("importOK"));
					bookmarksNotAdded=[];
					bookmarksToAdd=[];
				}else{
					bookmarkSecondTry=true;
					bookmarksToAdd=bookmarksNotAdded;
					bookmarksNotAdded=[];
					browser.runtime.sendMessage({
						"addThis":true,
						"url":bookmarksToAdd[0].url,
						"title":bookmarksToAdd[0].title,
						"folder":folderListId,
						"addBookmark":0
					}).then(()=>{},err=>{
						console.warn(err);
					});
				}
			}else{
				dropOverlay.classList.add("none");
				statusbar(i18n("importOK"));
				bookmarksNotAdded=[];
				bookmarksToAdd=[]
			}
		}
	}
}

function importingStart(folderId){
	bookmarkSecondTry=false;
	bookmarksNotAdded=[];
	browser.bookmarks.getSubTree(folderId).then(bookmarksTree=>{
		bookmarksToAdd=flatBookmarks(bookmarksTree[0]);
		if(bookmarksToAdd.length){
			dropOverlay.classList.remove("none");
			overlayText.textContent=i18n("importing",[1,bookmarksToAdd.length,bookmarksToAdd[0].title])
			browser.storage.local.get('sort').then(result=>{
				let sort=result.sort;
				folderListId=`folder${new Date().getTime()}`;
				sort.push([folderListId,"root","folder",bookmarksTree[0].title,false]);
				browser.storage.local.set({sort}).then(()=>{
					browser.runtime.sendMessage({
						"addThis":true,
						"url":bookmarksToAdd[0].url,
						"title":bookmarksToAdd[0].title,
						"folder":folderListId,
						"addBookmark":0
					}).then(()=>{},err=>{
						console.warn(err);
					});
				},err=>{console.error(err);});
			},err=>{
				console.error(err);
			});
		}else{
			statusbar(i18n("emptyFolder"));
		}
	},err=>{
		console.warn(err);
	});
}

function flatBookmarks(folder){
	let arr=[];
	folder.children.forEach(e=>{
		if(e.type==="bookmark"){
			arr.push(e);
		}else if(e.type==="folder"){
			let flat=flatBookmarks(e);
			arr.push(flat);
		}
	});
	return arr.flat(Infinity);
}
