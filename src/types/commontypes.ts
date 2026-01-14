import { EventTypes } from "@Glibs/types/globaltypes";

// 1. 기존 EventTypes를 확장하여 새로운 이벤트 정의
export const TSEventTypes = {
    ...EventTypes,
    HudCtrl: "hudCtrl", 
  } as const;
  
  // 2. 확장된 타입 추출
  export type TSEventTypes = typeof TSEventTypes[keyof typeof TSEventTypes];