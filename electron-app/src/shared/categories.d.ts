import { Category } from './types';
export type ComparableCategory = Pick<Category, 'name' | 'description' | 'color' | 'isProductive'>;
export declare const defaultCategoriesData: (userId: string) => {
    userId: string;
    name: string;
    description: string;
    color: string;
    isProductive: boolean;
}[];
export declare const defaultComparableCategories: ComparableCategory[];
