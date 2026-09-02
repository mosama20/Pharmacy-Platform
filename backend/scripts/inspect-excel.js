const xlsx = require('xlsx');
const path = require('path');

const filePath = 'D:\\chefaa_products.xlsx';
try {
  const workbook = xlsx.readFile(filePath);
  console.log('Sheet Names:', workbook.SheetNames);

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);

  console.log('Total Rows:', data.length);
  if (data.length > 0) {
    console.log('Headers / Keys:', Object.keys(data[0]));
    console.log('First 2 rows sample:\n', JSON.stringify(data.slice(0, 2), null, 2));
  }
} catch (e) {
  console.error('Error reading Excel file:', e);
}
