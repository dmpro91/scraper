import { utils, writeFile, WorkSheet, WorkBook, Table2SheetOpts, JSON2SheetOpts } from 'xlsx';
import { UuidHelper } from './uuid.helper';

/**
 * API Reference here https://docs.sheetjs.com/
 */
export class XLSXHelper {
    // Form table HTML element
    static tableToSheet(element: HTMLTableElement, opts?: Table2SheetOpts): WorkSheet {
        return utils.table_to_sheet(element, opts);
    }

    static jsonToSheet(data: unknown[], opts?: JSON2SheetOpts) {
        return utils.json_to_sheet(data, opts)
    }

    static createWorkbook(): WorkBook {
        return utils.book_new();
    }

    static appendSheetToBook(workbook: WorkBook, worksheet: WorkSheet, sheetName: string): void {
        utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    /**
     * @param extension - string use allowed output formats => https://docs.sheetjs.com/docs/api/write-options#supported-output-formats
     */
    static writeAndDownloadFile(workbook: WorkBook, fileName: string = UuidHelper.v4(), extension = 'xlsx'): void {
        writeFile(workbook, `${fileName}.${extension}`);
    }

    static sheetNameWithLimits(name: string): string {
        return name.length < 31 ? name : name.slice(0, 31); 
    }
}
