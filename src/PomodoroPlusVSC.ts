import * as vscode from 'vscode';
import * as ui from './uiHelpers';
import * as say from 'say';

import config from './config';
import Pomodoro, { PpStatus } from './Pomodoro';
import { ppid } from 'process';

enum Actions {
	StartWorking = 'Start working',
	ContinueWorking = 'Continue working',
	StartBreak = 'Start break',
	StartLongBreak = 'Start long break',
	ContinueBreak = 'Continue break',
	StartNew = 'Start new P🍅MOdoro',
}

export default class PomodoroPlusVSC {
	private _completedPomodoroCount: number;
	private _completedSetCount: number;
	private _config: any; //update me
	private _currentPomodoro: Pomodoro;
	private _statusBar: vscode.StatusBarItem;

	constructor() {
		this._config = config;
		this._completedPomodoroCount = 0;
		this._completedSetCount = 0;
		this._currentPomodoro = this._createPomodoro();

		this._statusBar = ui.createTomatoButton();
		this._statusBar.show();
	}

	public handleStatusBarClick = () => {
		if (this._currentPomodoro.status !== PpStatus.NotStarted) {
			say.speak('Pause');
			this._currentPomodoro.pause();
		}
		this._showMainMenu();
	};

	private _createPomodoro = () => {
		return new Pomodoro(this._config, this._onUpdate, this._onFinish);
	};

	private _showMainMenu = () => {
		let message: string = '';
		const actions: string[] = [];
		switch (this._currentPomodoro.status) {
			case PpStatus.NotStarted:
				message = `Would you like to begin P🍅MOdoro #${
					this._completedPomodoroCount + 1
				}, set #${this._completedSetCount + 1}`;
				actions.push(Actions.StartWorking);
				break;
			case PpStatus.Working:
				message = `Now working on P🍅MOdoro #${
					this._completedPomodoroCount + 1
				}, set #${this._completedSetCount + 1}`;
				actions.push(Actions.ContinueWorking);
				break;
			case PpStatus.Break:
				message = `Now on break for P🍅MOdoro #${
					this._completedPomodoroCount + 1
				}, set #${this._completedSetCount + 1}`;
				actions.push(Actions.ContinueBreak);
				break;
			case PpStatus.WorkDone:
				if (this._completedPomodoroCount >= this._config.setMin - 1) {
					actions.push(Actions.StartLongBreak);
					if (
						this._completedPomodoroCount <
						this._config.setMax - 1
					) {
						actions.push(Actions.StartBreak);
					}
					message = `Finished work on P🍅MOdoro #${
						this._completedPomodoroCount + 1
					}, set #${
						this._completedSetCount + 1
					}. Would you like to start your ${
						this._config.shortBreakMinutes
					} minute long break?`;
				} else {
					actions.push(Actions.StartBreak);
					message = `Finished work on P🍅MOdoro #${
						this._completedPomodoroCount + 1
					}, set #${
						this._completedSetCount + 1
					}. Would you like to start your ${
						this._config.shortBreakMinutes
					} minute break?`;
				}
				break;
			case PpStatus.PomodoroDone:
				// logic messed up here being #7 set #1 should say #1 set #2
				message = `Would you like to begin a new P🍅MOdoro #${
					this._completedPomodoroCount + 1
				}, set #${this._completedSetCount + 1}?`;
				actions.push(Actions.StartNew);
				break;
			case PpStatus.SetDone:
				const sets =
					this._completedSetCount === 1
						? '1 full set'
						: `${this._completedSetCount} full sets`;
				message = `Congratulations!  You've completed ${sets} of P🍅MOdoros. Would you like to begin set #${
					this._completedSetCount + 1
				}?`;
				actions.push(Actions.StartNew);
				break;
			default:
				break;
		}
		ui.openModalWithActionButtons(
			message,
			actions,
			this._handleMainMenuSelection,
		);
	};

	private _handleMainMenuSelection = (response: string | undefined) => {
		switch (response) {
			case Actions.StartWorking:
				this._currentPomodoro.start();
				say.speak('Enjoy your pomodoro');
				break;

			case Actions.StartBreak:
				say.speak('Give yourself a break');
				this._currentPomodoro.start();
				break;

			case Actions.StartLongBreak:
				this._currentPomodoro.start(true);
				break;

			case Actions.ContinueWorking:
				say.speak('Unpause');
				this._currentPomodoro.unpause();
				break;

			case Actions.ContinueBreak:
				say.speak('Unpause');
				this._currentPomodoro.unpause();
				break;

			case Actions.StartNew:
				this._currentPomodoro = this._createPomodoro();
				this._currentPomodoro.start();
				break;

			default:
				if (response === undefined) {
					this._confirmCancel();
				}
				break;
		}
	};

	private _confirmCancel = () => {
		if (
			!this._currentPomodoro ||
			this._currentPomodoro.status === PpStatus.NotStarted
		) {
			return;
		} else {
			ui.openModalWithActionButtons(
				'Are you sure you want to end this Pomodoro session early?',
				['Yes, abort this Pomodoro'],
				this._handleCancelConfirmResponse,
			);
		}
	};

	private _handleCancelConfirmResponse = (response: string | undefined) => {
		if (response) {
			this._currentPomodoro.cancel();
			this._currentPomodoro = this._createPomodoro();
			this._onUpdate();
		} else {
			this._showMainMenu();
		}
	};

	private _onUpdate = () => {
		if (this._currentPomodoro === null) {
			return;
		}
		if (this._currentPomodoro.status === PpStatus.NotStarted) {
			this._statusBar.text = `🍅${this._currentPomodoro.status}`;
		} else if (
			this._currentPomodoro.secondsRemaining < 60 &&
			this._currentPomodoro.tickCount % 2 === 1 &&
			!this._currentPomodoro.paused
		) {
			// For blinking' effect during last minute, don't show time every other tick
			this._statusBar.color = 'yellow';
		} else {
			const seconds = Math.floor(
				this._currentPomodoro.secondsRemaining % 60,
			);
			const minutes = Math.floor(
				this._currentPomodoro.secondsRemaining / 60,
			);

			// update status bar (text)
			const timeDisplay =
				(minutes < 10 ? '0' : '') +
				minutes +
				':' +
				(seconds < 10 ? '0' : '') +
				seconds;
			this._statusBar.color = 'white';
			this._statusBar.text = `${timeDisplay} 🍅${this._currentPomodoro.status}`;
		}
		this._statusBar.show();
	};

	private _onFinish = () => {
		if (this._currentPomodoro.status === PpStatus.WorkDone) {
			say.speak('This Pomodoro work session is now over.');
		} else if (this._currentPomodoro.status === PpStatus.PomodoroDone) {
			say.speak('Break time is over.');
			this._completedPomodoroCount += 1;
		} else if (this._currentPomodoro.status === PpStatus.SetDone) {
			say.speak(
				'You completed an entire set of Pomodoros.  Congratulations.',
			);
			this._completedPomodoroCount = 0;
			this._completedSetCount += 1;
		}
		this._onUpdate();
		this._showMainMenu();
	};

	public dispose = () => {
		this._currentPomodoro?.cancel();
	};
}
