import * as vscode from 'vscode';
import Timer from './Timer';

export enum PpStatus {
	NotStarted = 'Not Started',
	Working = 'Working',
	WorkDone = 'WorkDone',
	Break = 'On Break',
	AllDone = 'All Done',
}

export default class Pomodoro {
	// properties
	private _status: PpStatus;
	private _timer: Timer | undefined;

	public get paused() {
		return this._timer?.paused;
	}

	public get secondsRemaining() {
		return this._timer
			? this._timer.secondsRemaining
			: this._workMinutes * 60;
	}

	public get tickCount() {
		return this._timer
			? this._timer.tickCounter
			: 0;
	}

	public get status() {
		return this._status;
	}

	public set status(status: PpStatus) {
		this._status = status;
	}

	constructor(
		private _workMinutes: number,
		private _breakMinutes: number,
		public onUpdate: () => void,
		public onFinish: () => void,
	) {
		this._status = PpStatus.NotStarted;
	}

	public start() {
		if (this._status === PpStatus.NotStarted) {
			this._status = PpStatus.Working;
			this._timer = new Timer(
				this._workMinutes * 60,
				this.onUpdate,
				this._onFinish,
			);
		} else if (this._status === PpStatus.WorkDone) {
			this._status = PpStatus.Break;
			this._timer = new Timer(
				this._breakMinutes * 60,
				this.onUpdate,
				this._onFinish,
			);
		}
	}

	public pause = () => {
		this._timer?.pause();
	};

	public unpause = () => {
		this._timer?.unpause();
	};

	private _onFinish = () => {
		if (this._status === PpStatus.Working) {
			this._status = PpStatus.WorkDone;
		} else if (this.status === PpStatus.Break) {
			this._status = PpStatus.AllDone;
		}
		this.onFinish();
	};
}
