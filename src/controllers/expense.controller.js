import { Budget } from "../models/budget.model.js";
import { Expense } from "../models/expense.model.js";
import ApiError from "../utils/error.js";
import Response from "../utils/response.js";
import PDFDocument from "pdfkit";

export const createExpense = async (req, res) => {
  const user = req.user;
  const { amount, description, category } = req.body;
  try {
    if (!amount || !description || !category) {
      res.status(400).json(new ApiError(400, "All fields are required"));
      return;
    }
    const expense = new Expense({
      user: user._id,
      category,
      description,
      amount,
    });
    await expense.save();
    res.status(201).json(new Response(201, { expense }, "expense created"));
  } catch (error) {
    console.log("Create expense error", error);
  }
};

// export const getExpenses = async (req, res) => {
//   const user = req.user;
//   const { type } = req.query; // "recent" | "all"
//   console.log("⭕get expense called with type:⭕", type);

//   try {
//     let expenses = [];

//     if (type === "recent") {
//       // last 10 newest expenses
//       expenses = await Expense.find({ user: user._id })
//         .populate("category", "_id name code")
//         .sort({ createdAt: -1 })
//         .limit(10);
//     } else {
//       // default → return all
//       expenses = await Expense.find({ user: user._id })
//         .populate("category")
//         .sort({
//           createdAt: -1,
//         });
//     }

//     return res
//       .status(200)
//       .json(new Response(200, { expenses }, "Expenses fetched successfully"));
//   } catch (error) {
//     return res
//       .status(500)
//       .json(new ApiError(500, error.message || "Failed to fetch expenses"));
//   }
// };
export const getExpenses = async (req, res) => {
  const user = req.user;
  const { type, page = 1, limit = 20 } = req.query;

  console.log("⭕ get expense called with type:", type);

  try {
    let expenses = [];
    let total = 0;

    // 👉 RECENT — NO PAGINATION
    if (type === "recent") {
      expenses = await Expense.find({ user: user._id })
        .populate("category", "_id name code")
        .sort({ createdAt: -1 })
        .limit(10);

      return res
        .status(200)
        .json(new Response(200, { expenses }, "Recent expenses fetched"));
    }

    if (type === "monthly") {
      const now = new Date();

      // Last 30 days range
      const last30 = new Date();
      last30.setDate(last30.getDate() - 30);

      const skip = (page - 1) * limit;

      const matchQuery = {
        user: user._id,
        date: { $gte: last30, $lte: now },
      };

      const total = await Expense.countDocuments(matchQuery);

      const expenses = await Expense.find(matchQuery)
        .populate("category", "_id name code")
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit));

      return res.status(200).json(
        new Response(
          200,
          {
            expenses,
            pagination: {
              total,
              page: Number(page),
              limit: Number(limit),
              totalPages: Math.ceil(total / limit),
            },
          },
          "Last 30 days expenses fetched"
        )
      );
    }

    // 👉 DEFAULT (if type missing)
    // expenses = await Expense.find({ user: user._id })
    //   .populate("category")
    //   .sort({ createdAt: -1 });

    // return res
    //   .status(200)
    //   .json(new Response(200, { expenses }, "Expenses fetched"));
  } catch (error) {
    console.log("❌ Error:", error);

    return res
      .status(500)
      .json(new ApiError(500, error.message || "Internal Server Error"));
  }
};

export const getStats = async (req, res) => {
  const user = req.user;

  try {
    const now = new Date();

    const month = now.getMonth();
    const year = now.getFullYear();

    // Monthly Budget
    const budget = await Budget.findOne({
      user: user._id,
      month,
      year,
    });

    const monthlyBudget = budget?.amount || 0;

    // Monthly Spent
    const monthStart = new Date(year, month, 1);
    const nextMonthStart = new Date(year, month + 1, 1);

    const monthlyExpenses = await Expense.aggregate([
      {
        $match: {
          user: user._id,
          createdAt: { $gte: monthStart, $lt: nextMonthStart },
        },
      },
      {
        $group: { _id: null, totalSpent: { $sum: "$amount" } },
      },
    ]);

    const monthlySpent = monthlyExpenses[0]?.totalSpent || 0;

    // Today Spent
    const todayStart = new Date(year, month, now.getDate());
    const tomorrowStart = new Date(year, month, now.getDate() + 1);

    const todayExpenses = await Expense.aggregate([
      {
        $match: {
          user: user._id,
          createdAt: { $gte: todayStart, $lt: tomorrowStart },
        },
      },
      {
        $group: { _id: null, totalSpent: { $sum: "$amount" } },
      },
    ]);

    const todaySpent = todayExpenses[0]?.totalSpent || 0;

    // Calculate remaining / overspent
    let remaining = monthlyBudget - monthlySpent;
    let overspent = 0;

    if (remaining < 0) {
      overspent = Math.abs(remaining);
      remaining = 0;
    }

    // Response
    return res.status(200).json(
      new Response(
        200,
        {
          monthStats: {
            month,
            year,
            budget: monthlyBudget,
            spent: monthlySpent,
            remaining,
            overspent, // 🔥 Added here
          },
          todayStats: {
            date: now.toISOString().split("T")[0],
            spent: todaySpent,
          },
          user: {
            name: user.name,
          },
        },
        "Stats fetched successfully"
      )
    );
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, error.message || "Failed to fetch stats"));
  }
};

