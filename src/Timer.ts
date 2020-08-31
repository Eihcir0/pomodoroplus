const TICK_INTERVAL = 500;

export default class Timer {
	public secondsRemaining: number;
	public tickCounter: number;

	public get paused() {
		return this._paused;
	}

	private _paused: boolean;
	private _latestStartTime: number;
	private _offset: number;
	private _timeout: NodeJS.Timeout | null;

	constructor(
		private _targetSeconds: number,
		private _onTick: () => void,
		private _onFinish: () => void,
	) {
		this._latestStartTime = Date.now();
		// this.secondsRemaining = Math.round(this._targetSeconds);
		this.secondsRemaining = this._targetSeconds;
		this._offset = 0;
		this._timeout = null;
		this.tickCounter = 0;
		this._paused = false;

		this.ticker();
	}

	private _isFinished = (): boolean => {
		return this.secondsRemaining <= 0;
	};

	public ticker = () => {
		this.tickCounter++;
		const elapsedSeconds = Math.round(
			(Date.now() - this._latestStartTime + this._offset) / 1000,
		);
		this.secondsRemaining = Math.round(
			this._targetSeconds - elapsedSeconds,
		);
		if (this._isFinished()) {
			this.secondsRemaining = 0;
			this._onFinish();
		} else {
			this._onTick();
			this._timeout = setTimeout(this.ticker, TICK_INTERVAL);
		}
	};

	public clearTimeout = () => {
		if (this._timeout) {
			clearTimeout(this._timeout);
		}
	};

	public pause = () => {
		this.clearTimeout();
		this._onTick();
		this._paused = true;
		this._offset = this._offset + Date.now() - this._latestStartTime;
	};

	public unpause() {
		this._paused = false;
		this._latestStartTime = Date.now();
		this.tickCounter = 0;
		this.ticker();
	}
}
