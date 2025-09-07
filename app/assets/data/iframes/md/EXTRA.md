

how to make a NPC:

Description
You can use the NPC class in a code block to create a new NPC.

Parameters:
name: {string} the name of the NPC
type: {number} the type of the NPC, either 1 or 2
color1 (optional): {string} the color of the NPC's main nametag
color2 (optional): {string} the color of the NPC's subtitle

Installation
Copy the code below and paste it in World Code.

Usage
NPC Creation
To create an NPC, place a code block and create an NPC variable with class NPC. Input your arguments into the parameters to customise the NPC. Here's an example:
id = new NPC("NPC test name", 1)

Now that we've got the ID, we can use it to spawn the NPC.
id.spawn(x, y, z) // input x, y, z as your coords


We can also despawn the NPC with:
id.despawn()


NPC Interaction
We can use this callback, onNpcInteract, to run code or functions when an NPC is interacted with. Note: this callback is to be used in World Code

onNpcInteract description:

Parameters:
pId: the playerId of the player interacting with the NPC
npcName: the name of the NPC
isAlt: whether the interaction between the NPC and the player is with an Alt click or a normal click

Example:


Code:
class NPC{constructor(t,e,a,n){switch(this.name=t,e){case 1:this.type="Draugr Knight";break;case 2:this.type="Frost Zombie";break;default:throw new Error("Invalid NPC type. Enter numerical value of 1 or 2")}this.color=a,this.color2=n}spawn(t,e,a){let n=api.attemptSpawnMob(this.type,t,e,a,{name:this.name,spawnerId:api.getPlayerIds()[0]});return null!=n&&(api.setMobSetting(n,"baseWalkingSpeed",0),api.setMobSetting(n,"baseRunningSpeed",0),api.setTargetedPlayerSettingForEveryone(n,"nameTagInfo",{backgroundColor:this.color??"white",content:[{str:this.name}],subtitle:[{str:"NPC"}],subtitleBackgroundColor:this.color2??"lightgray"},!0),api.setTargetedPlayerSettingForEveryone(n,"hasPriorityNametag",!0,!0),api.setMobSetting(n,"onDeathItemDrops",[])),this.id=n,n}despawn(){if(!api.getMobIds().includes(this.id))throw new Error("NPC does not exist");if("NPC"!==api.getOtherEntitySetting(api.getPlayerIds()[0],this.id,"nameTagInfo")?.subtitle?.[0]?.str)throw new Error("NPC does not exist");api.despawnMob(this.id)}}globalThis.NPC=NPC,onPlayerDamagingMob=(t,e)=>{if("NPC"===api.getOtherEntitySetting(t,e,"nameTagInfo")?.subtitle?.[0]?.str)return globalThis?.onNpcInteract?.(t,api.getOtherEntitySetting(t,e,"nameTagInfo")?.content?.[0]?.str,!1),"preventDamage"},onMobDamagingPlayer=(t,e)=>{if("NPC"===api.getOtherEntitySetting(e,t,"nameTagInfo")?.subtitle?.[0]?.str)return"preventDamage"},onMobDamagingOtherMob=(t,e)=>{if("NPC"===api.getOtherEntitySetting(api.getPlayerIds()[0],e,"nameTagInfo")?.subtitle?.[0]?.str)return"preventDamage"},onPlayerAltAction=(t,e,a,n,i,r)=>{null!=r&&"NPC"===api.getOtherEntitySetting(t,r,"nameTagInfo")?.subtitle?.[0]?.str&&globalThis?.onNpcInteract?.(t,api.getOtherEntitySetting(t,r,"nameTagInfo")?.content?.[0]?.str,!0)};
 
Sample Usage
Scenario 1:
name: "Dude"
type: 1
spawning position: 100, 0, 100

interaction: When you interact, it says "Hi!" to the player

[Scenario 1] Code (in code block):
let npc = new NPC("Dude", 1)
npc.spawn(100, 0, 100)


[Scenario 1] Code (in world code):


end of how to make a NPC.

Custom tools:
Hammer 
Code Block:



api.giveItem(myId, "Reinforced Pebble", 100, {
  customDisplayName: "Bubblegum"
});
      

World Code:


