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

        if (file.name.endsWith('.csv')) {
          const workbook = XLSX.read(data, { type: 'string' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          rows = XLSX.utils.sheet_to_json(worksheet);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        } else {
          return reject(new Error("Unsupported file type. Use .csv or .xlsx"));
        }

        if (!rows || rows.length === 0) {
          return reject(new Error("File is empty or malformed"));
        }

        const columns = Object.keys(rows[0]);
        resolve({
          rows,
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
