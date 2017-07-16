(function(){
	browser.storage.local.get('sites').then(result=>{
		if(result.sites===undefined){
		  browser.storage.local.set({sites:[],changes:[]});
		}
	});
	browser.storage.local.get('settings').then(result=>{
		if(result.settings===undefined){
			browser.storage.local.set({settings:{
				"notificationVolume":60,
				"notificationTime":10000,
				"showNotification":true,
				"autoOpen":false,
				"hideHeader":false,
				"defaultView":"light"
			}});
		}
	});
	scanLater(3);
})();

browser.alarms.onAlarm.addListener((alarm)=>{
  scanLater(60);
  scanSite(0,true);
});

browser.runtime.onMessage.addListener(run);
function run(m){
  if(m.addThis)rqstAdd(m.url,m.title,"m0",8,true,m.favicon);
  if(m.scanSite)scanSite(0,true,true);
}

browser.contextMenus.create({
  id: "addThis",
  title: browser.i18n.getMessage("addThis"),
  contexts: ["page"]
});

browser.contextMenus.onClicked.addListener((info,tab)=>{
  if(info.menuItemId=="addThis"){
	rqstAdd(tab.url,tab.title,"m0",8,true,tab.favicon);
	setTimeout(()=>{
		browser.runtime.sendMessage({"listSite":true});
	},7000);
  }
});
