import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as extension from '../../extension';

suite('Extension Test Suite', () => {
	// CAN I / SHOULD I TEST CONFIG OPTIONS HERE?
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(1, [1, 2, 3].indexOf(2));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});
});
