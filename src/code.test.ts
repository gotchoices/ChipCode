import { describe, expect, test } from '@jest/globals';
import { arrayToBinaryString, calculateShannonEntropy, frequencyTest, runsTest } from './code-validation';
import { codeOptionDefaults } from './code-options';
import crypto from 'crypto';
import { extractExpiration, interleveExpiration } from './expiration';
import { CryptoHashImpl } from './code';

describe('runsTest', () => {
	test('Base64 conversions', () => {
		var bytes = Buffer.from(binaryStringToBase64('1010101100011010'), 'base64');
		var bytesBase64 = bytes.toString('base64');
		var backToBytes = Buffer.from(bytesBase64, 'base64');
		const binarySequence = arrayToBinaryString(backToBytes);

		expect(backToBytes.toString('base64')).toBe(bytesBase64);
		expect(binarySequence).toBe(arrayToBinaryString(bytes));
	});

	test('should be high for highly random sequence', () => {
		const salt = '0SIAThaOI0FNxD48wx1M9zkwfaIWVi3ugu0hrNqvsGI=';
		const code = Buffer.from(salt, 'base64'); // Example salt input
		const binary = arrayToBinaryString(code);
		const pval = 0.8636360202644158;

		const result = runsTest(binary);

		expect(result).toBe(pval);
	});

	test('medium value for fairly distinct binary sequence', () => {
		const salt = binaryStringToBase64('1100101000101110'); // Example binary sequence
		const code = Buffer.from(salt, 'base64'); // Example salt input
		const binary = arrayToBinaryString(code);
		const pval = 0.31731052766472745;

		const result = runsTest(binary);

		expect(result).toBe(pval);
	});

	test('low value for repeating binary sequence', () => {
		const salt = binaryStringToBase64('1111111100000000'); // Example binary sequence
		const code = Buffer.from(salt, 'base64'); // Example salt input
		const binary = arrayToBinaryString(code);
		const pval = 0.0026999345626295135;

		const result = runsTest(binary);

		expect(result).toBe(pval);
	});
});

function binaryStringToBase64(binaryString: string): string {
	// Convert binary string to byte array
	let byteArray = new Uint8Array(binaryString.length / 8);
	for (let i = 0; i < byteArray.length; i++) {
		byteArray[i] = parseInt(binaryString.slice(i * 8, i * 8 + 8), 2);
	}

	// Convert byte array to base64 string
	let base64String = btoa(String.fromCharCode.apply(null, Array.from(byteArray)));
	return base64String;
}

describe('validateCode', () => {
	test('Informational: how many random codes pass validation', () => {
		// generate 1000 random codes and see how often they pass validation
		const options = { ...codeOptionDefaults };
		let valid = [0,0,0,0];
		for (let i = 0; i < 1000; i++) {
			const array = crypto.randomBytes(32);
			interleveExpiration(array, 1707973767682); // Example current time
			const binary = arrayToBinaryString(array);
			const tests = [
				calculateShannonEntropy(binary) >= options.minEntropy ? 1 : 0,
				frequencyTest(binary) < options.frequencyPValueThreshold ? 1 : 0,
				runsTest(binary) > options.runsPValueThreshold ? 1 : 0,
			];
			tests.push(tests[0] && tests[1] && tests[2] ? 1 : 0);
			tests.forEach((test, i) => {
				valid[i] += test;
			});
		}
		console.log(`${valid[0]} of 1000 passed Shannon entropy test`);
		console.log(`${valid[1]} of 1000 passed frequency test`);
		console.log(`${valid[2]} of 1000 passed runs test`);
		console.log(`${valid[3]} of 1000 passed all tests`);
	});

	test('expiration encoding and decoding work', () => {
		const salt = '0SIAThaOI0FNxD48wx1M9zkwfaIWVi3ugu0hrNqvsGI='; // Example salt input
		const buffer = Buffer.from(salt, 'base64');
		const expiration = Math.floor(1707973767682 / 10000) * 10000; // (in 10s of seconds)
		interleveExpiration(buffer, expiration);
		const extracted = extractExpiration(buffer);
		expect(extracted).toBe(expiration);
	});

	test('should return true for a valid code', async () => {
		const now = 1707973767682; // Example current time (don't let test expire)
		const oneYear = 365 * 24 * 60 * 60 * 1000;
		const cryptoHash = new CryptoHashImpl({ ageMs: oneYear });
		const salt = await cryptoHash.generate(now);

		expect(cryptoHash.isValid(salt)).toBe(true);
		expect(cryptoHash.isCurrentlyValid(salt, now)).toBe(true);
		expect(cryptoHash.isCurrentlyValid(salt, now + oneYear)).toBe(false);
		expect(cryptoHash.isCurrentlyValid(salt, now + oneYear - 10000)).toBe(true);
	});

	test('should return false for an invalid code', () => {
		const salt = 'AABBCCDDEEFFGGHHIIJJKKLLMMNNOOPPQQRRSTTUUVV='; // Example salt input
		const cryptoHash = new CryptoHashImpl();

		const result = cryptoHash.isValid(salt);

		expect(result).toBe(false);
	});
});
