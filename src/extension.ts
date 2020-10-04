// import { inspect } from '@xstate/inspect';
// inspect({
// 	// options
// 	// url: 'https://statecharts.io/inspect', // (default)
// 	iframe: false // open in new window
// });
import * as vscode from 'vscode';
import PomodoroPlusVSC from './PomodoroPlusVSC';

export function activate(context: vscode.ExtensionContext) {
	const pomodoroPlusVsc = new PomodoroPlusVSC();
	const activateDisposable = vscode.commands.registerCommand(
		'pomodoroplus.activate',
		pomodoroPlusVsc.handleStatusBarClick
	);

	context.subscriptions.push(pomodoroPlusVsc, activateDisposable);
}

export function deactivate() {
	// TODO: Log activity
}
