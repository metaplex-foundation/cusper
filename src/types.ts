export type ErrorMeta = { code: number; name: string; message: string }
export type ErrorWithCode = Error & { code: number }
export type ErrorWithLogs = Error & { logs: string[] }
export type MaybeErrorWithCode = ErrorWithCode | null | undefined
export type ResolveErrorFromCode = (
  code: number
) => ErrorWithCode | null | undefined
