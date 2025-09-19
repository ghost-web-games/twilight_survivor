export const newQuestDefs = {
    "Q003_OPENING_GET_LOGS": {
        "title": "나무 수집",
        "description": "불을 피우기 위한 나무가 필요합니다.",
        "startNpc": "npc_guard",
        "endNpc": "npc_guard",
        "preconditions": {
            "level": 1
        },
        "objectives": [
            { "type": "pickup", "targetId": "Logs", "amount": 5 }
        ],
        "rewards": {
            "experience": 100,
        }
    },
    "Q004_OPENING_CAMPFIRE": {
        "title": "꺼진 모닥불 찾기",
        "description": "불을 피우기 모닥불을 찾아야합니다..",
        "startNpc": "npc_guard",
        "endNpc": "npc_guard",
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
}