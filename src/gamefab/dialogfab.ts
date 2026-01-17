import { DialogManager } from "@Glibs/ux/dialog/souldialog/dlgmanager";
import { DialogStore } from "@Glibs/ux/dialog/souldialog/dlgstore";
import { DomRenderer } from "@Glibs/ux/dialog/souldialog/domrenderer";
import { CharacterView } from "@Glibs/ux/dialog/souldialog/views/characterview";
import { ConfirmView } from "@Glibs/ux/dialog/souldialog/views/confirmview";
import { InventoryView } from "@Glibs/ux/dialog/souldialog/views/inventoryview";
import { LevelupCardsView } from "@Glibs/ux/dialog/souldialog/views/levelupcardsview";
import { NarrativeView } from "@Glibs/ux/dialog/souldialog/views/narrativeview";
import { QuestDetailView } from "@Glibs/ux/dialog/souldialog/views/questdetailview";
import { QuestLogView } from "@Glibs/ux/dialog/souldialog/views/questlogview";
import { ShopView } from "@Glibs/ux/dialog/souldialog/views/shopview";
import { TechTreeService } from "@Glibs/techtree/techtreeservice";
import { TechTreeView } from "@Glibs/techtree/techview";
import IEventController from "@Glibs/interface/ievent";
import { ThreeCharacterRenderer } from "@Glibs/ux/dialog/souldialog/renderers/threechar";
import { Loader } from "@Glibs/loader/loader";
import { InvenFactory } from "@Glibs/inventory/invenfactory";
import { Player } from "@Glibs/actors/player/player";
import { Bind } from "@Glibs/types/assettypes";
import { IItem } from "@Glibs/interface/iinven";
import { EventTypes } from "@Glibs/types/globaltypes";
import { QuestManager } from "@Glibs/systems/quests/questmgr";
import { Item } from "@Glibs/inventory/items/item";
import { itemDefs } from "@Glibs/inventory/items/itemdefs";
import { ItemFactory } from "@Glibs/inventory/itemfactory";
import GameManager from "@Glibs/gameobjects/gamemanager";
import { DefaultTechTreeDefs } from "@Glibs/techtree/techtreedefs";
import { QuestCompleteView } from "@Glibs/ux/dialog/souldialog/views/questcompleteview";
import { QuestId } from "@Glibs/systems/quests/questdef";
import { RadialMenuUI } from "@Glibs/ux/radialmenus/radialmenus";
import { TSEventTypes } from "../types/commontypes";

