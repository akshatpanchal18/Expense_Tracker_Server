import { Category } from "../models/category.model.js";

const CATEGORY_DATA = [
  { code: "transport", name: "Transport" },
  { code: "household", name: "Home" },
  { code: "food", name: "Food & Dining" },
  { code: "shopping", name: "Shopping" },
  { code: "bills", name: "Bills & Utilities" },
  { code: "health", name: "Health & Fitness" },
  { code: "education", name: "Education" },
  { code: "entertainment", name: "Entertainment" },
  { code: "travel", name: "Travel" },
  { code: "other", name: "Other" },
];

export async function seedCategories() {
  for (const item of CATEGORY_DATA) {
    let category = await Category.findOne({ code: item.code });

    if (!category) {
      // Create new category → this triggers pre("save") and generates id
      category = new Category(item);
    } else {
      // Update name only (id is already set)
      category.name = item.name;
    }

    await category.save(); // <-- This is what triggers pre("save")
  }

  console.log("✅ Categories synced successfully");
}
