import { defaultCategoriesData } from 'shared/categories';
import { CategoryModel } from '../../models/category';

export const resetCategoriesToDefault = async (userId: string) => {
  // 1. Delete all non-default categories
  await CategoryModel.deleteMany({ userId, isDefault: { $ne: true } });

  // 2. Check for existing default categories
  const existingDefaults = await CategoryModel.find({ userId, isDefault: true });

  const hasProductiveDefault = existingDefaults.some((c) => c.isProductive);
  const hasUnproductiveDefault = existingDefaults.some((c) => !c.isProductive);
  const allDefaults = defaultCategoriesData(userId);

  // 3. Add missing default categories
  const categoriesToAdd: (typeof allDefaults)[0][] = [];
  if (!hasProductiveDefault) {
    const productiveDefault = allDefaults.find((d) => d.isProductive);
    if (productiveDefault) categoriesToAdd.push(productiveDefault);
  }
  if (!hasUnproductiveDefault) {
    const unproductiveDefault = allDefaults.find((d) => !d.isProductive);
    if (unproductiveDefault) categoriesToAdd.push(unproductiveDefault);
  }

  if (categoriesToAdd.length > 0) {
    await CategoryModel.insertMany(categoriesToAdd);
  }

  // 4. Return all categories for the user
  const finalCategories = await CategoryModel.find({ userId });
  return finalCategories.map((cat) => cat.toJSON());
};