export default class DialogFactory {
  manager: DialogManager
  store = new DialogStore();
  svc = new TechTreeService(DefaultTechTreeDefs, {
    levels: {}, // 저장 상태 있으면 주입
    ctx: {
      playerLv: 7,
      wallet: { points: 40, gold: 0, materials: 0 },
      tags: new Set(['fire']),
      quests: new Map([['intro', 'done']]),
      stats: { STR: 10, INT: 12 },
    },
  });
  gameMgr = new GameManager(this.eventCtrl, this.svc)
  ringMenu = new RadialMenuUI(this.eventCtrl, {
    // overlay 부모(생략시 document.body)
    parent: this.parent,
    onlyWhenTargetWithin: this.targetDom,

    // GUI에서 쓰던 옵션들
    radius: ((window.innerWidth > window.innerHeight) ? window.innerHeight : window.innerWidth) * 0.5 / 2,
    itemSize: 76,
    startAngleDeg: -90,
    animateMs: 520,
    spinOnOpen: 1.2,
    easing: 'outBack',
    ringStyle: 'none',     // 'none' | 'solid' | 'line'
    shape: 'circle',       // 'circle' | 'rounded' | 'square' | 'hex'
    theme: 'SF Neon',       // 또는 'custom' + themeVars
    fontScale: 0.52,
    autoCloseOnMiss: true,
    openAt: 'center',       // 또는 'pointer' (클릭 지점 팝업)
    enableGlobalCenterClick: true, // 전역 중앙 클릭 열기
  });
  constructor(
    private eventCtrl: IEventController,
    private loader: Loader,
    private invenFab: InvenFactory,
    private player: Player,
    private quest: QuestManager,
    private targetDom: HTMLElement,
    private parent: HTMLElement,
  ) {
    const renderer = new DomRenderer({ useShadow: true, theme: 'souls' });
    const manager = new DialogManager(eventCtrl, { renderer });
    const miniRenderer = new ThreeCharacterRenderer(this.loader, this.eventCtrl,
      this.invenFab, this.player);

    // 뷰 등록
    manager.registry.register('narrative', () => new NarrativeView());
    manager.registry.register('confirm', () => new ConfirmView());
    manager.registry.register('cards', () => new LevelupCardsView());
    manager.registry.register('shop', () => new ShopView());
    manager.registry.register('quest-log', () => new QuestLogView());
    manager.registry.register('quest-detail', () => new QuestDetailView());
    manager.registry.register('quest-complete', () => new QuestCompleteView());
    manager.registry.register('inventory', () => new InventoryView(miniRenderer));
    manager.registry.register('character', () => new CharacterView(miniRenderer));
    this.manager = manager

    eventCtrl.RegisterEventListener(EventTypes.QuestProcessChanged, () => { this.updateQuest(); })
    eventCtrl.RegisterEventListener(EventTypes.QuestStateChanged, () => { this.updateQuest(); })
    eventCtrl.RegisterEventListener(EventTypes.QuestComplete, (id: QuestId) => {
      this.openQuestComplete(id)
    })
    eventCtrl.RegisterEventListener(TSEventTypes.OpenCharacter, () => {
      this.openCharacter()
    })
  }
  Mount() {
    this.ringMenu.mount(document.body)
  }
  Unmount() {
    this.ringMenu.unmount()
  }
  updateQuest() {
    const defs = this.quest.questDefinitions;
    const active = this.quest.getActiveQuests();
    const completed = this.quest.completedQuests;
    this.store.syncQuests(defs, active, completed)
  }
  openCharacter() {
    const equip: Partial<Record<string, IItem | null>> = {};

    // bodySlot은 Map<Bind, IItem> 형태라고 가정
    this.invenFab.inven.bodySlot.forEach((item, bind) => {
      const uiSlot = this.mapBindToUISlot(bind);
      if (uiSlot) {
        equip[uiSlot] = item;
      }
    });
    this.manager.open('character', {
      base: { STR: 20, DEX: 14, INT: 8, FAI: 10, VIT: 22 },
      resistBase: { fire: 25, elec: 18, ice: 12 },
      equip,
    }, { wide: true });

  }
  openInventory() {
    // 1. 인벤토리 데이터: 변환 없이 그대로 가져옵니다.
    // GetInventories()는 이미 InventorySlot[] 타입을 반환합니다.
    const items = this.invenFab.inven.GetInventories();

    // 2. 장착 데이터: Game Logic의 bodySlot(Map)을 UI용 객체로 변환
    // (Bind Enum과 UI Slot 문자열 간의 매핑 필요)
    const equip: Partial<Record<string, IItem | null>> = {};

    // bodySlot은 Map<Bind, IItem> 형태라고 가정
    this.invenFab.inven.bodySlot.forEach((item, bind) => {
      const uiSlot = this.mapBindToUISlot(bind);
      if (uiSlot) {
        equip[uiSlot] = item;
      }
    });

    // 3. 콜백 연결 (실제 로직 호출)
    const onUse = (it: IItem) => {
      console.log('Use Item:', it.Name);
      // 실제 사용 로직: this.invenFab.inven.UseItem(it.Id) 등
      // 로직 수행 후 UI 갱신 필요
      this.refreshInventoryUI();
    };

    const onEquip = (slot: string, index: number, item: IItem) => {
      console.log('Equip Item:', item.Name);
      // 실제 장착 로직: this.invenFab.inven.EquipItem(item)
      // this.invenFab.inven.EquipItem(item);
      this.eventCtrl.SendEventMessage(EventTypes.Equipment, item.Id)

      // 로직 수행 후 UI 갱신
      this.refreshInventoryUI();
    };

    const onUnequip = (slot: string) => {
      // Bind 타입 역매핑 필요 혹은 UI 슬롯명으로 Bind 찾기
      // 예: this.invenFab.inven.UnequipItem(bindType)
      this.refreshInventoryUI();
    }

    const onDrop = (item: IItem) => {
      // Bind 타입 역매핑 필요 혹은 UI 슬롯명으로 Bind 찾기
      // 예: this.invenFab.inven.DropItem(bindType)
      this.eventCtrl.SendEventMessage(EventTypes.DiscardItem, item.Id)
      this.refreshInventoryUI();
    }

    // 4. 다이얼로그 열기
    this.manager.open('inventory', {
      items,
      equip,
      onUse,
      onEquip,
      onUnequip,
      onDrop,
      slots: this.invenFab.inven.MaxSlot // 슬롯 최대 개수 전달
    });
  }

