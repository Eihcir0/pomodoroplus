import {
	createMachine,
	assign,
	MachineConfig,
	MachineOptions,
	ServiceConfig,
	StateMachine,
	interpret,
} from 'xstate';
import {
	CreateTimerServiceOptions,
	TimerContext,
	TimerEvent,
	TimerState,
	TimerStatus,
} from './types';

const { Running, Idle, Paused } = TimerStatus;

const timerMachineConfig: MachineConfig<
	TimerContext,
	TimerState,
	TimerEvent
> = {
	states: {
		[Running]: {
			entry: 'enterRunning',
			always: {
				target: Idle,
				cond: 'checkExpired',
			},
			invoke: {
				src: 'ticker',
			},
			on: {
				PAUSE: {
					target: 'paused',
				},
				TICK: {
					actions: 'onTick',
				},
			},
		},
		[Paused]: {
			entry: 'onPause',
			on: {
				UNPAUSE: {
					target: Running,
					actions: 'onUnpause',
				},
			},
		},
		[Idle]: {
			always: {
				target: Running,
				cond: 'checkDuration',
			},
		},
	},
	on: {
		RESET: {
			target: Running,
			actions: assign({
				elapsed: _ => 0,
				offSet: _ => 0,
			}),
		},
		'DURATION.UPDATE': {
			actions: 'onDurationUpdate',
		},
	},
};

const checkExpired = (context: TimerContext) =>
	context.elapsed >= context.duration;

const checkDuration = (context: TimerContext) =>
	context.elapsed < context.duration;

const ticker = (context: TimerContext) => (cb: (message: string) => void) => {
	const interval = setInterval(() => {
		cb('TICK');
	}, 1000 * context.interval);

	return () => {
		clearInterval(interval);
	};
};

const onTick = assign<TimerContext, TimerEvent>({
	elapsed: context => {
		const elapsed = Math.min(
			((Date.now() - context.startTime) / 1000) + context.offSet,
			context.duration,
		);
		return +elapsed.toFixed(2);
	},
});

const onPause = assign<TimerContext, TimerEvent>({
	elapsed: context => {
		const { startTime, offSet } = context;
		const el = (Date.now() - startTime + offSet) / 1000;
		return +el.toFixed(2);
	},
	offSet: context => {
		return context.offSet + Date.now() - context.startTime;
	},
});

const onExpire = assign<TimerContext, TimerEvent>({
	elapsed: context => context.duration,
	offSet: _ => 0,
});

const enterRunning = assign<TimerContext, TimerEvent>({
	startTime: _ => Date.now(),
});

const onDurationUpdate = assign<TimerContext, TimerEvent>({
	duration: (context, event) => {
		if (event.type === 'DURATION.UPDATE') {
			return context.duration + event?.value;
		}
		return context.duration;
	},
	offSet: context => context.duration,
});

const timerOptions: MachineOptions<TimerContext, TimerEvent> = {
	actions: {
		onTick,
		onPause,
		enterRunning,
		onExpire,
		onDurationUpdate,
	},
	guards: {
		checkExpired,
		checkDuration,
	},
	activities: {},
	delays: {},
	services: {
		ticker,
	},
};

export const createTimerMachine = (
	options: CreateTimerServiceOptions,
): StateMachine<TimerContext, TimerState, TimerEvent> => {
	const context: TimerContext = {
		interval: 0.1,
		...options,
		offSet: 0,
		elapsed: 0,
		startTime: Date.now(),
	};

	return createMachine<TimerContext, TimerEvent>(
		{
			...timerMachineConfig,
			initial: Running,
			context,
		},
		timerOptions,
	);
};

export const createTimerService = (options: CreateTimerServiceOptions) => {
	const machine = createTimerMachine(options);
	const service = interpret(machine, { devTools: true });
	return service;
};
