import { errorCodeFromLogs } from './parse-error'
import * as anchor from './anchor-errors'
import {
  ErrorMeta,
  ErrorWithCode,
  ErrorWithLogs,
  MaybeErrorWithCode,
  ResolveErrorFromCode,
} from './types'

// -----------------
// Error Resolver
// -----------------
export type ErrorResolverInitArgs = {
  resolveErrorFromCode?: ResolveErrorFromCode
  throwErrors?: boolean
}
class ErrorResolver {
  private readonly resolveErrorFromCode: ResolveErrorFromCode | undefined

  constructor(args?: ErrorResolverInitArgs) {
    args = args ?? {}
    this.resolveErrorFromCode = args.resolveErrorFromCode
  }

  errorFromCode(
    code: number,
    captureBoundaryFn?: Function,
    fallbackToUnknown = true
  ): MaybeErrorWithCode {
    // Try specific program errors first since they're more likely
    let err =
      this.resolveErrorFromCode != null ? this.resolveErrorFromCode(code) : null

    if (err != null) {
      return this.passPreparedError(
        err,
        captureBoundaryFn ?? this.errorFromCode
      )
    }

    // Then try errors of known programs
    err = AnchorError.fromCode(code)
    if (err != null) {
      return this.passPreparedError(
        err,
        captureBoundaryFn ?? this.errorFromCode
      )
    }

    if (fallbackToUnknown) {
      err = new CusperUnknownError(
        code,
        'CusperUnknownError',
        'cusper does not know this error'
      )
      return this.passPreparedError(
        err,
        captureBoundaryFn ?? this.errorFromCode
      )
    }
  }

  errorFromProgramLogs(
    logs: string[],
    fallbackToUnknown = true
  ): MaybeErrorWithCode {
    const code = errorCodeFromLogs(logs)
    return code == null
      ? null
      : this.errorFromCode(code, this.errorFromProgramLogs, fallbackToUnknown)
  }

  throwError(arg: ErrorWithLogs) {
    const err: ErrorWithCode =
      (arg.logs != null && this.errorFromProgramLogs(arg.logs, true)) ||
      new CusperUnknownError(
        -1,
        'Error created without logs and thus without error code'
      )
    throw this.passPreparedError(err, this.throwError)
  }

  private passPreparedError(err: ErrorWithCode, captureBoundaryFn: Function) {
    if (err == null) return null
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(err, captureBoundaryFn)
    }
    return err
  }
}

export function initCusper(args?: ErrorResolverInitArgs) {
  return new ErrorResolver(args)
}

// -----------------
// Unknown Error
// -----------------
class CusperUnknownError extends Error {
  constructor(readonly code: number, ...params: any[]) {
    super(...params)
    this.name = 'CusperUnknownError'
  }
}

// -----------------
// Anchor
// -----------------
class AnchorError extends Error {
  constructor(readonly code: number, name: string, ...params: any[]) {
    super(...params)
    this.name = `AnchorError#${name}`
  }
  static errorMap: Map<number, ErrorMeta> = Object.entries(
    anchor.LangErrorCode
  ).reduce((acc, [key, code]) => {
    acc.set(code, {
      code,
      name: key,
      message: anchor.LangErrorMessage.get(code),
    })
    return acc
  }, new Map())

  static fromCode(code: number): MaybeErrorWithCode {
    const errorMeta = AnchorError.errorMap.get(code)
    return errorMeta != null
      ? new AnchorError(errorMeta.code, errorMeta.name, errorMeta.message)
      : null
  }

  toString() {
    return `${this.name}: ${this.message}`
  }
}
