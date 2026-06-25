// src/core/Modifiers.ts
export var ModifierId;
(function (ModifierId) {
    // Class A (Max 1)
    ModifierId["SPEED"] = "SPEED";
    ModifierId["RANGE"] = "RANGE";
    ModifierId["POWER"] = "POWER";
    // Class B
    ModifierId["TELEKINESIS"] = "TELEKINESIS";
    ModifierId["BULLET"] = "BULLET";
    ModifierId["DIVIDE"] = "DIVIDE";
    ModifierId["SNAIL"] = "SNAIL";
    ModifierId["DEMO"] = "DEMO";
    ModifierId["REVIVE"] = "REVIVE"; // B6 Blocking causes ghost boomerang(s) to accelerate toward opponent, ignoring walls (target position recorded upon block, not updated)
})(ModifierId || (ModifierId = {}));
// Validation helper to enforce the draft rules
export function isValidLoadout(selected) {
    if (selected.length > 3)
        return false;
    const classACount = selected.filter(id => id === ModifierId.SPEED || id === ModifierId.RANGE || id === ModifierId.POWER).length;
    return classACount <= 1;
}
