export class ExplosionSystem {
    update(dt, explosions) {
        // Loop backward to safely splice elements from the array while iterating
        for (let i = explosions.length - 1; i >= 0; i--) {
            explosions[i].update(dt);
            if (explosions[i].isDead) {
                explosions.splice(i, 1);
            }
        }
    }
}
