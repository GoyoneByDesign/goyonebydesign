import {normalizeResearch} from './research.js';

const node=(tag,className,text)=>{const value=document.createElement(tag);if(className)value.className=className;if(text!==undefined)value.textContent=text;return value;};
function sourceLink(text,url,className='research-link') {
  const link=node('a',className,text);link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';return link;
}
function publicationDate(value) {
  if(!value)return null;
  const date=new Date(value);if(!Number.isFinite(date.getTime()))return null;
  const label=new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(date);
  const time=node('time','research-date',`Published ${label}`);time.dateTime=value;return time;
}
function excerpt(value) {
  if(!value)return null;
  if(value.length<=360)return node('p','research-excerpt',value);
  const body=node('div','research-excerpt-block'),cut=value.slice(0,350).replace(/\s+\S*$/,'');
  body.append(node('p','research-excerpt',cut+'…'));
  const details=node('details','research-more');details.append(node('summary','', 'Read the full excerpt'),node('p','research-excerpt',value));body.append(details);return body;
}
function photo(image,{background=false}={}) {
  const figure=node('figure','research-photo'),caption=node('figcaption','research-caption');
  const label=node('span','research-caption-label',background?'Topic background image':'Publisher sharing image');
  caption.append(label);
  if(background)caption.append(node('span','research-photo-context','Background reference; not a photograph of a current news event.'));
  else caption.append(node('span','research-photo-context','May be archival or a publisher logo.'));
  caption.append(sourceLink(background?'Image source · Wikimedia Commons':`Image source · ${image.imagePublisher}`,image.sourceUrl,'research-link research-visible-image-source'));
  const description=image.caption!=='Publisher sharing image; may be archival or a logo.'?image.caption:'';
  const longCredits=description.length+image.artist.length+image.license.length>120;
  const more=longCredits?node('details','research-caption-details'):null;
  if(more)more.append(node('summary','','Image details & credits'));
  const metadata=more||caption;
  if(description)metadata.append(node('span','research-caption-description',description));
  const credits=node('span','research-photo-credits');
  if(image.artist)credits.append(node('span','research-artist',image.artist));
  if(image.license)credits.append(image.licenseUrl?sourceLink(image.license,image.licenseUrl):node('span','research-license',image.license));
  if(image.artist||image.license)metadata.append(credits);
  if(more)caption.append(more);
  const img=node('img','research-image');img.alt=background?`Image associated with ${image.subject}`:`Publisher sharing image for ${image.subject}`;
  img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
  const fail=()=>{img.remove();figure.classList.add('research-photo-unavailable');const fallback=node('p','research-image-fallback','Picture unavailable. The source and text are still available.');figure.prepend(fallback);};
  img.addEventListener('error',fail,{once:true});
  figure.append(img,caption);
  // Setting src is deliberately the final step and is called only after image permission.
  img.src=image.url;
  return figure;
}

/** Source excerpts and real source images, separate from generated MAX-G replies. */
export function researchCards(value,{allowImages=true,onLoadImages}={}) {
  const data=normalizeResearch(value);if(!data||!data.articles.length&&!data.background)return null;
  const section=node('section','research-cards');section.dataset.kind=data.kind;section.setAttribute('aria-label',data.kind==='news'?'News articles and original sources':'Topic information and original sources');
  const header=node('header','research-heading');header.append(node('p','research-kicker',data.kind==='news'?'MAX-G · NEWS BRIEFING':'MAX-G · EXPLORER'),node('h3','research-query',data.query));
  section.append(header);
  const imageSlots=[];
  const preparePhoto=(article,body,image,background=false)=>{if(!image)return;imageSlots.push({article,body,image,background});};
  if(data.background) {
    const row=data.background,card=node('article','research-story research-background'),body=node('div','research-story-body'),heading=node('header','research-story-header');
    heading.append(node('p','research-source-label','Wikipedia · Topic background'),node('h4','research-title',row.title));
    const summary=excerpt(row.summary);if(summary)body.append(summary);
    body.append(node('p','research-background-note',data.articles.length?'Encyclopedia background; use the original sources below for current developments.':'Encyclopedia background. Open the Wikipedia source for details.'));
    const footer=node('footer','research-source-footer');footer.append(sourceLink('Read the Wikipedia article ↗',row.url,'research-original-link'));body.append(footer);
    card.append(heading,body);preparePhoto(card,body,row.image,true);section.append(card);
  }
  if(data.articles.length) {
    const grid=node('div','research-grid');
    for(const row of data.articles) {
      const card=node('article','research-story'),body=node('div','research-story-body'),meta=node('div','research-story-meta'),heading=node('header','research-story-header');
      meta.append(node('span','research-source-label',row.publisher));const published=publicationDate(row.publishedAt);if(published)meta.append(published);
      heading.append(meta,node('h4','research-title',row.title));
      const summary=excerpt(row.snippet);if(summary)body.append(node('p','research-excerpt-label','Source excerpt'),summary);
      const footer=node('footer','research-source-footer');footer.append(sourceLink(data.kind==='news'?'Read the original article ↗':'Open the original source ↗',row.url,'research-original-link'));body.append(footer);
      card.append(heading,body);preparePhoto(card,body,row.image);grid.append(card);
    }
    section.append(grid);
  }
  let loaded=false;
  const loadPhotos=()=>{if(loaded)return;loaded=true;for(const slot of imageSlots)slot.article.insertBefore(photo(slot.image,{background:slot.background}),slot.body);};
  if(allowImages)loadPhotos();
  else if(imageSlots.length) {
    const controls=node('div','research-image-controls'),status=node('p','research-image-status','Pictures are available from the linked sources.');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    controls.append(status);
    if(typeof onLoadImages==='function') {
      const button=node('button','research-load-images','Load pictures');button.type='button';
      let pending=false;
      button.addEventListener('click',async()=>{
        if(pending||loaded)return;pending=true;button.disabled=true;
        try {
          const granted=await onLoadImages();
          if(section.isConnected===false)return;
          if(granted===true){loadPhotos();button.remove();status.textContent='Pictures load directly from the linked sources.';}
          else status.textContent='Pictures are off. You can still read every source.';
        }catch{if(section.isConnected!==false)status.textContent='Pictures could not be enabled. The source text remains available.';}
        finally{pending=false;button.disabled=false;}
      });
      controls.prepend(button);
    }
    header.append(controls);
  }
  if(data.notice)section.append(node('p','research-notice',data.notice));
  return section;
}
