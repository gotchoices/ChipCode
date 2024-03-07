## Welcome to ChipCode

### Purpose

ChipCode library, written in Typescript, is for generating and validating secure hash codes (Nonces) using highly random salt values (Codes).  These Codes and Nonces may be used for distributed protocols; the aim is to enable data within a given search discovery session, for instance, to be encrypted with a session code such that identifiers are anonymized, yet are deterministic within the session.

* **High randomness** - This library utilizes algorithms published by NIST to try to ensure that the generated Codes have sufficient randomness.
* **Expires** - An expiration date is embedded, which allows implementations to verify that the Code remains valid.  Expiration dates are rounded down to the minute.
* **String or byte encoding** - Code length: 32 bytes or 44 characters when base 64 encoded.

This library was built to support "lifts" in [MyChips](https://github.com/gotchoices/MyCHIPs), but may be suitable for other peer-to-peer systems.  

### Codes and Nonces

* **Code** - A Code is a generated high-entropy salt which can be used as an identifier or stored for the purpose of anonymizing other payloads.  
* **Nonce** - A Nonce, for the purpose of this library, is the term for an payload (could be an identifier to hide) that has been anonymized by a Code.  A Code is used as a cryptographically random salt to generate the hashed nonce, which acts as a surrogate for the payload.  The nonce is produced by getting the base64 encoding of the SHA-256 hash of the payload prepended to the Code.

Note: this library can verify the randomness of a given Code relative to itself, but to ensure that a given Code isn't being reused, a history of Codes should be kept until their expiration time.

Note: the term "nonce" here refers to the idea that the hashed information will have a one-time value for each, presumably transient salt.  The term has other meanings in certain domains of cryptography.

### Usage

####Generate a salt Code:

	generate(now?: number): string

The resulting code is guaranteed to pass randomness validation.  Note that it may take many iterations in order to find a sufficiently random code, and if the maximum tries elapses an exception will be thrown.  The optional `now` is the basis for expiration based on the ageMs in the options.  If `now` isn't specified, current system time will be used.

####Validate a given code:

	isValid(salt: string, now?: number): boolean

This is typically to validate a code generated by another party, for sufficient randomness and expiration.  If `now` isn't specified, current system time will be used to validate expiration.

####Generate a nonce:

	makeNonce(payload: string, code: string): string

Should always produce the same nonce given the same payload and salt Code.

####Putting together:

  var cryptoHash = new CryptoHash(new CodeOptions());
	var code = cryptoHash.generate();
	var nonce1 = cryptoHash.makeNonce('xyz', code);
	var nonce2 = cryptoHash.makeNonce('xyz', code);
	console.log(nonce1 === nonce2);	// true

### Configuration

`CodeOptions` interface:
* `minEntropy` - The minimum entropy required for the generated Code.  
  * Default value is 0.996, which represents 99.6% of the maximum entropy.
* `byteLength` - The length of the generated Code in bytes. This cannot be less than 32 bytes. 
  * Default value is 32.
* `maxGenerateTries` - The maximum number of attempts to generate a valid Code (with enough randomness) before erroring. 
  * Default value is 500.
* `frequencyPValueThreshold` - The upper p-value threshold for the frequency test.  
  * Default value is 0.23.
* `runsPValueThreshold` - The lower p-value threshold for the runs test.  
  * Default value is 0.61.
* `ageMs` - The duration, relative to generation time, for expiration of a Code (in milliseconds) Expirations are rounded down to the minute.
  * Default value is 30 minutes.

### Development

* Build: ```npm run build```
	* Builds into an ES module
* Test: ```npm test```
* Install Jest VSCode extension for easy test debugging
* Add .editorconfig support to VSCode or other IDE to honor conventions