//Timeout Code by Sulfrox
class MinQueue{constructor(i,t,e){t=e=Uint32Array,this.c=i,this.k=new t(i+1),this.p=new e(i+1),this.h=!1,this.l=0}bbu(i){let t=this.k,e=this.p,r=t[i],h=e[i];for(;i>1;){let s=i>>>1;if(e[s]<=h)break;t[i]=t[s],e[i]=e[s],i=s}t[i]=r,e[i]=h}bbd(i){let t=this.k,e=this.p,r=t[i],h=e[i],s=1+(this.l>>>1),u=this.l+1;for(;i<s;){let n=i<<1,l=e[n],m=t[n],_=n,p=n+1;if(p<u&&e[p]<l&&(l=e[p],m=t[p],_=p),l>=h)break;t[i]=m,e[i]=l,i=_}t[i]=r,e[i]=h}push(i,t){if(this.l===this.c)throw"heap full";if(this.h)this.k[1]=i,this.p[1]=t,this.l++,this.bbd(1),this.h=!1;else{let e=this.l+1;this.k[e]=i,this.p[e]=t,this.l++,this.bbu(e)}}pop(){if(0!==this.l)return this.rpe(),this.l--,this.h=!0,this.k[1]}peekPriority(){if(0!==this.l)return this.rpe(),this.p[1]}peek(){if(0!==this.l)return this.rpe(),this.k[1]}rpe(){this.h&&(this.k[1]=this.k[this.l+1],this.p[1]=this.p[this.l+1],this.bbd(1),this.h=!1)}}let currently_running_timer,TimerQueue=new MinQueue(1024),TimerDictionary=[],TimerNum=0,TickNum=0;function setTimeOut(i,t){let e=TickNum+Math.floor(t/50);TimerDictionary[TimerNum]=i,TimerQueue.push(TimerNum,e),TimerNum++}function tick(){if(TickNum++,currently_running_timer)currently_running_timer(),currently_running_timer=void 0;else if(TimerQueue.peekPriority()<=TickNum){let i=TimerQueue.peek();void 0!==i&&(currently_running_timer=TimerDictionary[i]),TimerQueue.pop(),delete TimerDictionary[i]}}

//world code
const slownessLevels = {};

onPlayerDamagingOtherPlayer = function (attackerId, victimId, baseDamage, withItem, bodyPartHit, damagerDbId) {
  const held = api.getHeldItem(attackerId);

  if (withItem !== "Reinforced Pebble") return baseDamage;

  // Stack slowness level
  if (slownessLevels[victimId]) {
    slownessLevels[victimId]++;
  } else {
    slownessLevels[victimId] = 1;
  }

  const level = Math.min(slownessLevels[victimId], 10); // Cap at level 10
  const duration = 10000; // 10 seconds

  // Apply slowness using the effect system
  api.applyEffect(victimId, "Slowness", duration, {
    inbuiltLevel: level,
    icon: "Slowness"
  });

  // Reset after effect duration if not hit again
  setTimeOut(() => {
    if (slownessLevels[victimId] === level) {
      delete slownessLevels[victimId];
    }
  }, duration);

  return baseDamage;
};
      
Explosion sword: 


Code Block:


api.giveItem(myId, "Iron Sword", 1, {
  customDisplayName: "Explosive Sword"
});
      

World Code:


const damageBlockedPlayers = new Set();
const blastSwordName = "Explosive Sword";
const explosionRadius = 5;
const explosionForce = 30;
const explosionDamage = 25;

