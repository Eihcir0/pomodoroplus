import * as vscode from 'vscode';
import * as say from 'say';

import * as ui from './helpers/ui';
import * as request from './helpers/request';
import { formatDate } from './helpers/index';
import config from './config';
import Pomodoro, { PpStatus, PpDoneStatuses } from './Pomodoro';

enum Actions {
	StartWorking = 'Start working',
	ContinueWorking = 'Continue working',
	StartBreak = 'Start break',
	StartLongBreak = 'Start long break',
	ContinueBreak = 'Continue break',
	SkipBreak = 'Skip break and start new P🍅MO now',
	StartNew = 'Start new P🍅MOdoro',
}

export default class PomodoroPlusVSC {
	private _completedPomodoroCountForCurrentSet: number;
	private _completedSetCount: number;
	private _overallCompletedPomodoroCount: number;
	private _config: any; //update me
	private _currentPomodoro: Pomodoro;
	private _statusBar: vscode.StatusBarItem;
	private _slackEnabled: boolean;

	constructor() {
		this._config = config;
		this._slackEnabled = !!this._config.slackAppBearerToken;
		this._overallCompletedPomodoroCount = 0;
		this._completedPomodoroCountForCurrentSet = 0;
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
		const newPomodoroCount = this._completedPomodoroCountForCurrentSet + 1;
		switch (this._currentPomodoro.status) {
			case PpStatus.NotStarted:
				message = `P🍅MOdoro #${newPomodoroCount} -- Let's begin!`;
				actions.push(Actions.StartWorking);
				break;
			case PpStatus.Working:
				message = `P🍅MOdoro #${newPomodoroCount} -- working (paused)`;
				actions.push(Actions.ContinueWorking);
				break;
			case PpStatus.Break:
				message = `P🍅MOdoro #${newPomodoroCount} -- on break (paused)`;
				actions.push(Actions.ContinueBreak);
				actions.push(Actions.SkipBreak);
				break;
			case PpStatus.LongBreak:
				message = `P🍅MOdoro #${newPomodoroCount} -- on break (paused)`;
				actions.push(Actions.ContinueBreak);
				actions.push(Actions.SkipBreak);
				break;
			case PpStatus.WorkDone:
				if (
					this._completedPomodoroCountForCurrentSet >=
					this._config.setMin
				) {
					console.log(this._completedPomodoroCountForCurrentSet);
					console.log(this._config.setMin);
					console.log(this._config.setMax);
					message = `P🍅MOdoro #${newPomodoroCount} -- finished work.  Begin long break? (${this._config.longBreakMinutes} minutes)`;
					actions.push(Actions.StartLongBreak);
					if (
						this._completedPomodoroCountForCurrentSet <
						this._config.setMax
					) {
						actions.push(Actions.StartBreak);
					}
				} else {
					message = `P🍅MOdoro #${newPomodoroCount} -- finished work.  Begin short break? (${this._config.shortBreakMinutes} minutes)`;
					actions.push(Actions.StartBreak);
				}
				actions.push(Actions.SkipBreak);
				break;
			case PpStatus.PomodoroDone:
				message = `Begin P🍅MOdoro #${newPomodoroCount} of set #${
					this._completedSetCount + 1
				}?`;
				actions.push(Actions.StartNew);
				break;
			case PpStatus.SetDone:
				const sets =
					this._completedSetCount === 1
						? '1 full set'
						: `${this._completedSetCount} full sets`;
				message = `Congratulations!  You've completed ${sets} of P🍅MOdoros. Begin set #${
					this._completedSetCount + 1
				}?`;
				actions.push(Actions.StartNew);
				break;
			default:
				break;
		}
		message = `${message}\n\n${
			this._overallCompletedPomodoroCount
				? 'Completed today:' +
				  '🍅'.repeat(this._overallCompletedPomodoroCount)
				: ''
		}`;
		ui.openModalWithActionButtons(
			message,
			actions,
			this._handleMainMenuSelection,
		);
	};

