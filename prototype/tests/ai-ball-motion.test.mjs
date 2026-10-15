import assert from 'node:assert/strict'
import test from 'node:test'
import {activityHead,blendHead,projectHead} from '../src/design-system/ai-ball-motion.js'

test('neutral and side-up poses retain the measured original eye anchors',()=>{
  const neutral=projectHead(0,0)
  assert.deepEqual(neutral.eyes.map(e=>[e.x,e.y,e.angle]),[[24,30.5,0],[32,30.5,0]])
  for(const [side,expected] of [[-1,[[18.891,23.818],[26.717,25.481]]],[1,[[30.029,25.617],[37.792,23.681]]]]) {
    const pose=projectHead(side,1)
    pose.eyes.forEach((eye,i)=>['x','y'].forEach((axis,j)=>assert.ok(Math.abs(eye[axis]-expected[i][j])<.002)))
    assert.equal(pose.colours.x,side<0?-2:3);assert.equal(pose.colours.y,-6)
  }
})
test('intermediate poses move both face layers upward and toward the selected side',()=>{
  for(const side of [-1,1])for(const q of [.25,.5,.75]) {
    const pose=projectHead(side*q,q),centerX=(pose.eyes[0].x+pose.eyes[1].x)/2
    assert.ok((centerX-28)*side>0);assert.ok(pose.eyes.every(e=>e.y<30.5))
    assert.ok(pose.colours.x*side>0&&pose.colours.y<0)
    assert.ok(pose.eyes[1].x>pose.eyes[0].x)
  }
})
test('standby rests between two complete head turns rather than continuously scanning',()=>{
  for(const time of [0,5000,11000,18000,26000,30000])assert.deepEqual(activityHead('idle','auto',time),{yaw:0,pitch:0})
  assert.deepEqual(activityHead('idle','auto',7500),{yaw:-1,pitch:1})
  assert.deepEqual(activityHead('idle','auto',22500),{yaw:1,pitch:1})
  assert.deepEqual(activityHead('idle','auto',9600),{yaw:0,pitch:0})
})
test('head transitions have continuous positions and gentle starts and finishes',()=>{
  const from={yaw:0,pitch:0},to={yaw:1,pitch:1}
  assert.deepEqual(blendHead(from,to,0),from);assert.deepEqual(blendHead(from,to,1000),to)
  assert.ok(blendHead(from,to,1).yaw<.00001)
  assert.ok(1-blendHead(from,to,999).yaw<.00001)
  let previous=0
  for(let elapsed=0;elapsed<=1000;elapsed+=10){const next=blendHead(from,to,elapsed).yaw;assert.ok(next>=previous&&next-previous<.03);previous=next}
})
