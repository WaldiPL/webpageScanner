(function(){
	const oBody = document.body.innerHTML.toString();
	const nBody = oBody.replace(/__MSG_(\w+)__/g,(match,s1)=>{
		return s1 ? browser.i18n.getMessage(s1) : "";
	});
	if(nBody!=oBody){
		document.body.innerHTML = nBody;
	}
})();