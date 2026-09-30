import test from 'node:test';
import assert from 'node:assert/strict';
import {pageItems,pageCount,turnPage} from '../app/platformPagination.ts';
import {createFlightPath} from '../app/flightPath.ts';
test('every item is reachable once in each paged platform layout',()=>{
  for(const size of [3,4,5,8,11])for(const length of [0,1,size,size+1,60]){
    const items=Array.from({length},(_,i)=>i);
    const pages=Array.from({length:pageCount(length,size)},(_,p)=>pageItems(items,p,size));
    assert.deepEqual(pages.flat(),items);
    assert.equal(turnPage(pageCount(length,size)-1,1,length,size),0);
    assert.equal(turnPage(0,-1,length,size),pageCount(length,size)-1);
  }
});
test('camera route is finite for no stations and sparse stations in either direction',()=>{
  for(const stops of [[],[{z:-326,x:19,y:24,focusX:1.6,focusY:.7}]]){
    const sample=createFlightPath(stops);
    for(let phase=-650;phase<1250;phase+=7){
      const point=sample(phase);assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y));
    }
    assert.deepEqual(sample(0),sample(600));
  }
});
