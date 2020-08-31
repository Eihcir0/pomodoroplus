// const CHOICES = ['Richie  ⏳', '', 'Richie  ⏳', ''];
// // const CHOICES = ['Richie  ⏳', 'Kirby  ⌛', 'Mimi'];
// const something = (button: vscode.StatusBarItem, idx: number): void => {
// 	const choice = idx % 4;
// 	button.text = CHOICES[choice];
// 	button.show();
// 	setTimeout(something.bind(null, button, idx + 1), 500);
// };


// const options: vscode.MessageOptions = {
//     modal: true,
// };

// // Display a message box to the user
// // vscode.window.showWarningMessage(
// // 	'Hello devTooligan from P🍅MOdoro+!',
// // 	options,
// // 	...['action1', 'kirby', 'mimi', 'a', 'b', 'c'],
// // );
// // 	.then((response: (string | undefined)) =>
// // 		vscode.window.showWarningMessage(`${response}`),
// // 	);

// // const qpOptions: vscode.QuickPickOptions = {
// // 	canPickMany: true,
// // };
// // vscode.window.showQuickPick(['richie', 'kirby', 'mimi', 'a', 'b', 'c'], qpOptions).then(response => console.log(response))

// // const myToken = new vscode.CancellationTokenSource();
// // const ibOptions: vscode.InputBoxOptions = {
// // 	prompt: 'hi hi hi',
// // 	placeHolder: 'myplaceholder',
// // 	value: 'initial value',
// // };
// // vscode.window
// // 	.showInputBox(ibOptions, myToken.token)
// // 	.then(response => console.log(response));
// const _button: vscode.StatusBarItem = vscode.window.createStatusBarItem(
//     vscode.StatusBarAlignment.Right,
// );
// // _button.text = "Richie"
// _button.color = 'yellow';
// // _button.text = '🍅$(triangle-right)';
// _button.text = '🍅';
// // _button.command = "extension.startPomodoro";
// _button.tooltip = 'Start Pomodoro';
// _button.show();
// // something(_button, 0);

// // _button.text = `${Math.floor(Math.random() * 3)}`

// // vscode.window.setStatusBarMessage(
// // 	'Richie is so cool! Love, P🍅MOdoro+!',
// // );
