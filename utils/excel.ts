import writeExcelFile from 'write-excel-file/browser'

type ExcelCell = string | number | boolean | Date | null

function normalizeCell(value: unknown): ExcelCell {
  if (value == null) return null
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function toSheetData(data: Array<Record<string, unknown>>): ExcelCell[][] {
  if (data.length === 0) return []

  const columns = Array.from(new Set(data.flatMap((row) => Object.keys(row))))
  return [
    columns,
    ...data.map((row) => columns.map((column) => normalizeCell(row[column]))),
  ]
}

/**
 * 데이터를 엑셀 파일로 변환하고 다운로드하는 함수
 * @param data 엑셀에 저장할 데이터 (JSON 배열)
 * @param fileName 저장할 파일명 (기본값: "data.xlsx")
 * @param sheetName 엑셀 시트 이름 (기본값: "Sheet1")
 */

export const exportToExcel = async (
  data: Array<Record<string, unknown>>,
  fileName = 'data',
  sheetName = 'Sheet1'
): Promise<void> => {
  try {
    await writeExcelFile(toSheetData(data), { sheet: sheetName }).toFile(`${fileName}.xlsx`)
  } catch (error) {
    console.error('Excel download failed', error)
  }
}
