// src/core/Modifiers.ts

export enum ModifierId {
    // Class A (Max 1)
    SPEED = 'SPEED',
    RANGE = 'RANGE',
    POWER = 'POWER',
    
    // Class B
    TELEKINESIS = 'TELEKINESIS', // B1 X
    BULLET = 'BULLET',           // B2 X
    DIVIDE = 'DIVIDE',           // B3 X
    SNAIL = 'SNAIL',             // B4 Boomerang leaves a temporary (5s) trail that slows opponent while crossing
    DEMOMANIAC = 'DEMOMANIAC',   // B5 X
    REVIVE = 'REVIVE'            // B6 Blocking causes ghost boomerang(s) to accelerate toward opponent, ignoring walls (target position recorded upon block, not updated)
}

// Validation helper to enforce the draft rules
export function isValidLoadout(selected: ModifierId[]): boolean {
    if (selected.length > 3) return false;

    const classACount = selected.filter(id => 
        id === ModifierId.SPEED || id === ModifierId.RANGE || id === ModifierId.POWER
    ).length;

    return classACount <= 1;
}