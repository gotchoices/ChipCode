import crypto from 'crypto';
import { CodeOptions as CodeOptions } from './code-options';
import { calculateShannonEntropy, getSaltLength, frequencyTest, runsTest, arrayToBinaryString } from './code-validation';
import { CryptoHash, arrayToBase64, base64ToArray } from 'chipcryptbase';
import { interleveExpiration, isExpired } from '.';

export class CryptoHashImpl implements CryptoHash {
	constructor(public readonly options: CodeOptions) { }

	/** Ensures that the given code (salt) passes all of the tests for high randomness */
	isValid(code: string, now: number = Date.now()) {
		const codeBin = base64ToArray(code);
		return this.isValidArray(codeBin, now);
	}

	/** Ensures that the given code (salt) passes all of the tests for high randomness */
	isValidArray(code: Uint8Array, now: number = Date.now()) {
		const binary = arrayToBinaryString(code);
		return !isExpired(code, now)
			&& getSaltLength(code) >= this.options.byteLength
			&& calculateShannonEntropy(binary) >= this.options.minEntropy
			&& frequencyTest(binary) < this.options.frequencyPValueThreshold
			&& runsTest(binary) > this.options.runsPValueThreshold;
	}

	/** Generates a unique Code with sufficient entropy based on the given options.
	* @throws An error if a Code with sufficient entropy cannot be generated within the maximum number of tries specified in the options.
	*/
	async generate(now: number = Date.now()) {
		let candidate: Uint8Array;
		let tries = 0;
		do {
			if (tries > this.options.maxGenerateTries) {
				throw new Error('Unable to generate a Code with sufficient randomness');
			}
			candidate = crypto.randomBytes(this.options.byteLength);
			interleveExpiration(candidate, now + this.options.ageMs);
			++tries;
		} while (!this.isValidArray(candidate));
		return arrayToBase64(candidate);
	}

	/** Generate anonymized payload hash using a Code as a salt */
	async makeNonce(payload: string, code: string) {
		return crypto.createHash('sha256')
			.update(payload + code)
			.digest('base64');
	}
}
