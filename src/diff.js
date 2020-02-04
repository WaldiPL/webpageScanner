/*
 * Javascript Diff Algorithm
 *  By John Resig (http://ejohn.org/)
 *  Modified by Chu Alan "sprite"
 *  Modified by Waldemar B.
 *
 * Released under the MIT license.
 *
 * More Info:
 *  http://ejohn.org/projects/javascript-diff-algorithm/
 */
"use strict";

function diffString2(o,n){
	if(!n)return{o:o,n:"",c:""};
	let reg=[/[\n\f\r\u0020\u0009]*(<[^>]*>)[\n\f\r\u0020\u0009]*/,
			 /[<>{}]/,
			 /( )/,
			 /<\/a>/,
			 /<[^>]*>/,
			 /<[^>]*>|\s/,
			 /<a.*>/,
			 /<\/a>/],
		aN=[],
		aO=[],
		iN=n.split(reg[0]).filter(v=>{if(v)return v;}),
		iO=o.split(reg[0]).filter(v=>{if(v)return v;});
		iN.forEach(v=>{
			if(!reg[1].test(v)){
				v.split(reg[2]).forEach(w=>{
					aN.push(w);
				});
			}else
				aN.push(v);
		});
		iO.forEach(v=>{
			if(!reg[1].test(v)){
				v.split(reg[2]).forEach(w=>{
					aO.push(w);
				});
			}else
				aO.push(v);
		});
	diff(aO,aN);
	let os="",
		ns="",
		cs="";
	aO.forEach(v=>{
		if(v.text===undefined){
			os+=`<del>${v}</del>`;
		}
	});
	let openSpan=false,
		openA=false;
	aN.forEach(v=>{
		if(v.text!==undefined){
			if(openSpan)
				ns+="</span>";
			openSpan=false;
			ns+=v.text;
			if(openA&&reg[3].test(v.text)){
				ns+="</span>";
				openA=false;
			}
		}else{
			if(!reg[5].test(v)){
				if(!openSpan)
					ns+="<span class='__wps_changes'>";
				openSpan=true;
			}else if(reg[6].test(v)){
				if(openSpan)
					ns+="</span>";
				openSpan=false;
				if(!openA)
					ns+="<span class='__wps_changes'>";
				openA=true;
			}else if(reg[4].test(v)){
				if(openSpan)
					ns+="</span>";
				openSpan=false;
			}
			ns+=v;
			if(reg[7].test(v)){
				if(openA)
					ns+="</span>";
				openA=false;
			}
			cs+=v;
		}
	});
	return{o:os,n:ns,c:cs};
}

function diff(o,n){
	let ns={},
		os={},
		nl=n.length,
		ol=o.length;
	Object.setPrototypeOf(ns,null);
	Object.setPrototypeOf(os,null);
	n.forEach((v,i)=>{
		if(ns[v]===undefined)
			ns[v]={rows:[],o:null};
		ns[v].rows.push(i);
	});
	o.forEach((v,i)=>{
		if(os[v]===undefined)
			os[v]={rows:[],n:null};
		os[v].rows.push(i);
	});
	for(let i in ns){
		if(ns[i].rows.length===1&&typeof(os[i])!=="undefined"&&os[i].rows.length===1){
			const a=ns[i].rows[0],
				  b=os[i].rows[0];
			n[a]={text:n[a],row:b};
			o[b]={text:o[b],row:a};
		}
	}
	for(let i=0;i<nl-1;i++){
		if(n[i].text!==undefined&&n[i+1].text===undefined&&n[i].row+1<ol&&o[n[i].row+1].text===undefined&&n[i+1]===o[n[i].row+1]){
			n[i+1]={text:n[i+1],row:n[i].row+1};
			o[n[i].row+1]={text:o[n[i].row+1],row:i+1};
		}
	}
	for(let i=nl-1;i>0;i--){
		if(n[i].text!==undefined&&n[i-1].text===undefined&&n[i].row>0&&o[n[i].row-1].text===undefined&&n[i-1]===o[n[i].row-1]){
			n[i-1]={text:n[i-1],row:n[i].row-1};
			o[n[i].row-1]={text:o[n[i].row-1],row:i-1};
		}
	}
}
