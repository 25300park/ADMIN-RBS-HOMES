import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import ts from 'typescript'
import { describe, expect, test } from 'vitest'

const ACTION_FILES = [
  'add-unit-action.ts',
  'banners-action.ts',
  'complain-action.ts',
  'contact-action.ts',
  'dashboard-action.ts',
  'featured-action.ts',
  'message-action.ts',
  'notification-action.ts',
  'pms-action.ts',
  'popup-action.ts',
  'schedule-action.ts',
  'unit-action.ts',
  'user-action.ts',
  'visitors-action.ts',
] as const

const UPLOAD_ROUTES = [
  'app/api/banner/upload/route.ts',
  'app/api/popup/upload/route.ts',
  'app/api/upload/editor/route.ts',
  'app/api/upload/file/route.ts',
  'app/api/upload/unit/route.ts',
  'app/api/upload/video/route.ts',
] as const

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((modifier) => modifier.kind === kind) === true
}

function isAdminGuard(statement: ts.Statement | undefined): boolean {
  if (!statement || !ts.isExpressionStatement(statement)) return false
  if (!ts.isAwaitExpression(statement.expression)) return false
  const call = statement.expression.expression
  return ts.isCallExpression(call)
    && ts.isIdentifier(call.expression)
    && call.expression.text === 'requireAdminSession'
    && call.arguments.length === 0
}

async function parseProjectFile(path: string): Promise<ts.SourceFile> {
  const source = await readFile(resolve(process.cwd(), path), 'utf8')
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
}

describe('administrative server boundary inventory', () => {
  test('guards all 71 exported administrative actions before their body executes', async () => {
    const unguarded: string[] = []
    let actionCount = 0

    for (const file of ACTION_FILES) {
      const sourceFile = await parseProjectFile(`actions/${file}`)
      const functions = sourceFile.statements.filter((statement): statement is ts.FunctionDeclaration =>
        ts.isFunctionDeclaration(statement)
        && hasModifier(statement, ts.SyntaxKind.ExportKeyword)
        && hasModifier(statement, ts.SyntaxKind.AsyncKeyword))

      actionCount += functions.length
      for (const fn of functions) {
        if (!isAdminGuard(fn.body?.statements[0])) {
          unguarded.push(`${file}:${fn.name?.text ?? '<anonymous>'}`)
        }
      }
    }

    expect(actionCount).toBe(71)
    expect(unguarded).toEqual([])
  })

  test('wraps every reviewed upload POST with the shared administrator route guard', async () => {
    const unwrapped: string[] = []

    for (const route of UPLOAD_ROUTES) {
      const sourceFile = await parseProjectFile(route)
      const post = sourceFile.statements
        .filter(ts.isVariableStatement)
        .filter((statement) => hasModifier(statement, ts.SyntaxKind.ExportKeyword))
        .flatMap((statement) => [...statement.declarationList.declarations])
        .find((declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === 'POST')
      const initializer = post?.initializer
      const wrapped = initializer
        && ts.isCallExpression(initializer)
        && ts.isIdentifier(initializer.expression)
        && initializer.expression.text === 'withAdminRoute'

      if (!wrapped) unwrapped.push(route)
    }

    expect(unwrapped).toEqual([])
  })
})
