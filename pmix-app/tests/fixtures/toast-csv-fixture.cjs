// Entirely synthetic data. Never copy customer reports into public tests.
module.exports=function fixture(){
 const metrics=['Qty sold','Gross item amt','Discount amt','Refund amt','Net item amt','Tax amt'];
 const amount=(qty,gross,discount=0,tax=0)=>Object.fromEntries(metrics.map((k,i)=>[k,[qty,gross,discount,0,gross-discount,tax][i]]));
 const columns=['Type','masterId','parentId','itemGuid','Menu','Menu group','Subgroup','Item, open item','Size modifier','Modifiers, special requests',...metrics];
 const parent=(type,id,menu,item,values)=>({Type:type,masterId:id,parentId:'category',itemGuid:id+'-guid',Menu:menu,'Menu group':type==='menuItem'?'Drinks':menu,Subgroup:type==='menuItem'?'Hot':'','Item, open item':item,...values});
 const di=parent('menuItem','111','DINE IN','Coffee',amount(4,24,2,2.2)),co=parent('menuItem','222','CARRY OUT','Coffee',amount(6,36,5,3.1)),open=parent('openItem','333','Open items','Delivery',amount(1,2,0,.2)),gift=parent('giftCard','444','Gift card','Reload',amount(1,20));
 const mod=(p,type,label,size,values)=>({...p,Type:type,masterId:'child-'+size,parentId:p.masterId,'Modifiers, special requests':label,'Size modifier':size,...values});
 const mods=[mod(di,'modifier','Extra cream','',amount(2,1)),mod(co,'sizedModifier','Extra cream','Large',amount(3,1.5))],requests=[mod(di,'specialRequest','No ice','',amount(2,0)),mod(co,'sizedSpecialRequest','No foam','Large',amount(1,0))];
 const all=[amount(13,62,7,5.5),di,mods[0],requests[0],co,mods[1],requests[1],open,gift];
 const data={
  'All levels.csv':[columns,all],
  'Items.csv':[['masterId','parentId','itemGuid','Item',...metrics],[amount(10,60,7,5.3),{masterId:'111',Item:'Coffee',...amount(10,60,7,5.3)}]],
  'Menus.csv':[['Menu',...metrics],[amount(11,62,7,5.5),...['DINE IN','CARRY OUT','Open items','Gift card'].map((menu,i)=>({Menu:menu,...[amount(4,24,2,2.2),amount(6,36,5,3.1),amount(1,2,0,.2),amount(1,20)][i]}))]],
  'Menu groups.csv':[['Menu group','Subgroup',...metrics],[amount(11,62,7,5.5),{'Menu group':'Drinks',...amount(10,60,7,5.3)},{'Menu group':'Drinks',Subgroup:'Hot',...amount(10,60,7,5.3)},{'Menu group':'Open items',...amount(1,2,0,.2)},{'Menu group':'Gift card',...amount(1,20)}]],
  'Modifiers.csv':[['masterId','parentId','Size modifier','Modifier',...metrics],[amount(5,2.5),...mods.map(r=>({...r,parentId:'111',Modifier:r['Modifiers, special requests']}))]],
  'Special requests.csv':[['parentId','Size modifier','Special request',...metrics],[amount(3,0),...requests.map(r=>({...r,parentId:'111','Special request':r['Modifiers, special requests']}))]],
  'Open items.csv':[['itemGuid','Open item',...metrics],[amount(1,2,0,.2),{'itemGuid':'333-guid','Open item':'Delivery',...amount(1,2,0,.2)}]],
  'Total sales.csv':[metrics,[amount(11,62,7,5.5)]],
  'Percentage breakdown.csv':[[...columns.slice(0,10).filter(k=>!['masterId','parentId','itemGuid'].includes(k)),'% of total qty sold'],all.slice(1).map(r=>({...r,'% of total qty sold':50}))]
 };
 const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
 return Object.fromEntries(Object.entries(data).map(([name,[headers,rows]])=>[name,[headers,...rows.map(r=>headers.map(h=>r[h]??''))].map(r=>r.map(quote).join(',')).join('\n')]));
};
