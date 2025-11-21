import PDFDocument from "pdfkit";
import path from "path";

export const generateExpensesPDF = async (expenses, startDate, endDate) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: "A4",
        bufferPages: true,
      });

      const fontPath = path.join(process.cwd(), "assets/fonts/NotoSans.ttf");

      doc.registerFont("NotoSans", fontPath);
      doc.font("NotoSans");

      let buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        resolve(Buffer.concat(buffers));
      });

      // ===== HEADER =====
      doc.fontSize(22).text("Expense Report", { align: "center" });

      doc.moveDown(0.5);

      doc
        .fontSize(11)
        .text(
          `Period: ${startDate.toDateString()} to ${endDate.toDateString()}`,
          { align: "center" }
        );

      doc.moveDown(2);

      // ===== TABLE HEADER =====
      const tableTop = doc.y;
      doc.fontSize(11);

      drawTableRow(
        doc,
        tableTop,
        "#",
        "Date",
        "Description",
        "Category",
        "Amount (₹)"
      );

      drawLine(doc, tableTop + 20);

      // ===== DATA ROWS =====
      let y = tableTop + 30;
      let total = 0;

      doc.fontSize(10);

      expenses.forEach((exp, i) => {
        if (y > 720) {
          doc.addPage();
          y = 50;

          drawTableRow(
            doc,
            y,
            "#",
            "Date",
            "Description",
            "Category",
            "Amount (₹)"
          );
          drawLine(doc, y + 20);
          y += 30;
        }

        drawTableRow(
          doc,
          y,
          i + 1,
          new Date(exp.date).toLocaleDateString("en-IN"),
          exp.description || "-",
          exp.category?.name || "N/A",
          `₹${exp.amount.toFixed(2)}`
        );

        total += exp.amount;
        y += 25;
      });

      doc.fontSize(12).text(`Total: ₹${total.toFixed(2)}`, 360, y + 20);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// ===== Helpers =====
function drawTableRow(doc, y, col1, col2, col3, col4, col5) {
  const colX = {
    num: 40,
    date: 80,
    desc: 150,
    category: 330,
    amount: 450,
  };

  doc
    .text(col1, colX.num, y, { width: 30 })
    .text(col2, colX.date, y, { width: 70 })
    .text(col3, colX.desc, y, { width: 170 })
    .text(col4, colX.category, y, { width: 110 })
    .text(col5, colX.amount, y, { width: 90, align: "right" });
}

function drawLine(doc, y) {
  doc
    .strokeColor("#cccccc")
    .lineWidth(0.5)
    .moveTo(40, y)
    .lineTo(550, y)
    .stroke();
}
