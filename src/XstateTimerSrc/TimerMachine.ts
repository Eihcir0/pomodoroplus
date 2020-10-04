import {
	createMachine,
	assign,
	MachineConfig,
	MachineOptions,
	ServiceConfig,
	StateMachine,
	interpret,
} from 'xstate';
import Timer from './OldTimer';
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
				startTime: _ => Date.now(),
			}),
		},
		'DURATION.UPDATE': {
			actions: [assign({
				duration: (context, event) => context.duration + event.value,
				startTime: _ => Date.now(),
			}), (_, e)=>console.log('updated', e.value)],
		},
	},
};

const checkExpired = (context: TimerContext) =>
	context.elapsed >= context.duration;

const checkDuration = (context: TimerContext) =>
	context.elapsed < context.duration;

const ticker = (context: TimerContext) => (cb: (message: string) => void) => {
	const interval = setInterval(() => {
		console.log('actor sending tick');
		cb('TICK');
	}, 1000 * context.interval);

	return () => {
		clearInterval(interval);
	};
};

const onTick = assign<TimerContext, TimerEvent>({
	elapsed: context => {
		const elapsed = Math.min(
			(Date.now() - context.startTime + context.offSet) / 1000,
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

const onUnpause = assign<TimerContext, TimerEvent>({
	startTime: _ => Date.now(),
});

const timerOptions: MachineOptions<TimerContext, TimerEvent> = {
	actions: {
		onTick,
		onPause,
		onUnpause,
		onExpire,
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
			initial: 'running',
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
