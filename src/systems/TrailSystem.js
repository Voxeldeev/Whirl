export class TrailSystem {
    update(dt, trails) {
        for (let i = trails.length - 1; i >= 0; i--) {
            trails[i].lifeTimer += dt;
            if (trails[i].lifeTimer >= trails[i].maxLife) {
                trails.splice(i, 1);
            }
        }
    }
}
