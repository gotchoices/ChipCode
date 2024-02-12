/**
 * @returns the length of the given base64 salt in bytes.
 */
export function getSaltLength(salt: string): number {
	return Buffer.byteLength(salt, 'base64');
}

/**
 * Shannon entropy is a measure of randomness present in a data.  The Shannon entropy value in this context will always be between 0 and 1,
 * regardless of the length of the input. This value represents the average uncertainty or randomness per bit in the given binary sequence.
 */
export function calculateShannonEntropy(salt: string): number {
	const binarySequence = bufferToBinaryString(Buffer.from(salt, 'base64'));
	const probabilities = new Map<string, number>();

	for (const bit of binarySequence) {
		probabilities.set(bit, (probabilities.get(bit) || 0) + 1);
	}

	return [...probabilities.values()].reduce((entropy: number, freq: number) => {
		const p = freq / binarySequence.length;
		return entropy - p * Math.log2(p);
	}, 0);
}

export function bufferToBinaryString(buffer: Buffer) {
	let binaryString = '';
	for (const byte of buffer) {
		binaryString += byte.toString(2).padStart(8, '0');
	}
	return binaryString;
}

/**
 * The Frequency (Monobit) Test is used to assess the randomness of a sequence of bits.  This is part of the NIST Statistical Test Suite for Randomness
 * A low p_value (close to 0) suggests that the observed sequence is consistent with the null hypothesis of randomness.
 * @returns the probability value
 */
export function frequencyTest(salt: string): number {
	const binarySequence = bufferToBinaryString(Buffer.from(salt, 'base64'));
	let sum = 0;
	for (let i = 0; i < binarySequence.length; i++) {
		sum += binarySequence[i] === '0' ? -1 : 1;
	}

	const s_obs = Math.abs(sum) / Math.sqrt(binarySequence.length);
	return Math.exp(-2 * s_obs * s_obs);
}

/**
 * Calculates the error function of a given number using a polynomial approximation.
 */
function erf(x: number): number {
	// Using an approximation of the error function
	const a1 = 0.254829592;
	const a2 = -0.284496736;
	const a3 = 1.421413741;
	const a4 = -1.453152027;
	const a5 = 1.061405429;
	const p = 0.3275911;

	const sign = x < 0 ? -1 : 1;
	x = Math.abs(x);

	const t = 1.0 / (1.0 + p * x);
	const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

	return sign * y;
}

/**
 * Returns the complementary approximate error function of a number.
 */
function erfc(x: number): number {
	return 1 - erf(x);
}

/**
 * This test checks the total number of runs in the sequence (a run is an uninterrupted sequence of identical bits).
 * The number of runs in a random sequence should follow a specific distribution.  This is part of the NIST Statistical Test Suite for Randomness.
 * A high p_value (close to 1) suggests that the observed sequence is consistent with the null hypothesis of randomness.
 * @returns the probability value
 */
export function runsTest(salt: string): number {
	const binarySequence = bufferToBinaryString(Buffer.from(salt, 'base64'));
	let totalRuns = 1;
	let ones = 0;

	for (let i = 0; i < binarySequence.length; i++) {
		ones += binarySequence[i] === '0' ? 0 : 1;
		if (i < binarySequence.length - 1) {
			totalRuns += binarySequence[i] !== binarySequence[i + 1] ? 1 : 0;
		}
	}

	const pi = ones / (binarySequence.length * 1.0);
	if (Math.abs(pi - 0.5) >= 2 / Math.sqrt(binarySequence.length)) {
		return 0; // The test is not applicable if pi is too far from 0.5
	}

	const vObs = totalRuns;
	return erfc(Math.abs(vObs - 2 * binarySequence.length * pi * (1 - pi)) / (2 * Math.sqrt(2 * binarySequence.length) * pi * (1 - pi)));
}
