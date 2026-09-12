(function(root){
  'use strict';
  const I=root.PMIX_IO;
  const layouts={classic:{label:'Classic grid',body:8.5,pad:6,lines:true},compact:{label:'Compact ledger',body:7.5,pad:4,lines:true},sectioned:{label:'Category pages',body:9,pad:8,lines:false}};
  function displayRows(report,layout='classic'){
    if(layout!=='sectioned')return I.displayRows(report);
    const grouped=new Map();for(const row of report.rows){const key=row.group||'Report';if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(row);}
    return [...grouped].flatMap(([group,rows])=>[{kind:'group',item:group,newSection:true},...rows.map(r=>({...r,kind:'item'}))]);
  }
  async function makePdf(report,meta){
    const {PDFDocument,StandardFonts,rgb}=root.PDFLib,doc=await PDFDocument.create();doc.setTitle(meta.title);doc.setAuthor('MG');
    const custom=await root.PMIX_REPORT_FONTS?.embed(doc);const regular=custom?.body||await doc.embedFont(StandardFonts.Helvetica),bold=custom?.bodyBold||await doc.embedFont(StandardFonts.HelveticaBold),serif=custom?.serif||await doc.embedFont(StandardFonts.TimesRoman),serifBold=custom?.serifBold||await doc.embedFont(StandardFonts.TimesRomanBold);
    const spec=layouts[meta.layout]||layouts.classic,paper=({letter:[612,792],legal:[612,1008],ledger:[792,1224]})[meta.paperSize]||[612,792],W=meta.orientation==='landscape'?paper[1]:paper[0],H=meta.orientation==='landscape'?paper[0]:paper[1],margin=24,tableW=W-2*margin;
    const currency=report.rows.some(r=>r.format==='currency'),firstWidth=Math.min(168,Math.max(130,tableW*.19)),minNumberWidth=currency?54:36,maxStores=Math.max(1,Math.floor((tableW-firstWidth)/minNumberWidth)-1),bands=[];
    for(let i=0;i<report.stores.length;i+=maxStores)bands.push(report.stores.slice(i,i+maxStores).map((code,j)=>({code,index:i+j})));
    const safe=s=>String(s??'').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,' ');const fontSets=new Map();function verify(text,font){if(!fontSets.has(font))fontSets.set(font,new Set(font.getCharacterSet()));for(const c of text)if(!fontSets.get(font).has(c.codePointAt(0)))throw Error('The report font cannot display '+JSON.stringify(c)+'. Use a supported label or enable an installed report font.');}
    function wrap(text,width,font,size){const output=[];let line='';for(const word of safe(text).split(/\s+/)){let pieces=[word];if(font.widthOfTextAtSize(word,size)>width){pieces=[];let part='';for(const c of word){if(font.widthOfTextAtSize(part+c,size)>width){pieces.push(part);part=c;}else part+=c;}if(part)pieces.push(part);}for(const part of pieces){if(line&&font.widthOfTextAtSize(line+' '+part,size)>width){output.push(line);line=part;}else line+=(line?' ':'')+part;}}if(line)output.push(line);return output;}
    const source=displayRows(report,meta.layout),foot=(report.footerRows||[{item:'GRAND TOTAL',values:report.totals,total:report.total,format:report.format}]).map(r=>({...r,kind:'total'})),pages=[];
    const subtitle=wrap([meta.subtitle,meta.headerSubtitle].filter(Boolean).join(' | '),tableW,serif,9),notes=wrap(meta.note||'',tableW,regular,7),tableTop=H-66-subtitle.length*11-notes.length*9-(bands.length>1?12:0),room=tableTop-84;
    const height=r=>Math.max(spec.body+spec.pad+3,wrap(r.item,r.kind==='group'?tableW-10:firstWidth-10,r.kind==='item'?regular:bold,spec.body).length*(spec.body+2)+spec.pad);
    for(const band of bands){let rows=[],used=0;for(const r of [...source,...foot]){const h=height(r),next=r.kind==='group'?22:0;if(rows.length&&(used+h+next>room||(meta.layout==='sectioned'&&r.newSection))){pages.push({band,rows});rows=[];used=0;}
        if(h>room)throw Error('An item label is too long for this paper size. Shorten it before exporting.');rows.push({...r,height:h});used+=h;}
      if(rows.length)pages.push({band,rows});}
    for(let pi=0;pi<pages.length;pi++){
      const {band,rows}=pages[pi],page=doc.addPage([W,H]),nW=(tableW-firstWidth)/(band.length+1),draw=(text,x,y,font=regular,size=spec.body)=>{verify(safe(text),font);return page.drawText(safe(text),{x,y,font,size,color:rgb(0,0,0)});},center=(text,y,font,size)=>draw(text,(W-font.widthOfTextAtSize(safe(text),size))/2,y,font,size);
      const printed='Printed '+meta.printed;draw(printed,W-margin-serif.widthOfTextAtSize(safe(printed),7),H-18,serif,7);
      const titleSize=Math.min(15,tableW/Math.max(1,serifBold.widthOfTextAtSize(safe(meta.title),1)));center(meta.title,H-39,serifBold,titleSize);
      subtitle.forEach((line,i)=>center(line,H-54-i*11,serif,9));notes.forEach((line,i)=>center(line,H-57-subtitle.length*11-i*9,regular,7));
      if(bands.length>1)center('Columns: '+band.map(x=>x.code).join(', ')+' | TOTAL includes all selected locations',tableTop+7,serif,7);
      let y=tableTop;page.drawRectangle({x:margin,y:y-20,width:tableW,height:20,color:rgb(.84,.84,.84)});
      ['Item / revenue center',...band.map(x=>x.code),'TOTAL'].forEach((label,i)=>{if(!i)draw(label,margin+5,y-13,bold,8);else centerColumn(label,i-1,y-13,bold,8);});
      function centerColumn(text,i,yy,font,size){const x=margin+firstWidth+i*nW+(nW-font.widthOfTextAtSize(text,size))/2;draw(text,x,yy,font,size);}
      y-=20;let stripe=0;
      for(const row of rows){const bottom=y-row.height,f=row.kind==='item'?regular:bold;
        if(row.kind!=='item'||(meta.layout!=='compact'&&stripe++%2))page.drawRectangle({x:margin,y:bottom,width:tableW,height:row.height,color:rgb(row.kind==='total'?.84:row.kind==='group'?.91:.965,row.kind==='total'?.84:row.kind==='group'?.91:.965,row.kind==='total'?.84:row.kind==='group'?.91:.965)});
        wrap(row.item,row.kind==='group'?tableW-10:firstWidth-10,f,spec.body).forEach((line,i)=>draw(line,margin+5,y-spec.body-spec.pad/2-i*(spec.body+2),f,spec.body));
        if(row.kind!=='group'){
          [...band.map(c=>row.values[c.index]),row.total].forEach((value,i)=>{const text=value==null?'n.a.':row.format==='percent'?(value*100).toFixed(2)+'%':Number(value).toLocaleString('en-US',row.format==='currency'?{minimumFractionDigits:2,maximumFractionDigits:2}:{maximumFractionDigits:3}),size=Math.min(spec.body,(nW-8)/Math.max(1,f.widthOfTextAtSize(text,1)));draw(text,margin+firstWidth+(i+1)*nW-4-f.widthOfTextAtSize(text,size),y-spec.body-spec.pad/2,f,size);});
          if(spec.lines)for(let i=0;i<=band.length+1;i++){const x=margin+firstWidth+i*nW;page.drawLine({start:{x,y},end:{x,y:bottom},thickness:.35,color:rgb(.5,.5,.5)});}
        }
        page.drawLine({start:{x:margin,y:bottom},end:{x:W-margin,y:bottom},thickness:row.kind==='total'?.7:.35,color:rgb(.45,.45,.45)});y=bottom;
      }
      page.drawLine({start:{x:margin,y:tableTop},end:{x:margin,y},thickness:.5});page.drawLine({start:{x:W-margin,y:tableTop},end:{x:W-margin,y},thickness:.5});
      const footerWidth=tableW-120,folder=wrap(meta.footerPath||'Downloads',footerWidth,serif,7);folder.slice(0,2).forEach((line,i)=>center(line,43-i*8,serif,7));
      const filename=meta.filename+' (MG '+meta.prepared+')',fileSize=Math.min(8,footerWidth/Math.max(1,serif.widthOfTextAtSize(safe(filename),1)));center(filename,24,serif,fileSize);
      if(meta.footerNote)center(meta.footerNote,14,serif,6.5);const pageNo=`Page ${pi+1} of ${pages.length}`;draw(pageNo,W-margin-serif.widthOfTextAtSize(pageNo,8),24,serif,8);
    }
    return doc.save();
  }
  I.makePdf=makePdf;root.PMIX_DOCUMENT={layouts,displayRows,makePdf};
})(typeof window!=='undefined'?window:globalThis);
