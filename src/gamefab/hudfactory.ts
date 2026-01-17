import { PlayerCtrl } from "@Glibs/actors/player/playerctrl"
import StatusCtrl from "@Glibs/gameobjects/statusctrl"
import IEventController from "@Glibs/interface/ievent"
import { EventTypes } from "@Glibs/types/globaltypes"
import { BuffStatus } from "@Glibs/ux/hud/soul/soulbuffstatus"
import { SoulCharacterFrame } from "@Glibs/ux/hud/soul/soulcharframe"
import { SoulMenuGroup } from "@Glibs/ux/hud/soul/soulmenugroup"
import { DefaultStatusBar } from "@Glibs/ux/hud/soul/soulstatusbar"
import { WideStatusBar } from "@Glibs/ux/hud/soul/soulstatuswidebar"
import { SoulVerticalBox } from "@Glibs/ux/hud/soul/soulverticalbox"
import { TSEventTypes } from "../types/commontypes"

export default class HudFactory {
    hud = new SoulMenuGroup(document.body, { height: "50px", top: "0px", opacity: "0" })
    constructor(
        private eventCtrl: IEventController,
        private playerCtrl: PlayerCtrl,
    ) {
        const heart = new DefaultStatusBar({ type: 'hp', max: 100 })
        const mp = new DefaultStatusBar({ type: 'mp', max: 100 })
        const exp = new WideStatusBar({ max: 100 })
        const verBox = new SoulVerticalBox([heart, mp, exp], 2 /*간격*/)
        const buffs = new BuffStatus({ align: 'right', size: 40 });
        // 2. 캐릭터 프레임 생성
        const charFrame = new SoulCharacterFrame({
          name: 'Hero',
          level: 1,
          icon: { type: 'text', value: '😎' }, // 이모지 사용``
          // 클릭 시 실행 (예: 상태창 열기)
          onClick: (e) => {
            this.eventCtrl.SendEventMessage(TSEventTypes.OpenCharacter)
          }
        });
        this.eventCtrl.RegisterEventListener(EventTypes.LevelUp, (lv: number) => {
          charFrame.setLevel(lv)
        })
        heart.UpdateStatus(100)
        mp.UpdateStatus(100)
        exp.UpdateStatus(0)

        // 왼쪽 영역(left)의 0번째 라인을 "내용물 크기(max-content) : 나머지(1fr)" 비율로 설정
        this.hud.setLineRatio('left', 0, 'max-content 1fr');
        this.hud.AddChild(charFrame, { id: 'char', area: 'left', line: 0 })
        this.hud.AddChild(verBox, { id: 'status', area: 'left', line: 0 })
        this.hud.AddChild(buffs, { id: 'buffs', area: 'right', line: 0 });
        this.hud.Hide()
        //buffs.addBuff({ id: 'ignite1', icon: '🔥', name: '점화', desc: '초당 화상 피해', duration: 80 });
    
        new StatusCtrl(this.eventCtrl, this.playerCtrl, heart, mp, exp, buffs)

        this.eventCtrl.RegisterEventListener(TSEventTypes.HudCtrl, ({ visible = false } = {}) => {
            if(visible) {
                this.hud.Show()
            } else {
                this.hud.Hide()
            }
        })
    }
}