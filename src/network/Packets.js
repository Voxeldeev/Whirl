// src/network/Packets.ts
export var PacketType;
(function (PacketType) {
    PacketType["CLIENT_INPUT"] = "CLIENT_INPUT";
    PacketType["GAME_STATE"] = "GAME_STATE";
    PacketType["MATCH_EVENT"] = "MATCH_EVENT";
})(PacketType || (PacketType = {}));
