import { Compiler, hooks } from '../../src';
import TestUtils from '../../../../tests/TestUtils';

const testName = 'hooks';
const testUtils = new TestUtils('stylify', testName);

const inputIndex = testUtils.getInputFile('index.html');
const compiler = new Compiler({ dev: true, mangleSelectors: true });

compiler.addComponent('title', 'font-size:32px');

hooks.addListener('compiler:newMacroMatch', ({selectorProperties}) => {
	const pixelUnit = selectorProperties.properties['font-size'];

	if (typeof pixelUnit === 'undefined' || !pixelUnit.endsWith('px')) {
		return;
	}

	const pixelFontSize = Number(pixelUnit.slice(0,-2));
	const remFontSize = pixelFontSize / 10;

	selectorProperties.addMultiple({
		'font-size': `${remFontSize}rem`,
		'line-height': `${remFontSize * (pixelFontSize >= 28 ? 1.2 : 1.7)}rem`
	});
});

let compilationResult = compiler.compile(inputIndex);
compilationResult = compiler.compile(inputIndex, compilationResult);

test('Hooks', (): void => {
	testUtils.testCssFileToBe(compilationResult.generateCss());
});
