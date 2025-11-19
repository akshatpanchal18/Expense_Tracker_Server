import PDFDocument from "pdfkit";

export const generateExpensesPDF = async (expenses, startDate, endDate) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: "A4",
        bufferPages: true,
      });

      let buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // HEADER
      doc
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("Expense Report", { align: "center" });
      doc.moveDown(1);

      doc
        .fontSize(11)
        .font("Helvetica")
        .text(
          `Period: ${startDate.toDateString()} to ${endDate.toDateString()}`,
          { align: "center" }
        );

      doc.moveDown(2);

      // TABLE HEADER
      const tableTop = doc.y;
      doc.font("Helvetica-Bold");
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

      // DATA ROWS
      let y = tableTop + 30;
      let total = 0;
      doc.font("Helvetica").fontSize(10);

      expenses.forEach((exp, i) => {
        if (y > 720) {
          doc.addPage();
          y = 50;
          doc.font("Helvetica-Bold");
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

      doc
        .font("Helvetica-Bold")
        .text(`Total: ₹${total.toFixed(2)}`, 350, y + 15);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// Helpers
function drawTableRow(doc, y, col1, col2, col3, col4, col5) {
  const colX = { num: 40, date: 80, desc: 160, category: 340, amount: 470 };
  doc
    .text(col1, colX.num, y, { width: 30 })
    .text(col2, colX.date, y, { width: 80 })
    .text(col3, colX.desc, y, { width: 180 })
    .text(col4, colX.category, y, { width: 120 })
    .text(col5, colX.amount, y, { width: 80, align: "right" });
}

function drawLine(doc, y) {
  doc
    .strokeColor("#cccccc")
    .lineWidth(0.5)
    .moveTo(40, y)
    .lineTo(550, y)
    .stroke();
}
