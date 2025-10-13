// 1. 타이머의 상태를 위한 타입 정의
type TimerStatus = 'pending' | 'completed' | 'cleared';

// 2. 타이머 객체의 구조를 위한 인터페이스 정의
interface TimerState {
    id: number | null; // 브라우저 환경에서는 number, Node.js에서는 NodeJS.Timeout
    status: TimerStatus;
}

// 모든 타이머의 상태를 관리할 배열 (타입 지정)
const activeTimers: TimerState[] = [];

/**
 * 상태 관리가 포함된 새로운 setTimeout을 생성하는 함수
 * @param callback - 실행할 콜백 함수
 * @param delay - 지연 시간 (ms)
 * @param args - 콜백 함수에 전달할 인자들
 */
function createManagedTimeout(
    callback: (...args: any[]) => void,
    delay: number,
    ...args: any[]
): void {
    // 타이머의 상태를 저장할 객체 (타입 추론)
    const timerState: TimerState = {
        id: null,
        status: 'pending'
    };

    const wrappedCallback = (): void => {
        timerState.status = 'completed';
        console.log(`✅ 타이머 #${timerState.id} 실행 완료.`);
        callback(...args);
    };

    // setTimeout의 반환 타입은 환경에 따라 다르므로 number로 캐스팅하여 호환성 확보
    const timeoutId = setTimeout(wrappedCallback, delay) as unknown as number;
    timerState.id = timeoutId;

    activeTimers.push(timerState);

    console.log(`[생성] 타이머 #${timeoutId}가 ${delay}ms 후에 실행되도록 설정되었습니다.`);
}

/**
 * 아직 실행되지 않은 모든 'pending' 상태의 타이머를 해제하는 함수
 */
function clearAllPendingTimers(): void {
    console.log('\n--- ⏰ 유효한 타이머 해제 시작 ---');

    const timersToClear = activeTimers.filter(
        // 타입을 바꾸지 않고 값만 체크하도록 변경
        (timer) => timer.status === 'pending'
    );

    if (timersToClear.length === 0) {
        console.log('해제할 유효한 타이머가 없습니다.');
        return;
    }

    timersToClear.forEach((timer) => {
        // timer.id가 null이 아님을 TypeScript에 확신시킴
        if (timer.id !== null) {
            clearTimeout(timer.id);
            timer.status = 'cleared';
            console.log(`❌ 타이머 #${timer.id}가 해제되었습니다.`);
        }
    });

    console.log(`총 ${timersToClear.length}개의 타이머가 해제되었습니다.`);
    console.log('--- 타이머 해제 완료 ---\n');
}

export { createManagedTimeout, clearAllPendingTimers };

