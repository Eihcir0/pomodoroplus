import * as vscode from 'vscode';
import * as ui from './uiHelpers';
import * as say from 'say';
import Pomodoro, { PpStatus } from './Pomodoro';

const CONFIG_NAME = 'pomodoroplus';

enum Actions {
	StartWorking = 'Start working',
	ContinueWorking = 'Continue working',
	StartBreak = 'Start break',
	ContinueBreak = 'Continue break',
	StartNew = 'Start new P🍅MOdoro',
}

export default class PomodoroPlusVSC {
	private _completedCount: number;
	// private _config: vscode.WorkspaceConfiguration;
	private _config: any;
	private _currentPomodoro: Pomodoro;
	private _statusBar: vscode.StatusBarItem;
	// private _timeDisplay: vscode.StatusBarItem;

	constructor() {
		// this._config = vscode.workspace.getConfiguration(CONFIG_NAME);
		this._config = {
			workMinutes: 25,
			breakMinutes: 3,
		};
		this._completedCount = 0;

		this._currentPomodoro = this._resetPomodoro();

		this._statusBar = ui.createTomatoButton();
		this._statusBar.show();
	}

	public handleStatusBarClick = () => {
		if (this._currentPomodoro !== null) {
			this._currentPomodoro.pause();
		}
		this._showMainMenu();
	};

	private _resetPomodoro = () => {
		return new Pomodoro(
			this._config.workMinutes,
			this._config.breakMinutes,
			this._onUpdate,
			this._onFinish,
		);
	};

	private _showMainMenu = () => {
		let actions: string[] = [];
		switch (this._currentPomodoro.status) {
			case PpStatus.NotStarted:
				actions = [Actions.StartWorking];
				break;
			case PpStatus.Working:
				actions = [Actions.ContinueWorking];
				break;
			case PpStatus.Break:
				actions = [Actions.ContinueBreak];
				break;
			case PpStatus.WorkDone:
				actions = [Actions.StartBreak];
				break;
			case PpStatus.AllDone:
				actions = [Actions.StartNew];
				break;
			default:
				break;
		}
		ui.openModalWithActionButtons(actions, this._handleSelection);
	};

	private _handleSelection = (response: string | undefined) => {
		switch (response) {
			case Actions.StartWorking:
				this._currentPomodoro.start();
				say.speak('Enjoy your pomodoro');
				break;

			case Actions.StartBreak:
				this._currentPomodoro.start();
				break;

			case Actions.ContinueWorking:
				this._currentPomodoro.unpause();
				break;

			case Actions.ContinueBreak:
				this._currentPomodoro.unpause();
				break;

			case Actions.StartNew:
				this._currentPomodoro = this._resetPomodoro();
				this._currentPomodoro.start();
				break;

			default:
				break;
		}
	};

	private _onUpdate = () => {
		if (this._currentPomodoro === null) {
			return;
		}
		const secondsRemaining = this._currentPomodoro.secondsRemaining;
		if (
			secondsRemaining < 60 &&
			this._currentPomodoro.tickCount % 2 === 1 &&
			!this._currentPomodoro.paused
		) {
			// For blinking' effect during last minute, don't show time every other tick
			this._statusBar.text = `🍅${this._currentPomodoro.status}`;
		} else {
			const seconds = Math.floor(secondsRemaining % 60);
			const minutes = Math.floor(secondsRemaining / 60);

			// update status bar (text)
			const timeDisplay =
				(minutes < 10 ? '0' : '') +
				minutes +
				':' +
				(seconds < 10 ? '0' : '') +
				seconds;

			this._statusBar.text = `${timeDisplay} 🍅${this._currentPomodoro.status}`;
		}
		this._statusBar.show();
	};

	private _onFinish = () => {
		if (this._currentPomodoro.status === PpStatus.WorkDone) {
			say.speak('This Pomodoro work session is now over.  Nice job.');
		} else if (this._currentPomodoro.status === PpStatus.AllDone) {
			say.speak('Break time is over.')
		}
		this._onUpdate();
		this._showMainMenu();
	};

	public dispose = () => {
		// this._timer.kill()
	};
}
