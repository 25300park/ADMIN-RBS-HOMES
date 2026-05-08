//  엑셀 다운로드 함수 02/25 추가
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

/**
 * 데이터를 엑셀 파일로 변환하고 다운로드하는 함수
 * @param data 엑셀에 저장할 데이터 (JSON 배열)
 * @param fileName 저장할 파일명 (기본값: "data.xlsx")
 * @param sheetName 엑셀 시트 이름 (기본값: "Sheet1")
 */

export const exportToExcel = (
  data: any[],
  fileName = "data",
  sheetName = "Sheet1"
) => {
  try {
    // 1. JSON 데이터를 엑셀 형식으로 변환
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // 3. 파일 다운로드 실행
    const fullFileName = `${fileName}.xlsx`;
    saveAs(blob, fullFileName);
  } catch (error) {
    console.error("Excel download failed", error);
  }
};
