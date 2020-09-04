import * as vscode from 'vscode';
import PomodoroPlusVSC from './PomodoroPlusVSC';

export function activate(context: vscode.ExtensionContext) {
	const pomodoroPlusVsc = new PomodoroPlusVSC();
	const activateDisposable = vscode.commands.registerCommand(
		'pomodoroplus.activate',
		pomodoroPlusVsc.handleStatusBarClick
	);

	context.subscriptions.push(pomodoroPlusVsc, activateDisposable);
	// context.subscriptions.push(activateDisposable);
}

export function deactivate() {
	// TODO: Log activity
}
