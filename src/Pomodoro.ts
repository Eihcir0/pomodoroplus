import * as vscode from 'vscode';
import Timer from './Timer';
import { XstateTimer } from './XstateTimerSrc/XstateTimer';

export enum PpStatus {
	NotStarted = 'Not Started',
	Working = 'Working',
	WorkDone = 'WorkDone',
	Break = 'On Break',
	LongBreak = 'On Long Break',
	PomodoroDone = 'Pomodoro Done',
	SetDone = 'Pomodoro Set Done',
}

export const PpDoneStatuses = [PpStatus.PomodoroDone, PpStatus.SetDone];

export interface PomoConfig {
	workMinutes: number;
	shortBreakMinutes: number;
	longBreakMinutes: number;
}

export default class Pomodoro {
	private _status: PpStatus;
	private _timer: XstateTimer | undefined;

	public get secondsRemaining() {
		return this._timer
			? this._timer.secondsRemaining
			: this._config.workMinutes * 60;
	}

	public get status() {
		return this._status;
	}

	public get tickCount() {
		// return 1;
		return this._timer ? this._timer.tickCounter : 0;
	}

	public get paused() {
		return this._timer?.paused;
	}

	public set status(status: PpStatus) {
		this._status = status;
	}

	constructor(
		private _config: PomoConfig,
		public onUpdate: () => void,
		public onFinish: () => void,
	) {
		this._status = PpStatus.NotStarted;
	}

	public start(long: boolean = false) {
		if (this._status === PpStatus.NotStarted) {
			this._status = PpStatus.Working;
			this._timer = new XstateTimer(
				this._config.workMinutes * 60,
				this.onUpdate,
				this._onFinish,
			);
		} else if (this._status === PpStatus.WorkDone) {
			this._status = long ? PpStatus.LongBreak : PpStatus.Break;
			const duration = long
				? this._config.longBreakMinutes
				: this._config.shortBreakMinutes;
			console.log('duration', duration);
			this._timer = new XstateTimer(
				duration * 60,
				this.onUpdate,
				this._onFinish,
			);
		}
	}

	// public extendWork(extensionMinutes) {
	// 	this._status = PpStatus.Working
	// }

	private _advanceStatus() {
		if (this._status === PpStatus.Working) {
			this._status = PpStatus.WorkDone;
		} else if (this.status === PpStatus.Break) {
			this._status = PpStatus.PomodoroDone;
		} else if (this.status === PpStatus.LongBreak) {
			this._status = PpStatus.SetDone;
		}
	}

	private _stopTimer = () => {
		if (this._timer !== undefined) {
			this._timer.kill();
			this._timer = undefined;
		}
	};
	public skip = () => {
		this._stopTimer();
		this._onFinish();
	};

	public cancel() {
		this._timer?.kill();
	}

	public pause = () => {
		this._timer?.pause();
	};

	public unpause = () => {
		this._timer?.unpause();
	};

	private _onFinish = () => {
		this._advanceStatus();
		this.onFinish();
	};
}
