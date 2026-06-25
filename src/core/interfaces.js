// src/core/interfaces.ts
export var PlayerState;
(function (PlayerState) {
    PlayerState["IDLE"] = "IDLE";
    PlayerState["MOVING"] = "MOVING";
    PlayerState["DASHING"] = "DASHING";
    PlayerState["BLOCKING"] = "BLOCKING";
    PlayerState["KNOCKED_BACK"] = "KNOCKED_BACK";
    PlayerState["DEAD"] = "DEAD";
})(PlayerState || (PlayerState = {}));
export var BoomerangState;
(function (BoomerangState) {
    BoomerangState["HIDDEN"] = "HIDDEN";
    BoomerangState["CHARGING"] = "CHARGING";
    BoomerangState["LIVE"] = "LIVE";
    BoomerangState["GHOST"] = "GHOST";
    BoomerangState["RECALL"] = "RECALL";
    BoomerangState["DECELERATING"] = "DECELERATING";
})(BoomerangState || (BoomerangState = {}));
