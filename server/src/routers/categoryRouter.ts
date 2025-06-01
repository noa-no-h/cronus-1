import { TRPCError } from '@trpc/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { CategoryModel, defaultCategoriesData } from '../models/category';
import { publicProcedure, router } from '../trpc'; // Changed to publicProcedure
import { verifyToken } from './auth'; // Added import for verifyToken

export const categoryRouter = router({
  createCategory: publicProcedure // Changed to publicProcedure
    .input(
      z.object({
        token: z.string(), // Added token to input
        name: z.string().min(1, 'Name is required'),
        description: z.string().optional(),
        color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format (e.g., #FF5733)'),
        isProductive: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      // ctx removed, input used directly
      const decodedToken = verifyToken(input.token);
      const userId = decodedToken.userId;
      const { name, description, color, isProductive } = input;

      const existingCategory = await CategoryModel.findOne({ userId, name });
      if (existingCategory) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A category with this name already exists.',
        });
      }

      const category = new CategoryModel({
        userId,
        name,
        description,
        color,
        isProductive,
      });
      await category.save();
      return category.toJSON();
    }),

  getCategories: publicProcedure // Changed to publicProcedure
    .input(z.object({ token: z.string() })) // Added token to input
    .query(async ({ input }) => {
      // ctx removed, input used directly
      const decodedToken = verifyToken(input.token);
      const userId = decodedToken.userId;
      const categories = await CategoryModel.find({ userId }).sort({ createdAt: -1 });
      return categories.map((cat) => cat.toJSON());
    }),

  updateCategory: publicProcedure // Changed to publicProcedure
    .input(
      z.object({
        token: z.string(), // Added token to input
        id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
          message: 'Invalid Object ID',
        }),
        name: z.string().min(1, 'Name is required').optional(),
        description: z.string().optional(),
        color: z
          .string()
          .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
          .optional(),
        isProductive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // ctx removed, input used directly
      const decodedToken = verifyToken(input.token);
      const userId = decodedToken.userId;
      const { id, ...updateData } = input;

      // Remove token from updateData if it exists to prevent trying to save it to the DB
      const { token, ...restOfUpdateData } = updateData as any;

      const category = await CategoryModel.findOne({ _id: id, userId });

      if (!category) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' });
      }

      // Check for name conflict if name is being changed
      if (restOfUpdateData.name && restOfUpdateData.name !== category.name) {
        const existingCategory = await CategoryModel.findOne({
          userId,
          name: restOfUpdateData.name,
          _id: { $ne: id },
        });
        if (existingCategory) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Another category with this name already exists.',
          });
        }
      }

      Object.assign(category, restOfUpdateData);
      await category.save();
      return category.toJSON();
    }),

  deleteCategory: publicProcedure // Changed to publicProcedure
    .input(
      z.object({
        token: z.string(), // Added token to input
        id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
          message: 'Invalid Object ID',
        }),
      })
    )
    .mutation(async ({ input }) => {
      // ctx removed, input used directly
      const decodedToken = verifyToken(input.token);
      const userId = decodedToken.userId;
      const { id } = input;

      const category = await CategoryModel.findOneAndDelete({ _id: id, userId });

      if (!category) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' });
      }
      return { success: true, id };
    }),

  resetToDefault: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const decodedToken = verifyToken(input.token);
      const userId = decodedToken.userId;

      // Delete all existing categories for the user
      await CategoryModel.deleteMany({ userId });

      const createdCategories = await CategoryModel.insertMany(defaultCategoriesData(userId));
      return createdCategories.map((cat) => cat.toJSON());
    }),
});

export type CategoryRouter = typeof categoryRouter;
