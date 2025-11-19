import { Budget } from "../models/budget.model.js";
import { Expense } from "../models/expense.model.js";
import { generateExpensesPDF } from "../services/genratePdf.js";
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
    const { start, end } = req.query;
    const user = req.user;

    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const expenses = await Expense.find({
      user: user._id,
      date: { $gte: startDate, $lte: endDate },
    }).populate("category");

    const pdfBuffer = await generateExpensesPDF(expenses, startDate, endDate);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=expenses_${start}_${end}.pdf`
    );

    // res.send(pdfBuffer);
    const base64 = pdfBuffer.toString("base64");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=expenses_${start}_${end}.pdf`
    );
    res.setHeader("Content-Transfer-Encoding", "base64");

    res.send(base64);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "PDF generation failed" });
  }
};