export const getExpenseStatistics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Aggregate month-wise totals
    const stats = await Expense.aggregate([
      {
        $match: {
          user: userId,
        },
      },
      {
        $group: {
          _id: { month: { $month: "$date" } },
          total: { $sum: "$amount" },
        },
      },
      {
        $sort: { "_id.month": 1 }, // Jan -> Dec
      },
    ]);

    // Map month number to name
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Create full 12-month dataset (so missing months become 0)
    const response = months.map((month, index) => {
      const found = stats.find((s) => s._id.month === index + 1);
      return {
        month,
        total: found ? found.total : 0,
      };
    });

    return res.status(200).json({
      success: true,
      statistics: response,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Statistics fetch failed" });
  }
};

export const exportExpensesPDF = async (req, res) => {
  try {
    const user = req.user;
    const { start, end } = req.query;

    // Validation
    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    endDate.setHours(23, 59, 59, 999);

    // Fetch only logged-in user's expenses
    const expenses = await Expense.find({
      user: user._id,
      date: { $gte: startDate, $lte: endDate },
    })
      .populate("category")
      .sort({ date: 1 }); // Sort by date ascending

    // Create PDF
    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      bufferPages: true,
    });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=expenses_${start}_${end}.pdf`
    );
    res.setHeader("Cache-Control", "no-cache");

    // Pipe the PDF to response
    doc.pipe(res);

    // TITLE & HEADER
    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("Expense Report", { align: "center" });

    doc.moveDown(0.5);

    doc
      .fontSize(11)
      .font("Helvetica")
      .text(
        `Period: ${startDate.toDateString()} to ${endDate.toDateString()}`,
        {
          align: "center",
        }
      );

    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, {
      align: "center",
    });

    doc.moveDown(1.5);

    // TABLE HEADER
    const tableTop = doc.y;

    doc.fontSize(11).font("Helvetica-Bold");
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

    // TABLE ROWS
    let y = tableTop + 30;
    let totalAmount = 0;

    doc.font("Helvetica").fontSize(10);

    expenses.forEach((exp, i) => {
      // Check if we need a new page
      if (y > 720) {
        doc.addPage();
        y = 50;

        // Redraw header on new page
        doc.fontSize(11).font("Helvetica-Bold");
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
        doc.font("Helvetica").fontSize(10);
      }

      drawTableRow(
        doc,
        y,
        String(i + 1),
        new Date(exp.date).toLocaleDateString("en-IN"),
        exp.description || "—",
        exp.category?.name || "N/A",
        `₹${exp.amount.toFixed(2)}`
      );

      totalAmount += exp.amount;
      y += 25;
    });

    // SUMMARY
    if (expenses.length > 0) {
      y += 10;
      drawLine(doc, y);
      y += 10;

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(`Total Expenses: ₹${totalAmount.toFixed(2)}`, 350, y, {
          width: 200,
          align: "right",
        });

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Total Transactions: ${expenses.length}`, 350, y + 20, {
          width: 200,
          align: "right",
        });
    } else {
      doc
        .fontSize(12)
        .font("Helvetica")
        .text("No expenses found for the selected period.", {
          align: "center",
        });
    }

    // Add footer with page numbers
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .font("Helvetica")
        .text(`Page ${i + 1} of ${pages.count}`, 0, doc.page.height - 50, {
          align: "center",
        });
    }

    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);

    // Check if headers already sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "PDF generation failed",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }
};

// ------------------------------------------------
// Helper: Draw Table Row
// ------------------------------------------------
function drawTableRow(doc, y, col1, col2, col3, col4, col5) {
  const colX = {
    num: 40,
    date: 70,
    desc: 150,
    category: 340,
    amount: 470,
  };

  doc
    .text(col1, colX.num, y, { width: 25 }) // #
    .text(col2, colX.date, y, { width: 75 }) // Date
    .text(col3, colX.desc, y, { width: 180, ellipsis: true }) // Description
    .text(col4, colX.category, y, { width: 120, ellipsis: true }) // Category
    .text(col5, colX.amount, y, { width: 80, align: "right" }); // Amount
}

// ------------------------------------------------
// Helper: Draw Line
// ------------------------------------------------
function drawLine(doc, y) {
  doc
    .strokeColor("#cccccc")
    .lineWidth(0.5)
    .moveTo(40, y)
    .lineTo(550, y)
    .stroke()
    .strokeColor("#000000"); // Reset color
}
