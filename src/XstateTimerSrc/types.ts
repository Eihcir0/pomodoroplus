export interface TimerContext {
	offSet: number;
	elapsed: number;
	duration: number;
	interval: number;
	startTime: number;
}

export enum TimerStatus {
	Idle = 'idle',
	Running = 'running',
	Paused = 'paused',
}


export type TimerEvent =
	| {
			type: 'TICK';
	  }
	| {
			type: 'DURATION.UPDATE';
			value: number;
	  }
	| {
			type: 'RESET';
	  }
	| {
			type: 'PAUSE';
	  }
	| {
			type: 'START';
	  }
	| {
			type: 'UNPAUSE';
	  };

export type TimerState =
	| {
			value: TimerStatus.Running;
			context: TimerContext & { elapsed: number; duration: number };
	  }
	| {
			value: TimerStatus.Paused;
			context: TimerContext & {
				elapsed: number;
				duration: number;
				interval: number;
			};
	  }
	| {
			value: TimerStatus.Idle;
			context: TimerContext & { offSet: number; startTime: number };
	  };

export type CreateTimerServiceOptions = {
	duration: number;
	interval?: number;
	onTick: () => any;
	onFinish: () => any;
};
