/** Bounded Markdown presentation without HTML interpretation or remote embeds. */
const node=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
const cells=line=>line.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(s=>s.trim());
function inline(parent,text){
  const pattern=/(`[^`\n]+`|\*\*[^*\n]+\*\*)/g;let cursor=0;
  for(const match of text.matchAll(pattern)){
    parent.append(text.slice(cursor,match.index));
    const code=match[0].startsWith('`');parent.append(node(code?'code':'strong',match[0].slice(code?1:2,code?-1:-2)));
    cursor=match.index+match[0].length;
  }
  parent.append(text.slice(cursor));
}
export function renderRichText(text,{copy=value=>navigator.clipboard.writeText(value)}={}){
  const root=node('div');root.className='rich-answer';text=String(text||'');
  // Keep unusually large imported transcripts readable without a huge DOM.
  if(text.length>64000||text.split('\n').length>2000){root.textContent=text;root.className+=' rich-plain';return root;}
  const lines=text.replace(/\r\n?/g,'\n').split('\n');let paragraph=[],list=null;
  const flush=()=>{if(paragraph.length){const p=node('p');inline(p,paragraph.join('\n'));root.append(p);paragraph=[];}list=null;};
  for(let i=0;i<lines.length;i++){
    const line=lines[i],fence=line.match(/^\s*(`{3,}|~{3,})([\w+-]*)\s*$/);
    if(fence){
      flush();const codeLines=[];const marker=fence[1][0],count=fence[1].length;
      while(++i<lines.length){const closing=lines[i].trim();if(closing.length>=count&&[...closing].every(c=>c===marker))break;codeLines.push(lines[i]);}
      const value=codeLines.join('\n'),block=node('section'),bar=node('div'),pre=node('pre'),button=node('button','Copy code');
      block.className='code-block';bar.className='code-toolbar';button.type='button';button.className='text-button';button.setAttribute('aria-label',`Copy ${fence[2]||'code'} block`);
      const status=node('span');status.setAttribute('role','status');
      button.addEventListener('click',async()=>{try{await copy(value);status.textContent='Copied';}catch{status.textContent='Could not copy. Select the code to copy it.';}});
      bar.append(node('span',fence[2]||'Code'),status,button);pre.append(node('code',value));block.append(bar,pre);root.append(block);continue;
    }
    if(!line.trim()){flush();continue;}
    if(line.includes('|')&&lines[i+1]?.includes('|')&&cells(lines[i+1]).every(c=>/^:?-{3,}:?$/.test(c))){
      flush();const wrap=node('div'),table=node('table'),head=node('thead'),body=node('tbody'),row=node('tr');
      wrap.className='answer-table';wrap.setAttribute('tabindex','0');wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Answer table');
      const headers=cells(line);for(const text of headers){const th=node('th');th.setAttribute('scope','col');inline(th,text);row.append(th);}head.append(row);i++;
      while(i+1<lines.length&&lines[i+1].includes('|')&&lines[i+1].trim()){
        const values=cells(lines[++i]),tr=node('tr');for(const value of values){const td=node('td');inline(td,value);tr.append(td);}body.append(tr);
      }
      table.append(head,body);wrap.append(table);root.append(wrap);continue;
    }
    const heading=line.match(/^(#{1,4})\s+(.+)$/);
    if(heading){flush();const h=node(`h${Math.min(heading[1].length+1,5)}`);inline(h,heading[2]);root.append(h);continue;}
    const item=line.match(/^\s*(?:([-*+])|\d+[.)])\s+(.+)$/);
    if(item){const tag=item[1]?'ul':'ol';if(!list||list.tagName.toLowerCase()!==tag){flush();list=node(tag);root.append(list);}const li=node('li');inline(li,item[2]);list.append(li);continue;}
    if(/^>\s?/.test(line)){flush();const quote=node('blockquote');inline(quote,line.replace(/^>\s?/,''));root.append(quote);continue;}
    if(list)flush();paragraph.push(line);
  }
  flush();return root;
}
