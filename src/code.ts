import crypto from 'crypto';
import { CodeOptions } from './code-options';
import { calculateShannonEntropy, getSaltLength, frequencyTest, runsTest, arrayToBinaryString } from './code-validation';
import { CryptoHash, arrayToBase64, base64ToArray } from 'chipcryptbase';
import { extractExpiration, interleveExpiration } from './expiration';

export class CryptoHashImpl implements CryptoHash {
	constructor(public readonly options: CodeOptions = new CodeOptions()) { }

	/** Ensures that the given code (salt) passes all of the tests for high randomness */
	isValid(code: string) {
		return this.isValidBin(base64ToArray(code));
	}

	/** Ensures that the given code (salt) passes all of the tests for high randomness */
	isValidBin(code: Uint8Array) {
		const binary = arrayToBinaryString(code);
		return getSaltLength(code) >= this.options.byteLength
			&& calculateShannonEntropy(binary) >= this.options.minEntropy
			&& frequencyTest(binary) < this.options.frequencyPValueThreshold
			&& runsTest(binary) > this.options.runsPValueThreshold;
	}

	/** Ensures that the given code (salt) passes all of the tests for high randomness and isn't expired */
	isCurrentlyValid(code: string, now: number = Date.now()) {
		return this.isCurrentlyValidBin(base64ToArray(code), now);
	}

	/** Ensures that the given code (salt) passes all of the tests for high randomness and is not expired */
	isCurrentlyValidBin(code: Uint8Array, now: number = Date.now()) {
		const binary = arrayToBinaryString(code);
		return !this.isExpiredBin(code, now)
			&& getSaltLength(code) >= this.options.byteLength
			&& calculateShannonEntropy(binary) >= this.options.minEntropy
			&& frequencyTest(binary) < this.options.frequencyPValueThreshold
			&& runsTest(binary) > this.options.runsPValueThreshold;
	}

	/** @returns the expiration date/time (ms since Unix epoch) of the given code. */
	getExpiration(code: string): number {
		return this.getExpirationBin(base64ToArray(code));
	}

	/** @returns the expiration date/time (ms since Unix epoch) of the given (binary) code. */
	getExpirationBin(codeBytes: Uint8Array): number {
		return extractExpiration(codeBytes);
	}

	/** @returns true if the given session code is expired */
	isExpired(code: string, now: number = Date.now()) {
		return this.isExpiredBin(base64ToArray(code), now);
	}

	/** @returns true if the given session code (in binary form) is expired */
	isExpiredBin(codeBytes: Uint8Array, now: number = Date.now()) {
		return this.getExpirationBin(codeBytes) < now;
	}

	/** Generates a unique Code with sufficient entropy based on the given options.
	 * @throws An error if a Code with sufficient entropy cannot be generated within the maximum number of tries specified in the options.
	 */
	async generate(now: number = Date.now()) {
		return arrayToBase64(await this.generateBin(now));
	}

	/** Generates a unique Code (in binary form) with sufficient entropy based on the given options.
	 * @throws An error if a Code with sufficient entropy cannot be generated within the maximum number of tries specified in the options.
	 */
	async generateBin(now: number = Date.now()) {
		let candidate: Uint8Array;
		let tries = 0;
		do {
			if (tries > this.options.maxGenerateTries) {
				throw new Error(`Failed to generate a valid code after ${tries} tries.  The "crypto" library on this platform may not be sufficient.`);
			}
			candidate = crypto.randomBytes(this.options.byteLength);
			interleveExpiration(candidate, now + this.options.ageMs);
			++tries;
		} while (!this.isCurrentlyValidBin(candidate));
		return candidate;
	}

	/** Generate anonymized payload hash using a Code as a salt */
	async makeNonce(payload: string, code: string) {
		return crypto.createHash('sha256')
			.update(payload).update(code)
			.digest('base64');
	}

	/** Generate anonymized payload hash (in binary form) using a Code as a salt */
	async makeNonceBin(payloadBin: Uint8Array, codeBin: Uint8Array) {
		return crypto.createHash('sha256')
			.update(payloadBin).update(codeBin)
			.digest();
	}
}
