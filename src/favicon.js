function favicon64(url,mode){
	return new Promise((resolve,reject)=>{
		let img=new Image();
		
		img.onload=e=>{
			let canvas=document.createElement("canvas"),
				ctx=canvas.getContext("2d");
			canvas.width=16;
			canvas.height=16;
			ctx.drawImage(e.target,0,0,16,16);
			let dataURL=canvas.toDataURL();
			if(dataURL==="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACFElEQVQ4ja2TP2vbYBDGs+ZDeMqnyOIhg2dbTbbIqrM08h9oauPaVTFq2hpDaTZTPIQkeJCd4YVYJpVolYARuCUitIOEQWAkQ1KIBUKQkCEWT4cg1U7cqT246b3nx929zy0s/K9YXttZjMbqkTLfpfKvO8pGru2tMgf+KnPgp7JtL891lCLfpaKxemR5bWfxkXgl3ljKFUktlW4Z7z98cZrkHLvtMzTJOVTNRqUqO0lWMHIFUluJN5ZmINFYPZIrkNpG9nD0sdEDkXTIPRNj9xbWhQcAuLy6gdwzwbDCKFMgtWisHgkBRb5LJVnBUDUbRNJBJB2iMoCoDELAxAdO+kOc9oegWcEo8l0qBOS5jlKpys7ERwgI0ru+AwB413cgko4fxi9w7yRniztSQkAq2/ZUzQ6LHoqDDnRzDCLpUDUbTLrlhYAnyX3ftFwAgNwzoZvjGXEQJ/0hiKTDtFxQ63v+DODy6iZsNVjgPICoDGBaLhLTgKeZlqdq9kyxqtlhBnAAGLu3UDUbSVb4M0Ke6yh8VXamAQ/38f3nRfj2ku86z8tTSyy9ERPBN/4NQCQdE/++M3pTMEoVMfHISAwrjKYhpuWGYtNy78XP5hgpsHKmQGo0Kxjl7WNH1Wyc9ofYbZ/hU/MbytufHXpTMDLzrDx9TKWKmNjijhQm3fIoet9PrO/5SVbwXrzqfC2/PY7PPaZ/id9i4TQ7pxqOTwAAAABJRU5ErkJggg=="||
			   dataURL==="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAWUlEQVQ4jWNgwAKmTJmyffLkyYeQ8ZQpU7ZjU0tQI9EGEdKIjkm2Ga9L8NlC0BW4bCfGe1OmTNlO2AZCriQlsOhvAFFeoDgQKY5GqiQkipMyKS4hO1fi0ggAjtjR5IvLbM4AAAAASUVORK5CYII="){
				dataURL=nativeFavicon(url);
			}
			resolve(dataURL);
		};
		
		img.onerror=()=>{
			resolve(nativeFavicon(url));
		};
		
		switch(mode){
		case "google":
			img.src=`https://www.google.com/s2/favicons?domain=${url.split("://")[1]}`;
			break;
		case "duckduckgo":
			img.src=`https://proxy.duckduckgo.com/ip3/${url.split("://")[1]}.ico`;
			break;
		case "original":
			img.src=url;
			break;
		default:
			let u=url.split("/");
			img.src=`${u[0]}//${u[2]}/favicon.ico`;
		}
	});
}

function nativeFavicon(url){
	let letter,letter2;
	if(url.startsWith("http")){
		letter2=url.split("/")[2].split("."),
		letter=letter2[letter2.length-2][0].toUpperCase();
	}else{
		letter=url[0];
	}
	let bgColors=["#0a84ff","#008ea4","#ed00b5","#058b00","#a47f00","#ff0039","#9400ff","#a44900","#363959","#737373"];
	
	let canvas=document.createElement("canvas"),
			ctx=canvas.getContext("2d");
		canvas.width=16;
		canvas.height=16;
		ctx.fillStyle=bgColors[Math.trunc(Math.random()*10)];
		ctx.fillRect(0,0,16,16); 
		ctx.font="11px Segoe UI,Tahoma,Helvetica Neue,Lucida Grande,Ubuntu,sans-serif";
		ctx.fillStyle="#fff";
		ctx.textAlign="center";
		ctx.fillText(letter,8,12); 
		ctx.drawImage(canvas,0,0,16,16);
		let dataURL=canvas.toDataURL();
		return dataURL;
}
