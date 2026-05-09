// src/services/fileParser.js
import * as XLSX from 'xlsx';

export const parseFile = async (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file provided"));

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        let rows = [];

        // Configure XLSX to safely handle cell dates and parse them correctly
        const readOptions = { 
          cellDates: true, 
          dateNF: 'yyyy-mm-dd', // format output string internally before JS Date conversion
        };

        if (file.name.endsWith('.csv')) {
          const workbook = XLSX.read(data, { type: 'string', ...readOptions });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const workbook = XLSX.read(data, { type: 'array', ...readOptions });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          // use raw: false so it applies the dateNF format instead of keeping raw epoch 44929
          rows = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
        } else {
          return reject(new Error("Unsupported file type. Use .csv or .xlsx"));
        }

        if (!rows || rows.length === 0) {
          return reject(new Error("File is empty or malformed"));
        }

        const columns = Object.keys(rows[0]);
        // Extract up to 50 rows for preview sampling
        const previewRows = rows.slice(0, 50);

        resolve({
          rows, // all rows (could be 10k)
          previewRows,
          columns,
          rowCount: rows.length
        });
      } catch (err) {
        reject(new Error("Error parsing file: " + err.message));
      }
    };

    reader.onerror = () => reject(new Error("Error reading file"));

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};
