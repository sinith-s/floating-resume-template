export function pageItems<T>(items:T[],page:number,size:number):T[]{
  return items.slice(page*size,(page+1)*size);
}
export function pageCount(length:number,size:number){return Math.max(1,Math.ceil(length/size))}
export function turnPage(page:number,direction:number,length:number,size:number){
  const count=pageCount(length,size);return (page+direction+count)%count;
}
