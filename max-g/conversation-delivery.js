/** Reply expression is presentation metadata, not a claim about felt emotions. */
export const DELIVERY_EMOTIONS=Object.freeze(['neutral','happy','joyful','sad','embarrassed','curious','surprised','excited','thoughtful','confused','concerned','affectionate','frustrated','sleepy','proud','playful']);
const laughMoods=new Set(['happy','joyful','excited','playful']);
export function normalizeDelivery(value){
  if(!value||typeof value!=='object'||!DELIVERY_EMOTIONS.includes(value.emotion))return null;
  return {emotion:value.emotion,chuckle:value.chuckle===true&&laughMoods.has(value.emotion)};
}
/** Only bounded leading cues are protocol. Literal tags in a story or code stay literal. */
export function readDeliveryCue(value){
  let text=String(value??''),emotion=null,chuckle=false,cued=false;
  for(let i=0;i<3;i++){
    const match=/^\s*\[(?:emotion:([a-z]+)|(laugh))\]\s*/i.exec(text);
    if(!match)break;
    cued=true;if(DELIVERY_EMOTIONS.includes(match[1]?.toLowerCase()))emotion=match[1].toLowerCase();
    if(match[2])chuckle=true;text=text.slice(match[0].length);
  }
  // Some models put their optional cue after the punchline. Accept that only
  // in a tagged response, outside code, at a sentence/line boundary.
  if(cued&&!/^ {0,3}(?:`{3,}|~{3,})/m.test(text)){
    const tail=/(?:\r?\n[ \t]*|(?<=[.!?…])\s+)\[laugh\]\s*$/i;
    if(tail.test(text)){chuckle=true;text=text.replace(tail,'').trimEnd();}
  }
  // Avoid flashing half a protocol tag while a stream is arriving.
  if(/^\s*\[(?:e(?:m(?:o(?:t(?:i(?:o(?:n(?::[a-z]*)?)?)?)?)?)?)?|l(?:a(?:u(?:g(?:h)?)?)?)?)?$/i.test(text))text='';
  return {text,emotion,chuckle,cued};
}
const serious=/\b(?:suicid\w*|self[- ]harm|grief|grieving|bereave\w*|funeral|died|death|panic|abuse|trauma\w*|depress\w*|lonely|loneliness|anxious|anxiety|worried|scared|overwhelmed|hopeless|stress(?:ed|ful)?|crying|heartbroken|upset|rough day|bad day|feel(?:ing)? sad)\b/i;
export function replyDelivery({question='',answer='',cue={},joke=false,humor='balanced'}={}){
  const q=String(question).slice(0,3000),a=String(answer).slice(0,16000);
  if(serious.test(q)||serious.test(a))return {emotion:'concerned',chuckle:false};
  const celebration=/\b(?:i (?:got (?:promoted|the job)|passed|won)|i(?:'m| am) (?:so )?(?:happy|excited)|good news|celebrate|congratulat\w*)\b/i.test(q);
  const explicitHumor=joke||/\b(?:dad joke|jokes?|make me laugh|laugh with me|banter|be funny)\b/i.test(q);
  let emotion=DELIVERY_EMOTIONS.includes(cue.emotion)?cue.emotion:celebration?'joyful':explicitHumor?'playful':/\b(?:be my friend|keep me company|talk with me|talk to me)\b/i.test(q)?'affectionate':'neutral';
  if(explicitHumor&&emotion==='neutral')emotion='playful';
  const chuckle=cue.chuckle===true&&laughMoods.has(emotion)&&(humor!=='off'||explicitHumor);
  return {emotion,chuckle};
}