  // UI 갱신용 헬퍼 함수
  private refreshInventoryUI() {
    const items = this.invenFab.inven.GetInventories();
    const equip: Partial<Record<string, IItem | null>> = {};

    this.invenFab.inven.bodySlot.forEach((item, bind) => {
      const uiSlot = this.mapBindToUISlot(bind);
      if (uiSlot) equip[uiSlot] = item;
    });

    this.manager.updateWhere("inventory", { items, equip });
  }

  // Bind Enum을 UI 슬롯 문자열로 변환하는 헬퍼
  private mapBindToUISlot(bind: string): string | null {
    // Bind Enum의 실제 값에 따라 수정 필요
    switch (bind) {
      case Bind.Head: return 'head';
      case Bind.Hands_R: return 'weapon'; // 혹은 hands
      case Bind.Hands_L: return 'offhand';
      case Bind.Body: return 'chest';
      case Bind.Legs: return 'legs';
      case Bind.Finger_R: return 'ring1';
      case Bind.Amulet: return 'amulet';
      // ... 나머지 매핑
      default: return null; // 'chest', 'legs', 'ring1' ...
    }
  }
  openQuestDetail() {
    this.manager.open('quest-detail', {
      quest: this.store.quests[0],
      trackedId: this.store.trackedQuestId,
      // [핵심] 아이템 데이터를 조회하는 함수 전달
      getItem: (itemId: string) => {
        const def = itemDefs[itemId as keyof typeof itemDefs];
        if (!def) return undefined;
        return new Item(ItemFactory.generateUniqueId(), def);
      }
    });
  }
  openQuestComplete(questId: QuestId = "Q004_TEST") {
    const myQuest = this.quest.getQuestInfo(questId)          // UIQuest 객체 (rewards 정보 포함)
    if (myQuest == null) return

    this.manager.open('quest-complete', {
      quest: myQuest,
      getItem: (itemId: string) => {
        const def = itemDefs[itemId as keyof typeof itemDefs];
        if (!def) return undefined;
        return new Item(ItemFactory.generateUniqueId(), def);
      },
      onComplete: (choiceIndex: number) => {
        // 1. 고정 보상 지급 (rewards)
        if (myQuest.rewards.experience)
          this.eventCtrl.SendEventMessage(EventTypes.Exp, myQuest.rewards.experience);
        if (myQuest.rewards.gold)
          this.eventCtrl.SendEventMessage(EventTypes.Gold, myQuest.rewards.gold);
        myQuest.rewards.items?.forEach(rw =>
          this.eventCtrl.SendEventMessage(EventTypes.Reward, rw.itemId, rw.amount));

        // 2. 선택 보상 지급 (selectiveRewards)
        if (myQuest.selectiveRewards) {
          // 선택된 인덱스가 있다면 해당 아이템 지급
          if (choiceIndex !== null && myQuest.selectiveRewards.items) {
            const selected = myQuest.selectiveRewards.items[choiceIndex];
            if (selected) {
              this.eventCtrl.SendEventMessage(EventTypes.Reward, selected.itemId, selected.amount);
            }
          }
          // (선택 보상에 경험치/골드가 포함되어 있다면 여기서 추가 지급 로직 구현)
        }
      }
    }, { confetti: 'blast' });
  }
  openQuestLog() {
    this.manager.open('quest-log', {
      quests: this.store.quests,
      trackedId: this.store.trackedQuestId,
      // [핵심] 아이템 데이터를 조회하는 함수 전달
      getItem: (itemId: string) => {
        const def = itemDefs[itemId as keyof typeof itemDefs];
        if (!def) return undefined;
        return new Item(ItemFactory.generateUniqueId(), def);
      }
    });
  }
  openNarative() {
    this.manager.open('narrative', { body: '<b>문이 잠겼습니다.</b><br>사슬 열쇠가 필요합니다.' }, {
      confetti: 'rain'  // <--- 효과 발동!
    });
  }
  openCard() {
    const techs = this.gameMgr.getAvailableTechs()
    const cards: any[] = []
    techs.forEach((tech) => {
      cards.push({
        id: tech.id,
        title: tech.name + " Lv." + tech.nextLv,
        rarity: tech.rarity,
        desc: tech.description
      })

    })
    this.manager.open('cards', {
      // cards: [
      //   { id: 'proj', title: '유도 단검 +1', rarity: 'Rare', desc: '추가 단검 1개 더 발사' },
      //   { id: 'dmg', title: '근접 피해 +25%', rarity: 'Common', desc: '모든 근접 피해 +25%' },
      //   { id: 'heal', title: '흡혈', rarity: 'Epic', desc: '처치 시 체력 소량 회복' },
      // ],
      cards,
      onPick: (id: string) => {
        this.gameMgr.upgradeTech(id)
        console.log(id)
      },
    }, {
      confetti: 'rain'  // <--- 효과 발동!
    });
  }
  openConfirm() {
    this.manager.open('confirm', {
      title: '사슬 열쇠가 필요합니다.',
      body: '사슬 열쇠가 필요합니다. <br>사슬 열쇠가 필요합니다.',
      onOk: () => { console.log('ok') },
      onCancel: () => { console.log('cancel') },
    })
  }
  openShop() {
    this.manager.open('shop', {
      items: [
        {
          id: 'potion_small', icon: '🧪', title: '소형 회복 물약', price: 120,
          rarity: 'Common', cat: '소모', desc: 'HP를 소량 회복합니다.', wt: 0.1, qty: 1
        },
        {
          id: 'iron_sword', icon: '🗡️', title: '강철 검', price: 1200,
          rarity: 'Rare', cat: '무기', desc: '튼튼한 강철로 만든 검. 기본 성능이 준수합니다.', wt: 3.5
        },
        {
          id: 'hunter_hood', icon: '🪖', title: '헌터 후드', price: 650,
          rarity: 'Common', cat: '방어구', desc: '사냥꾼들이 애용하는 가벼운 두건.', wt: 0.9, set: '헌터'
        },
      ],
      onBuy: (id: any) => {
        console.log(id)
        // TODO: 소지금 확인 → 차감 → 인벤토리에 추가 등
      },
    })
  }

  openTechTree() {
    this.manager.open('techtree', {
      title: 'Tech Tree',
      wide: true,
      service: this.svc,
      mode: 'canvas',           // ← DOM 렌더러 사용
      minimapInline: true,                     // 오버레이 생성
      minimapSize: { w: 60, h: 50 },        // 크기 지정
      minimapPos: { right: 10, top: 10 },     // 위치 지정
      zoom: { min: 0.4, max: 2.0, initial: 0.9 },
      nodeSize: { w: 160, h: 72 },
      gap: { x: 72, y: 48 },
      tooltip: {
        enable: true,
        follow: true,
        render: (n: any) => `<b>${n.name}</b><br/>Lv ${n.lv}/${n.maxLv}<br/><i>${n.kind}</i>`,
      },
      onNodeClick: (e: any) => {
        console.log(e)
        // 예: 레벨업 시도 → 성공 시 서비스 상태가 바뀌므로 뷰 refresh 필요
        // svc.levelUp(id);  // (당신 쪽 API에 맞게)
        // dlg.updateCurrent({}); // 또는 view.refresh() 호출 경로(아래 3번 예시) 사용
      },
      onNodeHover: (e: any) => {
        console.log(e)
        // 툴팁/상태바 갱신 등
      },
    });
  }
}