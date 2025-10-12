import { itemDefs } from "@Glibs/inventory/items/itemdefs";

export enum QuestLocalId {
    Q003_OPENING_GET_LOGS = "Q003_OPENING_GET_LOGS",
    Q004_OPENING_CAMPFIRE = "Q004_OPENING_CAMPFIRE",
    Q005_FIRE_CAMPFIRE = "Q005_FIRE_CAMPFIRE",
    Q006_ESCAPE_DARKSIDE = "Q006_ESCAPE_DARKSIDE",
    Q007_HUNTING_ZOMBIE = "Q007_HUNTING_ZOMBIE",
}
export const newQuestDefs = {
    [QuestLocalId.Q003_OPENING_GET_LOGS]: {
        "title": "나무 수집",
        "description": "불을 피우기 위한 나무가 필요합니다.",
        "startNpc": "npc_guard",
        "endNpc": "",
        "preconditions": {
            "level": 1
        },
        "objectives": [
            { "type": "pickup", "targetId": "Logs", "amount": 2 }
        ],
        "rewards": {
            "experience": 100,
        }
    },
    [QuestLocalId.Q004_OPENING_CAMPFIRE]: {
        "title": "꺼진 모닥불 찾기",
        "description": "불을 피우기 위해 모닥불을 찾아야합니다.. 주변을 살펴보면 불을 피웠던 흔적이 보입니다. 멀지 않은 곳에 있습니다.",
        "startNpc": "npc_guard",
        "endNpc": "",
        "preconditions": {
            "level": 1
        },
        "objectives": [
            { "type": "interactive", "targetId": "campfire", "amount": 1 }
        ],
        "rewards": {
            "experience": 100,
        }
    },
    [QuestLocalId.Q005_FIRE_CAMPFIRE]: {
        "title": "모닥불 피우기",
        "description": "불을 피우기 위해 모닥불을 찾아야합니다.. 다시 모닥불이 있던 위치로 돌아가세요.",
        "startNpc": "npc_guard",
        "endNpc": "",
        "preconditions": {
            "level": 1
        },
        "objectives": [
            { "type": "activate", "targetId": "campfire", "amount": 1 }
        ],
        "rewards": {
            "experience": 100,
        }
    },
    [QuestLocalId.Q006_ESCAPE_DARKSIDE]: {
        "title": "어둠을 물리치기",
        "description": "모닥불에서 불을 쬐고 있으면 어둠의 힘이 사라집니다. 어둠이 사라질때까지 모닥불 곁을 떠나지마세요.",
        "startNpc": "npc_guard",
        "endNpc": "",
        "preconditions": {
            "level": 1
        },
        "objectives": [
            { "type": "deactivate", "targetId": "darkparticle", "amount": 1 }
        ],
        "rewards": {
            "experience": 100,
            "items": [{ "itemId": itemDefs.Hanhwasbat.id, "amount": 3 }]
        }
    },
    [QuestLocalId.Q007_HUNTING_ZOMBIE]: {
        "title": "좀비사냥",
        "description": "밤이 되면 길잃은 자들이 몰려옵니다. 물리치지 못하면 당신도 길을 잃게됩니다.",
        "startNpc": "npc_guard",
        "endNpc": "",
        "preconditions": {
            "level": 1
        },
        "objectives": [
            { "type": "kill", "targetId": "zombie", "amount": 1 }
        ],
        "rewards": {
            "experience": 100,
        }
    },
}