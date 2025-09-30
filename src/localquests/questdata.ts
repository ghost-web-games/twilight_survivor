export enum QuestLocalId {
    Q003_OPENING_GET_LOGS = "Q003_OPENING_GET_LOGS",
    Q004_OPENING_CAMPFIRE = "Q004_OPENING_CAMPFIRE",
    Q005_FIRE_CAMPFIRE = "Q005_FIRE_CAMPFIRE",
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
        "description": "불을 피우기 위해 모닥불을 찾아야합니다..",
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
}