onPlayerDamagingOtherPlayerExplosive = (attackerId, targetId, damageDealt, withItem, bodyPartHit, damagerDbId) => {
    if (damageBlockedPlayers.has(attackerId)) return;

    const held = api.getHeldItem(attackerId);
    if (!held || held.name !== "Iron Sword" || held.attributes?.customDisplayName !== blastSwordName) return;

    // 🎲 20% chance to trigger explosion
    if (Math.random() >= 0.2) return;

    const pos = api.getPosition(targetId);
    if (!pos) return;

    const [x, y, z] = pos;

    // 💥 Particle explosion
    api.playParticleEffect({
        texture: "square_particle",
        dir1: [-1, -1, -1],
        dir2: [1, 1, 1],
        pos1: [x - 2.5, y, z - 2.5],
        pos2: [x + 2.5, y + 2, z + 2.5],
        minLifeTime: 0.3,
        maxLifeTime: 0.6,
        minEmitPower: 5,
        maxEmitPower: 8,
        minSize: 0.4,
        maxSize: 0.7,
        manualEmitCount: 100,
        gravity: [0, -10, 0],
        colorGradients: [
            {
                timeFraction: 0,
                minColor: [255, 100, 0, 1],
                maxColor: [255, 200, 50, 1],
            },
        ],
        velocityGradients: [
            {
                timeFraction: 0,
                factor: 1,
                factor2: 1,
            },
        ],
        blendMode: 1,
        hideDist: 30,
    });

    // 🌪 Knockback all players and damage others (except attacker)
    for (const otherId of api.getPlayerIds()) {
        const otherPos = api.getPosition(otherId);
        if (!otherPos) continue;

        const dx = otherPos[0] - x;
        const dy = otherPos[1] - y;
        const dz = otherPos[2] - z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq <= explosionRadius * explosionRadius) {
            const dist = Math.sqrt(distSq);
            let pushX, pushY = 10, pushZ;

            if (dist === 0) {
                pushX = 0;
                pushZ = 0;
            } else {
                pushX = (dx / dist) * explosionForce;
                pushZ = (dz / dist) * explosionForce;
            }

            api.applyImpulse(otherId, pushX, pushY, pushZ);

            if (otherId !== attackerId) {
                damageBlockedPlayers.add(attackerId);
                api.attemptApplyDamage({
                    eId: attackerId,
                    hitEId: otherId,
                    attemptedDmgAmt: explosionDamage,
                    withItem: "Iron Sword",
                    attackDir: [dx, dy, dz],
                    showCritParticles: true,
                    isTrueDamage: true,
                });
                damageBlockedPlayers.delete(attackerId);
            }
        }
    }
};
      

Zombifyer: 

Code Block:


api.giveItem(myId, "Iron Bow", 1, {
  customDisplayName: "Zombiefier"
});

      

World Code:


//Timeout Code by Sulfrox
class MinQueue{constructor(i,t,e){t=e=Uint32Array,this.c=i,this.k=new t(i+1),this.p=new e(i+1),this.h=!1,this.l=0}bbu(i){let t=this.k,e=this.p,r=t[i],h=e[i];for(;i>1;){let s=i>>>1;if(e[s]<=h)break;t[i]=t[s],e[i]=e[s],i=s}t[i]=r,e[i]=h}bbd(i){let t=this.k,e=this.p,r=t[i],h=e[i],s=1+(this.l>>>1),u=this.l+1;for(;i<s;){let n=i<<1,l=e[n],m=t[n],_=n,p=n+1;if(p<u&&e[p]<l&&(l=e[p],m=t[p],_=p),l>=h)break;t[i]=m,e[i]=l,i=_}t[i]=r,e[i]=h}push(i,t){if(this.l===this.c)throw"heap full";if(this.h)this.k[1]=i,this.p[1]=t,this.l++,this.bbd(1),this.h=!1;else{let e=this.l+1;this.k[e]=i,this.p[e]=t,this.l++,this.bbu(e)}}pop(){if(0!==this.l)return this.rpe(),this.l--,this.h=!0,this.k[1]}peekPriority(){if(0!==this.l)return this.rpe(),this.p[1]}peek(){if(0!==this.l)return this.rpe(),this.k[1]}rpe(){this.h&&(this.k[1]=this.k[this.l+1],this.p[1]=this.p[this.l+1],this.bbd(1),this.h=!1)}}let currently_running_timer,TimerQueue=new MinQueue(1024),TimerDictionary=[],TimerNum=0,TickNum=0;function setTimeOut(i,t){let e=TickNum+Math.floor(t/50);TimerDictionary[TimerNum]=i,TimerQueue.push(TimerNum,e),TimerNum++}function tick(){if(TickNum++,currently_running_timer)currently_running_timer(),currently_running_timer=void 0;else if(TimerQueue.peekPriority()<=TickNum){let i=TimerQueue.peek();void 0!==i&&(currently_running_timer=TimerDictionary[i]),TimerQueue.pop(),delete TimerDictionary[i]}}

const zombiefiedPlayers = new Set();
const transformedPlayers = new Set();

