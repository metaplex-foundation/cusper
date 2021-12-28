/**
 * Error metadata used internally to create errors
 *
 * @private
 */
export type ErrorMeta = { code: number; name: string; message: string }
/**
 * Error that includes a code property.
 */
export type ErrorWithCode = Error & { code: number }
/**
 * Error that includes a `logs` property as is provided by `@solana/web3.js`.
 */
export type ErrorWithLogs = Error & { logs: string[] }
/**
 * @private
 */
export type MaybeErrorWithCode = ErrorWithCode | null | undefined
/**
 * Function to be provided to the {@link initCusper} in order to resolve custom
 * program errors.
 */
export type ResolveErrorFromCode = (
  code: number
) => ErrorWithCode | null | undefined
