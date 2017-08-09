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

function diffString2(o,n){
	if(!n)return{o:o,n:"",c:""};
	let reg=/[\n\f\r\u0020\u0009]*(<[^>]*>)[\n\f\r\u0020\u0009]*/,
		aN=n.split(reg).filter(v=>{if(v)return v;}),
		aO=o.split(reg).filter(v=>{if(v)return v;}),
		out=diff(aO,aN),
		os="",
		ns="",
		cs="";
	out.o.forEach(v=>{
		if(v.text==null){
			os+=`<del>${v}</del>`;
		}
	});
	out.n.forEach(v=>{
		if(v.text!=null){
			ns+=v.text;
		}else{
			ns+=`<span class="changes10153">${v}</span>`;
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
	n.forEach((v,i)=>{
		if(ns[v]==null)
			ns[v]={rows:[],o:null};
		ns[v].rows.push(i);
	});
	o.forEach((v,i)=>{
		if(os[v]==null)
			os[v]={rows:[],n:null};
		os[v].rows.push(i);
	});
	for(let i in ns){
		if(ns[i].rows.length===1&&typeof(os[i])!="undefined"&&os[i].rows.length===1){
			const a=ns[i].rows[0],
				  b=os[i].rows[0];
			n[a]={text:n[a],row:b};
			o[b]={text:o[b],row:a};
		}
	}
	for(let i=0;i<nl-1;i++){
		if(n[i].text!=null&&n[i+1].text==null&&n[i].row+1<ol&&o[n[i].row+1].text==null&&n[i+1]==o[n[i].row+1]){
			n[i+1]={text:n[i+1],row:n[i].row+1};
			o[n[i].row+1]={text:o[n[i].row+1],row:i+1};
		}
	}
	for(let i=nl-1;i>0;i--){
		if(n[i].text!=null&&n[i-1].text==null&&n[i].row>0&&o[n[i].row-1].text==null&&n[i-1]==o[n[i].row-1]){
			n[i-1]={text:n[i-1],row:n[i].row-1};
			o[n[i].row-1]={text:o[n[i].row-1],row:i-1};
		}
	}
	return{o:o,n:n};
}