	private _handleMainMenuSelection = (response: string | undefined) => {
		switch (response) {
			case Actions.StartWorking:
				say.speak('Enjoy your pomodoro');
				this._setSlackWorking();
				this._currentPomodoro.start();
				break;

			case Actions.StartBreak:
				say.speak('Give yourself a break');
				this._currentPomodoro.start();
				break;

			case Actions.StartLongBreak:
				say.speak('Starting long break -- Have fun!');
				this._currentPomodoro.start(true);
				break;

			case Actions.ContinueWorking:
				say.speak('Unpause');
				this._currentPomodoro.unpause();
				this._setSlackWorking();
				break;

			case Actions.ContinueBreak:
				say.speak('Unpause');
				this._currentPomodoro.unpause();
				this._setSlackWorking();
				break;

			case Actions.StartNew:
				this._currentPomodoro = this._createPomodoro();
				this._currentPomodoro.start();
				this._setSlackWorking();
				break;

			case Actions.SkipBreak:
				if (this._currentPomodoro.status === PpStatus.WorkDone) {
					if (
						this._completedPomodoroCountForCurrentSet <
						this._config.setMax
					) {
						this._currentPomodoro.status = PpStatus.Break;
					} else {
						this._currentPomodoro.status = PpStatus.LongBreak;
					}
				} else if (
					this._currentPomodoro.status === PpStatus.LongBreak
				) {
					this._completedPomodoroCountForCurrentSet;
				}
				this._currentPomodoro.skip();
				break;

			default:
				if (response === undefined) {
					// hijack the 'Cancel' button to cancel the current pomodoro
					this._confirmCancel();
				}
				break;
		}
	};

	private _setSlackStatus = (reset: boolean = false) => {
		let data: any;
		if (reset) {
			data = {
				profile: {
					status_text: '',
					status_emoji: '',
				},
			};
		} else {
			const status_expiration = Math.floor(
				Date.now() / 1000 + this._currentPomodoro.secondsRemaining + 60, // add 60 second buffer
			);

			const nextBreak = formatDate(
				Date.now() + this._currentPomodoro.secondsRemaining * 1000,
			);
			data = {
				profile: {
					status_text: `next break: ${nextBreak}`,
					status_emoji: ':tomato:',
					status_expiration,
				},
			};
		}
		const path = '/api/users.profile.set';
		request.makeSlackRequest(
			data,
			this._config.slackAppBearerToken,
			true,
			path,
		);
	};

	private _setSlackPauseNotifications = (reset = false) => {
		let num_minutes;
		if (reset) {
			num_minutes = 0;
		} else {
			num_minutes =
				Math.floor(this._currentPomodoro.secondsRemaining / 60) + 1; // add 1 minute buffer
		}
		const data: any = {
			num_minutes,
		};
		const path = '/api/dnd.setSnooze';
		request.makeSlackRequest(
			data,
			this._config.slackAppBearerToken,
			false,
			path,
		);
	};

	private _setSlackWorking = () => {
		if (this._slackEnabled) {
			this._setSlackStatus();
			this._setSlackPauseNotifications();
		}
	};

	private _setSlackStopWorking = () => {
		if (this._slackEnabled) {
			this._setSlackStatus(true);
			this._setSlackPauseNotifications(true);
		}
	};

	private _confirmCancel = () => {
		if (
			!this._currentPomodoro ||
			this._currentPomodoro.status === PpStatus.NotStarted
		) {
			return;
		} else {
			if (PpDoneStatuses.includes(this._currentPomodoro.status)) {
				this._cancelCurrentPomodoro();
			} else {
				ui.openModalWithActionButtons(
					'Are you sure you want to end this Pomodoro session early?',
					['Yes, abort this Pomodoro'],
					this._handleCancelConfirmResponse,
				);
			}
		}
	};

	private _cancelCurrentPomodoro = () => {
		this._currentPomodoro.cancel();
		this._currentPomodoro = this._createPomodoro();
		this._onUpdate();
		this._setSlackStopWorking();
	};

	private _handleCancelConfirmResponse = (response: string | undefined) => {
		if (response) {
			this._cancelCurrentPomodoro()
		} else {
			this._showMainMenu();
		}
	};

	private _onUpdate = () => {
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
			// We could track breaks
			say.speak('Break time is over.');
			this._completedPomodoroCountForCurrentSet += 1;
			this._overallCompletedPomodoroCount += 1;
		} else if (this._currentPomodoro.status === PpStatus.SetDone) {
			// and long breaks
			say.speak(
				'You completed an entire set of Pomodoros.  Congratulations.',
			);
			this._completedSetCount += 1;
			this._completedPomodoroCountForCurrentSet = 0;
			this._overallCompletedPomodoroCount += 1;
		}
		this._onUpdate();
		this._setSlackStopWorking();
		this._showMainMenu();
	};

	public dispose = () => {
		this._setSlackStopWorking();
		this._currentPomodoro.cancel();
	};
}
