#!/usr/bin/env python3
"""Neon Overdrive balance model: expected single-target DPS per wave from random card offers
(3 weighted cards, the player picks one at random), then the enemy-HP curve and boss HP
(boss HP = DPS x aim efficiency x target fight length). The constants here mirror UPG in
src/games/neon-overdrive.js. Run: python3 tools/art/neon/balance.py"""
import random
UPG = {  # max, weight
 'multi':(6,2),'pierce':(4,1.4),'dash':(4,1.2),'rapid':(6,2),'boom':(4,1.2),'heal':(99,1),'rail':(6,2),
 'drone':(3,1.3),'regen':(4,1.1),'crit':(5,1.5),'ricochet':(3,1.2),'shield':(3,1.1),'servo':(3,1)}
def dps(lv):
    rate=7*1.10**lv.get('rapid',0); dmg=1.15**lv.get('rail',0); shots=1+lv.get('multi',0)
    crit=0.06*lv.get('crit',0); cm=1+crit*1.2
    gun=rate*dmg*(1+0.4*(shots-1))*cm
    drones=lv.get('drone',0)*2.0*0.5*dmg*cm
    return gun+drones
def run():
    lv={}; out=[dps(lv)]
    for w in range(1,60):
        pool=[k for k in UPG if lv.get(k,0)<UPG[k][0]]; offer=[]
        while len(offer)<3 and pool:
            k=random.choices(pool,[UPG[x][1] for x in pool])[0]; offer.append(k); pool.remove(k)
        c=random.choice(offer); lv[c]=lv.get(c,0)+1; out.append(dps(lv))
    return out
N=400; runs=[run() for _ in range(N)]
D=[sum(r[i] for r in runs)/N for i in range(60)]  # D[n-1] = DPS at the start of wave n
ACC=0.42  # measured: a bot landing hits on a moving boss with adds
def boss_time(n): return 330 if n==60 else 80+1.6*n
print('wave  DPS   x    enemyHPx   bossHP  fight(s)')
for n in [1,5,10,15,20,25,30,35,40,45,50,55,60]:
    hp=(D[n-1]/D[0])*0.7+0.3
    print(f'{n:4d} {D[n-1]:6.1f} {D[n-1]/D[0]:5.2f}  {hp:6.2f}   {D[n-1]*ACC*boss_time(n)*(0.65+0.35*min(1,n/25)):7.0f}  {boss_time(n):5.0f}')
spawn=sum(35+2.1*n for n in range(1,61) if n%5)  # normal waves: fixed quota round(10+1.4n), at most min(30,5+0.45n) alive
boss=sum(boss_time(n) for n in range(5,61,5))
extra=60*8  # intros, clean-up, cards
print('spawn time %.0f min, boss %.0f min, extra %.0f min -> total %.0f min'%(spawn/60,boss/60,extra/60,(spawn+boss+extra)/60))
print('DPS table', [round(x,1) for x in D])
