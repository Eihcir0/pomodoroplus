import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import Pomodoro, { PomoConfig, PpStatus } from '../../Pomodoro';

suite('Pomodoro Test Suite', () => {

	const config: PomoConfig = {
		workMinutes: 25,
		shortBreakMinutes: 5,
		longBreakMinutes: 20,
	};

	let onUpdateCalled = 0;
	const onUpdate: ()=>void = () => {
		onUpdateCalled +=1;
	};

	let onFinishCalled = 0;
	const onFinish: ()=>void = () => {
		onFinishCalled +=1;
	};

	test('Constructor', () => {
		const pomodoro = new Pomodoro(config, onUpdate, onFinish);
		assert.strictEqual(pomodoro.secondsRemaining, config.workMinutes * 60);
		assert.strictEqual(pomodoro.status, PpStatus.NotStarted);
		assert.strictEqual(onUpdateCalled, 0);
		pomodoro.onUpdate();
		pomodoro.onUpdate();
		pomodoro.onUpdate();
		assert.strictEqual(onUpdateCalled, 3);
		pomodoro.onFinish();
		assert.strictEqual(onFinishCalled, 1);

	});




});
