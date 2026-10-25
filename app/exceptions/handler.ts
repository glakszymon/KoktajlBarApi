import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    const isReferencedRecord =
      error instanceof Error && 'code' in error && error.code === 'ER_ROW_IS_REFERENCED_2'

    if (isReferencedRecord) {
      return ctx.response.status(409).send({
        code: 'E_RESOURCE_IN_USE',
        message: 'Nie można usunąć zasobu, ponieważ jest używany przez inne rekordy.',
      })
    }

    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging services or
   * the a third party error monitoring services.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