function onPlayerDamagingOtherPlayer(attackerId, victimId, damageDealt, withItem, bodyPartHit, damagerDbId) => {
  const held = api.getHeldItem(attackerId);

  if (
    !held ||
    held.name !== "Iron Bow" ||
    held.attributes?.customDisplayName !== "Zombiefier"
  ) return;

  const duration = 20000;

  // 🧟 Hit another player
  if (attackerId !== victimId) {
    if (zombiefiedPlayers.has(victimId)) return;

    zombiefiedPlayers.add(victimId);

    api.changePlayerIntoSkin(victimId, "body", "Zombie");
    api.changePlayerIntoSkin(victimId, "legs", "Zombie");
    api.changePlayerIntoSkin(victimId, "head", "Zombie");

    api.applyEffect(victimId, "Slowness", duration, { inbuiltLevel: 1 });
    api.applyEffect(victimId, "Weakness", duration, { inbuiltLevel: 1 });
    api.setClientOption(victimId, "dealingDamageMultiplier", 0.5);

    setTimeOut(() => {
      api.removeAppliedSkin(victimId);
      api.setClientOption(victimId, "dealingDamageMultiplier", 1);
      zombiefiedPlayers.delete(victimId);
    }, duration);
    return;
  }

  // 🌀 Shot yourself
  if (transformedPlayers.has(attackerId)) return;
  transformedPlayers.add(attackerId);
  api.changePlayerIntoSkin(attackerId, "body", "Zombie");
  api.changePlayerIntoSkin(attackerId, "legs", "Zombie");
  api.changePlayerIntoSkin(attackerId, "head", "Zombie");

  const form = Math.random() < 0.5 ? "big" : "small";

  if (form === "big") {
    // Scale up
    api.scalePlayerMeshNodes(attackerId, {
      "TorsoNode": [1.5, 1.5, 1.5],
      "HeadMesh": [1.5, 1.5, 1.5],
      "ArmRightMesh": [1.5, 1.5, 1.5],
      "ArmLeftMesh": [1.5, 1.5, 1.5],
      "LegLeftMesh": [1.5, 1.5, 1.5],
      "LegRightMesh": [1.5, 1.5, 1.5],
    });

    api.applyEffect(attackerId, "Damage", duration, { inbuiltLevel: 2 });
    api.applyEffect(attackerId, "Damage Reduction", duration, { inbuiltLevel: 1 });
  } else {
    // Scale down
  api.scalePlayerMeshNodes(attackerId, {
    "TorsoNode": [0.3, 0.3, 0.3],
    "HeadMesh": [0.3, 0.3, 0.3],
    "ArmRightMesh": [1.2, 1.2, 1.2],
    "ArmLeftMesh": [1.2, 1.2, 1.2],
    "LegLeftMesh": [0.5, 0.7, 0.5],
    "LegRightMesh": [0.5, 0.7, 0.5],
  });

    api.applyEffect(attackerId, "Speed", duration, { inbuiltLevel: 1 });
    api.applyEffect(attackerId, "Health Regen", duration/2, { inbuiltLevel: 1 });
  }

  // Revert form after duration
  setTimeOut(() => {
    api.scalePlayerMeshNodes(attackerId, {
      "TorsoNode": [1, 1, 1],
      "HeadMesh": [1, 1, 1],
      "ArmRightMesh": [1, 1, 1],
      "ArmLeftMesh": [1, 1, 1],
      "LegLeftMesh": [1, 1, 1],
      "LegRightMesh": [1, 1, 1],
    });
    api.removeAppliedSkin(attackerId);
    transformedPlayers.delete(attackerId);
  }, duration);
}
      End of custom tools.


      Info on moving the player/onPlayerMove callback: 
      SET-UP CODE:
posVal1 = {}
posVal2 = {}

tick = () => {
    for (let pId of api.getPlayerIds()) {
        if (posVal2[pId] == null) {
            posVal2[pId] = api.getPosition(pId)
            posVal1[pId] = api.getPosition(pId)
        } else {
            posVal2[pId] = posVal1[pId]
            posVal1[pId] = api.getPosition(pId)
            if (posVal1[pId][0] !== posVal2[pId][0] || posVal1[pId][1] !== posVal2[pId][1] || posVal1[pId][2] !== posVal2[pId][2]) {
                if (typeof onPlayerMove === "function") onPlayerMove(pId, api.getPosition(pId))
            } else {
                if (typeof onPlayerStandStill === "function") onPlayerStandStill(pId, api.getPosition(pId))
            }
        }
    }
}

onPlayerJoin = (pId) => {
    posVal1[pId] = api.getPosition(pId)
    posVal2[pId] = null
}

onPlayerLeave = (pId) => {
    delete posVal1[pId]
    delete posVal2[pId]
}


HOW TO USE:
Input these callbacks in the code below, and write your own code in them.
function onPlayerMove(pId, pos) {
    /* CODE HERE */
}

function onPlayerStandStill(pId, pos) {
    /* CODE HERE */
}


onPlayerMove - Checks if any player has moved. If so, it is called.
onPlayerStandStill - Checks if any player is not moving. If so, it is called.

 Info on moving the player/onPlayerMove callback.