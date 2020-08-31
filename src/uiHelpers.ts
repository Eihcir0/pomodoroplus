import * as vscode from 'vscode';

export function openModalWithActionButtons(
	actions: string[],
	processResponse: (r: string | undefined) => void,
): void {
	const options: vscode.MessageOptions = {
		modal: true,
	};
	vscode.window
		.showInformationMessage(
			'Hello devTooligan from P🍅MOdoro+!',
			options,
			...actions,
		)
		.then(processResponse);
}

export function createTomatoButton(): vscode.StatusBarItem {
	const button = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		1,
	);
	button.text = '🍅 NOT STARTED';
	button.tooltip = 'Pomodoro+ Action Menu';
	button.command = 'pomodoroplus.activate';
	return button;
}

// export function createTimeDisplay(): vscode.StatusBarItem {
// 	const statusBar = vscode.window.createStatusBarItem(
// 		vscode.StatusBarAlignment.Right,
// 		1000,
// 	);
// 	statusBar.text = 'Working 25:00';
// 	return statusBar;
// }
