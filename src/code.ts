import crypto from 'crypto';
import { CodeOptions as CodeOptions } from './code-options';
import { calculateShannonEntropy, checkSaltLength, frequencyTest, runsTest } from './code-validation';
import { CryptoHash } from 'chipcryptbase';

export class CryptoHashImpl implements CryptoHash {
	constructor(public readonly options: CodeOptions) { }

	/** Ensures that the given code (salt) passes all of the tests for a Code */
	isValid(code: string) {
		return checkSaltLength(code, this.options.length)
			&& calculateShannonEntropy(code) >= this.options.minEntropy
			&& frequencyTest(code, this.options.frequencyPValueThreshold)
			&& runsTest(code, this.options.runsPValueThreshold);
	}

	/** Generates a unique Code with sufficient entropy based on the given options.
	* @throws An error if a Code with sufficient entropy cannot be generated within the maximum number of tries specified in the options.
	*/
	async generate() {
		let candidate: string;
		let tries = 0;
		do {
			if (tries > this.options.maxGenerateTries) {
				throw new Error('Unable to generate a Code with sufficient randomness');
			}
			candidate = crypto.randomBytes(this.options.length).toString('base64');
			++tries;
		} while (!this.isValid(candidate));
		return candidate;
	}

	/** Generate anonymized identifier using a Code as a salt */
	async makeNonce(identifier: string, code: string) {
		return crypto.createHash('sha256')
			.update(identifier + code)
			.digest('base64');
	}
}
